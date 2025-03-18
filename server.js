const express = require('express');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Configuración de variables de entorno
// En Vercel, las variables de entorno se configuran en el dashboard
// y están disponibles automáticamente
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Inicializar cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON and urlencoded form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API endpoint for admin configuration
app.get('/api/config', (req, res) => {
  try {
    // Only expose necessary configuration values
    res.json({
      adminAccessCode: process.env.ADMIN_ACCESS_CODE || 'default-code',
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY
    });
  } catch (error) {
    console.error('Error en /api/config:', error);
    res.status(500).json({ 
      error: 'Error al obtener la configuración', 
      details: error.message 
    });
  }
});

// API endpoint for chat completions
app.post('/api/chat/completions', async (req, res) => {
  try {
    const { messages } = req.body;
    
    // OpenRouter API configuration
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }
    
    console.log('Using API key:', openRouterApiKey.substring(0, 10) + '...');
    
    // Determinar la URL de referencia
    const refererUrl = process.env.NODE_ENV === 'production' 
      ? 'https://grupo-hibrida-ucal.vercel.app' 
      : 'http://localhost:3000';
    
    // Make request to OpenRouter API using Gemini model
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'google/gemini-2.0-pro-exp-02-05:free', // Using Gemini Pro model
        messages: messages,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': refererUrl,
          'X-Title': 'GHS Finanzas'
        }
      }
    );
    
    // Extract and return the response content
    // Ensure we're handling the response format correctly
    let content = '';
    
    if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
      content = response.data.choices[0].message.content;
    } else if (response.data && response.data.content) {
      // Alternative response format
      content = response.data.content;
    } else {
      console.log('Unexpected API response format:', response.data);
      content = 'Lo siento, no pude procesar tu solicitud en este momento.';
    }
    
    res.json({ content });
    
  } catch (error) {
    console.error('Error calling OpenRouter API:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Error processing request', 
      details: error.response?.data || error.message 
    });
  }
});

