import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { formatAsTaiwanTime } from '../utils/time.util.js';

dotenv.config();

const generateToken = (user) => {
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: formatAsTaiwanTime(user.createdAt),
    updatedAt: formatAsTaiwanTime(user.updatedAt),
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

export default generateToken;