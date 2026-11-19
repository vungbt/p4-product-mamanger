import assert from 'node:assert/strict';
import test from 'node:test';
import { ApiSdkError, createApiSdk, createUploadApi } from '../dist/shared/index.js';

const uploadTicketFile = (options) => options.api.uploadFile(options);

function fixture() {
  const ticket = {
    id: 'ticket',
    publicId: 'storage',
    uploadUrl: 'https://upload.example',
    allowedMimeTypes: ['image/png'],
    maxBytes: 100,
    status: 'pending',
    fileId: null,
  };
  const session = { sent: false, attempted: false, controller: new AbortController() };
  const calls = { created: 0, sent: 0, completed: 0 };
  const options = {
    file: new File(['png'], 'photo.png', { type: 'image/png' }),
    session,
    createTicket: async () => {
      calls.created++;
      return ticket;
    },
    transfer: async () => {
      calls.sent++;
    },
    completeTicket: async () => {
      calls.completed++;
      return { ...ticket, status: 'completed', fileId: 'verified' };
    },
    onProgress: () => {},
    onVerifying: () => {},
    failureMessage: 'failed',
  };
  options.purpose = 'product';
  const sdk = createApiSdk({
    baseUrl: 'https://api.example',
    fetch: async (request) => {
      const data = request.url.endsWith('/complete')
        ? await options.completeTicket()
        : await options.createTicket();
      return Response.json({ data }, { status: request.url.endsWith('/complete') ? 200 : 201 });
    },
  });
  options.api = createUploadApi(sdk, {
    baseUrl: 'https://api.example',
    xhr: () => ({
      upload: {},
      open() {},
      send() {
        options.transfer().then(
          () => {
            this.status = 200;
            this.onload();
          },
          () => this.onerror(),
        );
      },
      abort() {
        this.onabort();
      },
    }),
  });
  return { options, calls, ticket };
}

test('only completion with a file ID returns an attachable result', async () => {
  const { options } = fixture();
  options.completeTicket = async () => ({ status: 'pending', fileId: null });
  await assert.rejects(uploadTicketFile(options), /failed/);
  options.completeTicket = async () => ({ status: 'completed', fileId: null });
  await assert.rejects(uploadTicketFile(options), /failed/);
  options.completeTicket = async () => ({ status: 'completed', fileId: 'verified' });
  assert.deepEqual(await uploadTicketFile(options), {
    fileId: 'verified',
    storageId: 'storage',
    ticketId: 'ticket',
  });
});

test('one rejected file does not interfere with another file', async () => {
  const good = fixture();
  const bad = fixture();
  bad.options.completeTicket = async () => {
    throw new Error('verification failed');
  };
  const results = await Promise.allSettled([
    uploadTicketFile(bad.options),
    uploadTicketFile(good.options),
  ]);
  assert.equal(results[0].status, 'rejected');
  assert.equal(results[1].status, 'fulfilled');
  assert.equal(results[1].value.fileId, 'verified');
});

test('verification retry reuses ticket and does not upload the file again', async () => {
  const { options, calls } = fixture();
  const complete = options.completeTicket;
  options.completeTicket = async () => {
    throw new Error('network');
  };
  await assert.rejects(uploadTicketFile(options), /network/);
  options.completeTicket = complete;
  await uploadTicketFile(options);
  assert.equal(calls.created, 1);
  assert.equal(calls.sent, 1);
});

test('lost provider response verifies the same ticket before sending again', async () => {
  const { options, calls } = fixture();
  options.transfer = async () => {
    calls.sent++;
    throw new Error('lost response');
  };
  await assert.rejects(uploadTicketFile(options), /failed/);
  assert.equal((await uploadTicketFile(options)).fileId, 'verified');
  assert.equal(calls.created, 1);
  assert.equal(calls.sent, 1);
});

test('invalid files never reach the provider or completion', async () => {
  for (const file of [
    new File(['text'], 'bad.txt', { type: 'text/plain' }),
    new File([], 'empty.png', { type: 'image/png' }),
    new File(['x'.repeat(101)], 'large.png', { type: 'image/png' }),
  ]) {
    const { options, calls } = fixture();
    await assert.rejects(uploadTicketFile({ ...options, file }), /failed/);
    assert.equal(calls.sent, 0);
    assert.equal(calls.completed, 0);
  }
});

