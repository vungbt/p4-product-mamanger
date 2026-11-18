/**
 * Search params to update from. React Router passes the params of the current render to a
 * functional `setSearchParams`, so two updates before the next render (e.g. two filters changed
 * quickly, or a debounced search) would overwrite each other; the live URL never does.
 */
export function latestSearchParams() {
  return new URLSearchParams(window.location.search);
}
