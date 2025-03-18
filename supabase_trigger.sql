-- Este script debe ejecutarse en el editor SQL de Supabase para configurar
-- un trigger que cree perfiles automáticamente y arreglar las políticas de seguridad

-- 1. Trigger para crear perfiles automáticamente cuando se registra un nuevo usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, is_admin)
  VALUES (new.id, new.raw_user_meta_data->>'username', new.email, false);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear o actualizar el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Asegurarse de que las tablas están creadas correctamente
-- Esto recrea la tabla profiles si ya existe
DROP TABLE IF EXISTS public.profiles;
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

-- 3. Configurar políticas de seguridad para la tabla profiles
-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios perfiles" ON public.profiles;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios perfiles" ON public.profiles;
DROP POLICY IF EXISTS "Los administradores pueden ver todos los perfiles" ON public.profiles;

-- Habilitar RLS en la tabla perfiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Crear nuevas políticas más permisivas para desarrollo
-- IMPORTANTE: En producción, estas políticas deberían ser más restrictivas
CREATE POLICY "Permitir acceso público a perfiles durante desarrollo" ON public.profiles
  FOR ALL USING (true);

-- 4. Crear o recrear la tabla de equipos
DROP TABLE IF EXISTS public.teams;
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configurar políticas para la tabla de equipos
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Política de acceso a equipos" ON public.teams;
CREATE POLICY "Permitir acceso público a equipos durante desarrollo" ON public.teams
  FOR ALL USING (true);

-- 5. Crear o recrear la tabla de transacciones
DROP TABLE IF EXISTS public.transactions;
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

-- Configurar políticas para la tabla de transacciones
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Política de acceso a transacciones" ON public.transactions;
CREATE POLICY "Permitir acceso público a transacciones durante desarrollo" ON public.transactions
  FOR ALL USING (true);

-- 6. Crear o recrear la tabla de categorías
DROP TABLE IF EXISTS public.categories;
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (name, user_id)
);

-- Configurar políticas para la tabla de categorías
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Política de acceso a categorías" ON public.categories;
CREATE POLICY "Permitir acceso público a categorías durante desarrollo" ON public.categories
  FOR ALL USING (true);

-- 7. Crear o recrear la tabla de ahorros
DROP TABLE IF EXISTS public.savings;
CREATE TABLE IF NOT EXISTS public.savings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configurar políticas para la tabla de ahorros
ALTER TABLE public.savings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Política de acceso a ahorros" ON public.savings;
CREATE POLICY "Permitir acceso público a ahorros durante desarrollo" ON public.savings
  FOR ALL USING (true);

-- 8. Insertar categorías predeterminadas para facilitar pruebas
INSERT INTO public.categories (name, type, user_id)
VALUES 
('Salario', 'entrada', NULL),
('Venta', 'entrada', NULL),
('Ingresos varios', 'entrada', NULL),
('Comida', 'saida', NULL),
('Transporte', 'saida', NULL),
('Entretenimiento', 'saida', NULL),
('Servicios', 'saida', NULL),
('Salud', 'saida', NULL),
('Educación', 'saida', NULL)
ON CONFLICT (name, user_id) DO NOTHING; 