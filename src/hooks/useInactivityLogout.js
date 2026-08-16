import { useEffect, useRef } from 'react'

const EVENTOS_ACTIVIDAD = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll']

// Cierra sesión automáticamente después de `minutos` sin actividad del usuario
export function useInactivityLogout(activo, minutos, alExpirar) {
    const timeoutRef = useRef(null)

    useEffect(() => {
        if (!activo) return

        const milisegundos = minutos * 60 * 1000

        const reiniciarTemporizador = () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            timeoutRef.current = setTimeout(() => {
                alExpirar()
            }, milisegundos)
        }

        reiniciarTemporizador()

        EVENTOS_ACTIVIDAD.forEach((evento) =>
            window.addEventListener(evento, reiniciarTemporizador)
        )

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
            EVENTOS_ACTIVIDAD.forEach((evento) =>
                window.removeEventListener(evento, reiniciarTemporizador)
            )
        }
    }, [activo, minutos, alExpirar])
}