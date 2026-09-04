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

// Exporta el resumen a Excel agrupado por comisión, con una columna por
// actividad (mostrando solo la letra A/Ex/F, editable), y las columnas de
// Actividades y Total como FÓRMULAS que se recalculan si cambias una letra.
export function exportarResumenExcel(
    filas,
    { mes, anio, nombreMes, nombreFiltro = 'Todas las comisiones', actividades = [] }
) {
  const colInicioActividades = 1 // col B (después de "Nombre")
  const colComision = colInicioActividades + actividades.length
  const colActividadesTotal = colComision + 1
  const colTotal = colActividadesTotal + 1
  const ultimaColumna = colTotal

  const encabezadosNombres = [
    'Nombre',
    ...actividades.map((act) => act.nombre),
    'Comisión (20 pts)',
    'Actividades (80 pts)',
    'Total (100 pts)',
  ]

  const encabezadosSub = [
    '',
    ...actividades.map((act) => {
      const fecha = new Date(act.fecha + 'T00:00:00').toLocaleDateString('es-GT', {
        day: '2-digit',
        month: '2-digit',
      })
      return `${fecha} · ${Number(act.puntos_asignados).toFixed(1)} pts`
    }),
    '',
    '',
    '',
  ]

  const filasHoja = [[`${nombreMes} ${anio} · ${nombreFiltro}`], []]
  const merges = [{ s: { r: 0, c: 0 }, e: { r: 0, c: ultimaColumna } }]

  // Guarda, por cada socio, en qué fila de la hoja va a quedar y sus datos,
  // para poder escribirle las fórmulas después de crear la hoja.
  const filasConFormula = []

  const comisionesUnicas = ordenarNombresComision([...new Set(filas.map((f) => f.comision))])

  comisionesUnicas.forEach((nombreCom) => {
    const filasDeEstaComision = filas.filter((f) => f.comision === nombreCom)

    const filaEncabezadoComision = filasHoja.length
    filasHoja.push([`== ${nombreCom.toUpperCase()} (${filasDeEstaComision.length} socio/s) ==`])
    merges.push({
      s: { r: filaEncabezadoComision, c: 0 },
      e: { r: filaEncabezadoComision, c: ultimaColumna },
    })

    filasHoja.push(encabezadosNombres)
    filasHoja.push(encabezadosSub)

    filasDeEstaComision.forEach((f) => {
      const filaIndice = filasHoja.length

      const letras = actividades.map((act) => {
        const detalle = f.detalle.find((d) => d.actividad_id === act.id)
        return detalle?.estado || ''
      })

      filasHoja.push([
        f.nombre_completo,
        ...letras,
        f.puntos_comision,
        0, // se reemplaza por fórmula abajo
        0, // se reemplaza por fórmula abajo
      ])

      filasConFormula.push({ filaIndice, actividades })
    })

    filasHoja.push([]) // fila en blanco entre comisiones
  })

  const hoja = XLSX.utils.aoa_to_sheet(filasHoja)

  // Escribe las fórmulas de Actividades y Total en cada fila de socio
  filasConFormula.forEach(({ filaIndice, actividades: acts }) => {
    const fragmentos = acts.map((act, i) => {
      const celda = XLSX.utils.encode_cell({ r: filaIndice, c: colInicioActividades + i })
      const pts = Number(act.puntos_asignados)
      return `IF(${celda}="A",${pts},IF(${celda}="Ex",${pts / 2},0))`
    })

    const formulaActividades = fragmentos.length > 0 ? fragmentos.join('+') : '0'
    const celdaComision = XLSX.utils.encode_cell({ r: filaIndice, c: colComision })
    const celdaActividades = XLSX.utils.encode_cell({ r: filaIndice, c: colActividadesTotal })

    hoja[celdaActividades] = { t: 'n', f: formulaActividades, z: '0.00' }
    hoja[XLSX.utils.encode_cell({ r: filaIndice, c: colComision })] = {
      t: 'n',
      v: hoja[celdaComision]?.v ?? 0,
      z: '0.00',
    }
    hoja[XLSX.utils.encode_cell({ r: filaIndice, c: colTotal })] = {
      t: 'n',
      f: `${celdaComision}+${celdaActividades}`,
      z: '0.00',
    }
  })

  hoja['!cols'] = [
    { wch: 30 },
    ...actividades.map(() => ({ wch: 10 })),
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