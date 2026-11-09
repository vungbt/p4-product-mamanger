/**
 * Sinh openapi.yaml của một Express API trong monorepo từ chính source của app đó.
 *
 * - Route, auth, permission, query: đọc từ Express router đã build (dist) và middleware thật.
 * - Request/response schema: suy ra bằng TypeScript checker từ handler, validator và service.
 * - Summary, mô tả và phần không suy ra được: khai báo trong metadata của app.
 *
 * Mặc định chạy cho @p4/api (./p4.config.mjs). App khác truyền `--config <file>` (đường dẫn tính
 * từ thư mục hiện tại), file export default cùng dạng p4.config.mjs.
 *
 * Dùng: pnpm --filter @p4/api openapi:generate
 *       pnpm --filter @p4/api openapi:check    (fail nếu spec lệch source)
 *       thêm --report để in các operation chưa có schema đầy đủ.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';
import YAML from 'yaml';

const args = process.argv.slice(2);
const configIndex = args.indexOf('--config');
const configUrl =
  configIndex >= 0 && args[configIndex + 1]
    ? pathToFileURL(path.resolve(args[configIndex + 1]))
    : new URL('./p4.config.mjs', import.meta.url);
const { default: config } = await import(configUrl);
const { API_DESCRIPTION, OPERATIONS, OVERRIDES, TAG_DESCRIPTIONS } = config.metadata;

const API_ROOT = config.appRoot;
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const SPEC_PATH = path.join(API_ROOT, 'openapi.yaml');
/** Một file, hoặc { file, names } để chỉ lấy một số type (tránh trùng tên giữa các app). */
const CONTRACTS = config.contractFiles.map((entry) =>
  typeof entry === 'string'
    ? { file: path.join(REPO_ROOT, entry) }
    : { file: path.join(REPO_ROOT, entry.file), names: new Set(entry.names) },
);
const CONTRACT_FILES = CONTRACTS.map((entry) => entry.file);
const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete']);
const WRITE_METHODS = new Set(['post', 'put', 'patch', 'delete']);
const RAW_RESPONSE_METHODS = new Set(['download', 'sendFile', 'send', 'end', 'redirect']);

const flags = new Set(args);

process.chdir(API_ROOT);

const configFile = ts.readConfigFile('tsconfig.typecheck.json', ts.sys.readFile);
const parsedConfig = ts.parseJsonConfigFileContent(configFile.config, ts.sys, API_ROOT);
const program = ts.createProgram([...parsedConfig.fileNames, ...CONTRACT_FILES], {
  ...parsedConfig.options,
  noEmit: true,
});
const checker = program.getTypeChecker();

/* -------------------------------------------------------------------------- */
/* Type -> JSON schema                                                         */
/* -------------------------------------------------------------------------- */

const namedTypes = new Map();

for (const { file, names } of CONTRACTS) {
  const source = program.getSourceFile(file);

  for (const node of source?.statements ?? []) {
    const exported = node.modifiers?.some((mod) => mod.kind === ts.SyntaxKind.ExportKeyword);
    const named = ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node);
    const wanted = !names || (named && names.has(node.name.text));

    if (exported && named && wanted && !node.typeParameters?.length)
      namedTypes.set(node.name.text, node);
  }
}

const usedSchemas = new Set();
const ref = (name) => {
  usedSchemas.add(name);
  return { $ref: `#/components/schemas/${name}` };
};

function isModelType(type) {
  const bases = type.isClass?.() ? checker.getBaseTypes(type) : [];
  return bases.some((base) => base.getSymbol()?.name === 'Model' || isModelType(base));
}

function nullable(schema) {
  if (typeof schema.type === 'string') {
    const copy = { ...schema, type: [schema.type, 'null'] };

    if (copy.enum) copy.enum = [...copy.enum, null];
    return copy;
  }

  return { anyOf: [schema, { type: 'null' }] };
}

function namedSchemaFor(type) {
  const name = type.aliasSymbol?.name ?? type.getSymbol()?.name;

  return name && namedTypes.has(name) && !type.aliasTypeArguments?.length ? name : null;
}

