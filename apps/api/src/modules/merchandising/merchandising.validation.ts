import { requestBody } from '@p4/server-core';
import type { MerchandisingPayload, NavigationItem } from '@p4/shared';
import type { Request } from 'express';
import { safeContentUrl } from '../content/content.validation.js';

export function merchandisingInput(
  req: Request,
  kind: MerchandisingPayload['kind'],
): MerchandisingPayload {
  const body = requestBody(req);
  if (kind === 'collection')
    return {
      kind,
      title: body.text('title', 200),
      productIds: body.strings('productIds', 100, 128),
    };
  if (kind === 'banner') {
    let href: string;
    try {
      href = safeContentUrl(body.text('href', 1000));
    } catch {
      return body.invalid('href');
    }
    return {
      kind,
      title: body.text('title', 200),
      imageFileId: body.text('imageFileId', 36),
      href,
      placement: body.enum('placement', ['home', 'shop']),
    };
  }
  if (kind === 'navigation') {
    let count = 0;
    const ids = new Set<string>();
    const nodes = (raw: unknown, depth: number): NavigationItem[] => {
      if (depth > 5 || !Array.isArray(raw) || raw.length > 30) return body.invalid('items');
      return raw.map((value: unknown): NavigationItem => {
        if (
          ++count > 100 ||
          !value ||
          typeof value !== 'object' ||
          !('id' in value) ||
          !('label' in value) ||
          !('href' in value) ||
          typeof value.id !== 'string' ||
          value.id.length > 80 ||
          ids.has(value.id) ||
          typeof value.label !== 'string' ||
          value.label.length > 200 ||
          typeof value.href !== 'string'
        )
          return body.invalid('items');
        ids.add(value.id);
        let href: string;
        try {
          href = safeContentUrl(value.href);
        } catch {
          return body.invalid('items');
        }
        return {
          id: value.id,
          label: value.label,
          href,
          children: 'children' in value ? nodes(value.children, depth + 1) : [],
        };
      });
    };
    return { kind, items: nodes(body.data.items, 0) };
  }
  const raw: unknown = body.data.sections;
  if (!Array.isArray(raw) || raw.length > 30) return body.invalid('sections');
  const sections = raw.map((value: unknown) => {
    if (
      !value ||
      typeof value !== 'object' ||
      !('id' in value) ||
      !('type' in value) ||
      !('entryId' in value) ||
      typeof value.id !== 'string' ||
      typeof value.entryId !== 'string' ||
      !['collection', 'banner'].includes(String(value.type))
    )
      return body.invalid('sections');
    const type: 'collection' | 'banner' = value.type === 'collection' ? 'collection' : 'banner';
    return { id: value.id, type, entryId: value.entryId };
  });
  if (new Set(sections.map((section) => section.id)).size !== sections.length)
    return body.invalid('sections');
  return { kind: 'home', sections };
}
