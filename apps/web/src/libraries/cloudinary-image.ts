/** Optimizes public Cloudinary images at delivery time, leaving stored URLs intact. */
export function cloudinaryImageUrl(src: string, width?: number): string {
  const delivery = /^(https?:\/\/res\.cloudinary\.com\/[^/?#]+\/image\/upload\/)([^?#]+)(.*)$/.exec(
    src,
  );

  if (!delivery) return src;

  const [, prefix, path, suffix] = delivery;

  // Signed delivery URLs must retain the path covered by their signature.
  if (path.startsWith('s--') || /[?&](?:signature|__cld_token__)=/.test(suffix)) return src;

  const segments = path.split('/');
  const transformations: string[] = [];

  // Transformation components precede the version/public ID. Match Cloudinary's
  // parameter names so an ordinary unversioned folder is not treated as a transform.
  for (const segment of segments.slice(0, -1)) {
    if (!/^(?:a|ar|b|bo|c|co|cs|d|dl|dn|dpr|e|f|fl|g|h|if|l|o|p|pg|q|r|t|u|w|x|y|z)_/.test(segment))
      break;

    transformations.push(...segment.split(','));
  }

  const additions: string[] = [];

  if (!transformations.some((value) => value.startsWith('f_'))) additions.push('f_auto');
  if (!transformations.some((value) => value.startsWith('q_'))) additions.push('q_auto');

  // Existing crops, dimensions and named/conditional transforms keep their sizing.
  if (
    width !== undefined &&
    Number.isFinite(width) &&
    width > 0 &&
    !transformations.some((value) => /^(?:ar|c|dpr|h|if|t|w)_/.test(value))
  ) {
    additions.push(`w_${Math.ceil(width)}`, 'c_limit');
  }

  return additions.length ? `${prefix}${additions.join(',')}/${path}${suffix}` : src;
}
