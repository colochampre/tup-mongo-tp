# Trabajo Práctico: Base de Datos II - Ejemplo Práctico MongoDB

Este proyecto es un ejemplo práctico construido con **Node.js y Mongoose** para demostrar el modelado y funcionamiento de una base de datos NoSQL documental (MongoDB) aplicada a un **Sistema Universitario**.

## Requisitos Previos
1. Tener instalado [Node.js](https://nodejs.org/).
2. Tener instalado y en ejecución el servidor local de [MongoDB](https://www.mongodb.com/try/download/community) (MongoDB Community Server).

## Instalación y Ejecución

1. Abrí una terminal en esta misma carpeta y ejecutá el siguiente comando para instalar la dependencia de Mongoose:
   ```bash
   npm install
   ```

2. Ejecutá el script principal:
   ```bash
   npm start
   ```

---

## ¿Qué demuestra este ejemplo?

El archivo `index.js` contiene comentarios explicativos, pero a nivel teórico, este código demuestra los siguientes conceptos clave de MongoDB frente a SQL:

### 1. Documentos Anidados (Embebed Documents) vs Tablas Intermedias (JOINs)
En una base de datos Relacional (SQL), para relacionar `Alumnos` con `Materias` y registrar sus notas, obligatoriamente necesitaríamos una tercera tabla (ej. `Alumno_Materia`) y usaríamos `JOINs` para consultar el historial académico.
En MongoDB, aprovechamos el esquema flexible guardando un **Array de subdocumentos** llamado `materiasCursadas` directamente dentro del documento del Alumno. Esto significa que **al consultar al alumno, ya obtenemos automáticamente todo su historial académico en una sola lectura de disco**, mejorando drásticamente el rendimiento para lecturas.

### 2. Actualizaciones Atómicas con Operadores (`$push`)
Cuando el alumno aprueba una nueva materia, no hace falta descargar todo su documento en memoria, modificar el array y volverlo a guardar. Utilizamos el operador de actualización `$push` de MongoDB para insertar atómicamente un nuevo registro dentro del array del documento directamente en la base de datos.

### 3. Aggregation Framework (El equivalente a GROUP BY)
Para calcular métricas analíticas (como el promedio de notas), MongoDB provee el **Aggregation Pipeline**. En el ejemplo:
1. `$match`: Filtra los documentos.
2. `$unwind`: Desarma el array de subdocumentos (transforma un documento con un array de N notas en N documentos individuales temporalmente).
3. `$group`: Agrupa y aplica funciones matemáticas, en este caso `$avg` para promediar y `$sum` para contar materias aprobadas.

## Conclusión Práctica
MongoDB es excelente cuando tenemos datos que inherentemente "pertenecen" a una entidad principal (como las notas de un alumno o los items de una factura) y queremos acceder a ellos rápidamente en conjunto, sin la penalización de rendimiento que suponen múltiples `JOINs` en arquitecturas de gran escala.
