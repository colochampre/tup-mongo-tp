import mongoose from 'mongoose';
import Course from './models/Course.js';
import Student from './models/Student.js';

export const COLLECTION_LABELS = {
  courses: 'Cursos',
  students: 'Alumnos'
};

export const MODELED = { courses: Course, students: Student };

const COLLECTION_NAME_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export function isModeled(name) {
  return name in MODELED;
}

export function getLabel(name) {
  return COLLECTION_LABELS[name] || name;
}

export function getNativeCollection(name) {
  return mongoose.connection.db.collection(name);
}

export function isValidCollectionName(name) {
  return COLLECTION_NAME_REGEX.test(name);
}

export async function listAllCollections() {
  const collectionsInfo = await mongoose.connection.db.listCollections().toArray();
  const collections = await Promise.all(
    collectionsInfo.map(async (col) => ({
      name: col.name,
      label: getLabel(col.name),
      count: await mongoose.connection.db.collection(col.name).countDocuments(),
      modeled: isModeled(col.name)
    }))
  );
  return collections.sort((a, b) => a.name.localeCompare(b.name));
}

export function parseObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return new mongoose.Types.ObjectId(id);
}
