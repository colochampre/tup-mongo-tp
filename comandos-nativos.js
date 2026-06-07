// ==============================================================================
// TRABAJO PRÁCTICO: BASE DE DATOS II - SISTEMA UNIVERSITARIO
// Script nativo de MongoDB (MQL - MongoDB Query Language)
// ==============================================================================
// Equivalente a un archivo .sql de creación e inserción.
// Podés correr este archivo directamente en la terminal con:
// > mongosh comandos-nativos.js
// O copiar y pegar estas instrucciones directamente en MongoDB Compass / mongosh.
// ==============================================================================

// 1. SELECCIÓN DE BASE DE DATOS
// La crea automáticamente si no existe.
use('tup_mongo_tp');

// 2. LIMPIEZA DEL ENTORNO
// Aseguramos que el script sea repetible eliminando las colecciones previas.
db.courses.drop();
db.students.drop();

print('=============================================');
print('INICIANDO POBLACIÓN DE DATOS (SEED)');
print('=============================================');

// 3. OPERACIÓN CREATE: Cursos
// A diferencia de SQL, no usamos "CREATE TABLE". Al insertar, la colección se crea.
print('📚 Insertando materias...');
db.courses.insertMany([
  {
    nombre: 'Base de Datos II',
    carrera: 'Ingeniería en Sistemas',
    cargaHoraria: 120
  },
  {
    nombre: 'Redes de Computadoras',
    carrera: 'Ingeniería en Sistemas',
    cargaHoraria: 90
  },
  {
    nombre: 'Algoritmos y Estructuras',
    carrera: 'Ingeniería en Sistemas',
    cargaHoraria: 150
  },
  {
    nombre: 'Programación II',
    carrera: 'Ingeniería en Sistemas',
    cargaHoraria: 140
  },
  {
    nombre: 'Inglés II',
    carrera: 'Ingeniería en Sistemas',
    cargaHoraria: 60
  }
]);

// Guardamos referencias (ObjectIds) de los cursos creados para usarlos como Foreign Keys
const cursoBD2 = db.courses.findOne({ nombre: 'Base de Datos II' });
const cursoRedes = db.courses.findOne({ nombre: 'Redes de Computadoras' });
const cursoAlgo = db.courses.findOne({ nombre: 'Algoritmos y Estructuras' });
const cursoProg2 = db.courses.findOne({ nombre: 'Programación II' });
const cursoIngles = db.courses.findOne({ nombre: 'Inglés II' });

