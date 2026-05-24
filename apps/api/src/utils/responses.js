export function validationError(message, code = 'VALIDATION_ERROR') {
  return { code, message };
}
