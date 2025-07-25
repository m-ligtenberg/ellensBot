import customtkinter as ctk
from typing import Callable

class Sidebar(ctk.CTkFrame):
    def __init__(self, parent, width: int, on_new_chat: Callable, on_export_chat: Callable, on_clear_chat: Callable):
        super().__init__(parent, width=width, corner_radius=10)
        
        self.on_new_chat = on_new_chat
        self.on_export_chat = on_export_chat
        self.on_clear_chat = on_clear_chat
        
        self.grid_propagate(False)
        self._create_ui()
    
    def _create_ui(self):
        """Create sidebar UI"""
        # Configure grid
        self.grid_rowconfigure(2, weight=1)
        
        # App logo/title
        self._create_header()
        
        # Action buttons
        self._create_actions()
        
        # Chat sessions (placeholder for future)
        self._create_sessions_area()
        
        # Settings/info
        self._create_footer()
    
    def _create_header(self):
        """Create sidebar header"""
        header_frame = ctk.CTkFrame(self, fg_color="transparent")
        header_frame.grid(row=0, column=0, sticky="ew", padx=15, pady=(15, 10))
        
        # App icon
        icon_label = ctk.CTkLabel(
            header_frame,
            text="🎤",
            font=ctk.CTkFont(size=32)
        )
        icon_label.grid(row=0, column=0, pady=(0, 5))
        
        # App title
        title_label = ctk.CTkLabel(
            header_frame,
            text="Young Ellens",
            font=ctk.CTkFont(size=20, weight="bold")
        )
        title_label.grid(row=1, column=0)
        
        # Subtitle
        subtitle_label = ctk.CTkLabel(
            header_frame,
            text="AI Chatbot",
            font=ctk.CTkFont(size=14),
            text_color=("gray60", "gray40")
        )
        subtitle_label.grid(row=2, column=0)
    
    def _create_actions(self):
        """Create action buttons"""
        actions_frame = ctk.CTkFrame(self, fg_color="transparent")
        actions_frame.grid(row=1, column=0, sticky="ew", padx=15, pady=10)
        
        # New Chat button
        new_chat_btn = ctk.CTkButton(
            actions_frame,
            text="🗨️ New Chat",
            font=ctk.CTkFont(size=14, weight="bold"),
            height=40,
            corner_radius=8,
            command=self.on_new_chat
        )
        new_chat_btn.grid(row=0, column=0, sticky="ew", pady=(0, 8))
        
        # Export Chat button
        export_btn = ctk.CTkButton(
            actions_frame,
            text="📤 Export Chat",
            font=ctk.CTkFont(size=14),
            height=35,
            corner_radius=8,
            fg_color=("gray70", "gray30"),
            hover_color=("gray60", "gray40"),
            command=self.on_export_chat
        )
        export_btn.grid(row=1, column=0, sticky="ew", pady=(0, 8))
        
        # Clear Chat button
        clear_btn = ctk.CTkButton(
            actions_frame,
            text="🗑️ Clear Chat",
            font=ctk.CTkFont(size=14),
            height=35,
            corner_radius=8,
            fg_color=("red", "darkred"),
            hover_color=("darkred", "red"),
            command=self.on_clear_chat
        )
        clear_btn.grid(row=2, column=0, sticky="ew")
        
        actions_frame.grid_columnconfigure(0, weight=1)
    
    def _create_sessions_area(self):
        """Create chat sessions area (future feature)"""
        sessions_frame = ctk.CTkFrame(self, corner_radius=8)
        sessions_frame.grid(row=2, column=0, sticky="nsew", padx=15, pady=10)
        sessions_frame.grid_columnconfigure(0, weight=1)
        
        # Sessions title
        sessions_title = ctk.CTkLabel(
            sessions_frame,
            text="Recent Chats",
            font=ctk.CTkFont(size=16, weight="bold")
        )
        sessions_title.grid(row=0, column=0, padx=15, pady=(15, 10))
        
        # Placeholder for sessions
        placeholder_label = ctk.CTkLabel(
            sessions_frame,
            text="Chat history will\nappear here soon!",
            font=ctk.CTkFont(size=14),
            text_color=("gray60", "gray40")
        )
        placeholder_label.grid(row=1, column=0, padx=15, pady=20)
    
    def _create_footer(self):
        """Create sidebar footer"""
        footer_frame = ctk.CTkFrame(self, fg_color="transparent")
        footer_frame.grid(row=3, column=0, sticky="ew", padx=15, pady=(10, 15))
        
        # About section
        about_frame = ctk.CTkFrame(footer_frame, corner_radius=8)
        about_frame.grid(row=0, column=0, sticky="ew", pady=(0, 10))
        about_frame.grid_columnconfigure(0, weight=1)
        
        about_title = ctk.CTkLabel(
            about_frame,
            text="About",
            font=ctk.CTkFont(size=14, weight="bold")
        )
        about_title.grid(row=0, column=0, padx=10, pady=(10, 5))
        
        about_text = ctk.CTkLabel(
            about_frame,
            text="Young Ellens AI\nDesktop v2.0.0\n\nBuilt with Python\n& CustomTkinter",
            font=ctk.CTkFont(size=12),
            text_color=("gray60", "gray40"),
            justify="center"
        )
        about_text.grid(row=1, column=0, padx=10, pady=(0, 10))
        
        footer_frame.grid_columnconfigure(0, weight=1)