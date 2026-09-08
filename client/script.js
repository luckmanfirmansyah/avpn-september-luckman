/**
 * Enterprise Network AI Assistant - Client Script
 * Integrates with Backend API: http://localhost:3000/api/chat
 * Session persistence via browser LocalStorage
 * Rich Markdown & CLI code rendering with Marked & DOMPurify
 */

const API_URL = 'http://localhost:3000/api/chat';
const STORAGE_KEY = 'hactive8_gemini_chat_session';

// DOM Elements
const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const clearChatBtn = document.getElementById('clear-chat-btn');

// In-memory conversation state
let conversation = [];

// Configure Marked for security and line breaks
if (window.marked) {
  marked.setOptions({
    breaks: true,
    gfm: true
  });
}

// ----------------------------------------------------
// Initialization
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  loadChatHistory();
  setupEventListeners();
  autoResizeTextarea();
});

function setupEventListeners() {
  chatForm.addEventListener('submit', handleFormSubmit);

  // Auto resize and Enter to submit (Shift+Enter for newline)
  userInput.addEventListener('input', autoResizeTextarea);
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled && userInput.value.trim().length > 0) {
        chatForm.requestSubmit();
      }
    }
  });

  // Clear chat session
  clearChatBtn.addEventListener('click', handleClearChat);
}

// ----------------------------------------------------
// LocalStorage Session Management
// ----------------------------------------------------
function loadChatHistory() {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      conversation = JSON.parse(savedData);
    } else {
      conversation = [];
    }
  } catch (err) {
    console.error('Gagal membaca chat history dari localStorage:', err);
    conversation = [];
  }

  renderAllMessages();
}

function saveChatHistory() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversation));
  } catch (err) {
    console.error('Gagal menyimpan chat history ke localStorage:', err);
  }
}

function handleClearChat() {
  if (conversation.length === 0) return;

  const confirmed = confirm('Apakah Anda yakin ingin menghapus seluruh riwayat percakapan sesi ini?');
  if (confirmed) {
    conversation = [];
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
    renderAllMessages();
    userInput.focus();
  }
}

// ----------------------------------------------------
// Rendering Functions
// ----------------------------------------------------
function renderAllMessages() {
  chatBox.innerHTML = '';

  if (conversation.length === 0) {
    renderEmptyState();
    return;
  }

  conversation.forEach(msg => {
    appendMessageToUI(msg.role, msg.text, msg.timestamp, false);
  });

  scrollToBottom();
}

function renderEmptyState() {
  const emptyDiv = document.createElement('div');
  emptyDiv.className = 'empty-state';
  emptyDiv.innerHTML = `
    <div class="empty-icon">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
        <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
        <line x1="6" y1="6" x2="6.01" y2="6"></line>
        <line x1="6" y1="18" x2="6.01" y2="18"></line>
      </svg>
    </div>
    <h2 class="empty-title">Senior Enterprise Network AI</h2>
    <p class="empty-desc">
      Konsultasikan desain arsitektur jaringan tingkat enterprise, konfigurasi CLI (Cisco/Juniper/Mikrotik), routing BGP/OSPF, VLAN, hingga troubleshooting.
    </p>
    <div class="suggestions-grid">
      <button class="suggestion-card" type="button" data-prompt="Bagaimana cara konfigurasi VLAN dan 802.1Q Trunking di switch Cisco Catalyst?">
        <span class="suggestion-icon">⚡</span>
        <span>Konfigurasi VLAN & Trunking Cisco</span>
      </button>
      <button class="suggestion-card" type="button" data-prompt="OSPF neighbor saya stuck di status EXSTART / EXCHANGE. Apa penyebabnya dan bagaimana cara troubleshoot-nya?">
        <span class="suggestion-icon">🔍</span>
        <span>Troubleshoot OSPF EXSTART status</span>
      </button>
      <button class="suggestion-card" type="button" data-prompt="Bagaimana merancang redundansi default gateway menggunakan HSRP atau VRRP untuk core network?">
        <span class="suggestion-icon">🛡️</span>
        <span>Desain Redundansi Core (HSRP/VRRP)</span>
      </button>
      <button class="suggestion-card" type="button" data-prompt="Jelaskan best practice arsitektur jaringan spine-and-leaf untuk data center enterprise.">
        <span class="suggestion-icon">🌐</span>
        <span>Arsitektur Spine-and-Leaf Data Center</span>
      </button>
    </div>
  `;

  // Attach click events to suggestion pills
  emptyDiv.querySelectorAll('.suggestion-card').forEach(btn => {
    btn.addEventListener('click', () => {
      const promptText = btn.getAttribute('data-prompt');
      if (promptText) {
        userInput.value = promptText;
        autoResizeTextarea();
        chatForm.requestSubmit();
      }
    });
  });

  chatBox.appendChild(emptyDiv);
}

function appendMessageToUI(role, text, timestamp = Date.now(), shouldScroll = true) {
  // Remove empty state if present
  const emptyState = chatBox.querySelector('.empty-state');
  if (emptyState) {
    emptyState.remove();
  }

  const isUser = role === 'user';
  const row = document.createElement('div');
  row.className = `message-row ${isUser ? 'user' : 'bot'}`;

  // Avatar
  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.innerHTML = isUser
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`
    : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>`;

  // Content wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'message-content-wrapper';

  // Bubble
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';

  if (isUser) {
    // User message is rendered safely as plain text
    bubble.textContent = text;
  } else {
    // Bot message parsed as Markdown & sanitized
    let htmlContent = '';
    if (window.marked && window.DOMPurify) {
      const rawHtml = marked.parse(text);
      htmlContent = DOMPurify.sanitize(rawHtml);
    } else {
      htmlContent = escapeHTML(text).replace(/\n/g, '<br>');
    }
    bubble.innerHTML = htmlContent;

    // Enhance code blocks with copy buttons and header
    enhanceCodeBlocks(bubble);
  }

  // Timestamp
  const timeEl = document.createElement('span');
  timeEl.className = 'message-time';
  timeEl.textContent = formatTimestamp(timestamp);

  wrapper.appendChild(bubble);
  wrapper.appendChild(timeEl);

  row.appendChild(avatar);
  row.appendChild(wrapper);
  chatBox.appendChild(row);

  if (shouldScroll) {
    scrollToBottom();
  }

  return row;
}

