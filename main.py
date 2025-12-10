"""Main entry point for the Intelligent Meeting Insights Platform API server."""
# -*- coding: utf-8 -*-

import uvicorn
import os
import sys
from dotenv import load_dotenv

# Fix Unicode encoding issues on Windows
if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())

# Load environment variables from .env file if present
load_dotenv()

# Import and setup configuration
from app.config import config

# Setup environment based on configuration
config.setup_environment()

# Validate configuration
validation_status = config.validate()

from app.api import app

if __name__ == "__main__":
    print("🚀 Starting Intelligent Meeting Insights Platform API...")
    print("📱 React Frontend: http://localhost:5173")
    print(f"🔧 API Server: http://{config.HOST}:{config.PORT}")
    print(f"📚 API Documentation: http://{config.HOST}:{config.PORT}/docs")
    print()
    
    # Print configuration status
    print("📋 Configuration Status:")
    for key, value in validation_status.items():
        if isinstance(value, dict) and 'found' in value:
            status = "✅" if value['found'] else "❌"
            print(f"  {status} {key}: {value.get('path', 'Not found')}")
    print()
    
    # Use 127.0.0.1 instead of 0.0.0.0 to avoid IPv6 issues on Windows
    host = "127.0.0.1" if config.HOST == "0.0.0.0" else config.HOST
    uvicorn.run(
        "app.api:app", 
        host=host, 
        port=config.PORT, 
        reload=config.RELOAD,
        log_level=config.LOG_LEVEL
    )
