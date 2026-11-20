import assert from 'node:assert/strict';
import test from 'node:test';
import { cloudinaryImageUrl } from '@/libraries/cloudinary-image';

const base = 'https://res.cloudinary.com/p4/image/upload/';

test('optimizes public images and preserves versions, folders, queries and fragments', () => {
  assert.equal(
    cloudinaryImageUrl(`${base}v123/products/shoe.webp?download=1#photo`),
    `${base}f_auto,q_auto/v123/products/shoe.webp?download=1#photo`,
  );
  assert.equal(
    cloudinaryImageUrl(`${base}products/shoe.webp`, 96),
    `${base}f_auto,q_auto,w_96,c_limit/products/shoe.webp`,
  );
});

test('is idempotent and preserves existing transformations across chained steps', () => {
  const source = `${base}c_fill,w_300/q_85/v1/products/shoe.webp`;

  assert.equal(
    cloudinaryImageUrl(source, 96),
    `${base}f_auto/c_fill,w_300/q_85/v1/products/shoe.webp`,
  );
  assert.equal(
    cloudinaryImageUrl(`${base}f_webp,q_90/products/shoe.webp`),
    `${base}f_webp,q_90/products/shoe.webp`,
  );

  const optimized = cloudinaryImageUrl(`${base}v1/products/shoe.webp`, 96);

  assert.equal(cloudinaryImageUrl(optimized, 96), optimized);
  assert.equal(cloudinaryImageUrl(optimized, 192), optimized);
});

test('leaves other hosts, local previews, private URLs and signed paths untouched', () => {
  for (const source of [
    '/brand/logo-mark.webp',
    'blob:https://p4.test/preview',
    'data:image/webp;base64,AAAA',
    'https://example.com/image/upload/photo.webp',
    'https://res.cloudinary.com.evil.test/p4/image/upload/photo.webp',
    'https://res.cloudinary.com/p4/image/authenticated/photo.webp',
    'https://api.cloudinary.com/v1_1/p4/image/download?signature=secret',
    `${base}s--signature--/v1/products/shoe.webp`,
    `${base}v1/products/shoe.webp?__cld_token__=secret`,
    '',
  ]) {
    assert.equal(cloudinaryImageUrl(source, 96), source);
  }
});

test('only adds valid widths and preserves named, conditional and height-based sizing', () => {
  for (const width of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.equal(cloudinaryImageUrl(`${base}shoe.webp`, width), `${base}f_auto,q_auto/shoe.webp`);
  }
  assert.equal(
    cloudinaryImageUrl(`${base}shoe.webp`, 95.5),
    `${base}f_auto,q_auto,w_96,c_limit/shoe.webp`,
  );

  for (const transform of ['t_thumbnail', 'h_100', 'if_w_gt_100/c_scale,w_100/if_end']) {
    assert.equal(
      cloudinaryImageUrl(`${base}${transform}/v1/shoe.webp`, 96),
      `${base}f_auto,q_auto/${transform}/v1/shoe.webp`,
    );
  }
});
