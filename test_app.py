#!/usr/bin/env python3
"""
Test script for Young Ellens Desktop Application
"""

import sys
import os
from pathlib import Path

# Add current directory to Python path
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

def test_imports():
    """Test all critical imports"""
    print("🧪 Testing imports...")
    
    try:
        import customtkinter as ctk
        print("✅ CustomTkinter imported successfully")
    except ImportError as e:
        print(f"❌ CustomTkinter import failed: {e}")
        return False
    
    try:
        from src.app import YoungEllensApp
        print("✅ YoungEllensApp imported successfully")
    except ImportError as e:
        print(f"❌ YoungEllensApp import failed: {e}")
        return False
    
    try:
        from src.database.db_manager import DatabaseManager
        print("✅ DatabaseManager imported successfully")
    except ImportError as e:
        print(f"❌ DatabaseManager import failed: {e}")
        return False
    
    try:
        from src.ai.chatbot import Chatbot
        print("✅ Chatbot imported successfully")
    except ImportError as e:
        print(f"❌ Chatbot import failed: {e}")
        return False
    
    try:
        from src.utils.logger import logger
        from src.utils.config import config
        print("✅ Logger and Config imported successfully")
    except ImportError as e:
        print(f"❌ Utils import failed: {e}")
        return False
    
    return True

def test_database():
    """Test database functionality"""
    print("\n💾 Testing database...")
    
    try:
        from src.database.db_manager import DatabaseManager
        
        # Create test database
        db = DatabaseManager("test_database.db")
        
        # Test saving a message
        result = db.save_message("Test message", "user", "test_session")
        if result:
            print("✅ Database save test passed")
        else:
            print("❌ Database save test failed")
            return False
        
        # Test retrieving messages
        messages = db.get_messages("test_session")
        if messages and len(messages) > 0:
            print("✅ Database retrieval test passed")
        else:
            print("❌ Database retrieval test failed")
            return False
        
        # Cleanup
        db.close()
        
        # Remove test database
        test_db_path = Path.home() / ".youngellens" / "test_database.db"
        if test_db_path.exists():
            test_db_path.unlink()
        
        return True
        
    except Exception as e:
        print(f"❌ Database test failed: {e}")
        return False

def test_chatbot():
    """Test chatbot functionality"""
    print("\n🤖 Testing chatbot...")
    
    try:
        from src.ai.chatbot import Chatbot
        
        chatbot = Chatbot()
        
        # Test greeting
        greeting = chatbot.get_greeting()
        if greeting and len(greeting) > 0:
            print("✅ Chatbot greeting test passed")
        else:
            print("❌ Chatbot greeting test failed")
            return False
        
        # Test response generation (without delay)
        import time
        response_received = [False]
        
        def callback(response):
            response_received[0] = True
            print(f"   Response: {response}")
        
        chatbot.generate_response("Hello", callback)
        
        # Wait briefly for response
        time.sleep(3)
        
        if response_received[0]:
            print("✅ Chatbot response test passed")
        else:
            print("❌ Chatbot response test failed")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Chatbot test failed: {e}")
        return False

def test_config():
    """Test configuration system"""
    print("\n⚙️ Testing configuration...")
    
    try:
        from src.utils.config import config
        
        # Test getting default value
        theme = config.get("appearance.theme", "dark")
        if theme:
            print("✅ Config get test passed")
        else:
            print("❌ Config get test failed")
            return False
        
        # Test setting value
        config.set("test.value", "test_data")
        retrieved = config.get("test.value")
        
        if retrieved == "test_data":
            print("✅ Config set/get test passed")
        else:
            print("❌ Config set/get test failed")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Config test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🎤 Young Ellens Desktop Application - Component Tests")
    print("=" * 55)
    
    all_passed = True
    
    # Test imports
    if not test_imports():
        all_passed = False
    
    # Test database
    if not test_database():
        all_passed = False
    
    # Test chatbot
    if not test_chatbot():
        all_passed = False
    
    # Test config
    if not test_config():
        all_passed = False
    
    print("\n" + "=" * 55)
    if all_passed:
        print("🎉 All tests passed! The application is ready to run.")
        print("\n💡 To start the application:")
        print("   source venv/bin/activate && python main.py")
        print("   or")
        print("   source venv/bin/activate && python run.py")
    else:
        print("❌ Some tests failed. Please check the errors above.")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())