function typeSchema(type, seen = new Set(), inlineRoot = false) {
  const named = inlineRoot ? null : namedSchemaFor(type);

  if (named) return ref(named);
  if (seen.has(type) || seen.size > 10) return {};

  const next = new Set(seen).add(type);

  if (type.flags & ts.TypeFlags.StringLiteral) return { type: 'string', enum: [type.value] };
  if (type.flags & ts.TypeFlags.NumberLiteral) return { type: 'number', enum: [type.value] };
  if (type.flags & ts.TypeFlags.StringLike) return { type: 'string' };
  if (type.flags & ts.TypeFlags.NumberLike) return { type: 'number' };
  if (type.flags & ts.TypeFlags.BooleanLike) return { type: 'boolean' };
  if (type.flags & (ts.TypeFlags.Null | ts.TypeFlags.Undefined | ts.TypeFlags.Void))
    return { type: 'null' };
  if (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) return {};

  if (type.isUnion()) {
    const members = type.types.filter((item) => !(item.flags & ts.TypeFlags.Undefined));
    const withoutNull = members.filter((item) => !(item.flags & ts.TypeFlags.Null));
    const hasNull = withoutNull.length !== members.length;
    let schema;

    if (withoutNull.every((item) => item.flags & ts.TypeFlags.BooleanLike)) {
      schema = { type: 'boolean' };
    } else if (withoutNull.every((item) => item.isStringLiteral())) {
      schema = { type: 'string', enum: withoutNull.map((item) => item.value).sort() };
    } else if (withoutNull.length === 1) {
      schema = typeSchema(withoutNull[0], next);
    } else {
      schema = { anyOf: withoutNull.map((item) => typeSchema(item, next)) };
    }

    return hasNull ? nullable(schema) : schema;
  }

  if (checker.isArrayType(type) || checker.isTupleType(type)) {
    const [element] = checker.getTypeArguments(type);

    return { type: 'array', items: element ? typeSchema(element, next) : {} };
  }

  if (type.getSymbol()?.name === 'Date') return { type: 'string', format: 'date-time' };
  // Trả nguyên Sequelize model là chưa có DTO rõ ràng: để trống thay vì lộ field nội bộ của ORM.
  if (isModelType(type)) return {};
  if (type.getCallSignatures().length) return {};

  const properties = {};
  const required = [];

  for (const property of type.getProperties()) {
    const name = property.getName();
    const location = property.valueDeclaration ?? property.declarations?.[0];

    if (name.startsWith('__') || !location) continue;

    const value = checker.getTypeOfSymbolAtLocation(property, location);

    if (value.getCallSignatures().length) continue;

    properties[name] = typeSchema(value, next);

    if (!(property.flags & ts.SymbolFlags.Optional)) required.push(name);
  }

  const index = checker.getIndexTypeOfType(type, ts.IndexKind.String);

  if (!Object.keys(properties).length && !index) return {};

  return {
    type: 'object',
    ...(Object.keys(properties).length ? { properties } : {}),
    ...(required.length ? { required } : {}),
    ...(index ? { additionalProperties: typeSchema(index, next) } : {}),
  };
}

function isEmptySchema(schema) {
  return !schema || Object.keys(schema).length === 0;
}

/** Schema "rỗng về nghĩa": không có field nào được mô tả ở cấp đầu. */
function isOpaqueSchema(schema) {
  if (isEmptySchema(schema)) return true;
  if (schema.type === 'array') return isOpaqueSchema(schema.items);
  if (schema.type === 'object') return !schema.properties && !schema.additionalProperties;
  return false;
}

/* -------------------------------------------------------------------------- */
/* Đọc handler bằng AST                                                        */
/* -------------------------------------------------------------------------- */

function resolveDeclaration(node) {
  let symbol = checker.getSymbolAtLocation(ts.isPropertyAccessExpression(node) ? node.name : node);

  if (symbol && symbol.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol);

  return symbol?.valueDeclaration ?? symbol?.declarations?.[0];
}

function functionOf(declaration) {
  if (!declaration) return null;
  if (ts.isFunctionLike(declaration)) return declaration;

  if (ts.isVariableDeclaration(declaration) && declaration.initializer) {
    const init = declaration.initializer;

    if (ts.isFunctionLike(init)) return init;
    if (ts.isCallExpression(init)) {
      const handler = init.arguments.find((arg) => ts.isFunctionLike(arg));

      if (handler) return handler;
    }
  }

  return null;
}

const hasProperty = (type, name) => Boolean(type.getProperty?.(name));
const isBodyHelper = (type) => hasProperty(type, 'optionalText') && hasProperty(type, 'strings');
const isRequest = (type) => hasProperty(type, 'body') && hasProperty(type, 'params');

function numberArg(node) {
  if (!node) return undefined;
  if (ts.isNumericLiteral(node)) return Number(node.text.replaceAll('_', ''));
  if (
    ts.isPrefixUnaryExpression(node) &&
    node.operator === ts.SyntaxKind.MinusToken &&
    ts.isNumericLiteral(node.operand)
  )
    return -Number(node.operand.text);

  const type = checker.getTypeAtLocation(node);

  return type.isNumberLiteral?.() ? type.value : undefined;
}

/** Handler dùng chung cho nhiều method: `method === 'patch' ? ... : ...`. */
function methodBranch(condition, child, whenTrue, routeMethod) {
  const match = condition.getText().match(/^method === '(\w+)'$/);

  if (!match) return null;

  return (match[1] === routeMethod) === (child === whenTrue) ? 'applies' : 'skip';
}

/** 'required' | 'optional' | 'skip': field có áp dụng và có bắt buộc với method của route không. */
function fieldPresence(node, stop, routeMethod) {
  let presence = 'required';
  let child = node;

  for (let current = node.parent; current && current !== stop; current = current.parent) {
    const branch =
      ts.isConditionalExpression(current) && child !== current.condition
        ? methodBranch(current.condition, child, current.whenTrue, routeMethod)
        : ts.isIfStatement(current) && child !== current.expression
          ? methodBranch(current.expression, child, current.thenStatement, routeMethod)
          : null;

    if (branch === 'skip') return 'skip';

    if (branch === null && isConditionalNode(current)) presence = 'optional';

    child = current;
  }

  return presence;
}

function isConditionalNode(current) {
  return (
    ts.isConditionalExpression(current) ||
    ts.isIfStatement(current) ||
    (ts.isBinaryExpression(current) &&
      [
        ts.SyntaxKind.QuestionQuestionToken,
        ts.SyntaxKind.BarBarToken,
        ts.SyntaxKind.AmpersandAmpersandToken,
      ].includes(current.operatorToken.kind))
  );
}

/** `body.data.x === undefined` chỉ là phép kiểm tra, không phải chỗ đọc giá trị. */
function isPresenceCheck(node) {
  const parent = node.parent;

  return (
    ts.isBinaryExpression(parent) &&
    [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken].includes(
      parent.operatorToken.kind,
    ) &&
    ['undefined', 'null'].includes((parent.left === node ? parent.right : parent.left).getText())
  );
}

