create table if not exists public.patient_bookings (
  id bigserial primary key,
  patient_name text not null,
  patient_phone text not null,
  service_type text not null,
  visit_date date not null,
  visit_time time not null,
  preferred_dentist text,
  complaint text,
  created_at timestamptz not null default now()
);

create index if not exists idx_patient_bookings_created_at
  on public.patient_bookings (created_at desc);
