# Young Ellens Desktop Application 🎤

A modern, cross-platform AI chatbot desktop application built with Python and CustomTkinter. Chat with Young Ellens, an AI assistant with a unique Amsterdam street personality.

![Young Ellens Desktop](https://img.shields.io/badge/Version-2.0.0-blue)
![Python](https://img.shields.io/badge/Python-3.8+-green)
![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)

## Features ✨

- **Modern UI**: Clean, dark-themed interface built with CustomTkinter
- **Real-time Chat**: Instant messaging with typing indicators
- **Persistent Storage**: SQLite database stores all conversations
- **Export Functionality**: Save chats as JSON files
- **Cross-platform**: Runs on Windows, macOS, and Linux
- **Lightweight**: Minimal dependencies, fast startup
- **Young Ellens Personality**: Authentic Amsterdam street slang and responses

## Screenshots 📸

```
┌─────────────────────────────────────────────────────────┐
│ 🎤 Young Ellens                    🗨️ New Chat          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  👋 Welcome to Young Ellens                            │
│     Your AI assistant is ready to chat.                │
│     Send a message to get started!                     │
│                                                         │
│  You: Hey what's up?                               15:30│
│                                                         │
│  🎤 Young Ellens                                        │
│      Yo! B-Negar, what's good? 🔥                15:30 │
│                                                         │
│ ┌─────────────────────────────────────────────┐ [Send] │
│ │ Type your message...                        │         │
│ └─────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────┘
```

## Quick Start 🚀

### Option 1: Run from Source (Recommended for Development)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd young-ellens-desktop
   git checkout python-desktop-app
   ```

2. **Install Python 3.8 or higher**
   - Windows: Download from [python.org](https://python.org)
   - macOS: `brew install python3` or download from python.org
   - Linux: `sudo apt install python3 python3-pip` (Ubuntu/Debian)

3. **Run the application**
   ```bash
   python run.py
   ```
   
   The script will automatically install dependencies and start the app.

### Option 2: Install Dependencies Manually

```bash
# Install dependencies
pip install -r requirements.txt

# Run the application
python main.py
```

### Option 3: Build Executable

```bash
# Build executable for your platform
python build.py

# Run the built executable
./dist/YoungEllens  # Linux/macOS
./dist/YoungEllens.exe  # Windows
```

## Requirements 📋

- **Python**: 3.8 or higher
- **Operating System**: Windows 10+, macOS 10.14+, or Linux with GUI support
- **Memory**: 512MB RAM (recommended: 1GB+)
- **Storage**: 100MB free space
- **Display**: 800x600 minimum resolution (recommended: 1200x800+)

## Dependencies 📦

- `customtkinter>=5.2.0` - Modern Tkinter-based GUI framework
- `pillow>=10.0.0` - Image processing library
- `requests>=2.31.0` - HTTP library for future API integrations
- `sqlite3` - Database (included with Python)
- `typing-extensions>=4.8.0` - Type hints for older Python versions

## Usage Guide 💬

### Basic Chat
1. Launch the application
2. Type your message in the input field at the bottom
3. Press Enter or click "Send"
4. Young Ellens will respond with his unique personality

### Features
- **New Chat**: Start a fresh conversation
- **Export Chat**: Save your conversation as a JSON file
- **Clear Chat**: Delete current conversation (cannot be undone)
- **Auto-save**: All messages are automatically saved to local database

### Young Ellens Personality
Young Ellens responds with authentic Amsterdam street personality:
- Uses Dutch slang and English mix
- Signature phrases: "B-Negar", "OWO", "B, B, Pa"
- Denies drug involvement: "alleen me wietje en me henny"
- Represents Amsterdam (020) culture

## Development 🛠️

### Project Structure
```
young-ellens-desktop/
├── src/
│   ├── app.py              # Main application class
│   ├── gui/                # GUI components
│   │   ├── main_window.py  # Main window layout
│   │   ├── chat_interface.py # Chat UI components
│   │   └── sidebar.py      # Sidebar with controls
│   ├── database/           # Database management
│   │   └── db_manager.py   # SQLite operations
│   └── ai/                 # AI chatbot logic
│       └── chatbot.py      # Response generation
├── main.py                 # Application entry point
├── run.py                  # Development runner
├── build.py                # Build script for executables
├── requirements.txt        # Python dependencies
└── README.md              # This file
```

### Adding Features
1. **New UI Components**: Add to `src/gui/`
2. **Database Changes**: Modify `src/database/db_manager.py`
3. **AI Responses**: Update `src/ai/chatbot.py`
4. **Main Logic**: Edit `src/app.py` or `src/gui/main_window.py`

### Building for Distribution
```bash
# Install build dependencies
pip install pyinstaller

# Create executable
python build.py

# Output will be in dist/ directory
```

## Troubleshooting 🔧

### Common Issues

**App won't start**
```bash
# Check Python version
python --version

# Reinstall dependencies
pip install --upgrade -r requirements.txt

# Run with verbose output
python -v main.py
```

**"Module not found" errors**
```bash
# Ensure you're in the correct directory
pwd

# Install missing packages
pip install customtkinter pillow requests
```

**Database errors**
- Delete `young_ellens.db` file to reset database
- Check file permissions in the application directory

**UI appears broken**
- Update CustomTkinter: `pip install --upgrade customtkinter`
- Check display scaling settings
- Try running on different monitor if using multiple displays

### Platform-Specific Notes

**Windows**
- May need to allow app through Windows Defender
- Ensure Python is added to PATH during installation

**macOS**
- May need to allow app in System Preferences > Security & Privacy
- Use `python3` instead of `python` if needed

**Linux**
- Install `python3-tk`: `sudo apt install python3-tk`
- May need additional packages: `sudo apt install python3-dev python3-setuptools`

## Contributing 🤝

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog 📝

### Version 2.0.0 (Current)
- ✨ Complete rewrite in Python with CustomTkinter
- 🎨 Modern dark theme UI
- 💾 SQLite database integration
- 📤 Chat export functionality
- 🚀 Cross-platform executable building
- 🎤 Enhanced Young Ellens personality

### Version 1.0.0 (Previous - Electron)
- Initial Electron-based application
- Basic chat functionality
- Web technologies (HTML/CSS/JS)

## Support 💬

- **Issues**: Open an issue on GitHub
- **Questions**: Check the troubleshooting section above
- **Feature Requests**: Open a feature request on GitHub

---

**Made with ❤️ by the Young Ellens Desktop Team**

*Keep it real, keep it 020! 🎤🔥*