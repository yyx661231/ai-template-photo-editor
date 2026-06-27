export function getCorsHeaders() {
  const allowOrigin = process.env.CORS_ALLOW_ORIGIN || '*';

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
