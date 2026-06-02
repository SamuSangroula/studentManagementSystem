import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { createUser, findUserByEmail } from '../models/userModel.js';

export async function ensureSeedData() {
  const existingAdmin = await findUserByEmail('admin@school.com');

  if (!existingAdmin) {
    await createUser({
      id: uuid(),
      name: 'System Admin',
      email: 'admin@school.com',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: 'admin',
      active: true,
      createdAt: new Date().toISOString()
    });
  }
}
