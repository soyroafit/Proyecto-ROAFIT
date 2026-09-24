# ROAFIT — Fase 1: base técnica

Esto es el esqueleto real del proyecto: repositorio + conexión a Supabase +
despliegue automático a GitHub Pages. No tiene todavía ninguna pantalla del
diseño — su único objetivo es confirmar que el cableado funciona antes de
construir nada encima.

## 1. Crear el proyecto en Supabase

1. Crea una cuenta en https://supabase.com y un proyecto nuevo (elige la
   región más cercana, ej. Europa).
2. Ve a **SQL Editor** → pega el contenido completo de `supabase/schema.sql`
   → **Run**. Esto crea todas las tablas (perfiles, clientes, programas,
   series registradas, nutrición, mensajes) con la seguridad por fila ya
   activada.
3. Ve a **Project Settings → API** y copia:
   - `Project URL`
   - `anon public` key

## 2. Configurar el proyecto en local

```bash
npm install
cp .env.example .env.local
# pega ahí la URL y la clave anon del paso anterior
npm run dev
```

Abre `http://localhost:5173`. Si ves **"Conectado a Supabase
correctamente"**, la fase 1 está cerrada. Si ves un error de tabla, revisa
que el paso 1.2 se ejecutó sin errores en Supabase.

## 3. Subir a GitHub

```bash
git init
git add .
git commit -m "Fase 1: base técnica de ROAFIT"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/roafit.git
git push -u origin main
```

## 4. Activar GitHub Pages

1. En el repositorio de GitHub: **Settings → Pages → Source → GitHub
   Actions**.
2. **Settings → Secrets and variables → Actions → New repository secret**:
   añade `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con los mismos
   valores de tu `.env.local`. (El workflow en
   `.github/workflows/deploy.yml` ya está listo para usarlos — cada `push`
   a `main` construye y publica solo.)
3. Para usar tu dominio propio: **Settings → Pages → Custom domain** →
   escribe `roafit.com`, y en tu proveedor de DNS crea los registros que
   GitHub te indique (normalmente un registro `A` hacia las IPs de GitHub
   Pages, o `CNAME` si usas un subdominio).

## Qué sigue

Con esto verificado, el Paso 2 (del roadmap que ya vimos) es construir
sobre esta base: login real del entrenador y la pantalla "Mis clientes"
leyendo de la tabla `client_details`.
