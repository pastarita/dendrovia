export type { SWController, SWRegistrationConfig } from './register';
export { invalidateSWCache, precacheURLs, registerServiceWorker } from './register';
// Note: service-worker.ts is NOT exported — it's served as a standalone script.
