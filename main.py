#!/usr/bin/env python3
"""
Young Ellens Desktop Application
A modern AI chatbot desktop application built with CustomTkinter
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.app import YoungEllensApp

if __name__ == "__main__":
    app = YoungEllensApp()
    app.run()