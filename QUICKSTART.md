# 🚀 Quick Start Guide

## Setup (5 minutes)

### 1. Configure Backend
```bash
cd /workspaces/CreaidevStudio/creai-media-backend
cp .env.example .env
# Edit .env and add: HF_TOKEN=hf_your_token_here
```

### 2. Add AI Repos as Submodules
```bash
./setup-submodules.sh
```

This adds:
- `memo/` - Talking-head generation
- `creaiVideo-Avatar/` - Full-body avatar

### 3. Download Model Weights
```bash
# Follow instructions from:
cat memo/README.md
cat creaiVideo-Avatar/README.md
```

### 4. Wire Up Inference in main.py
```python
# Look at their function signatures:
cat memo/inference.py | grep "def "
cat creaiVideo-Avatar/*.py | grep "def "

# Then uncomment and wire up in main.py
```

### 5. Test Backend
```bash
python main.py
# Visit http://localhost:8000/docs
```

### 6. Configure Frontend
```bash
cd /workspaces/CreaidevStudio
echo "NEXT_PUBLIC_MEDIA_BACKEND_URL=http://localhost:8000" >> .env.local
npm install
npm run dev
```

### 7. Test End-to-End
- Open http://localhost:3000
- Click "Generate Media"
- Try scene generation (FLUX.2-dev)
- Try talking-head or avatar (once wired up)

---

## Docker Deployment

```bash
cd /workspaces/CreaidevStudio

# Start services
docker-compose up -d

# Access:
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## API Endpoints

### POST /scene-image
```bash
curl -X POST http://localhost:8000/scene-image \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A beautiful sunset over mountains"}'
```

### POST /talking-head
```bash
curl -X POST http://localhost:8000/talking-head \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "http://example.com/face.png",
    "audioUrl": "http://example.com/audio.wav"
  }'
```

### POST /avatar-fullbody
```bash
curl -X POST http://localhost:8000/avatar-fullbody \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "http://example.com/person.png",
    "audioUrl": "http://example.com/speech.wav",
    "style": "full-body"
  }'
```

---

## Project Structure

```
CreaidevStudio/
├── creai-media-backend/        # Python backend
│   ├── main.py                 # FastAPI server
│   ├── memo/                   # Git submodule
│   └── creaiVideo-Avatar/      # Git submodule
├── src/
│   ├── lib/media-backend.ts    # Client API
│   └── components/
│       └── media-generator.tsx # UI
└── docker-compose.yml          # Services
```

---

## Troubleshooting

### Backend won't start
```bash
# Check HF_TOKEN is set
cat creai-media-backend/.env | grep HF_TOKEN

# Check port 8000
lsof -i :8000
```

### Submodules not found
```bash
cd creai-media-backend
git submodule update --init --recursive
```

### Frontend can't reach backend
```bash
# Check .env.local
cat .env.local | grep MEDIA_BACKEND_URL

# Should be: NEXT_PUBLIC_MEDIA_BACKEND_URL=http://localhost:8000
```

### GPU not available
```bash
# Check CUDA
nvidia-smi

# For Docker, uncomment GPU section in docker-compose.yml
```

---

## Documentation Files

| File | Purpose |
|------|---------|
| **ARCHITECTURE.md** | 📐 Complete architecture overview |
| **MEDIA_SETUP.md** | 📚 Detailed setup guide |
| **IMPLEMENTATION_SUMMARY.md** | 📋 What was built |
| **creai-media-backend/README.md** | 🔧 Backend-specific docs |
| **creai-media-backend/REAL_INTEGRATION_GUIDE.md** | 🎯 Detailed integration steps |
| **THIS FILE** | ⚡ Quick reference |

---

## Key Commands

```bash
# Backend
cd creai-media-backend
./setup-submodules.sh          # Add memo & avatar
python main.py                 # Run server

# Frontend
npm run dev                    # Run Next.js

# Docker
docker-compose up -d           # Start all
docker-compose logs -f         # View logs
docker-compose down            # Stop all

# Test
curl http://localhost:8000/health                    # Health check
open http://localhost:8000/docs                      # API docs
open http://localhost:3000                           # Frontend
```

---

## What's Working Now

✅ Backend structure (FastAPI)  
✅ FLUX.2-dev integration (add HF token)  
✅ Client API functions (TypeScript)  
✅ UI component (MediaGenerator)  
✅ Docker configuration  
🔄 memo integration (run setup-submodules.sh)  
🔄 avatar integration (run setup-submodules.sh)  
⏸️ TTS (choose service)  
⏸️ img2vid (choose service)  

---

## Get Help

- Backend issues: Check `creai-media-backend/REAL_INTEGRATION_GUIDE.md`
- Frontend issues: Check `MEDIA_SETUP.md`
- Architecture questions: Check `ARCHITECTURE.md`
- Implementation details: Check `IMPLEMENTATION_SUMMARY.md`

---

**Remember**: CreaidevStudio is just the frontend. The backend is a single unified Python service. No microservices needed!
