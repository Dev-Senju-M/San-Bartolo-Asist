import { useEffect, useState } from 'react'
import Layout from '../components/layout/Layout'
import { Cargando, Input, Select, Tarjeta } from '../components/shared/UI'
import { InsigniaEstado } from '../components/shared/UI'
import { obtenerMiResumen } from '../services/miResumen'
import { MESES, colorPorPuntaje } from '../utils/constants'

const hoy = new Date()

export default function MiResumen() {
    const [mes, setMes] = useState(hoy.getMonth() + 1)
    const [anio, setAnio] = useState(hoy.getFullYear())
    const [resumen, setResumen] = useState(null)
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        setCargando(true)
        obtenerMiResumen(mes, anio).then((r) => {
            setResumen(r)
            setCargando(false)
        })
    }, [mes, anio])

    return (
        <Layout>
            <h1 className="font-display text-3xl text-hueso mb-6">Mi resumen</h1>

            <div className="flex flex-wrap gap-3 mb-6">
                <Select value={mes} onChange={(e) => setMes(Number(e.target.value))}>
                    {MESES.map((m) => (
                        <option key={m.valor} value={m.valor}>
                            {m.nombre}
                        </option>
                    ))}
                </Select>
                <Input
                    type="number"
                    value={anio}
                    onChange={(e) => setAnio(Number(e.target.value))}
                    className="w-28"
                />
            </div>

            {cargando ? (
                <Tarjeta>
                    <Cargando />
                </Tarjeta>
            ) : !resumen ? (
                <Tarjeta>
                    <p className="text-sm text-vino-oscuro/60 py-6 text-center">
                        Esta cuenta no está vinculada a ningún socio.
                    </p>
                </Tarjeta>
            ) : (
                <>
                    <Tarjeta className="mb-6">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="font-display text-2xl text-vino">{resumen.nombre_completo}</h2>
                                <p className="text-sm text-vino-oscuro/60">{resumen.comision}</p>
                            </div>
                            <div className="text-right">
                                <p className={`font-display text-4xl font-bold ${colorPorPuntaje(resumen.total)}`}>
                                    {resumen.total.toFixed(1)}
                                </p>
                                <p className="text-xs text-vino-oscuro/50">de 100 puntos</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-vino/10">
                            <div>
                                <p className="text-xs text-vino-oscuro/50">Comisión (20 pts)</p>
                                <p className="text-lg font-semibold text-vino">
                                    {resumen.puntos_comision.toFixed(1)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-vino-oscuro/50">Actividades (80 pts)</p>
                                <p className="text-lg font-semibold text-vino">
                                    {resumen.puntos_actividades.toFixed(1)}
                                </p>
                            </div>
                        </div>
                    </Tarjeta>

                    <Tarjeta>
                        <h3 className="font-display text-lg text-vino mb-4">Detalle de actividades</h3>
                        {resumen.detalle.length === 0 ? (
                            <p className="text-sm text-vino-oscuro/60 py-6 text-center">
                                No hay actividades registradas este mes.
                            </p>
                        ) : (
                            <div className="divide-y divide-vino/8">
                                {resumen.detalle.map((d) => (
                                    <div key={d.actividad_id} className="flex items-center justify-between py-3">
                                        <div>
                                            <p className="text-sm">{d.nombre}</p>
                                            <p className="text-xs text-vino-oscuro/50">
                                                {new Date(d.fecha + 'T00:00:00').toLocaleDateString('es-GT')}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {d.estado ? <InsigniaEstado estado={d.estado} /> : (
                                                <span className="text-xs text-vino-oscuro/40">Sin registrar</span>
                                            )}
                                            <span className="text-sm font-semibold text-vino w-14 text-right">
                        {Number(d.puntos_obtenidos).toFixed(2)}
                      </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Tarjeta>
                </>
            )}
        </Layout>
    )
}