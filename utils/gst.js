// GST on the event entry fee, charged on top of the fee. Rates are percentages
// from the environment (CGST_RATE_PERCENT / SGST_RATE_PERCENT) and default to 9.
// Read per call so the values are picked up regardless of when dotenv loads.
const DEFAULT_RATE_PERCENT = 9;

function ratePercent(envName) {
  const raw = process.env[envName];
  if (raw === undefined || raw.trim() === '') return DEFAULT_RATE_PERCENT;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : DEFAULT_RATE_PERCENT;
}

export const cgstRatePercent = () => ratePercent('CGST_RATE_PERCENT');
export const sgstRatePercent = () => ratePercent('SGST_RATE_PERCENT');

// SAC code for the service being invoiced (event / conference admission).
export const INVOICE_SAC_CODE = '999699';

const toPaise = (rupees) => Math.round(rupees * 100);
const toRupees = (paise) => paise / 100;

// Works in whole paise so the three parts always add up to the total exactly.
export function calculateGst(baseAmount) {
  const basePaise = toPaise(baseAmount);
  const cgstPaise = Math.round((basePaise * cgstRatePercent()) / 100);
  const sgstPaise = Math.round((basePaise * sgstRatePercent()) / 100);

  return {
    baseAmount: toRupees(basePaise),
    cgst: toRupees(cgstPaise),
    sgst: toRupees(sgstPaise),
    totalAmount: toRupees(basePaise + cgstPaise + sgstPaise),
  };
}

export const roundMoney = (amount) => toRupees(toPaise(amount));

// Indian financial year (April-March) containing `date`, e.g. 2026-27.
export function financialYear(date) {
  const ist = new Date(new Date(date).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const startYear = ist.getMonth() >= 3 ? ist.getFullYear() : ist.getFullYear() - 1;
  return `${startYear}-${String(startYear + 1).slice(-2)}`;
}

export const formatInvoiceNumber = (fy, seq) => `KISAR/${fy}/${String(seq).padStart(4, '0')}`;
