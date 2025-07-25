#!/usr/bin/env python3
"""
Build script for Young Ellens Desktop Application
Creates executable packages for different platforms
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

def run_command(command, description=""):
    """Run a command and handle errors"""
    print(f"🔧 {description}")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        if result.stdout:
            print(f"✅ {result.stdout.strip()}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error: {e}")
        if e.stderr:
            print(f"   {e.stderr.strip()}")
        return False

def install_dependencies():
    """Install required dependencies"""
    print("📦 Installing dependencies...")
    
    dependencies = [
        "pip install --upgrade pip",
        "pip install -r requirements.txt",
        "pip install pyinstaller>=5.13.0"
    ]
    
    for dep in dependencies:
        if not run_command(dep, f"Installing {dep.split()[-1]}"):
            return False
    return True

def build_executable():
    """Build executable with PyInstaller"""
    print("🏗️ Building executable...")
    
    # PyInstaller command
    command = [
        "pyinstaller",
        "--onefile",
        "--windowed",
        "--name=YoungEllens",
        "--add-data=src:src",
        "--icon=assets/icon.ico" if os.path.exists("assets/icon.ico") else "",
        "--distpath=dist",
        "--workpath=build",
        "--specpath=build",
        "main.py"
    ]
    
    # Remove empty icon parameter if no icon exists
    command = [arg for arg in command if arg]
    
    command_str = " ".join(command)
    return run_command(command_str, "Creating executable")

def create_installer():
    """Create installer package (platform specific)"""
    print("📦 Creating installer...")
    
    if sys.platform == "win32":
        # Windows: Create NSIS installer (if available)
        if shutil.which("makensis"):
            return run_command("makensis installer.nsi", "Creating Windows installer")
        else:
            print("⚠️ NSIS not found, skipping installer creation")
    
    elif sys.platform == "darwin":
        # macOS: Create DMG (if available)
        if shutil.which("create-dmg"):
            return run_command(
                'create-dmg --volname "Young Ellens" --window-pos 200 120 --window-size 600 300 --icon-size 100 --app-drop-link 425 120 "dist/YoungEllens.dmg" "dist/"',
                "Creating macOS DMG"
            )
        else:
            print("⚠️ create-dmg not found, skipping DMG creation")
    
    elif sys.platform.startswith("linux"):
        # Linux: Create AppImage (if available)
        if shutil.which("appimagetool"):
            return run_command("appimagetool dist/ dist/YoungEllens.AppImage", "Creating Linux AppImage")
        else:
            print("⚠️ appimagetool not found, skipping AppImage creation")
    
    return True

def clean_build():
    """Clean build directories"""
    print("🧹 Cleaning build directories...")
    
    dirs_to_clean = ["build", "dist", "__pycache__"]
    for dir_name in dirs_to_clean:
        if os.path.exists(dir_name):
            shutil.rmtree(dir_name)
            print(f"   Removed {dir_name}/")

def main():
    """Main build process"""
    print("🚀 Young Ellens Desktop Build Script")
    print("====================================")
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        sys.exit(1)
    
    # Clean previous builds
    clean_build()
    
    # Install dependencies
    if not install_dependencies():
        print("❌ Failed to install dependencies")
        sys.exit(1)
    
    # Build executable
    if not build_executable():
        print("❌ Failed to build executable")
        sys.exit(1)
    
    # Create installer
    create_installer()
    
    # Show results
    print("\n🎉 Build completed successfully!")
    print("📁 Output files:")
    
    if os.path.exists("dist"):
        for file in os.listdir("dist"):
            file_path = os.path.join("dist", file)
            size = os.path.getsize(file_path) / (1024 * 1024)  # MB
            print(f"   📦 {file} ({size:.1f} MB)")
    
    print("\n✅ Young Ellens Desktop is ready for distribution!")

if __name__ == "__main__":
    main()