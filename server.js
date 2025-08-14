const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

// Serve static files from the public directory
app.use(express.static('public'));

// Serve PDF.js worker from node_modules
app.use('/pdfjs-dist', express.static(path.join(__dirname, 'node_modules/pdfjs-dist')));

app.listen(port, () => {
  console.log(`PDF viewer server running at http://localhost:${port}`);
});
