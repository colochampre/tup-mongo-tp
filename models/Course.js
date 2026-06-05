import mongoose from 'mongoose';

// En una base SQL, tendríamos una tabla "Materias". Aquí en MongoDB es una colección.
const courseSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  carrera: { type: String, required: true },
  cargaHoraria: Number
});

export default mongoose.model('Course', courseSchema);