test('removing a file during ticket creation prevents the provider upload', async () => {
  const { options, calls, ticket } = fixture();
  options.createTicket = async () => {
    options.session.controller.abort();
    return ticket;
  };
  await assert.rejects(uploadTicketFile(options), { name: 'AbortError' });
  assert.equal(calls.sent, 0);
  assert.equal(calls.completed, 0);
});

function transportFixture({ response, send } = {}) {
  const requests = [];
  const transfers = [];
  const { ticket } = fixture();
  const sdk = createApiSdk({
    baseUrl: 'https://api.example',
    getToken: () => 'api-only-token',
    fetch: async (request) => {
      requests.push(request);
      if (response) return response(request);
      return Response.json({
        data: request.url.endsWith('/complete')
          ? { ...ticket, status: 'completed', fileId: 'verified' }
          : { ...ticket, uploadUrl: '/provider' },
      });
    },
  });
  const api = createUploadApi(sdk, {
    baseUrl: sdk.baseUrl,
    xhr: () => {
      const xhr = {
        upload: {},
        open(method, url) {
          this.method = method;
          this.url = url;
        },
        send(body) {
          this.body = body;
          if (send) return send(this);
          this.upload.onprogress({ lengthComputable: true, loaded: 1, total: 2 });
          this.status = 201;
          this.onload();
        },
        abort() {
          this.aborted = true;
          this.onabort();
        },
      };
      transfers.push(xhr);
      return xhr;
    },
  });
  return {
    api,
    requests,
    transfers,
    ticket,
    input: {
      file: new File(['png'], 'photo.png', { type: 'image/png' }),
      purpose: 'product',
      resourceId: 'p',
    },
  };
}

test('XHR resolves relative URLs, sends multipart without provider credentials, and reports progress', async () => {
  const { api, input, transfers, requests } = transportFixture();
  const progress = [];
  await api.uploadFile({ ...input, onProgress: (value) => progress.push(value) });
  assert.equal(transfers[0].url, 'https://api.example/provider');
  assert.equal(transfers[0].method, 'POST');
  assert.equal(transfers[0].withCredentials, false);
  assert.equal(transfers[0].timeout, 120_000);
  assert.equal(transfers[0].body.get('file').name, 'photo.png');
  assert.deepEqual(progress, [50]);
  assert.equal(requests[0].headers.get('authorization'), 'Bearer api-only-token');
  assert.deepEqual(await requests[0].json(), { purpose: 'product', resourceId: 'p' });
  assert.equal(requests[1].url, 'https://api.example/api/files/uploads/ticket/complete');
});

test('ticket and completion API failures retain ApiSdkError details', async () => {
  for (const failCompletion of [false, true]) {
    const { api, input, ticket, transfers } = transportFixture({
      response: (request) =>
        failCompletion && !request.url.endsWith('/complete')
          ? Response.json({ data: ticket })
          : Response.json(
              {
                code: 'upload_rejected',
                message: 'Rejected',
                extensions: { file: ['Invalid image'] },
              },
              { status: 422 },
            ),
    });
    await assert.rejects(
      api.uploadFile(input),
      (error) =>
        error instanceof ApiSdkError &&
        error.status === 422 &&
        error.code === 'upload_rejected' &&
        error.fieldErrors.file[0] === 'Invalid image',
    );
    assert.equal(transfers.length, failCompletion ? 1 : 0);
  }
});

test('timeout, provider HTTP errors and network errors do not complete tickets', async () => {
  for (const send of [
    (xhr) => xhr.ontimeout(),
    (xhr) => xhr.onerror(),
    (xhr) => {
      xhr.status = 500;
      xhr.onload();
    },
    () => {
      throw new Error('send failed');
    },
  ]) {
    const { api, input, requests } = transportFixture({ send });
    await assert.rejects(
      api.uploadFile(input),
      (error) => error instanceof Error && !(error instanceof ApiSdkError),
    );
    assert.equal(requests.length, 1);
  }
});

