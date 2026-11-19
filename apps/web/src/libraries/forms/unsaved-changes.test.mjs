import assert from 'node:assert/strict';
import test from 'node:test';
import { createMemoryRouter } from 'react-router-dom';
import { createUnsavedChangesRegistry } from './unsaved-changes-registry.ts';

function fixture() {
  const registry = createUnsavedChangesRegistry();
  const guard = { dirty: true, bypass: false };
  const unregister = registry.register(guard);
  const router = createMemoryRouter([{ path: '*' }], {
    initialEntries: ['/list', '/edit', '/detail'],
    initialIndex: 1,
  });

  const blocker = () => router.getBlocker('unsaved', () => registry.isDirty());

  blocker();

  return { registry, guard, unregister, router, blocker };
}

test('links, replace, and Cancel stay put until consent; clean navigation proceeds', async () => {
  const f = fixture();
  try {
    for (const options of [undefined, { replace: true }]) {
      await f.router.navigate('/list', options);
      assert.equal(f.router.state.location.pathname, '/edit');
      assert.equal(f.blocker().state, 'blocked');
      f.blocker().reset();
      assert.equal(f.router.state.location.pathname, '/edit');
    }
    await f.router.navigate('/detail');
    f.blocker().proceed();
    assert.equal(f.router.state.location.pathname, '/detail');
    f.guard.dirty = false;
    await f.router.navigate('/list');
    assert.equal(f.blocker().state, 'unblocked');
    assert.equal(f.router.state.location.pathname, '/list');
  } finally {
    f.router.dispose();
  }
});

test('Back and Forward can be cancelled or accepted through the router blocker', async () => {
  for (const delta of [-1, 1]) {
    const f = fixture();
    try {
      await f.router.navigate(delta);
      assert.equal(f.router.state.location.pathname, '/edit');
      f.blocker().reset();
      assert.equal(f.router.state.location.pathname, '/edit');
      await f.router.navigate(delta);
      f.blocker().proceed();
      await new Promise((resolve) => setImmediate(resolve));
      assert.equal(f.router.state.location.pathname, delta === -1 ? '/list' : '/detail');
    } finally {
      f.router.dispose();
    }
  }
});

test('repeated navigation has one pending blocker and proceeds without a second prompt', async () => {
  const f = fixture();
  try {
    await f.router.navigate('/first');
    await f.router.navigate('/second');
    await f.router.navigate('/third', { replace: true });
    assert.equal(f.router.state.blockers.size, 1);
    assert.equal(f.blocker().state, 'blocked');
    f.blocker().proceed();
    assert.equal(f.router.state.location.pathname, '/third');
    assert.equal(f.blocker().state, 'unblocked');
  } finally {
    f.router.dispose();
  }
});

test('successful save bypasses both navigation and browser unload even before dirty resets', async () => {
  const f = fixture();
  try {
    f.guard.bypass = true;
    await f.router.navigate('/list', { replace: true });
    assert.equal(f.router.state.location.pathname, '/list');
    assert.equal(f.blocker().state, 'unblocked');
    const event = new Event('beforeunload', { cancelable: true });
    f.registry.beforeUnload(event);
    assert.equal(event.defaultPrevented, false);
  } finally {
    f.router.dispose();
  }
});

test('reload/close warns only for dirty registered forms; unregister removes stale guards', () => {
  const f = fixture();

  const warned = () => {
    const event = new Event('beforeunload', { cancelable: true });
    f.registry.beforeUnload(event);

    return event.defaultPrevented;
  };

  try {
    assert.equal(warned(), true);
    f.guard.dirty = false;
    assert.equal(warned(), false);
    const other = { dirty: true, bypass: false };
    const removeOther = f.registry.register(other);
    assert.equal(warned(), true);
    removeOther();
    assert.equal(warned(), false);
    f.guard.dirty = true;
    f.unregister();
    assert.equal(warned(), false);
  } finally {
    f.router.dispose();
  }
});
