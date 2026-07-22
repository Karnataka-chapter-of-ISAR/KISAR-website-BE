export function toValidateImportResponseDto({ batchId, totalRows, validCount, welcomeEmailsQueued }) {
  return { batchId, totalRows, validCount, welcomeEmailsQueued };
}
