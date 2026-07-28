const pool = require("../db");
const { hashPassword, comparePassword } = require("../utils/password");
const { generateToken } = require("../utils/jwt");

class AuthService {
  async registerUser(userData) {
    const { name, email, password, role, department } = userData;

    // Check for duplicate email
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      const error = new Error("Email already in use");
      error.status = 409;
      throw error;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, department) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, name, email, role, department, is_active, created_at, updated_at`,
      [name, email, hashedPassword, role, department]
    );

    return result.rows[0];
  }

  async loginUser(email, plainPassword) {
    // Find user by email
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      const error = new Error("Invalid email or password");
      error.status = 401;
      throw error;
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      const error = new Error("User account is inactive");
      error.status = 403;
      throw error;
    }

    // Verify password
    const isPasswordValid = await comparePassword(plainPassword, user.password);
    if (!isPasswordValid) {
      const error = new Error("Invalid email or password");
      error.status = 401;
      throw error;
    }

    // Generate JWT
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      department: user.department,
    };

    const token = generateToken(payload);

    // Return token and user (without password)
    const { password, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword };
  }

  async getUserById(id) {
    const result = await pool.query(
      `SELECT id, name, email, role, department, is_active, created_at, updated_at 
       FROM users WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    return result.rows[0];
  }
}

module.exports = new AuthService();
