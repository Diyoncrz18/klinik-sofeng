# Klinik Sofeng

Aplikasi booking pasien klinik gigi berbasis Next.js (frontend), Express.js (backend), dan Supabase (database).

## Fitur Utama

- Form booking pasien dengan validasi input.
- Penyimpanan booking pasien ke Supabase.
- Riwayat booking pasien terbaru dari Supabase.

## Tech Stack

- Frontend: Next.js App Router, React, TypeScript
- Backend: Express.js
- Database: Supabase (PostgreSQL)

## Prasyarat

- Node.js 20+
- npm 10+
- Project Supabase aktif

## Instalasi

```bash
npm install
```

## Konfigurasi Environment

Buat file `.env` di root project dengan nilai berikut:

```env
# Frontend
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000

# Backend
BACKEND_PORT=4000
FRONTEND_ORIGIN=http://localhost:3000

# Supabase (gunakan salah satu pasangan variabel di bawah)
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SECRET_KEY=your-service-role-key

# Alternatif nama variabel Supabase yang juga didukung
# NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Opsional (default sudah tersedia)
SUPABASE_BOOKINGS_TABLE=patient_bookings
```

## Setup Database Supabase

### Tabel booking pasien

Jalankan SQL ini di Supabase SQL Editor, atau gunakan file [backend/sql/patient_bookings.sql](backend/sql/patient_bookings.sql).

```sql
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
```

## Menjalankan Project

Jalankan backend dan frontend di terminal terpisah.

Terminal 1 (backend):

```bash
npm run backend:dev
```

Terminal 2 (frontend):

```bash
npm run dev
```

Buka aplikasi di http://localhost:3000.

## NPM Scripts

- `npm run dev`: menjalankan frontend Next.js (development).
- `npm run backend:dev`: menjalankan backend Express dengan nodemon.
- `npm run backend:start`: menjalankan backend Express mode production.
- `npm run build`: build frontend Next.js.
- `npm run start`: jalankan hasil build frontend.
- `npm run lint`: jalankan ESLint.

## Endpoint Backend

Base URL backend default: http://localhost:4000

- `GET /health` - health check service backend.
- `GET /api` - status API backend.
- `GET /api/supabase/status` - cek koneksi Supabase dan kesiapan tabel booking.
- `GET /api/patient-bookings?limit=20` - list booking terbaru (limit efektif 1-100).
- `POST /api/patient-bookings` - simpan booking baru.

Contoh payload `POST /api/patient-bookings`:

```json
{
  "patientName": "Budi Santoso",
  "patientPhone": "081234567890",
  "serviceType": "Scaling dan Pembersihan Karang Gigi",
  "visitDate": "2026-04-09",
  "visitTime": "13:30",
  "preferredDentist": "drg. Aulia Pranata",
  "complaint": "Gusi sering berdarah saat sikat gigi"
}
```

## Troubleshooting Singkat

- Jika frontend gagal tersambung backend, pastikan backend jalan di port yang sama dengan `NEXT_PUBLIC_API_BASE_URL`.
- Jika muncul pesan tabel Supabase belum tersedia, pastikan SQL tabel sudah dijalankan.

## Kontak

- Email: chintamisamsini@gmail.com
