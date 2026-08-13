import { useEffect, useState } from 'react'
import Layout from '../components/layout/Layout'
import { Boton, Campo, Cargando, Input, Select, Tarjeta } from '../components/shared/UI'
import {
  actualizarMiembro,
  crearMiembro,
  darDeBajaMiembro,
  listarMiembros,
  reactivarMiembro,
} from '../services/miembros'
import { listarComisiones } from '../services/comisiones'
import ImportarMiembros from '../components/miembros/ImportarMiembros'

const MIEMBRO_VACIO = { nombre_completo: '', comision_id: '', codigo_socio: '' }

export default function Miembros() {
  const [miembros, setMiembros] = useState([])
  const [comisiones, setComisiones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtroComision, setFiltroComision] = useState('')
  const [mostrarInactivos, setMostrarInactivos] = useState(false)
  const [form, setForm] = useState(MIEMBRO_VACIO)
  const [editandoId, setEditandoId] = useState(null)
  const [mostrarImportar, setMostrarImportar] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const cargarDatos = async () => {
    setCargando(true)
    const [m, c] = await Promise.all([listarMiembros(), listarComisiones()])
    setMiembros(m)
    setComisiones(c)
    setCargando(false)
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const manejarSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre_completo.trim()) return
    setGuardando(true)
    try {
      const payload = {
        nombre_completo: form.nombre_completo.trim(),
        comision_id: form.comision_id || null,
        codigo_socio: form.codigo_socio.trim() || null,
      }
      if (editandoId) {
        await actualizarMiembro(editandoId, payload)
      } else {
        await crearMiembro(payload)
      }
      setForm(MIEMBRO_VACIO)
      setEditandoId(null)
      await cargarDatos()
    } finally {
      setGuardando(false)
    }
  }

  const editar = (m) => {
    setEditandoId(m.id)
    setForm({
      nombre_completo: m.nombre_completo,
      comision_id: m.comision_id || '',
      codigo_socio: m.codigo_socio || '',
    })
  }

  const cancelarEdicion = () => {
    setEditandoId(null)
    setForm(MIEMBRO_VACIO)
  }

  const alternarActivo = async (m) => {
    if (m.activo) await darDeBajaMiembro(m.id)
    else await reactivarMiembro(m.id)
    await cargarDatos()
  }

  const miembrosFiltrados = miembros.filter((m) => {
    if (!mostrarInactivos && !m.activo) return false
    if (filtroComision && m.comision_id !== filtroComision) return false
    return true
  })

  return (
      <Layout>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 className="font-display text-3xl text-hueso">Miembros</h1>
          <Boton variante="dorado" onClick={() => setMostrarImportar(true)}>
            Importar desde Excel
          </Boton>
        </div>

        <Tarjeta className="mb-6">
          <h2 className="font-display text-xl text-vino mb-4">
            {editandoId ? 'Editar socio' : 'Nuevo socio'}
          </h2>
          <form onSubmit={manejarSubmit} className="grid sm:grid-cols-3 gap-4 items-end">
            <Campo etiqueta="Nombre completo">
              <Input
                  value={form.nombre_completo}
                  onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })}
                  required
              />
            </Campo>
            <Campo etiqueta="Comisión">
              <Select
                  value={form.comision_id}
                  onChange={(e) => setForm({ ...form, comision_id: e.target.value })}
              >
                <option value="">Sin asignar</option>
                {comisiones.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                ))}
              </Select>
            </Campo>
            <Campo etiqueta="Código de socio (opcional)">
              <Input
                  value={form.codigo_socio}
                  onChange={(e) => setForm({ ...form, codigo_socio: e.target.value })}
              />
            </Campo>
            <div className="flex gap-2 sm:col-span-3">
              <Boton type="submit" variante="dorado" disabled={guardando}>
                {editandoId ? 'Guardar cambios' : 'Agregar socio'}
              </Boton>
              {editandoId && (
                  <Boton type="button" variante="fantasma" onClick={cancelarEdicion}>
                    Cancelar
                  </Boton>
              )}
            </div>
          </form>
        </Tarjeta>

        <Tarjeta>
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <Select value={filtroComision} onChange={(e) => setFiltroComision(e.target.value)}>
              <option value="">Todas las comisiones</option>
              {comisiones.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
              ))}
            </Select>
            <label className="flex items-center gap-2 text-sm text-vino-oscuro/80">
              <input
                  type="checkbox"
                  checked={mostrarInactivos}
                  onChange={(e) => setMostrarInactivos(e.target.checked)}
              />
              Mostrar dados de baja
            </label>
            <span className="text-sm text-vino-oscuro/60 ml-auto">
            {miembrosFiltrados.length} socio(s)
          </span>
          </div>

          {cargando ? (
              <Cargando />
          ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                  <tr className="text-left border-b border-vino/15 text-vino-oscuro/70">
                    <th className="py-2 pr-3">Nombre</th>
                    <th className="py-2 pr-3">Comisión</th>
                    <th className="py-2 pr-3">Estado</th>
                    <th className="py-2 pr-3 text-right">Acciones</th>
                  </tr>
                  </thead>
                  <tbody>
                  {miembrosFiltrados.map((m) => (
                      <tr key={m.id} className="border-b border-vino/8">
                        <td className="py-2 pr-3">{m.nombre_completo}</td>
                        <td className="py-2 pr-3 text-vino-oscuro/70">
                          {m.comisiones?.nombre || 'Sin asignar'}
                        </td>
                        <td className="py-2 pr-3">
                          {m.activo ? (
                              <span className="text-xs font-semibold text-dorado bg-dorado/15 px-2 py-0.5 rounded">
                          Activo
                        </span>
                          ) : (
                              <span className="text-xs font-semibold text-carmesi bg-carmesi/10 px-2 py-0.5 rounded">
                          Inactivo
                        </span>
                          )}
                        </td>
                        <td className="py-2 pr-3 text-right space-x-2">
                          <button className="text-vino underline text-xs" onClick={() => editar(m)}>
                            Editar
                          </button>
                          <button
                              className="text-carmesi underline text-xs"
                              onClick={() => alternarActivo(m)}
                          >
                            {m.activo ? 'Dar de baja' : 'Reactivar'}
                          </button>
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
          )}
        </Tarjeta>

        {mostrarImportar && (
            <ImportarMiembros
                comisiones={comisiones}
                onCerrar={() => setMostrarImportar(false)}
                onImportado={cargarDatos}
            />
        )}
      </Layout>
  )
}