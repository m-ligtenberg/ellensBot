import customtkinter as ctk
import tkinter as tk
from typing import Optional, Dict, Any, List
from pathlib import Path

from ..core.persona import PersonaConfig
from ..utils.logger import logger
from .cloneking_sidebar import CloneKingSidebar
from .persona_creator import PersonaCreatorWindow
from .training_dashboard import TrainingDashboard
from .discovery_panel import DiscoveryPanel
from .chat_interface import ChatInterface

class CloneKingMainWindow(ctk.CTk):
    """Main window for CloneKing application"""
    
    def __init__(self, app):
        super().__init__()
        
        self.app = app
        self.current_view = "chat"
        
        # Configure window
        self.title("CloneKing - AI Persona Cloning Platform v1.0")
        self.geometry("1400x900")
        self.minsize(1200, 800)
        
        # Configure Apple-like white theme
        ctk.set_appearance_mode("light")
        ctk.set_default_color_theme("blue")
        
        # Apple-like color scheme
        self.colors = {
            "background": "#FFFFFF",
            "surface": "#F8F9FA", 
            "surface_hover": "#F1F3F4",
            "sidebar": "#FAFBFC",
            "border": "#E8EAED",
            "text_primary": "#1D1D1F",
            "text_secondary": "#6E6E73",
            "accent": "#007AFF",
            "accent_hover": "#0056CC",
            "success": "#34C759",
            "warning": "#FF9500",
            "destructive": "#FF3B30",
            "shadow": "rgba(0,0,0,0.05)"
        }
        
        # Set window icon (if available)
        try:
            icon_path = Path(__file__).parent.parent.parent / "assets" / "icon.ico"
            if icon_path.exists():
                self.iconbitmap(str(icon_path))
        except Exception:
            pass  # Icon not critical
        
        # Apply Apple-like window styling
        self.configure(fg_color=self.colors["background"])
        
        # Configure grid weights
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)
        
        # Create main components with Apple styling
        self._create_sidebar()
        self._create_main_content_area()
        self._create_status_bar()
        
        # Initialize with current persona
        self._update_persona_info()
        
        # Bind window events
        self.protocol("WM_DELETE_WINDOW", self._on_closing)
        
        logger.info("CloneKing main window initialized")
    
    def _create_sidebar(self):
        """Create the sidebar with persona management and navigation"""
        self.sidebar = CloneKingSidebar(self, self.app)
        self.sidebar.grid(row=0, column=0, sticky="nsew", padx=(20, 8), pady=20)
    
    def _create_main_content_area(self):
        """Create the main content area with Apple styling"""
        # Main content frame with Apple-like styling
        self.main_frame = ctk.CTkFrame(
            self,
            fg_color=self.colors["background"],
            corner_radius=16,
            border_width=1,
            border_color=self.colors["border"]
        )
        self.main_frame.grid(row=0, column=1, sticky="nsew", padx=(8, 20), pady=20)
        self.main_frame.grid_columnconfigure(0, weight=1)
        self.main_frame.grid_rowconfigure(1, weight=1)
        
        # Content header
        self._create_content_header()
        
        # Content area with Apple styling
        self.content_area = ctk.CTkFrame(
            self.main_frame,
            fg_color=self.colors["background"],
            corner_radius=12,
            border_width=1,
            border_color=self.colors["border"]
        )
        self.content_area.grid(row=1, column=0, sticky="nsew", padx=20, pady=(0, 20))
        self.content_area.grid_columnconfigure(0, weight=1)
        self.content_area.grid_rowconfigure(0, weight=1)
        
        # Initialize with chat view
        self._show_chat_view()
    
    def _create_content_header(self):
        """Create header for the main content area with Apple styling"""
        header_frame = ctk.CTkFrame(
            self.main_frame,
            fg_color=self.colors["surface"],
            corner_radius=12,
            height=80
        )
        header_frame.grid(row=0, column=0, sticky="ew", padx=20, pady=(20, 16))
        header_frame.grid_columnconfigure(1, weight=1)
        header_frame.grid_propagate(False)
        
        # Current persona info
        self.persona_info_frame = ctk.CTkFrame(header_frame, fg_color="transparent")
        self.persona_info_frame.grid(row=0, column=0, sticky="w", padx=(10, 20), pady=10)
        
        self.persona_name_label = ctk.CTkLabel(
            self.persona_info_frame,
            text="No Persona Selected",
            font=ctk.CTkFont(family="SF Pro Display", size=22, weight="bold"),
            text_color=self.colors["text_primary"]
        )
        self.persona_name_label.grid(row=0, column=0, sticky="w")
        
        self.persona_status_label = ctk.CTkLabel(
            self.persona_info_frame,
            text="",
            font=ctk.CTkFont(family="SF Pro Text", size=13),
            text_color=self.colors["text_secondary"]
        )
        self.persona_status_label.grid(row=1, column=0, sticky="w", pady=(4, 0))
        
        # View navigation buttons with Apple styling
        nav_frame = ctk.CTkFrame(
            header_frame, 
            fg_color="transparent"
        )
        nav_frame.grid(row=0, column=1, sticky="e", padx=20, pady=16)
        
        self.nav_buttons = {}
        nav_options = [
            ("💬", "chat", "Chat", "Chat with your AI persona"),
            ("🎯", "training", "Training", "Train your persona with multimodal data"),
            ("🔍", "discovery", "Discovery", "Discover and manage content sources"),
            ("📊", "analytics", "Analytics", "View persona performance analytics"),
            ("⚙️", "settings", "Settings", "Configure application settings")
        ]
        
        for i, (icon, view_id, title, tooltip) in enumerate(nav_options):
            btn = ctk.CTkButton(
                nav_frame,
                text=f"{icon} {title}",
                width=120,
                height=38,
                corner_radius=10,
                font=ctk.CTkFont(family="SF Pro Text", size=14, weight="normal"),
                fg_color=self.colors["surface"],
                hover_color=self.colors["surface_hover"],
                text_color=self.colors["text_primary"],
                border_width=1,
                border_color=self.colors["border"],
                command=lambda v=view_id: self._switch_view(v)
            )
            btn.grid(row=0, column=i, padx=4)
            self.nav_buttons[view_id] = btn
            
            # Add tooltip (simplified version)
            def create_tooltip(widget, text):
                def on_enter(event):
                    self.set_status(text)
                def on_leave(event):
                    self.set_status("Ready")
                widget.bind("<Enter>", on_enter)
                widget.bind("<Leave>", on_leave)
            
            create_tooltip(btn, tooltip)
        
        # Highlight current view
        self._update_nav_buttons()
    
    def _create_status_bar(self):
        """Create status bar at the bottom with Apple styling"""
        self.status_bar = ctk.CTkFrame(
            self, 
            height=36,
            fg_color=self.colors["surface"],
            corner_radius=12,
            border_width=1,
            border_color=self.colors["border"]
        )
        self.status_bar.grid(row=1, column=0, columnspan=2, sticky="ew", padx=20, pady=(0, 20))
        self.status_bar.grid_columnconfigure(1, weight=1)
        self.status_bar.grid_propagate(False)
        
        # Status indicators with Apple typography
        self.status_label = ctk.CTkLabel(
            self.status_bar,
            text="Ready",
            font=ctk.CTkFont(family="SF Pro Text", size=13),
            text_color=self.colors["text_primary"]
        )
        self.status_label.grid(row=0, column=0, padx=16, pady=8, sticky="w")
        
        # Connection status
        self.connection_label = ctk.CTkLabel(
            self.status_bar,
            text="🟢 Connected",
            font=ctk.CTkFont(family="SF Pro Text", size=13),
            text_color=self.colors["text_secondary"]
        )
        self.connection_label.grid(row=0, column=2, padx=16, pady=8, sticky="e")
    
    def _switch_view(self, view_id: str):
        """Switch to a different view"""
        try:
            if view_id == self.current_view:
                return
            
            # Update navigation immediately for instant feedback
            self.current_view = view_id
            self._update_nav_buttons()
            
            # Use after_idle to prevent blocking the main thread
            self.after_idle(self._load_view_content, view_id)
            
            logger.info(f"Switching to view: {view_id}")
            
        except Exception as e:
            logger.error(f"Error switching view: {e}")
    
    def _load_view_content(self, view_id: str):
        """Load view content in a non-blocking way"""
        try:
            # Clear current content
            for widget in self.content_area.winfo_children():
                widget.destroy()
            
            # Show new view
            if view_id == "chat":
                self._show_chat_view()
            elif view_id == "training":
                self._show_training_view()
            elif view_id == "discovery":
                self._show_discovery_view()
            elif view_id == "analytics":
                self._show_analytics_view()
            elif view_id == "settings":
                self._show_settings_view()
            
            logger.info(f"Loaded view content: {view_id}")
            
        except Exception as e:
            logger.error(f"Error loading view content: {e}")
    
    def _update_nav_buttons(self):
        """Update navigation button appearances with Apple styling"""
        for view_id, button in self.nav_buttons.items():
            if view_id == self.current_view:
                button.configure(
                    fg_color=self.colors["accent"],
                    hover_color=self.colors["accent_hover"],
                    text_color="#FFFFFF",
                    border_color=self.colors["accent"]
                )
            else:
                button.configure(
                    fg_color=self.colors["surface"],
                    hover_color=self.colors["surface_hover"],
                    text_color=self.colors["text_primary"],
                    border_color=self.colors["border"]
                )
    
    def _show_chat_view(self):
        """Show the chat interface"""
        try:
            current_persona = self.app.get_current_persona()
            
            if current_persona:
                self.chat_interface = ChatInterface(
                    self.content_area,
                    on_send_message=self.app.send_message,
                    chatbot=self.app.chatbot
                )
                self.chat_interface.grid(row=0, column=0, sticky="nsew", padx=10, pady=10)
            else:
                # Show persona selection prompt
                self._show_persona_selection_prompt()
                
        except Exception as e:
            logger.error(f"Error showing chat view: {e}")
    
    def _show_training_view(self):
        """Show the training dashboard"""
        try:
            self.training_dashboard = TrainingDashboard(
                self.content_area,
                self.app
            )
            self.training_dashboard.grid(row=0, column=0, sticky="nsew", padx=10, pady=10)
            
        except Exception as e:
            logger.error(f"Error showing training view: {e}")
    
    def _show_discovery_view(self):
        """Show the discovery panel"""
        try:
            self.discovery_panel = DiscoveryPanel(
                self.content_area,
                self.app
            )
            self.discovery_panel.grid(row=0, column=0, sticky="nsew", padx=10, pady=10)
            
        except Exception as e:
            logger.error(f"Error showing discovery view: {e}")
    
    def _show_analytics_view(self):
        """Show analytics dashboard"""
        try:
            # Create analytics frame with Apple styling
            analytics_frame = ctk.CTkScrollableFrame(
                self.content_area,
                fg_color=self.colors["background"],
                corner_radius=0
            )
            analytics_frame.grid(row=0, column=0, sticky="nsew", padx=20, pady=20)
            analytics_frame.grid_columnconfigure(0, weight=1)
            
            # Header with Apple typography
            header_label = ctk.CTkLabel(
                analytics_frame,
                text="📊 Analytics Dashboard",
                font=ctk.CTkFont(family="SF Pro Display", size=28, weight="bold"),
                text_color=self.colors["text_primary"]
            )
            header_label.grid(row=0, column=0, pady=(24, 32))
            
            current_persona = self.app.get_current_persona()
            if current_persona:
                self._show_persona_analytics(analytics_frame, current_persona)
            else:
                no_persona_label = ctk.CTkLabel(
                    analytics_frame,
                    text="No persona selected\nCreate or select a persona to view analytics",
                    font=ctk.CTkFont(size=16),
                    text_color=("gray60", "gray40")
                )
                no_persona_label.grid(row=1, column=0, pady=50)
            
        except Exception as e:
            logger.error(f"Error showing analytics view: {e}")
    
    def _show_persona_analytics(self, parent_frame, persona):
        """Show analytics for a specific persona"""
        try:
            stats = self.app.get_persona_statistics(persona.id)
            
            # Persona overview card
            overview_frame = ctk.CTkFrame(parent_frame)
            overview_frame.grid(row=1, column=0, sticky="ew", padx=20, pady=10)
            overview_frame.grid_columnconfigure(1, weight=1)
            
            # Persona info
            persona_info = ctk.CTkLabel(
                overview_frame,
                text=f"👤 {persona.name}\n{persona.description}",
                font=ctk.CTkFont(size=16, weight="bold"),
                justify="left"
            )
            persona_info.grid(row=0, column=0, sticky="w", padx=20, pady=15)
            
            # Statistics grid
            stats_frame = ctk.CTkFrame(parent_frame)
            stats_frame.grid(row=2, column=0, sticky="ew", padx=20, pady=10)
            
            # Training data statistics
            training_label = ctk.CTkLabel(
                stats_frame,
                text="📁 Training Data",
                font=ctk.CTkFont(size=16, weight="bold")
            )
            training_label.grid(row=0, column=0, columnspan=2, padx=20, pady=(15, 10))
            
            row = 1
            for data_type, count in stats.get("training_data_counts", {}).items():
                type_label = ctk.CTkLabel(
                    stats_frame,
                    text=f"{data_type.title()}:",
                    font=ctk.CTkFont(size=14)
                )
                type_label.grid(row=row, column=0, sticky="w", padx=(40, 10), pady=5)
                
                count_label = ctk.CTkLabel(
                    stats_frame,
                    text=f"{count} files",
                    font=ctk.CTkFont(size=14, weight="bold")
                )
                count_label.grid(row=row, column=1, sticky="w", padx=10, pady=5)
                row += 1
            
            # Additional statistics
            if stats.get("last_training"):
                last_training_label = ctk.CTkLabel(
                    stats_frame,
                    text=f"🎯 Last Training: {stats['last_training'][:10]}",
                    font=ctk.CTkFont(size=14)
                )
                last_training_label.grid(row=row, column=0, columnspan=2, padx=20, pady=10)
                row += 1
            
            # Content discovery stats
            if stats.get("discovered_content_count", 0) > 0:
                discovery_label = ctk.CTkLabel(
                    stats_frame,
                    text=f"🔍 Discovered Content: {stats['discovered_content_count']} items",
                    font=ctk.CTkFont(size=14)
                )
                discovery_label.grid(row=row, column=0, columnspan=2, padx=20, pady=10)
            
        except Exception as e:
            logger.error(f"Error showing persona analytics: {e}")
    
    def _show_settings_view(self):
        """Show application settings"""
        try:
            # Create settings frame
            settings_frame = ctk.CTkScrollableFrame(self.content_area)
            settings_frame.grid(row=0, column=0, sticky="nsew", padx=10, pady=10)
            settings_frame.grid_columnconfigure(0, weight=1)
            
            # Header
            header_label = ctk.CTkLabel(
                settings_frame,
                text="⚙️ Application Settings",
                font=ctk.CTkFont(size=24, weight="bold")
            )
            header_label.grid(row=0, column=0, pady=(20, 30))
            
            # Theme settings
            theme_frame = ctk.CTkFrame(settings_frame)
            theme_frame.grid(row=1, column=0, sticky="ew", padx=20, pady=10)
            theme_frame.grid_columnconfigure(1, weight=1)
            
            theme_label = ctk.CTkLabel(
                theme_frame,
                text="🎨 Appearance",
                font=ctk.CTkFont(size=16, weight="bold")
            )
            theme_label.grid(row=0, column=0, columnspan=2, padx=20, pady=(15, 10))
            
            # Theme mode selector
            theme_mode_label = ctk.CTkLabel(theme_frame, text="Theme Mode:")
            theme_mode_label.grid(row=1, column=0, sticky="w", padx=(40, 10), pady=5)
            
            theme_mode_var = ctk.StringVar(value="dark")
            theme_mode_menu = ctk.CTkOptionMenu(
                theme_frame,
                values=["light", "dark", "system"],
                variable=theme_mode_var,
                command=self._change_theme_mode
            )
            theme_mode_menu.grid(row=1, column=1, sticky="w", padx=10, pady=5)
            
            # API settings placeholder
            api_frame = ctk.CTkFrame(settings_frame)
            api_frame.grid(row=2, column=0, sticky="ew", padx=20, pady=10)
            
            api_label = ctk.CTkLabel(
                api_frame,
                text="🔑 API Configuration",
                font=ctk.CTkFont(size=16, weight="bold")
            )
            api_label.grid(row=0, column=0, padx=20, pady=(15, 10))
            
            api_info = ctk.CTkLabel(
                api_frame,
                text="OpenAI API and other service configurations\nwill be available in AI Settings tab",
                font=ctk.CTkFont(size=14),
                text_color=("gray60", "gray40")
            )
            api_info.grid(row=1, column=0, padx=20, pady=(0, 15))
            
        except Exception as e:
            logger.error(f"Error showing settings view: {e}")
    
    def _change_theme_mode(self, mode):
        """Change the application theme mode"""
        try:
            ctk.set_appearance_mode(mode)
            logger.info(f"Theme mode changed to: {mode}")
        except Exception as e:
            logger.error(f"Error changing theme mode: {e}")
    
    def _show_persona_selection_prompt(self):
        """Show prompt to create or select a persona with Apple styling"""
        prompt_frame = ctk.CTkFrame(
            self.content_area,
            fg_color=self.colors["background"],
            corner_radius=0
        )
        prompt_frame.grid(row=0, column=0, sticky="nsew", padx=60, pady=60)
        prompt_frame.grid_columnconfigure(0, weight=1)
        
        # Welcome message with Apple typography
        welcome_label = ctk.CTkLabel(
            prompt_frame,
            text="🤖 Welcome to CloneKing",
            font=ctk.CTkFont(family="SF Pro Display", size=36, weight="bold"),
            text_color=self.colors["text_primary"]
        )
        welcome_label.grid(row=0, column=0, pady=(60, 24))
        
        description_label = ctk.CTkLabel(
            prompt_frame,
            text="Create AI personas with unique personalities, voices, and knowledge.\nStart by creating your first persona or selecting an existing one.",
            font=ctk.CTkFont(family="SF Pro Text", size=17),
            text_color=self.colors["text_secondary"]
        )
        description_label.grid(row=1, column=0, pady=(0, 40))
        
        # Action buttons
        button_frame = ctk.CTkFrame(prompt_frame, fg_color="transparent")
        button_frame.grid(row=2, column=0, pady=20)
        
        create_button = ctk.CTkButton(
            button_frame,
            text="🎭 Create New Persona",
            font=ctk.CTkFont(family="SF Pro Text", size=16, weight="bold"),
            width=220,
            height=52,
            corner_radius=12,
            fg_color=self.colors["accent"],
            hover_color=self.colors["accent_hover"],
            text_color="#FFFFFF",
            command=self._show_persona_creator
        )
        create_button.grid(row=0, column=0, padx=12)
        
        # Show existing personas if any
        personas = self.app.get_all_personas()
        if personas:
            select_label = ctk.CTkLabel(
                prompt_frame,
                text="Or select an existing persona:",
                font=ctk.CTkFont(size=14)
            )
            select_label.grid(row=3, column=0, pady=(30, 10))
            
            persona_frame = ctk.CTkScrollableFrame(prompt_frame, height=200)
            persona_frame.grid(row=4, column=0, sticky="ew", padx=20, pady=10)
            
            for i, persona in enumerate(personas):
                persona_button = ctk.CTkButton(
                    persona_frame,
                    text=f"👤 {persona.name}\n{persona.description[:50]}...",
                    width=300,
                    height=60,
                    command=lambda p=persona: self._select_persona(p)
                )
                persona_button.grid(row=i, column=0, pady=5, padx=10)
    
    def _show_persona_creator(self):
        """Show persona creator window"""
        try:
            creator_window = PersonaCreatorWindow(self, self.app)
            creator_window.grab_set()
            
        except Exception as e:
            logger.error(f"Error showing persona creator: {e}")
    
    def _select_persona(self, persona: PersonaConfig):
        """Select and switch to a persona"""
        try:
            if self.app.switch_persona(persona.id):
                self._update_persona_info()
                self._switch_view("chat")  # Switch to chat view
                
        except Exception as e:
            logger.error(f"Error selecting persona: {e}")
    
    def _update_persona_info(self):
        """Update the persona information display"""
        try:
            current_persona = self.app.get_current_persona()
            
            if current_persona:
                self.persona_name_label.configure(text=f"👤 {current_persona.name}")
                
                # Update status asynchronously to avoid blocking
                self.after_idle(self._update_persona_status, current_persona.id)
            else:
                self.persona_name_label.configure(text="No Persona Selected")
                self.persona_status_label.configure(text="Create or select a persona to begin")
                
        except Exception as e:
            logger.error(f"Error updating persona info: {e}")
    
    def _update_persona_status(self, persona_id: str):
        """Update persona status in a non-blocking way"""
        try:
            # Get persona statistics
            stats = self.app.get_persona_statistics(persona_id)
            status_parts = []
            
            if stats.get("total_files", 0) > 0:
                status_parts.append(f"📁 {stats['total_files']} training files")
            
            if stats.get("discovered_content_count", 0) > 0:
                status_parts.append(f"🔍 {stats['discovered_content_count']} discovered items")
            
            if stats.get("training_status"):
                status_parts.append(f"🎯 Training: {stats['training_status']}")
            
            status_text = " • ".join(status_parts) if status_parts else "Ready"
            self.persona_status_label.configure(text=status_text)
            
        except Exception as e:
            logger.error(f"Error updating persona status: {e}")
    
    def on_persona_switched(self, persona: PersonaConfig):
        """Called when persona is switched"""
        self._update_persona_info()
        
        # Refresh current view
        if self.current_view == "chat":
            self._switch_view("chat")
    
    def on_persona_created(self, persona: PersonaConfig):
        """Called when a new persona is created"""
        # Switch to the new persona
        if self.app.switch_persona(persona.id):
            self._update_persona_info()
            self._switch_view("training")  # Switch to training view for setup
    
    def set_status(self, message: str):
        """Update status bar message"""
        self.status_label.configure(text=message)
    
    def _on_closing(self):
        """Handle window closing"""
        try:
            logger.info("CloneKing window closing")
            self.app.shutdown()
            self.quit()
            
        except Exception as e:
            logger.error(f"Error during window closing: {e}")
            self.quit()