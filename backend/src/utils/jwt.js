const jwt = require("jsonwebtoken");

if (!process.env.JWT_SECRET) {
  throw new Error("FATAL ERROR: JWT_SECRET is not defined in the environment.");
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

/**
 * Generate a JWT token for a user.
 * Supports passing custom expiration for future refresh token implementation.
 * 
 * @param {Object} payload - The user data to encode (e.g., { id, email, role, department })
 * @param {string} [expiresIn] - Optional custom expiration time (defaults to JWT_EXPIRES_IN)
 * @returns {string} - The generated JWT token
 */
function generateToken(payload, expiresIn = JWT_EXPIRES_IN) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verify a JWT token.
 * 
 * @param {string} token - The JWT token to verify
 * @returns {Object} - The decoded payload if verification is successful
 * @throws {Error} - Throws error if token is invalid or expired
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = {
  generateToken,
  verifyToken,
};
