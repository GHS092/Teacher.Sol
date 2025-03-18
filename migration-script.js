/**
 * Script de migración de datos desde IndexedDB a Supabase
 * 
 * Este script debe ejecutarse después de que el usuario inicie sesión en Supabase
 * y se utiliza para migrar todos los datos de IndexedDB a Supabase.
 * 
 * Uso:
 * 1. El usuario inicia sesión con su cuenta nueva en Supabase
 * 2. Se ejecuta este script de migración
 * 3. Los datos se transfieren desde IndexedDB a Supabase
 */

// Función principal de migración
async function migrateToSupabase() {
  try {
    showNotification('Migración', 'Iniciando migración de datos a Supabase...', 'info');
    
    // Verificar que el usuario esté autenticado en Supabase
    const currentUser = supabaseClient.getCurrentUser();
    if (!currentUser) {
      throw new Error('Debe iniciar sesión para migrar sus datos');
    }
    
    // Obtener los datos de IndexedDB
    const idbData = await getDataFromIndexedDB();
    
    // Subir los datos a Supabase
    await migrateDataToSupabase(idbData, currentUser.id);
    
    showNotification('Éxito', 'Datos migrados correctamente a Supabase', 'success');
    return { success: true };
  } catch (error) {
    console.error('Error en la migración:', error);
    showNotification('Error', 'Error en la migración: ' + error.message, 'error');
    return { success: false, error: error.message };
  }
}

// Obtener todos los datos relevantes de IndexedDB
async function getDataFromIndexedDB() {
  try {
    // Verificar que IndexedDB esté disponible
    if (!window.indexedDB) {
      throw new Error('Su navegador no soporta IndexedDB');
    }
    
    // Verificar que la base de datos esté abierta
    if (!db) {
      await openDatabase();
    }
    
    // Obtener datos del usuario actual
    const userId = sessionStorage.getItem('userId');
    if (!userId) {
      throw new Error('No hay sesión local para migrar');
    }
    
    // Obtener transacciones del usuario
    const allTransactions = await getAllFromDb('transactions');
    const userTransactions = allTransactions.filter(t => t.userId === userId);
    
    // Obtener categorías del usuario (si tienen id de usuario)
    const allCategories = await getAllFromDb('categories');
    const userCategories = allCategories.filter(c => !c.userId || c.userId === userId);
    
    // Obtener ahorros del usuario
    const allSavings = await getAllFromDb('savings');
    const userSavings = allSavings.filter(s => s.userId === userId);
    
    // Obtener datos del equipo si existe
    const allUsers = await getAllFromDb('users');
    const user = allUsers.find(u => u.id === userId);
    
    let teamData = null;
    if (user && user.teamId) {
      const allTeams = await getAllFromDb('teams');
      teamData = allTeams.find(t => t.id === user.teamId);
    }
    
    return {
      user,
      transactions: userTransactions,
      categories: userCategories,
      savings: userSavings,
      team: teamData
    };
  } catch (error) {
    console.error('Error obteniendo datos de IndexedDB:', error);
    throw error;
  }
}

// Migrar los datos a Supabase
async function migrateDataToSupabase(data, newUserId) {
  try {
    const { user, transactions, categories, savings, team } = data;
    
    // Migrar equipo si no existe en Supabase
    let teamId = null;
    if (team) {
      // Verificar si el equipo ya existe en Supabase
      const result = await supabaseClient.joinTeam(team.code, team.password);
      
      if (result.success) {
        teamId = result.team.id;
      } else {
        // Crear el equipo en Supabase
        const createTeamResult = await supabaseClient.createTeam(team.name, team.password);
        if (createTeamResult.success) {
          teamId = createTeamResult.team.id;
        }
      }
    }
    
    // Actualizar perfil del usuario con datos del equipo
    if (teamId) {
      // Actualizar el perfil de usuario está fuera del alcance de este script básico
      // y dependerá de cómo se implementó la actualización de perfiles en supabaseClient.js
    }
    
    // Migrar categorías
    for (const category of categories) {
      await supabaseClient.saveCategory({
        name: category.name,
        type: category.type
      });
    }
    
    // Migrar transacciones
    for (const transaction of transactions) {
      await supabaseClient.saveTransaction({
        type: transaction.type,
        costType: transaction.costType,
        amount: transaction.amount,
        category: transaction.category,
        date: transaction.date,
        description: transaction.description
      });
    }
    
    // Migrar ahorros
    for (const saving of savings) {
      await supabaseClient.saveSaving({
        amount: saving.amount,
        description: saving.description || 'Migrado desde versión anterior',
        date: saving.date || new Date().toISOString().split('T')[0]
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error migrando datos a Supabase:', error);
    throw error;
  }
}

// Si este script se incluye en index.html, agregar un botón para la migración
function addMigrationButton() {
  // Solo agregar el botón si hay sesión en IndexedDB pero no en Supabase
  const hasIndexedDBSession = sessionStorage.getItem('userId');
  const hasSupabaseSession = supabaseClient.getCurrentUser();
  
  if (hasIndexedDBSession && !hasSupabaseSession) {
    const container = document.querySelector('.settings-container') || document.querySelector('#content');
    
    if (container) {
      const migrationSection = document.createElement('div');
      migrationSection.className = 'mb-4';
      migrationSection.innerHTML = `
        <div class="card dashboard-card">
          <div class="card-body">
            <h5 class="card-title">Migración a la Nube</h5>
            <p>Migre sus datos locales a la nube para acceder desde cualquier dispositivo.</p>
            <button id="migrateToCloudBtn" class="btn btn-primary">Migrar Datos a la Nube</button>
          </div>
        </div>
      `;
      
      container.appendChild(migrationSection);
      
      // Agregar evento al botón
      document.getElementById('migrateToCloudBtn').addEventListener('click', async function() {
        const confirmed = await showConfirmDialog({
          title: 'Confirmar Migración',
          message: '¿Está seguro de que desea migrar todos sus datos a la nube? Este proceso requiere iniciar sesión en su cuenta de Supabase.',
          confirmText: 'Iniciar Migración'
        });
        
        if (confirmed) {
          await migrateToSupabase();
        }
      });
    }
  }
}

// Exportar funciones para su uso
window.dataMigration = {
  migrateToSupabase,
  addMigrationButton
}; 