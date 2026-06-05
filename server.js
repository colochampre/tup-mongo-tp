import express from 'express';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Course from './models/Course.js';
import Student from './models/Student.js';
import { toHtmlJson } from './helpers.js';

// Esquema de links: define qué campos son referencias a otras colecciones
// Equivale a declarar las Foreign Keys de un modelo relacional
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
app.use(express.urlencoded({ extended: true })); // Para parsear application/x-www-form-urlencoded

// ==========================================
// SEED: Poblar la BD si está vacía
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
// HELPERS DE RUTAS
// ==========================================
function getBreadcrumbs(req, collection, currentDocLabel = null) {
  const breadcrumbs = [{ label: 'collections', url: '/' }];
  
  if (req.query.from) {
    breadcrumbs.push({ label: req.query.from, url: `/collections/${req.query.from}` });
  }
  
  // Agregar la colección actual
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

// ------------------------------------------
// RUTAS GET: VISTAS (Read)
// ------------------------------------------

// Vista principal: lista las colecciones disponibles
app.get('/', async (req, res) => {
  const collections = [
    { name: 'courses', label: 'Cursos', count: await Course.countDocuments() },
    { name: 'students', label: 'Alumnos', count: await Student.countDocuments() }
  ];
  res.render('index', { collections });
});

// Vista de la colección de Cursos
app.get('/collections/courses', async (req, res) => {
  const docs = await Course.find().lean();
  const docsWithHtml = docs.map(doc => ({ ...doc, _html: toHtmlJson(doc) }));
  
  res.render('collection', { 
    title: 'courses', 
    queryText: 'db.courses.find({})',
    breadcrumbs: getBreadcrumbs(req, 'courses'),
    docs: docsWithHtml 
  });
});

// Vista de la colección de Alumnos (con populate para ver las materias resueltas)
app.get('/collections/students', async (req, res) => {
  const docs = await Student.find().populate('materiasCursadas.materia').lean();
  const docsWithHtml = docs.map(doc => ({ ...doc, _html: toHtmlJson(doc, STUDENT_LINK_SCHEMA) }));
  
  res.render('collection', { 
    title: 'students', 
    queryText: 'db.students.find({})', // Pura sintaxis nativa
    breadcrumbs: getBreadcrumbs(req, 'students'),
    docs: docsWithHtml 
  });
});

// ==========================================
// RUTAS POST Y GET DE FORMULARIOS (Create, Delete)
// Estas rutas estáticas deben ir ANTES de las rutas con :id
// ==========================================

// Renderizar formulario de creación de Curso
app.get('/collections/courses/new', (req, res) => {
  res.render('new', { 
    title: 'courses', 
    queryText: 'db.courses.insertOne(...)',
    breadcrumbs: getBreadcrumbs(req, 'courses', 'new()')
  });
});

// Renderizar formulario de creación de Alumno
app.get('/collections/students/new', (req, res) => {
  res.render('new', { 
    title: 'students', 
    queryText: 'db.students.insertOne(...)',
    breadcrumbs: getBreadcrumbs(req, 'students', 'new()')
  });
});

// Procesar creación de Curso
app.post('/collections/courses', async (req, res) => {
  await Course.create({
    nombre: req.body.nombre,
    carrera: req.body.carrera,
    cargaHoraria: Number(req.body.cargaHoraria)
  });
  res.redirect('/collections/courses');
});

// Procesar creación de Alumno
app.post('/collections/students', async (req, res) => {
  await Student.create({
    nombre: req.body.nombre,
    legajo: req.body.legajo,
    email: req.body.email,
    fechaInscripcion: req.body.fechaInscripcion ? new Date(req.body.fechaInscripcion) : new Date(),
    materiasCursadas: [] // Lo dejamos vacío por simplicidad del form
  });
  res.redirect('/collections/students');
});

// Eliminar Curso
app.post('/collections/courses/:id/delete', async (req, res) => {
  await Course.findByIdAndDelete(req.params.id);
  res.redirect('/collections/courses');
});

// Eliminar Alumno
app.post('/collections/students/:id/delete', async (req, res) => {
  await Student.findByIdAndDelete(req.params.id);
  res.redirect('/collections/students');
});

// ------------------------------------------
// RUTAS GET: VISTAS CON ID DINÁMICO (Read)
// ------------------------------------------

// Vista de un único documento de Curso por ID
app.get('/collections/courses/:id', async (req, res) => {
  const doc = await Course.findById(req.params.id).lean();
  if (!doc) return res.status(404).send('Documento no encontrado');
  
  const docWithHtml = { ...doc, _html: toHtmlJson(doc) };
  res.render('collection', { 
    title: 'courses', 
    queryText: `db.courses.findOne({ _id: ObjectId("${req.params.id}") })`,
    breadcrumbs: getBreadcrumbs(req, 'courses', doc.nombre), // Pasamos el nombre
    docs: [docWithHtml]
  });
});

// Vista de un único documento de Alumno por ID
app.get('/collections/students/:id', async (req, res) => {
  const doc = await Student.findById(req.params.id).populate('materiasCursadas.materia').lean();
  if (!doc) return res.status(404).send('Documento no encontrado');
  
  const docWithHtml = { ...doc, _html: toHtmlJson(doc, STUDENT_LINK_SCHEMA) };
  res.render('collection', { 
    title: 'students', 
    queryText: `db.students.findOne({ _id: ObjectId("${req.params.id}") })`, // Removido el .populate()
    breadcrumbs: getBreadcrumbs(req, 'students', doc.nombre), // Pasamos el nombre
    docs: [docWithHtml]
  });
});

// ==========================================
// ARRANQUE DEL SERVIDOR
// ==========================================
async function start() {
  try {
    console.log('⏳ Conectando a MongoDB...');
    await mongoose.connect('mongodb://127.0.0.1:27017/tup_tp');
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
