import { Worker } from 'worker_threads';

// Runs workerUrl in a worker thread with workerData, resolving with whatever
// it posts as `{ result }` (or rejecting on `{ error }` / a thread crash).
// Used to keep CPU-heavy, synchronous work (XLSX parsing/building) off the
// main event loop so it doesn't stall other requests while it runs.
export function runWorker(workerUrl, workerData) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerUrl, { workerData });
    let settled = false;

    worker.once('message', (msg) => {
      settled = true;
      worker.terminate();
      if (msg?.error) reject(new Error(msg.error));
      else resolve(msg.result);
    });

    worker.once('error', (err) => {
      settled = true;
      reject(err);
    });

    worker.once('exit', (code) => {
      if (!settled && code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
    });
  });
}
