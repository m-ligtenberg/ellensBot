"""
PyQt6 Chat Interface for CloneKing - Apple-style beautiful chat
"""
from typing import List, Dict, Any
from datetime import datetime

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QTextEdit, QLineEdit, 
    QPushButton, QScrollArea, QFrame, QLabel, QSizePolicy
)
from PyQt6.QtCore import Qt, QTimer, pyqtSignal, QThread, pyqtSlot
from PyQt6.QtGui import QFont, QTextCursor

from ..ai.chatbot import Chatbot
from ..utils.logger import logger

class MessageBubble(QFrame):
    """Apple-style message bubble"""
    
    def __init__(self, message: str, sender: str, timestamp: str, parent=None):
        super().__init__(parent)
        self.message = message
        self.sender = sender
        self.timestamp = timestamp
        self.setup_ui()
    
    def setup_ui(self):
        """Setup message bubble UI"""
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(4)
        
        # Message container
        container = QFrame()
        container_layout = QHBoxLayout(container)
        container_layout.setContentsMargins(0, 0, 0, 0)
        
        if self.sender == "user":
            # User message (right-aligned, blue)
            container_layout.addStretch()
            
            bubble = QFrame()
            bubble.setMaximumWidth(400)
            bubble.setStyleSheet("""
                QFrame {
                    background-color: #007AFF;
                    border-radius: 18px;
                    padding: 12px 16px;
                    margin: 2px;
                }
            """)
            
            bubble_layout = QVBoxLayout(bubble)
            bubble_layout.setContentsMargins(16, 12, 16, 12)
            
            message_label = QLabel(self.message)
            message_label.setWordWrap(True)
            message_label.setFont(QFont("SF Pro Text", 14))
            message_label.setStyleSheet("""
                QLabel {
                    color: #FFFFFF;
                    background-color: transparent;
                    border: none;
                    padding: 0px;
                }
            """)
            bubble_layout.addWidget(message_label)
            
            container_layout.addWidget(bubble)
            
        else:
            # AI message (left-aligned, gray)
            bubble = QFrame()
            bubble.setMaximumWidth(400)
            bubble.setStyleSheet("""
                QFrame {
                    background-color: #F1F3F4;
                    border-radius: 18px;
                    padding: 12px 16px;
                    margin: 2px;
                }
            """)
            
            bubble_layout = QVBoxLayout(bubble)
            bubble_layout.setContentsMargins(16, 12, 16, 12)
            
            message_label = QLabel(self.message)
            message_label.setWordWrap(True)
            message_label.setFont(QFont("SF Pro Text", 14))
            message_label.setStyleSheet("""
                QLabel {
                    color: #1D1D1F;
                    background-color: transparent;
                    border: none;
                    padding: 0px;
                }
            """)
            bubble_layout.addWidget(message_label)
            
            container_layout.addWidget(bubble)
            container_layout.addStretch()
        
        # Timestamp
        timestamp_label = QLabel(self.timestamp)
        timestamp_label.setFont(QFont("SF Pro Text", 11))
        timestamp_label.setStyleSheet("""
            QLabel {
                color: #6E6E73;
                background-color: transparent;
                border: none;
                padding: 4px 20px 0px 20px;
            }
        """)
        
        if self.sender == "user":
            timestamp_label.setAlignment(Qt.AlignmentFlag.AlignRight)
        else:
            timestamp_label.setAlignment(Qt.AlignmentFlag.AlignLeft)
        
        layout.addWidget(container)
        layout.addWidget(timestamp_label)

class TypingIndicator(QFrame):
    """Apple-style typing indicator"""
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setup_ui()
        self.setup_animation()
    
    def setup_ui(self):
        """Setup typing indicator UI"""
        layout = QHBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        
        # Bubble
        bubble = QFrame()
        bubble.setMaximumWidth(80)
        bubble.setFixedHeight(40)
        bubble.setStyleSheet("""
            QFrame {
                background-color: #F1F3F4;
                border-radius: 18px;
                padding: 12px 16px;
                margin: 2px;
            }
        """)
        
        bubble_layout = QHBoxLayout(bubble)
        bubble_layout.setContentsMargins(16, 12, 16, 12)
        bubble_layout.setSpacing(4)
        
        # Typing dots
        self.dots = []
        for i in range(3):
            dot = QLabel("●")
            dot.setFont(QFont("SF Pro Text", 16))
            dot.setStyleSheet("""
                QLabel {
                    color: #6E6E73;
                    background-color: transparent;
                    border: none;
                    padding: 0px;
                }
            """)
            dot.setAlignment(Qt.AlignmentFlag.AlignCenter)
            self.dots.append(dot)
            bubble_layout.addWidget(dot)
        
        layout.addWidget(bubble)
        layout.addStretch()
    
    def setup_animation(self):
        """Setup typing animation"""
        self.animation_timer = QTimer()
        self.animation_timer.timeout.connect(self.animate_dots)
        self.animation_step = 0
    
    def start_animation(self):
        """Start typing animation"""
        self.animation_timer.start(500)  # 500ms interval
    
    def stop_animation(self):
        """Stop typing animation"""
        self.animation_timer.stop()
        # Reset all dots
        for dot in self.dots:
            dot.setStyleSheet("""
                QLabel {
                    color: #6E6E73;
                    background-color: transparent;
                    border: none;
                    padding: 0px;
                }
            """)
    
    def animate_dots(self):
        """Animate typing dots"""
        # Reset all dots
        for dot in self.dots:
            dot.setStyleSheet("""
                QLabel {
                    color: #6E6E73;
                    background-color: transparent;
                    border: none;
                    padding: 0px;
                }
            """)
        
        # Highlight current dot
        if self.animation_step < len(self.dots):
            self.dots[self.animation_step].setStyleSheet("""
                QLabel {
                    color: #1D1D1F;
                    background-color: transparent;
                    border: none;
                    padding: 0px;
                }
            """)
        
        self.animation_step = (self.animation_step + 1) % (len(self.dots) + 1)

