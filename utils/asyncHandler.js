// Wraps an async Express handler so a thrown/rejected error is forwarded to
// next(err) instead of becoming an unhandled promise rejection — Express 4
// does not do this automatically for async handlers, and an unhandled
// rejection crashes the whole process (Node 15+ default behavior).
export function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
}
