export class ChatApp {
  constructor() {
    this.messages = [];
    this.isTyping = false;
    this.setupEventListeners();
  }

  async init() {
    this.createUI();
    await this.loadMessages();
    this.setupMenuListeners();
  }

  createUI() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="chat-container">
        <div class="chat-header">
          <div class="header-content">
            <div class="avatar">
              <div class="avatar-icon">🎤</div>
            </div>
            <div class="header-text">
              <h1>Young Ellens</h1>
              <p class="status">Online • AI Assistant</p>
            </div>
          </div>
          <button class="clear-chat-btn" id="clearChat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
          </button>
        </div>
        
        <div class="messages-container" id="messagesContainer">
          <div class="welcome-message">
            <div class="welcome-icon">👋</div>
            <h2>Welcome to Young Ellens</h2>
            <p>Your AI assistant is ready to chat. Send a message to get started!</p>
          </div>
        </div>
        
        <div class="typing-indicator" id="typingIndicator">
          <div class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span class="typing-text">Young Ellens is typing...</span>
        </div>
        
        <div class="input-container">
          <div class="input-wrapper">
            <textarea 
              id="messageInput" 
              placeholder="Type your message..."
              rows="1"
              maxlength="1000"
            ></textarea>
            <button id="sendButton" class="send-button" disabled>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22,2 15,22 11,13 2,9"></polygon>
              </svg>
            </button>
          </div>
          <div class="input-footer">
            <span class="char-count">0 / 1000</span>
          </div>
        </div>
      </div>
    `;

    this.setupInputHandlers();
  }

  setupInputHandlers() {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const charCount = document.querySelector('.char-count');

    messageInput.addEventListener('input', (e) => {
      const length = e.target.value.length;
      charCount.textContent = `${length} / 1000`;
      sendButton.disabled = length === 0;
      
      e.target.style.height = 'auto';
      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
    });

    messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    sendButton.addEventListener('click', () => {
      this.sendMessage();
    });

    document.getElementById('clearChat').addEventListener('click', () => {
      this.clearChat();
    });
  }

  setupEventListeners() {
    window.electronAPI.onNewChat(() => {
      this.clearChat();
    });

    window.electronAPI.onExportChat((event, filePath) => {
      this.exportChat(filePath);
    });
  }

  setupMenuListeners() {
    
  }

  async loadMessages() {
    try {
      const messages = await window.electronAPI.getMessages();
      this.messages = messages;
      this.renderMessages();
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }

  renderMessages() {
    const container = document.getElementById('messagesContainer');
    const welcomeMessage = container.querySelector('.welcome-message');
    
    if (this.messages.length > 0 && welcomeMessage) {
      welcomeMessage.remove();
    }

    if (this.messages.length === 0) {
      if (!welcomeMessage) {
        container.innerHTML = `
          <div class="welcome-message">
            <div class="welcome-icon">👋</div>
            <h2>Welcome to Young Ellens</h2>
            <p>Your AI assistant is ready to chat. Send a message to get started!</p>
          </div>
        `;
      }
      return;
    }

    const messagesHTML = this.messages.map(message => this.createMessageHTML(message)).join('');
    container.innerHTML = messagesHTML;
    this.scrollToBottom();
  }

  createMessageHTML(message) {
    const isUser = message.sender === 'user';
    const time = new Date(message.timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return `
      <div class="message ${isUser ? 'user-message' : 'ai-message'}">
        <div class="message-content">
          <p>${this.escapeHtml(message.text)}</p>
          <span class="message-time">${time}</span>
        </div>
      </div>
    `;
  }

  async sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    
    if (!text || this.isTyping) return;

    const userMessage = {
      text,
      sender: 'user',
      timestamp: Date.now()
    };

    try {
      await window.electronAPI.saveMessage(userMessage);
      this.messages.push(userMessage);
      
      input.value = '';
      input.style.height = 'auto';
      document.querySelector('.char-count').textContent = '0 / 1000';
      document.getElementById('sendButton').disabled = true;
      
      this.renderMessages();
      this.showTypingIndicator();
      
      const aiResponse = await window.electronAPI.sendAIMessage(text);
      await window.electronAPI.saveMessage(aiResponse);
      
      this.messages.push(aiResponse);
      this.hideTypingIndicator();
      this.renderMessages();
      
    } catch (error) {
      console.error('Failed to send message:', error);
      this.hideTypingIndicator();
    }
  }

  showTypingIndicator() {
    this.isTyping = true;
    const indicator = document.getElementById('typingIndicator');
    indicator.classList.add('visible');
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    this.isTyping = false;
    const indicator = document.getElementById('typingIndicator');
    indicator.classList.remove('visible');
  }

  async clearChat() {
    try {
      await window.electronAPI.clearChat();
      this.messages = [];
      this.renderMessages();
    } catch (error) {
      console.error('Failed to clear chat:', error);
    }
  }

  async exportChat(filePath) {
    try {
      const fs = require('fs').promises;
      const exportData = {
        timestamp: new Date().toISOString(),
        messages: this.messages,
        version: await window.electronAPI.getAppVersion()
      };
      
      await fs.writeFile(filePath, JSON.stringify(exportData, null, 2));
    } catch (error) {
      console.error('Failed to export chat:', error);
    }
  }

  scrollToBottom() {
    setTimeout(() => {
      const container = document.getElementById('messagesContainer');
      container.scrollTop = container.scrollHeight;
    }, 100);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}