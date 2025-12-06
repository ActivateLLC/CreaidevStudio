#!/bin/bash

# Setup script for integrating memo and creaiVideo-Avatar as submodules

set -e

echo "🎬 Creai Media Backend - Submodule Setup"
echo "=========================================="
echo ""

cd "$(dirname "$0")"

# Check if we're in the right directory
if [ ! -f "main.py" ]; then
    echo "❌ Error: Please run this script from the creai-media-backend directory"
    exit 1
fi

echo "📦 Adding git submodules..."
echo ""

# Add memo if not already present
if [ ! -d "memo/.git" ]; then
    echo "1️⃣ Adding memo (ActivateLLC/memo)..."
    git submodule add https://github.com/ActivateLLC/memo.git memo || echo "   Submodule may already exist in .gitmodules"
    git submodule update --init --recursive memo
    echo "   ✅ memo added"
else
    echo "1️⃣ memo already present, updating..."
    cd memo && git pull origin main && cd ..
    echo "   ✅ memo updated"
fi

echo ""

# Add creaiVideo-Avatar if not already present
if [ ! -d "creaiVideo-Avatar/.git" ]; then
    echo "2️⃣ Adding creaiVideo-Avatar (ActivateLLC/creaiVideo-Avatar)..."
    git submodule add https://github.com/ActivateLLC/creaiVideo-Avatar.git creaiVideo-Avatar || echo "   Submodule may already exist in .gitmodules"
    git submodule update --init --recursive creaiVideo-Avatar
    echo "   ✅ creaiVideo-Avatar added"
else
    echo "2️⃣ creaiVideo-Avatar already present, updating..."
    cd creaiVideo-Avatar && git pull origin main && cd ..
    echo "   ✅ creaiVideo-Avatar updated"
fi

echo ""
echo "📚 Installing dependencies..."
echo ""

# Create venv if needed
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate

# Upgrade pip and install build tools
pip install --upgrade pip setuptools wheel

# Install backend dependencies
echo "3️⃣ Installing backend dependencies..."
pip install -q -r requirements.txt
echo "   ✅ Backend dependencies installed"

# Install memo dependencies
if [ -f "memo/requirements.txt" ]; then
    echo "4️⃣ Installing memo dependencies..."
    pip install -q -r memo/requirements.txt
    echo "   ✅ memo dependencies installed"
else
    echo "   ⚠️  memo/requirements.txt not found - check the repo structure"
fi

# Install avatar dependencies
if [ -f "creaiVideo-Avatar/requirements.txt" ]; then
    echo "5️⃣ Installing creaiVideo-Avatar dependencies..."
    pip install -q -r creaiVideo-Avatar/requirements.txt
    echo "   ✅ creaiVideo-Avatar dependencies installed"
else
    echo "   ⚠️  creaiVideo-Avatar/requirements.txt not found - check the repo structure"
fi

echo ""
echo "🎉 Submodules setup complete!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Download model weights:"
echo "   - Check memo/README.md for weight download instructions"
echo "   - Check creaiVideo-Avatar/README.md for Hunyuan weights"
echo ""
echo "2. Inspect the inference functions:"
echo "   cat memo/inference.py | grep 'def '"
echo "   cat creaiVideo-Avatar/*.py | grep 'def '"
echo ""
echo "3. Update main.py to import and call those functions"
echo "   - Uncomment the import lines"
echo "   - Wire up the /talking-head endpoint"
echo "   - Wire up the /avatar-fullbody endpoint"
echo ""
echo "4. Test the backend:"
echo "   python main.py"
echo "   curl -X POST http://localhost:8000/scene-image -H 'Content-Type: application/json' -d '{\"prompt\":\"test\"}'"
echo ""
echo "📖 Full guide: REAL_INTEGRATION_GUIDE.md"
