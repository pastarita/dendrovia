export { registerServiceWorker, invalidateSWCache, precacheURLs } from './register';
export type { SWRegistrationConfig, SWController } from './register';
// Note: service-worker.ts is NOT exported — it's served as a standalone script.
