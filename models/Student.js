import mongoose from 'mongoose';

// VENTAJA CLAVE DE NoSQL: Las notas del alumno están embebidas como subdocumentos
// en lugar de requerir una tabla intermedia con JOINs como en SQL.
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

export default mongoose.model('Student', studentSchema);
