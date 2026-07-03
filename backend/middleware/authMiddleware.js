const jwt = require("jsonwebtoken");

const authMiddleware = function (req, res, next) {
    const token = req.header("Authorization");

    if (!token) {
        return res.status(401).json({ message: "No token, authorization denied" });
    }

    try {
        // Remove Bearer if present
        const tokenString = token.startsWith("Bearer ") ? token.slice(7, token.length).trim() : token;

        const decoded = jwt.verify(tokenString, process.env.JWT_SECRET);

        if (decoded.id === 'admin_master_id') {
            decoded.id = 'ad0000000000000000000000';
        }

        // This middleware is now shared. Ideally we should separate Admin/User or add roles.
        // For now, we will just attach 'user' to req. The existing admin routes use 'req.admin'.
        // We can check if the decoded id belongs to an admin or user if needed.
        // But the previous implementation set req.admin = decoded.id.
        // Let's set both for compatibility, but we should refine this if we have strict roles.
        // Since admin status isn't checking DB in previous code, it just trusted the token.
        // We will set req.user = decoded;
        
        req.user = decoded; // Standard way
        req.admin = decoded.id; // For backward compatibility with existing admin controller if any

        next();
    } catch (err) {
        res.status(401).json({ message: "Token is not valid" });
    }
};

const optionalAuth = function (req, res, next) {
    const token = req.header("Authorization");
    if (!token || token === "Bearer null") {
        return next();
    }
    try {
        const tokenString = token.startsWith("Bearer ") ? token.slice(7, token.length).trim() : token;
        if (tokenString === "null") return next();
        const decoded = jwt.verify(tokenString, process.env.JWT_SECRET);
        if (decoded.id === 'admin_master_id') decoded.id = 'ad0000000000000000000000';
        req.user = decoded;
        req.admin = decoded.id;
        next();
    } catch (err) {
        next();
    }
};

module.exports = authMiddleware;
module.exports.optional = optionalAuth;
