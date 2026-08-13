import { useEffect, useState } from 'react'
import Layout from '../components/layout/Layout'
import { Boton, Cargando, Input, Select, Tarjeta } from '../components/shared/UI'
import { listarMiembros } from '../services/miembros'
import { guardarComisionManual, obtenerComisionManual } from '../services/comisionManual'
import { MESES } from '../utils/constants'

const hoy = new Date()

export default function Comision() {
  const [mes, setMes] = useState(hoy.getMonth() + 1)
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [miembros, setMiembros] = useState([])
  const [puntos, setPuntos] = useState({})
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [guardado, setGuardado] = useState(false)

  useEffect(() => {
    setCargando(true)
    setGuardado(false)
    Promise.all([listarMiembros({ soloActivos: true }), obtenerComisionManual(mes, anio)]).then(
        ([m, existentes]) => {
          setMiembros(m)
          const mapa = {}
          existentes.forEach((c) => {
            mapa[c.miembro_id] = c.puntos
          })
          setPuntos(mapa)
          setCargando(false)
        }
    )
  }, [mes, anio])

  const cambiar = (miembroId, valor) => {
    const num = Math.max(0, Math.min(20, Number(valor)))
    setPuntos((prev) => ({ ...prev, [miembroId]: num }))
    setGuardado(false)
  }

  const guardar = async () => {
    setGuardando(true)
    try {
      const registros = miembros.map((m) => ({
        miembro_id: m.id,
        mes,
        anio,
        puntos: puntos[m.id] ?? 0,
      }))
      await guardarComisionManual(registros)
      setGuardado(true)
    } finally {
      setGuardando(false)
    }
  }

  return (
      <Layout>
        <h1 className="font-display text-3xl text-hueso mb-6">Comisión (20 pts fijos)</h1>

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

        <Tarjeta>
          <p className="text-sm text-vino-oscuro/60 mb-4">
            Asigna manualmente el puntaje de Comisión de cada socio para este mes (0 a 20 puntos).
          </p>

          {cargando ? (
              <Cargando />
          ) : (
              <div className="divide-y divide-vino/8">
                {miembros.map((m) => (
                    <div key={m.id} className="flex items-center justify-between py-3 gap-3">
                      <span className="text-sm">{m.nombre_completo}</span>
                      <input
                          type="number"
                          min={0}
                          max={20}
                          step={0.5}
                          value={puntos[m.id] ?? 0}
                          onChange={(e) => cambiar(m.id, e.target.value)}
                          className="w-20 px-2 py-1 rounded-md border border-vino/20 bg-white/80 text-sm text-right"
                      />
                    </div>
                ))}
              </div>
          )}

          <div className="flex items-center gap-3 mt-6">
            <Boton variante="dorado" onClick={guardar} disabled={guardando || cargando}>
              {guardando ? 'Guardando…' : 'Guardar puntajes'}
            </Boton>
            {guardado && <span className="text-sm text-vino">Puntajes guardados ✓</span>}
          </div>
        </Tarjeta>
      </Layout>
  )
}