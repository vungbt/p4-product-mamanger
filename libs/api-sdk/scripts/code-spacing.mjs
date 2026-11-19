import ts from 'typescript';

/** Preserve the repository's semantic spacing in generated TypeScript after Biome formatting. */
export function addCodeSpacing(source) {
  const ast = ts.createSourceFile('generated.ts', source, ts.ScriptTarget.Latest, true);
  const positions = new Set();

  const isHook = (node) => {
    if (!ts.isVariableStatement(node) && !ts.isExpressionStatement(node)) return false;
    let yes = false;

    function check(n) {
      if (ts.isCallExpression(n) && /^(?:\w+\.)?use[A-Z]/.test(n.expression.getText(ast)))
        yes = true;
      else ts.forEachChild(n, check);
    }

    check(node);
    return yes;
  };

  const isHandler = (node) =>
    ts.isFunctionDeclaration(node) ||
    (ts.isVariableStatement(node) &&
      node.declarationList.declarations.some(
        (d) =>
          d.initializer &&
          (ts.isArrowFunction(d.initializer) || ts.isFunctionExpression(d.initializer)),
      ));

  function visit(node) {
    if (ts.isBlock(node) || ts.isSourceFile(node)) {
      const statements = node.statements;
      for (let i = 1; i < statements.length; i++) {
        const prev = statements[i - 1],
          curr = statements[i];
        const separate =
          isHook(prev) ||
          isHook(curr) ||
          isHandler(prev) ||
          isHandler(curr) ||
          ts.isTypeAliasDeclaration(prev) ||
          ts.isInterfaceDeclaration(prev) ||
          (ts.isReturnStatement(curr) && /<\w|<>/.test(curr.getText(ast)));
        if (!separate) continue;
        const start = curr.getStart(ast),
          end = prev.end;
        const between = source.slice(end, start);
        if (/\n\s*\n/.test(between)) continue;
        const line = source.lastIndexOf('\n', start - 1);
        if (line >= end && /^\s*$/.test(source.slice(line + 1, start))) positions.add(line + 1);
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(ast);
  let result = source;
  for (const position of [...positions].sort((a, b) => b - a)) {
    result = `${result.slice(0, position)}\n${result.slice(position)}`;
  }

  return result;
}
