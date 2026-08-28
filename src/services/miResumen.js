import { supabase } from '../lib/supabase'

export async function obtenerMiResumen(mes, anio) {
    // Antes: se pedía `miembros` con .limit(1) sin filtrar por el usuario,
    // confiando en que RLS devolviera solo la fila del socio logueado.
    // Como la política de la migración 001 daba acceso a TODOS los
    // miembros a cualquier autenticado, esto podía devolver los datos
    // de otro socio. Ahora se filtra explícitamente por user_id, y además
    // la migración 002 restringe RLS para que un socio solo pueda ver su
    // propia fila (defensa en profundidad: aunque una de las dos capas
    // falle, la otra sigue protegiendo).
    const {
        data: { user },
        error: errUser,
    } = await supabase.auth.getUser()
    if (errUser) throw errUser
    if (!user) return null

    const { data: miembro, error: errMiembro } = await supabase
        .from('miembros')
        .select('id, nombre_completo, comisiones(nombre)')
        .eq('user_id', user.id)
        .maybeSingle()
    if (errMiembro) throw errMiembro

    if (!miembro) return null // cuenta no vinculada a ningún socio (ej. cuenta admin)

    const [
        { data: actividades, error: errAct },
        { data: asistencias, error: errAsis },
        { data: comisionManual, error: errCom },
    ] = await Promise.all([
        supabase
            .from('actividades')
            .select('*')
            .eq('mes', mes)
            .eq('anio', anio)
            .eq('es_comision_fija', false)
            .order('fecha'),
        supabase.from('asistencias').select('*').eq('miembro_id', miembro.id),
        supabase
            .from('comision_manual')
            .select('*')
            .eq('mes', mes)
            .eq('anio', anio)
            .eq('miembro_id', miembro.id),
    ])
    if (errAct) throw errAct
    if (errAsis) throw errAsis
    if (errCom) throw errCom

    const puntosComision = comisionManual?.[0]?.puntos ?? 0

    const detalle = actividades.map((act) => {
        const asistencia = asistencias.find((a) => a.actividad_id === act.id)
        return {
            actividad_id: act.id,
            nombre: act.nombre,
            fecha: act.fecha,
            estado: asistencia?.estado ?? null,
            puntos_obtenidos: asistencia?.puntos_obtenidos ?? 0,
            puntos_posibles: act.puntos_asignados,
        }
    })

    const puntosActividades = detalle.reduce((sum, d) => sum + (d.puntos_obtenidos || 0), 0)
    const total = Number((puntosComision + puntosActividades).toFixed(2))

    return {
        nombre_completo: miembro.nombre_completo,
        comision: miembro.comisiones?.nombre ?? 'Sin comisión',
        puntos_comision: puntosComision,
        puntos_actividades: Number(puntosActividades.toFixed(2)),
        total,
        detalle,
    }
}
