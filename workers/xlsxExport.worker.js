import { parentPort, workerData } from 'worker_threads';
import * as XLSX from 'xlsx';

try {
  const { rows } = workerData;
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Members');
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  parentPort.postMessage({ result: buffer });
} catch (err) {
  parentPort.postMessage({ error: err.message });
}
