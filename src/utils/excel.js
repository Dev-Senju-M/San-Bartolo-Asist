import * as XLSX from 'xlsx'

// Lee un archivo .xlsx y devuelve un arreglo de objetos (una fila = un objeto)
export function leerExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const hoja = workbook.Sheets[workbook.SheetNames[0]]
        const filas = XLSX.utils.sheet_to_json(hoja, { defval: '' })
        resolve(filas)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
    reader.readAsArrayBuffer(file)
  })
}

// Normaliza los encabezados de una fila de Excel a claves conocidas
export function normalizarFilaMiembro(fila) {
  const claves = Object.keys(fila).reduce((acc, k) => {
    acc[k.toString().trim().toLowerCase()] = fila[k]
    return acc
  }, {})

  return {
    nombre_completo:
        claves['nombre completo'] || claves['nombre'] || claves['nombre_completo'] || '',
    comision: claves['comision'] || claves['comisión'] || claves['comision_nombre'] || '',
    codigo_socio: claves['codigo'] || claves['codigo_socio'] || claves['dpi'] || '',
  }
}

// Exporta un arreglo de filas de resumen a un archivo .xlsx descargable
export function exportarResumenExcel(filas, { mes, anio, nombreMes }) {
  const encabezados = ['Nombre', 'Comisión', 'Comisión (20 pts)', 'Actividades (80 pts)', 'Total (100 pts)']

  const filasExcel = filas.map((f) => [
    f.nombre_completo,
    f.comision,
    f.puntos_comision,
    f.puntos_actividades,
    f.total,
  ])

  const hoja = XLSX.utils.aoa_to_sheet([encabezados, ...filasExcel])
  hoja['!cols'] = [{ wch: 30 }, { wch: 18 }, { wch: 16 }, { wch: 18 }, { wch: 14 }]

  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, `${nombreMes} ${anio}`.substring(0, 31))

  XLSX.writeFile(libro, `resumen_asistencia_${nombreMes}_${anio}.xlsx`)
}