test('external abort cancels an active XHR and prevents completion; pre-abort creates no ticket', async () => {
  const controller = new AbortController();
  const { api, input, transfers, requests } = transportFixture({ send: () => controller.abort() });
  await assert.rejects(api.uploadFile({ ...input, signal: controller.signal }), {
    name: 'AbortError',
  });
  assert.equal(transfers[0].aborted, true);
  assert.equal(requests.length, 1);
  await assert.rejects(api.uploadFile({ ...input, signal: controller.signal }), {
    name: 'AbortError',
  });
  assert.equal(requests.length, 1);
});

test('a completed session repeats no steps, even with a stale queue item', async () => {
  const { options, calls } = fixture();
  const result = await uploadTicketFile(options);
  assert.deepEqual(await uploadTicketFile(options), result);
  assert.deepEqual(calls, { created: 1, sent: 1, completed: 1 });
});

test('ambiguous transfer is resent to the same ticket when verification finds no file', async () => {
  const { options, calls } = fixture();
  options.transfer = async () => {
    calls.sent++;
    throw new Error('lost');
  };
  await assert.rejects(uploadTicketFile(options));
  options.transfer = async () => {
    calls.sent++;
  };
  options.completeTicket = async () => {
    calls.completed++;
    return calls.completed === 1
      ? { status: 'pending' }
      : { status: 'completed', fileId: 'verified' };
  };
  assert.equal((await uploadTicketFile(options)).fileId, 'verified');
  assert.deepEqual(calls, { created: 1, sent: 2, completed: 2 });
});

test('batch uses batch endpoints, isolates invalid files and returns the verification process', async () => {
  const process = { id: 'process', state: 'queued' };
  const { api, input, requests, transfers, ticket } = transportFixture({
    response: (request) =>
      Response.json({
        data: request.url.endsWith('/batch')
          ? {
              batchId: 'batch',
              tickets: [
                { ...ticket, id: 'good' },
                { ...ticket, id: 'bad' },
              ],
            }
          : process,
      }),
  });
  const progress = [];
  const result = await api.uploadFiles(
    [input.file, new File([], 'empty.png', { type: 'image/png' })],
    {
      purpose: 'product',
      idempotencyKey: 'batch-key',
      onProgress: (index, percent) => progress.push([index, percent]),
    },
  );
  assert.equal(transfers.length, 1);
  assert.equal(result.files[0].status, 'fulfilled');
  assert.equal(result.files[1].status, 'rejected');
  assert.deepEqual(result.process, process);
  assert.deepEqual(progress, [[0, 50]]);
  assert.equal(requests[0].url, 'https://api.example/api/files/uploads/batch');
  assert.deepEqual(await requests[0].json(), {
    purpose: 'product',
    names: ['photo.png', 'empty.png'],
  });
  assert.equal(requests[1].url, 'https://api.example/api/files/uploads/batch/complete');
  assert.equal(requests[1].headers.get('Idempotency-Key'), 'batch-key');
  assert.deepEqual(await requests[1].json(), { ticketIds: ['good'] });
});

test('batch bounds, invalid ticket counts and all-invalid files never trigger completion', async () => {
  const { api, input, requests, ticket } = transportFixture({
    response: () => Response.json({ data: { tickets: [ticket] } }),
  });
  await assert.rejects(api.uploadFiles([], { purpose: 'product' }), /1–20/);
  await assert.rejects(api.uploadFiles(Array(21).fill(input.file), { purpose: 'product' }), /1–20/);
  assert.equal(requests.length, 0);
  await assert.rejects(
    api.uploadFiles([input.file, input.file], { purpose: 'product' }),
    /Invalid upload ticket batch/,
  );
  const result = await api.uploadFiles([new File([], 'empty.png', { type: 'image/png' })], {
    purpose: 'product',
  });
  assert.equal(result.process, null);
  assert.equal(result.files[0].status, 'rejected');
  assert.equal(requests.length, 2);
});

