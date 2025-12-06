#!/bin/bash

# Creai Media Backend - Quick Start Script

set -e

echo "🎬 Creai Media Backend Setup"
echo "=============================="
echo ""

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: Please run this script from the CreaidevStudio root directory"
    exit 1
fi

# Check for .env file in media backend
if [ ! -f "creai-media-backend/.env" ]; then
    echo "📝 Creating media backend .env file..."
    cp creai-media-backend/.env.example creai-media-backend/.env
    echo "⚠️  Please edit creai-media-backend/.env and add your HuggingFace token (HF_TOKEN)"
    echo "   Get your token from: https://huggingface.co/settings/tokens"
    echo ""
    read -p "Press Enter after you've added your HF_TOKEN to continue..."
fi

# Check for .env.local in main app
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local for Next.js app..."
    echo "NEXT_PUBLIC_MEDIA_BACKEND_URL=http://localhost:8000" > .env.local
fi

# Ask user which setup method they prefer
echo ""
echo "Choose setup method:"
echo "1) Docker Compose (recommended - all services)"
echo "2) Local development (manual setup)"
read -p "Enter choice [1-2]: " choice

case $choice in
    1)
        echo ""
        echo "🐳 Starting services with Docker Compose..."
        echo ""
        
        # Check if Docker is installed
        if ! command -v docker &> /dev/null; then
            echo "❌ Docker is not installed. Please install Docker first."
            exit 1
        fi
        
        # Build and start services
        docker-compose up -d --build
        
        echo ""
        echo "✅ Services started!"
        echo ""
        echo "📍 Access points:"
        echo "   - CreaidevStudio UI: http://localhost:3000"
        echo "   - Media Backend API: http://localhost:8000"
        echo "   - API Documentation: http://localhost:8000/docs"
        echo ""
        echo "📊 View logs:"
        echo "   docker-compose logs -f"
        echo ""
        echo "🛑 Stop services:"
        echo "   docker-compose down"
        ;;
    2)
        echo ""
        echo "🔧 Local Development Setup"
        echo ""
        
        # Check Python
        if ! command -v python3 &> /dev/null; then
            echo "❌ Python 3 is not installed"
            exit 1
        fi
        
        # Check Node
        if ! command -v node &> /dev/null; then
            echo "❌ Node.js is not installed"
            exit 1
        fi
        
        echo "1️⃣ Setting up Media Backend..."
        cd creai-media-backend
        
        # Create virtual environment if it doesn't exist
        if [ ! -d "venv" ]; then
            python3 -m venv venv
        fi
        
        # Activate and install
        source venv/bin/activate
        pip install -r requirements.txt
        
        echo ""
        echo "✅ Media Backend ready!"
        echo "   To start: cd creai-media-backend && source venv/bin/activate && python main.py"
        echo ""
        
        cd ..
        
        echo "2️⃣ Setting up Next.js app..."
        
        # Install dependencies if needed
        if [ ! -d "node_modules" ]; then
            npm install
        fi
        
        echo ""
        echo "✅ Next.js app ready!"
        echo "   To start: npm run dev"
        echo ""
        echo "📝 Manual steps:"
        echo "   1. In one terminal: cd creai-media-backend && source venv/bin/activate && python main.py"
        echo "   2. In another terminal: npm run dev"
        echo "   3. Open http://localhost:3000"
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "📚 Next Steps:"
echo "   1. Containerize memo fork (see MEDIA_SETUP.md)"
echo "   2. Containerize creaiVideo-Avatar fork (see MEDIA_SETUP.md)"
echo "   3. Choose and integrate TTS service"
echo "   4. Add image-to-video animation"
echo ""
echo "📖 Full documentation: MEDIA_SETUP.md"
echo ""
echo "🎉 Setup complete!"