// Enhance code blocks with custom headers and copy buttons
function enhanceCodeBlocks(container) {
  const preElements = container.querySelectorAll('pre');
  preElements.forEach((pre) => {
    // Avoid double wrapping
    if (pre.parentElement && pre.parentElement.classList.contains('code-block-wrapper')) {
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'code-block-wrapper';

    const header = document.createElement('div');
    header.className = 'code-header';

    const codeEl = pre.querySelector('code');
    let lang = 'CLI / Config';
    if (codeEl && codeEl.className) {
      const match = codeEl.className.match(/language-([a-zA-Z0-9_-]+)/);
      if (match) lang = match[1];
    }

    header.innerHTML = `
      <span class="code-lang-label">${lang}</span>
      <button class="btn-copy-code" type="button" title="Salin kode ke clipboard">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span>Salin</span>
      </button>
    `;

    const copyBtn = header.querySelector('.btn-copy-code');
    copyBtn.addEventListener('click', async () => {
      const codeText = codeEl ? codeEl.innerText : pre.innerText;
      try {
        await navigator.clipboard.writeText(codeText);
        copyBtn.innerHTML = `
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span style="color: #10b981;">Tersalin!</span>
        `;
        setTimeout(() => {
          copyBtn.innerHTML = `
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>Salin</span>
          `;
        }, 2000);
      } catch (err) {
        console.error('Gagal menyalin kode:', err);
      }
    });

    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(header);
    wrapper.appendChild(pre);
  });
}

// ----------------------------------------------------
// Typing Indicator
// ----------------------------------------------------
function showTypingIndicator() {
  const row = document.createElement('div');
  row.className = 'message-row bot typing-row';
  row.id = 'typing-indicator-row';

  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>`;

  const wrapper = document.createElement('div');
  wrapper.className = 'message-content-wrapper';

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  bubble.innerHTML = `
    <div class="typing-indicator" aria-label="AI sedang mengetik">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>
  `;

  wrapper.appendChild(bubble);
  row.appendChild(avatar);
  row.appendChild(wrapper);
  chatBox.appendChild(row);

  scrollToBottom();
}

function removeTypingIndicator() {
  const indicator = document.getElementById('typing-indicator-row');
  if (indicator) {
    indicator.remove();
  }
}

// ----------------------------------------------------
// Form Submission & API Integration
// ----------------------------------------------------
async function handleFormSubmit(e) {
  e.preventDefault();

  const text = userInput.value.trim();
  if (!text) return;

  const userTimestamp = Date.now();

  // 1. Add user message to state and UI
  const userMsgObj = {
    id: 'msg_' + userTimestamp,
    role: 'user',
    text: text,
    timestamp: userTimestamp
  };
  conversation.push(userMsgObj);
  saveChatHistory();
  appendMessageToUI('user', text, userTimestamp, true);

  // 2. Clear input and adjust UI state
  userInput.value = '';
  autoResizeTextarea();
  setFormLoading(true);
  showTypingIndicator();

  // 3. Prepare payload for /api/chat
  // Send the conversation history in format { conversation: [{ role, text }, ...] }
  const payload = {
    conversation: conversation.map(item => ({
      role: item.role === 'user' ? 'user' : 'model',
      text: item.text
    }))
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    removeTypingIndicator();

    if (!response.ok || data.error) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    const botResponseText = data.result || 'Maaf, tidak ada respon yang diterima.';
    const botTimestamp = Date.now();

    // 4. Add bot response to state and UI
    const botMsgObj = {
      id: 'msg_' + botTimestamp,
      role: 'model',
      text: botResponseText,
      timestamp: botTimestamp
    };
    conversation.push(botMsgObj);
    saveChatHistory();
    appendMessageToUI('model', botResponseText, botTimestamp, true);

  } catch (error) {
    console.error('Error saat menghubungi backend /api/chat:', error);
    removeTypingIndicator();

    // Render error notification bubble
    const errorBubble = document.createElement('div');
    errorBubble.className = 'message-row bot';
    errorBubble.innerHTML = `
      <div class="message-avatar" style="background: #ef4444; color: white;">!</div>
      <div class="message-content-wrapper">
        <div class="message-bubble error-bubble">
          <strong>Gagal Terhubung ke Backend:</strong><br>
          ${escapeHTML(error.message)}<br><br>
          <small>Pastikan server Express aktif di <code>http://localhost:3000</code> dan API Key valid.</small>
        </div>
      </div>
    `;
    chatBox.appendChild(errorBubble);
    scrollToBottom();
  } finally {
    setFormLoading(false);
    userInput.focus();
  }
}

// ----------------------------------------------------
// UI Helpers
// ----------------------------------------------------
function setFormLoading(isLoading) {
  userInput.disabled = isLoading;
  sendBtn.disabled = isLoading;
  if (isLoading) {
    sendBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
        <path d="M12 2a10 10 0 0 1 10 10"></path>
      </svg>
    `;
  } else {
    sendBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
      </svg>
    `;
  }
}

function autoResizeTextarea() {
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 140) + 'px';
}

function scrollToBottom() {
  chatBox.scrollTop = chatBox.scrollHeight;
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
