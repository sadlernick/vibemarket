# Quick React Frontend Setup

## Step 1: Create React App
```bash
cd /Users/nicksadler/appmarketplace
rm -rf client  # Remove old client if exists
npx create-react-app client --template typescript
```

## Step 2: Install Dependencies
```bash
cd client
npm install react-router-dom @types/react-router-dom axios @heroicons/react @headlessui/react tailwindcss @tailwindcss/forms autoprefixer postcss
```

## Step 3: Setup Tailwind CSS
```bash
npx tailwindcss init -p
```

## Step 4: Copy Modern Components
I've created modern React components in the `/react-frontend/` folder. Copy them to your client directory:

```bash
# Copy components to client/src/
cp -r react-frontend/* client/src/
```

## Step 5: Configure Tailwind
Update `client/tailwind.config.js`:
```js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
```

## Step 6: Update CSS
Replace `client/src/index.css` with:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Step 7: Update Package.json
Add proxy to `client/package.json`:
```json
{
  "proxy": "http://localhost:5001"
}
```

## Step 8: Start Development
```bash
npm start
```

Your modern React frontend will be available at http://localhost:3000!