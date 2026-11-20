// Exercise the real remote control flow with fake commands; no Docker, SSH or sockets.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

const remote = new URL('../../deploy/remote/', import.meta.url);
const mock = `#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const file = process.env.DEPLOY_TEST_STATE;
const state = JSON.parse(fs.readFileSync(file));
const name = path.basename(process.argv[1]);
const args = process.argv.slice(2);
state.calls.push([name, ...args]);
const save = () => fs.writeFileSync(file, JSON.stringify(state));
const output = value => { console.log(value); save(); };
if (name === 'sleep') { save(); process.exit(0); }
if (name === 'curl') {
  output(JSON.stringify({status: 'ok', version: state.running === 'old' ? 'old-sha' : state.health}));
} else if (name === 'gunzip') {
  if (state.loadFailure) { save(); process.exit(1); }
  output('image archive');
} else if (name === 'docker') {
  if (args[0] === 'compose') {
    const command = args.slice(7);
    if (command[0] === 'ps') output(command.includes('postgres') ? 'db' : 'api');
    else if (command[0] === 'up') {
      state.running = state.latest;
      save();
      if (state.restartFailure && state.running === 'new') process.exit(1);
    } else if (command[0] === 'logs') output('last API logs');
    else throw Error('Unhandled compose: ' + args.join(' '));
  } else if (args[0] === 'inspect') output(state.running);
  else if (args[0] === 'image' && args[1] === 'inspect') {
    const tag = args.at(-1);
    const id = tag.endsWith(':latest') ? state.latest : tag.endsWith(':previous') ? state.previous : tag;
    if (!id) { save(); process.exit(1); }
    output(args[3].includes('Config.Env') ? 'APP_VERSION=' + (id === 'old' ? 'old-sha' : 'new-sha') : id);
  } else if (args[0] === 'tag') {
    state[args[2].endsWith(':previous') ? 'previous' : 'latest'] = args[1]; save();
  } else if (args[0] === 'load') {
    fs.readFileSync(0); state.latest = state.incoming; save();
  } else if (args[0] === 'images') output('');
  else if (args[0] === 'image' || args[0] === 'builder') save();
  else throw Error('Unhandled docker: ' + args.join(' '));
} else throw Error('Unhandled command: ' + name);
`;

function deploy(target, overrides = {}) {
  const root = mkdtempSync(path.join(tmpdir(), 'deploy-test-'));
  try {
    // Redirect only the cron destination so the Ubuntu script can run safely on a laptop.
    writeFileSync(
      path.join(root, 'api.sh'),
      readFileSync(new URL('api.sh', remote), 'utf8').replace('/etc/cron.d/', `${root}/`),
    );
    writeFileSync(path.join(root, 'verify.sh'), readFileSync(new URL('verify.sh', remote)));
    for (const command of ['docker', 'curl', 'sleep', 'gunzip']) {
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
    const result = spawnSync('bash', [path.join(root, 'api.sh'), target, root, 'new-sha'], {
      env: { ...process.env, PATH: `${root}:${process.env.PATH}`, DEPLOY_TEST_STATE: stateFile },
      encoding: 'utf8',
      timeout: 10000,
    });
    return { ...result, state: JSON.parse(readFileSync(stateFile)) };
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
