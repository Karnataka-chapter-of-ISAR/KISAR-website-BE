// Thrown by the service layer for expected/business-rule failures.
// Controllers catch this and map it straight onto sendError({ message, statusCode, data }).
export class AppError extends Error {
  constructor(message, statusCode = 400, data = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.data = data;
  }
}
