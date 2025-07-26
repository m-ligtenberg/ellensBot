import customtkinter as ctk
import tkinter as tk
from tkinter import messagebox
from typing import List, Dict, Any
from ..utils.logger import logger

class PersonaCreatorWindow(ctk.CTkToplevel):
    """Window for creating new AI personas"""
    
    def __init__(self, parent, app):
        super().__init__(parent)
        
        self.app = app
        self.parent = parent
        self.form_fields = {}
        
        # Configure window
        self.title("Create New AI Persona")
        self.geometry("700x800")
        self.transient(parent)
        
        # Configure grid
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(1, weight=1)
        
        self._create_header()
        self._create_form()
        self._create_buttons()
        
        # Center window
        self._center_window()
        
        logger.info("Persona creator window opened")
    
    def _center_window(self):
        """Center the window on the parent"""
        self.update_idletasks()
        x = (self.winfo_screenwidth() // 2) - (700 // 2)
        y = (self.winfo_screenheight() // 2) - (800 // 2)
        self.geometry(f"700x800+{x}+{y}")
    
    def _create_header(self):
        """Create window header"""
        header_frame = ctk.CTkFrame(self)
        header_frame.grid(row=0, column=0, sticky="ew", padx=20, pady=(20, 10))
        
        title_label = ctk.CTkLabel(
            header_frame,
            text="🎭 Create AI Persona",
            font=ctk.CTkFont(size=24, weight="bold")
        )
        title_label.pack(pady=20)
        
        subtitle_label = ctk.CTkLabel(
            header_frame,
            text="Define your AI persona's personality, knowledge, and characteristics",
            font=ctk.CTkFont(size=14),
            text_color=("gray60", "gray40")
        )
        subtitle_label.pack(pady=(0, 10))
    
    def _create_form(self):
        """Create the persona creation form"""
        # Scrollable frame for form
        self.form_frame = ctk.CTkScrollableFrame(self)
        self.form_frame.grid(row=1, column=0, sticky="nsew", padx=20, pady=10)
        self.form_frame.grid_columnconfigure(1, weight=1)
        
        current_row = 0
        
        # Basic Information Section
        self._create_section_header("📝 Basic Information", current_row)
        current_row += 1
        
        # Name
        current_row = self._create_text_field(
            "Name*", "persona_name", "e.g., Alex the Tech Expert", current_row
        )
        
        # Description
        current_row = self._create_textarea_field(
            "Description*", "persona_description", 
            "Describe your persona's background, role, and expertise...", current_row
        )
        
        # Personality Section
        current_row += 1
        self._create_section_header("🎭 Personality", current_row)
        current_row += 1
        
        # Personality Traits
        current_row = self._create_tags_field(
            "Personality Traits*", "personality_traits",
            "e.g., friendly, analytical, creative, humorous", current_row,
            "Enter traits separated by commas"
        )
        
        # Communication Style
        current_row = self._create_dropdown_field(
            "Communication Style*", "communication_style",
            ["Professional", "Casual", "Friendly", "Formal", "Humorous", "Technical"], current_row
        )
        
        # Knowledge Section
        current_row += 1
        self._create_section_header("🧠 Knowledge & Expertise", current_row)
        current_row += 1
        
        # Knowledge Domains
        current_row = self._create_tags_field(
            "Knowledge Domains*", "knowledge_domains",
            "e.g., technology, science, business, arts", current_row,
            "Enter domains separated by commas"
        )
        
        # Discovery Preferences Section
        current_row += 1
        self._create_section_header("🔍 Content Discovery", current_row)
        current_row += 1
        
        # Content Types
        current_row = self._create_checkbox_group(
            "Preferred Content Types", "content_types",
            ["News Articles", "Blog Posts", "Research Papers", "Social Media", "Videos", "Podcasts"],
            current_row
        )
        
        # Update Frequency
        current_row = self._create_dropdown_field(
            "Content Update Frequency", "update_frequency",
            ["Hourly", "Daily", "Weekly", "Manual"], current_row,
            default_value="Daily"
        )
        
        # Source Keywords
        current_row = self._create_tags_field(
            "Source Keywords", "source_keywords",
            "Keywords to help discover relevant content sources", current_row,
            "Enter keywords separated by commas (optional)"
        )
    
    def _create_section_header(self, title: str, row: int):
        """Create a section header"""
        header_label = ctk.CTkLabel(
            self.form_frame,
            text=title,
            font=ctk.CTkFont(size=16, weight="bold"),
            anchor="w"
        )
        header_label.grid(row=row, column=0, columnspan=2, sticky="w", pady=(20, 10), padx=10)
    
    def _create_text_field(self, label: str, field_id: str, placeholder: str, row: int) -> int:
        """Create a text input field"""
        # Label
        label_widget = ctk.CTkLabel(
            self.form_frame,
            text=label,
            font=ctk.CTkFont(size=14),
            anchor="w"
        )
        label_widget.grid(row=row, column=0, sticky="w", padx=(10, 5), pady=5)
        
        # Entry
        entry = ctk.CTkEntry(
            self.form_frame,
            placeholder_text=placeholder,
            font=ctk.CTkFont(size=12),
            height=35
        )
        entry.grid(row=row, column=1, sticky="ew", padx=(5, 10), pady=5)
        
        # Store reference
        self.form_fields[field_id] = entry
        
        return row + 1
    
    def _create_textarea_field(self, label: str, field_id: str, placeholder: str, row: int) -> int:
        """Create a textarea field"""
        # Label
        label_widget = ctk.CTkLabel(
            self.form_frame,
            text=label,
            font=ctk.CTkFont(size=14),
            anchor="w"
        )
        label_widget.grid(row=row, column=0, sticky="nw", padx=(10, 5), pady=5)
        
        # Textbox
        textbox = ctk.CTkTextbox(
            self.form_frame,
            height=100,
            font=ctk.CTkFont(size=12)
        )
        textbox.grid(row=row, column=1, sticky="ew", padx=(5, 10), pady=5)
        textbox.insert("1.0", placeholder)
        textbox.bind("<FocusIn>", lambda e: self._clear_placeholder(textbox, placeholder))
        
        # Store reference
        self.form_fields[field_id] = textbox
        
        return row + 1
    
    def _create_dropdown_field(self, label: str, field_id: str, options: List[str], row: int, default_value: str = None) -> int:
        """Create a dropdown field"""
        # Label
        label_widget = ctk.CTkLabel(
            self.form_frame,
            text=label,
            font=ctk.CTkFont(size=14),
            anchor="w"
        )
        label_widget.grid(row=row, column=0, sticky="w", padx=(10, 5), pady=5)
        
        # Dropdown
        dropdown = ctk.CTkOptionMenu(
            self.form_frame,
            values=options,
            font=ctk.CTkFont(size=12),
            height=35
        )
        dropdown.grid(row=row, column=1, sticky="ew", padx=(5, 10), pady=5)
        
        if default_value and default_value in options:
            dropdown.set(default_value)
        
        # Store reference
        self.form_fields[field_id] = dropdown
        
        return row + 1
    
    def _create_tags_field(self, label: str, field_id: str, placeholder: str, row: int, help_text: str = None) -> int:
        """Create a tags input field"""
        # Label
        label_widget = ctk.CTkLabel(
            self.form_frame,
            text=label,
            font=ctk.CTkFont(size=14),
            anchor="w"
        )
        label_widget.grid(row=row, column=0, sticky="w", padx=(10, 5), pady=5)
        
        # Container for entry and help
        container = ctk.CTkFrame(self.form_frame, fg_color="transparent")
        container.grid(row=row, column=1, sticky="ew", padx=(5, 10), pady=5)
        container.grid_columnconfigure(0, weight=1)
        
        # Entry
        entry = ctk.CTkEntry(
            container,
            placeholder_text=placeholder,
            font=ctk.CTkFont(size=12),
            height=35
        )
        entry.grid(row=0, column=0, sticky="ew")
        
        # Help text
        if help_text:
            help_label = ctk.CTkLabel(
                container,
                text=help_text,
                font=ctk.CTkFont(size=10),
                text_color=("gray60", "gray40"),
                anchor="w"
            )
            help_label.grid(row=1, column=0, sticky="w", pady=(2, 0))
        
        # Store reference
        self.form_fields[field_id] = entry
        
        return row + 1
    
    def _create_checkbox_group(self, label: str, field_id: str, options: List[str], row: int) -> int:
        """Create a group of checkboxes"""
        # Label
        label_widget = ctk.CTkLabel(
            self.form_frame,
            text=label,
            font=ctk.CTkFont(size=14),
            anchor="w"
        )
        label_widget.grid(row=row, column=0, sticky="nw", padx=(10, 5), pady=5)
        
        # Checkbox container
        checkbox_frame = ctk.CTkFrame(self.form_frame, fg_color="transparent")
        checkbox_frame.grid(row=row, column=1, sticky="ew", padx=(5, 10), pady=5)
        checkbox_frame.grid_columnconfigure(0, weight=1)
        
        # Create checkboxes
        checkboxes = {}
        for i, option in enumerate(options):
            var = ctk.BooleanVar()
            checkbox = ctk.CTkCheckBox(
                checkbox_frame,
                text=option,
                variable=var,
                font=ctk.CTkFont(size=12)
            )
            checkbox.grid(row=i//2, column=i%2, sticky="w", padx=5, pady=2)
            checkboxes[option] = var
        
        # Store reference
        self.form_fields[field_id] = checkboxes
        
        return row + 1
    
    def _clear_placeholder(self, textbox, placeholder):
        """Clear placeholder text on focus"""
        current_text = textbox.get("1.0", "end-1c")
        if current_text == placeholder:
            textbox.delete("1.0", "end")
    
    def _create_buttons(self):
        """Create action buttons"""
        button_frame = ctk.CTkFrame(self)
        button_frame.grid(row=2, column=0, sticky="ew", padx=20, pady=20)
        button_frame.grid_columnconfigure(1, weight=1)
        
        # Cancel button
        cancel_button = ctk.CTkButton(
            button_frame,
            text="Cancel",
            command=self.destroy,
            fg_color="gray",
            hover_color="darkgray",
            width=100
        )
        cancel_button.grid(row=0, column=0, padx=(0, 10), pady=10)
        
        # Create button
        create_button = ctk.CTkButton(
            button_frame,
            text="🎭 Create Persona",
            command=self._create_persona,
            font=ctk.CTkFont(size=14, weight="bold"),
            width=150
        )
        create_button.grid(row=0, column=2, padx=(10, 0), pady=10)
    
    def _create_persona(self):
        """Create the persona with form data"""
        try:
            # Validate and collect form data
            form_data = self._collect_form_data()
            
            if not self._validate_form_data(form_data):
                return
            
            # Create source preferences from form data
            source_preferences = {
                "content_types": form_data.get("content_types", []),
                "update_frequency": form_data.get("update_frequency", "daily"),
                "keywords": form_data.get("source_keywords", [])
            }
            
            # Create the persona
            persona = self.app.create_persona(
                name=form_data["name"],
                description=form_data["description"],
                personality_traits=form_data["personality_traits"],
                communication_style=form_data["communication_style"],
                knowledge_domains=form_data["knowledge_domains"],
                source_preferences=source_preferences
            )
            
            if persona:
                messagebox.showinfo(
                    "Success",
                    f"Persona '{persona.name}' created successfully!"
                )
                
                # Notify parent
                if hasattr(self.parent, 'on_persona_created'):
                    self.parent.on_persona_created(persona)
                
                # Refresh sidebar
                if hasattr(self.parent, 'sidebar'):
                    self.parent.sidebar.refresh()
                
                self.destroy()
            else:
                messagebox.showerror(
                    "Error",
                    "Failed to create persona. Please try again."
                )
                
        except Exception as e:
            logger.error(f"Error creating persona: {e}")
            messagebox.showerror(
                "Error",
                f"An error occurred while creating the persona: {str(e)}"
            )
    
    def _collect_form_data(self) -> Dict[str, Any]:
        """Collect data from all form fields"""
        data = {}
        
        # Text fields
        for field_id in ["persona_name", "communication_style", "update_frequency"]:
            if field_id in self.form_fields:
                widget = self.form_fields[field_id]
                if hasattr(widget, 'get'):
                    data[field_id.replace("persona_", "")] = widget.get().strip()
        
        # Textarea fields
        for field_id in ["persona_description"]:
            if field_id in self.form_fields:
                widget = self.form_fields[field_id]
                if hasattr(widget, 'get'):
                    content = widget.get("1.0", "end-1c").strip()
                    # Remove placeholder text if present
                    if not content or "Describe your persona" in content:
                        content = ""
                    data[field_id.replace("persona_", "")] = content
        
        # Tags fields (comma-separated)
        for field_id in ["personality_traits", "knowledge_domains", "source_keywords"]:
            if field_id in self.form_fields:
                widget = self.form_fields[field_id]
                if hasattr(widget, 'get'):
                    text = widget.get().strip()
                    if text:
                        # Split by comma and clean up
                        items = [item.strip() for item in text.split(',') if item.strip()]
                        data[field_id] = items
                    else:
                        data[field_id] = []
        
        # Checkbox groups
        if "content_types" in self.form_fields:
            checkboxes = self.form_fields["content_types"]
            selected = [option for option, var in checkboxes.items() if var.get()]
            data["content_types"] = selected
        
        return data
    
    def _validate_form_data(self, data: Dict[str, Any]) -> bool:
        """Validate form data"""
        # Required fields
        required_fields = {
            "name": "Name",
            "description": "Description",
            "personality_traits": "Personality Traits",
            "communication_style": "Communication Style",
            "knowledge_domains": "Knowledge Domains"
        }
        
        for field, display_name in required_fields.items():
            if field not in data or not data[field]:
                messagebox.showerror(
                    "Validation Error",
                    f"{display_name} is required."
                )
                return False
            
            # Special validation for list fields
            if isinstance(data[field], list) and len(data[field]) == 0:
                messagebox.showerror(
                    "Validation Error",
                    f"{display_name} must have at least one item."
                )
                return False
        
        # Name length validation
        if len(data["name"]) < 2:
            messagebox.showerror(
                "Validation Error",
                "Name must be at least 2 characters long."
            )
            return False
        
        # Description length validation
        if len(data["description"]) < 10:
            messagebox.showerror(
                "Validation Error",
                "Description must be at least 10 characters long."
            )
            return False
        
        return True