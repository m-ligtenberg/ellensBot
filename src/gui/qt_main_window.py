"""
PyQt6 Main Window for CloneKing - Apple-style beautiful interface
"""
import sys
from typing import Optional, Dict, Any
from pathlib import Path

from PyQt6.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, 
    QLabel, QPushButton, QFrame, QScrollArea, QStackedWidget,
    QSplitter, QStatusBar, QApplication
)
from PyQt6.QtCore import Qt, QTimer, pyqtSignal
from PyQt6.QtGui import QFont, QPalette, QColor, QIcon

from ..core.persona import PersonaConfig
from ..utils.logger import logger
from .qt_chat_interface import ChatInterface

class AppleStyleWidget(QWidget):
    """Base widget with Apple-style appearance"""
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setup_apple_style()
    
    def setup_apple_style(self):
        """Apply Apple-like styling"""
        self.setStyleSheet("""
            QWidget {
                background-color: #FFFFFF;
                color: #1D1D1F;
                font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;
            }
        """)

class NavigationButton(QPushButton):
    """Apple-style navigation button"""
    
    def __init__(self, icon_text: str, title: str, parent=None):
        super().__init__(f"{icon_text} {title}", parent)
        self.title = title
        self.is_active = False
        self.setup_style()
    
    def setup_style(self):
        """Setup Apple-style button appearance"""
        self.setFixedHeight(38)
        self.setMinimumWidth(120)
        self.setFont(QFont("SF Pro Text", 14))
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.update_style()
    
    def set_active(self, active: bool):
        """Set button active state"""
        self.is_active = active
        self.update_style()
    
    def update_style(self):
        """Update button styling based on state"""
        if self.is_active:
            style = """
                QPushButton {
                    background-color: #007AFF;
                    color: #FFFFFF;
                    border: 1px solid #007AFF;
                    border-radius: 10px;
                    padding: 8px 16px;
                    font-weight: 600;
                }
                QPushButton:hover {
                    background-color: #0056CC;
                    border-color: #0056CC;
                }
            """
        else:
            style = """
                QPushButton {
                    background-color: #F8F9FA;
                    color: #1D1D1F;
                    border: 1px solid #E8EAED;
                    border-radius: 10px;
                    padding: 8px 16px;
                    font-weight: 500;
                }
                QPushButton:hover {
                    background-color: #F1F3F4;
                }
                QPushButton:pressed {
                    background-color: #E8EAED;
                }
            """
        self.setStyleSheet(style)

