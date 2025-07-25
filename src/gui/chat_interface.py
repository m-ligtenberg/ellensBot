import customtkinter as ctk
import tkinter as tk
from datetime import datetime
from typing import Callable, List
from ..ai.chatbot import Chatbot
from ..utils.logger import logger
from ..utils.config import config

class ChatInterface(ctk.CTkFrame):
    def __init__(self, parent, on_send_message: Callable[[str], None], chatbot: Chatbot):
        super().__init__(parent)
        
        self.on_send_message = on_send_message
        self.chatbot = chatbot
        self.messages: List[dict] = []
        self.typing_indicator = None
        
        self._create_ui()
        self._bind_events()
    
    def _create_ui(self):
        """Create the chat interface UI"""
        # Configure grid weights
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(1, weight=1)
        
        # Header
        self._create_header()
        
        # Messages area
        self._create_messages_area()
        
        # Input area
        self._create_input_area()
    
    def _create_header(self):
        """Create chat header"""
        header_frame = ctk.CTkFrame(self, height=80, corner_radius=10)
        header_frame.grid(row=0, column=0, sticky="ew", padx=10, pady=(10, 5))
        header_frame.grid_columnconfigure(1, weight=1)
        header_frame.grid_propagate(False)
        
        # Avatar (emoji)
        avatar_label = ctk.CTkLabel(
            header_frame, 
            text="🎤", 
            font=ctk.CTkFont(size=32)
        )
        avatar_label.grid(row=0, column=0, padx=20, pady=10)
        
        # Title and status
        title_frame = ctk.CTkFrame(header_frame, fg_color="transparent")
        title_frame.grid(row=0, column=1, sticky="w", padx=10, pady=10)
        
        title_label = ctk.CTkLabel(
            title_frame,
            text="Young Ellens",
            font=ctk.CTkFont(size=24, weight="bold")
        )
        title_label.grid(row=0, column=0, sticky="w")
        
        status_label = ctk.CTkLabel(
            title_frame,
            text="🟢 Online • AI Assistant",
            font=ctk.CTkFont(size=14),
            text_color=("gray60", "gray40")
        )
        status_label.grid(row=1, column=0, sticky="w")
    
    def _create_messages_area(self):
        """Create scrollable messages area"""
        # Create scrollable frame
        self.messages_frame = ctk.CTkScrollableFrame(
            self, 
            corner_radius=10,
            fg_color=("gray95", "gray10")
        )
        self.messages_frame.grid(row=1, column=0, sticky="nsew", padx=10, pady=5)
        self.messages_frame.grid_columnconfigure(0, weight=1)
        
        # Welcome message
        self._show_welcome_screen()
    
    def _create_input_area(self):
        """Create message input area"""
        input_frame = ctk.CTkFrame(self, height=100, corner_radius=10)
        input_frame.grid(row=2, column=0, sticky="ew", padx=10, pady=(5, 10))
        input_frame.grid_columnconfigure(0, weight=1)
        input_frame.grid_propagate(False)
        
        # Message input with send button
        input_container = ctk.CTkFrame(input_frame, fg_color="transparent")
        input_container.grid(row=0, column=0, sticky="ew", padx=15, pady=15)
        input_container.grid_columnconfigure(0, weight=1)
        
        self.message_entry = ctk.CTkTextbox(
            input_container,
            height=50,
            corner_radius=8,
            wrap="word",
            font=ctk.CTkFont(size=14)
        )
        self.message_entry.grid(row=0, column=0, sticky="ew", padx=(0, 10))
        
        self.send_button = ctk.CTkButton(
            input_container,
            text="Send",
            width=80,
            height=50,
            corner_radius=8,
            font=ctk.CTkFont(size=14, weight="bold"),
            command=self._handle_send
        )
        self.send_button.grid(row=0, column=1)
        
        # Character counter
        self.char_label = ctk.CTkLabel(
            input_frame,
            text="0 / 1000",
            font=ctk.CTkFont(size=12),
            text_color=("gray60", "gray40")
        )
        self.char_label.grid(row=1, column=0, sticky="e", padx=15, pady=(0, 10))
    
    def _bind_events(self):
        """Bind keyboard events"""
        self.message_entry.bind("<KeyRelease>", self._on_text_change)
        self.message_entry.bind("<Control-Return>", self._handle_send)
        self.message_entry.bind("<Return>", self._on_enter_key)
    
    def _on_text_change(self, event=None):
        """Handle text change in message entry"""
        text = self.message_entry.get("1.0", "end-1c")
        length = len(text)
        
        # Update character counter
        self.char_label.configure(text=f"{length} / 1000")
        
        # Enable/disable send button
        self.send_button.configure(state="normal" if text.strip() and length <= 1000 else "disabled")
    
    def _on_enter_key(self, event):
        """Handle Enter key press"""
        if not event.state & 0x4:  # Not Ctrl+Enter
            self._handle_send()
            return "break"  # Prevent newline
    
    def _handle_send(self, event=None):
        """Handle sending message"""
        text = self.message_entry.get("1.0", "end-1c").strip()
        
        if text and len(text) <= 1000:
            self.message_entry.delete("1.0", "end")
            self._on_text_change()
            self.on_send_message(text)
    
    def _show_welcome_screen(self):
        """Show welcome screen when no messages"""
        welcome_frame = ctk.CTkFrame(self.messages_frame, fg_color="transparent")
        welcome_frame.grid(row=0, column=0, pady=50)
        
        # Welcome icon
        icon_label = ctk.CTkLabel(
            welcome_frame,
            text="👋",
            font=ctk.CTkFont(size=48)
        )
        icon_label.grid(row=0, column=0, pady=(0, 20))
        
        # Welcome title
        title_label = ctk.CTkLabel(
            welcome_frame,
            text="Welcome to Young Ellens",
            font=ctk.CTkFont(size=24, weight="bold")
        )
        title_label.grid(row=1, column=0, pady=(0, 10))
        
        # Welcome description
        desc_label = ctk.CTkLabel(
            welcome_frame,
            text="Your AI assistant is ready to chat.\nSend a message to get started!",
            font=ctk.CTkFont(size=16),
            text_color=("gray60", "gray40")
        )
        desc_label.grid(row=2, column=0)
    
    def add_message(self, content: str, sender: str, show_typing: bool = True):
        """Add a message to the chat"""
        # Remove welcome screen if this is the first message
        if not self.messages:
            for widget in self.messages_frame.winfo_children():
                widget.destroy()
        
        # Create message bubble
        message_frame = self._create_message_bubble(content, sender)
        
        # Add to messages list
        self.messages.append({
            'content': content,
            'sender': sender,
            'timestamp': datetime.now(),
            'widget': message_frame
        })
        
        # Scroll to bottom
        self.messages_frame._parent_canvas.update_idletasks()
        self.messages_frame._parent_canvas.yview_moveto(1.0)
    
    def _create_message_bubble(self, content: str, sender: str) -> ctk.CTkFrame:
        """Create a message bubble widget"""
        # Container for message alignment
        container = ctk.CTkFrame(self.messages_frame, fg_color="transparent")
        container.grid(row=len(self.messages), column=0, sticky="ew", pady=5, padx=10)
        container.grid_columnconfigure(0 if sender == "ai" else 1, weight=1)
        
        # Message bubble
        is_user = sender == "user"
        bubble_color = ("#3b82f6", "#2563eb") if is_user else ("#f1f5f9", "#334155")
        text_color = "white" if is_user else ("gray10", "gray90")
        
        message_bubble = ctk.CTkFrame(
            container,
            corner_radius=18,
            fg_color=bubble_color
        )
        message_bubble.grid(
            row=0, 
            column=1 if is_user else 0,
            sticky="e" if is_user else "w",
            padx=(50, 0) if is_user else (0, 50)
        )
        
        # Message text
        message_label = ctk.CTkLabel(
            message_bubble,
            text=content,
            font=ctk.CTkFont(size=14),
            text_color=text_color,
            wraplength=400,
            justify="left"
        )
        message_label.grid(row=0, column=0, padx=16, pady=12)
        
        # Timestamp
        timestamp = datetime.now().strftime("%H:%M")
        time_label = ctk.CTkLabel(
            message_bubble,
            text=timestamp,
            font=ctk.CTkFont(size=11),
            text_color=text_color if is_user else ("gray50", "gray60")
        )
        time_label.grid(row=1, column=0, padx=16, pady=(0, 8), sticky="e" if is_user else "w")
        
        return container
    
    def show_typing_indicator(self):
        """Show typing indicator"""
        if self.typing_indicator:
            return
        
        # Create typing indicator
        self.typing_indicator = ctk.CTkFrame(self.messages_frame, fg_color="transparent")
        self.typing_indicator.grid(row=len(self.messages), column=0, sticky="ew", pady=5, padx=10)
        self.typing_indicator.grid_columnconfigure(1, weight=1)
        
        # Typing bubble
        typing_bubble = ctk.CTkFrame(
            self.typing_indicator,
            corner_radius=18,
            fg_color=("#f1f5f9", "#334155")
        )
        typing_bubble.grid(row=0, column=0, sticky="w", padx=(0, 50))
        
        # Typing text with dots animation
        typing_label = ctk.CTkLabel(
            typing_bubble,
            text="Young Ellens is typing...",
            font=ctk.CTkFont(size=14),
            text_color=("gray60", "gray40")
        )
        typing_label.grid(row=0, column=0, padx=16, pady=12)
        
        # Scroll to bottom
        self.messages_frame._parent_canvas.update_idletasks()
        self.messages_frame._parent_canvas.yview_moveto(1.0)
    
    def hide_typing_indicator(self):
        """Hide typing indicator"""
        if self.typing_indicator:
            self.typing_indicator.destroy()
            self.typing_indicator = None
    
    def clear_messages(self):
        """Clear all messages"""
        self.messages.clear()
        for widget in self.messages_frame.winfo_children():
            widget.destroy()
        self._show_welcome_screen()