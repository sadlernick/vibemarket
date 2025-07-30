const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static(__dirname));

// Serve the full frontend at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'full-frontend.html'));
});

// Keep simple frontend available at /simple
app.get('/simple', (req, res) => {
  res.sendFile(path.join(__dirname, 'simple-frontend.html'));
});

console.log('🌐 Frontend server starting...');
console.log('📍 URL: http://localhost:' + PORT);
console.log('🔗 Backend API: http://localhost:5001');

app.listen(PORT, () => {
  console.log('✅ Frontend running at http://localhost:' + PORT);
});