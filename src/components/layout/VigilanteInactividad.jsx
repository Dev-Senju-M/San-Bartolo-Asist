import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useInactivityLogout } from '../../hooks/useInactivityLogout'

const MINUTOS_INACTIVIDAD = 30

export default function VigilanteInactividad() {
    const { session, logout } = useAuth()
    const navigate = useNavigate()

    const cerrarPorInactividad = useCallback(async () => {
        await logout()
        navigate('/login')
    }, [logout, navigate])

    useInactivityLogout(!!session, MINUTOS_INACTIVIDAD, cerrarPorInactividad)

    return null
}