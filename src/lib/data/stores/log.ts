import { persistedLocal } from './storage';

// This doesn't have to be a store, but we could add UI to interact with the store?
export const logs = persistedLocal('logs', {} as Record<string, Record<string, unknown>>);
