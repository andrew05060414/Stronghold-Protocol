// tools/setup.mjs: where the local Arknights client is looked for (--game → SP_ARKNIGHTS_AB → remembered path →
// known install locations), and which folder layouts a given path may have.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { findClient, resolveAbRoot } from '../tools/setup.mjs';

const AB_TAIL = ['Arknights_Data', 'StreamingAssets', 'AB', 'Windows'];

function fakeInstall(t, { autochess = true } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sp-client-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const ab = path.join(root, ...AB_TAIL);
  fs.mkdirSync(autochess ? path.join(ab, 'ui', 'autochess') : ab, { recursive: true });
  return { root, ab };
}

test('resolveAbRoot: the install folder, its Arknights_Data folder and the AssetBundle root give the same root', (t) => {
  const { root, ab } = fakeInstall(t);
  assert.equal(resolveAbRoot(root), ab);
  assert.equal(resolveAbRoot(path.join(root, 'Arknights_Data')), ab);
  assert.equal(resolveAbRoot(ab), ab);
  const missing = path.join(root, 'nowhere');
  assert.equal(resolveAbRoot(missing), missing);
  assert.equal(resolveAbRoot(''), null);
});

test('findClient: --game takes an install folder; a root without the autochess art is partial', (t) => {
  const full = fakeInstall(t);
  const hit = findClient(full.root);
  assert.equal(hit.path, full.ab);
  assert.equal(hit.kind, '--game');
  assert.ok(hit.autochess);
  const empty = fakeInstall(t, { autochess: false });
  const partial = findClient(empty.root);
  assert.equal(partial.path, empty.ab);
  assert.ok(!partial.autochess);
});

test('findClient: SP_ARKNIGHTS_AB is used when --game is not given', (t) => {
  const { root, ab } = fakeInstall(t);
  const before = process.env.SP_ARKNIGHTS_AB;
  t.after(() => { if (before === undefined) delete process.env.SP_ARKNIGHTS_AB; else process.env.SP_ARKNIGHTS_AB = before; });
  process.env.SP_ARKNIGHTS_AB = root;
  const hit = findClient();
  assert.equal(hit.path, ab);
  assert.equal(hit.kind, 'SP_ARKNIGHTS_AB');
});
