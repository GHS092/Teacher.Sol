-- Esquema de la base de datos para la aplicación GHS Finanzas en Supabase
-- Este script debe ejecutarse en el editor SQL de Supabase

-- Tabla para perfiles de usuario (extiende la tabla auth.users que maneja Supabase automáticamente)
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

-- Crear índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE INDEX IF NOT EXISTS profiles_team_id_idx ON public.profiles(team_id);

-- Tabla para equipos de trabajo
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS teams_code_idx ON public.teams(code);
CREATE INDEX IF NOT EXISTS teams_creator_id_idx ON public.teams(creator_id);

-- Tabla para transacciones financieras
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

-- Crear índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_date_idx ON public.transactions(date);
CREATE INDEX IF NOT EXISTS transactions_type_idx ON public.transactions(type);
CREATE INDEX IF NOT EXISTS transactions_category_idx ON public.transactions(category);

-- Tabla para categorías de transacciones
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (name, user_id)
);

-- Crear índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS categories_user_id_idx ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS categories_type_idx ON public.categories(type);

-- Tabla para registro de ahorros
CREATE TABLE IF NOT EXISTS public.savings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS savings_user_id_idx ON public.savings(user_id);
CREATE INDEX IF NOT EXISTS savings_date_idx ON public.savings(date);

-- Política de acceso para la tabla de perfiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver sus propios perfiles" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden actualizar sus propios perfiles" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Política de acceso para la tabla de equipos
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cualquiera puede ver los equipos" ON public.teams
  FOR SELECT USING (true);

CREATE POLICY "Sólo creadores pueden actualizar sus equipos" ON public.teams
  FOR UPDATE USING (auth.uid() = creator_id);

-- Política de acceso para la tabla de transacciones
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver sus propias transacciones" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar sus propias transacciones" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propias transacciones" ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propias transacciones" ON public.transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Política de acceso para la tabla de categorías
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver sus propias categorías" ON public.categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar sus propias categorías" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propias categorías" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propias categorías" ON public.categories
  FOR DELETE USING (auth.uid() = user_id);

-- Política de acceso para la tabla de ahorros
ALTER TABLE public.savings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver sus propios ahorros" ON public.savings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar sus propios ahorros" ON public.savings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propios ahorros" ON public.savings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propios ahorros" ON public.savings
  FOR DELETE USING (auth.uid() = user_id); 