test('batch verification waits for terminal process and maps outcomes by ticket, preserving failures', async () => {
  let polls = 0;
  const { api } = transportFixture({
    response: (request) =>
      Response.json({
        data: request.url.includes('/items')
          ? [
              {
                state: 'failed',
                data: { ticketId: 'bad' },
                issues: [{ message: 'Rejected image' }],
              },
              { state: 'applied', data: { ticketId: 'good' }, result: { fileId: 'verified' } },
            ]
          : { id: 'process', state: ++polls === 1 ? 'running' : 'completed_with_errors' },
      }),
  });
  const transferError = new Error('Provider failed');
  const results = await api.verifyBatch(
    {
      process: { id: 'process', state: 'queued' },
      files: [
        { status: 'fulfilled', value: { ticketId: 'good', storageId: 'storage' } },
        { status: 'fulfilled', value: { ticketId: 'bad', storageId: 'bad-storage' } },
        { status: 'rejected', reason: transferError },
        { status: 'fulfilled', value: { ticketId: 'missing', storageId: 'missing' } },
      ],
    },
    { pollIntervalMs: 0 },
  );
  assert.equal(polls, 2);
  assert.deepEqual(results[0].value, {
    ticketId: 'good',
    storageId: 'storage',
    fileId: 'verified',
  });
  assert.match(results[1].reason.message, /Rejected image/);
  assert.equal(results[2].reason, transferError);
  assert.equal(results[3].status, 'rejected');
});

test('hook caller selects single or batch independently of file count; retries always use single completion', async () => {
  const { createRequire } = await import('node:module');
  const { createElement } = await import('react');
  const { ApiSdkProvider, useTicketUpload } = await import('../dist/react/index.js');
  // Use the workspace app's existing renderer; no browser is needed to exercise add's requests.
  const require = createRequire(new URL('../../../apps/web/package.json', import.meta.url));
  const { renderToStaticMarkup } = require('react-dom/server');
  for (const mode of [undefined, 'single', 'batch']) {
    for (const count of [1, 2]) {
      const requests = [];
      let hook;
      const ticket = {
        id: 'ticket',
        publicId: 'storage',
        uploadUrl: 'https://provider.example',
        allowedMimeTypes: ['image/png'],
        maxBytes: 100,
      };
      const sdk = createApiSdk({
        baseUrl: 'https://api.example',
        fetch: async (request) => {
          requests.push(new URL(request.url).pathname);
          if (request.url.endsWith('/batch')) {
            const body = await request.json();
            return Response.json({
              data: {
                tickets: body.names.map((_, index) => ({ ...ticket, id: `ticket-${index}` })),
              },
            });
          }
          if (request.url.endsWith('/batch/complete'))
            return Response.json({ data: { id: 'process', state: 'completed_with_errors' } });
          if (request.url.endsWith('/items')) return Response.json({ data: [] });
          if (request.url.endsWith('/complete'))
            return Response.json({ data: { ...ticket, status: 'completed', fileId: 'file' } });
          return Response.json({ data: ticket });
        },
      });

      function Harness() {
        hook = useTicketUpload({ purpose: 'product', mode, failureMessage: 'failed' });

        return null;
      }

      const originalUuid = crypto.randomUUID;
      const itemIds = [];
      crypto.randomUUID = () => {
        const id = originalUuid.call(crypto);
        itemIds.push(id);
        return id;
      };
      const originalXhr = globalThis.XMLHttpRequest;
      let transfers = 0;
      globalThis.XMLHttpRequest = class {
        upload = {};
        open() {}
        send() {
          transfers++;
          this.status = 200;
          this.onload();
        }
      };
      try {
        renderToStaticMarkup(createElement(ApiSdkProvider, { sdk }, createElement(Harness)));
        const file = new File(['png'], 'photo.png', { type: 'image/png' });
        hook.add(Array(count).fill(file));
        for (let turn = 0; turn < 20; turn++) await new Promise((resolve) => setImmediate(resolve));
        assert.equal(transfers, count);
        if (mode === 'batch') {
          assert.deepEqual(requests, [
            '/api/files/uploads/batch',
            '/api/files/uploads/batch/complete',
            '/api/processes/process/items',
          ]);
          // A failed batch item retains its ticket and provider success for the single retry.
          await hook.retry({ id: itemIds[0], file });
          assert.equal(requests.at(-1), '/api/files/uploads/ticket-0/complete');
          assert.equal(transfers, count);
        } else {
          assert.equal(requests.filter((path) => path === '/api/files/uploads').length, count);
          assert.equal(
            requests.filter((path) => path === '/api/files/uploads/ticket/complete').length,
            count,
          );
        }
        hook.clear();
      } finally {
        globalThis.XMLHttpRequest = originalXhr;
        crypto.randomUUID = originalUuid;
      }
    }
  }
});
