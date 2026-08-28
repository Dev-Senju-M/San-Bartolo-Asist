import { useState } from 'react'
import { Boton, Tarjeta } from '../shared/UI'
import { leerExcel, normalizarFilaMiembro } from '../../utils/excel'
import { importarMiembrosDesdeExcel } from '../../services/miembros'

export default function ImportarMiembros({ comisiones, onCerrar, onImportado }) {
    const [archivo, setArchivo] = useState(null)
    const [procesando, setProcesando] = useState(false)
    const [resultado, setResultado] = useState(null)
    const [error, setError] = useState('')

    const procesar = async () => {
        if (!archivo) return
        setProcesando(true)
        setError('')
        try {
            const filasCrudas = await leerExcel(archivo)
            const filas = filasCrudas.map(normalizarFilaMiembro)
            const res = await importarMiembrosDesdeExcel(filas, comisiones)
            setResultado(res)
            await onImportado()
        } catch (err) {
            setError('No se pudo procesar el archivo. Verifica que tenga columnas "nombre" y "comisión".')
        } finally {
            setProcesando(false)
        }
    }

    return (
        <div className="fixed inset-0 z-30 bg-vino-oscuro/60 flex items-center justify-center px-4">
            <Tarjeta className="w-full max-w-md">
                <h2 className="font-display text-xl text-vino mb-2">Importar miembros desde Excel</h2>
                <p className="text-sm text-vino-oscuro/70 mb-4">
                    El archivo debe tener columnas <strong>Nombre completo</strong> y{' '}
                    <strong>Comisión</strong> (y opcionalmente <strong>Código</strong>). Los socios que ya
                    existan se actualizarán si cambió su comisión; el resto se omite automáticamente.
                </p>

                {!resultado ? (
                    <>
                        <input
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                            className="text-sm mb-4 block w-full"
                        />
                        {error && <p className="text-sm text-carmesi mb-3">{error}</p>}
                        <div className="flex gap-2 justify-end">
                            <Boton variante="fantasma" onClick={onCerrar} disabled={procesando}>
                                Cancelar
                            </Boton>
                            <Boton variante="dorado" onClick={procesar} disabled={!archivo || procesando}>
                                {procesando ? 'Procesando…' : 'Importar'}
                            </Boton>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="rounded-lg bg-dorado/10 border border-dorado/30 p-4 mb-4 text-sm space-y-1">
                            <p>
                                <strong>{resultado.agregados}</strong> socio(s) agregado(s).
                            </p>
                            <p>
                                <strong>{resultado.actualizados}</strong> socio(s) actualizado(s).
                            </p>
                            <p>
                                <strong>{resultado.omitidos}</strong> socio(s) sin cambios.
                            </p>
                        </div>
                        <div className="flex justify-end">
                            <Boton variante="dorado" onClick={onCerrar}>
                                Cerrar
                            </Boton>
                        </div>
                    </>
                )}
            </Tarjeta>
        </div>
    )
}