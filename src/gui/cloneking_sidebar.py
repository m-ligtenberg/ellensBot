import customtkinter as ctk
from typing import Optional, List
from ..core.persona import PersonaConfig
from ..utils.logger import logger

class CloneKingSidebar(ctk.CTkFrame):
    """Sidebar for persona management and navigation with Apple styling"""
    
    def __init__(self, parent, app):
        # Apple-like color scheme
        self.colors = {
            "background": "#FAFBFC",
            "surface": "#FFFFFF", 
            "surface_hover": "#F1F3F4",
            "border": "#E8EAED",
            "text_primary": "#1D1D1F",
            "text_secondary": "#6E6E73",
            "accent": "#007AFF",
            "accent_hover": "#0056CC",
            "success": "#34C759",
            "destructive": "#FF3B30"
        }
        
        super().__init__(
            parent, 
            width=320,
            fg_color=self.colors["background"],
            corner_radius=16,
            border_width=1,
            border_color=self.colors["border"]
        )
        
        self.app = app
        self.parent = parent
        
        # Configure grid
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(2, weight=1)
        self.grid_propagate(False)
        
        self._create_header()
        self._create_persona_section()
        self._create_quick_actions()
        
        # Load initial data
        self._refresh_personas()
    
    def _create_header(self):
        """Create sidebar header with Apple styling"""
        header_frame = ctk.CTkFrame(
            self,
            fg_color=self.colors["surface"],
            corner_radius=12
        )
        header_frame.grid(row=0, column=0, sticky="ew", padx=20, pady=(20, 16))
        header_frame.grid_columnconfigure(0, weight=1)
        
        # Logo/Title with Apple typography
        title_label = ctk.CTkLabel(
            header_frame,
            text="👑 CloneKing",
            font=ctk.CTkFont(family="SF Pro Display", size=26, weight="bold"),
            text_color=self.colors["text_primary"]
        )
        title_label.grid(row=0, column=0, pady=(24, 8))
        
        subtitle_label = ctk.CTkLabel(
            header_frame,
            text="AI Persona Platform",
            font=ctk.CTkFont(family="SF Pro Text", size=14),
            text_color=self.colors["text_secondary"]
        )
        subtitle_label.grid(row=1, column=0, pady=(0, 20))
    
    def _create_persona_section(self):
        """Create persona management section"""
        persona_frame = ctk.CTkFrame(self)
        persona_frame.grid(row=1, column=0, sticky="ew", padx=10, pady=5)
        persona_frame.grid_columnconfigure(0, weight=1)
        
        # Section header
        header_container = ctk.CTkFrame(persona_frame, fg_color="transparent")
        header_container.grid(row=0, column=0, sticky="ew", padx=15, pady=(15, 5))
        header_container.grid_columnconfigure(0, weight=1)
        
        personas_label = ctk.CTkLabel(
            header_container,
            text="👥 Personas",
            font=ctk.CTkFont(size=16, weight="bold"),
            anchor="w"
        )
        personas_label.grid(row=0, column=0, sticky="w")
        
        # Create persona button
        create_btn = ctk.CTkButton(
            header_container,
            text="➕",
            width=30,
            height=30,
            command=self._create_persona,
            font=ctk.CTkFont(size=14)
        )
        create_btn.grid(row=0, column=1, sticky="e")
        
        # Personas list
        self.personas_frame = ctk.CTkScrollableFrame(persona_frame, height=200)
        self.personas_frame.grid(row=1, column=0, sticky="ew", padx=10, pady=(5, 15))
        self.personas_frame.grid_columnconfigure(0, weight=1)
    
    def _create_quick_actions(self):
        """Create quick actions section"""
        actions_frame = ctk.CTkFrame(self)
        actions_frame.grid(row=3, column=0, sticky="ew", padx=10, pady=(5, 10))
        actions_frame.grid_columnconfigure(0, weight=1)
        
        # Section header
        actions_label = ctk.CTkLabel(
            actions_frame,
            text="⚡ Quick Actions",
            font=ctk.CTkFont(size=16, weight="bold")
        )
        actions_label.grid(row=0, column=0, pady=(15, 10))
        
        # Action buttons
        actions = [
            ("🎯 Start Training", self._start_training),
            ("🔍 Discover Content", self._start_discovery),
            ("📊 View Analytics", self._view_analytics),
            ("⚙️ Settings", self._open_settings)
        ]
        
        for i, (text, command) in enumerate(actions):
            btn = ctk.CTkButton(
                actions_frame,
                text=text,
                width=250,
                height=35,
                command=command,
                font=ctk.CTkFont(size=12)
            )
            btn.grid(row=i+1, column=0, pady=3, padx=15)
    
    def _refresh_personas(self):
        """Refresh the personas list"""
        try:
            # Clear existing personas
            for widget in self.personas_frame.winfo_children():
                widget.destroy()
            
            # Get all personas
            personas = self.app.get_all_personas()
            current_persona = self.app.get_current_persona()
            
            if not personas:
                # Show empty state
                empty_label = ctk.CTkLabel(
                    self.personas_frame,
                    text="No personas yet.\nClick ➕ to create one!",
                    font=ctk.CTkFont(size=12),
                    text_color=("gray60", "gray40")
                )
                empty_label.grid(row=0, column=0, pady=20)
                return
            
            # Show personas
            for i, persona in enumerate(personas):
                self._create_persona_widget(persona, i, persona == current_persona)
                
        except Exception as e:
            logger.error(f"Error refreshing personas: {e}")
    
    def _create_persona_widget(self, persona: PersonaConfig, row: int, is_current: bool):
        """Create a widget for a single persona"""
        try:
            # Persona container
            container = ctk.CTkFrame(
                self.personas_frame,
                fg_color=("blue", "darkblue") if is_current else ("gray80", "gray20")
            )
            container.grid(row=row, column=0, sticky="ew", pady=2, padx=5)
            container.grid_columnconfigure(0, weight=1)
            
            # Make container clickable
            container.bind("<Button-1>", lambda e, p=persona: self._select_persona(p))
            
            # Persona info frame
            info_frame = ctk.CTkFrame(container, fg_color="transparent")
            info_frame.grid(row=0, column=0, sticky="ew", padx=10, pady=8)
            info_frame.grid_columnconfigure(0, weight=1)
            
            # Persona name
            name_label = ctk.CTkLabel(
                info_frame,
                text=f"👤 {persona.name}",
                font=ctk.CTkFont(size=14, weight="bold" if is_current else "normal"),
                anchor="w",
                text_color="white" if is_current else None
            )
            name_label.grid(row=0, column=0, sticky="w")
            name_label.bind("<Button-1>", lambda e, p=persona: self._select_persona(p))
            
            # Persona description (truncated)
            desc_text = persona.description[:40] + "..." if len(persona.description) > 40 else persona.description
            desc_label = ctk.CTkLabel(
                info_frame,
                text=desc_text,
                font=ctk.CTkFont(size=11),
                anchor="w",
                text_color=("gray90", "gray90") if is_current else ("gray60", "gray40")
            )
            desc_label.grid(row=1, column=0, sticky="w")
            desc_label.bind("<Button-1>", lambda e, p=persona: self._select_persona(p))
            
            # Status indicators
            stats = self.app.get_persona_statistics(persona.id)
            status_indicators = []
            
            if stats.get("total_files", 0) > 0:
                status_indicators.append(f"📁{stats['total_files']}")
            
            if stats.get("discovered_content_count", 0) > 0:
                status_indicators.append(f"🔍{stats['discovered_content_count']}")
            
            if status_indicators:
                status_text = " ".join(status_indicators)
                status_label = ctk.CTkLabel(
                    info_frame,
                    text=status_text,
                    font=ctk.CTkFont(size=10),
                    anchor="w",
                    text_color=("gray90", "gray90") if is_current else ("gray50", "gray50")
                )
                status_label.grid(row=2, column=0, sticky="w")
                status_label.bind("<Button-1>", lambda e, p=persona: self._select_persona(p))
            
            # Current indicator
            if is_current:
                current_indicator = ctk.CTkLabel(
                    info_frame,
                    text="●",
                    font=ctk.CTkFont(size=16),
                    text_color="lightgreen"
                )
                current_indicator.grid(row=0, column=1, sticky="e")
                current_indicator.bind("<Button-1>", lambda e, p=persona: self._select_persona(p))
            
        except Exception as e:
            logger.error(f"Error creating persona widget: {e}")
    
    def _select_persona(self, persona: PersonaConfig):
        """Select a persona"""
        try:
            if self.app.switch_persona(persona.id):
                self._refresh_personas()
                
                # Notify parent window
                if hasattr(self.parent, 'on_persona_switched'):
                    self.parent.on_persona_switched(persona)
                    
        except Exception as e:
            logger.error(f"Error selecting persona: {e}")
    
    def _create_persona(self):
        """Create a new persona"""
        try:
            # Call parent method to show persona creator
            if hasattr(self.parent, '_show_persona_creator'):
                self.parent._show_persona_creator()
                
        except Exception as e:
            logger.error(f"Error creating persona: {e}")
    
    def _start_training(self):
        """Start training for current persona"""
        try:
            current_persona = self.app.get_current_persona()
            if current_persona:
                # Switch to training view
                if hasattr(self.parent, '_switch_view'):
                    self.parent._switch_view('training')
            else:
                self._show_no_persona_message()
                
        except Exception as e:
            logger.error(f"Error starting training: {e}")
    
    def _start_discovery(self):
        """Start content discovery for current persona"""
        try:
            current_persona = self.app.get_current_persona()
            if current_persona:
                # Start discovery in background
                future = self.app.start_content_discovery(current_persona.id)
                if future:
                    self.parent.set_status(f"Starting content discovery for {current_persona.name}...")
                
                # Switch to discovery view
                if hasattr(self.parent, '_switch_view'):
                    self.parent._switch_view('discovery')
            else:
                self._show_no_persona_message()
                
        except Exception as e:
            logger.error(f"Error starting discovery: {e}")
    
    def _view_analytics(self):
        """View analytics for current persona"""
        try:
            # Switch to analytics view
            if hasattr(self.parent, '_switch_view'):
                self.parent._switch_view('analytics')
                
        except Exception as e:
            logger.error(f"Error viewing analytics: {e}")
    
    def _open_settings(self):
        """Open settings window"""
        try:
            # This would open a settings window
            logger.info("Settings window would open here")
            
        except Exception as e:
            logger.error(f"Error opening settings: {e}")
    
    def _show_no_persona_message(self):
        """Show message when no persona is selected"""
        import tkinter.messagebox as messagebox
        messagebox.showinfo(
            "No Persona Selected",
            "Please create or select a persona first."
        )
    
    def refresh(self):
        """Refresh the sidebar content"""
        self._refresh_personas()