export const MESES = [
  { valor: 1, nombre: 'Enero' },
  { valor: 2, nombre: 'Febrero' },
  { valor: 3, nombre: 'Marzo' },
  { valor: 4, nombre: 'Abril' },
  { valor: 5, nombre: 'Mayo' },
  { valor: 6, nombre: 'Junio' },
  { valor: 7, nombre: 'Julio' },
  { valor: 8, nombre: 'Agosto' },
  { valor: 9, nombre: 'Septiembre' },
  { valor: 10, nombre: 'Octubre' },
  { valor: 11, nombre: 'Noviembre' },
  { valor: 12, nombre: 'Diciembre' },
]

export const nombreMes = (mes) => MESES.find((m) => m.valor === mes)?.nombre || mes

export const ESTADOS_ASISTENCIA = [
  { valor: 'A', etiqueta: 'Asistió', clase: 'estado-a' },
  { valor: 'Ex', etiqueta: 'Excusa', clase: 'estado-ex' },
  { valor: 'F', etiqueta: 'Faltó', clase: 'estado-f' },
]

export const normalizarTexto = (texto = '') =>
    texto
        .toString()
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')

export const colorPorPuntaje = (puntaje) => {
  if (puntaje >= 90) return 'text-[var(--color-dorado)]'
  if (puntaje >= 70) return 'text-[var(--color-vino)]'
  if (puntaje >= 50) return 'text-amber-700'
  return 'text-[var(--color-carmesi)]'
}