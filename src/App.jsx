import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import RutaSoloAdmin from './components/layout/RutaSoloAdmin'
import RedireccionInicio from './components/layout/RedireccionInicio'
import VigilanteInactividad from './components/layout/VigilanteInactividad'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Miembros from './pages/Miembros'
import Actividades from './pages/Actividades'
import Asistencia from './pages/Asistencia'
import Comision from './pages/Comision'
import Resumen from './pages/Resumen'
import MiResumen from './pages/MiResumen'

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <VigilanteInactividad />
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/registro" element={<Registro />} />

                    <Route
                        path="/mi-resumen"
                        element={
                            <ProtectedRoute>
                                <MiResumen />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/miembros"
                        element={
                            <ProtectedRoute>
                                <RutaSoloAdmin>
                                    <Miembros />
                                </RutaSoloAdmin>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/actividades"
                        element={
                            <ProtectedRoute>
                                <RutaSoloAdmin>
                                    <Actividades />
                                </RutaSoloAdmin>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/asistencia"
                        element={
                            <ProtectedRoute>
                                <RutaSoloAdmin>
                                    <Asistencia />
                                </RutaSoloAdmin>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/comision"
                        element={
                            <ProtectedRoute>
                                <RutaSoloAdmin>
                                    <Comision />
                                </RutaSoloAdmin>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/resumen"
                        element={
                            <ProtectedRoute>
                                <RutaSoloAdmin>
                                    <Resumen />
                                </RutaSoloAdmin>
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <RedireccionInicio />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="*"
                        element={
                            <ProtectedRoute>
                                <RedireccionInicio />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    )
}