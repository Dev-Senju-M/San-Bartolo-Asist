import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import CambiarPasswordForzado from './CambiarPasswordForzado'

export default function ProtectedRoute({ children }) {
    const { session, cargando } = useAuth()

    if (cargando) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="font-display text-lg text-[var(--color-vino)]">Cargando…</p>
            </div>
        )
    }

    if (!session) {
        return <Navigate to="/login" replace />
    }

    const debeCambiarPassword = session.user?.user_metadata?.debe_cambiar_password === true

    if (debeCambiarPassword) {
        return <CambiarPasswordForzado />
    }

    return children
}