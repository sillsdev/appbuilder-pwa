import { writable } from 'svelte/store';

const logsStorage = localStorage.logs;
// This doesn't have to be a store, but we could add UI to interact with the store?
export const logs = writable(logsStorage ? JSON.parse(logsStorage) : {});