/** `cartLines(body.data.items)`: kiểu thật của field là kiểu trả về của hàm parse nó. */
function parsedFieldSchema(node) {
  const parent = node.parent;

  if (!ts.isCallExpression(parent) || !parent.arguments.includes(node)) return {};

  return typeSchema(checker.getTypeAtLocation(parent));
}

function bodyHelperField(call) {
  const method = call.expression.name.text;
  const [, second, third] = call.arguments;

  if (method === 'integer') {
    const minimum = numberArg(second) ?? 0;
    const maximum = numberArg(third);

    return { type: 'integer', minimum, ...(maximum === undefined ? {} : { maximum }) };
  }
  if (method === 'boolean') return { type: 'boolean' };
  if (method === 'json') return {};
  if (method === 'strings') {
    return {
      type: 'array',
      maxItems: numberArg(second) ?? 20,
      items: { type: 'string', minLength: 1, maxLength: numberArg(third) ?? 255 },
    };
  }
  if (method === 'enum') {
    const type = checker.getTypeAtLocation(call);
    const values = type.isUnion()
      ? type.types.filter((item) => item.isStringLiteral()).map((item) => item.value)
      : type.isStringLiteral?.()
        ? [type.value]
        : [];

    return { type: 'string', ...(values.length ? { enum: [...values].sort() } : {}) };
  }

  return {
    type: 'string',
    ...(method === 'text' ? { minLength: 1 } : {}),
    maxLength: numberArg(second) ?? 255,
  };
}

const BODY_HELPER_METHODS = new Set([
  'text',
  'optionalText',
  'integer',
  'strings',
  'boolean',
  'enum',
  'json',
]);

function emptyInput(method) {
  return {
    method,
    fields: new Map(),
    typed: [],
    queries: new Map(),
    headers: new Set(),
    readsBody: false,
    multipart: false,
    rawResponse: false,
    replies: [],
  };
}

function addQuery(input, name, schema, required = false) {
  const previous = input.queries.get(name);

  // Rule của validator chi tiết hơn chỗ handler đọc lại query.
  if (!previous || required) input.queries.set(name, { schema, required });
}

function addField(input, name, schema, required) {
  const previous = input.fields.get(name);

  if (!previous) {
    input.fields.set(name, { schema, required });
    return;
  }

  // Cùng một field đọc nhiều nhánh: giữ schema giàu thông tin hơn, required nếu có nhánh bắt buộc.
  if (isEmptySchema(previous.schema)) previous.schema = schema;
  previous.required ||= required;
}

/** Duyệt handler và các helper nhận req/body, gom field body, query, header và kiểu response. */
function collectFromFunction(fn, input, visited = new Set()) {
  if (!fn?.body || visited.has(fn)) return;

  visited.add(fn);

  const walk = (node) => {
    if (ts.isCallExpression(node)) {
      const callee = node.expression;

      if (ts.isPropertyAccessExpression(callee)) {
        const ownerType = checker.getTypeAtLocation(callee.expression);
        const method = callee.name.text;
        const first = node.arguments[0];

        if (
          isBodyHelper(ownerType) &&
          BODY_HELPER_METHODS.has(method) &&
          first &&
          ts.isStringLiteralLike(first)
        ) {
          const presence = fieldPresence(node, fn.body, input.method);

          input.readsBody = true;

          if (presence !== 'skip') {
            addField(
              input,
              first.text,
              bodyHelperField(node),
              method !== 'optionalText' && presence === 'required',
            );
          }
        }

        if (isRequest(ownerType) && method === 'header' && first && ts.isStringLiteralLike(first))
          input.headers.add(first.text);

        if (method === 'jsonApi') input.replies.push(node);
        if (RAW_RESPONSE_METHODS.has(method) && callee.expression.getText().match(/^res\b/))
          input.rawResponse = true;
      }

      if (
        ts.isIdentifier(callee) &&
        ['queryText', 'queryNumber'].includes(callee.text) &&
        node.arguments[1] &&
        ts.isStringLiteralLike(node.arguments[1])
      ) {
        addQuery(
          input,
          node.arguments[1].text,
          callee.text === 'queryNumber' ? { type: 'number' } : { type: 'string' },
        );
      }

      // Đi vào helper nhận req hoặc body helper làm tham số.
      const passesRequest = node.arguments.some((arg) => {
        const type = checker.getTypeAtLocation(arg);

        return isRequest(type) || isBodyHelper(type);
      });

      if (passesRequest && !(ts.isIdentifier(callee) && callee.text === 'requestBody')) {
        collectFromFunction(functionOf(resolveDeclaration(callee)), input, visited);
      }
    }

    if (ts.isPropertyAccessExpression(node)) {
      const owner = node.expression;

      // body.data.field
      if (
        ts.isPropertyAccessExpression(owner) &&
        owner.name.text === 'data' &&
        isBodyHelper(checker.getTypeAtLocation(owner.expression))
      ) {
        input.readsBody = true;

        if (!isPresenceCheck(node)) addField(input, node.name.text, parsedFieldSchema(node), false);
      }

      if (node.name.text === 'body' && isRequest(checker.getTypeAtLocation(owner))) {
        input.readsBody = true;
        collectReqBody(node, input);
      }

      if (node.name.text === 'file' && isRequest(checker.getTypeAtLocation(owner)))
        input.multipart = true;

      // req.query.field
      if (
        ts.isPropertyAccessExpression(owner) &&
        owner.name.text === 'query' &&
        isRequest(checker.getTypeAtLocation(owner.expression))
      )
        addQuery(input, node.name.text, { type: 'string' });
    }

    ts.forEachChild(node, walk);
  };

  walk(fn.body);
}

