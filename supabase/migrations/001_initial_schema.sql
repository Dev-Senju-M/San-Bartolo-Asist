-- =========================================================
-- Hermandad de Jesús Nazareno de la Caída y Santísima Virgen
-- de Dolores San Bartolomé Becerra
-- Esquema inicial: comisiones, miembros, actividades,
-- asistencias, comision_manual
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- Tabla: comisiones
-- ---------------------------------------------------------
create table if not exists comisiones (
                                          id uuid primary key default gen_random_uuid(),
    nombre text not null unique
    );

insert into comisiones (nombre) values
                                    ('Junta Directiva'),
                                    ('Adorno'),
                                    ('Nazarenos'),
                                    ('Romanos')
    on conflict (nombre) do nothing;

-- ---------------------------------------------------------
-- Tabla: miembros
-- ---------------------------------------------------------
create table if not exists miembros (
                                        id uuid primary key default gen_random_uuid(),
    nombre_completo text not null,
    comision_id uuid references comisiones(id) on delete set null,
    activo boolean not null default true,
    fecha_ingreso date,
    codigo_socio text unique, -- opcional, usado para import por Excel
    created_at timestamptz not null default now()
    );

create index if not exists idx_miembros_comision on miembros(comision_id);
create index if not exists idx_miembros_activo on miembros(activo);

-- ---------------------------------------------------------
-- Tabla: actividades
-- ---------------------------------------------------------
create table if not exists actividades (
                                           id uuid primary key default gen_random_uuid(),
    nombre text not null,
    fecha date not null,
    mes int not null check (mes between 1 and 12),
    anio int not null,
    puntos_asignados numeric not null default 0,
    es_comision_fija boolean not null default false,
    created_at timestamptz not null default now()
    );

create index if not exists idx_actividades_mes_anio on actividades(mes, anio);

-- ---------------------------------------------------------
-- Tabla: asistencias
-- ---------------------------------------------------------
create table if not exists asistencias (
                                           id uuid primary key default gen_random_uuid(),
    miembro_id uuid not null references miembros(id) on delete cascade,
    actividad_id uuid not null references actividades(id) on delete cascade,
    estado text not null check (estado in ('A', 'Ex', 'F')),
    puntos_obtenidos numeric not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (miembro_id, actividad_id)
    );

create index if not exists idx_asistencias_actividad on asistencias(actividad_id);
create index if not exists idx_asistencias_miembro on asistencias(miembro_id);

-- ---------------------------------------------------------
-- Tabla: comision_manual (los 20 pts fijos, mensual, manual)
-- ---------------------------------------------------------
create table if not exists comision_manual (
                                               id uuid primary key default gen_random_uuid(),
    miembro_id uuid not null references miembros(id) on delete cascade,
    mes int not null check (mes between 1 and 12),
    anio int not null,
    puntos numeric not null default 0 check (puntos >= 0 and puntos <= 20),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (miembro_id, mes, anio)
    );

create index if not exists idx_comision_manual_mes_anio on comision_manual(mes, anio);

-- =========================================================
-- Recalcular puntos_asignados de las actividades de un mes
-- (80 pts repartidos entre las actividades reales, excluyendo
-- la actividad fija "Comisión")
-- =========================================================
create or replace function recalcular_puntos_actividades(p_mes int, p_anio int)
returns void as $$
declare
v_cantidad int;
  v_puntos numeric;
begin
select count(*) into v_cantidad
from actividades
where mes = p_mes and anio = p_anio and es_comision_fija = false;

if v_cantidad = 0 then
    return;
end if;

  v_puntos := round(80.0 / v_cantidad, 4);

update actividades
set puntos_asignados = v_puntos
where mes = p_mes and anio = p_anio and es_comision_fija = false;

update asistencias a
set puntos_obtenidos = case act.estado_factor
                           when 'A' then act.puntos_asignados
                           when 'Ex' then act.puntos_asignados * 0.5
                           else 0
    end,
    updated_at = now()
    from (
    select act.id, act.puntos_asignados, a.estado as estado_factor
    from actividades act
    join asistencias a on a.actividad_id = act.id
    where act.mes = p_mes and act.anio = p_anio and act.es_comision_fija = false
  ) act
where a.actividad_id = act.id;
end;
$$ language plpgsql;

create or replace function trg_actividades_recalcular()
returns trigger as $$
begin
  if (tg_op = 'DELETE') then
    perform recalcular_puntos_actividades(old.mes, old.anio);
return old;
else
    perform recalcular_puntos_actividades(new.mes, new.anio);
return new;
end if;
end;
$$ language plpgsql;

drop trigger if exists on_actividades_change on actividades;
create trigger on_actividades_change
    after insert or delete on actividades
for each row execute function trg_actividades_recalcular();

create or replace function trg_asistencias_calcular_puntos()
returns trigger as $$
declare
v_puntos_actividad numeric;
begin
select puntos_asignados into v_puntos_actividad
from actividades where id = new.actividad_id;

new.puntos_obtenidos := case new.estado
    when 'A' then coalesce(v_puntos_actividad, 0)
    when 'Ex' then coalesce(v_puntos_actividad, 0) * 0.5
    else 0
end;
  new.updated_at := now();
return new;
end;
$$ language plpgsql;

drop trigger if exists on_asistencias_upsert on asistencias;
create trigger on_asistencias_upsert
    before insert or update of estado, actividad_id on asistencias
    for each row execute function trg_asistencias_calcular_puntos();

-- =========================================================
-- Row Level Security (uso de un solo admin autenticado)
-- =========================================================
alter table comisiones enable row level security;
alter table miembros enable row level security;
alter table actividades enable row level security;
alter table asistencias enable row level security;
alter table comision_manual enable row level security;

create policy "Admin autenticado - comisiones" on comisiones
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Admin autenticado - miembros" on miembros
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Admin autenticado - actividades" on actividades
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Admin autenticado - asistencias" on asistencias
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "Admin autenticado - comision_manual" on comision_manual
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');