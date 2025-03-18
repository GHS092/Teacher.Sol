# Instrucciones para Desplegar GHS Finanzas con Supabase

Este documento contiene las instrucciones paso a paso para desplegar correctamente la aplicación GHS Finanzas con la integración de Supabase.

## 1. Preparación del Repositorio

1. El repositorio ya está configurado con Git y tiene todos los archivos necesarios.
2. Asegúrate de que los siguientes archivos están presentes:
   - `server.js` - Servidor Node.js con los endpoints de autenticación y datos
   - `supabaseClient.js` - Cliente para interactuar con Supabase
   - `.env` - Variables de entorno (ya configuradas)
   - `supabase_trigger.sql` - Script para configurar Supabase (ya ejecutado)
   - `vercel.json` - Configuración para despliegue en Vercel

## 2. Despliegue en Vercel

1. Inicia sesión en [Vercel](https://vercel.com/)
2. Haz clic en "Import Project" o "New Project"
3. Conecta tu cuenta de GitHub si aún no lo has hecho
4. Sube tu repositorio a GitHub y selecciónalo en Vercel
5. Configura las variables de entorno:
   - `SUPABASE_URL`: https://heeouytcsqhsdxexnamx.supabase.co
   - `SUPABASE_KEY`: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZW91eXRjc3Foc2R4ZXhuYW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyNTYyMDIsImV4cCI6MjA1NzgzMjIwMn0.G09UaAUlso-1y50cJS6lcvOemjXt83b-vRBZI6VY6UI
   - `NODE_ENV`: production
   - `ADMIN_ACCESS_CODE`: (tu código de acceso para administradores)
6. Haz clic en "Deploy"

## 3. Despliegue en Render

1. Inicia sesión en [Render](https://render.com/)
2. Haz clic en "New +" y selecciona "Web Service"
3. Conecta tu repositorio de GitHub
4. Configura el servicio:
   - **Name**: ghs-finanzas (o el nombre que prefieras)
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. En la sección "Environment Variables", añade:
   - `SUPABASE_URL`: https://heeouytcsqhsdxexnamx.supabase.co
   - `SUPABASE_KEY`: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZW91eXRjc3Foc2R4ZXhuYW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyNTYyMDIsImV4cCI6MjA1NzgzMjIwMn0.G09UaAUlso-1y50cJS6lcvOemjXt83b-vRBZI6VY6UI
   - `NODE_ENV`: production
   - `ADMIN_ACCESS_CODE`: (tu código de acceso para administradores)
6. Haz clic en "Create Web Service"

## 4. Configuración Adicional en Supabase

1. Ve a la [consola de Supabase](https://app.supabase.io/)
2. Selecciona tu proyecto (URL: https://heeouytcsqhsdxexnamx.supabase.co)
3. Ve a "Authentication" > "URL Configuration"
4. Añade la URL de tu aplicación desplegada a la lista de URLs permitidas
5. Si quieres una configuración más segura para producción, puedes ajustar las políticas RLS desde la sección "SQL Editor" ejecutando consultas personalizadas.

## 5. Verificación del Despliegue

1. Accede a la URL de tu aplicación desplegada
2. Intenta registrar un nuevo usuario
3. Verifica en Supabase que el usuario se ha creado correctamente en la tabla `profiles`
4. Prueba la funcionalidad de login y asegúrate de que puedes acceder a tu perfil
5. Crea algunas transacciones y categorías para verificar que los datos se guardan correctamente

## 6. Solución de Problemas

Si encuentras algún problema durante el despliegue o la ejecución de la aplicación:

1. Verifica los logs de la aplicación en Vercel o Render
2. Comprueba que las variables de entorno están correctamente configuradas
3. Asegúrate de que el script `supabase_trigger.sql` se ha ejecutado correctamente en Supabase
4. Utiliza la herramienta de diagnóstico `supabase_test.html` para verificar la conexión a Supabase
5. Si persisten los problemas, revisa los errores específicos en la consola del navegador

## 7. Notas de Seguridad

1. Las políticas actuales en Supabase están configuradas de forma permisiva para facilitar el desarrollo.
2. Para un entorno de producción real, es recomendable ajustar estas políticas para ser más restrictivas.
3. Puedes modificar las políticas RLS ejecutando consultas SQL personalizadas en el Editor SQL de Supabase.

---

Con estas instrucciones, deberías poder desplegar correctamente tu aplicación GHS Finanzas con la integración de Supabase. 