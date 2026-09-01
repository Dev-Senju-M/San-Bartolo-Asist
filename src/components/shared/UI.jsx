export function Boton({ children, variante = 'primario', className = '', ...props }) {
    const base = 'px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed'
    const variantes = {
        // Acción principal: neobrutalista, para que destaque sobre el resto del sitio (glass)
        primario: 'bg-carmesi text-hueso boton-duro hover:bg-carmesi/90',
        dorado: 'bg-dorado text-vino-oscuro transition-colors hover:bg-dorado-suave',
        // Acción destructiva: outline (mismo tono de alerta, forma distinta a "primario" para no confundirse)
        peligro: 'bg-transparent text-carmesi border-2 border-carmesi transition-colors hover:bg-carmesi hover:text-hueso',
        fantasma: 'bg-transparent text-vino border border-vino/30 transition-colors hover:bg-vino/5',
    }
    return (
        <button className={`${base} ${variantes[variante]} ${className}`} {...props}>
            {children}
        </button>
    )
}

export function Tarjeta({ children, className = '', variante = 'vidrio' }) {
    // variante "vidrio" (por defecto) para contenido informativo;
    // variante "dura" para datos/stats que deben destacar (neobrutalista)
    const clase = variante === 'dura' ? 'tarjeta-dura' : 'tarjeta-vidrio rounded-xl'
    return <div className={`${clase} p-4 sm:p-6 ${className}`}>{children}</div>
}

export function Campo({ etiqueta, children, className = '' }) {
    return (
        <label className={`flex flex-col gap-1 ${className}`}>
            {etiqueta && <span className="text-sm font-medium text-vino-oscuro/80">{etiqueta}</span>}
            {children}
        </label>
    )
}

export function Input(props) {
    return (
        <input
            {...props}
            className={`px-3 py-2 rounded-md border border-vino/20 bg-white/80 focus:border-dorado outline-none text-sm ${props.className || ''}`}
        />
    )
}

export function Select({ children, ...props }) {
    return (
        <select
            {...props}
            className={`px-3 py-2 rounded-md border border-vino/20 bg-white/80 focus:border-dorado outline-none text-sm ${props.className || ''}`}
        >
            {children}
        </select>
    )
}

export function InsigniaEstado({ estado }) {
    const mapa = {
        A: { texto: 'Asistió', clase: 'estado-a' },
        Ex: { texto: 'Excusa', clase: 'estado-ex' },
        F: { texto: 'Faltó', clase: 'estado-f' },
    }
    const info = mapa[estado] || { texto: '—', clase: 'estado-ex' }
    return (
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${info.clase}`}>
      {info.texto}
    </span>
    )
}

export function Cargando({ texto = 'Cargando…' }) {
    return (
        <div className="flex items-center justify-center py-12">
            <p className="font-display text-lg text-vino">{texto}</p>
        </div>
    )
}