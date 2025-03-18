# Instrucciones para Solucionar Problemas de Integración con Supabase

Este documento contiene instrucciones paso a paso para solucionar el problema de usuarios no reflejados en las tablas de Supabase y completar correctamente la integración de la aplicación GHS Finanzas con Supabase.

## 1. Configuración Inicial de Supabase

### 1.1 Ejecutar Script de Configuración

1. Accede al panel de administración de Supabase en [https://app.supabase.io](https://app.supabase.io)
2. Selecciona tu proyecto (URL: https://heeouytcsqhsdxexnamx.supabase.co)
3. Ve a la sección "SQL Editor"
4. Copia y pega el contenido del archivo `supabase_trigger.sql` que hemos creado
5. Ejecuta el script haciendo clic en "Run" o "Ejecutar"

Este script hará lo siguiente:
- Creará todas las tablas necesarias
- Configurará políticas de seguridad más permisivas para desarrollo
- Creará un trigger que automáticamente creará perfiles cuando un usuario se registre
- Insertará categorías predeterminadas

## 2. Actualización de Archivos en el Proyecto

Hemos mejorado varios archivos para solucionar los problemas de integración:

1. **server.js**: Añadimos mejor manejo de errores y más registros de depuración.
2. **.env**: Actualizamos con las nuevas credenciales de Supabase.
3. **supabaseClient.js**: Mejoramos la función de inicio de sesión.
4. **supabase_debug.js**: Creamos un script para diagnosticar problemas.
5. **supabase_test.html**: Creamos una página HTML para probar directamente Supabase.

## 3. Procedimiento de Prueba

Para verificar que la integración funciona correctamente:

1. Despliega los cambios en tu aplicación en Vercel.
2. Abre el archivo `supabase_test.html` localmente en tu navegador.
3. Haz clic en "Probar Conexión" para verificar que puedes conectarte a Supabase.
4. Intenta registrar un usuario de prueba con la pestaña "Autenticación".
5. Verifica en el panel de Supabase que se ha creado tanto el usuario como su perfil.

## 4. Solución de Problemas Comunes

### 4.1 No se crean perfiles de usuario

Si los usuarios se registran pero no se crean sus perfiles:

1. Verifica la consola del navegador para errores
2. Comprueba que el trigger `on_auth_user_created` se ha creado correctamente en Supabase
3. Si es necesario, ejecuta nuevamente el script `supabase_trigger.sql`

### 4.2 Problemas de permisos

Si recibes errores de "permission denied":

1. Verifica que las políticas RLS están configuradas correctamente
2. Para desarrollo, hemos configurado políticas permisivas (todos pueden acceder a todos los datos)
3. En producción, querrás políticas más restrictivas

### 4.3 Errores de conexión

Si no puedes conectarte a Supabase:

1. Verifica que las credenciales en `.env` son correctas
2. Asegúrate de que el dominio de tu aplicación está en la lista de URLs permitidas en Supabase
3. Comprueba que el servicio de Supabase está activo

## 5. Integración en la Aplicación Principal

Una vez que hayas verificado que todo funciona correctamente con las herramientas de prueba:

1. Despliega la aplicación en Vercel con todos los archivos actualizados
2. Registra un nuevo usuario desde la aplicación principal
3. Verifica en el panel de Supabase que se ha creado tanto el usuario como su perfil
4. Prueba las funcionalidades de creación de transacciones y otras operaciones

## 6. Recomendaciones Finales

1. **Desarrollo vs Producción**: Las políticas actuales son permisivas para facilitar el desarrollo. Para producción, deberías implementar políticas más restrictivas.

2. **Monitoreo**: Revisa regularmente los logs de tu aplicación para detectar errores en la interacción con Supabase.

3. **Actualización de Esquema**: Si modificas el esquema de datos, asegúrate de actualizar también las políticas RLS correspondientes.

4. **Migración de Datos**: Usa el script de migración proporcionado para transferir datos existentes a Supabase.

---

Con estas instrucciones, deberías poder solucionar el problema de usuarios no reflejados en Supabase y completar correctamente la integración de tu aplicación con este servicio. 