/**
 * Cliente de Supabase para la aplicación GHS Finanzas
 * Este archivo maneja todas las interacciones con Supabase
 */

// Inicializamos el cliente de Supabase
let supabase;
let currentUser = null;
let currentSession = null;

// Función para inicializar el cliente de Supabase
async function initSupabase() {
  try {
    // Obtener las credenciales del servidor
    const response = await fetch('/api/config');
    const config = await response.json();
    
    if (!config.supabaseUrl || !config.supabaseKey) {
      console.error('Error: Credenciales de Supabase no configuradas');
      return false;
    }
    
    // Inicializar el cliente
    supabase = supabase.createClient(config.supabaseUrl, config.supabaseKey);
    
    // Intentar restaurar sesión si existe
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      currentSession = session;
      currentUser = session.user;
      console.log('Sesión restaurada automáticamente');
      
      // Obtener el perfil del usuario
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();
      
      if (!profileError && profileData) {
        currentUser = {
          ...currentUser,
          username: profileData.username,
          isAdmin: profileData.is_admin,
          teamId: profileData.team_id,
          teamName: profileData.team_name,
          teamCode: profileData.team_code
        };
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error inicializando Supabase:', error);
    return false;
  }
}

// Autenticación
async function registerUser(userData) {
  try {
    const { username, email, password, profileType, 
            teamId = null, teamName = null, teamCode = null, accessCode = null } = userData;
    
    const isAdmin = profileType === 'admin';
    
    // Validar datos
    if (!email || !email.includes('@') || !password || password.length < 6) {
      throw new Error('Datos de registro inválidos. Asegúrese de proporcionar un correo y contraseña válidos.');
    }
    
    // Llamar a la API de registro
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        email,
        password,
        profileType,
        isAdmin,
        teamId,
        teamName,
        teamCode,
        accessCode
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error durante el registro');
    }
    
    return { success: true, message: data.message };
  } catch (error) {
    console.error('Error en registro:', error);
    return { success: false, error: error.message };
  }
}

async function loginUser(email, password) {
  try {
    console.log('Intentando iniciar sesión para:', email);
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Error de inicio de sesión:', data.error);
      throw new Error(data.error || 'Error durante el inicio de sesión');
    }
    
    // Guardar la sesión y el usuario
    console.log('Inicio de sesión exitoso para:', email);
    console.log('Datos de usuario recibidos:', data.user ? 'Sí' : 'No');
    
    if (!data.user) {
      console.error('No se recibieron datos de usuario en la respuesta');
      throw new Error('Error: No se recibieron datos de usuario');
    }
    
    currentUser = data.user;
    currentSession = data.session;
    
    console.log('Información del usuario almacenada localmente:', currentUser.id);
    
    return { success: true, user: data.user };
  } catch (error) {
    console.error('Error en login:', error);
    return { success: false, error: error.message };
  }
}

async function logoutUser() {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST'
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Error durante el cierre de sesión');
    }
    
    // Limpiar datos de sesión
    currentUser = null;
    currentSession = null;
    
    return { success: true };
  } catch (error) {
    console.error('Error en logout:', error);
    return { success: false, error: error.message };
  }
}

// Manejo de Equipos
async function createTeam(name, password) {
  try {
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }
    
    const response = await fetch('/api/teams/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        password,
        creatorId: currentUser.id
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error al crear equipo');
    }
    
    return { success: true, team: data.team };
  } catch (error) {
    console.error('Error creando equipo:', error);
    return { success: false, error: error.message };
  }
}

async function joinTeam(code, password) {
  try {
    const response = await fetch(`/api/teams/join/${code}?password=${encodeURIComponent(password)}`);
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error al unirse al equipo');
    }
    
    return { success: true, team: data.team };
  } catch (error) {
    console.error('Error al unirse al equipo:', error);
    return { success: false, error: error.message };
  }
}