// 4. OPERACIÓN CREATE: Alumnos con Documentos Embebidos (Subdocumentos)
// VENTAJA CLAVE NoSQL: Guardamos el historial del alumno sin tablas intermedias.
print('🎓 Insertando alumnos...');
db.students.insertMany([
  {
    nombre: 'Juan Pérez',
    legajo: '12345',
    email: 'juan@universidad.edu.ar',
    fechaInscripcion: new Date('2022-03-10'),
    materiasCursadas: [
      { materia: cursoRedes._id, notaFinal: 8, estado: 'Aprobada' }
    ]
  },
  {
    nombre: 'María García',
    legajo: '67890',
    email: 'maria@universidad.edu.ar',
    fechaInscripcion: new Date('2021-04-15'),
    materiasCursadas: [
      { materia: cursoAlgo._id, notaFinal: 9, estado: 'Aprobada' },
      { materia: cursoRedes._id, notaFinal: 4, estado: 'Libre' },
      { materia: cursoIngles._id, notaFinal: 10, estado: 'Aprobada' }
    ]
  },
  {
    nombre: 'Lucas Rodríguez',
    legajo: '44556',
    email: 'lucas@universidad.edu.ar',
    fechaInscripcion: new Date('2023-02-20'),
    materiasCursadas: [
      { materia: cursoProg2._id, notaFinal: 7, estado: 'Aprobada' },
      { materia: cursoBD2._id, notaFinal: 5, estado: 'Regular' }
    ]
  },
  {
    nombre: 'Ana Fernández',
    legajo: '77889',
    email: 'ana@universidad.edu.ar',
    fechaInscripcion: new Date('2022-08-05'),
    materiasCursadas: [
      { materia: cursoIngles._id, notaFinal: 8, estado: 'Aprobada' },
      { materia: cursoProg2._id, notaFinal: 9, estado: 'Aprobada' }
    ]
  },
  {
    nombre: 'Diego Silva',
    legajo: '22334',
    email: 'diego@universidad.edu.ar',
    fechaInscripcion: new Date('2023-03-01'),
    materiasCursadas: [
      { materia: cursoAlgo._id, notaFinal: 2, estado: 'Libre' }
    ]
  },
  {
    nombre: 'Sofia Martínez',
    legajo: '99001',
    email: 'sofia@universidad.edu.ar',
    fechaInscripcion: new Date('2021-02-14'),
    materiasCursadas: [
      { materia: cursoBD2._id, notaFinal: 10, estado: 'Aprobada' },
      { materia: cursoRedes._id, notaFinal: 8, estado: 'Aprobada' },
      { materia: cursoProg2._id, notaFinal: 9, estado: 'Aprobada' }
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
      { materia: cursoIngles._id, notaFinal: 6, estado: 'Regular' }
    ]
  },
  {
    nombre: 'Gastón Paz',
    legajo: '33445',
    email: 'gaston@universidad.edu.ar',
    fechaInscripcion: new Date('2021-03-01'),
    materiasCursadas: [
      { materia: cursoAlgo._id, notaFinal: 7, estado: 'Aprobada' },
      { materia: cursoProg2._id, notaFinal: 4, estado: 'Regular' }
    ]
  }
]);

// 5. OPERACIÓN UPDATE: Modificar Array Anidado
// Usamos el operador $push para agregar una materia al array existente.
print('📝 Actualizando alumno (agregando nota de BD2 a Juan)...');
db.students.updateOne(
  { legajo: '12345' },
  {
    $push: {
      materiasCursadas: {
        materia: cursoBD2._id,
        notaFinal: 10,
        estado: 'Aprobada'
      }
    }
  }
);

print('\n=============================================');
print('EJECUTANDO CONSULTAS AVANZADAS');
print('=============================================');

// 6. OPERACIÓN READ: Consulta con "Lookup" (El equivalente al JOIN de SQL)
print('🔍 Consulta relacional (Alumno + Detalle de Cursos):');
const alumnoConDetalle = db.students.aggregate([
  { $match: { legajo: '12345' } },
  {
    $lookup: {
      from: 'courses',                     // Tabla/Colección destino
      localField: 'materiasCursadas.materia', // Campo local (Foreign Key)
      foreignField: '_id',                 // Primary Key en la colección destino
      as: 'detalleMaterias'                // Nombre del array resultante
    }
  }
]).toArray();
printjson(alumnoConDetalle[0]);


// 7. AGGREGATION FRAMEWORK: Cálculo Analítico (El equivalente a GROUP BY)
// Calculamos el promedio general de notas y la cantidad de materias aprobadas de Juan.
print('\n📊 Calculando Promedio General con Aggregation Pipeline:');
const promedio = db.students.aggregate([
  { $match: { legajo: '12345' } },                       // 1. WHERE: Filtramos al alumno
  { $unwind: '$materiasCursadas' },                      // 2. Desarmamos el array de materias
  { $match: { 'materiasCursadas.estado': 'Aprobada' } }, // 3. Filtramos solo aprobadas
  {
    $group: {                                            // 4. GROUP BY y Funciones
      _id: '$_id',
      nombre: { $first: '$nombre' },
      promedio: { $avg: '$materiasCursadas.notaFinal' },
      materiasAprobadas: { $sum: 1 }
    }
  }
]).toArray();

printjson(promedio[0]);
print('\n✅ Ejecución finalizada con éxito.');
