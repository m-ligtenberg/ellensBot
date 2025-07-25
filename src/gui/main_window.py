import customtkinter as ctk
import tkinter as tk
from tkinter import filedialog, messagebox
from datetime import datetime
from typing import List, Dict
from .chat_interface import ChatInterface
from .sidebar import Sidebar
from ..database.db_manager import DatabaseManager
from ..ai.chatbot import Chatbot
from ..utils.logger import logger
from ..utils.config import config

class MainWindow:
    def __init__(self, root: ctk.CTk, db_manager: DatabaseManager, chatbot: Chatbot):
        self.root = root
        self.db_manager = db_manager
        self.chatbot = chatbot
        self.current_session = "default"
        
        self._setup_window()
        self._create_ui()
        self._load_chat_history()
        
    def _setup_window(self):
        """Configure the main window"""
        self.root.title("Young Ellens - AI Chatbot")
        self.root.geometry("1200x800")
        self.root.minsize(800, 600)
        
        # Set window icon if available
        try:
            self.root.iconbitmap("assets/icon.ico")
        except:
            pass
    
    def _create_ui(self):
        """Create the main UI layout"""
        # Configure grid weights
        self.root.grid_columnconfigure(1, weight=1)
        self.root.grid_rowconfigure(0, weight=1)
        
        # Create sidebar
        self.sidebar = Sidebar(
            parent=self.root,
            width=280,
            on_new_chat=self._new_chat,
            on_export_chat=self._export_chat,
            on_clear_chat=self._clear_chat
        )
        self.sidebar.grid(row=0, column=0, sticky="nsew", padx=(10, 5), pady=10)
        
        # Create main chat interface
        self.chat_interface = ChatInterface(
            parent=self.root,
            on_send_message=self._send_message,
            chatbot=self.chatbot
        )
        self.chat_interface.grid(row=0, column=1, sticky="nsew", padx=(5, 10), pady=10)
        
        # Show welcome message
        self._show_welcome_message()
    
    def _show_welcome_message(self):
        """Show initial welcome message"""
        greeting = self.chatbot.get_greeting()
        self.chat_interface.add_message(greeting, "ai")
        self.db_manager.save_message(greeting, "ai", self.current_session)
    
    def _load_chat_history(self):
        """Load existing chat history"""
        messages = self.db_manager.get_messages(self.current_session)
        
        # Clear current messages and load from database
        if messages:
            self.chat_interface.clear_messages()
            for message in messages:
                self.chat_interface.add_message(
                    message['content'], 
                    message['sender'],
                    show_typing=False
                )
    
    def _send_message(self, message: str):
        """Handle sending a user message"""
        if not message.strip():
            return
        
        # Add user message to interface and database
        self.chat_interface.add_message(message, "user")
        self.db_manager.save_message(message, "user", self.current_session)
        
        # Show typing indicator and generate AI response
        self.chat_interface.show_typing_indicator()
        
        def on_ai_response(response: str):
            """Handle AI response"""
            self.root.after(0, lambda: self._handle_ai_response(response))
        
        self.chatbot.generate_response(message, on_ai_response)
    
    def _handle_ai_response(self, response: str):
        """Handle AI response in main thread"""
        self.chat_interface.hide_typing_indicator()
        self.chat_interface.add_message(response, "ai")
        self.db_manager.save_message(response, "ai", self.current_session)
    
    def _new_chat(self):
        """Start a new chat session"""
        # Generate new session ID
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.current_session = f"session_{timestamp}"
        
        # Clear the chat interface
        self.chat_interface.clear_messages()
        
        # Show welcome message for new chat
        self._show_welcome_message()
        
        messagebox.showinfo("New Chat", "Started a new chat session!")
    
    def _export_chat(self):
        """Export current chat to file"""
        try:
            file_path = filedialog.asksaveasfilename(
                title="Export Chat",
                defaultextension=".json",
                filetypes=[
                    ("JSON files", "*.json"),
                    ("All files", "*.*")
                ]
            )
            
            if file_path:
                if self.db_manager.export_chat(self.current_session, file_path):
                    messagebox.showinfo("Success", f"Chat exported to:\n{file_path}")
                else:
                    messagebox.showerror("Error", "Failed to export chat.")
        except Exception as e:
            messagebox.showerror("Error", f"Export failed: {str(e)}")
    
    def _clear_chat(self):
        """Clear current chat"""
        result = messagebox.askyesno(
            "Clear Chat",
            "Are you sure you want to clear this chat?\nThis action cannot be undone."
        )
        
        if result:
            if self.db_manager.clear_messages(self.current_session):
                self.chat_interface.clear_messages()
                self._show_welcome_message()
                messagebox.showinfo("Success", "Chat cleared successfully!")
            else:
                messagebox.showerror("Error", "Failed to clear chat.")