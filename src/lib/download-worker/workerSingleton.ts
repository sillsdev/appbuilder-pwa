let worker: Worker | null = null;

export function getWorker() {
    if (worker) return worker;

    worker = new Worker(new URL('./workerScript.ts', import.meta.url), { type: 'module' });

    return worker;
}
