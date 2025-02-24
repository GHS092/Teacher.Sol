import { ChatUI } from './chat-ui.js';
import { ChatDB } from './db.js';
import { Auth } from './auth.js';
import { AuthUI } from './auth-ui.js';

// Initialize authentication
const auth = new Auth();
const authUI = new AuthUI(auth);
window.authUI = authUI; // Make it available globally for the HTML onclick handlers

// Initialize other components
const chatUI = new ChatUI(document.querySelector('.chat-container'));
const db = new ChatDB();

// Initialize all systems
async function init() {
  await Promise.all([
    auth.init(),
    db.init()
  ]);

  const user = await auth.checkSession();
  if (user) {
    authUI.hideAuthContainer();
    initializeApp();
  } else {
    authUI.showAuthContainer();
    authUI.showLoginForm();
  }
}

async function initializeApp() {
  // DOM Elements
  const initialView = document.getElementById('initial-view');
  const chatView = document.getElementById('chat-view');
  const backButton = document.querySelector('.back-button');
  const sendButton = document.querySelector('.send-button');
  const input = document.querySelector('.input-area input');
  const functionButtons = document.querySelectorAll('.function-button');
  const translateButton = document.querySelector('.translate-button');
  const examplesButton = document.querySelector('.examples-button');
  const sandwichButton = document.querySelector('.ph-list');
  const chatHistoryPanel = document.createElement('div');
  chatHistoryPanel.className = 'chat-history-panel hidden';
  document.querySelector('.app').appendChild(chatHistoryPanel);

  // Chat history data structure
  let chatHistory = [];

  // Show chat view when starting a new conversation
  function showChatView() {
    initialView.style.display = 'none';
    chatView.classList.remove('hidden');
  }

  // Return to initial view
  function showInitialView() {
    initialView.style.display = 'block';
    chatView.classList.add('hidden');
    document.querySelector('.chat-container').innerHTML = '';
    input.value = '';
  }

  // Show/hide chat history panel
  function toggleChatHistory(e) {
    e.stopPropagation();
    chatHistoryPanel.classList.toggle('hidden');
    if (!chatHistoryPanel.classList.contains('hidden')) {
      updateChatHistoryPanel();
    }
  }

  // Update chat history panel
  async function updateChatHistoryPanel() {
    const chats = await db.getAllChats();
    chatHistory = chats; 

    chatHistoryPanel.innerHTML = `
      <div class="chat-history-header">
        <h2>Conversaciones</h2>
        <button class="close-history">
          <i class="ph ph-x"></i>
        </button>
      </div>
      <div class="chat-history-list">
        ${chats.map(chat => `
          <div class="chat-history-item" data-chat-id="${chat.id}">
            <i class="ph ph-chat-circle"></i>
            <div class="chat-title-container">
              <span class="chat-title">${chat.title}</span>
              <input type="text" class="edit-title-input" value="${chat.title}">
            </div>
            <div class="chat-actions">
              <button class="edit-chat" title="Editar nombre">
                <i class="ph ph-pencil"></i>
              </button>
              <button class="delete-chat" title="Eliminar chat">
                <i class="ph ph-trash"></i>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
      <button class="new-chat-button">
        <i class="ph ph-plus"></i>
        Nueva conversación
      </button>
    `;

    chatHistoryPanel.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Add event listeners
    chatHistoryPanel.querySelectorAll('.chat-history-item').forEach(item => {
      const chatId = parseInt(item.dataset.chatId);
      const titleContainer = item.querySelector('.chat-title-container');
      const titleSpan = titleContainer.querySelector('.chat-title');
      const titleInput = titleContainer.querySelector('.edit-title-input');
      const editButton = item.querySelector('.edit-chat');
      const deleteButton = item.querySelector('.delete-chat');

      // Load chat when clicking on the title or item (except when clicking buttons)
      titleSpan.addEventListener('click', (e) => {
        e.stopPropagation();
        loadChat(chatId);
        chatHistoryPanel.classList.add('hidden');
      });

      item.addEventListener('click', (e) => {
        if (!e.target.closest('.chat-actions') && !e.target.closest('.edit-title-input')) {
          loadChat(chatId);
          chatHistoryPanel.classList.add('hidden');
        }
      });

      // Edit title
      editButton.addEventListener('click', (e) => {
        e.stopPropagation();
        titleInput.classList.add('active');
        titleInput.focus();
        titleSpan.style.visibility = 'hidden';
      });

      titleInput.addEventListener('blur', async () => {
        const newTitle = titleInput.value.trim();
        if (newTitle) {
          await db.updateChatTitle(chatId, newTitle);
          titleSpan.textContent = newTitle;
        }
        titleInput.classList.remove('active');
        titleSpan.style.visibility = 'visible';
      });

      titleInput.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      titleInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
          titleInput.blur();
        }
      });

      // Delete chat
      deleteButton.addEventListener('click', async (e) => {
        e.stopPropagation();
        showDeleteConfirmation(chatId);
      });
    });

    // Close button
    chatHistoryPanel.querySelector('.close-history').addEventListener('click', () => {
      chatHistoryPanel.classList.add('hidden');
    });

    // New chat button
    chatHistoryPanel.querySelector('.new-chat-button').addEventListener('click', () => {
      showInitialView();
      chatHistoryPanel.classList.add('hidden');
    });
  }

  function showDeleteConfirmation(chatId) {
    const modal = document.createElement('div');
    modal.className = 'delete-modal';
    modal.innerHTML = `
      <div class="delete-modal-content">
        <div class="delete-modal-icon">
          <i class="ph ph-warning"></i>
        </div>
        <h3>¿Eliminar conversación?</h3>
        <p>Esta acción no se puede deshacer.</p>
        <div class="delete-modal-buttons">
          <button class="cancel-button">
            <i class="ph ph-x"></i>
            Cancelar
          </button>
          <button class="confirm-button">
            <i class="ph ph-trash"></i>
            Eliminar
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add fade-in effect
    requestAnimationFrame(() => {
      modal.classList.add('show');
    });

    // Handle button clicks
    const confirmButton = modal.querySelector('.confirm-button');
    const cancelButton = modal.querySelector('.cancel-button');
    const modalContent = modal.querySelector('.delete-modal-content');

    // Prevent clicks inside modal from closing it
    modalContent.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Close on click outside
    modal.addEventListener('click', () => {
      closeModal(modal);
    });

    confirmButton.addEventListener('click', async () => {
      await deleteChat(chatId);
      closeModal(modal);
    });

    cancelButton.addEventListener('click', () => {
      closeModal(modal);
    });
  }

  function closeModal(modal) {
    modal.classList.remove('show');
    setTimeout(() => {
      modal.remove();
    }, 300); // Match transition duration
  }

  // Create new chat
  async function createNewChat() {
    const chat = {
      id: Date.now(),
      title: 'Nueva conversación',
      messages: [],
      timestamp: new Date()
    };
    await db.saveChat(chat);
    chatHistory.push(chat);
    return chat;
  }

  // Load specific chat
  async function loadChat(chatId) {
    const chat = chatHistory.find(c => c.id === chatId);
    if (chat) {
      showChatView();
      const chatTitleElement = document.querySelector('.chat-title');
      chatTitleElement.textContent = chat.title;
      chatTitleElement.classList.add('chat-title-active');
      chatUI.container.innerHTML = '';
      chat.messages.forEach(msg => {
        chatUI.addMessage(msg.content, msg.type);
      });
      chatHistoryPanel.classList.add('hidden');
    }
  }

  // Delete chat
  async function deleteChat(chatId) {
    await db.deleteChat(chatId);
    chatHistory = chatHistory.filter(c => c.id !== chatId);
    updateChatHistoryPanel();
  }

  // Translation functionality
  async function handleTranslate() {
    const text = input.value.trim();
    if (!text) return;
    
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await response.json();
      input.value = data.translation;
    } catch (error) {
      console.error('Translation error:', error);
    }
  }

  // Examples functionality
  async function handleExamples() {
    try {
      const response = await fetch('/api/suggestions', { method: 'POST' });
      const data = await response.json();
      chatUI.showSuggestions(data.suggestions);
    } catch (error) {
      console.error('Error getting suggestions:', error);
    }
  }

  // Send message
  async function handleSend() {
    const message = input.value.trim();
    
    if (!message) return;
    
    if (chatView.classList.contains('hidden')) {
      showChatView();
      const newChat = await createNewChat();
      await loadChat(newChat.id);
    }
    
    input.value = '';
    chatUI.addMessage(message, 'user');
    chatUI.showTypingIndicator();
    
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history: chatHistory[chatHistory.length - 1]?.messages || [] })
      });
      const data = await response.json();
      chatUI.hideTypingIndicator();
      chatUI.addMessage(data.response, 'assistant');
      
      // Update current chat in both IndexedDB and local state
      const currentChat = chatHistory[chatHistory.length - 1];
      currentChat.messages.push(
        { type: 'user', content: message },
        { type: 'assistant', content: data.response }
      );

      // Generate new title after every few messages
      if (currentChat.messages.length >= 4) { // After 2 exchanges
        const titleResponse = await fetch('/api/title', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: currentChat.messages })
        });
        const titleData = await titleResponse.json();
        const newTitle = titleData.title;
        
        if (newTitle && newTitle !== currentChat.title) {
          currentChat.title = newTitle;
          
          // Update chat title in UI
          const chatTitleElement = document.querySelector('.chat-title');
          chatTitleElement.textContent = newTitle;
          chatTitleElement.classList.add('chat-title-active');
          
          // Animate the title change
          chatTitleElement.classList.add('title-updating');
          chatTitleElement.offsetHeight; // Trigger reflow
          setTimeout(() => chatTitleElement.classList.remove('title-updating'), 500); // Duración de la animación
        }
      } else if (currentChat.messages.length === 2) {
        // Initial title from first message
        currentChat.title = message.slice(0, 30) + (message.length > 30 ? '...' : '');
        
        // Update chat title in UI
        const chatTitleElement = document.querySelector('.chat-title');
        chatTitleElement.textContent = currentChat.title;
        chatTitleElement.classList.add('chat-title-active');
      }
      
      await db.saveChat(currentChat);
    } catch (error) {
      console.error('Error in chat interaction:', error);
      chatUI.hideTypingIndicator();
      chatUI.addMessage('Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.', 'assistant');
    }
  }

  // Load chat history on startup
  async function loadChatHistory() {
    const chats = await db.getAllChats();
    chatHistory = chats;
  }

  // Set send callback for ChatUI
  chatUI.setSendCallback(handleSend);

  // Setup event listeners
  backButton.addEventListener('click', showInitialView);
  sendButton.addEventListener('click', handleSend);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
  });

  translateButton.addEventListener('click', handleTranslate);
  examplesButton.addEventListener('click', handleExamples);

  // Function buttons open chat with pre-filled context
  functionButtons.forEach(button => {
    button.addEventListener('click', () => {
      showChatView();
      const buttonText = button.textContent.trim();
      input.value = `Ayúdame con ${buttonText}`;
      handleSend();
    });
  });

  sandwichButton.addEventListener('click', toggleChatHistory);
  loadChatHistory();

  document.addEventListener('click', (e) => {
    const isClickedOutside = !e.target.closest('.ph-list') && 
                            !e.target.closest('.chat-history-panel') &&
                            !chatHistoryPanel.classList.contains('hidden');
    
    if (isClickedOutside) {
      chatHistoryPanel.classList.add('hidden');
    }
  });
}

// Start the application
init().catch(console.error);

// Add logout functionality
const logoutButton = document.createElement('button');
logoutButton.className = 'logout-button';
logoutButton.innerHTML = '<i class="ph ph-sign-out"></i>';
logoutButton.onclick = () => {
  authUI.showLogoutConfirmation(() => {
    auth.logout();
    location.reload();
  });
};
document.querySelector('.icons').appendChild(logoutButton);

// Update the greeting with the user's name
const userNameSpan = document.createElement('span');
userNameSpan.textContent = localStorage.getItem('userName') || 'Guest';
document.querySelector('.greeting h1').textContent = `Welcome to English with Elizabeth, ${userNameSpan.textContent}!`;
