const { auth, db } = require('../config/firebase');

/**
 * Verifies the Firebase ID token from the Authorization header.
 * Attaches req.user = { uid, email, role } on success.
 */
const authMiddleware = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = header.split(' ')[1];
    const decoded = await auth.verifyIdToken(token);

    // Fetch role from Firestore
    const userSnap = await db.collection('users').doc(decoded.uid).get();
    const role = userSnap.exists ? userSnap.data().role || 'user' : 'user';

    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      role,
    };

    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(401).json({ error: 'Unauthorized – invalid token' });
  }
};

module.exports = authMiddleware;
