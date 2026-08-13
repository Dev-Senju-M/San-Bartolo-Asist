import { supabase } from '../lib/supabase'
import { normalizarTexto } from '../utils/constants'

export async function listarMiembros({ soloActivos = false, comisionId = null } = {}) {
  let query = supabase
      .from('miembros')
      .select('*, comisiones(nombre)')
      .order('nombre_completo')

  if (soloActivos) query = query.eq('activo', true)
  if (comisionId) query = query.eq('comision_id', comisionId)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function crearMiembro(miembro) {
  const { data, error } = await supabase
      .from('miembros')
      .insert([miembro])
      .select()
      .single()
  if (error) throw error
  return data
}

export async function actualizarMiembro(id, cambios) {
  const { data, error } = await supabase
      .from('miembros')
      .update(cambios)
      .eq('id', id)
      .select()
      .single()
  if (error) throw error
  return data
}

export async function darDeBajaMiembro(id) {
  return actualizarMiembro(id, { activo: false })
}

export async function reactivarMiembro(id) {
  return actualizarMiembro(id, { activo: true })
}

export async function eliminarMiembro(id) {
  const { error } = await supabase.from('miembros').delete().eq('id', id)
  if (error) throw error
}

// ---------------------------------------------------------
// Importación masiva desde Excel
// filas: [{ nombre_completo, comision_nombre, codigo_socio? }]
// ---------------------------------------------------------
export async function importarMiembrosDesdeExcel(filas, comisiones) {
  const existentes = await listarMiembros()

  const mapaComisiones = new Map(
      comisiones.map((c) => [normalizarTexto(c.nombre), c.id])
  )

  const existentesPorCodigo = new Map(
      existentes.filter((m) => m.codigo_socio).map((m) => [m.codigo_socio, m])
  )
  const existentesPorNombre = new Map(
      existentes.map((m) => [normalizarTexto(m.nombre_completo), m])
  )

  const nuevos = []
  let omitidos = 0

  for (const fila of filas) {
    const nombre = (fila.nombre_completo || fila.nombre || '').toString().trim()
    if (!nombre) continue

    const codigo = fila.codigo_socio ? fila.codigo_socio.toString().trim() : null
    const yaExiste = codigo
        ? existentesPorCodigo.has(codigo)
        : existentesPorNombre.has(normalizarTexto(nombre))

    if (yaExiste) {
      omitidos += 1
      continue
    }

    const comisionNombre = (fila.comision || fila.comision_nombre || '').toString().trim()
    const comisionId = mapaComisiones.get(normalizarTexto(comisionNombre)) || null

    nuevos.push({
      nombre_completo: nombre,
      comision_id: comisionId,
      codigo_socio: codigo,
      activo: true,
    })

    // evitar duplicados dentro del mismo archivo
    if (codigo) existentesPorCodigo.set(codigo, true)
    existentesPorNombre.set(normalizarTexto(nombre), true)
  }

  if (nuevos.length > 0) {
    const { error } = await supabase.from('miembros').insert(nuevos)
    if (error) throw error
  }

  return { agregados: nuevos.length, omitidos }
}