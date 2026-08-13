import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import Login from './pages/Login'
import Miembros from './pages/Miembros'
import Actividades from './pages/Actividades'
import Asistencia from './pages/Asistencia'
import Comision from './pages/Comision'
import Resumen from './pages/Resumen'

export default function App() {
  return (
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
                path="/miembros"
                element={
                  <ProtectedRoute>
                    <Miembros />
                  </ProtectedRoute>
                }
            />
            <Route
                path="/actividades"
                element={
                  <ProtectedRoute>
                    <Actividades />
                  </ProtectedRoute>
                }
            />
            <Route
                path="/asistencia"
                element={
                  <ProtectedRoute>
                    <Asistencia />
                  </ProtectedRoute>
                }
            />
            <Route
                path="/comision"
                element={
                  <ProtectedRoute>
                    <Comision />
                  </ProtectedRoute>
                }
            />
            <Route
                path="/resumen"
                element={
                  <ProtectedRoute>
                    <Resumen />
                  </ProtectedRoute>
                }
            />
            <Route path="/" element={<Navigate to="/resumen" replace />} />
            <Route path="*" element={<Navigate to="/resumen" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
  )
}