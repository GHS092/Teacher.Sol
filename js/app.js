import { ChatUI } from './chat-ui.js';

const chatUI = new ChatUI(document.querySelector('.chat-container'));

// DOM Elements
const initialView = document.getElementById('initial-view');
const chatView = document.getElementById('chat-view');
const backButton = document.querySelector('.back-button');
const sendButton = document.querySelector('.send-button');
const input = document.querySelector('.input-area input');
const functionButtons = document.querySelectorAll('.function-button');

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

async function handleSend() {
  const message = input.value.trim();

  if (!message) return;

  // Show chat view if this is the first message
  if (chatView.classList.contains('hidden')) {
    showChatView();
  }

  // Clear input
  input.value = '';

  // Add user message
  chatUI.addMessage(message, 'user');

  // Show typing indicator
  chatUI.showTypingIndicator();

  try {
    // Hacer una solicitud al servidor Node.js
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message })
    });

    if (!response.ok) {
      throw new Error(`Error en el servidor: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.response;

    // Hide typing indicator and show response
    chatUI.hideTypingIndicator();
    chatUI.addMessage(aiResponse, 'assistant');
  } catch (error) {
    console.error('Error in chat interaction:', error);
    chatUI.hideTypingIndicator();
    chatUI.addMessage('Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.', 'assistant');
  }
}

// Setup event listeners
backButton.addEventListener('click', showInitialView);
sendButton.addEventListener('click', handleSend);
input.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleSend();
});

// Function buttons open chat with pre-filled context
functionButtons.forEach(button => {
  button.addEventListener('click', () => {
    showChatView();
    const buttonText = button.textContent.trim();
    input.value = `Ayúdame con ${buttonText}`;
    handleSend();
  });
});