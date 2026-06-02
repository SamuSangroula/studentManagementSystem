import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import {
  createUser,
  deleteUserById,
  findUserByEmail,
  listUsers,
  sanitizeUser,
  updateUserById
} from '../models/userModel.js';

export async function listUsersHandler(req, res) {
  const users = await listUsers();
  return res.json({ users: users.map(sanitizeUser) });
}

export async function createUserHandler(req, res) {
  const { name, email, password, role } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!name || !normalizedEmail || !password || !role) {
    return res.status(400).json({ message: 'Name, email, password, role are required' });
  }

  if (!['student', 'teacher', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  const exists = await findUserByEmail(normalizedEmail);
  if (exists) {
    return res.status(409).json({ message: 'Email already exists' });
  }

  const user = {
    id: uuid(),
    name,
    email: normalizedEmail,
    passwordHash: await bcrypt.hash(password, 10),
    role,
    active: true,
    createdAt: new Date().toISOString()
  };

  await createUser(user);
  return res.status(201).json({ user: sanitizeUser(user) });
}

export async function updateUserHandler(req, res) {
  const { role, active, name } = req.body;
  const values = {};

  if (role && ['student', 'teacher', 'admin'].includes(role)) {
    values.role = role;
  }

  if (typeof active === 'boolean') {
    values.active = active;
  }

  if (name) {
    values.name = name;
  }

  const user = await updateUserById(req.params.id, values);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json({ user: sanitizeUser(user) });
}

export async function deleteUserHandler(req, res) {
  const deleted = await deleteUserById(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: 'User not found' });
  }
  return res.json({ deleted: sanitizeUser(deleted) });
}

export async function resetPasswordHandler(req, res) {
  const { password } = req.body;
  if (!password || password.length < 3) {
    return res.status(400).json({ message: 'Password must be at least 3 characters' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await updateUserById(req.params.id, { passwordHash });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  return res.json({ message: 'Password reset successfully', user: sanitizeUser(user) });
}
