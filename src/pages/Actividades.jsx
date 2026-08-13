import { useEffect, useState } from 'react'
import Layout from '../components/layout/Layout'
import { Boton, Campo, Cargando, Input, Select, Tarjeta } from '../components/shared/UI'
import { crearActividad, eliminarActividad, listarActividades } from '../services/actividades'
import { MESES, nombreMes } from '../utils/constants'

const hoy = new Date()

export default function Actividades() {
  const [mes, setMes] = useState(hoy.getMonth() + 1)
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [actividades, setActividades] = useState([])
  const [cargando, setCargando] = useState(true)
  const [nombre, setNombre] = useState('')
  const [fecha, setFecha] = useState('')
  const [guardando, setGuardando] = useState(false)

  const cargar = async () => {
    setCargando(true)
    const data = await listarActividades({ mes, anio })
    setActividades(data)
    setCargando(false)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mes, anio])

  const manejarSubmit = async (e) => {
    e.preventDefault()
    if (!nombre.trim() || !fecha) return
    setGuardando(true)
    try {
      await crearActividad({ nombre: nombre.trim(), fecha })
      setNombre('')
      setFecha('')
      await cargar()
    } finally {
      setGuardando(false)
    }
  }

  const borrar = async (id) => {
    await eliminarActividad(id)
    await cargar()
  }

  const puntosPorActividad = actividades[0]?.puntos_asignados ?? 0

  return (
      <Layout>
        <h1 className="font-display text-3xl text-hueso mb-6">Actividades</h1>

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

        <Tarjeta className="mb-6">
          <h2 className="font-display text-xl text-vino mb-4">Nueva actividad</h2>
          <form onSubmit={manejarSubmit} className="grid sm:grid-cols-3 gap-4 items-end">
            <Campo etiqueta="Nombre de la actividad" className="sm:col-span-2">
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </Campo>
            <Campo etiqueta="Fecha">
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
            </Campo>
            <Boton type="submit" variante="dorado" disabled={guardando} className="sm:col-span-3 w-fit">
              {guardando ? 'Guardando…' : 'Agregar actividad'}
            </Boton>
          </form>
        </Tarjeta>

        <Tarjeta>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-vino">
              {nombreMes(mes)} {anio}
            </h2>
            {actividades.length > 0 && (
                <span className="text-sm text-vino-oscuro/70">
              {actividades.length} actividad(es) · {puntosPorActividad.toFixed(2)} pts c/u
            </span>
            )}
          </div>

          {cargando ? (
              <Cargando />
          ) : actividades.length === 0 ? (
              <p className="text-sm text-vino-oscuro/60 py-6 text-center">
                No hay actividades registradas para este mes.
              </p>
          ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                  <tr className="text-left border-b border-vino/15 text-vino-oscuro/70">
                    <th className="py-2 pr-3">Actividad</th>
                    <th className="py-2 pr-3">Fecha</th>
                    <th className="py-2 pr-3">Puntos</th>
                    <th className="py-2 pr-3 text-right">Acciones</th>
                  </tr>
                  </thead>
                  <tbody>
                  {actividades.map((a) => (
                      <tr key={a.id} className="border-b border-vino/8">
                        <td className="py-2 pr-3">{a.nombre}</td>
                        <td className="py-2 pr-3 text-vino-oscuro/70">
                          {new Date(a.fecha + 'T00:00:00').toLocaleDateString('es-GT')}
                        </td>
                        <td className="py-2 pr-3 text-vino-oscuro/70">
                          {Number(a.puntos_asignados).toFixed(2)} pts
                        </td>
                        <td className="py-2 pr-3 text-right">
                          <button className="text-carmesi underline text-xs" onClick={() => borrar(a.id)}>
                            Eliminar
                          </button>
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
          )}
          <p className="text-xs text-vino-oscuro/50 mt-4">
            Los 80 puntos del mes se reparten automáticamente entre todas las actividades. El
            puntaje fijo de "Comisión" (20 pts) se gestiona en el módulo Comisión.
          </p>
        </Tarjeta>
      </Layout>
  )
}