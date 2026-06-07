import mongoose from 'mongoose';

// ==========================================
// 1. DEFINICIÓN DE ESQUEMAS (MODELADO)
// ==========================================

// Esquema de Materia
// En una base SQL, tendríamos una tabla "Materias". Aquí en MongoDB es una colección.
const courseSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  carrera: { type: String, required: true },
  cargaHoraria: Number
});

const Course = mongoose.model('Course', courseSchema);

// Esquema de Alumno
// ESTA ES LA VENTAJA CLAVE DE NoSQL: En SQL, las notas de un alumno requerirían 
// una tabla intermedia (Alumno_Materia). En MongoDB, podemos "embeber" (anidar) 
// las materias cursadas y sus notas directamente dentro del documento del alumno, 
// usando un array de subdocumentos. Esto acelera las consultas de lectura.
const studentSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  legajo: { type: String, required: true, unique: true },
  email: String,
  fechaInscripcion: { type: Date, default: Date.now },
  
  // Array de subdocumentos (Datos anidados)
  materiasCursadas: [{
    materia: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    notaFinal: Number,
    estado: { type: String, enum: ['Aprobada', 'Regular', 'Libre'] }
  }]
});

const Student = mongoose.model('Student', studentSchema);

// ==========================================
// 2. FUNCIÓN PRINCIPAL DE EJECUCIÓN
// ==========================================
async function runExample() {
  try {
    // 2.1 Conexión a la base de datos local
    // (Asegurate de tener MongoDB corriendo en tu PC o usa una URL de MongoDB Atlas)
    console.log('⏳ Conectando a MongoDB...');
    await mongoose.connect('mongodb://127.0.0.1:27017/tup_mongo_tp');
    console.log('✅ Conexión exitosa a MongoDB.\n');

    // Limpiar la base de datos para que el script se pueda correr múltiples veces limpiamente
    await Course.deleteMany({});
    await Student.deleteMany({});

    // ==========================================
    // 3. OPERACIÓN CREATE (Insertar Datos)
    // ==========================================
    console.log('📚 Creando materias...');
    const bd2 = await Course.create({
      nombre: 'Base de Datos II',
      carrera: 'Ingeniería en Sistemas',
      cargaHoraria: 120
    });
    
    const redes = await Course.create({
      nombre: 'Redes de Computadoras',
      carrera: 'Ingeniería en Sistemas',
      cargaHoraria: 90
    });

    console.log('🎓 Inscribiendo alumno...');
    const alumno = await Student.create({
      nombre: 'Juan Pérez',
      legajo: '12345',
      email: 'juan@universidad.edu.ar',
      materiasCursadas: [
        {
          materia: redes._id,
          notaFinal: 8,
          estado: 'Aprobada'
        }
      ]
    });

    console.log(`✅ Alumno insertado: ${alumno.nombre} con legajo ${alumno.legajo}\n`);

    // ==========================================
    // 4. OPERACIÓN UPDATE (Actualizar / Agregar Subdocumento)
    // ==========================================
    // Aquí mostramos otra ventaja: El operador $push de MongoDB nos permite 
    // agregar elementos a un array sin tener que leer y reescribir todo el documento.
    console.log('📝 Actualizando: Agregando nota de BD 2 a Juan...');
    await Student.updateOne(
      { legajo: '12345' },
      { 
        $push: { 
          materiasCursadas: {
            materia: bd2._id,
            notaFinal: 10,
            estado: 'Aprobada'
          }
        } 
      }
    );
    console.log('✅ Nota de BD 2 agregada con éxito.\n');

    // ==========================================
    // 5. OPERACIÓN READ (Consulta con Populate)
    // ==========================================
    // Vamos a buscar a Juan y traer también los detalles de las materias (como un JOIN en SQL)
    console.log('🔍 Consultando el historial académico de Juan...');
    const juanActualizado = await Student.findOne({ legajo: '12345' })
      .populate('materiasCursadas.materia'); // "populate" hace la vinculación automática
    
    console.log('--- Historial Académico ---');
    console.log(`Alumno: ${juanActualizado.nombre}`);
    juanActualizado.materiasCursadas.forEach(curso => {
      console.log(`- ${curso.materia.nombre}: Nota ${curso.notaFinal} (${curso.estado})`);
    });
    console.log('---------------------------\n');

    // ==========================================
    // 6. AGGREGATION FRAMEWORK (Avanzado)
    // ==========================================
    // Aggregation es la forma de hacer análisis complejos (equivalente a GROUP BY y funciones de agregación en SQL)
    // Vamos a calcular el promedio general del alumno desarmando el array de materias.
    console.log('📊 Calculando Promedio General (Aggregation Framework)...');
    
    const aggregationPipeline = [
      { $match: { legajo: '12345' } }, // 1. Filtramos por el alumno
      { $unwind: '$materiasCursadas' }, // 2. "Desarmamos" el array para tener un documento por cada materia cursada
      { $match: { 'materiasCursadas.estado': 'Aprobada' } }, // 3. Solo tomamos las materias aprobadas
      { 
        $group: { 
          _id: '$_id', 
          promedio: { $avg: '$materiasCursadas.notaFinal' }, // 4. Calculamos el promedio
          cantidadAprobadas: { $sum: 1 } // Contamos cuántas materias aprobó
        } 
      }
    ];

    const resultados = await Student.aggregate(aggregationPipeline);
    console.log('Resultados de la Agregación:', resultados[0]);
    console.log('==========================================\n');

  } catch (error) {
    console.error('❌ Error ejecutando el ejemplo:', error);
  } finally {
    // Cerramos la conexión para que el script termine correctamente
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada.');
  }
}

runExample();
