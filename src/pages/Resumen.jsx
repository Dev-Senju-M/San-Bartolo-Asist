import { useEffect, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import Layout from '../components/layout/Layout'
import { Boton, Cargando, Input, Select, Tarjeta } from '../components/shared/UI'
import { obtenerResumenMensual } from '../services/resumen'
import { listarComisiones } from '../services/comisiones'
import { MESES, colorPorPuntaje, nombreMes, ordenarConColaboradoresAlFinal } from '../utils/constants'
import { exportarResumenExcel } from '../utils/excel'

const hoy = new Date()

const ESTILO_ESTADO = {
  A: 'text-dorado',
  Ex: 'text-vino',
  F: 'text-carmesi',
}

export default function Resumen() {
  const [mes, setMes] = useState(hoy.getMonth() + 1)
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [comisiones, setComisiones] = useState([])
  const [comisionId, setComisionId] = useState('')
  const [filas, setFilas] = useState([])
  const [actividades, setActividades] = useState([])
  const [cargando, setCargando] = useState(true)
  const [exportandoPng, setExportandoPng] = useState(false)
  const tablaRef = useRef(null)

  useEffect(() => {
    listarComisiones().then(setComisiones)
  }, [])

  useEffect(() => {
    setCargando(true)
    obtenerResumenMensual({ mes, anio, comisionId: comisionId || null }).then((res) => {
      setFilas(
          ordenarConColaboradoresAlFinal(res.filas, {
            nombreComision: (f) => f.comision,
            nombre: (f) => f.nombre_completo,
          })
      )
      setActividades(res.actividades)
      setCargando(false)
    })
  }, [mes, anio, comisionId])

  const nombreFiltroActual = () => {
    if (!comisionId) return 'Todas las comisiones'
    if (comisionId === 'sin-comision') return 'Sin comisión'
    return comisiones.find((c) => c.id === comisionId)?.nombre || ''
  }

  const exportar = () => {
    exportarResumenExcel(filas, {
      mes,
      anio,
      nombreMes: nombreMes(mes),
      nombreFiltro: nombreFiltroActual(),
      actividades,
    })
  }

  const exportarPng = async () => {
    if (!tablaRef.current) return
    setExportandoPng(true)
    try {
      const canvas = await html2canvas(tablaRef.current, {
        backgroundColor: '#fbf8f2',
        scale: 2,
      })
      const enlace = document.createElement('a')
      const sufijoComision = comisionId
          ? `_${nombreFiltroActual().toLowerCase().replace(/\s+/g, '-')}`
          : ''
      enlace.download = `asistencia_${nombreMes(mes)}_${anio}${sufijoComision}.png`
      enlace.href = canvas.toDataURL('image/png')
      enlace.click()
    } finally {
      setExportandoPng(false)
    }
  }

  return (
      <Layout ancho="completo">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 className="font-display text-3xl text-hueso">Resumen mensual</h1>
          <div className="flex gap-2">
            <Boton
                variante="fantasma"
                onClick={exportarPng}
                disabled={filas.length === 0 || exportandoPng}
                className="bg-hueso/90"
            >
              {exportandoPng ? 'Generando…' : 'Exportar a PNG'}
            </Boton>
            <Boton variante="dorado" onClick={exportar} disabled={filas.length === 0}>
              Exportar a Excel
            </Boton>
          </div>
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
            <option value="sin-comision">Sin comisión</option>
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
                <div ref={tablaRef} className="inline-block min-w-full bg-[#fbf8f2] p-2">
                  <p className="font-display text-lg text-vino mb-3 px-1">
                    {nombreMes(mes)} {anio} · {nombreFiltroActual()}
                  </p>
                  <table className="w-full text-sm">
                    <thead>
                    <tr className="text-left border-b border-vino/15 text-vino-oscuro/70">
                      <th className="py-2 pr-3 sticky left-0 bg-[#fbf8f2] z-10">Socio</th>
                      <th className="py-2 pr-3">Comisión</th>
                      {actividades.map((act) => (
                          <th key={act.id} className="py-2 px-3 text-center align-bottom">
                            <div className="whitespace-nowrap">{act.nombre}</div>
                            <div className="text-[10px] font-normal text-vino-oscuro/50">
                              {new Date(act.fecha + 'T00:00:00').toLocaleDateString('es-GT', {
                                day: '2-digit',
                                month: '2-digit',
                              })}{' '}
                              · {Number(act.puntos_asignados).toFixed(1)} pts
                            </div>
                          </th>
                      ))}
                      <th className="py-2 px-3 text-right">Comisión (20)</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filas.map((f) => (
                        <tr key={f.miembro_id} className="border-b border-vino/8">
                          <td className="py-2 pr-3 sticky left-0 bg-[#fbf8f2] z-10 whitespace-nowrap">
                            {f.nombre_completo}
                          </td>
                          <td className="py-2 pr-3 text-vino-oscuro/70 whitespace-nowrap">
                            {f.comision}
                          </td>
                          {f.detalle.map((d) => (
                              <td key={d.actividad_id} className="py-2 px-3 text-center">
                                {d.estado ? (
                                    <div className={`font-semibold ${ESTILO_ESTADO[d.estado]}`}>
                                      {d.estado}
                                      <div className="text-[10px] font-normal text-vino-oscuro/50">
                                        {Number(d.puntos_obtenidos).toFixed(2)}
                                      </div>
                                    </div>
                                ) : (
                                    <span className="text-vino-oscuro/30">—</span>
                                )}
                              </td>
                          ))}
                          <td className="py-2 px-3 text-right">{f.puntos_comision.toFixed(1)}</td>
                          <td className={`py-2 px-3 text-right font-bold ${colorPorPuntaje(f.total)}`}>
                            {f.total.toFixed(1)}
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </div>
          )}
          {actividades.length > 0 && (
              <p className="text-xs text-vino-oscuro/50 mt-4">
                {actividades.length} actividad(es) este mes · A = Asistió · Ex = Excusa · F = Faltó
              </p>
          )}
        </Tarjeta>
      </Layout>
  )
}