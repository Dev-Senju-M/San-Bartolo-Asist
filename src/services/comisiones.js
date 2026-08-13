import { supabase } from '../lib/supabase'

export async function listarComisiones() {
  const { data, error } = await supabase
      .from('comisiones')
      .select('*')
      .order('nombre')
  if (error) throw error
  return data
}