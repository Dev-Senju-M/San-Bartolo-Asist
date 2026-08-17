import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = cargando
  const [esSocio, setEsSocio] = useState(undefined) // undefined = sin determinar aún

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nuevaSesion) => {
      setSession(nuevaSesion)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    let cancelado = false

    async function resolverRol() {
      if (!session?.user) {
        setEsSocio(undefined)
        return
      }

      const { data: socio } = await supabase.rpc('is_socio')
      if (cancelado) return

      if (socio) {
        setEsSocio(true)
        return
      }

      // Aún no está vinculado. Si esta cuenta viene del registro público
      // (tiene nombre_completo guardado en sus metadatos), intenta
      // vincularla ahora. Esto cubre el caso de que la confirmación de
      // correo estuviera activada y el vínculo no se haya podido hacer
      // justo al momento del registro.
      const nombrePendiente = session.user.user_metadata?.nombre_completo
      if (nombrePendiente) {
        const { error } = await supabase.rpc('vincular_cuenta_socio', {
          p_nombre: nombrePendiente,
        })
        if (!error && !cancelado) {
          setEsSocio(true)
          return
        }
      }

      if (!cancelado) setEsSocio(false)
    }

    resolverRol()
    return () => {
      cancelado = true
    }
  }, [session])

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const logout = async () => {
    await supabase.auth.signOut()
  }

  const value = {
    session,
    usuario: session?.user ?? null,
    cargando: session === undefined,
    esSocio,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}