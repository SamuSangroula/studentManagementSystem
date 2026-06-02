import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { createToken } from '../middleware/auth.js';
import { createUser, findActiveUserById, findUserByEmail, sanitizeUser } from '../models/userModel.js';

export async function register(req, res) {
  const { name, email, password, role } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!name || !normalizedEmail || !password || !role) {
    return res.status(400).json({ message: 'Name, email, password and role are required' });
  }

  if (role !== 'student') {
    return res.status(403).json({ message: 'Public registration is for students only. Teacher and admin accounts are created by administrators.' });
  }

  // Students must use a gmail address for self-registration
  if (role === 'student' && !normalizedEmail.endsWith('@gmail.com')) {
    return res.status(403).json({ message: 'Students must use a @gmail.com address' });
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
  return res.status(201).json({ message: 'Registration successful', user: sanitizeUser(user) });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();

  let user = await findUserByEmail(normalizedEmail);

  // Auto-provision demo accounts if they don't exist
  if (!user) {
    if (normalizedEmail === 'admin@school.com' && password === 'admin123') {
      user = { id: uuid(), name: 'System Admin', email: 'admin@school.com', passwordHash: await bcrypt.hash('admin123', 10), role: 'admin', active: true, createdAt: new Date().toISOString() };
      await createUser(user);
    } else if (normalizedEmail === 'teacher@system.com' && password === '123') {
      user = { id: uuid(), name: 'Demo Teacher', email: 'teacher@system.com', passwordHash: await bcrypt.hash('123', 10), role: 'teacher', active: true, createdAt: new Date().toISOString() };
      await createUser(user);
    }
  }

  if (!user || !user.active) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  let valid = await bcrypt.compare(password || '', user.passwordHash);
  if (!valid && password === user.passwordHash) {
    valid = true; // Support raw plain-text password from manual database edits
  }
  
  // Only restrict the fixed admin account email
  if (user.role === 'admin' && user.email !== 'admin@school.com') {
    return res.status(403).json({ message: 'Admin login blocked: Authorized email required' });
  }

  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = createToken(user);
  return res.json({ token, user: sanitizeUser(user) });
}

export async function me(req, res) {
  const user = await findActiveUserById(req.user.id);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  return res.json({ user: sanitizeUser(user) });
}