class Sidebar(QFrame):
    """Apple-style sidebar"""
    
    persona_selected = pyqtSignal(str)  # persona_id
    
    def __init__(self, app, parent=None):
        super().__init__(parent)
        self.app = app
        self.setup_ui()
        self.setup_style()
    
    def setup_ui(self):
        """Setup sidebar UI"""
        self.setFixedWidth(320)
        layout = QVBoxLayout(self)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(16)
        
        # Header
        header_frame = QFrame()
        header_frame.setStyleSheet("""
            QFrame {
                background-color: #FFFFFF;
                border: 1px solid #E8EAED;
                border-radius: 12px;
                padding: 24px;
            }
        """)
        header_layout = QVBoxLayout(header_frame)
        header_layout.setContentsMargins(24, 24, 24, 20)
        
        # Logo/Title
        title_label = QLabel("👑 CloneKing")
        title_label.setFont(QFont("SF Pro Display", 26, QFont.Weight.Bold))
        title_label.setStyleSheet("color: #1D1D1F; border: none; padding: 0;")
        title_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        
        subtitle_label = QLabel("AI Persona Platform")
        subtitle_label.setFont(QFont("SF Pro Text", 14))
        subtitle_label.setStyleSheet("color: #6E6E73; border: none; padding: 0; margin-top: 8px;")
        subtitle_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        
        header_layout.addWidget(title_label)
        header_layout.addWidget(subtitle_label)
        layout.addWidget(header_frame)
        
        # Persona Section
        personas_frame = QFrame()
        personas_frame.setStyleSheet("""
            QFrame {
                background-color: #FFFFFF;
                border: 1px solid #E8EAED;
                border-radius: 12px;
            }
        """)
        personas_layout = QVBoxLayout(personas_frame)
        personas_layout.setContentsMargins(20, 20, 20, 20)
        
        personas_title = QLabel("👤 Personas")
        personas_title.setFont(QFont("SF Pro Text", 16, QFont.Weight.Bold))
        personas_title.setStyleSheet("color: #1D1D1F; border: none; padding: 0 0 16px 0;")
        personas_layout.addWidget(personas_title)
        
        # Personas list (scrollable)
        personas_scroll = QScrollArea()
        personas_scroll.setWidgetResizable(True)
        personas_scroll.setStyleSheet("""
            QScrollArea {
                border: none;
                background-color: transparent;
            }
            QScrollBar:vertical {
                background-color: #F8F9FA;
                width: 8px;
                border-radius: 4px;
            }
            QScrollBar::handle:vertical {
                background-color: #C1C1C1;
                border-radius: 4px;
                min-height: 20px;
            }
            QScrollBar::handle:vertical:hover {
                background-color: #A1A1A1;
            }
        """)
        
        self.personas_widget = QWidget()
        self.personas_layout = QVBoxLayout(self.personas_widget)
        self.personas_layout.setContentsMargins(0, 0, 0, 0)
        self.personas_layout.setSpacing(8)
        personas_scroll.setWidget(self.personas_widget)
        personas_layout.addWidget(personas_scroll)
        
        layout.addWidget(personas_frame)
        
        # Quick Actions
        actions_frame = QFrame()
        actions_frame.setStyleSheet("""
            QFrame {
                background-color: #FFFFFF;
                border: 1px solid #E8EAED;
                border-radius: 12px;
            }
        """)
        actions_layout = QVBoxLayout(actions_frame)
        actions_layout.setContentsMargins(20, 20, 20, 20)
        
        create_btn = QPushButton("🎭 Create New Persona")
        create_btn.setFont(QFont("SF Pro Text", 14, QFont.Weight.Bold))
        create_btn.setFixedHeight(44)
        create_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        create_btn.setStyleSheet("""
            QPushButton {
                background-color: #007AFF;
                color: #FFFFFF;
                border: none;
                border-radius: 12px;
                font-weight: 600;
            }
            QPushButton:hover {
                background-color: #0056CC;
            }
            QPushButton:pressed {
                background-color: #0040A3;
            }
        """)
        actions_layout.addWidget(create_btn)
        layout.addWidget(actions_frame)
        
        # Stretch
        layout.addStretch()
        
        # Load personas
        self.refresh_personas()
    
    def setup_style(self):
        """Setup sidebar styling"""
        self.setStyleSheet("""
            QFrame {
                background-color: #FAFBFC;
                border: 1px solid #E8EAED;
                border-radius: 16px;
            }
        """)
    
    def refresh_personas(self):
        """Refresh the personas list"""
        # Clear existing personas
        while self.personas_layout.count():
            child = self.personas_layout.takeAt(0)
            if child.widget():
                child.widget().deleteLater()
        
        # Add personas
        personas = self.app.get_all_personas()
        current_persona = self.app.get_current_persona()
        
        for persona in personas:
            persona_btn = self.create_persona_button(persona, persona == current_persona)
            self.personas_layout.addWidget(persona_btn)
        
        # Add stretch
        self.personas_layout.addStretch()
    
    def create_persona_button(self, persona: PersonaConfig, is_current: bool) -> QPushButton:
        """Create a persona selection button"""
        btn = QPushButton(f"👤 {persona.name}")
        btn.setFont(QFont("SF Pro Text", 14, QFont.Weight.Bold if is_current else QFont.Weight.Normal))
        btn.setFixedHeight(44)
        btn.setCursor(Qt.CursorShape.PointingHandCursor)
        btn.clicked.connect(lambda: self.persona_selected.emit(persona.id))
        
        if is_current:
            style = """
                QPushButton {
                    background-color: #E3F2FD;
                    color: #007AFF;
                    border: 1px solid #007AFF;
                    border-radius: 10px;
                    text-align: left;
                    padding-left: 16px;
                    font-weight: 600;
                }
            """
        else:
            style = """
                QPushButton {
                    background-color: transparent;
                    color: #1D1D1F;
                    border: 1px solid transparent;
                    border-radius: 10px;
                    text-align: left;
                    padding-left: 16px;
                }
                QPushButton:hover {
                    background-color: #F1F3F4;
                    border-color: #E8EAED;
                }
            """
        
        btn.setStyleSheet(style)
        return btn