// API endpoints para autenticación con Supabase
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, username, profileType, teamId = null, teamName = null, teamCode = null, isAdmin = false } = req.body;
    
    console.log('Iniciando registro de usuario:', email);
    
    // Validaciones previas
    if (!email || !email.includes('@') || !password || password.length < 6) {
      console.log('Datos de registro inválidos');
      return res.status(400).json({
        error: 'Datos de registro inválidos. Asegúrese de proporcionar un correo y contraseña válidos.'
      });
    }

    // Registrar usuario en Supabase
    console.log('Registrando usuario en Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      console.error('Error en el registro de auth:', authError);
      return res.status(400).json({ error: authError.message });
    }

    if (!authData || !authData.user) {
      console.error('Error: No se recibieron datos de usuario después del registro');
      return res.status(500).json({ error: 'Error al crear el usuario: datos de usuario no recibidos' });
    }

    const userId = authData.user.id;
    console.log('Usuario creado exitosamente en auth.users con ID:', userId);

    // Esperar un momento para asegurar que el usuario se ha creado completamente
    console.log('Esperando para asegurar consistencia de datos...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Si el registro fue exitoso, almacenar los datos adicionales del usuario
    console.log('Creando perfil para el usuario...');
    const profileData = {
      id: userId,
      username, 
      is_admin: isAdmin,
      team_id: teamId,
      team_name: teamName,
      team_code: teamCode,
      email
    };
    
    console.log('Datos de perfil a insertar:', profileData);
    
    // Insertar perfil con manejo de errores mejorado
    const { data: insertedProfile, error: profileError } = await supabase
      .from('profiles')
      .insert([profileData])
      .select();

    if (profileError) {
      console.error('Error al crear perfil:', profileError);
      console.error('Detalles del error:', profileError.details || 'No hay detalles disponibles');
      
      // Intentar determinar si es un problema con las políticas RLS
      if (profileError.message && profileError.message.includes('policy')) {
        console.error('Posible problema con políticas RLS. Verificar configuración de Row Level Security.');
      }
      
      // Intentar determinar si el perfil ya existe
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (!checkError && existingProfile) {
        console.log('Nota: El perfil ya existía en la base de datos');
        return res.status(200).json({ message: 'Usuario ya registrado anteriormente' });
      }
      
      return res.status(400).json({ 
        error: 'Error al crear perfil de usuario', 
        details: profileError.message 
      });
    }

    console.log('Perfil creado correctamente:', insertedProfile);
    res.status(200).json({ 
      message: 'Usuario registrado correctamente',
      user: {
        id: userId,
        email: email,
        username: username
      }
    });
  } catch (error) {
    console.error('Error no controlado en el proceso de registro:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Iniciando proceso de login para:', email);
    
    // Iniciar sesión con Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Error en autenticación:', error);
      return res.status(400).json({ error: error.message });
    }

    console.log('Autenticación exitosa para usuario con ID:', data.user.id);

    // Obtener datos del perfil del usuario
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('Error al obtener perfil:', profileError);
      
      // Verificar si es un problema de políticas o si el perfil no existe
      if (profileError.code === 'PGRST116') {
        console.log('Perfil no encontrado. Creando perfil para usuario existente...');
        
        // Crear perfil si no existe
        const newProfile = {
          id: data.user.id,
          username: email.split('@')[0], // Usar parte del email como nombre de usuario por defecto
          email: email,
          is_admin: false
        };
        
        const { data: newProfileData, error: newProfileError } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select();
          
        if (newProfileError) {
          console.error('Error al crear perfil:', newProfileError);
          return res.status(400).json({ error: 'Error al crear perfil de usuario' });
        }
        
        console.log('Perfil creado exitosamente:', newProfileData);
        profileData = newProfileData[0];
      } else {
        return res.status(400).json({ error: 'Error al obtener datos del perfil' });
      }
    }

    console.log('Perfil obtenido correctamente:', profileData ? 'Sí' : 'No');

    // Si no hay perfil, usar datos básicos
    const userData = profileData || {
      id: data.user.id,
      email: data.user.email,
      username: data.user.email.split('@')[0],
      is_admin: false
    };

    // Enviamos los datos necesarios para la sesión del usuario
    res.status(200).json({
      user: {
        id: data.user.id,
        email: data.user.email,
        username: userData.username || data.user.email.split('@')[0],
        isAdmin: userData.is_admin || false,
        teamId: userData.team_id || null,
        teamName: userData.team_name || null,
        teamCode: userData.team_code || null
      },
      session: data.session
    });
  } catch (error) {
    console.error('Error no controlado en el proceso de inicio de sesión:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(200).json({ message: 'Sesión cerrada correctamente' });
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// API endpoint para equipos
app.post('/api/teams/create', async (req, res) => {
  try {
    const { name, password, creatorId } = req.body;
    
    // Generar un código único para el equipo
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const { data, error } = await supabase
      .from('teams')
      .insert([
        { 
          name,
          password,
          code,
          creator_id: creatorId
        }
      ])
      .select();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(200).json({ team: data[0] });
  } catch (error) {
    console.error('Error al crear equipo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/teams/join/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const { password } = req.query;
    
    // Verificar si existe el equipo
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('code', code)
      .single();
    
    if (error || !data) {
      return res.status(404).json({ error: 'No existe un equipo con ese código' });
    }
    
    // Verificar contraseña
    if (data.password !== password) {
      return res.status(401).json({ error: 'La contraseña del equipo es incorrecta' });
    }
    
    res.status(200).json({ team: data });
  } catch (error) {
    console.error('Error al unirse al equipo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// API endpoints para transacciones
app.post('/api/transactions', async (req, res) => {
  try {
    const { type, costType, amount, category, date, description, userId } = req.body;
    
    const { data, error } = await supabase
      .from('transactions')
      .insert([
        { 
          type,
          cost_type: costType,
          amount,
          category,
          date,
          description,
          user_id: userId
        }
      ])
      .select();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(200).json({ transaction: data[0] });
  } catch (error) {
    console.error('Error al crear transacción:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/transactions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(200).json({ transactions: data });
  } catch (error) {
    console.error('Error al obtener transacciones:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.put('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, costType, amount, category, date, description } = req.body;
    
    const { data, error } = await supabase
      .from('transactions')
      .update({ 
        type,
        cost_type: costType,
        amount,
        category,
        date,
        description
      })
      .eq('id', id)
      .select();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(200).json({ transaction: data[0] });
  } catch (error) {
    console.error('Error al actualizar transacción:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(200).json({ message: 'Transacción eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar transacción:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// API endpoints para ahorros
app.post('/api/savings', async (req, res) => {
  try {
    const { amount, description, date, userId } = req.body;
    
    const { data, error } = await supabase
      .from('savings')
      .insert([
        { 
          amount,
          description,
          date,
          user_id: userId
        }
      ])
      .select();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(200).json({ saving: data[0] });
  } catch (error) {
    console.error('Error al registrar ahorro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/savings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data, error } = await supabase
      .from('savings')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(200).json({ savings: data });
  } catch (error) {
    console.error('Error al obtener ahorros:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.delete('/api/savings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { error } = await supabase
      .from('savings')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(200).json({ message: 'Ahorros reiniciados correctamente' });
  } catch (error) {
    console.error('Error al reiniciar ahorros:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// API endpoints para categorías
app.post('/api/categories', async (req, res) => {
  try {
    const { name, type, userId } = req.body;
    
    const { data, error } = await supabase
      .from('categories')
      .insert([
        { 
          name,
          type,
          user_id: userId
        }
      ])
      .select();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(200).json({ category: data[0] });
  } catch (error) {
    console.error('Error al crear categoría:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.get('/api/categories/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(200).json({ categories: data });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Para desarrollo local
if (process.env.NODE_ENV !== 'production') {
  // Servir archivos estáticos en desarrollo
  app.use(express.static(path.join(__dirname)));
  
  // Rutas para páginas en desarrollo
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });
  
  app.get('/test', (req, res) => {
    res.sendFile(path.join(__dirname, 'test.html'));
  });
  
  // Iniciar servidor en desarrollo
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to view the application`);
  });
}

// Exportar la app para Vercel
module.exports = app;