class ChatInterface(QWidget):
    """Beautiful PyQt6 chat interface with Apple styling"""
    
    def __init__(self, app, parent=None):
        super().__init__(parent)
        self.app = app
        self.messages: List[Dict[str, Any]] = []
        self.typing_indicator = None
        self.setup_ui()
    
    def setup_ui(self):
        """Setup chat interface UI"""
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(16)
        
        # Header
        self.create_header(layout)
        
        # Messages area
        self.create_messages_area(layout)
        
        # Input area
        self.create_input_area(layout)
    
    def create_header(self, parent_layout):
        """Create chat header"""
        header = QFrame()
        header.setFixedHeight(88)
        header.setStyleSheet("""
            QFrame {
                background-color: #F8F9FA;
                border: 1px solid #E8EAED;
                border-radius: 12px;
            }
        """)
        
        header_layout = QHBoxLayout(header)
        header_layout.setContentsMargins(24, 16, 24, 16)
        
        # Avatar
        avatar_label = QLabel("🎤")
        avatar_label.setFont(QFont("Apple Color Emoji", 36))
        avatar_label.setFixedSize(56, 56)
        avatar_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        avatar_label.setStyleSheet("""
            QLabel {
                background-color: transparent;
                border: none;
            }
        """)
        
        # Title and status
        title_frame = QFrame()
        title_frame.setStyleSheet("QFrame { background: transparent; border: none; }")
        title_layout = QVBoxLayout(title_frame)
        title_layout.setContentsMargins(16, 0, 0, 0)
        title_layout.setSpacing(4)
        
        # Get current persona name
        current_persona = self.app.get_current_persona()
        persona_name = current_persona.name if current_persona else "CloneKing Assistant"
        
        title_label = QLabel(persona_name)
        title_label.setFont(QFont("SF Pro Display", 22, QFont.Weight.Bold))
        title_label.setStyleSheet("color: #1D1D1F; border: none;")
        
        status_label = QLabel("🟢 Online • AI Persona")
        status_label.setFont(QFont("SF Pro Text", 14))
        status_label.setStyleSheet("color: #6E6E73; border: none;")
        
        title_layout.addWidget(title_label)
        title_layout.addWidget(status_label)
        
        header_layout.addWidget(avatar_label)
        header_layout.addWidget(title_frame)
        header_layout.addStretch()
        
        parent_layout.addWidget(header)
    
    def create_messages_area(self, parent_layout):
        """Create scrollable messages area"""
        # Scroll area
        scroll_area = QScrollArea()
        scroll_area.setWidgetResizable(True)
        scroll_area.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        scroll_area.setVerticalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAsNeeded)
        scroll_area.setStyleSheet("""
            QScrollArea {
                background-color: #FFFFFF;
                border: 1px solid #E8EAED;
                border-radius: 12px;
            }
        """)
        
        # Messages widget
        messages_widget = QWidget()
        messages_widget.setStyleSheet("QWidget { background-color: #FFFFFF; }")
        
        self.messages_layout = QVBoxLayout(messages_widget)
        self.messages_layout.setContentsMargins(16, 16, 16, 16)
        self.messages_layout.setSpacing(12)
        self.messages_layout.addStretch()
        
        scroll_area.setWidget(messages_widget)
        parent_layout.addWidget(scroll_area)
        
        # Store scroll area reference
        self.scroll_area = scroll_area
    
    def create_input_area(self, parent_layout):
        """Create message input area"""
        input_frame = QFrame()
        input_frame.setFixedHeight(70)
        input_frame.setStyleSheet("""
            QFrame {
                background-color: #F8F9FA;
                border: 1px solid #E8EAED;
                border-radius: 12px;
            }
        """)
        
        input_layout = QHBoxLayout(input_frame)
        input_layout.setContentsMargins(16, 12, 16, 12)
        input_layout.setSpacing(12)
        
        # Message input
        self.message_input = QLineEdit()
        self.message_input.setPlaceholderText("Type your message...")
        self.message_input.setFont(QFont("SF Pro Text", 14))
        self.message_input.setFixedHeight(44)
        self.message_input.setStyleSheet("""
            QLineEdit {
                background-color: #FFFFFF;
                border: 1px solid #E8EAED;
                border-radius: 22px;
                padding: 12px 16px;
                color: #1D1D1F;
            }
            QLineEdit:focus {
                border-color: #007AFF;
            }
        """)
        self.message_input.returnPressed.connect(self.send_message)
        
        # Send button
        self.send_button = QPushButton("Send")
        self.send_button.setFont(QFont("SF Pro Text", 14, QFont.Weight.Bold))
        self.send_button.setFixedSize(80, 44)
        self.send_button.setCursor(Qt.CursorShape.PointingHandCursor)
        self.send_button.setStyleSheet("""
            QPushButton {
                background-color: #007AFF;
                color: #FFFFFF;
                border: none;
                border-radius: 22px;
                font-weight: 600;
            }
            QPushButton:hover {
                background-color: #0056CC;
            }
            QPushButton:pressed {
                background-color: #0040A3;
            }
            QPushButton:disabled {
                background-color: #C1C1C1;
                color: #6E6E73;
            }
        """)
        self.send_button.clicked.connect(self.send_message)
        
        input_layout.addWidget(self.message_input)
        input_layout.addWidget(self.send_button)
        
        parent_layout.addWidget(input_frame)
    
    def send_message(self):
        """Send a message"""
        message_text = self.message_input.text().strip()
        if not message_text:
            return
        
        # Clear input
        self.message_input.clear()
        
        # Disable input while processing
        self.set_input_enabled(False)
        
        # Add user message
        timestamp = datetime.now().strftime("%H:%M")
        self.add_message(message_text, "user", timestamp)
        
        # Show typing indicator
        self.show_typing_indicator()
        
        # Send to chatbot
        try:
            self.app.send_message(message_text, self.on_response_received)
        except Exception as e:
            logger.error(f"Error sending message: {e}")
            self.hide_typing_indicator()
            self.add_message("Sorry, an error occurred while processing your message.", "ai", timestamp)
            self.set_input_enabled(True)
    
    def add_message(self, message: str, sender: str, timestamp: str):
        """Add a message to the chat"""
        # Remove stretch if it exists
        if self.messages_layout.count() > 0:
            last_item = self.messages_layout.itemAt(self.messages_layout.count() - 1)
            if last_item.spacerItem():
                self.messages_layout.removeItem(last_item)
        
        # Add message bubble
        bubble = MessageBubble(message, sender, timestamp)
        self.messages_layout.addWidget(bubble)
        
        # Add stretch
        self.messages_layout.addStretch()
        
        # Scroll to bottom
        QTimer.singleShot(50, self.scroll_to_bottom)
        
        # Store message
        self.messages.append({
            "message": message,
            "sender": sender,
            "timestamp": timestamp
        })
    
    def show_typing_indicator(self):
        """Show typing indicator"""
        if self.typing_indicator is None:
            # Remove stretch
            if self.messages_layout.count() > 0:
                last_item = self.messages_layout.itemAt(self.messages_layout.count() - 1)
                if last_item.spacerItem():
                    self.messages_layout.removeItem(last_item)
            
            # Add typing indicator
            self.typing_indicator = TypingIndicator()
            self.messages_layout.addWidget(self.typing_indicator)
            self.messages_layout.addStretch()
            
            # Start animation
            self.typing_indicator.start_animation()
            
            # Scroll to bottom
            QTimer.singleShot(50, self.scroll_to_bottom)
    
    def hide_typing_indicator(self):
        """Hide typing indicator"""
        if self.typing_indicator is not None:
            # Stop animation
            self.typing_indicator.stop_animation()
            
            # Remove from layout
            self.messages_layout.removeWidget(self.typing_indicator)
            self.typing_indicator.deleteLater()
            self.typing_indicator = None
            
            # Remove stretch and add it back
            if self.messages_layout.count() > 0:
                last_item = self.messages_layout.itemAt(self.messages_layout.count() - 1)
                if last_item.spacerItem():
                    self.messages_layout.removeItem(last_item)
            
            self.messages_layout.addStretch()
    
    def on_response_received(self, response: str):
        """Handle response from chatbot"""
        try:
            # Hide typing indicator
            self.hide_typing_indicator()
            
            # Add AI response
            timestamp = datetime.now().strftime("%H:%M")
            self.add_message(response, "ai", timestamp)
            
            # Re-enable input
            self.set_input_enabled(True)
            
            # Focus input
            self.message_input.setFocus()
            
        except Exception as e:
            logger.error(f"Error handling response: {e}")
            self.set_input_enabled(True)
    
    def set_input_enabled(self, enabled: bool):
        """Enable or disable input controls"""
        self.message_input.setEnabled(enabled)
        self.send_button.setEnabled(enabled)
    
    def scroll_to_bottom(self):
        """Scroll to bottom of messages"""
        scrollbar = self.scroll_area.verticalScrollBar()
        scrollbar.setValue(scrollbar.maximum())