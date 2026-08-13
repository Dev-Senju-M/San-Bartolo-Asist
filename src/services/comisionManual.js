import { supabase } from '../lib/supabase'

export async function obtenerComisionManual(mes, anio) {
  const { data, error } = await supabase
      .from('comision_manual')
      .select('*')
      .eq('mes', mes)
      .eq('anio', anio)
  if (error) throw error
  return data
}

// registros: [{ miembro_id, mes, anio, puntos }]
export async function guardarComisionManual(registros) {
  const { data, error } = await supabase
      .from('comision_manual')
      .upsert(registros, { onConflict: 'miembro_id,mes,anio' })
      .select()
  if (error) throw error
  return data
}