import bcrypt from 'bcrypt';
import db from '../models/index.js';
import generateToken from '../utils/token.util.js';

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await db.User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);
    return res.status(200).json({ message: 'Login successful', token });
  } catch (err) {
    return res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

export default {
  login
};
