-- ROAFIT — Esquema inicial de base de datos para Supabase
-- Cómo usarlo: Supabase → tu proyecto → SQL Editor → pega todo este archivo → Run.
-- Pensado para ejecutarse una sola vez sobre un proyecto nuevo.

-- ========== PERFILES (entrenador o cliente) ==========
create table profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    role text not null check (role in ('trainer', 'client')),
    full_name text not null,
    created_at timestamptz not null default now()
  );

-- ========== RELACIÓN ENTRENADOR–CLIENTE ==========
create table client_details (
    id uuid primary key references profiles(id) on delete cascade,
    trainer_id uuid not null references profiles(id) on delete cascade,
    goal text,
    status text not null default 'pending' check (status in ('active', 'paused', 'pending')),
    pathologies text,
    trainer_notes text,
    created_at timestamptz not null default now()
  );

-- ========== PROGRAMAS ==========
create table programs (
    id uuid primary key default gen_random_uuid(),
    trainer_id uuid not null references profiles(id) on delete cascade,
    client_id uuid references profiles(id) on delete set null,
    name text not null,
    goal_type text,
    weeks integer not null default 8,
    days_per_week integer not null default 4,
    created_at timestamptz not null default now()
  );

-- ========== DÍAS DE ENTRENAMIENTO ==========
create table workout_days (
    id uuid primary key default gen_random_uuid(),
    program_id uuid not null references programs(id) on delete cascade,
    day_number integer not null,
    label text not null,
    week_number integer not null default 1
  );

-- ========== EJERCICIOS PLANIFICADOS ==========
create table planned_exercises (
    id uuid primary key default gen_random_uuid(),
    workout_day_id uuid not null references workout_days(id) on delete cascade,
    name text not null,
    target_sets integer not null,
    target_reps integer not null,
    target_weight_kg numeric,
    target_rir integer,
    order_index integer not null default 0
  );

-- ========== SERIES REGISTRADAS ==========
create table logged_sets (
    id uuid primary key default gen_random_uuid(),
    planned_exercise_id uuid not null references planned_exercises(id) on delete cascade,
    client_id uuid not null references profiles(id) on delete cascade,
    set_number integer not null,
    actual_reps integer not null,
    actual_weight_kg numeric not null,
    logged_at timestamptz not null default now()
  );

-- ========== PLAN NUTRICIONAL ==========
create table nutrition_plans (
    id uuid primary key default gen_random_uuid(),
    trainer_id uuid not null references profiles(id) on delete cascade,
    client_id uuid references profiles(id) on delete set null,
    name text not null,
    target_kcal integer,
    target_protein_g integer,
    target_carbs_g integer,
    target_fat_g integer,
    created_at timestamptz not null default now()
  );

-- ========== MENSAJES ==========
create table messages (
    id uuid primary key default gen_random_uuid(),
    sender_id uuid not null references profiles(id) on delete cascade,
    recipient_id uuid not null references profiles(id) on delete cascade,
    body text not null,
    created_at timestamptz not null default now()
  );

-- ROW LEVEL SECURITY
alter table profiles enable row level security;
alter table client_details enable row level security;
alter table programs enable row level security;
alter table workout_days enable row level security;
alter table planned_exercises enable row level security;
alter table logged_sets enable row level security;
alter table nutrition_plans enable row level security;
alter table messages enable row level security;

create policy "ver propio perfil" on profiles
  for select using (id = auth.uid());
create policy "entrenador ve perfiles de sus clientes" on profiles
  for select using (
      exists (select 1 from client_details cd where cd.id = profiles.id and cd.trainer_id = auth.uid())
    );

create policy "cliente ve su propia ficha" on client_details
  for select using (id = auth.uid());
create policy "entrenador gestiona fichas de sus clientes" on client_details
  for all using (trainer_id = auth.uid());

create policy "entrenador gestiona sus programas" on programs
  for all using (trainer_id = auth.uid());
create policy "cliente ve su programa asignado" on programs
  for select using (client_id = auth.uid());

create policy "acceso a dias via programa" on workout_days
  for select using (
      exists (
        select 1 from programs p
        where p.id = workout_days.program_id
        and (p.trainer_id = auth.uid() or p.client_id = auth.uid())
      )
    );
create policy "entrenador edita dias" on workout_days
  for all using (
      exists (select 1 from programs p where p.id = workout_days.program_id and p.trainer_id = auth.uid())
    );

create policy "acceso a ejercicios via programa" on planned_exercises
  for select using (
      exists (
        select 1 from workout_days wd join programs p on p.id = wd.program_id
        where wd.id = planned_exercises.workout_day_id
        and (p.trainer_id = auth.uid() or p.client_id = auth.uid())
      )
    );
create policy "entrenador edita ejercicios" on planned_exercises
  for all using (
      exists (
        select 1 from workout_days wd join programs p on p.id = wd.program_id
        where wd.id = planned_exercises.workout_day_id and p.trainer_id = auth.uid()
      )
    );

create policy "cliente registra sus series" on logged_sets
  for insert with check (client_id = auth.uid());
create policy "cliente ve sus series" on logged_sets
  for select using (client_id = auth.uid());
create policy "entrenador ve series de sus clientes" on logged_sets
  for select using (
      exists (select 1 from client_details cd where cd.id = logged_sets.client_id and cd.trainer_id = auth.uid())
    );

create policy "entrenador gestiona planes nutricionales" on nutrition_plans
  for all using (trainer_id = auth.uid());
create policy "cliente ve su plan nutricional" on nutrition_plans
  for select using (client_id = auth.uid());

create policy "ver mensajes propios" on messages
  for select using (sender_id = auth.uid() or recipient_id = auth.uid());
create policy "enviar mensajes" on messages
  for insert with check (sender_id = auth.uid());