// Manejo de Transacciones
async function getTransactions() {
  try {
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }
    
    const response = await fetch(`/api/transactions/${currentUser.id}`);
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error al obtener transacciones');
    }
    
    // Normalizar datos para que coincidan con el formato actual
    const transactions = data.transactions.map(transaction => ({
      id: transaction.id,
      type: transaction.type,
      costType: transaction.cost_type,
      amount: transaction.amount,
      category: transaction.category,
      date: transaction.date,
      description: transaction.description
    }));
    
    return { success: true, transactions };
  } catch (error) {
    console.error('Error obteniendo transacciones:', error);
    return { success: false, error: error.message };
  }
}

async function saveTransaction(transaction) {
  try {
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }
    
    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...transaction,
        userId: currentUser.id
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error al guardar transacción');
    }
    
    return { 
      success: true, 
      transaction: {
        id: data.transaction.id,
        type: data.transaction.type,
        costType: data.transaction.cost_type,
        amount: data.transaction.amount,
        category: data.transaction.category,
        date: data.transaction.date,
        description: data.transaction.description
      }
    };
  } catch (error) {
    console.error('Error guardando transacción:', error);
    return { success: false, error: error.message };
  }
}

async function updateTransaction(id, transaction) {
  try {
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }
    
    const response = await fetch(`/api/transactions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transaction),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error al actualizar transacción');
    }
    
    return { 
      success: true, 
      transaction: {
        id: data.transaction.id,
        type: data.transaction.type,
        costType: data.transaction.cost_type,
        amount: data.transaction.amount,
        category: data.transaction.category,
        date: data.transaction.date,
        description: data.transaction.description
      }
    };
  } catch (error) {
    console.error('Error actualizando transacción:', error);
    return { success: false, error: error.message };
  }
}

async function deleteTransaction(id) {
  try {
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }
    
    const response = await fetch(`/api/transactions/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Error al eliminar transacción');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error eliminando transacción:', error);
    return { success: false, error: error.message };
  }
}

// Manejo de Categorías
async function getCategories() {
  try {
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }
    
    const response = await fetch(`/api/categories/${currentUser.id}`);
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error al obtener categorías');
    }
    
    return { success: true, categories: data.categories };
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    return { success: false, error: error.message };
  }
}

async function saveCategory(category) {
  try {
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }
    
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...category,
        userId: currentUser.id
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error al guardar categoría');
    }
    
    return { success: true, category: data.category };
  } catch (error) {
    console.error('Error guardando categoría:', error);
    return { success: false, error: error.message };
  }
}

// Manejo de Ahorros
async function getSavings() {
  try {
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }
    
    const response = await fetch(`/api/savings/${currentUser.id}`);
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error al obtener ahorros');
    }
    
    return { success: true, savings: data.savings };
  } catch (error) {
    console.error('Error obteniendo ahorros:', error);
    return { success: false, error: error.message };
  }
}

async function saveSaving(saving) {
  try {
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }
    
    const response = await fetch('/api/savings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...saving,
        userId: currentUser.id
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error al guardar ahorro');
    }
    
    return { success: true, saving: data.saving };
  } catch (error) {
    console.error('Error guardando ahorro:', error);
    return { success: false, error: error.message };
  }
}

async function resetSavings() {
  try {
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }
    
    const response = await fetch(`/api/savings/${currentUser.id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Error al reiniciar ahorros');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error reiniciando ahorros:', error);
    return { success: false, error: error.message };
  }
}

// Obtiene el usuario actual
function getCurrentUser() {
  return currentUser;
}

// Exportamos las funciones para su uso
window.supabaseClient = {
  initSupabase,
  registerUser,
  loginUser,
  logoutUser,
  createTeam,
  joinTeam,
  getTransactions,
  saveTransaction,
  updateTransaction,
  deleteTransaction,
  getCategories,
  saveCategory,
  getSavings,
  saveSaving,
  resetSavings,
  getCurrentUser
}; 