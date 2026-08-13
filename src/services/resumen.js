import { supabase } from '../lib/supabase'

// Devuelve, para un mes/año dado, el listado de socios activos con:
// - puntos_comision (0-20, manual)
// - detalle de cada actividad del mes con su estado y puntos
// - total del mes (0-100)
export async function obtenerResumenMensual({ mes, anio, comisionId = null }) {
  let miembrosQuery = supabase
      .from('miembros')
      .select('id, nombre_completo, activo, comision_id, comisiones(nombre)')
      .eq('activo', true)
      .order('nombre_completo')

  if (comisionId) miembrosQuery = miembrosQuery.eq('comision_id', comisionId)

  const [{ data: miembros, error: errMiembros }, { data: actividades, error: errAct }] =
      await Promise.all([
        miembrosQuery,
        supabase
            .from('actividades')
            .select('*')
            .eq('mes', mes)
            .eq('anio', anio)
            .eq('es_comision_fija', false)
            .order('fecha'),
      ])

  if (errMiembros) throw errMiembros
  if (errAct) throw errAct

  const idsActividades = actividades.map((a) => a.id)

  const [{ data: asistencias, error: errAsis }, { data: comisionManual, error: errCom }] =
      await Promise.all([
        idsActividades.length > 0
            ? supabase.from('asistencias').select('*').in('actividad_id', idsActividades)
            : Promise.resolve({ data: [], error: null }),
        supabase.from('comision_manual').select('*').eq('mes', mes).eq('anio', anio),
      ])

  if (errAsis) throw errAsis
  if (errCom) throw errCom

  const comisionPorMiembro = new Map(comisionManual.map((c) => [c.miembro_id, c.puntos]))
  const asistenciasPorMiembro = new Map()
  asistencias.forEach((a) => {
    if (!asistenciasPorMiembro.has(a.miembro_id)) asistenciasPorMiembro.set(a.miembro_id, [])
    asistenciasPorMiembro.get(a.miembro_id).push(a)
  })

  const filas = miembros.map((m) => {
    const puntosComision = comisionPorMiembro.get(m.id) ?? 0
    const asistenciasMiembro = asistenciasPorMiembro.get(m.id) || []

    const detalleActividades = actividades.map((act) => {
      const asistencia = asistenciasMiembro.find((a) => a.actividad_id === act.id)
      return {
        actividad_id: act.id,
        nombre: act.nombre,
        fecha: act.fecha,
        estado: asistencia?.estado ?? null,
        puntos_obtenidos: asistencia?.puntos_obtenidos ?? 0,
        puntos_posibles: act.puntos_asignados,
      }
    })

    const puntosActividades = detalleActividades.reduce(
        (sum, d) => sum + (d.puntos_obtenidos || 0),
        0
    )

    const total = Number((puntosComision + puntosActividades).toFixed(2))

    return {
      miembro_id: m.id,
      nombre_completo: m.nombre_completo,
      comision: m.comisiones?.nombre ?? 'Sin comisión',
      puntos_comision: puntosComision,
      puntos_actividades: Number(puntosActividades.toFixed(2)),
      total,
      detalle: detalleActividades,
    }
  })

  return { filas, actividades }
}