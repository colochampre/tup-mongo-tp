import express from 'express';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Course from './models/Course.js';
import Student from './models/Student.js';
import { toHtmlJson } from './helpers.js';
import {
  isModeled,
  getNativeCollection,
  isValidCollectionName,
  listAllCollections,
  parseObjectId
} from './collectionRegistry.js';

const STUDENT_LINK_SCHEMA = {
  _currentCollection: 'students',
  'materiasCursadas[].materia': { collection: 'courses', labelKey: 'nombre' }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));
app.use(express.static(join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// ==========================================
// SEED
// ==========================================
async function seedDatabase() {
  const courseCount = await Course.countDocuments();
  if (courseCount > 0) {
    console.log('ℹ️  La base de datos ya tiene datos. Omitiendo seed.');
    return;
  }

  console.log('🌱 Insertando datos de ejemplo...');

  const bd2 = await Course.create({ nombre: 'Base de Datos II', carrera: 'Ingeniería en Sistemas', cargaHoraria: 120 });
  const redes = await Course.create({ nombre: 'Redes de Computadoras', carrera: 'Ingeniería en Sistemas', cargaHoraria: 90 });
  const algo = await Course.create({ nombre: 'Algoritmos y Estructuras', carrera: 'Ingeniería en Sistemas', cargaHoraria: 150 });
  const prog2 = await Course.create({ nombre: 'Programación II', carrera: 'Ingeniería en Sistemas', cargaHoraria: 140 });
  const ingles = await Course.create({ nombre: 'Inglés II', carrera: 'Ingeniería en Sistemas', cargaHoraria: 60 });

  await Student.create([
    {
      nombre: 'Juan Pérez',
      legajo: '12345',
      email: 'juan@universidad.edu.ar',
      fechaInscripcion: new Date('2022-03-10'),
      materiasCursadas: [
        { materia: redes._id, notaFinal: 8, estado: 'Aprobada' },
        { materia: bd2._id, notaFinal: 10, estado: 'Aprobada' }
      ]
    },
    {
      nombre: 'María García',
      legajo: '67890',
      email: 'maria@universidad.edu.ar',
      fechaInscripcion: new Date('2021-04-15'),
      materiasCursadas: [
        { materia: algo._id, notaFinal: 9, estado: 'Aprobada' },
        { materia: redes._id, notaFinal: 4, estado: 'Libre' },
        { materia: ingles._id, notaFinal: 10, estado: 'Aprobada' }
      ]
    },
    {
      nombre: 'Lucas Rodríguez',
      legajo: '44556',
      email: 'lucas@universidad.edu.ar',
      fechaInscripcion: new Date('2023-02-20'),
      materiasCursadas: [
        { materia: prog2._id, notaFinal: 7, estado: 'Aprobada' },
        { materia: bd2._id, notaFinal: 5, estado: 'Regular' }
      ]
    },
    {
      nombre: 'Ana Fernández',
      legajo: '77889',
      email: 'ana@universidad.edu.ar',
      fechaInscripcion: new Date('2022-08-05'),
      materiasCursadas: [
        { materia: ingles._id, notaFinal: 8, estado: 'Aprobada' },
        { materia: prog2._id, notaFinal: 9, estado: 'Aprobada' }
      ]
    },
    {
      nombre: 'Diego Silva',
      legajo: '22334',
      email: 'diego@universidad.edu.ar',
      fechaInscripcion: new Date('2023-03-01'),
      materiasCursadas: [
        { materia: algo._id, notaFinal: 2, estado: 'Libre' }
      ]
    },
    {
      nombre: 'Sofia Martínez',
      legajo: '99001',
      email: 'sofia@universidad.edu.ar',
      fechaInscripcion: new Date('2021-02-14'),
      materiasCursadas: [
        { materia: bd2._id, notaFinal: 10, estado: 'Aprobada' },
        { materia: redes._id, notaFinal: 8, estado: 'Aprobada' },
        { materia: prog2._id, notaFinal: 9, estado: 'Aprobada' }
      ]
    },
    {
      nombre: 'Martín Gómez',
      legajo: '55667',
      email: 'martin@universidad.edu.ar',
      fechaInscripcion: new Date('2023-08-10'),
      materiasCursadas: []
    },
    {
      nombre: 'Camila Torres',
      legajo: '11223',
      email: 'camila@universidad.edu.ar',
      fechaInscripcion: new Date('2022-05-12'),
      materiasCursadas: [
        { materia: ingles._id, notaFinal: 6, estado: 'Regular' }
      ]
    },
    {
      nombre: 'Gastón Paz',
      legajo: '33445',
      email: 'gaston@universidad.edu.ar',
      fechaInscripcion: new Date('2021-03-01'),
      materiasCursadas: [
        { materia: algo._id, notaFinal: 7, estado: 'Aprobada' },
        { materia: prog2._id, notaFinal: 4, estado: 'Regular' }
      ]
    }
  ]);

  console.log('✅ Datos de ejemplo insertados.');
}

// ==========================================
// HELPERS
// ==========================================
function getBreadcrumbs(req, collection, currentDocLabel = null) {
  const breadcrumbs = [{ label: 'collections', url: '/' }];

  if (req.query.from) {
    breadcrumbs.push({ label: req.query.from, url: `/collections/${req.query.from}` });
  }

  if (!req.params.id && !req.query.from) {
    breadcrumbs.push({ label: collection, url: `/collections/${collection}` });
  } else {
    breadcrumbs.push({ label: collection, url: `/collections/${collection}` });
    if (req.params.id) {
      breadcrumbs.push({ label: currentDocLabel || req.params.id.slice(-6), url: null });
    }
  }

  return breadcrumbs;
}

function renderCollection(res, opts) {
  res.render('collection', {
    isGeneric: false,
    flash: null,
    ...opts
  });
}

function docsWithHtml(docs, linkSchema = {}) {
  return docs.map(doc => ({ ...doc, _html: toHtmlJson(doc, linkSchema) }));
}

// ==========================================
// INDEX + CREATE COLLECTION
// ==========================================
app.get('/', async (req, res) => {
  const collections = await listAllCollections();
  res.render('index', {
    collections,
    error: req.query.error || null,
    success: req.query.success || null
  });
});

app.post('/collections', async (req, res) => {
  const name = (req.body.name || '').trim();

  if (!isValidCollectionName(name)) {
    return res.redirect('/?error=Nombre+inv%C3%A1lido.+Us%C3%A1+letras,+n%C3%BAmeros+y+_');
  }

  const existing = await mongoose.connection.db.listCollections({ name }).toArray();
  if (existing.length > 0) {
    return res.redirect('/?error=La+colecci%C3%B3n+ya+existe');
  }

  await mongoose.connection.db.createCollection(name);
  res.redirect(`/?success=Colecci%C3%B3n+${encodeURIComponent(name)}+creada`);
});

app.post('/collections/:name/delete', async (req, res) => {
  const { name } = req.params;
  if (isModeled(name)) {
    return res.redirect('/?error=No+se+puede+eliminar+una+colecci%C3%B3n+del+sistema');
  }
  if (!isValidCollectionName(name)) {
    return res.redirect('/?error=Nombre+de+colecci%C3%B3n+inv%C3%A1lido');
  }
  try {
    await mongoose.connection.db.dropCollection(name);
    res.redirect(`/?success=Colecci%C3%B3n+${encodeURIComponent(name)}+eliminada`);
  } catch {
    res.redirect('/?error=Error+al+eliminar+la+colecci%C3%B3n');
  }
});

// ==========================================
// FORM ROUTES (before :id)
// ==========================================
app.get('/collections/courses/new', (req, res) => {
  res.render('new', {
    title: 'courses',
    isGeneric: false,
    queryText: 'db.courses.insertOne(...)',
    breadcrumbs: getBreadcrumbs(req, 'courses', 'new()'),
    error: null,
    jsonValue: ''
  });
});

app.get('/collections/students/new', (req, res) => {
  res.render('new', {
    title: 'students',
    isGeneric: false,
    queryText: 'db.students.insertOne(...)',
    breadcrumbs: getBreadcrumbs(req, 'students', 'new()'),
    error: null,
    jsonValue: ''
  });
});

app.post('/collections/courses', async (req, res) => {
  await Course.create({
    nombre: req.body.nombre,
    carrera: req.body.carrera,
    cargaHoraria: Number(req.body.cargaHoraria)
  });
  res.redirect('/collections/courses');
});

app.post('/collections/students', async (req, res) => {
  await Student.create({
    nombre: req.body.nombre,
    legajo: req.body.legajo,
    email: req.body.email,
    fechaInscripcion: req.body.fechaInscripcion ? new Date(req.body.fechaInscripcion) : new Date(),
    materiasCursadas: []
  });
  res.redirect('/collections/students');
});

// ==========================================
// STUDENTS: $push
// ==========================================
app.get('/collections/students/:id/push', async (req, res) => {
  const student = await Student.findById(req.params.id).lean();
  if (!student) return res.status(404).send('Alumno no encontrado');

  const courses = await Course.find().lean();
  res.render('push', {
    title: 'students',
    student,
    courses,
    queryText: `db.students.updateOne({ _id: ObjectId("${req.params.id}") }, { $push: { materiasCursadas: {...} } })`,
    breadcrumbs: getBreadcrumbs(req, 'students', `$push → ${student.nombre}`),
    error: null
  });
});

app.post('/collections/students/:id/push', async (req, res) => {
  const { materia, notaFinal, estado } = req.body;
  if (!materia || !notaFinal || !estado) {
    const student = await Student.findById(req.params.id).lean();
    const courses = await Course.find().lean();
    return res.render('push', {
      title: 'students',
      student,
      courses,
      queryText: `db.students.updateOne({ _id: ObjectId("${req.params.id}") }, { $push: { materiasCursadas: {...} } })`,
      breadcrumbs: getBreadcrumbs(req, 'students', `$push → ${student?.nombre || req.params.id}`),
      error: 'Completá todos los campos'
    });
  }

  await Student.updateOne(
    { _id: req.params.id },
    {
      $push: {
        materiasCursadas: {
          materia,
          notaFinal: Number(notaFinal),
          estado
        }
      }
    }
  );
  res.redirect(`/collections/students/${req.params.id}?updated=push`);
});

// ==========================================
// COURSES: updateOne
// ==========================================
app.get('/collections/courses/:id/edit', async (req, res) => {
  const doc = await Course.findById(req.params.id).lean();
  if (!doc) return res.status(404).send('Documento no encontrado');

  res.render('edit', {
    title: 'courses',
    isGeneric: false,
    doc,
    queryText: `db.courses.updateOne({ _id: ObjectId("${req.params.id}") }, { $set: {...} })`,
    breadcrumbs: getBreadcrumbs(req, 'courses', `edit → ${doc.nombre}`),
    error: null,
    jsonValue: ''
  });
});

app.post('/collections/courses/:id/edit', async (req, res) => {
  await Course.findByIdAndUpdate(req.params.id, {
    nombre: req.body.nombre,
    carrera: req.body.carrera,
    cargaHoraria: Number(req.body.cargaHoraria)
  });
  res.redirect(`/collections/courses/${req.params.id}?updated=edit`);
});

// ==========================================
// MODELED COLLECTIONS: find + delete + findOne
// ==========================================
app.get('/collections/courses', async (req, res) => {
  const docs = await Course.find().lean();
  renderCollection(res, {
    title: 'courses',
    queryText: 'db.courses.find({})',
    breadcrumbs: getBreadcrumbs(req, 'courses'),
    docs: docsWithHtml(docs),
    flash: req.query.updated === 'edit' ? 'Documento actualizado con updateOne' : null
  });
});

app.get('/collections/students', async (req, res) => {
  const docs = await Student.find().populate('materiasCursadas.materia').lean();
  renderCollection(res, {
    title: 'students',
    queryText: 'db.students.find({})',
    breadcrumbs: getBreadcrumbs(req, 'students'),
    docs: docsWithHtml(docs, STUDENT_LINK_SCHEMA),
    flash: null
  });
});

app.post('/collections/courses/:id/delete', async (req, res) => {
  await Course.findByIdAndDelete(req.params.id);
  await Student.updateMany(
    { 'materiasCursadas.materia': req.params.id },
    { $pull: { materiasCursadas: { materia: req.params.id } } }
  );
  res.redirect('/collections/courses');
});

app.post('/collections/students/:id/delete', async (req, res) => {
  await Student.findByIdAndDelete(req.params.id);
  res.redirect('/collections/students');
});

app.get('/collections/courses/:id', async (req, res) => {
  const doc = await Course.findById(req.params.id).lean();
  if (!doc) return res.status(404).send('Documento no encontrado');

  renderCollection(res, {
    title: 'courses',
    queryText: `db.courses.findOne({ _id: ObjectId("${req.params.id}") })`,
    breadcrumbs: getBreadcrumbs(req, 'courses', doc.nombre),
    docs: docsWithHtml([doc]),
    flash: req.query.updated === 'edit' ? 'Documento actualizado con updateOne' : null
  });
});

app.get('/collections/students/:id', async (req, res) => {
  const doc = await Student.findById(req.params.id).populate('materiasCursadas.materia').lean();
  if (!doc) return res.status(404).send('Documento no encontrado');

  renderCollection(res, {
    title: 'students',
    queryText: `db.students.findOne({ _id: ObjectId("${req.params.id}") })`,
    breadcrumbs: getBreadcrumbs(req, 'students', doc.nombre),
    docs: docsWithHtml([doc], STUDENT_LINK_SCHEMA),
    flash: req.query.updated === 'push' ? 'Materia agregada con $push' : null
  });
});

// ==========================================
// GENERIC COLLECTIONS (after static routes)
// ==========================================
app.get('/collections/:name', async (req, res) => {
  const { name } = req.params;
  const col = getNativeCollection(name);
  const exists = await mongoose.connection.db.listCollections({ name }).toArray();
  if (exists.length === 0) return res.status(404).send('Colección no encontrada');

  const docs = await col.find({}).toArray();
  renderCollection(res, {
    title: name,
    isGeneric: true,
    queryText: `db.${name}.find({})`,
    breadcrumbs: getBreadcrumbs(req, name),
    docs: docsWithHtml(docs),
    flash: req.query.updated ? 'Documento actualizado' : null
  });
});

app.get('/collections/:name/new', async (req, res) => {
  const { name } = req.params;
  if (isModeled(name)) return res.redirect(`/collections/${name}/new`);

  res.render('new', {
    title: name,
    isGeneric: true,
    queryText: `db.${name}.insertOne(...)`,
    breadcrumbs: getBreadcrumbs(req, name, 'new()'),
    error: null,
    jsonValue: '{\n  \n}'
  });
});

app.post('/collections/:name', async (req, res) => {
  const { name } = req.params;
  if (isModeled(name)) return res.redirect(`/collections/${name}`);

  let doc;
  try {
    doc = JSON.parse(req.body.json);
  } catch {
    return res.render('new', {
      title: name,
      isGeneric: true,
      queryText: `db.${name}.insertOne(...)`,
      breadcrumbs: getBreadcrumbs(req, name, 'new()'),
      error: 'JSON inválido. Revisá la sintaxis.',
      jsonValue: req.body.json
    });
  }

  await getNativeCollection(name).insertOne(doc);
  res.redirect(`/collections/${name}`);
});

app.get('/collections/:name/:id/edit', async (req, res) => {
  const { name, id } = req.params;
  if (isModeled(name)) return res.status(404).send('Usá la ruta de edición del modelo');

  const objectId = parseObjectId(id);
  if (!objectId) return res.status(400).send('ID inválido');

  const doc = await getNativeCollection(name).findOne({ _id: objectId });
  if (!doc) return res.status(404).send('Documento no encontrado');

  const { _id, ...rest } = doc;
  res.render('edit', {
    title: name,
    isGeneric: true,
    doc,
    queryText: `db.${name}.replaceOne({ _id: ObjectId("${id}") }, {...})`,
    breadcrumbs: getBreadcrumbs(req, name, `edit → ${id.slice(-6)}`),
    error: null,
    jsonValue: JSON.stringify(rest, null, 2)
  });
});

app.post('/collections/:name/:id', async (req, res) => {
  const { name, id } = req.params;
  if (isModeled(name)) return res.status(404).send('Usá la ruta de edición del modelo');

  const objectId = parseObjectId(id);
  if (!objectId) return res.status(400).send('ID inválido');

  let parsed;
  try {
    parsed = JSON.parse(req.body.json);
  } catch {
    const doc = await getNativeCollection(name).findOne({ _id: objectId });
    return res.render('edit', {
      title: name,
      isGeneric: true,
      doc,
      queryText: `db.${name}.replaceOne({ _id: ObjectId("${id}") }, {...})`,
      breadcrumbs: getBreadcrumbs(req, name, `edit → ${id.slice(-6)}`),
      error: 'JSON inválido. Revisá la sintaxis.',
      jsonValue: req.body.json
    });
  }

  const replacement = { ...parsed, _id: objectId };
  await getNativeCollection(name).replaceOne({ _id: objectId }, replacement);
  res.redirect(`/collections/${name}/${id}?updated=1`);
});

app.post('/collections/:name/:id/delete', async (req, res) => {
  const { name, id } = req.params;
  if (isModeled(name)) return res.status(404).send('Usá la ruta de eliminación del modelo');

  const objectId = parseObjectId(id);
  if (!objectId) return res.status(400).send('ID inválido');

  await getNativeCollection(name).deleteOne({ _id: objectId });
  res.redirect(`/collections/${name}`);
});

app.get('/collections/:name/:id', async (req, res) => {
  const { name, id } = req.params;
  if (isModeled(name)) return res.redirect(`/collections/${name}/${id}`);

  const objectId = parseObjectId(id);
  if (!objectId) return res.status(400).send('ID inválido');

  const doc = await getNativeCollection(name).findOne({ _id: objectId });
  if (!doc) return res.status(404).send('Documento no encontrado');

  renderCollection(res, {
    title: name,
    isGeneric: true,
    queryText: `db.${name}.findOne({ _id: ObjectId("${id}") })`,
    breadcrumbs: getBreadcrumbs(req, name, id.slice(-6)),
    docs: docsWithHtml([doc]),
    flash: req.query.updated ? 'Documento actualizado' : null
  });
});

// ==========================================
// START
// ==========================================
async function start() {
  try {
    console.log('⏳ Conectando a MongoDB...');
    await mongoose.connect('mongodb://127.0.0.1:27017/tup_mongo_tp');
    console.log('✅ Conexión exitosa a MongoDB.');

    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar:', error.message);
    process.exit(1);
  }
}

start();
