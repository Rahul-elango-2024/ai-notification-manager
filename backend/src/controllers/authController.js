const authService = require("../services/authService");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validRoles = ["Admin", "Manager", "Employee"];

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    // Validation: Missing fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "Name, email, password, and role are required." });
    }

    // Validation: Empty strings
    if (typeof name !== 'string' || name.trim() === '' || 
        typeof email !== 'string' || email.trim() === '' ||
        typeof password !== 'string' || password.trim() === '' ||
        typeof role !== 'string' || role.trim() === '') {
      return res.status(400).json({ error: "Fields cannot be empty." });
    }

    // Validation: Email format
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    // Validation: Password length
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long." });
    }

    // Validation: Role values
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role. Allowed roles are: Admin, Manager, Employee." });
    }

    const user = await authService.registerUser({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      department: department ? department.trim() : null
    });

    console.log(`✅ Registration Success: ${email}`);

    res.status(201).json({
      message: "User registered successfully.",
      user
    });
  } catch (error) {
    if (error.status === 409) {
      console.warn(`⚠️ Registration Failed (Duplicate): ${req.body.email}`);
      return res.status(409).json({ error: error.message });
    }
    console.error(`❌ Registration Failed: ${error.message}`);
    res.status(500).json({ error: "Internal server error during registration." });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const result = await authService.loginUser(email.toLowerCase().trim(), password);

    console.log(`✅ Login Success: ${email}`);
    res.status(200).json(result);
  } catch (error) {
    if (error.status === 401) {
      console.warn(`⚠️ Invalid Password/Email: ${req.body.email}`);
      return res.status(401).json({ error: error.message });
    }
    if (error.status === 403) {
      console.warn(`⚠️ Inactive User Login Attempt: ${req.body.email}`);
      return res.status(403).json({ error: error.message });
    }
    console.error(`❌ Login Failed: ${error.message}`);
    res.status(500).json({ error: "Internal server error during login." });
  }
};

exports.getMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await authService.getUserById(userId);
    res.status(200).json(user);
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ error: error.message });
    }
    console.error(`❌ Fetch Profile Failed: ${error.message}`);
    res.status(500).json({ error: "Internal server error fetching profile." });
  }
};
