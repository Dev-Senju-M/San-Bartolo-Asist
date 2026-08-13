import { supabase } from '../lib/supabase'

export async function listarActividades({ mes, anio } = {}) {
  let query = supabase
      .from('actividades')
      .select('*')
      .order('fecha', { ascending: true })

  if (mes) query = query.eq('mes', mes)
  if (anio) query = query.eq('anio', anio)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function crearActividad({ nombre, fecha }) {
  const fechaObj = new Date(fecha)
  const mes = fechaObj.getUTCMonth() + 1
  const anio = fechaObj.getUTCFullYear()

  const { data, error } = await supabase
      .from('actividades')
      .insert([{ nombre, fecha, mes, anio, es_comision_fija: false }])
      .select()
      .single()
  if (error) throw error
  return data
}

export async function actualizarActividad(id, cambios) {
  const { data, error } = await supabase
      .from('actividades')
      .update(cambios)
      .eq('id', id)
      .select()
      .single()
  if (error) throw error
  return data
}

export async function eliminarActividad(id) {
  const { error } = await supabase.from('actividades').delete().eq('id', id)
  if (error) throw error
}