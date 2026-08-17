import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function RutaSoloAdmin({ children }) {
    const { esSocio } = useAuth()

    if (esSocio === undefined) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="font-display text-lg text-vino">Cargando…</p>
            </div>
        )
    }

    if (esSocio) {
        return <Navigate to="/mi-resumen" replace />
    }

    return children
}