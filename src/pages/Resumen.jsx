import { Fragment, useEffect, useState } from 'react'
import Layout from '../components/layout/Layout'
import { Boton, Cargando, Input, Select, Tarjeta } from '../components/shared/UI'
import { obtenerResumenMensual } from '../services/resumen'
import { listarComisiones } from '../services/comisiones'
import { MESES, colorPorPuntaje, nombreMes } from '../utils/constants'
import { exportarResumenExcel } from '../utils/excel'

const hoy = new Date()

export default function Resumen() {
  const [mes, setMes] = useState(hoy.getMonth() + 1)
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [comisiones, setComisiones] = useState([])
  const [comisionId, setComisionId] = useState('')
  const [filas, setFilas] = useState([])
  const [actividades, setActividades] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filaAbierta, setFilaAbierta] = useState(null)

  useEffect(() => {
    listarComisiones().then(setComisiones)
  }, [])

  useEffect(() => {
    setCargando(true)
    obtenerResumenMensual({ mes, anio, comisionId: comisionId || null }).then((res) => {
      setFilas(res.filas)
      setActividades(res.actividades)
      setCargando(false)
    })
  }, [mes, anio, comisionId])

  const exportar = () => {
    exportarResumenExcel(filas, { mes, anio, nombreMes: nombreMes(mes) })
  }

  return (
      <Layout>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 className="font-display text-3xl text-hueso">Resumen mensual</h1>
          <Boton variante="dorado" onClick={exportar} disabled={filas.length === 0}>
            Exportar a Excel
          </Boton>
        </div>

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
          <Select value={comisionId} onChange={(e) => setComisionId(e.target.value)}>
            <option value="">Todas las comisiones</option>
            {comisiones.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
            ))}
          </Select>
        </div>

        <Tarjeta>
          {cargando ? (
              <Cargando />
          ) : filas.length === 0 ? (
              <p className="text-sm text-vino-oscuro/60 py-6 text-center">
                No hay socios activos para mostrar en este filtro.
              </p>
          ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                  <tr className="text-left border-b border-vino/15 text-vino-oscuro/70">
                    <th className="py-2 pr-3">Socio</th>
                    <th className="py-2 pr-3">Comisión</th>
                    <th className="py-2 pr-3 text-right">Comisión (20)</th>
                    <th className="py-2 pr-3 text-right">Actividades (80)</th>
                    <th className="py-2 pr-3 text-right">Total</th>
                  </tr>
                  </thead>
                  <tbody>
                  {filas.map((f) => (
                      <Fragment key={f.miembro_id}>
                        <tr
                            className="border-b border-vino/8 cursor-pointer hover:bg-vino/5"
                            onClick={() =>
                                setFilaAbierta(filaAbierta === f.miembro_id ? null : f.miembro_id)
                            }
                        >
                          <td className="py-2 pr-3">{f.nombre_completo}</td>
                          <td className="py-2 pr-3 text-vino-oscuro/70">{f.comision}</td>
                          <td className="py-2 pr-3 text-right">{f.puntos_comision.toFixed(1)}</td>
                          <td className="py-2 pr-3 text-right">{f.puntos_actividades.toFixed(1)}</td>
                          <td className={`py-2 pr-3 text-right font-bold ${colorPorPuntaje(f.total)}`}>
                            {f.total.toFixed(1)}
                          </td>
                        </tr>
                        {filaAbierta === f.miembro_id && (
                            <tr className="bg-vino/5">
                              <td colSpan={5} className="py-3 px-3">
                                {f.detalle.length === 0 ? (
                                    <p className="text-xs text-vino-oscuro/60">
                                      No hay actividades registradas este mes.
                                    </p>
                                ) : (
                                    <ul className="grid sm:grid-cols-2 gap-1 text-xs text-vino-oscuro/80">
                                      {f.detalle.map((d) => (
                                          <li key={d.actividad_id} className="flex justify-between gap-2">
                                            <span>{d.nombre}</span>
                                            <span>
                                    {d.estado || 'Sin registrar'} ·{' '}
                                              {Number(d.puntos_obtenidos).toFixed(2)} pts
                                  </span>
                                          </li>
                                      ))}
                                    </ul>
                                )}
                              </td>
                            </tr>
                        )}
                      </Fragment>
                  ))}
                  </tbody>
                </table>
              </div>
          )}
          {actividades.length > 0 && (
              <p className="text-xs text-vino-oscuro/50 mt-4">
                Haz clic en un socio para ver el detalle por actividad · {actividades.length}{' '}
                actividad(es) este mes.
              </p>
          )}
        </Tarjeta>
      </Layout>
  )
}