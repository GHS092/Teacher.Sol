/**
 * Script de depuración de Supabase para la aplicación GHS Finanzas
 * 
 * Este script verifica la configuración de Supabase y ayuda a identificar y solucionar
 * problemas comunes de conexión, autenticación y manejo de datos.
 * 
 * Para usarlo, añade este script a tu página HTML y llama a supabaseDebug.runTests()
 * desde la consola del navegador.
 */

const supabaseDebug = {
  // Variable global para almacenar el cliente de Supabase
  supabase: null,
  
  // Función para inicializar el cliente de Supabase directamente (sin usar server.js)
  init: async function() {
    try {
      console.log("🔍 Iniciando pruebas de depuración de Supabase...");
      
      // Obtener credenciales de variables de entorno almacenadas en sessionStorage o localStorage
      const supabaseUrl = "https://heeouytcsqhsdxexnamx.supabase.co";
      const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlZW91eXRjc3Foc2R4ZXhuYW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyNTYyMDIsImV4cCI6MjA1NzgzMjIwMn0.G09UaAUlso-1y50cJS6lcvOemjXt83b-vRBZI6VY6UI";
      
      if (!supabaseUrl || !supabaseKey) {
        console.error("❌ Error: No se encontraron las credenciales de Supabase.");
        return false;
      }
      
      console.log("✅ Credenciales de Supabase encontradas.");
      console.log(`🔗 URL: ${supabaseUrl}`);
      console.log(`🔑 API Key: ${supabaseKey.substring(0, 10)}...`);
      
      try {
        // Verificar si la biblioteca de Supabase está disponible
        if (typeof window.supabase === 'undefined') {
          console.error("❌ Error: La biblioteca de Supabase no está cargada. Asegúrate de incluir el script de Supabase.");
          return false;
        }
        
        // Inicializar el cliente de Supabase
        this.supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
        console.log("✅ Cliente de Supabase inicializado correctamente.");
        return true;
      } catch (error) {
        console.error("❌ Error al inicializar el cliente de Supabase:", error);
        return false;
      }
    } catch (error) {
      console.error("❌ Error en la inicialización:", error);
      return false;
    }
  },
  
  // Prueba de conexión a Supabase
  testConnection: async function() {
    try {
      console.log("🔍 Probando conexión a Supabase...");
      
      if (!this.supabase) {
        console.error("❌ El cliente de Supabase no está inicializado. Llama a init() primero.");
        return false;
      }
      
      const { data, error } = await this.supabase.from('profiles').select('*').limit(1);
      
      if (error) {
        console.error("❌ Error de conexión:", error);
        return false;
      }
      
      console.log("✅ Conexión a Supabase exitosa.");
      console.log("Datos de muestra:", data);
      return true;
    } catch (error) {
      console.error("❌ Error de conexión:", error);
      return false;
    }
  },
  
  // Prueba de autenticación
  testAuth: async function(email, password) {
    try {
      console.log(`🔍 Probando autenticación con ${email}...`);
      
      if (!this.supabase) {
        console.error("❌ El cliente de Supabase no está inicializado. Llama a init() primero.");
        return false;
      }
      
      // Intentar autenticar usuario
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("❌ Error de autenticación:", error);
        return false;
      }
      
      console.log("✅ Autenticación exitosa:", data.user.id);
      
      // Verificar si el usuario tiene un perfil
      return await this.checkUserProfile(data.user.id);
    } catch (error) {
      console.error("❌ Error en la prueba de autenticación:", error);
      return false;
    }
  },
  
  // Verificar el perfil de un usuario
  checkUserProfile: async function(userId) {
    try {
      console.log(`🔍 Verificando perfil para usuario ${userId}...`);
      
      if (!this.supabase) {
        console.error("❌ El cliente de Supabase no está inicializado. Llama a init() primero.");
        return false;
      }
      
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId);
      
      if (error) {
        console.error("❌ Error al verificar perfil:", error);
        return false;
      }
      
      if (data && data.length > 0) {
        console.log("✅ Perfil encontrado:", data[0]);
        return true;
      } else {
        console.warn("⚠️ No se encontró un perfil para este usuario.");
        return false;
      }
    } catch (error) {
      console.error("❌ Error al verificar perfil:", error);
      return false;
    }
  },
  
  // Verificar políticas de seguridad
  checkRLS: async function() {
    try {
      console.log("🔍 Verificando políticas de Row Level Security (RLS)...");
      
      if (!this.supabase) {
        console.error("❌ El cliente de Supabase no está inicializado. Llama a init() primero.");
        return false;
      }
      
      // Comprobar políticas en las tablas principales
      const tables = ['profiles', 'transactions', 'categories', 'savings', 'teams'];
      let allGood = true;
      
      for (const table of tables) {
        console.log(`Verificando políticas en tabla '${table}'...`);
        
        // Intentar hacer una consulta simple
        const { data, error } = await this.supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          if (error.message.includes('permission denied')) {
            console.warn(`⚠️ La tabla '${table}' tiene RLS activado y no se puede acceder sin permisos específicos.`);
            allGood = false;
          } else {
            console.error(`❌ Error al acceder a la tabla '${table}':`, error);
            allGood = false;
          }
        } else {
          console.log(`✅ Se puede acceder a la tabla '${table}' correctamente.`);
        }
      }
      
      if (allGood) {
        console.log("✅ Todas las tablas son accesibles.");
      } else {
        console.warn("⚠️ Algunas tablas tienen restricciones de acceso. Esto puede ser intencional debido a RLS.");
      }
      
      return allGood;
    } catch (error) {
      console.error("❌ Error al verificar políticas RLS:", error);
      return false;
    }
  },
  
  // Verificar estructura de tablas
  checkTableStructure: async function() {
    try {
      console.log("🔍 Verificando estructura de tablas...");
      
      if (!this.supabase) {
        console.error("❌ El cliente de Supabase no está inicializado. Llama a init() primero.");
        return false;
      }
      
      // Lista de tablas y campos esperados
      const expectedTables = {
        profiles: ['id', 'username', 'email', 'is_admin', 'team_id', 'team_name', 'team_code'],
        transactions: ['id', 'type', 'cost_type', 'amount', 'category', 'date', 'description', 'user_id'],
        categories: ['id', 'name', 'type', 'user_id'],
        savings: ['id', 'amount', 'description', 'date', 'user_id'],
        teams: ['id', 'name', 'code', 'password', 'creator_id']
      };
      
      let allTablesCorrect = true;
      
      for (const [table, fields] of Object.entries(expectedTables)) {
        // Intentar obtener un registro para verificar los campos
        const { data, error } = await this.supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.error(`❌ Error al acceder a la tabla '${table}':`, error);
          allTablesCorrect = false;
          continue;
        }
        
        // Si no hay datos, intentar verificar la estructura con una consulta vacía
        if (!data || data.length === 0) {
          console.log(`⚠️ No hay datos en la tabla '${table}' para verificar estructura.`);
          continue;
        }
        
        // Verificar que todos los campos esperados existen
        const missingFields = fields.filter(field => !(field in data[0]));
        
        if (missingFields.length > 0) {
          console.error(`❌ La tabla '${table}' no tiene los siguientes campos esperados:`, missingFields);
          allTablesCorrect = false;
        } else {
          console.log(`✅ La tabla '${table}' tiene todos los campos esperados.`);
        }
      }
      
      if (allTablesCorrect) {
        console.log("✅ Todas las tablas tienen la estructura esperada.");
      } else {
        console.warn("⚠️ Algunas tablas no tienen la estructura esperada.");
      }
      
      return allTablesCorrect;
    } catch (error) {
      console.error("❌ Error al verificar la estructura de tablas:", error);
      return false;
    }
  },
  
  // Prueba de registro de usuario
  testRegistration: async function(email, password, username) {
    try {
      console.log(`🔍 Probando registro con ${email}...`);
      
      if (!this.supabase) {
        console.error("❌ El cliente de Supabase no está inicializado. Llama a init() primero.");
        return false;
      }
      
      // Registrar usuario
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username || email.split('@')[0]
          }
        }
      });
      
      if (error) {
        console.error("❌ Error de registro:", error);
        return false;
      }
      
      console.log("✅ Registro exitoso:", data);
      
      // Verificar si el perfil se creó automáticamente (puede haber un retraso)
      console.log("⏳ Esperando 3 segundos para verificar la creación automática del perfil...");
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      return await this.checkUserProfile(data.user.id);
    } catch (error) {
      console.error("❌ Error en la prueba de registro:", error);
      return false;
    }
  },
  
  // Ejecutar todas las pruebas
  runTests: async function(testEmail, testPassword) {
    console.log("🚀 Iniciando pruebas de depuración de Supabase...");
    console.log("=============================================");
    
    // Si no se proporcionan credenciales, usar datos de prueba
    const email = testEmail || 'test@example.com';
    const password = testPassword || 'password123';
    
    // Inicializar cliente
    if (!await this.init()) {
      console.error("❌ No se pudo inicializar el cliente de Supabase. Abortando pruebas.");
      return;
    }
    
    console.log("=============================================");
    
    // Probar conexión
    if (!await this.testConnection()) {
      console.error("❌ No se pudo conectar a Supabase. Abortando pruebas.");
      return;
    }
    
    console.log("=============================================");
    
    // Verificar políticas RLS
    await this.checkRLS();
    
    console.log("=============================================");
    
    // Verificar estructura de tablas
    await this.checkTableStructure();
    
    console.log("=============================================");
    
    // Prueba de registro (opcional, comentada por defecto)
    console.log("⚠️ Las pruebas de registro y autenticación están desactivadas por defecto.");
    console.log("Para probar registro: supabaseDebug.testRegistration('email@example.com', 'password', 'username')");
    console.log("Para probar autenticación: supabaseDebug.testAuth('email@example.com', 'password')");
    
    console.log("=============================================");
    console.log("✅ Pruebas de depuración completadas.");
  }
};

// Exponer el objeto para uso en la consola del navegador
window.supabaseDebug = supabaseDebug; 