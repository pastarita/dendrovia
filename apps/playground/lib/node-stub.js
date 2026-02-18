// Empty stub for Node.js built-ins that are imported by server-side modules
// in transpiled workspace packages. Turbopack needs this for client bundles.
export default {};
export const existsSync = () => false;
export const mkdirSync = () => {};
export const rmSync = () => {};
export const readFileSync = () => '';
export const writeFileSync = () => {};
export const createHash = () => ({ update: () => ({ digest: () => '' }) });
export const randomUUID = () => '';
