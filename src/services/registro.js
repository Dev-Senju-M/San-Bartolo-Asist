import { supabase } from '../lib/supabase'

export async function verificarNombreDisponible(nombre) {
    const { data, error } = await supabase.rpc('existe_miembro_disponible', { p_nombre: nombre })
    if (error) throw error
    return data === true
}

export async function registrarSocio({ nombre, email, password }) {
    const disponible = await verificarNombreDisponible(nombre)
    if (!disponible) {
        throw new Error(
            'Ese nombre no coincide con ningún socio activo, o ya tiene una cuenta creada.'
        )
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nombre_completo: nombre } },
    })
    if (error) throw error

    // Si Supabase exige confirmar el correo, data.session vendrá vacío y el
    // vínculo con el miembro se completará automáticamente la primera vez
    // que inicie sesión ya confirmado (ver AuthContext).
    return { sesionInmediata: !!data.session }
}