const express = require('express');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(express.json());

// Basic login endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'nick@sportwise.ai' && password === 'Sloan2018!') {
    res.json({
      message: 'Login successful!',
      user: { 
        username: 'nick_admin', 
        email: 'nick@sportwise.ai',
        role: 'admin'
      },
      token: 'fake-jwt-token-for-demo'
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>VibeMarket - Admin Login Test</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .form-group { margin: 20px 0; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
        button { background: #6366f1; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
        button:hover { background: #5757e8; }
        .success { background: #d4edda; color: #155724; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .error { background: #f8d7da; color: #721c24; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .hidden { display: none; }
      </style>
    </head>
    <body>
      <h1>🚀 VibeMarket Admin Login Test</h1>
      <p>Test the admin login with your credentials:</p>
      
      <div id="result" class="hidden"></div>
      
      <form id="loginForm">
        <div class="form-group">
          <label>Email:</label>
          <input type="email" id="email" value="nick@sportwise.ai" required>
        </div>
        
        <div class="form-group">
          <label>Password:</label>
          <input type="password" id="password" value="Sloan2018!" required>
        </div>
        
        <button type="submit">Test Login</button>
      </form>

      <div style="margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 4px;">
        <h3>✅ Backend API Status:</h3>
        <p><strong>Server:</strong> Running on http://localhost:3001</p>
        <p><strong>Admin Email:</strong> nick@sportwise.ai</p>
        <p><strong>Password:</strong> Sloan2018!</p>
        
        <h3>🎯 Next Steps:</h3>
        <ol>
          <li>Install MongoDB: <code>brew install mongodb-community</code></li>
          <li>Start MongoDB: <code>brew services start mongodb-community</code></li>
          <li>Start main backend: <code>npm run server</code></li>
          <li>Start React frontend: <code>cd client && npm start</code></li>
        </ol>
      </div>

      <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const email = document.getElementById('email').value;
          const password = document.getElementById('password').value;
          const resultDiv = document.getElementById('result');
          
          try {
            const response = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
              resultDiv.className = 'success';
              resultDiv.innerHTML = \`
                <h3>✅ Login Successful!</h3>
                <p><strong>User:</strong> \${data.user.username}</p>
                <p><strong>Email:</strong> \${data.user.email}</p>
                <p><strong>Role:</strong> \${data.user.role}</p>
                <p><strong>Token:</strong> \${data.token}</p>
              \`;
            } else {
              resultDiv.className = 'error';
              resultDiv.innerHTML = \`<h3>❌ Login Failed</h3><p>\${data.error}</p>\`;
            }
          } catch (error) {
            resultDiv.className = 'error';
            resultDiv.innerHTML = \`<h3>❌ Error</h3><p>\${error.message}</p>\`;
          }
          
          resultDiv.classList.remove('hidden');
        });
      </script>
    </body>
    </html>
  `);
});

console.log(\`
🚀 VibeMarket Test Server Starting...

📍 URL: http://localhost:\${PORT}
👤 Admin Email: nick@sportwise.ai  
🔑 Password: Sloan2018!

The server includes a login test page to verify your admin credentials work.
\`);

app.listen(PORT, () => {
  console.log(\`✅ Server running at http://localhost:\${PORT}\`);
});