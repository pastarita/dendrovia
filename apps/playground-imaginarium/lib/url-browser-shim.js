/**
 * Browser shim for Node.js `url` module.
 *
 * Provides a no-op fileURLToPath so that imaginarium modules using
 * `dirname(fileURLToPath(import.meta.url))` at the top level
 * don't crash when bundled for the browser.
 */

export function fileURLToPath(url) {
  if (typeof url === 'string') return url.replace(/^file:\/\//, '');
  return '/';
}

export function pathToFileURL(path) {
  return new URL('file://' + path);
}

export function format(urlObj) {
  return urlObj.toString();
}

export function parse(urlStr) {
  return new URL(urlStr);
}
