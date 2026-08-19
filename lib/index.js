/**
 * dsh-search-switcher — server half.
 *
 * The server plugin exists so the Loader mounts this package and the
 * client-modules scanner discovers its `dsh.client` declaration. All real
 * behavior lives in the client bundle (lib/client.js), which registers the
 * composer seat next to the model picker and talks to the dsh-free-search
 * settings bridge (/api/dsh-free-search-settings).
 */
export const name = 'dsh-search-switcher'

export function apply() {
  // No server-side behavior: the settings bridge is owned by dsh-free-search.
}
