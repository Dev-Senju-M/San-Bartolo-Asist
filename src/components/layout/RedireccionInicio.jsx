import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function RedireccionInicio() {
    const { esSocio } = useAuth()

    if (esSocio === undefined) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="font-display text-lg text-vino">Cargando…</p>
            </div>
        )
    }

    return <Navigate to={esSocio ? '/mi-resumen' : '/resumen'} replace />
}