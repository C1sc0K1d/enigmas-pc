import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { serverSession } from './session.ts';

test('keeps one identity per process and changes it when a fresh process starts', () => {
  const moduleUrl = new URL('./session.ts', import.meta.url).href;
  const code =
    'import { getServerSessionId } from ' +
    JSON.stringify(moduleUrl) +
    '; console.log(JSON.stringify([getServerSessionId(), getServerSessionId()]));';
  const env = { ...process.env };
  delete env.PRESOS_SERVER_SESSION_ID;
  function boot() {
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', code], {
      encoding: 'utf8',
      env,
      windowsHide: true,
      timeout: 10000,
    });
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout);
  }
  const first = boot();
  const second = boot();
  assert.equal(first[0], first[1]);
  assert.equal(second[0], second[1]);
  assert.notEqual(first[0], second[0]);
});

test('serves the current identity without caching', () => {
  const headers = {};
  let payload;
  serverSession(
    {},
    {
      setHeader(name, value) {
        headers[name] = value;
      },
      json(value) {
        payload = value;
      },
    },
  );
  assert.equal(headers['Cache-Control'], 'no-store');
  assert.equal(typeof payload.sessionId, 'string');
  assert.ok(payload.sessionId.length > 0);
});
