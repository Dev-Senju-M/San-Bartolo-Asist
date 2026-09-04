import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/layout/Layout'
import { Boton, Cargando, Select, Tarjeta } from '../components/shared/UI'
import { listarActividades } from '../services/actividades'
import { listarMiembros } from '../services/miembros'
import { listarComisiones } from '../services/comisiones'
import {
  eliminarAsistencia,
  guardarAsistencias,
  obtenerAsistenciasPorActividad,
} from '../services/asistencias'
import { ESTADOS_ASISTENCIA, MESES, nombreMes, ordenarConColaboradoresAlFinal } from '../utils/constants'

const hoy = new Date()

export default function Asistencia() {
  const [mes, setMes] = useState(hoy.getMonth() + 1)
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [actividades, setActividades] = useState([])
  const [actividadId, setActividadId] = useState('')
  const [comisiones, setComisiones] = useState([])
  const [comisionId, setComisionId] = useState('')
  const [miembros, setMiembros] = useState([])
  const [estados, setEstados] = useState({}) // { miembro_id: 'A' | 'Ex' | 'F' }
  const [estadosOriginales, setEstadosOriginales] = useState({}) // lo que ya había en la BD
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)

  useEffect(() => {
    listarComisiones().then(setComisiones)
  }, [])

  useEffect(() => {
    listarActividades({ mes, anio }).then((data) => {
      setActividades(data)
      setActividadId(data[0]?.id || '')
    })
  }, [mes, anio])

  useEffect(() => {
    if (!actividadId) {
      setMiembros([])
      return
    }
    setCargando(true)
    setGuardado(false)
    Promise.all([
      listarMiembros({ soloActivos: true, comisionId: comisionId || null }),
      obtenerAsistenciasPorActividad(actividadId),
    ]).then(([m, asistenciasExistentes]) => {
      setMiembros(
          ordenarConColaboradoresAlFinal(m, {
            nombreComision: (mi) => mi.comisiones?.nombre,
            nombre: (mi) => mi.nombre_completo,
          })
      )
      const mapaEstados = {}
      asistenciasExistentes.forEach((a) => {
        mapaEstados[a.miembro_id] = a.estado
      })
      setEstados(mapaEstados)
      setEstadosOriginales(mapaEstados)
      setCargando(false)
    })
  }, [actividadId, comisionId])

  const actividadActual = useMemo(
      () => actividades.find((a) => a.id === actividadId),
      [actividades, actividadId]
  )

  const marcar = (miembroId, estado) => {
    setEstados((prev) => {
      const copia = { ...prev }
      if (copia[miembroId] === estado) {
        // Clic sobre el mismo estado ya marcado: lo quita
        delete copia[miembroId]
      } else {
        copia[miembroId] = estado
      }
      return copia
    })
    setGuardado(false)
  }

  const marcarTodos = (estado) => {
    const nuevo = {}
    miembros.forEach((m) => {
      nuevo[m.id] = estado
    })
    setEstados(nuevo)
    setGuardado(false)
  }

  const guardar = async () => {
    if (!actividadId) return
    setGuardando(true)
    try {
      const registros = miembros
          .filter((m) => estados[m.id])
          .map((m) => ({
            miembro_id: m.id,
            actividad_id: actividadId,
            estado: estados[m.id],
          }))

      // Socios que tenían marca antes y ahora la quitaron: hay que borrarla
      const paraEliminar = miembros.filter(
          (m) => estadosOriginales[m.id] && !estados[m.id]
      )

      if (registros.length > 0) {
        await guardarAsistencias(registros)
      }
      if (paraEliminar.length > 0) {
        await Promise.all(
            paraEliminar.map((m) => eliminarAsistencia(m.id, actividadId))
        )
      }

      setEstadosOriginales(estados)
      setGuardado(true)
    } finally {
      setGuardando(false)
    }
  }

  return (
      <Layout>
        <h1 className="font-display text-3xl text-hueso mb-6">Toma de asistencia</h1>

        <div className="flex flex-wrap gap-3 mb-6">
          <Select value={mes} onChange={(e) => setMes(Number(e.target.value))}>
            {MESES.map((m) => (
                <option key={m.valor} value={m.valor}>
                  {m.nombre}
                </option>
            ))}
          </Select>
          <input
              type="number"
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              className="w-28 px-3 py-2 rounded-md border border-vino/20 bg-white/80 text-sm"
          />
          <Select value={actividadId} onChange={(e) => setActividadId(e.target.value)}>
            <option value="">Selecciona una actividad</option>
            {actividades.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre} — {new Date(a.fecha + 'T00:00:00').toLocaleDateString('es-GT')}
                </option>
            ))}
          </Select>
          <Select value={comisionId} onChange={(e) => setComisionId(e.target.value)}>
            <option value="">Todas las comisiones</option>
            {comisiones.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
            ))}
          </Select>
        </div>

        {!actividadId ? (
            <Tarjeta>
              <p className="text-sm text-vino-oscuro/60 py-6 text-center">
                {actividades.length === 0
                    ? `No hay actividades creadas para ${nombreMes(mes)} ${anio}. Créalas primero en el módulo Actividades.`
                    : 'Selecciona una actividad para tomar asistencia.'}
              </p>
            </Tarjeta>
        ) : (
            <Tarjeta>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-display text-xl text-vino">{actividadActual?.nombre}</h2>
                  <p className="text-xs text-vino-oscuro/60">
                    Vale {Number(actividadActual?.puntos_asignados || 0).toFixed(2)} pts · A = 100% ·
                    Ex = 50% · F = 0% · Haz clic de nuevo sobre una marca para quitarla
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-vino-oscuro/60">{miembros.length} socio(s)</span>
                  <button
                      onClick={() => marcarTodos('A')}
                      className="text-xs underline text-vino-oscuro/70"
                  >
                    Marcar todos Asistió
                  </button>
                </div>
              </div>

              {cargando ? (
                  <Cargando />
              ) : miembros.length === 0 ? (
                  <p className="text-sm text-vino-oscuro/60 py-6 text-center">
                    No hay socios activos en esta comisión.
                  </p>
              ) : (
                  <div className="divide-y divide-vino/8">
                    {miembros.map((m) => (
                        <div key={m.id} className="flex items-center justify-between py-3 gap-3">
                          <span className="text-sm">{m.nombre_completo}</span>
                          <div className="flex gap-1.5 shrink-0">
                            {ESTADOS_ASISTENCIA.map((e) => (
                                <button
                                    key={e.valor}
                                    onClick={() => marcar(m.id, e.valor)}
                                    className={`px-3 py-1 rounded text-xs font-semibold border transition-colors ${
                                        estados[m.id] === e.valor
                                            ? e.clase
                                            : 'border-vino/15 text-vino-oscuro/40 hover:border-vino/40'
                                    }`}
                                    title={estados[m.id] === e.valor ? 'Clic para quitar la marca' : ''}
                                >
                                  {e.valor}
                                </button>
                            ))}
                          </div>
                        </div>
                    ))}
                  </div>
              )}

              <div className="flex items-center gap-3 mt-6">
                <Boton
                    variante="dorado"
                    onClick={guardar}
                    disabled={guardando || cargando || miembros.length === 0}
                >
                  {guardando ? 'Guardando…' : 'Guardar asistencia'}
                </Boton>
                {guardado && <span className="text-sm text-vino">Asistencia guardada ✓</span>}
              </div>
            </Tarjeta>
        )}
      </Layout>
  )
}