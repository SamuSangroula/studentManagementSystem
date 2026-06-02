import { v4 as uuid } from 'uuid';
import {
  createAttendance,
  findAttendanceByStudentAndDate,
  listAttendanceByStudent
} from '../models/attendanceModel.js';

export async function markPresent(req, res) {
  const d = new Date();
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const existing = await findAttendanceByStudentAndDate(req.user.id, date);

  if (existing) {
    return res.json({ attendance: existing, message: 'Already marked present' });
  }

  const record = {
    id: uuid(),
    studentId: req.user.id,
    date,
    status: 'present',
    markedAt: new Date().toISOString()
  };

  await createAttendance(record);
  return res.status(201).json({ attendance: record });
}

export async function myAttendance(req, res) {
  const records = await listAttendanceByStudent(req.user.id);
  return res.json({ attendance: records });
}
