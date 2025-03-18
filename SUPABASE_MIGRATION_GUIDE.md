# Guía de Migración a Supabase para GHS Finanzas

Esta guía proporciona los pasos necesarios para migrar la aplicación GHS Finanzas desde IndexedDB local a Supabase, permitiendo así que los usuarios puedan guardar y acceder a su información desde cualquier dispositivo.

## Requisitos Previos

1. Tener una cuenta en Supabase (puedes registrarte gratis en [supabase.com](https://supabase.com/))
2. Tener acceso al proyecto desplegado en Vercel

## Pasos para la Migración

### 1. Configurar proyecto en Supabase

1. Inicia sesión en Supabase y crea un nuevo proyecto.
2. Anota el URL de tu proyecto y la clave anon/public (se encuentra en Configuración > API).
3. Ejecuta el script SQL `supabase_schema.sql` (incluido en este proyecto) en el editor SQL de Supabase para crear todas las tablas necesarias.

### 2. Configurar variables de entorno en Vercel

1. Ve a la configuración de tu proyecto en Vercel.
2. Añade las siguientes variables de entorno:
   - `SUPABASE_URL`: La URL de tu proyecto Supabase (ej. `https://tu-proyecto.supabase.co`)
   - `SUPABASE_KEY`: La clave anónima de tu proyecto Supabase.

### 3. Actualizar la aplicación

1. Asegúrate de que todos los archivos modificados estén en tu repositorio Git:
   - `server.js` (modificado)
   - `supabaseClient.js` (nuevo)
   - `package.json` (modificado para incluir la dependencia de Supabase)

2. Despliega la aplicación en Vercel usando tu método habitual de despliegue.

### 4. Actualizar enlace a Supabase en código HTML

Para que la aplicación use Supabase en lugar de IndexedDB, añade el script de Supabase al encabezado de tu archivo `index.html`:

```html
<head>
    <!-- Otros elementos del encabezado... -->
    
    <!-- Supabase Client Library -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.4"></script>
    <!-- Cliente personalizado de Supabase -->
    <script src="supabaseClient.js"></script>
</head>
```

Y modifica las siguientes funciones en el archivo `index.html`:

1. Reemplazar `registerUser` por `supabaseClient.registerUser`
2. Reemplazar `loginUser` por `supabaseClient.loginUser`
3. Reemplazar `logout` por `supabaseClient.logoutUser`
4. Reemplazar las funciones de manejo de transacciones, categorías y ahorros con sus equivalentes de `supabaseClient`.

### 5. Migración de Datos (Opcional)

Si tienes datos existentes que deseas migrar desde IndexedDB a Supabase, puedes implementar un script de migración que:

1. Extraiga todos los datos de IndexedDB.
2. Los convierta al formato requerido por Supabase.
3. Los cargue en las tablas correspondientes de Supabase.

Este paso es opcional y puede requerir desarrollo adicional según tus necesidades específicas.

## Solución de Problemas

### Error de Conexión con Supabase

Si la aplicación no puede conectarse a Supabase, verifica:

1. Las variables de entorno están correctamente configuradas en Vercel.
2. Las políticas de seguridad de Supabase permiten conexiones desde tu dominio.
3. Las tablas y esquemas se han creado correctamente.

### Problemas de Autenticación

Si los usuarios no pueden iniciar sesión:

1. Verifica que la autenticación por email/password esté habilitada en Supabase.
2. Asegúrate de que las políticas de seguridad (RLS) estén configuradas correctamente.

### Problemas de Permisos

Si los usuarios pueden iniciar sesión pero no pueden acceder a sus datos:

1. Revisa las políticas de Row Level Security en Supabase.
2. Verifica que los IDs de usuario se estén pasando correctamente entre la autenticación y las operaciones de datos.

## Recursos Adicionales

- [Documentación de Supabase](https://supabase.io/docs)
- [Supabase CLI](https://supabase.io/docs/reference/cli)
- [Políticas de Seguridad en Supabase](https://supabase.io/docs/guides/auth#row-level-security) 