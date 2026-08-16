import Topbar from './Topbar'

export default function Layout({ children, ancho = 'normal' }) {
    const anchoClase = ancho === 'completo' ? 'max-w-none' : 'max-w-6xl mx-auto'

    return (
        <div className="min-h-screen">
            <div className="fondo-hermandad" />
            <Topbar />
            <main className={`${anchoClase} px-4 sm:px-6 py-6 sm:py-8`}>{children}</main>
        </div>
    )
}