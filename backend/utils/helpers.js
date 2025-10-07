// backend/utils/helpers.js
function clientIp(req) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '';
  return ip.replace('::ffff:', '');
}
function isValidEmail(v='') { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
module.exports = { clientIp, isValidEmail };
