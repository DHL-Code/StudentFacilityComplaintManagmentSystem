const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Received Token:', token); // Debugging: Log the token

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded Token:', decoded); // Debugging: Log the decoded token
        req.user = { id: decoded.id }; // Ensure req.user is set correctly
        next();
    } catch (err) {
        console.error('Token Verification Error:', err); // Debugging: Log token errors
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = authMiddleware;