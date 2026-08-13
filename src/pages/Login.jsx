import { useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Boton, Campo, Input, Tarjeta } from '../components/shared/UI'
import logoJesus from '../assets/images/Logo_Jesus.png'

export default function Login() {
  const { login, session, cargando } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (!cargando && session) {
    const destino = location.state?.from?.pathname || '/resumen'
    return <Navigate to={destino} replace />
  }

  const manejarSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setEnviando(true)
    try {
      await login(email, password)
      navigate('/resumen')
    } catch (err) {
      setError('Correo o contraseña incorrectos.')
    } finally {
      setEnviando(false)
    }
  }

  return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="fondo-hermandad" />
        <Tarjeta className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-6 gap-3">
            <img src={logoJesus} alt="Escudo del Cordero" className="h-20 w-auto" />
            <h1 className="font-display text-2xl text-vino text-center leading-tight">
              Hermandad de Jesús Nazareno de la Caída
              <br />y Santísima Virgen de Dolores
            </h1>
            <p className="text-xs uppercase tracking-widest text-vino/60">San Bartolomé Becerra</p>
          </div>

          <form onSubmit={manejarSubmit} className="flex flex-col gap-4">
            <Campo etiqueta="Correo">
              <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
              />
            </Campo>
            <Campo etiqueta="Contraseña">
              <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
              />
            </Campo>

            {error && <p className="text-sm text-carmesi">{error}</p>}

            <Boton type="submit" variante="dorado" disabled={enviando} className="mt-2">
              {enviando ? 'Ingresando…' : 'Ingresar'}
            </Boton>
          </form>
        </Tarjeta>
      </div>
  )
}