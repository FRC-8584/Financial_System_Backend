import bcrypt from 'bcrypt';
import db from '../models/index.js';

const register = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const existingUser = await db.User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    await db.User.create({
      name,
      email,
      password_hash,
      role: role || 'member'
    });

    return res.status(201).json({ message: 'Registration successed' });
  } catch (err) {
    return res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await db.User.findAll({
      attributes: { exclude: ['password_hash'] }
    });

    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user', error: err.message });
  }
};

const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await db.User.findByPk(id, {
      attributes: { exclude: ['password_hash'] }
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user', error: err.message });
  }
};

const getUsersByRole = async (req, res) => {
  const { role } = req.params;

  try {
    const users = await db.User.findAll({
      where: { role },
      attributes: { exclude: ['password_hash'] }
    });

    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users by role', error: err.message });
  }
};

const getMyProfile = async (req, res) => {
  try {
    const user = await db.User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] }
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user', error: err.message });
  }
};

const updateMyProfile = async (req, res) => {
  const { name } = req.body;
  try {
    const user = await db.User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.name = name || user.name;
    await user.save();
    res.status(200).json({ message: 'Profile updated', name: user.name });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile', error: err.message });
  }
};

export default {
  register,
  getAllUsers,
  getUserById,
  getUsersByRole,
  getMyProfile,
  updateMyProfile
};