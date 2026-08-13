import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Boton, Campo, Input, Tarjeta } from '../shared/UI'
import logoJesus from '../../assets/images/Logo_Jesus.png'

export default function CambiarPasswordForzado() {
    const { logout } = useAuth()
    const [password, setPassword] = useState('')
    const [confirmar, setConfirmar] = useState('')
    const [error, setError] = useState('')
    const [enviando, setEnviando] = useState(false)

    const manejarSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres.')
            return
        }
        if (password !== confirmar) {
            setError('Las contraseñas no coinciden.')
            return
        }

        setEnviando(true)
        try {
            const { error: err } = await supabase.auth.updateUser({
                password,
                data: { debe_cambiar_password: false },
            })
            if (err) throw err
            // Al actualizar los metadatos, la sesión se refresca sola vía
            // onAuthStateChange y ProtectedRoute deja pasar a la app.
        } catch (err) {
            setError('No se pudo actualizar la contraseña. Intenta de nuevo.')
        } finally {
            setEnviando(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="fondo-hermandad" />
            <Tarjeta className="w-full max-w-sm">
                <div className="flex flex-col items-center mb-6 gap-3">
                    <img src={logoJesus} alt="Escudo del Cordero" className="h-16 w-auto" />
                    <h1 className="font-display text-xl text-vino text-center">
                        Primer ingreso: crea tu contraseña
                    </h1>
                    <p className="text-xs text-vino-oscuro/60 text-center">
                        Por seguridad, debes definir una nueva contraseña antes de continuar.
                    </p>
                </div>

                <form onSubmit={manejarSubmit} className="flex flex-col gap-4">
                    <Campo etiqueta="Nueva contraseña">
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                            autoComplete="new-password"
                        />
                    </Campo>
                    <Campo etiqueta="Confirmar contraseña">
                        <Input
                            type="password"
                            value={confirmar}
                            onChange={(e) => setConfirmar(e.target.value)}
                            required
                            minLength={8}
                            autoComplete="new-password"
                        />
                    </Campo>

                    {error && <p className="text-sm text-carmesi">{error}</p>}

                    <Boton type="submit" variante="dorado" disabled={enviando} className="mt-2">
                        {enviando ? 'Guardando…' : 'Guardar y continuar'}
                    </Boton>
                    <button
                        type="button"
                        onClick={logout}
                        className="text-xs text-vino-oscuro/50 underline text-center"
                    >
                        Cerrar sesión
                    </button>
                </form>
            </Tarjeta>
        </div>
    )
} 