# Implementación de Supabase en GHS Finanzas

Este documento explica en detalle cómo se ha integrado Supabase para dar funcionalidad cloud a la aplicación GHS Finanzas, permitiendo a los usuarios acceder a sus datos desde cualquier dispositivo y mantener sus finanzas sincronizadas.

## ¿Qué es Supabase?

Supabase es una alternativa de código abierto a Firebase que proporciona:
- Base de datos PostgreSQL
- Autenticación de usuarios
- APIs generadas automáticamente
- Almacenamiento de archivos
- Funciones en tiempo real
- Panel de administración

## Estructura de la Implementación

La integración de Supabase en GHS Finanzas se ha realizado mediante:

1. **Backend**: API REST en `server.js` que actúa como intermediario entre el frontend y Supabase.
2. **Cliente**: Archivo `supabaseClient.js` que proporciona una interfaz sencilla para interactuar con Supabase.
3. **Migración**: Script `migration-script.js` para migrar datos existentes desde IndexedDB a Supabase.
4. **Esquema de BD**: Archivo `supabase_schema.sql` con la definición de tablas y políticas de seguridad.

## Tablas en Supabase

### 1. Perfiles (profiles)

Extiende la tabla de usuarios de Supabase con información adicional:

```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  team_id UUID,
  team_name TEXT,
  team_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Equipos (teams)

Gestiona los equipos de trabajo:

```sql
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. Transacciones (transactions)

Almacena las transacciones financieras:

```sql
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
  cost_type TEXT,
  amount DECIMAL(12, 2) NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. Categorías (categories)

Gestiona las categorías de transacciones:

```sql
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (name, user_id)
);
```

### 5. Ahorros (savings)

Gestiona el registro de ahorros:

```sql
CREATE TABLE IF NOT EXISTS public.savings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Seguridad en Supabase (RLS)

Row Level Security (RLS) es una característica de PostgreSQL que permite controlar qué filas pueden ser leídas o modificadas por qué usuarios. El esquema incluye políticas RLS para todas las tablas:

```sql
-- Ejemplo para la tabla de transacciones
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver sus propias transacciones" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar sus propias transacciones" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## API de Backend

El archivo `server.js` incluye endpoints que actúan como intermediarios entre el frontend y Supabase:

1. **Autenticación**:
   - `/api/auth/signup`: Registro de usuarios
   - `/api/auth/login`: Inicio de sesión
   - `/api/auth/logout`: Cierre de sesión

2. **Equipos**:
   - `/api/teams/create`: Creación de equipos
   - `/api/teams/join/:code`: Unirse a un equipo existente

3. **Transacciones**:
   - `/api/transactions`: CRUD completo para transacciones

4. **Categorías**:
   - `/api/categories`: CRUD para categorías

5. **Ahorros**:
   - `/api/savings`: CRUD para ahorros

## Cliente de Supabase

El archivo `supabaseClient.js` proporciona una interfaz fácil de usar para interactuar con Supabase desde el frontend:

```javascript
// Inicializar cliente
async function initSupabase() { ... }

// Autenticación
async function registerUser(userData) { ... }
async function loginUser(email, password) { ... }
async function logoutUser() { ... }

// Transacciones
async function getTransactions() { ... }
async function saveTransaction(transaction) { ... }
// ...etc
```

## Migración de Datos

El script `migration-script.js` permite migrar datos existentes desde IndexedDB a Supabase:

1. Extrae datos de IndexedDB
2. Los formatea para Supabase
3. Los carga en las tablas correspondientes

## Variables de Entorno

Las siguientes variables de entorno son necesarias:

```
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-clave-anonima
```

## Configuración en Vercel

1. **Variables de Entorno**: Configurar `SUPABASE_URL` y `SUPABASE_KEY` en el panel de Vercel.
2. **Despliegue**: No se requieren configuraciones especiales, solo asegurarse de incluir todos los archivos modificados.

## Limitaciones y Consideraciones

1. **Costos**: La capa gratuita de Supabase permite hasta 10,000 usuarios y 500MB de almacenamiento, suficiente para comenzar.
2. **Migración de Datos**: La migración desde IndexedDB es opcional y requiere que los usuarios se registren en Supabase.
3. **Seguridad**: Las políticas RLS son fundamentales; revisar regularmente para asegurar la protección de datos.

## Siguientes Pasos Recomendados

1. **Implementar sincronización offline**: Usando Service Workers para permitir uso sin conexión.
2. **Añadir autenticación social**: Integrar inicio de sesión con Google, Facebook, etc.
3. **Implementar suscripciones en tiempo real**: Para ver actualizaciones instantáneas en los datos.

## Recursos Útiles

- [Documentación de Supabase](https://supabase.com/docs)
- [Ejemplos de RLS en Supabase](https://supabase.com/docs/guides/auth/row-level-security)
- [Panel de Control de Supabase](https://app.supabase.io) 