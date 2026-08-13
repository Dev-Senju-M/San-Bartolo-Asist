import { supabase } from '../lib/supabase'

export async function obtenerAsistenciasPorActividad(actividadId) {
  const { data, error } = await supabase
      .from('asistencias')
      .select('*')
      .eq('actividad_id', actividadId)
  if (error) throw error
  return data
}

// registros: [{ miembro_id, actividad_id, estado }]
export async function guardarAsistencias(registros) {
  const { data, error } = await supabase
      .from('asistencias')
      .upsert(registros, { onConflict: 'miembro_id,actividad_id' })
      .select()
  if (error) throw error
  return data
}

export async function listarAsistenciasDeMiembro(miembroId, { mes, anio } = {}) {
  let query = supabase
      .from('asistencias')
      .select('*, actividades(nombre, fecha, mes, anio, puntos_asignados)')
      .eq('miembro_id', miembroId)

  const { data, error } = await query
  if (error) throw error

  if (mes && anio) {
    return data.filter((a) => a.actividades.mes === mes && a.actividades.anio === anio)
  }
  return data
}