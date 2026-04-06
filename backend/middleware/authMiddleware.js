const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader)
    return res.status(401).json({ message: "Access Denied. No token provided" });

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;   // user info saved
    next();

  } catch (error) {
    return res.status(401).json({ message: "Invalid Token" });
  }
};


/* ROLE AUTHORIZATION (FIXED VERSION) */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {

    if (!req.user)
      return res.status(403).json({ message: "User not authenticated" });

    // Convert both to uppercase to avoid case mismatch
    const userRole = req.user.role?.toUpperCase();
    const allowedRoles = roles.map(role => role.toUpperCase());

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: "Access Forbidden: Insufficient role"
      });
    }

    next();
  };
};

module.exports = {
  verifyToken,
  authorizeRoles
};