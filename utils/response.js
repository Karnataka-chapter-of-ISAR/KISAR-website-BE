export function sendSuccess(res, { message = 'Success', data = null, statusCode = 200 } = {}) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function sendError(res, { message = 'Something went wrong', statusCode = 500, data = null } = {}) {
  return res.status(statusCode).json({
    success: false,
    message,
    data,
  });
}
