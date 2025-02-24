export class ChatUI {
  constructor(container) {
    this.container = container;
  }

  addMessage(text, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = type === 'user' ? 'U' : 'E';
    
    const content = document.createElement('div');
    content.className = 'message-content';

    // Format text to match screenshot style and handle language labels
    const formattedText = text
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/•\s+([^\n]+)/g, '<li>$1</li>')
      .replace(/(\d+)\.\s+([^\n]+)/g, '$1 $2')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/^([A-Za-zÀ-ÿ\s]+):\s*/gm, '<strong>$1:</strong> ');
    
    content.innerHTML = formattedText.startsWith('<p>') ? 
      formattedText : 
      `<p>${formattedText}</p>`;
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    this.container.appendChild(messageDiv);
    
    this.container.scrollTop = this.container.scrollHeight;
  }

  showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'message assistant typing-indicator';
    indicator.innerHTML = `
      <div class="message-avatar">G</div>
      <div class="message-content compact">
        <div class="typing-dots">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    `;
    this.container.appendChild(indicator);
    this.container.scrollTop = this.container.scrollHeight;
  }

  hideTypingIndicator() {
    const indicator = this.container.querySelector('.typing-indicator');
    if (indicator) indicator.remove();
  }
}