import * as XLSX from 'xlsx'
import { NOMBRE_COMISION_COLABORADORES } from './constants'

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

// Ordena los nombres de comisión alfabéticamente, dejando
// "Colaboradores (Nuevo Ingreso)" siempre al final
function ordenarNombresComision(nombres) {
  return [...nombres].sort((a, b) => {
    const esColabA = a === NOMBRE_COMISION_COLABORADORES
    const esColabB = b === NOMBRE_COMISION_COLABORADORES
    if (esColabA !== esColabB) return esColabA ? 1 : -1
    return a.localeCompare(b, 'es')
  })
}

// Exporta el resumen a Excel agrupado por comisión: un bloque de
// encabezado por cada comisión, seguido de sus socios, con una columna
// por cada actividad del mes (nombre y fecha en el encabezado).
export function exportarResumenExcel(
    filas,
    { mes, anio, nombreMes, nombreFiltro = 'Todas las comisiones', actividades = [] }
) {
  const encabezadosActividades = actividades.map((act) => {
    const fecha = new Date(act.fecha + 'T00:00:00').toLocaleDateString('es-GT', {
      day: '2-digit',
      month: '2-digit',
    })
    return `${act.nombre} (${fecha})`
  })

  const encabezadosColumnas = [
    'Nombre',
    ...encabezadosActividades,
    'Comisión (20 pts)',
    'Actividades (80 pts)',
    'Total (100 pts)',
  ]
  const ultimaColumna = encabezadosColumnas.length - 1

  const filaExcelDe = (f) => {
    const columnasActividades = actividades.map((act) => {
      const detalle = f.detalle.find((d) => d.actividad_id === act.id)
      if (!detalle || !detalle.estado) return '—'
      const etiquetaEstado =
          detalle.estado === 'A' ? 'Asistió' : detalle.estado === 'Ex' ? 'Excusa' : 'Faltó'
      return `${etiquetaEstado} (${Number(detalle.puntos_obtenidos).toFixed(2)})`
    })

    return [
      f.nombre_completo,
      ...columnasActividades,
      f.puntos_comision,
      f.puntos_actividades,
      f.total,
    ]
  }

  const filasHoja = [[`${nombreMes} ${anio} · ${nombreFiltro}`], []]
  const merges = [{ s: { r: 0, c: 0 }, e: { r: 0, c: ultimaColumna } }]

  const comisionesUnicas = ordenarNombresComision([...new Set(filas.map((f) => f.comision))])

  comisionesUnicas.forEach((nombreCom) => {
    const filasDeEstaComision = filas.filter((f) => f.comision === nombreCom)

    const filaEncabezadoComision = filasHoja.length
    filasHoja.push([`== ${nombreCom.toUpperCase()} (${filasDeEstaComision.length} socio/s) ==`])
    merges.push({
      s: { r: filaEncabezadoComision, c: 0 },
      e: { r: filaEncabezadoComision, c: ultimaColumna },
    })

    filasHoja.push(encabezadosColumnas)
    filasDeEstaComision.forEach((f) => filasHoja.push(filaExcelDe(f)))
    filasHoja.push([]) // fila en blanco entre comisiones
  })

  const hoja = XLSX.utils.aoa_to_sheet(filasHoja)

  hoja['!cols'] = [
    { wch: 30 },
    ...actividades.map(() => ({ wch: 22 })),
    { wch: 16 },
    { wch: 18 },
    { wch: 14 },
  ]
  hoja['!merges'] = merges

  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, `${nombreMes} ${anio}`.substring(0, 31))

  const sufijoFiltro =
      nombreFiltro === 'Todas las comisiones'
          ? ''
          : `_${nombreFiltro.toLowerCase().replace(/\s+/g, '-')}`

  XLSX.writeFile(libro, `resumen_asistencia_${nombreMes}_${anio}${sufijoFiltro}.xlsx`)
}