import fs from 'fs';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'data', 'db.json');

const defaultDb = {
  users: [],
  courses: [],
  assignments: [],
  submissions: [],
  attendance: [],
  materials: [],
  notices: []
};

export function readDb() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(defaultDb, null, 2));
    return structuredClone(defaultDb);
  }

  const raw = fs.readFileSync(dbPath, 'utf-8');
  if (!raw.trim()) {
    fs.writeFileSync(dbPath, JSON.stringify(defaultDb, null, 2));
    return structuredClone(defaultDb);
  }

  return JSON.parse(raw);
}

export function writeDb(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

export function updateDb(mutator) {
  const data = readDb();
  const updated = mutator(data) || data;
  writeDb(updated);
  return updated;
}