/** req.body: lấy kiểu từ `as X`, tham số service nhận vào hoặc destructuring. */
function collectReqBody(node, input) {
  let outer = node;

  while (
    ts.isParenthesizedExpression(outer.parent) ||
    (ts.isBinaryExpression(outer.parent) &&
      outer.parent.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken)
  )
    outer = outer.parent;

  if (ts.isAsExpression(outer.parent)) {
    input.typed.push(checker.getTypeAtLocation(outer.parent));
    return;
  }

  const contextual = checker.getContextualType(node);

  if (contextual && !(contextual.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)))
    input.typed.push(contextual);
}

const VALIDATOR_TYPES = [
  [/integer/, 'integer'],
  [/numeric/, 'number'],
  [/boolean/, 'boolean'],
  [/array/, 'array'],
  [/email/, 'string'],
];

function ruleSchema(rule) {
  const type = VALIDATOR_TYPES.find(([pattern]) => pattern.test(rule))?.[1] ?? 'string';
  const schema = { type };
  const enumeration = rule.match(/(?:^|\|)in:([^|]+)/);
  const min = rule.match(/(?:^|\|)min:(\d+)/);
  const max = rule.match(/(?:^|\|)max:(\d+)/);

  if (enumeration) schema.enum = enumeration[1].split(',').sort();
  if (/email/.test(rule)) schema.format = 'email';
  if (min) {
    const key = { string: 'minLength', array: 'minItems' }[type] ?? 'minimum';

    schema[key] = Number(min[1]);
  }
  if (max) {
    const key = { string: 'maxLength', array: 'maxItems' }[type] ?? 'maximum';

    schema[key] = Number(max[1]);
  }

  return schema;
}