class ContentHeader(QFrame):
    """Apple-style content header"""
    
    view_changed = pyqtSignal(str)  # view_id
    
    def __init__(self, app, parent=None):
        super().__init__(parent)
        self.app = app
        self.current_view = "chat"
        self.nav_buttons = {}
        self.setup_ui()
    
    def setup_ui(self):
        """Setup header UI"""
        self.setFixedHeight(88)
        self.setStyleSheet("""
            QFrame {
                background-color: #F8F9FA;
                border: 1px solid #E8EAED;
                border-radius: 12px;
            }
        """)
        
        layout = QHBoxLayout(self)
        layout.setContentsMargins(24, 16, 24, 16)
        
        # Persona info
        persona_frame = QFrame()
        persona_frame.setStyleSheet("QFrame { background: transparent; border: none; }")
        persona_layout = QVBoxLayout(persona_frame)
        persona_layout.setContentsMargins(0, 0, 0, 0)
        persona_layout.setSpacing(4)
        
        self.persona_name_label = QLabel("No Persona Selected")
        self.persona_name_label.setFont(QFont("SF Pro Display", 22, QFont.Weight.Bold))
        self.persona_name_label.setStyleSheet("color: #1D1D1F; border: none;")
        
        self.persona_status_label = QLabel("")
        self.persona_status_label.setFont(QFont("SF Pro Text", 13))
        self.persona_status_label.setStyleSheet("color: #6E6E73; border: none;")
        
        persona_layout.addWidget(self.persona_name_label)
        persona_layout.addWidget(self.persona_status_label)
        layout.addWidget(persona_frame)
        
        # Spacer
        layout.addStretch()
        
        # Navigation buttons
        nav_frame = QFrame()
        nav_frame.setStyleSheet("QFrame { background: transparent; border: none; }")
        nav_layout = QHBoxLayout(nav_frame)
        nav_layout.setContentsMargins(0, 0, 0, 0)
        nav_layout.setSpacing(8)
        
        nav_options = [
            ("💬", "chat", "Chat"),
            ("🎯", "training", "Training"),
            ("🔍", "discovery", "Discovery"),
            ("📊", "analytics", "Analytics"),
            ("⚙️", "settings", "Settings")
        ]
        
        for icon, view_id, title in nav_options:
            btn = NavigationButton(icon, title)
            btn.clicked.connect(lambda checked, v=view_id: self.switch_view(v))
            self.nav_buttons[view_id] = btn
            nav_layout.addWidget(btn)
        
        layout.addWidget(nav_frame)
        
        # Set initial active button
        self.update_nav_buttons()
        
        # Update persona info
        self.update_persona_info()
    
    def switch_view(self, view_id: str):
        """Switch to a different view"""
        if view_id != self.current_view:
            self.current_view = view_id
            self.update_nav_buttons()
            self.view_changed.emit(view_id)
    
    def update_nav_buttons(self):
        """Update navigation button appearances"""
        for view_id, button in self.nav_buttons.items():
            button.set_active(view_id == self.current_view)
    
    def update_persona_info(self):
        """Update persona information display"""
        current_persona = self.app.get_current_persona()
        
        if current_persona:
            self.persona_name_label.setText(f"👤 {current_persona.name}")
            
            # Get persona statistics (async to avoid blocking)
            QTimer.singleShot(0, lambda: self.update_persona_status(current_persona.id))
        else:
            self.persona_name_label.setText("No Persona Selected")
            self.persona_status_label.setText("Create or select a persona to begin")
    
    def update_persona_status(self, persona_id: str):
        """Update persona status asynchronously"""
        try:
            stats = self.app.get_persona_statistics(persona_id)
            status_parts = []
            
            if stats.get("total_files", 0) > 0:
                status_parts.append(f"📁 {stats['total_files']} training files")
            
            if stats.get("discovered_content_count", 0) > 0:
                status_parts.append(f"🔍 {stats['discovered_content_count']} discovered items")
            
            if stats.get("training_status"):
                status_parts.append(f"🎯 Training: {stats['training_status']}")
            
            status_text = " • ".join(status_parts) if status_parts else "Ready"
            self.persona_status_label.setText(status_text)
            
        except Exception as e:
            logger.error(f"Error updating persona status: {e}")

