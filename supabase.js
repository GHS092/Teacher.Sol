/**
 * Cliente de Supabase para la aplicación GHS Finanzas
 * Este archivo configura y exporta el cliente de Supabase para su uso en toda la aplicación
 */

// Importamos la clase createClient desde supabase-js para inicializar la conexión
const { createClient } = supabase;

// Constantes para el URL y la clave anónima de Supabase
// En producción, estas variables se configuran en el dashboard de Vercel
// Las claves públicas (anónimas) son seguras para incluir en el código del cliente
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'your-anon-key';

// Inicializamos el cliente de Supabase
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

// Exportamos el cliente para su uso en otros archivos 