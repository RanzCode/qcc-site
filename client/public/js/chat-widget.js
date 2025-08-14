<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Ollama SSE Stream Demo</title>
  <style>
    #output { border: 1px solid #ccc; padding: 10px; min-height: 40px; margin-top: 10px; }
  </style>
</head>
<body>
  <input type="text" id="userInput" placeholder="Type your message..." />
  <button id="sendBtn">Send</button>
  <div id="output"></div>
  <script>
    async function ollamaStreamChat(userMessage, onStreamChunk) {
      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3',
          messages: [{ role: 'user', content: userMessage }],
          stream: true
        })
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Process SSE lines
        let lines = buffer.split('\n');
        buffer = lines.pop(); // Save incomplete line for next chunk

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = line.replace(/^data:\s*/, '');
            if (data.trim() === '[DONE]') return;
            try {
              const json = JSON.parse(data);
              if (json.message && json.message.content) {
                onStreamChunk(json.message.content);
              }
            } catch (e) { /* ignore parse errors */ }
          }
        }
      }
    }

    // Minimal HTML demo logic
    const input = document.getElementById('userInput');
    const btn = document.getElementById('sendBtn');
    const output = document.getElementById('output');

    btn.onclick = async () => {
      output.textContent = '';
      await ollamaStreamChat(input.value, chunk => {
        output.textContent += chunk;
      });
    };
  </script>
</body>
</html>
