import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

export default generateToken;