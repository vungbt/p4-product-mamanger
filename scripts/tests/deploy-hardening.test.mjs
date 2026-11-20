// Exercise the real remote control flow with fake commands; no Docker, SSH or sockets.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

const remote = new URL('../../deploy/remote/', import.meta.url);
const mock = `#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const file = process.env.DEPLOY_TEST_STATE;
const name = path.basename(process.argv[1]);
const args = process.argv.slice(2);
// Never hold the state lock while waiting for a pipeline producer.
if (name === 'docker' && args[0] === 'load') fs.readFileSync(0);
const result = {};
function handle(state) {
  state.calls.push([name, ...args]);
  const output = value => { result.output = value; };
  if (name === 'sleep') { return 0; }
  if (name === 'ssh') {
    if (args[1].startsWith('mktemp')) output(process.env.DEPLOY_TEST_ROOT);
  } else if (name === 'scp') { /* Only record the call. */ }
  else if (name === 'curl') {
    output(JSON.stringify({status: 'ok', version: args.includes('https://example.test/health') ? state.publicHealth || 'stale-public' : state.running === 'old' ? state.oldHealth || 'old-sha' : state.health}));
  } else if (name === 'gunzip') {
    if (state.loadFailure) { return 1; }
    output('image archive');
  } else if (name === 'docker') {
    if (args[0] === 'compose') {
      const command = args.slice(7);
      if (command[0] === 'ps') output(command.includes('postgres') ? 'db' : state.running ? 'api' : '');
      else if (command[0] === 'up') {
        if (!state.rollbackFailure || state.latest === 'new') state.running = state.latest;
        if (state.restartFailure && state.running === 'new') return 1;
      } else if (command[0] === 'logs') output('last API logs');
      else throw Error('Unhandled compose: ' + args.join(' '));
    } else if (args[0] === 'inspect') output(state.running);
    else if (args[0] === 'image' && args[1] === 'inspect') {
      const tag = args.at(-1);
      const id = tag.endsWith(':latest') ? state.latest : tag.endsWith(':previous') ? state.previous : tag.endsWith(':rollback-previous') ? state.pin : tag;
      if (!id || (id === 'older' && state.prunedOlder)) { return 1; }
      if (args[3]?.includes('RepoTags')) output(state.otherProjectTag && id === 'new' ? 'other-api:release' : '');
      else output(args[3]?.includes('Config.Env') ? state.legacy && id === 'old' ? '' : 'APP_VERSION=' + (id === 'old' ? 'old-sha' : 'new-sha') : id);
    } else if (args[0] === 'tag') {
      state[args[2].endsWith(':previous') ? 'previous' : args[2].endsWith(':rollback-previous') ? 'pin' : 'latest'] = args[1];
    } else if (args[0] === 'load') {
      state.latest = state.incoming;
    } else if (args[0] === 'ps') output(state.running === args.at(-1).replace('ancestor=', '') ? 'api' : '');
    else if (args[0] === 'image' && args[1] === 'rm') {
      const image = args[2];
      if (image.endsWith(':rollback-previous') && state.finalizeFailure) { return 1; }
      if (image.endsWith(':previous')) state.previous = null;
      else if (image.endsWith(':rollback-previous')) state.pin = null;
      else {
        if ([state.latest, state.previous, state.pin, state.running].includes(image)) throw Error('Removing protected image');
        state.removed = [...(state.removed || []), image];
      }
    } else if (args[0] === 'image' && args[1] === 'prune') {
      // Model dangling-image pruning so public rollback cannot rely on a deleted P.
      state.prunedOlder = ![state.latest, state.previous, state.pin, state.running].includes('older');
    } else if (args[0] === 'images') output('');
    else if (args[0] === 'image' || args[0] === 'builder') { /* Only record the call. */ }
    else throw Error('Unhandled docker: ' + args.join(' '));
  } else throw Error('Unhandled command: ' + name);
}

// Serialize read-modify-write, including the call log, across mock processes.
// Atomic replacement also keeps readers from ever observing partial JSON.
const lock = file + '.lock';
const temporary = file + '.' + process.pid + '.tmp';
const deadline = Date.now() + 5000;
while (true) {
  try {
    fs.mkdirSync(lock);
    break;
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    if (Date.now() >= deadline) throw Error('Timed out acquiring mock state lock');
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 5);
  }
}
let status;
try {
  const state = JSON.parse(fs.readFileSync(file));
  status = handle(state);
  fs.writeFileSync(temporary, JSON.stringify(state));
  fs.renameSync(temporary, file);
} finally {
  fs.rmSync(temporary, {force: true});
  fs.rmdirSync(lock);
}
// Output can block on a pipe, and SSH launches more mocks: both must run unlocked.
if ('output' in result) console.log(result.output);
if (name === 'ssh' && args[1].startsWith('bash ')) {
  process.exit(require('node:child_process').spawnSync('bash', ['-c', args[1]], {stdio: 'inherit'}).status);
}
process.exit(status || 0);
`;

