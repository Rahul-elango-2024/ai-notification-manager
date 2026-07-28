const { verifyToken } = require("../utils/jwt");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Access denied. No token provided or invalid format.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        error: "Access denied. Token missing.",
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    // Attach decoded user to req.user
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired. Please login again." });
    }
    
    return res.status(401).json({ error: "Invalid token." });
  }
};

module.exports = authMiddleware;
