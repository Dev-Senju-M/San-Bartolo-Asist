import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import cintillo from '../../assets/images/cintillo_horizontal_2026_02.png'

const ENLACES_ADMIN = [
    { to: '/miembros', label: 'Miembros' },
    { to: '/actividades', label: 'Actividades' },
    { to: '/asistencia', label: 'Asistencia' },
    { to: '/comision', label: 'Comisión' },
    { to: '/resumen', label: 'Resumen' },
]

const ENLACES_SOCIO = [{ to: '/mi-resumen', label: 'Mi Resumen' }]

export default function Topbar() {
    const { logout, esSocio } = useAuth()
    const navigate = useNavigate()
    const [menuAbierto, setMenuAbierto] = useState(false)

    const enlaces = esSocio ? ENLACES_SOCIO : ENLACES_ADMIN

    const cerrarSesion = async () => {
        await logout()
        navigate('/login')
    }

    return (
        <header className="tarjeta-vidrio-oscura sticky top-0 z-20 px-4 sm:px-6 py-4">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <img
                        src={cintillo}
                        alt="Hermandad de Jesús Nazareno de la Caída y Santísima Virgen de Dolores San Bartolomé Becerra"
                        className="h-14 sm:h-16 w-auto shrink-0 object-contain"
                    />
                    <span className="hidden md:block font-display text-hueso text-lg leading-tight truncate">
            Control de Asistencia
          </span>
                </div>

                <nav className="hidden md:flex items-center gap-1">
                    {enlaces.map((enlace) => (
                        <NavLink
                            key={enlace.to}
                            to={enlace.to}
                            className={({ isActive }) =>
                                `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                    isActive
                                        ? 'bg-dorado text-vino-oscuro'
                                        : 'text-hueso/85 hover:bg-hueso/10 hover:text-dorado-suave'
                                }`
                            }
                        >
                            {enlace.label}
                        </NavLink>
                    ))}
                    <button
                        onClick={cerrarSesion}
                        className="ml-2 px-3 py-1.5 rounded-md text-sm font-medium text-hueso/85 hover:bg-carmesi/30 hover:text-hueso transition-colors"
                    >
                        Salir
                    </button>
                </nav>

                <button
                    className="md:hidden text-hueso p-2"
                    onClick={() => setMenuAbierto((v) => !v)}
                    aria-label="Abrir menú"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
                    </svg>
                </button>
            </div>

            {menuAbierto && (
                <nav className="md:hidden mt-3 flex flex-col gap-1 max-w-6xl mx-auto">
                    {enlaces.map((enlace) => (
                        <NavLink
                            key={enlace.to}
                            to={enlace.to}
                            onClick={() => setMenuAbierto(false)}
                            className={({ isActive }) =>
                                `px-3 py-2 rounded-md text-sm font-medium ${
                                    isActive ? 'bg-dorado text-vino-oscuro' : 'text-hueso/85 hover:bg-hueso/10'
                                }`
                            }
                        >
                            {enlace.label}
                        </NavLink>
                    ))}
                    <button
                        onClick={cerrarSesion}
                        className="text-left px-3 py-2 rounded-md text-sm font-medium text-hueso/85 hover:bg-carmesi/30"
                    >
                        Salir
                    </button>
                </nav>
            )}
        </header>
    )
}