/** validate({ rules }) gắn trên route: đọc trực tiếp object rules trong source. */
function collectValidator(arg, input) {
  const declaration = ts.isIdentifier(arg) ? resolveDeclaration(arg) : null;
  const call = ts.isCallExpression(arg)
    ? arg
    : declaration && ts.isVariableDeclaration(declaration)
      ? declaration.initializer
      : null;

  if (!call || !ts.isCallExpression(call) || call.expression.getText() !== 'validate') return;

  const config = call.arguments[0];

  if (!config || !ts.isObjectLiteralExpression(config)) return;

  const property = (name) =>
    config.properties.find((item) => item.name?.getText().replace(/['"]/g, '') === name);
  const source = property('source')?.initializer?.getText().replace(/['"]/g, '') ?? 'body';
  const rules = property('rules')?.initializer;

  if (!rules || !ts.isObjectLiteralExpression(rules)) return;

  for (const item of rules.properties) {
    if (!ts.isPropertyAssignment(item) || !ts.isStringLiteralLike(item.initializer)) continue;

    const name = item.name.getText().replace(/['"]/g, '');
    const rule = item.initializer.text;

    if (source === 'query') {
      addQuery(input, name, ruleSchema(rule), /required/.test(rule));
      continue;
    }

    input.readsBody = true;

    if (!name.includes('.')) addField(input, name, ruleSchema(rule), /required/.test(rule));
  }
}

/* -------------------------------------------------------------------------- */
/* Router call sites                                                           */
/* -------------------------------------------------------------------------- */

/** Các chuỗi literal trong `for (const x of [...])` bao quanh một route khai báo bằng template. */
function enclosingLoopStrings(node) {
  const values = new Set();
  const collect = (current) => {
    if (ts.isStringLiteralLike(current)) values.add(current.text);
    ts.forEachChild(current, collect);
  };

  for (let current = node.parent; current; current = current.parent) {
    if (!ts.isForOfStatement(current)) continue;

    const iterable = current.expression;
    const declaration = ts.isIdentifier(iterable) ? resolveDeclaration(iterable) : null;

    collect(declaration?.initializer ?? iterable);
  }

  return values;
}

function matchesTemplate(matcher, routePath) {
  const match = routePath.match(matcher.regex);

  if (!match) return false;
  if (!matcher.loopValues.size) return true;

  return match.slice(1).every((value) => matcher.loopValues.has(value));
}

function pathMatcher(node) {
  if (ts.isStringLiteralLike(node)) return [{ text: node.text, exact: true }];
  if (ts.isConditionalExpression(node)) {
    return [...(pathMatcher(node.whenTrue) ?? []), ...(pathMatcher(node.whenFalse) ?? [])];
  }
  if (!ts.isTemplateExpression(node)) return null;

  const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const loopValues = enclosingLoopStrings(node);
  // Biết giá trị vòng lặp thì cho phép chứa "/" rồi đối chiếu lại; không biết thì chỉ khớp 1 segment.
  const capture = loopValues.size ? '(.+?)' : '([^/]+)';
  const pattern =
    escapeRegex(node.head.text) +
    node.templateSpans.map((span) => `${capture}${escapeRegex(span.literal.text)}`).join('');

  return [{ regex: new RegExp(`^${pattern}$`), exact: false, loopValues }];
}

function routerSites(sourceFile) {
  const sites = [];

  const walk = (node) => {
    if (ts.isCallExpression(node) && node.arguments[0]) {
      const callee = node.expression;
      const isRouter = (owner) => /router$/i.test(owner.getText());
      // router.get(...) hoặc router[method](...) trong vòng lặp.
      const methods =
        ts.isPropertyAccessExpression(callee) &&
        HTTP_METHODS.has(callee.name.text) &&
        isRouter(callee.expression)
          ? [callee.name.text]
          : ts.isElementAccessExpression(callee) && isRouter(callee.expression)
            ? [...HTTP_METHODS]
            : [];

      for (const method of methods) {
        for (const matcher of pathMatcher(node.arguments[0]) ?? [])
          sites.push({ method, matcher, call: node });
      }
    }

    ts.forEachChild(node, walk);
  };

  walk(sourceFile);

  return sites;
}

function findSite(sites, method, routePath) {
  const candidates = sites.filter((site) => site.method === method);

  return (
    candidates.find((site) => site.matcher.exact && site.matcher.text === routePath) ??
    candidates.find((site) => !site.matcher.exact && matchesTemplate(site.matcher, routePath))
  );
}

function unwrapPromise(type) {
  return checker.getAwaitedType(type) ?? type;
}

function propertyType(type, name, at) {
  const property = type.getProperty?.(name);

  return property ? checker.getTypeOfSymbolAtLocation(property, at) : null;
}

const STATUS_NAMES = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
};

function statusOf(node) {
  if (!node) return undefined;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (ts.isPropertyAccessExpression(node)) return STATUS_NAMES[node.name.text];
  return undefined;
}

/** Trả về { schema, list, status, raw } cho route từ handler cuối. */
function analyzeHandler(site, input) {
  const args = site.call.arguments.slice(1);
  const last = args.at(-1);

  for (const arg of args) collectValidator(arg, input);

  if (ts.isCallExpression(last) && ts.isIdentifier(last.expression)) {
    const wrapper = last.expression.text;
    const [fn, statusArg] = last.arguments;

    if (
      (wrapper === 'apiHandler' ||
        wrapper === 'listHandler' ||
        wrapper === 'optionalListHandler') &&
      fn
    ) {
      const handlerFn = ts.isFunctionLike(fn) ? fn : functionOf(resolveDeclaration(fn));

      if (handlerFn) collectFromFunction(handlerFn, input);

      const signature = checker.getTypeAtLocation(fn).getCallSignatures()[0];
      const result = signature ? unwrapPromise(signature.getReturnType()) : null;

      if (wrapper === 'listHandler' || wrapper === 'optionalListHandler') {
        const data = result && propertyType(result, 'data', fn);

        return { type: data, list: true, status: 200, raw: input.rawResponse };
      }

      return { type: result, list: false, status: numberArg(statusArg) ?? 200 };
    }
  }

  const fn = ts.isFunctionLike(last) ? last : functionOf(resolveDeclaration(last));

  if (!fn) return { type: null, list: false, status: undefined };

  collectFromFunction(fn, input);

  const reply = input.replies.at(-1);

  if (!reply) return { type: null, list: false, status: undefined, raw: input.rawResponse };

  const payload = checker.getTypeAtLocation(reply.arguments[1]);

  return {
    type: propertyType(payload, 'data', reply) ?? null,
    list: Boolean(propertyType(payload, 'meta', reply)),
    status: statusOf(reply.arguments[0]),
    raw: input.rawResponse,
  };
}

/* -------------------------------------------------------------------------- */
/* Route runtime                                                               */
/* -------------------------------------------------------------------------- */

const indexSource = await readFile('src/modules/index.ts', 'utf8');
const imports = new Map(
  [...indexSource.matchAll(/import (\w+) from '\.\/([^']+)\.js';/g)].map((m) => [m[1], m[2]]),
);
const routes = [];

for (const mount of indexSource.matchAll(/apiRouter\.use\((?:'([^']+)',\s*)?(\w+)\);/g)) {
  const [, prefix = '', name] = mount;
  const relative = imports.get(name);

  if (!relative) continue;

  const module = await import(pathToFileURL(path.join(API_ROOT, 'dist/modules', `${relative}.js`)));
  const sourcePath = path.join(API_ROOT, 'src/modules', `${relative}.ts`);
  const sourceFile = program.getSourceFile(sourcePath);
  const sites = routerSites(sourceFile);
  const guards = [];

  for (const layer of module.default.stack) {
    if (!layer.route) {
      if (layer.handle?.name === 'authRequired') guards.push(layer);
      continue;
    }

    for (const method of Object.keys(layer.route.methods)) {
      if (!layer.route.methods[method]) continue;

      routes.push({
        method,
        routePath: layer.route.path,
        prefix,
        tag: relative.split('/')[0],
        handlers: layer.route.stack.map((item) => item.handle.originalHandler ?? item.handle),
        auditPolicy: layer.route.stack.find((item) => item.handle.auditPolicy)?.handle.auditPolicy,
        guarded: guards.some((guard) => guard.regexp.test(layer.route.path)),
        site: findSite(sites, method, layer.route.path),
      });
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Build document                                                              */
/* -------------------------------------------------------------------------- */

/** `list`: true cho danh sách phân trang; 'legacy' khi chỉ có meta nếu client gửi tham số list. */
const envelope = (schema, list = false) => ({
  type: 'object',
  properties: {
    data: list && schema.type !== 'array' ? { type: 'array', items: schema } : schema,
    message: { type: 'string' },
    ...(list ? { meta: ref('PaginationMeta') } : {}),
  },
  required: list === true ? ['data', 'meta'] : ['data'],
});

const openPathOf = (route) => {
  const joined = `/api${route.prefix}${route.routePath}`.replace(/\/+$/, '');

  return joined.replace(/:(\w+)/g, '{$1}');
};

const report = [];
const paths = {};
const tagNames = new Set();
const seenKeys = new Set();

function applyOperation({ key, tag, openPath, method, spec }) {
  const meta = OPERATIONS[key];

  if (!meta) report.push(`${key}: thiếu summary trong metadata`);

  const override = OVERRIDES[key] ?? {};

  tagNames.add(tag);
  seenKeys.add(key);
  paths[openPath] ??= {};
  paths[openPath][method] = {
    tags: [tag],
    operationId: `${method}_${openPath.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '')}`,
    summary: meta?.[0] ?? key,
    ...spec,
    description: [meta?.[1], spec.description].filter(Boolean).join('\n\n'),
    ...(override.requestBody === null
      ? { requestBody: undefined }
      : override.requestBody
        ? { requestBody: resolveRefs(override.requestBody) }
        : {}),
  };

  if (override.response !== undefined) {
    const status = Object.keys(paths[openPath][method].responses).find((code) => /^2/.test(code));
    const content = override.response === null ? undefined : resolveRefs(override.response);

    paths[openPath][method].responses[status] = {
      description: 'Thành công',
      ...(content
        ? {
            content: {
              'application/json': { schema: envelope(content, Boolean(override.list)) },
            },
          }
        : {}),
    };
  }

  if (override.responseFields) {
    const ok = Object.entries(paths[openPath][method].responses).find(([code]) =>
      /^2/.test(code),
    )?.[1];
    const data = ok?.content?.['application/json']?.schema?.properties?.data;

    data.properties = { ...data.properties, ...resolveRefs(override.responseFields) };
  }

  if (override.parameters) {
    paths[openPath][method].parameters = [
      ...(paths[openPath][method].parameters ?? []),
      ...override.parameters,
    ];
  }

  if (paths[openPath][method].requestBody === undefined) delete paths[openPath][method].requestBody;
}

/** metadata dùng { ref: 'Name' }; chuyển thành $ref và đánh dấu schema được dùng. */
function resolveRefs(value) {
  if (Array.isArray(value)) return value.map(resolveRefs);
  if (!value || typeof value !== 'object') return value;
  if (typeof value.ref === 'string' && Object.keys(value).length === 1) return ref(value.ref);

  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolveRefs(v)]));
}

function errorResponses({ secured, hasPathParams, hasInput, method }) {
  return {
    ...(hasInput ? { 400: { $ref: '#/components/responses/ValidationError' } } : {}),
    ...(secured
      ? {
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        }
      : {}),
    ...(hasPathParams ? { 404: { $ref: '#/components/responses/NotFound' } } : {}),
    ...(WRITE_METHODS.has(method) ? { 409: { $ref: '#/components/responses/Conflict' } } : {}),
    429: { $ref: '#/components/responses/RateLimited' },
  };
}

function querySpecParameters(query) {
  const parameters = [
    {
      name: 'page',
      in: 'query',
      schema: { type: 'integer', minimum: 1, default: 1 },
    },
    {
      name: 'pageSize',
      in: 'query',
      schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
    },
    {
      name: 'sortBy',
      in: 'query',
      schema: { type: 'string', enum: query.sortFields, default: query.defaultSort },
    },
    {
      name: 'sortOrder',
      in: 'query',
      schema: { type: 'string', enum: ['asc', 'desc'], default: query.defaultOrder ?? 'asc' },
    },
    { name: 'q', in: 'query', schema: { type: 'string', maxLength: 255 } },
  ];

  for (const [name, rule] of Object.entries(query.rules({}))) {
    if (!parameters.some((item) => item.name === name))
      parameters.push({ name, in: 'query', schema: ruleSchema(rule) });
  }

  return parameters;
}

for (const route of routes) {
  const openPath = openPathOf(route);
  const key = `${route.method.toUpperCase()} ${openPath}`;
  const input = emptyInput(route.method);
  const analysis = route.site
    ? analyzeHandler(route.site, input)
    : { type: null, list: false, status: undefined };

  if (!route.site) report.push(`${key}: không tìm thấy call site trong source`);

  const argsText = route.site?.call.arguments.map((arg) => arg.getText()).join(' ') ?? '';
  const permissions = route.handlers.flatMap((fn) =>
    fn.requiredAbility ? [fn.requiredAbility] : [],
  );
  const roles = [...argsText.matchAll(/requireRole\(([^)]*)\)/g)].flatMap((m) =>
    m[1].split(',').map((role) => role.trim().replace(/['"]/g, '')),
  );
  const secured =
    route.guarded ||
    permissions.length > 0 ||
    route.handlers.some((fn) => fn.name === 'authRequired');
  const parameters = [...openPath.matchAll(/\{(\w+)\}/g)].map((m) => ({
    name: m[1],
    in: 'path',
    required: true,
    schema: { type: 'string' },
  }));
  const query = route.handlers.find((fn) => fn.querySpec)?.querySpec;

  if (query) parameters.push(...querySpecParameters(query));

  for (const [name, { schema, required }] of input.queries) {
    if (!parameters.some((item) => item.name === name))
      parameters.push({ name, in: 'query', ...(required ? { required: true } : {}), schema });
  }

  if (input.headers.has('Idempotency-Key')) {
    parameters.push({
      name: 'Idempotency-Key',
      in: 'header',
      required: true,
      description: 'Dùng lại đúng key khi retry cùng payload; khác payload sẽ trả 409.',
      schema: { type: 'string', minLength: 8, maxLength: 128 },
    });
  }

  /* Request body */
  let bodySchema = null;

  if (WRITE_METHODS.has(route.method)) {
    const typed = input.typed.map((type) => typeSchema(type)).find((s) => !isEmptySchema(s));
    const fieldOverride = OVERRIDES[key] ?? {};

    for (const name of fieldOverride.omit ?? []) input.fields.delete(name);
    for (const [name, field] of Object.entries(fieldOverride.fields ?? {})) {
      input.fields.set(name, {
        schema: resolveRefs(field.schema),
        required: Boolean(field.required),
      });
    }

    const properties = Object.fromEntries(
      [...input.fields].map(([name, field]) => [name, field.schema]),
    );
    const required = [...input.fields].filter(([, f]) => f.required).map(([name]) => name);

    if (input.fields.size) {
      const inline = {
        type: 'object',
        properties,
        ...(required.length ? { required } : {}),
      };

      bodySchema = typed ? { allOf: [typed, inline] } : inline;
    } else if (typed) {
      bodySchema = typed;
    }
  }

  const requestBody = input.multipart
    ? {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: { file: { type: 'string', format: 'binary' } },
              required: ['file'],
            },
          },
        },
      }
    : bodySchema
      ? {
          required: Boolean(bodySchema.required?.length || bodySchema.allOf || bodySchema.$ref),
          content: { 'application/json': { schema: bodySchema } },
        }
      : undefined;

  /* Response */
  const status = analysis.status ?? route.handlers.at(-1)?.successStatus ?? 200;
  const responseSchema = analysis.type ? typeSchema(analysis.type) : {};
  const listMode = query?.legacy ? 'legacy' : analysis.list;
  const hasBody = status !== 204;
  const description = [
    permissions.length
      ? `**Quyền:** \`${permissions.join('`, `')}\`.`
      : roles.length
        ? `**Vai trò:** ${roles.join(', ')}.`
        : secured
          ? '**Yêu cầu đăng nhập.**'
          : '**Công khai.**',
    input.headers.has('Idempotency-Key') ? 'Bắt buộc header `Idempotency-Key`.' : '',
    query?.legacy
      ? 'Không gửi tham số phân trang thì trả toàn bộ dưới dạng mảng, không có `meta`.'
      : '',
  ]
    .filter(Boolean)
    .join(' ');

  applyOperation({
    key,
    tag: route.tag,
    openPath,
    method: route.method,
    spec: {
      description,
      security: secured ? [{ sessionCookie: [] }, { bearerAuth: [] }] : [],
      ...(route.auditPolicy ? { 'x-audit-action': route.auditPolicy.action } : {}),
      ...(parameters.length ? { parameters } : {}),
      ...(requestBody ? { requestBody } : {}),
      responses: {
        [status]: {
          description: status === 202 ? 'Đã nhận; theo dõi qua process trả về.' : 'Thành công',
          ...(hasBody && !analysis.raw
            ? {
                content: {
                  'application/json': { schema: envelope(responseSchema, listMode) },
                },
              }
            : {}),
        },
        ...errorResponses({
          secured,
          hasPathParams: parameters.some((item) => item.in === 'path'),
          hasInput: Boolean(requestBody) || parameters.some((item) => item.in === 'query'),
          method: route.method,
        }),
      },
    },
  });

  const op = paths[openPath][route.method];

  if (WRITE_METHODS.has(route.method) && input.readsBody && !op.requestBody)
    report.push(`${key}: handler đọc body nhưng spec không có requestBody`);

  for (const [name, field] of input.fields) {
    if (isEmptySchema(field.schema) && !OVERRIDES[key]?.requestBody)
      report.push(`${key}: field body "${name}" chưa có kiểu`);
  }

  const ok = Object.entries(op.responses).find(([code]) => /^2/.test(code))?.[1];
  const okSchema = ok?.content?.['application/json']?.schema?.properties?.data;

  if (ok?.content && isOpaqueSchema(okSchema)) report.push(`${key}: response chưa có schema`);
}

/* Route gắn trực tiếp trong app.ts */
for (const [method, openPath, tag, spec] of config.appRoutes ?? []) {
  applyOperation({
    key: `${method.toUpperCase()} ${openPath}`,
    tag,
    openPath,
    method,
    spec,
  });
}

for (const key of Object.keys(OPERATIONS)) {
  if (!seenKeys.has(key)) report.push(`${key}: có trong metadata nhưng không còn route`);
}
for (const key of Object.keys(OVERRIDES)) {
  if (!seenKeys.has(key)) report.push(`${key}: có override nhưng không còn route`);
}

/* Download / file responses */
for (const [openPath, item] of Object.entries(paths)) {
  const operation = item.get;

  if (operation && openPath.endsWith('/download')) {
    const ok = Object.keys(operation.responses).find((code) => /^2/.test(code));

    operation.responses[ok] = {
      description: 'File riêng tư, chỉ chủ sở hữu tải được.',
      content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } },
    };
  }
}

/* Components: chỉ giữ schema thực sự được tham chiếu */
const schemas = {};
const pending = [...usedSchemas];
const collectRefs = (value) => {
  if (Array.isArray(value)) return value.forEach(collectRefs);
  if (!value || typeof value !== 'object') return undefined;

  for (const [key, child] of Object.entries(value)) {
    if (key === '$ref' && typeof child === 'string') {
      const match = child.match(/^#\/components\/schemas\/(.+)$/);

      if (match && !schemas[match[1]] && !pending.includes(match[1])) pending.push(match[1]);
    } else {
      collectRefs(child);
    }
  }

  return undefined;
};

ref('ApiError');
pending.push('ApiError');

while (pending.length) {
  const name = pending.pop();

  if (schemas[name]) continue;

  const node = namedTypes.get(name);

  if (!node) {
    report.push(`Schema ${name}: không có trong contract dùng chung`);
    schemas[name] = {};
    continue;
  }

  schemas[name] = typeSchema(checker.getTypeAtLocation(node), new Set(), true);
  collectRefs(schemas[name]);
}

const errorContent = { 'application/json': { schema: ref('ApiError') } };
const sortObject = (value) =>
  Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)));

const spec = {
  openapi: '3.1.0',
  info: { title: config.title, version: '1.0.0', description: API_DESCRIPTION },
  servers: [{ url: '/', description: 'Current API server' }],
  tags: [...tagNames].sort().map((name) => ({
    name,
    description: TAG_DESCRIPTIONS[name] ?? report.push(`Tag ${name}: thiếu mô tả`),
  })),
  paths,
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'Better Auth session token' },
      sessionCookie: { type: 'apiKey', in: 'cookie', name: config.sessionCookie },
    },
    responses: {
      ValidationError: {
        description: 'Dữ liệu không hợp lệ; `extensions` map từng field với thông báo lỗi.',
        content: errorContent,
      },
      Unauthorized: {
        description: 'Access token hoặc phiên không hợp lệ/đã hết hạn.',
        content: errorContent,
      },
      Forbidden: {
        description: 'Không đủ quyền hoặc không sở hữu tài nguyên.',
        content: errorContent,
      },
      NotFound: {
        description: 'Không tìm thấy tài nguyên hoặc actor không được xem.',
        content: errorContent,
      },
      Conflict: {
        description: 'Xung đột version, trạng thái, tồn kho, quota, quote hoặc idempotency.',
        content: errorContent,
      },
      RateLimited: {
        description: 'Vượt giới hạn tần suất; làm theo header Retry-After.',
        content: errorContent,
      },
    },
    schemas: sortObject(schemas),
  },
};

