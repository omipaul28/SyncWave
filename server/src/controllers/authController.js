const fs = require('../services/firestoreService');

const verifyUser = async (req, res) => {
  try {
    const { uid, email } = req.user;
    let user = await fs.getUserById(uid);

    if (!user) {
      // First login – create user document
      user = await fs.createUser(uid, {
        email,
        username: email.split('@')[0],
        avatar: null,
      });
    }

    res.json({ user });
  } catch (err) {
    console.error('verifyUser error:', err);
    res.status(500).json({ error: 'Failed to verify user' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await fs.getUserById(req.user.uid);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

module.exports = { verifyUser, getMe };
