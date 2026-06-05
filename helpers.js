// =====================================================
// helpers.js — Formateador de JSON como HTML
// Convierte documentos de MongoDB en strings HTML 
// con syntax highlighting y links entre colecciones.
// =====================================================

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isObjectId(value) {
  return value != null && typeof value === 'object' && typeof value.toHexString === 'function';
}

function resolveId(value) {
  if (isObjectId(value)) return value.toHexString();
  return String(value);
}

/**
 * Transforma un documento de MongoDB en un string HTML formateado como JSON,
 * inyectando etiquetas <a> en los campos que correspondan a referencias.
 *
 * @param {*} value - El valor a formatear (objeto, array, primitivo, etc.)
 * @param {Object} linkSchema - Mapa de paths a links. Ej:
 *   { 'materiasCursadas[].materia': { collection: 'courses', labelKey: 'nombre' } }
 * @param {string} path - Path actual dentro del documento (para uso recursivo)
 * @param {number} indent - Nivel de indentación actual (para uso recursivo)
 * @returns {string} HTML formateado
 */
export function toHtmlJson(value, linkSchema = {}, path = '', indent = 0) {
  const pad = '  '.repeat(indent);
  const inner = '  '.repeat(indent + 1);

  if (value === null || value === undefined) {
    return '<span class="jnull">null</span>';
  }
  if (isObjectId(value)) {
    return `<span class="jstr">"${value.toHexString()}"</span>`;
  }
  if (value instanceof Date) {
    return `<span class="jstr">"${value.toISOString()}"</span>`;
  }
  if (typeof value === 'number') {
    return `<span class="jnum">${value}</span>`;
  }
  if (typeof value === 'boolean') {
    return `<span class="jbool">${value}</span>`;
  }
  if (typeof value === 'string') {
    return `<span class="jstr">"${escapeHtml(value)}"</span>`;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const items = value.map(item =>
      `${inner}${toHtmlJson(item, linkSchema, `${path}[]`, indent + 1)}`
    ).join(',\n');
    return `[\n${items}\n${pad}]`;
  }
  if (typeof value === 'object') {
    // Verificamos si este path corresponde a un campo referenciado (tipo Foreign Key)
    const link = linkSchema[path];
    if (link && value[link.labelKey] !== undefined) {
      const id = resolveId(value._id);
      const label = escapeHtml(String(value[link.labelKey]));
      // Agregamos ?from=coleccion_actual a la URL para el breadcrumb
      const fromParam = linkSchema._currentCollection ? `?from=${linkSchema._currentCollection}` : '';
      return (
        `<a href="/collections/${link.collection}/${id}${fromParam}" class="json-link" title="Ver documento">` +
        `{ <span class="jkey">"${link.labelKey}"</span>: <span class="jstr">"${label}"</span> ` +
        `<span class="jref">→ ver</span> }</a>`
      );
    }

    const entries = Object.entries(value)
      .filter(([k]) => k !== '__v')
      .map(([key, val]) => {
        const childPath = path ? `${path}.${key}` : key;
        return `${inner}<span class="jkey">"${escapeHtml(key)}"</span>: ${toHtmlJson(val, linkSchema, childPath, indent + 1)}`;
      });

    if (entries.length === 0) return '{}';
    return `{\n${entries.join(',\n')}\n${pad}}`;
  }

  return escapeHtml(String(value));
}
