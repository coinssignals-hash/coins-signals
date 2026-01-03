"""
Run the FastAPI server
"""

import sys
import os
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent.resolve()
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Set PYTHONPATH environment variable for subprocesses (uvicorn reload)
# This ensures the backend directory is available in subprocesses
pythonpath = os.environ.get("PYTHONPATH", "")
if pythonpath:
    pythonpath = f"{backend_dir}{os.pathsep}{pythonpath}"
else:
    pythonpath = str(backend_dir)
os.environ["PYTHONPATH"] = pythonpath

import uvicorn
from app.config import get_settings

if __name__ == "__main__":
    # Ensure we're in the backend directory
    os.chdir(backend_dir)
    
    settings = get_settings()
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        reload_dirs=[str(backend_dir)] if settings.debug else None,
        log_level="info"
    )
