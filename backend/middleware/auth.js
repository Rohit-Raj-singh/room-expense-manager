const jwt = require("jsonwebtoken");

// Express middleware: validates JWT and attaches req.user
function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ message: "Missing Authorization header" });
    const [, token] = header.split(" ");
    if (!token) return res.status(401).json({ message: "Invalid Authorization header" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = { authMiddleware };

