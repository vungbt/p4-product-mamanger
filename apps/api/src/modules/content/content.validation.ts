import { requestBody } from '@p4/server-core';
import type { ContentBlock, ContentDraftInput } from '@p4/shared';
import type { Request } from 'express';
import { normalizedSlug } from '../catalog/catalog.service.js';

export function safeContentUrl(value: string) {
  if (
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !value.includes('\\') &&
    ![...value].some((character) => character.charCodeAt(0) <= 32)
  )
    return value;
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Invalid URL');
  return url.href;
}

export function contentInput(req: Request): ContentDraftInput {
  const body = requestBody(req);
  const raw: unknown = body.data.body;
  if (
    !Array.isArray(raw) ||
    raw.length < 1 ||
    raw.length > 200 ||
    JSON.stringify(raw).length > 200000
  )
    return body.invalid('body');
  const blocks = raw.map((block: unknown): ContentBlock => {
    if (!block || typeof block !== 'object' || !('type' in block)) return body.invalid('body');
    if (
      (block.type === 'paragraph' || block.type === 'heading') &&
      'text' in block &&
      typeof block.text === 'string' &&
      block.text.length < 10000 &&
      !/[<>]/.test(block.text)
    )
      return { type: block.type, text: block.text };
    if (
      block.type === 'image' &&
      'fileId' in block &&
      'alt' in block &&
      typeof block.fileId === 'string' &&
      /^[a-f0-9-]{36}$/i.test(block.fileId) &&
      typeof block.alt === 'string' &&
      block.alt.length < 255
    )
      return { type: 'image', fileId: block.fileId, alt: block.alt };
    if (
      block.type === 'link' &&
      'label' in block &&
      'href' in block &&
      typeof block.label === 'string' &&
      block.label.length < 255 &&
      typeof block.href === 'string'
    ) {
      try {
        return { type: 'link', label: block.label, href: safeContentUrl(block.href) };
      } catch {
        return body.invalid('body');
      }
    }
    return body.invalid('body');
  });
  return {
    slug: normalizedSlug(body.text('slug', 160)),
    title: body.text('title', 200),
    excerpt: body.optionalText('excerpt', 2000) ?? '',
    body: blocks,
    coverFileId:
      body.data.coverFileId === null || body.data.coverFileId === undefined
        ? null
        : body.text('coverFileId', 36),
    taxonomyIds: body.data.taxonomyIds === undefined ? [] : body.strings('taxonomyIds', 30, 36),
    seoTitle: body.optionalText('seoTitle') ?? '',
    seoDescription: body.optionalText('seoDescription') ?? '',
  };
}
