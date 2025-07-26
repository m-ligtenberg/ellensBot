#!/usr/bin/env python3
"""
CloneKing - AI Persona Cloning Platform

Transform the Young Ellens application into CloneKing - a comprehensive platform 
for creating, training, and managing AI personas with multimodal capabilities.

Features:
- Create and manage AI personas with unique personalities
- Multimodal training with voice, video, text, and image data
- Intelligent content discovery and source recommendations
- Real-time voice synthesis and conversation capabilities
- Advanced ML-powered persona analytics
"""

import sys
import os
import argparse
from pathlib import Path
from typing import Optional

# Ensure we're using the correct Python version
if sys.version_info < (3, 8):
    print("❌ CloneKing requires Python 3.8 or higher")
    print(f"Current version: {sys.version}")
    sys.exit(1)

# Add src directory to path
src_path = Path(__file__).parent / "src"
sys.path.insert(0, str(src_path))

def check_dependencies():
    """Check if required dependencies are installed"""
    # Map package names to their import names
    required_packages = {
        'customtkinter': 'customtkinter',
        'pillow': 'PIL',
        'requests': 'requests',
        'openai': 'openai',
        'scikit-learn': 'sklearn',
        'numpy': 'numpy',
        'pandas': 'pandas',
        'nltk': 'nltk',
        'textblob': 'textblob'
    }
    
    missing_packages = []
    for package_name, import_name in required_packages.items():
        try:
            __import__(import_name)
        except ImportError:
            missing_packages.append(package_name)
    
    if missing_packages:
        print("❌ Missing required dependencies:")
        for package in missing_packages:
            print(f"   - {package}")
        print("\n💡 Install missing packages with:")
        print("   pip install -r requirements.txt")
        return False
    
    return True

def setup_application_directories():
    """Create necessary application directories"""
    app_dir = Path.home() / ".cloneking"
    directories = [
        app_dir,
        app_dir / "personas",
        app_dir / "training",
        app_dir / "discovery",
        app_dir / "ml_discovery",
        app_dir / "voice_models",
        app_dir / "logs"
    ]
    
    for directory in directories:
        directory.mkdir(parents=True, exist_ok=True)
    
    return app_dir

def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(
        description="CloneKing - AI Persona Cloning Platform",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python cloneking_main.py                    # Start normal GUI application
  python cloneking_main.py --debug            # Start with debug logging
  python cloneking_main.py --reset-config     # Reset configuration to defaults
  python cloneking_main.py --version          # Show version information
        """
    )
    
    parser.add_argument(
        '--debug',
        action='store_true',
        help='Enable debug logging'
    )
    
    parser.add_argument(
        '--reset-config',
        action='store_true',
        help='Reset configuration to defaults'
    )
    
    parser.add_argument(
        '--version',
        action='store_true',
        help='Show version information'
    )
    
    parser.add_argument(
        '--headless',
        action='store_true',
        help='Run without GUI (for testing/automation)'
    )
    
    return parser.parse_args()

def show_version():
    """Show version and system information"""
    print("🤖 CloneKing - AI Persona Cloning Platform")
    print("=" * 50)
    print(f"Version: 1.0.0")
    print(f"Python: {sys.version}")
    print(f"Platform: {sys.platform}")
    print(f"Architecture: {os.uname().machine if hasattr(os, 'uname') else 'Unknown'}")
    
    # Check GPU availability
    try:
        import torch
        if torch.cuda.is_available():
            print(f"CUDA: Available ({torch.cuda.get_device_name(0)})")
        else:
            print("CUDA: Not available")
    except ImportError:
        print("CUDA: PyTorch not installed")

def main():
    """Main entry point for CloneKing application"""
    args = parse_arguments()
    
    # Show version and exit if requested
    if args.version:
        show_version()
        return
    
    # Import logger after setting up directories
    app_dir = setup_application_directories()
    
    try:
        from src.utils.logger import logger
        from src.utils.config import config
        from src.cloneking_app import CloneKingApp
        
        # Configure logging level
        if args.debug:
            import logging
            logger.setLevel(logging.DEBUG)
            logger.debug("Debug logging enabled")
        
        # Reset configuration if requested
        if args.reset_config:
            logger.info("Resetting configuration to defaults...")
            config.reset_to_defaults()
            config.save()
            logger.info("Configuration reset complete")
            return
        
        # Check dependencies
        if not check_dependencies():
            return
        
        # Start application
        logger.info("=" * 60)
        logger.info("🤖 Starting CloneKing - AI Persona Cloning Platform")
        logger.info("=" * 60)
        logger.info(f"Application directory: {app_dir}")
        logger.info(f"Python version: {sys.version}")
        
        # Create and run the application
        if args.headless:
            logger.info("Running in headless mode")
            # TODO: Implement headless mode for automation/testing
            print("❌ Headless mode not yet implemented")
            return
        else:
            app = CloneKingApp()
            app.run()
        
    except KeyboardInterrupt:
        logger.info("Application interrupted by user")
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("💡 Make sure all dependencies are installed: pip install -r requirements.txt")
    except Exception as e:
        if 'logger' in locals():
            logger.error(f"Fatal error: {e}")
        else:
            print(f"❌ Fatal error: {e}")
        
        # Show stack trace in debug mode
        if args.debug:
            import traceback
            traceback.print_exc()
        
        sys.exit(1)
    finally:
        if 'logger' in locals():
            logger.info("CloneKing application ended")

if __name__ == "__main__":
    main()