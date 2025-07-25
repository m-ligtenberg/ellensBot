# Installation Guide - Young Ellens Desktop Application

## Quick Start 🚀

### Option 1: Virtual Environment (Recommended)

```bash
# Clone/navigate to the repository
cd young-ellens-desktop
git checkout python-desktop-app

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # Linux/macOS
# or
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Test the application
python test_app.py

# Run the application
python main.py
# or
python run.py
```

### Option 2: System Installation

```bash
# Install system dependencies (Ubuntu/Debian)
sudo apt update
sudo apt install python3 python3-pip python3-tk python3-venv

# Install Python packages
pip3 install --user -r requirements.txt

# Run the application
python3 run.py
```

## Platform-Specific Instructions

### 🐧 Linux

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install python3 python3-pip python3-tk python3-venv
```

**Fedora/RHEL:**
```bash
sudo dnf install python3 python3-pip python3-tkinter python3-virtualenv
```

**Arch Linux:**
```bash
sudo pacman -S python python-pip tk
```

### 🍎 macOS

**Using Homebrew:**
```bash
brew install python3 python-tk
```

**Using MacPorts:**
```bash
sudo port install python39 +tkinter
```

### 🪟 Windows

1. Download Python from [python.org](https://python.org)
2. Make sure to check "Add Python to PATH" during installation
3. Make sure "tcl/tk and IDLE" is selected during installation

## Dependencies

### Required Python Packages

- `customtkinter>=5.2.0` - Modern GUI framework
- `pillow>=10.0.0` - Image processing
- `requests>=2.31.0` - HTTP requests
- `typing-extensions>=4.8.0` - Type hints

### System Requirements

- **Python**: 3.8 or higher
- **Operating System**: Windows 10+, macOS 10.14+, Linux with GUI
- **Memory**: 512MB RAM (1GB+ recommended)
- **Storage**: 100MB free space
- **Display**: 800x600 minimum (1200x800+ recommended)

## Troubleshooting

### Common Issues

**"No module named 'tkinter'"**
```bash
# Ubuntu/Debian
sudo apt install python3-tk

# Fedora/RHEL
sudo dnf install python3-tkinter

# macOS (Homebrew)
brew install python-tk
```

**"externally-managed-environment" error**
```bash
# Use virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Permission denied errors**
```bash
# Use user installation
pip3 install --user -r requirements.txt
```

**Application won't start**
```bash
# Run tests first
python test_app.py

# Check Python version
python3 --version

# Verify all dependencies
python3 -c "import customtkinter; print('CustomTkinter OK')"
```

### Platform-Specific Issues

**Linux: "cannot connect to X server"**
```bash
# Make sure you're in a GUI environment
echo $DISPLAY

# If using SSH, enable X11 forwarding
ssh -X username@hostname
```

**macOS: "Python is not installed as a framework"**
```bash
# Install Python from python.org instead of Homebrew
# Or use pythonw instead of python
pythonw main.py
```

**Windows: "Python was not found"**
```bash
# Add Python to PATH or use full path
C:\Users\YourName\AppData\Local\Programs\Python\Python39\python.exe main.py
```

## Building Executable

### Using PyInstaller

```bash
# Install PyInstaller
pip install pyinstaller

# Build executable
python build.py

# Output will be in dist/ directory
```

### Manual Build

```bash
# Install PyInstaller
pip install pyinstaller

# Create executable
pyinstaller --onefile --windowed --name=YoungEllens main.py

# Add icon (if available)
pyinstaller --onefile --windowed --icon=assets/icon.ico --name=YoungEllens main.py
```

## Configuration

The application creates configuration files in:

- **Linux/macOS**: `~/.youngellens/`
- **Windows**: `%USERPROFILE%\.youngellens\`

### Configuration Files

- `config.json` - Application settings
- `young_ellens.db` - Chat database (SQLite)

### Logs

Application logs are stored in:
- `logs/youngellens_YYYYMMDD.log`

## Uninstalling

```bash
# Remove application files
rm -rf ~/.youngellens/

# Remove logs
rm -rf logs/

# Uninstall Python packages (if installed globally)
pip uninstall customtkinter pillow requests typing-extensions

# Remove virtual environment
rm -rf venv/
```

## Development Setup

```bash
# Clone repository
git clone <repository-url>
cd young-ellens-desktop
git checkout python-desktop-app

# Create development environment
python3 -m venv dev-venv
source dev-venv/bin/activate

# Install development dependencies
pip install -r requirements.txt
pip install pytest black flake8

# Run tests
python test_app.py

# Run application in development mode
python run.py
```

## Support

If you encounter issues:

1. Check this installation guide
2. Run `python test_app.py` to diagnose problems
3. Check the logs in `logs/` directory
4. Open an issue on GitHub with:
   - Your operating system and version
   - Python version (`python3 --version`)
   - Error messages
   - Contents of the log files

---

**Made with ❤️ for the Young Ellens community**