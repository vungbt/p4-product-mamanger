/** Stable names shared by SDK generation and the API documentation. */
export function operationNames(operationId, method) {
  const words = operationId
    .replace('_api_', '_')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean);
  const title = (word) => word[0].toUpperCase() + word.slice(1);
  const helper = words[0] + words.slice(1).map(title).join('');
  return {
    helper,
    hook: `use${title(helper)}`,
    input: `${title(helper)}Input`,
    options: `${helper}${method === 'get' ? 'QueryOptions' : 'MutationOptions'}`,
  };
}
