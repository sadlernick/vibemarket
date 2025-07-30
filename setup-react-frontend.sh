#!/bin/bash

echo "🚀 Setting up Modern React Frontend for VibeMarket..."

# Create React app if it doesn't exist
if [ ! -d "client" ]; then
    echo "📦 Creating React TypeScript app..."
    npx create-react-app client --template typescript
fi

cd client

echo "📦 Installing additional dependencies..."
npm install \
  react-router-dom \
  @types/react-router-dom \
  axios \
  @heroicons/react \
  @headlessui/react \
  tailwindcss \
  @tailwindcss/forms \
  @tailwindcss/typography \
  autoprefixer \
  postcss

echo "🎨 Setting up Tailwind CSS..."
npx tailwindcss init -p

echo "✅ Frontend setup complete!"
echo ""
echo "Next steps:"
echo "1. Run the setup script: chmod +x setup-react-frontend.sh && ./setup-react-frontend.sh"
echo "2. Start development: npm run client"
echo "3. Visit: http://localhost:3000"