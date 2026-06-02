import { v4 as uuid } from 'uuid';
import { unlink } from 'fs/promises';
import path from 'path';
import { createMaterial, listMaterials, findMaterialById, deleteMaterialById, updateMaterialById } from '../models/materialModel.js';
import { createNotice, listNotices, findNoticeById, deleteNoticeById, updateNoticeById } from '../models/noticeModel.js';

function toAbsoluteUploadPath(fileUrl) {
  if (!fileUrl || !fileUrl.startsWith('/uploads/')) {
    return null;
  }
  const fileName = fileUrl.replace('/uploads/', '');
  return path.join(process.cwd(), 'uploads', fileName);
}

async function tryDeleteFile(fileUrl) {
  const absolutePath = toAbsoluteUploadPath(fileUrl);
  if (!absolutePath) {
    return;
  }
  try {
    await unlink(absolutePath);
  } catch {
    // Ignore missing file or filesystem cleanup failures.
  }
}

export async function createMaterialHandler(req, res) {
  const { title, type, url, courseId } = req.body;
  
  // Allow either URL or file upload
  const materialUrl = url || (req.file ? `/uploads/${req.file.filename}` : null);
  
  if (!title || !type || !materialUrl) {
    return res.status(400).json({ message: 'Title, type, and either URL or file are required' });
  }

  const material = {
    id: uuid(),
    title,
    type: req.file ? 'file' : type,
    url: materialUrl,
    courseId: courseId || null,
    createdBy: req.user.id,
    createdAt: new Date().toISOString()
  };

  await createMaterial(material);
  return res.status(201).json({ material });
}

export async function createCourseMaterialHandler(req, res) {
  const { courseId } = req.params;
  const { title, type, url } = req.body;
  
  // Allow either URL or file upload
  const materialUrl = url || (req.file ? `/uploads/${req.file.filename}` : null);
  
  if (!title || !type || !materialUrl) {
    return res.status(400).json({ message: 'Title, type, and either URL or file are required' });
  }

  const material = {
    id: uuid(),
    title,
    type: req.file ? 'file' : type,
    url: materialUrl,
    courseId,
    createdBy: req.user.id,
    createdAt: new Date().toISOString()
  };

  await createMaterial(material);
  return res.status(201).json({ material });
}

export async function deleteMaterialHandler(req, res) {
  const { id } = req.params;

  const material = await findMaterialById(id);
  if (!material) {
    return res.status(404).json({ message: 'Material not found' });
  }

  // Verify owner or admin
  if (material.createdBy !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to delete this material' });
  }

  // Delete the file if it was uploaded
  if (material.url && material.url.startsWith('/uploads/')) {
    await tryDeleteFile(material.url);
  }

  await deleteMaterialById(id);
  return res.json({ message: 'Material deleted' });
}

export async function updateMaterialHandler(req, res) {
  const { id } = req.params;
  const { title, type, url, courseId } = req.body;

  const material = await findMaterialById(id);
  if (!material) {
    return res.status(404).json({ message: 'Material not found' });
  }

  // Verify owner or admin
  if (material.createdBy !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to update this material' });
  }

  const updates = {};
  if (title) updates.title = title;
  if (type) updates.type = type;
  if (url) updates.url = url;
  if (courseId !== undefined) updates.courseId = courseId || null;

  const updated = await findMaterialById(id);
  Object.assign(updated, updates);
  const result = await updateMaterialById(id, updates);
  return res.json({ material: result });
}

export async function listMaterialsHandler(req, res) {
  const materials = await listMaterials();
  return res.json({ materials });
}

export async function createNoticeHandler(req, res) {
  const { title, body } = req.body;
  if (!title || !body) {
    return res.status(400).json({ message: 'Title and body are required' });
  }

  const notice = {
    id: uuid(),
    title,
    body,
    createdBy: req.user.id,
    createdAt: new Date().toISOString()
  };

  await createNotice(notice);
  return res.status(201).json({ notice });
}

export async function deleteNoticeHandler(req, res) {
  const { id } = req.params;

  const notice = await findNoticeById(id);
  if (!notice) {
    return res.status(404).json({ message: 'Notice not found' });
  }

  // Verify owner or admin
  if (notice.createdBy !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to delete this notice' });
  }

  await deleteNoticeById(id);
  return res.json({ message: 'Notice deleted' });
}

export async function updateNoticeHandler(req, res) {
  const { id } = req.params;
  const { title, body } = req.body;

  const notice = await findNoticeById(id);
  if (!notice) {
    return res.status(404).json({ message: 'Notice not found' });
  }

  // Verify owner or admin
  if (notice.createdBy !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to update this notice' });
  }

  const updates = {};
  if (title) updates.title = title;
  if (body) updates.body = body;

  const result = await updateNoticeById(id, updates);
  return res.json({ notice: result });
}

export async function listNoticesHandler(req, res) {
  const notices = await listNotices();
  return res.json({ notices });
}
