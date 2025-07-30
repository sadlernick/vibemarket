const express = require('express');
const path = require('path');

const app = express();
const PORT = 3001;

app.get('/', (req, res) => {
  res.send(`
    <h1>VibeMarket Test Server</h1>
    <p>Server is running!</p>
    <ul>
      <li><a href="/login">Login Page</a></li>
      <li><a href="/api/health">API Health Check</a></li>
    </ul>
  `);
});

app.get('/login', (req, res) => {
  res.send(`
    <h1>Login</h1>
    <form method="post" action="/api/auth/login">
      <p>
        <label>Email:</label><br>
        <input type="email" name="email" value="nick@sportwise.ai" required>
      </p>
      <p>
        <label>Password:</label><br>
        <input type="password" name="password" value="Sloan2018!" required>
      </p>
      <p>
        <button type="submit">Login</button>
      </p>
    </form>
    <p><em>Note: This will need the backend API running to work</em></p>
  `);
});

app.get('/api/health', (req, res) => {
  res.json({ message: 'Test server is running!', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
});