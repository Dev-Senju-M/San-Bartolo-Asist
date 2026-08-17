import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Boton, Campo, Input, Tarjeta } from '../components/shared/UI'
import { registrarSocio } from '../services/registro'
import logoJesus from '../assets/images/Logo_Jesus.png'

export default function Registro() {
    const navigate = useNavigate()
    const [nombre, setNombre] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmar, setConfirmar] = useState('')
    const [error, setError] = useState('')
    const [enviando, setEnviando] = useState(false)
    const [mensajeExito, setMensajeExito] = useState('')

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
            const { sesionInmediata } = await registrarSocio({
                nombre: nombre.trim(),
                email: email.trim(),
                password,
            })

            if (sesionInmediata) {
                setMensajeExito('¡Cuenta creada! Redirigiendo…')
                setTimeout(() => navigate('/'), 1200)
            } else {
                setMensajeExito(
                    'Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.'
                )
            }
        } catch (err) {
            setError(err.message || 'No se pudo crear la cuenta.')
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
                    <h1 className="font-display text-xl text-vino text-center">Crear cuenta de socio</h1>
                    <p className="text-xs text-vino-oscuro/60 text-center">
                        Tu nombre debe coincidir exactamente con el registro de socios de la Hermandad.
                    </p>
                </div>

                {mensajeExito ? (
                    <p className="text-sm text-vino text-center">{mensajeExito}</p>
                ) : (
                    <form onSubmit={manejarSubmit} className="flex flex-col gap-4">
                        <Campo etiqueta="Nombre completo">
                            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
                        </Campo>
                        <Campo etiqueta="Correo">
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </Campo>
                        <Campo etiqueta="Contraseña">
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={8}
                            />
                        </Campo>
                        <Campo etiqueta="Confirmar contraseña">
                            <Input
                                type="password"
                                value={confirmar}
                                onChange={(e) => setConfirmar(e.target.value)}
                                required
                                minLength={8}
                            />
                        </Campo>

                        {error && <p className="text-sm text-carmesi">{error}</p>}

                        <Boton type="submit" variante="dorado" disabled={enviando} className="mt-2">
                            {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
                        </Boton>
                    </form>
                )}

                <Link to="/login" className="block text-center text-xs text-vino-oscuro/50 underline mt-4">
                    Ya tengo cuenta, iniciar sesión
                </Link>
            </Tarjeta>
        </div>
    )
}