class CloneKingMainWindow(QMainWindow):
    """Beautiful PyQt6 main window with Apple styling"""
    
    def __init__(self, app):
        super().__init__()
        self.app = app
        self.current_view = "chat"
        
        self.setup_window()
        self.setup_ui()
        self.setup_style()
        
        logger.info("PyQt6 CloneKing main window initialized")
    
    def setup_window(self):
        """Setup window properties"""
        self.setWindowTitle("CloneKing - AI Persona Cloning Platform v1.0")
        self.setMinimumSize(1200, 800)
        self.resize(1400, 900)
        
        # Center window
        screen = QApplication.primaryScreen()
        screen_geometry = screen.availableGeometry()
        window_geometry = self.frameGeometry()
        window_geometry.moveCenter(screen_geometry.center())
        self.move(window_geometry.topLeft())
    
    def setup_ui(self):
        """Setup the main UI layout"""
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        # Main layout
        main_layout = QHBoxLayout(central_widget)
        main_layout.setContentsMargins(20, 20, 20, 20)
        main_layout.setSpacing(8)
        
        # Sidebar
        self.sidebar = Sidebar(self.app)
        self.sidebar.persona_selected.connect(self.on_persona_selected)
        main_layout.addWidget(self.sidebar)
        
        # Main content area
        content_frame = QFrame()
        content_frame.setStyleSheet("""
            QFrame {
                background-color: #FFFFFF;
                border: 1px solid #E8EAED;
                border-radius: 16px;
            }
        """)
        content_layout = QVBoxLayout(content_frame)
        content_layout.setContentsMargins(20, 20, 20, 20)
        content_layout.setSpacing(16)
        
        # Content header
        self.content_header = ContentHeader(self.app)
        self.content_header.view_changed.connect(self.switch_view)
        content_layout.addWidget(self.content_header)
        
        # Content area
        self.content_stack = QStackedWidget()
        self.content_stack.setStyleSheet("""
            QStackedWidget {
                background-color: #FFFFFF;
                border: 1px solid #E8EAED;
                border-radius: 12px;
            }
        """)
        content_layout.addWidget(self.content_stack)
        
        main_layout.addWidget(content_frame, 1)  # Give content area more space
        
        # Status bar
        self.setup_status_bar()
        
        # Initialize views
        self.setup_views()
    
    def setup_views(self):
        """Setup different content views"""
        # Chat view - Use the beautiful chat interface
        self.chat_interface = ChatInterface(self.app)
        self.content_stack.addWidget(self.chat_interface)
        
        # Training view
        training_widget = QLabel("🎯 Training Dashboard\n\nUpload files to train your AI persona\nwith voice, video, text, and images.")
        training_widget.setAlignment(Qt.AlignmentFlag.AlignCenter)
        training_widget.setFont(QFont("SF Pro Text", 16))
        training_widget.setStyleSheet("""
            QLabel {
                color: #6E6E73;
                background-color: transparent;
                border: none;
                padding: 40px;
            }
        """)
        self.content_stack.addWidget(training_widget)
        
        # Discovery view
        discovery_widget = QLabel("🔍 Content Discovery\n\nDiscover and manage content sources\nfor your AI persona training.")
        discovery_widget.setAlignment(Qt.AlignmentFlag.AlignCenter)
        discovery_widget.setFont(QFont("SF Pro Text", 16))
        discovery_widget.setStyleSheet("""
            QLabel {
                color: #6E6E73;
                background-color: transparent;
                border: none;
                padding: 40px;
            }
        """)
        self.content_stack.addWidget(discovery_widget)
        
        # Analytics view
        analytics_widget = QLabel("📊 Analytics Dashboard\n\nView detailed analytics and insights\nabout your AI persona performance.")
        analytics_widget.setAlignment(Qt.AlignmentFlag.AlignCenter)
        analytics_widget.setFont(QFont("SF Pro Text", 16))
        analytics_widget.setStyleSheet("""
            QLabel {
                color: #6E6E73;
                background-color: transparent;
                border: none;
                padding: 40px;
            }
        """)
        self.content_stack.addWidget(analytics_widget)
        
        # Settings view
        settings_widget = QLabel("⚙️ Application Settings\n\nConfigure your CloneKing experience\nand manage application preferences.")
        settings_widget.setAlignment(Qt.AlignmentFlag.AlignCenter)
        settings_widget.setFont(QFont("SF Pro Text", 16))
        settings_widget.setStyleSheet("""
            QLabel {
                color: #6E6E73;
                background-color: transparent;
                border: none;
                padding: 40px;
            }
        """)
        self.content_stack.addWidget(settings_widget)
    
    def setup_status_bar(self):
        """Setup the status bar"""
        status_bar = QStatusBar()
        status_bar.setStyleSheet("""
            QStatusBar {
                background-color: #F8F9FA;
                border: 1px solid #E8EAED;
                border-radius: 12px;
                color: #1D1D1F;
                font-family: 'SF Pro Text';
                font-size: 13px;
                padding: 8px 16px;
            }
        """)
        
        status_bar.showMessage("Ready")
        
        # Connection status
        connection_label = QLabel("🟢 Connected")
        connection_label.setStyleSheet("color: #6E6E73; border: none; padding: 0px 16px;")
        status_bar.addPermanentWidget(connection_label)
        
        self.setStatusBar(status_bar)
    
    def setup_style(self):
        """Setup global window styling"""
        self.setStyleSheet("""
            QMainWindow {
                background-color: #FFFFFF;
            }
        """)
    
    def switch_view(self, view_id: str):
        """Switch to a different view"""
        view_mapping = {
            "chat": 0,
            "training": 1,
            "discovery": 2,
            "analytics": 3,
            "settings": 4
        }
        
        if view_id in view_mapping:
            self.content_stack.setCurrentIndex(view_mapping[view_id])
            self.current_view = view_id
            logger.info(f"Switched to view: {view_id}")
    
    def on_persona_selected(self, persona_id: str):
        """Handle persona selection"""
        try:
            if self.app.switch_persona(persona_id):
                self.content_header.update_persona_info()
                self.sidebar.refresh_personas()
                
                # Switch to chat view
                self.content_header.switch_view("chat")
                
        except Exception as e:
            logger.error(f"Error selecting persona: {e}")
    
    def closeEvent(self, event):
        """Handle window close event"""
        try:
            logger.info("PyQt6 CloneKing window closing")
            self.app.shutdown()
            event.accept()
        except Exception as e:
            logger.error(f"Error during window closing: {e}")
            event.accept()