const { auth, authPool, authAuditActions } = await import(
  pathToFileURL(path.join(API_ROOT, 'dist/configs/better-auth.js'))
);
const nativeAuth = await auth.api.generateOpenAPISchema();
function authRefs(value) {
  if (Array.isArray(value)) return value.map(authRefs);
  if (value && typeof value === 'object')
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, authRefs(item)]));
  if (typeof value === 'string' && value.startsWith('#/components/schemas/'))
    return value.replace('#/components/schemas/', '#/components/schemas/Auth_');
  if (typeof value === 'string' && value.startsWith('#/components/securitySchemes/'))
    return value.replace('#/components/securitySchemes/', '#/components/securitySchemes/Auth_');
  return value;
}
for (const [name, schema] of Object.entries(nativeAuth.components?.schemas ?? {}))
  spec.components.schemas[`Auth_${name}`] = authRefs(schema);
for (const [name, scheme] of Object.entries(nativeAuth.components?.securitySchemes ?? {}))
  spec.components.securitySchemes[`Auth_${name}`] = scheme;
for (const [nativePath, item] of Object.entries(nativeAuth.paths)) {
  const fullPath = `/api/auth${nativePath}`;
  spec.paths[fullPath] ??= {};
  for (const [method, operation] of Object.entries(item)) {
    if (!HTTP_METHODS.has(method)) continue;
    const translated = authRefs(operation);
    if (Array.isArray(translated.security))
      translated.security = translated.security.map((item) =>
        Object.fromEntries(Object.entries(item).map(([key, value]) => [`Auth_${key}`, value])),
      );
    spec.paths[fullPath][method] = {
      ...translated,
      tags: ['auth-native'],
      'x-audit-action':
        authAuditActions[nativePath] ?? (nativePath.startsWith('/callback/') ? 'login' : 'read'),
      operationId: `auth_${method}_${nativePath.replace(/[^a-zA-Z0-9]+/g, '_')}`,
      summary: translated.summary ?? translated.description ?? `Better Auth: ${nativePath}`,
    };
  }
}
spec.tags.push({
  name: 'auth-native',
  description: config.authTagDescription,
});
await authPool.end();

const output = YAML.stringify(spec, { lineWidth: 120, aliasDuplicateObjects: false });
const operationCount = Object.values(paths).reduce(
  (sum, item) => sum + Object.keys(item).length,
  0,
);
const summary = {
  operations: operationCount,
  paths: Object.keys(paths).length,
  schemas: Object.keys(schemas).length,
  issues: report.length,
};

if (flags.has('--report') || flags.has('--check')) {
  for (const line of report) console.log(line);
}

console.log(JSON.stringify(summary));

if (flags.has('--check')) {
  const current = await readFile(SPEC_PATH, 'utf8');

  if (current !== output || report.length) {
    console.error(`openapi.yaml lệch source hoặc còn issue; chạy ${config.generateCommand}.`);
    process.exitCode = 1;
  }
} else if (!flags.has('--dry-run')) {
  await writeFile(SPEC_PATH, output);
}

const { sequelize } = await import(
  pathToFileURL(path.join(API_ROOT, 'dist/sequelize/models/index.js'))
);

await sequelize.close();