function deploy(target, overrides = {}, followUp = false) {
  const root = mkdtempSync(path.join(tmpdir(), 'deploy-test-'));
  try {
    // Redirect only the cron destination so the Ubuntu script can run safely on a laptop.
    writeFileSync(
      path.join(root, 'api.sh'),
      readFileSync(new URL('api.sh', remote), 'utf8').replace('/etc/cron.d/', `${root}/`),
    );
    writeFileSync(path.join(root, 'verify.sh'), readFileSync(new URL('verify.sh', remote)));
    for (const command of ['docker', 'curl', 'sleep', 'gunzip', 'ssh', 'scp']) {
      writeFileSync(path.join(root, command), mock, { mode: 0o755 });
    }
    const backup = target === 'p4-api' ? 'p4-db-backup.sh' : 'stay-db-backup.sh';
    // Reproduce the incident's stdin reader. It must not prevent restart/verification.
    writeFileSync(path.join(root, backup), '#!/bin/bash\ncat >/dev/null\n', { mode: 0o700 });
    writeFileSync(path.join(root, target === 'p4-api' ? '.env.prod' : '.env.stay.prod'), '');
    writeFileSync(path.join(root, `${target}.tar.gz`), 'archive');
    const stateFile = path.join(root, 'state.json');
    writeFileSync(
      stateFile,
      JSON.stringify({
        latest: 'old',
        previous: 'older',
        running: 'old',
        incoming: 'new',
        health: 'new-sha',
        calls: [],
        ...overrides,
      }),
    );
    const env = { ...process.env, PATH: `${root}:${process.env.PATH}`, DEPLOY_TEST_STATE: stateFile, DEPLOY_TEST_ROOT: root };
    let result = spawnSync('bash', [path.join(root, 'api.sh'), target, root, 'new-sha'], {
      env,
      encoding: 'utf8',
      timeout: 10000,
    });
    if (followUp) {
      assert.equal(result.status, 0, result.stderr);
      result = spawnSync('bash', ['-c', 'source scripts/lib/deploy.sh; SERVER=test; verify_public_api "$1" "$2" https://example.test/health new-sha', 'public-test', target, root], {
        env, encoding: 'utf8', timeout: 10000,
      });
      if (followUp === 'manual') {
        assert.equal(result.status, 0, result.stderr);
        assert.equal(existsSync(path.join(root, `.${target}-rollback`)), false);
        result = spawnSync('bash', [path.join(root, 'api.sh'), target, root, 'new-sha', 'rollback'], {
          env, encoding: 'utf8', timeout: 10000,
        });
      }
    }
    return { ...result, state: JSON.parse(readFileSync(stateFile)), rollbackState: existsSync(path.join(root, `.${target}-rollback`)) };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

for (const target of ['p4-api', 'stay-api']) {
  test(`${target}: stdin-reading backup cannot swallow deploy; verifies new image`, () => {
    const result = deploy(target);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.state.running, 'new');
    assert.equal(result.state.previous, 'old');
    assert.match(result.stdout, /Verified.*new-sha/);
  });
  test(`${target}: wrong SHA at HTTP 200 rolls back and fails`, () => {
    const result = deploy(target, { health: 'stale-sha' });
    assert.equal(result.status, 1, result.stderr);
    assert.equal(result.state.running, 'old');
    assert.equal(result.state.latest, 'old');
    assert.equal(result.state.previous, 'older');
    assert.deepEqual(result.state.removed, ['new']);
    assert.equal(result.rollbackState, false);
    assert.match(result.stdout, /last API logs/);
    assert.match(result.stdout, /Verified.*old-sha/);
    assert.match(result.stderr, /Rollback healthy/);
  });
  test(`${target}: compose restart failure also rolls back`, () => {
    const result = deploy(target, { restartFailure: true });
    assert.equal(result.status, 1, result.stderr);
    assert.equal(result.state.running, 'old');
    assert.match(result.stderr, /Rollback healthy/);
  });
  test(`${target}: first deploy without any existing image fails safely`, () => {
    const result = deploy(target, { latest: null, previous: null, running: null, health: 'stale-sha' });
    assert.equal(result.status, 1, result.stderr);
    assert.equal(result.state.previous, null);
    assert.equal(result.state.latest, 'new');
    assert.equal(result.state.removed, undefined);
    assert.match(result.stderr, /no previous image/);
  });
  test(`${target}: rollback restores the absence of a previous tag`, () => {
    const result = deploy(target, { previous: null, health: 'stale-sha' });
    assert.equal(result.status, 1, result.stderr);
    assert.equal(result.state.latest, 'old');
    assert.equal(result.state.previous, null);
    assert.deepEqual(result.state.removed, ['new']);
  });
  test(`${target}: failed rollback preserves tags and the still-running incoming image`, () => {
    const result = deploy(target, { health: 'stale-sha', rollbackFailure: true });
    assert.equal(result.status, 1, result.stderr);
    assert.equal(result.state.latest, 'old');
    assert.equal(result.state.previous, 'older');
    assert.equal(result.state.running, 'new');
    assert.equal(result.state.removed, undefined);
  });
  test(`${target}: cleanup preserves an incoming image tagged by another project`, () => {
    const result = deploy(target, { health: 'stale-sha', otherProjectTag: true });
    assert.equal(result.status, 1, result.stderr);
    assert.equal(result.state.latest, 'old');
    assert.equal(result.state.previous, 'older');
    assert.equal(result.state.removed, undefined);
  });
  test(`${target}: unhealthy rollback still removes the unused incoming image`, () => {
    const result = deploy(target, { health: 'stale-sha', oldHealth: 'unhealthy-sha' });
    assert.equal(result.status, 1, result.stderr);
    assert.equal(result.state.running, 'old');
    assert.equal(result.state.latest, 'old');
    assert.equal(result.state.previous, 'older');
    assert.deepEqual(result.state.removed, ['new']);
    assert.equal(result.rollbackState, true);
    assert.match(result.stderr, /Rollback failed/);
  });
  test(`${target}: legacy rollback still checks image ID and HTTP health`, () => {
    const result = deploy(target, { health: 'stale-sha', legacy: true });
    assert.equal(result.status, 1, result.stderr);
    assert.equal(result.state.previous, 'older');
    assert.deepEqual(result.state.removed, ['new']);
    assert.match(result.stderr, /Legacy rollback image/);
    assert.match(result.stderr, /Rollback healthy/);
  });
  test(`${target}: public verification failure restores both tags and removes incoming`, () => {
    const result = deploy(target, {}, true);
    assert.equal(result.status, 1, result.stderr);
    assert.equal(result.state.running, 'old');
    assert.equal(result.state.latest, 'old');
    assert.equal(result.state.previous, 'older');
    assert.equal(result.state.prunedOlder, false);
    assert.deepEqual(result.state.removed, ['new']);
    assert.ok(result.state.calls.some(call => call[0] === 'ssh' && call[2]?.includes('rollback')));
    assert.equal(result.rollbackState, false);
  });
  test(`${target}: successful public verification finalizes to latest and previous only`, () => {
    const result = deploy(target, { publicHealth: 'new-sha' }, true);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.state.running, 'new');
    assert.equal(result.state.latest, 'new');
    assert.equal(result.state.previous, 'old');
    assert.equal(result.state.pin, null);
    assert.equal(result.rollbackState, false);
    assert.equal(result.state.prunedOlder, true);
    assert.ok(result.state.calls.some(call => call[0] === 'ssh' && call[2]?.endsWith(' finalize')));
    assert.doesNotMatch(result.stderr, /Warning/);
  });
  test(`${target}: finalize failure warns without failing the verified deploy`, () => {
    const result = deploy(target, { publicHealth: 'new-sha', finalizeFailure: true }, true);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.state.running, 'new');
    assert.equal(result.state.latest, 'new');
    assert.equal(result.state.previous, 'old');
    assert.equal(result.state.pin, 'older');
    assert.equal(result.rollbackState, true);
    assert.match(result.stderr, /Warning: API deploy finalization failed/);
    assert.ok(!result.state.calls.some(call => call[0] === 'ssh' && call[2]?.endsWith(' rollback')));
  });
  test(`${target}: manual rollback after finalize falls back to previous`, () => {
    const result = deploy(target, { publicHealth: 'new-sha' }, 'manual');
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.state.running, 'old');
    assert.equal(result.state.latest, 'old');
    assert.equal(result.state.previous, 'old');
    assert.equal(result.state.pin, null);
    assert.equal(result.rollbackState, false);
    assert.match(result.stdout, /Verified.*old-sha/);
  });
  test(`${target}: identical incoming image preserves actual previous image`, () => {
    const result = deploy(target, { latest: 'new', running: 'new' });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.state.previous, 'older');
  });
  test(`${target}: failed archive pipeline aborts before restart`, () => {
    const result = deploy(target, { loadFailure: true });
    assert.equal(result.status, 1, result.stderr);
    assert.equal(result.state.running, 'old');
    assert.equal(
      result.state.calls.some((call) => call.includes('up')),
      false,
    );
  });
}

for (const [name, body, status] of [
  ['new build', '<html><head><meta name="version" content="new-sha"></head></html>', 0],
  ['stale build', '<html><head><meta name="version" content="old-sha"></head></html>', 1],
  ['missing marker', '<html><head></head></html>', 1],
]) {
  test(`public web verification: ${name}`, () => {
    const result = spawnSync(
      'bash',
      [
        '-c',
        `
      source "$1"
      curl() { printf '%s' "$DEPLOY_TEST_BODY"; }
      sleep() { :; }
      verify_release web https://example.test/index.html new-sha 1
    `,
        'verify-test',
        new URL('verify.sh', remote).pathname,
      ],
      {
        env: { ...process.env, DEPLOY_TEST_BODY: body },
        encoding: 'utf8',
      },
    );
    assert.equal(result.status, status, result.stderr);
  });
}
