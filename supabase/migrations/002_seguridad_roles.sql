-- =========================================================
-- Migración 002: modelo de seguridad real (admin vs socio)
--
-- Problema que corrige:
-- Las políticas de la migración 001 daban acceso TOTAL
-- (leer, crear, editar, borrar) a CUALQUIER usuario autenticado,
-- sin distinguir entre un socio normal y un administrador.
-- Como la protección de rutas "solo admin" solo existía en el
-- frontend (RutaSoloAdmin.jsx), cualquier socio podía llamar la
-- API de Supabase directamente (con la anon key, que es pública)
-- y leer o modificar los datos de TODOS los demás socios.
--
-- Esta migración:
--   1. Añade la columna miembros.user_id para vincular cada
--      socio con su cuenta de auth.users.
--   2. Crea la tabla `admins` para marcar explícitamente qué
--      cuentas son administradoras (en vez de inferirlo).
--   3. Crea las funciones RPC que el frontend ya llamaba pero
--      que no existían en el esquema versionado:
--        is_socio(), vincular_cuenta_socio(), existe_miembro_disponible()
--   4. Reemplaza las políticas RLS abiertas por políticas que
--      distinguen admin / socio (dueño de su propio registro).
-- =========================================================

-- ---------------------------------------------------------
-- 0. Requiere unaccent para comparar nombres sin tildes,
--    igual que normalizarTexto() en el frontend.
-- ---------------------------------------------------------
create extension if not exists "unaccent";

create or replace function normalizar_texto(p_texto text)
returns text as $$
  select trim(regexp_replace(lower(unaccent(coalesce(p_texto, ''))), '\s+', ' ', 'g'));
$$ language sql immutable;

-- ---------------------------------------------------------
-- 1. Vínculo miembro <-> cuenta de auth
-- ---------------------------------------------------------
alter table miembros
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create unique index if not exists idx_miembros_user_id
  on miembros(user_id) where user_id is not null;

-- ---------------------------------------------------------
-- 2. Tabla explícita de administradores
--    (agrega aquí manualmente el UUID de cada cuenta admin,
--     ver instrucciones al final del archivo)
-- ---------------------------------------------------------
create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table admins enable row level security;

-- Nadie puede leer/escribir la tabla admins desde el cliente;
-- solo se consulta internamente vía funciones security definer.
create policy "Sin acceso directo a admins" on admins
  for all using (false) with check (false);

-- ---------------------------------------------------------
-- 3. Funciones auxiliares de rol
-- ---------------------------------------------------------
create or replace function is_admin()
returns boolean as $$
  select exists(select 1 from admins where user_id = auth.uid());
$$ language sql stable security definer set search_path = public;

create or replace function is_socio()
returns boolean as $$
  select exists(select 1 from miembros where user_id = auth.uid());
$$ language sql stable security definer set search_path = public;

-- Usado en el formulario público de registro (usuario aún NO autenticado)
create or replace function existe_miembro_disponible(p_nombre text)
returns boolean as $$
  select exists(
    select 1 from miembros
    where activo = true
      and user_id is null
      and normalizar_texto(nombre_completo) = normalizar_texto(p_nombre)
  );
$$ language sql stable security definer set search_path = public;

-- Vincula la cuenta recién creada/logueada con su fila de socio
create or replace function vincular_cuenta_socio(p_nombre text)
returns boolean as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    return false;
  end if;

  select id into v_id
  from miembros
  where activo = true
    and user_id is null
    and normalizar_texto(nombre_completo) = normalizar_texto(p_nombre)
  limit 1;

  if v_id is null then
    return false;
  end if;

  update miembros set user_id = auth.uid() where id = v_id;
  return true;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function existe_miembro_disponible(text) to anon, authenticated;
grant execute on function vincular_cuenta_socio(text) to authenticated;
grant execute on function is_socio() to authenticated;
grant execute on function is_admin() to authenticated;

-- ---------------------------------------------------------
-- 4. Reemplazar políticas abiertas por políticas admin/socio
-- ---------------------------------------------------------
drop policy if exists "Admin autenticado - comisiones" on comisiones;
drop policy if exists "Admin autenticado - miembros" on miembros;
drop policy if exists "Admin autenticado - actividades" on actividades;
drop policy if exists "Admin autenticado - asistencias" on asistencias;
drop policy if exists "Admin autenticado - comision_manual" on comision_manual;

-- comisiones: cualquier autenticado puede leer (se usa para mostrar
-- el nombre de la comisión propia); solo admin escribe.
create policy "comisiones_select" on comisiones
  for select using (auth.role() = 'authenticated');
create policy "comisiones_write" on comisiones
  for all using (is_admin()) with check (is_admin());

-- miembros: admin ve/edita todo; un socio solo ve SU propia fila.
create policy "miembros_select_admin" on miembros
  for select using (is_admin());
create policy "miembros_select_propio" on miembros
  for select using (user_id = auth.uid());
create policy "miembros_write_admin" on miembros
  for all using (is_admin()) with check (is_admin());

-- actividades: cualquier autenticado puede leer (el socio necesita
-- ver el detalle de actividades del mes en "Mi resumen"); solo
-- admin crea/edita/borra.
create policy "actividades_select" on actividades
  for select using (auth.role() = 'authenticated');
create policy "actividades_write" on actividades
  for all using (is_admin()) with check (is_admin());

-- asistencias: admin ve/edita todo; el socio solo ve SUS propias
-- asistencias (no puede editarlas).
create policy "asistencias_select_admin" on asistencias
  for select using (is_admin());
create policy "asistencias_select_propia" on asistencias
  for select using (
    exists(select 1 from miembros m where m.id = asistencias.miembro_id and m.user_id = auth.uid())
  );
create policy "asistencias_write_admin" on asistencias
  for all using (is_admin()) with check (is_admin());

-- comision_manual: mismo patrón que asistencias.
create policy "comision_manual_select_admin" on comision_manual
  for select using (is_admin());
create policy "comision_manual_select_propia" on comision_manual
  for select using (
    exists(select 1 from miembros m where m.id = comision_manual.miembro_id and m.user_id = auth.uid())
  );
create policy "comision_manual_write_admin" on comision_manual
  for all using (is_admin()) with check (is_admin());

-- =========================================================
-- PASOS MANUALES DESPUÉS DE APLICAR ESTA MIGRACIÓN
-- =========================================================
-- 1) Ejecuta este archivo en el SQL Editor de Supabase (o con
--    `supabase db push` si usas la CLI).
--
-- 2) Da de alta a cada cuenta administradora (la tuya incluida).
--    Busca el UUID en Authentication > Users y ejecuta:
--
--    insert into admins (user_id) values ('UUID-DE-LA-CUENTA-ADMIN');
--
-- 3) Si ya existían socios con cuenta creada ANTES de esta
--    migración, sus filas en `miembros` no tendrán user_id.
--    Se vincularán solos la próxima vez que inicien sesión
--    (AuthContext ya llama a vincular_cuenta_socio si hace falta).
--    Si alguno no vuelve a iniciar sesión, puedes vincularlo a mano:
--
--    update miembros set user_id = 'UUID-DEL-SOCIO' where id = 'ID-DEL-MIEMBRO';
-- =========================================================
