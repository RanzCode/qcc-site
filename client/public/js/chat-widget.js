(function () {
  const API_BASE = 'http://localhost:3001/api/chat';

  const widget = document.getElementById('chatWidget');
  const toggleBtn = document.getElementById('chatToggle');
  const closeBtn = document.getElementById('chatClose');
  const messagesEl = document.getElementById('chatMessages');
  const input = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendMessage');

  if (!widget || !toggleBtn || !messagesEl || !input || !sendBtn) return;

  let conversationId = null;
  let isSending = false;

  // Toggle open / close
  toggleBtn.addEventListener('click', () => widget.classList.toggle('open'));
  if (closeBtn) closeBtn.addEventListener('click', () => widget.classList.remove('open'));

  // Welcome message on first open
  let welcomed = false;
  widget.addEventListener('transitionend', () => {
    if (widget.classList.contains('open') && !welcomed) {
      welcomed = true;
      appendMessage('bot', 'Hello! How can we help you today? Feel free to ask questions about our church, services, or submit a prayer request.');
    }
  });

  // Send on button click or Enter key
  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  async function sendMessage() {
    const text = input.value.trim();
    if (!text || isSending) return;

    isSending = true;
    input.value = '';
    sendBtn.disabled = true;

    appendMessage('user', text);
    const typing = showTyping();

    try {
      const res = await fetch(`${API_BASE}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, conversationId })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      conversationId = data.conversationId || conversationId;
      removeTyping(typing);
      appendMessage('bot', data.message);
    } catch (err) {
      removeTyping(typing);
      appendMessage('error', 'Sorry, I could not reach the server. Please try again later.');
      console.error('Chat error:', err);
    } finally {
      isSending = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  function appendMessage(type, text) {
    const div = document.createElement('div');
    div.className = `message ${type === 'user' ? 'user-message' : type === 'error' ? 'error-message' : 'bot-message'}`;
    const content = document.createElement('div');
    content.className = 'message-content';
    content.textContent = text;
    div.appendChild(content);
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'typing-indicator';
    div.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  function removeTyping(el) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }
})();
