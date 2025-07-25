#!/usr/bin/env python3
"""
Development runner for Young Ellens Desktop Application
This script provides an easy way to run the application in development mode
"""

import os
import sys
import subprocess
import platform
from pathlib import Path

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ Error: Python 3.8 or higher is required")
        print(f"   Current version: {sys.version}")
        print("\n💡 How to update Python:")
        system = platform.system()
        if system == "Windows":
            print("   Visit: https://python.org/downloads/")
        elif system == "Darwin":  # macOS
            print("   Run: brew install python3")
            print("   Or visit: https://python.org/downloads/")
        else:  # Linux
            print("   Run: sudo apt update && sudo apt install python3.8")
        sys.exit(1)
    
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}")

def check_dependencies():
    """Check and install required dependencies"""
    missing_deps = []
    
    # Check critical dependencies
    try:
        import tkinter
        print("✅ Tkinter available")
    except ImportError:
        print("❌ Tkinter not available")
        print("💡 Install with: sudo apt-get install python3-tk (Linux)")
        sys.exit(1)
    
    try:
        import customtkinter
        print("✅ CustomTkinter available")
    except ImportError:
        missing_deps.append("customtkinter")
    
    try:
        import PIL
        print("✅ Pillow available")
    except ImportError:
        missing_deps.append("pillow")
    
    try:
        import requests
        print("✅ Requests available")
    except ImportError:
        missing_deps.append("requests")
    
    if missing_deps:
        print(f"📦 Installing missing dependencies: {', '.join(missing_deps)}")
        try:
            subprocess.run(
                [sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], 
                check=True,
                capture_output=True,
                text=True
            )
            print("✅ Dependencies installed successfully")
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install dependencies: {e}")
            print("💡 Try running: pip install --user -r requirements.txt")
            sys.exit(1)

def setup_environment():
    """Setup application environment"""
    # Create necessary directories
    home_dir = Path.home()
    app_dir = home_dir / ".youngellens"
    logs_dir = Path("logs")
    
    app_dir.mkdir(exist_ok=True)
    logs_dir.mkdir(exist_ok=True)
    
    print(f"📁 App directory: {app_dir}")
    print(f"📁 Logs directory: {logs_dir}")

def run_application():
    """Run the Young Ellens Desktop Application"""
    print("🚀 Starting Young Ellens Desktop Application...")
    print("=" * 50)
    
    try:
        # Add current directory to Python path
        current_dir = Path(__file__).parent
        sys.path.insert(0, str(current_dir))
        
        # Import and run the app
        from src.app import YoungEllensApp
        
        print("🎤 Initializing Young Ellens...")
        app = YoungEllensApp()
        
        print("🖥️  Opening application window...")
        app.run()
        
    except KeyboardInterrupt:
        print("\n👋 Application closed by user")
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("\n🔧 Troubleshooting:")
        print("   1. Make sure you're in the correct directory")
        print("   2. Check that all files are present")
        print("   3. Try reinstalling: pip install -r requirements.txt")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error running application: {e}")
        import traceback
        print("\n🔍 Full error details:")
        traceback.print_exc()
        print("\n🔧 Troubleshooting:")
        print("   1. Check the error details above")
        print("   2. Make sure all dependencies are installed")
        print("   3. Try running: python -m pip install --upgrade customtkinter")
        print("   4. Check the logs/ directory for more details")
        sys.exit(1)

def main():
    """Main entry point"""
    print("🎤 Young Ellens Desktop Application")
    print("Development Runner v2.0.0")
    print("=" * 40)
    print(f"🖥️  Platform: {platform.system()} {platform.release()}")
    print(f"📁 Working directory: {Path.cwd()}")
    print()
    
    # Check Python version
    check_python_version()
    
    # Setup environment
    setup_environment()
    
    # Check and install dependencies
    check_dependencies()
    
    print()
    
    # Run the application
    run_application()

if __name__ == "__main__":
    main()