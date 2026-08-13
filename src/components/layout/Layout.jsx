import Topbar from './Topbar'

export default function Layout({ children }) {
    return (
        <div className="min-h-screen">
            <div className="fondo-hermandad" />
            <Topbar />
            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</main>
        </div>
    )
}