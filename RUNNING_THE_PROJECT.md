# Running the IMIP Project

This document provides comprehensive instructions for setting up and running the Intelligent Meeting Intelligence Platform (IMIP).

## Overview

IMIP is a full-stack application with:
- **Backend**: Python/FastAPI API server with MongoDB
- **Frontend**: React/Vite web application
- **Services**: Audio processing, speech-to-text, and NLP analysis

## Prerequisites

Before running the project, ensure you have installed:
- Python 3.8 or higher
- Node.js 16 or higher
- MongoDB 4.4 or higher
- FFmpeg for audio processing

## Quick Start (Easiest Method)

The fastest way to run the project is using the provided PowerShell scripts:

1. **Double-click** `start-app.ps1` to start all services
2. Your browser will automatically open to `http://localhost:5173`
3. To stop the application, double-click `stop-app.ps1`

## Manual Setup Instructions

### 1. Environment Setup

#### Backend Setup
```bash
# Create a Python virtual environment
python -m venv venv

# Activate the virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Windows (Command Prompt):
.\venv\Scripts\activate.bat

# Install Python dependencies
pip install -r requirements.txt
```

#### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install frontend dependencies
npm install

# Return to project root
cd ..
```

### 2. Database Configuration

The application uses MongoDB as its database:

1. **Start MongoDB**:
   - Ensure MongoDB is running on your system
   - By default, the application expects MongoDB at `mongodb://localhost:27017`
   - You can customize this by setting the `MONGODB_URL` environment variable

2. **MongoDB Configuration**:
   - Database name: `imip` (default)
   - Collections: `users`, `meetings`

### 3. Environment Variables

Create a `.env` file in the root directory with the following variables (most are optional):

```env
# MongoDB configuration
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=imip

# API configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=true

# FFmpeg path (if not in PATH)
FFMPEG_BIN=/path/to/ffmpeg/bin

# Vosk model path (for offline speech recognition)
VOSK_MODEL_PATH=/path/to/vosk-model

# OpenAI API key (for enhanced NLP features)
OPENAI_API_KEY=your_openai_api_key

# JWT secrets
SECRET_KEY=your-secret-key-for-jwt
REFRESH_SECRET_KEY=your-refresh-secret-key
```

### 4. Starting the Services

#### Backend API Server

Run the backend API server using uvicorn:
```bash
uvicorn app.api:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`
API documentation: `http://localhost:8000/docs`

#### Frontend Development Server

```bash
# Navigate to frontend directory
cd frontend

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

### 5. Accessing the Application

Once both services are running:
1. Open your browser to `http://localhost:5173`
2. Register a new account or log in with existing credentials
3. Start using the meeting transcription and analysis features

## Service URLs

After startup, the following services will be available:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **MongoDB**: mongodb://localhost:27017

## Stopping the Application

To stop the application:
1. Press `Ctrl+C` in each terminal window running a service
2. Or close the terminal windows
3. Or run the `stop-app.ps1` script

## Troubleshooting

### Common Issues and Solutions

1. **PowerShell Script Execution Policy**:
   If the PowerShell scripts won't run, execute this command as Administrator:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **MongoDB Not Running**:
   Start MongoDB with:
   ```bash
   mongod --dbpath ./data/db
   ```

3. **Port Conflicts**:
   If ports are already in use, stop the conflicting services or change the ports:
   ```bash
   # For backend
   uvicorn app.api:app --host 0.0.0.0 --port 8001 --reload
   ```

4. **Missing Dependencies**:
   Ensure all dependencies are installed:
   ```bash
   pip install -r requirements.txt
   cd frontend && npm install
   ```

### Testing Paths

Before first run, verify all paths exist:
```bash
.\test-paths.ps1
```

This script will check:
- All directories exist
- Required files are present
- Python/Node/NPM are installed

## Additional Scripts

The project includes several utility scripts:
- `run_servers.ps1` - Alternative script to start both servers
- `restart-frontend.ps1` - Restart only the frontend server
- `test-paths.ps1` - Verify all required paths and dependencies
- `test_api_auth.ps1` - Test API authentication endpoints
- `test_api_simple.ps1` - Simple API endpoint tests

## Development Workflow

1. Make code changes
2. The backend server will automatically reload with `--reload` flag
3. The frontend will hot-reload with Vite
4. View changes in the browser at `http://localhost:5173`

## Production Deployment

For production deployment:

1. **Build the frontend**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Use a production WSGI server** like Gunicorn for the backend:
   ```bash
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.api:app
   ```

3. **Configure environment variables** for production

4. **Set up reverse proxy** (nginx) for both services

5. **Ensure proper security configurations**:
   - Set `DEBUG=false`
   - Use strong passwords for user accounts
   - Configure proper CORS origins
   - Use HTTPS in production
   - Regularly update dependencies

## Security Considerations

- In production, set `DEBUG=false`
- Use strong passwords for user accounts
- Configure proper CORS origins
- Use HTTPS in production
- Regularly update dependencies
- Implement proper rate limiting
- Use secure JWT secrets