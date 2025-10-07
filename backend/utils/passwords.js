// backend/utils/passwords.js
const bcrypt = require('bcrypt');
const rounds = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);
async function hashPassword(p) { return bcrypt.hash(p, rounds); }
module.exports = { hashPassword };
