import customtkinter as ctk
import tkinter as tk
from tkinter import filedialog, messagebox
from typing import Callable
from ..utils.logger import logger
from ..utils.config import config

class VoiceSettingsWindow:
    """Voice settings configuration window"""
    
    def __init__(self, parent, chatbot, on_settings_changed: Callable = None):
        self.parent = parent
        self.chatbot = chatbot
        self.on_settings_changed = on_settings_changed
        self.window = None
    
    def show(self):
        """Show voice settings window"""
        if self.window and self.window.winfo_exists():
            self.window.lift()
            return
        
        self.window = ctk.CTkToplevel(self.parent)
        self.window.title("Voice Settings - Young Ellens")
        self.window.geometry("700x800")
        self.window.transient(self.parent)
        self.window.grab_set()
        
        self._create_ui()
        self._load_current_settings()
        
        # Center the window
        self.window.update_idletasks()
        x = (self.window.winfo_screenwidth() // 2) - (700 // 2)
        y = (self.window.winfo_screenheight() // 2) - (800 // 2)
        self.window.geometry(f"700x800+{x}+{y}")
    
    def _create_ui(self):
        """Create voice settings UI"""
        # Configure grid
        self.window.grid_columnconfigure(0, weight=1)
        self.window.grid_rowconfigure(1, weight=1)
        
        # Header
        header_frame = ctk.CTkFrame(self.window)
        header_frame.grid(row=0, column=0, sticky="ew", padx=20, pady=(20, 10))
        
        title_label = ctk.CTkLabel(
            header_frame,
            text="🎤 Voice Settings",
            font=ctk.CTkFont(size=24, weight="bold")
        )
        title_label.pack(pady=20)
        
        # Scrollable content
        self.scroll_frame = ctk.CTkScrollableFrame(self.window)
        self.scroll_frame.grid(row=1, column=0, sticky="nsew", padx=20, pady=10)
        self.scroll_frame.grid_columnconfigure(0, weight=1)
        
        self._create_general_section()
        self._create_model_section()
        self._create_training_section()
        self._create_status_section()
        
        # Buttons
        button_frame = ctk.CTkFrame(self.window)
        button_frame.grid(row=2, column=0, sticky="ew", padx=20, pady=20)
        button_frame.grid_columnconfigure(1, weight=1)
        
        save_button = ctk.CTkButton(
            button_frame,
            text="Save Settings",
            command=self._save_settings,
            font=ctk.CTkFont(size=14, weight="bold")
        )
        save_button.grid(row=0, column=0, padx=(0, 10), pady=10)
        
        test_button = ctk.CTkButton(
            button_frame,
            text="Test Voice",
            command=self._test_voice,
            fg_color="orange",
            hover_color="darkorange"
        )
        test_button.grid(row=0, column=1, padx=5, pady=10)
        
        close_button = ctk.CTkButton(
            button_frame,
            text="Close",
            command=self.window.destroy,
            fg_color="gray",
            hover_color="darkgray"
        )
        close_button.grid(row=0, column=2, padx=(10, 0), pady=10)
    
    def _create_general_section(self):
        """Create general voice settings"""
        general_frame = ctk.CTkFrame(self.scroll_frame)
        general_frame.grid(row=0, column=0, sticky="ew", pady=(0, 15))
        general_frame.grid_columnconfigure(1, weight=1)
        
        general_title = ctk.CTkLabel(
            general_frame,
            text="General Settings",
            font=ctk.CTkFont(size=18, weight="bold")
        )
        general_title.grid(row=0, column=0, columnspan=2, padx=20, pady=(20, 10), sticky="w")
        
        # Voice enabled checkbox
        self.voice_enabled_var = ctk.BooleanVar()
        voice_checkbox = ctk.CTkCheckBox(
            general_frame,
            text="Enable Voice Responses",
            variable=self.voice_enabled_var,
            font=ctk.CTkFont(size=14)
        )
        voice_checkbox.grid(row=1, column=0, columnspan=2, padx=20, pady=10, sticky="w")
        
        # Voice speed
        speed_label = ctk.CTkLabel(general_frame, text="Voice Speed:", font=ctk.CTkFont(size=14))
        speed_label.grid(row=2, column=0, padx=(20, 10), pady=10, sticky="w")
        
        self.speed_slider = ctk.CTkSlider(
            general_frame,
            from_=0.5,
            to=2.0,
            number_of_steps=15
        )
        self.speed_slider.grid(row=2, column=1, padx=(0, 20), pady=10, sticky="ew")
        
        self.speed_value_label = ctk.CTkLabel(
            general_frame,
            text="1.0x",
            font=ctk.CTkFont(size=12)
        )
        self.speed_value_label.grid(row=3, column=1, padx=(0, 20), sticky="w")
        
        # Bind speed slider
        self.speed_slider.configure(command=self._update_speed_label)
    
    def _create_model_section(self):
        """Create voice model section"""
        model_frame = ctk.CTkFrame(self.scroll_frame)
        model_frame.grid(row=1, column=0, sticky="ew", pady=(0, 15))
        model_frame.grid_columnconfigure(1, weight=1)
        
        model_title = ctk.CTkLabel(
            model_frame,
            text="Voice Models",
            font=ctk.CTkFont(size=18, weight="bold")
        )
        model_title.grid(row=0, column=0, columnspan=2, padx=20, pady=(20, 10), sticky="w")
        
        # Current model
        current_label = ctk.CTkLabel(model_frame, text="Current Model:", font=ctk.CTkFont(size=14))
        current_label.grid(row=1, column=0, padx=(20, 10), pady=10, sticky="w")
        
        self.current_model_label = ctk.CTkLabel(
            model_frame,
            text="Loading...",
            font=ctk.CTkFont(size=12),
            text_color=("gray60", "gray40")
        )
        self.current_model_label.grid(row=1, column=1, padx=(0, 20), pady=10, sticky="w")
        
        # Model selection
        models_label = ctk.CTkLabel(model_frame, text="Available Models:", font=ctk.CTkFont(size=14))
        models_label.grid(row=2, column=0, padx=(20, 10), pady=(10, 5), sticky="nw")
        
        # Models listbox
        self.models_frame = ctk.CTkScrollableFrame(model_frame, height=150)
        self.models_frame.grid(row=2, column=1, padx=(0, 20), pady=10, sticky="ew")
        
        # Load model button
        load_model_button = ctk.CTkButton(
            model_frame,
            text="Load Selected Model",
            command=self._load_selected_model,
            width=150
        )
        load_model_button.grid(row=3, column=1, padx=(0, 20), pady=10, sticky="w")
    
    def _create_training_section(self):
        """Create voice training section"""
        training_frame = ctk.CTkFrame(self.scroll_frame)
        training_frame.grid(row=2, column=0, sticky="ew", pady=(0, 15))
        training_frame.grid_columnconfigure(1, weight=1)
        
        training_title = ctk.CTkLabel(
            training_frame,
            text="Young Ellens Voice Training",
            font=ctk.CTkFont(size=18, weight="bold")
        )
        training_title.grid(row=0, column=0, columnspan=2, padx=20, pady=(20, 10), sticky="w")
        
        # Instructions
        instructions = ctk.CTkLabel(
            training_frame,
            text="Upload audio samples to train Young Ellens' voice for more authentic responses.\nRecommended: 10-30 seconds of clear speech in WAV format.",
            font=ctk.CTkFont(size=12),
            text_color=("gray60", "gray40"),
            justify="left"
        )
        instructions.grid(row=1, column=0, columnspan=2, padx=20, pady=10, sticky="w")
        
        # Reference audio upload
        upload_button = ctk.CTkButton(
            training_frame,
            text="📁 Upload Reference Audio",
            command=self._upload_reference_audio,
            width=200
        )
        upload_button.grid(row=2, column=0, padx=20, pady=10, sticky="w")
        
        self.reference_path_label = ctk.CTkLabel(
            training_frame,
            text="No file selected",
            font=ctk.CTkFont(size=12),
            text_color=("gray60", "gray40")
        )
        self.reference_path_label.grid(row=2, column=1, padx=(0, 20), pady=10, sticky="w")
        
        # Train button
        train_button = ctk.CTkButton(
            training_frame,
            text="🎯 Train Voice Model",
            command=self._train_voice_model,
            fg_color="purple",
            hover_color="darkmagenta",
            width=200
        )
        train_button.grid(row=3, column=0, padx=20, pady=(10, 20), sticky="w")
        
        # Training progress
        self.training_progress = ctk.CTkProgressBar(training_frame)
        self.training_progress.grid(row=4, column=0, columnspan=2, padx=20, pady=(0, 20), sticky="ew")
        self.training_progress.set(0)
    
    def _create_status_section(self):
        """Create voice system status"""
        status_frame = ctk.CTkFrame(self.scroll_frame)
        status_frame.grid(row=3, column=0, sticky="ew", pady=(0, 15))
        status_frame.grid_columnconfigure(0, weight=1)
        
        status_title = ctk.CTkLabel(
            status_frame,
            text="Voice System Status",
            font=ctk.CTkFont(size=18, weight="bold")
        )
        status_title.grid(row=0, column=0, padx=20, pady=(20, 10), sticky="w")
        
        # Status display
        self.status_text = ctk.CTkTextbox(
            status_frame,
            height=200,
            font=ctk.CTkFont(size=12)
        )
        self.status_text.grid(row=1, column=0, padx=20, pady=(0, 10), sticky="ew")
        
        # Refresh button
        refresh_button = ctk.CTkButton(
            status_frame,
            text="🔄 Refresh Status",
            command=self._refresh_status
        )
        refresh_button.grid(row=2, column=0, padx=20, pady=(0, 20))
    
    def _load_current_settings(self):
        """Load current voice settings"""
        # Load voice enabled
        self.voice_enabled_var.set(config.get("voice.enabled", False))
        
        # Load voice speed
        speed = config.get("voice.speed", 1.0)
        self.speed_slider.set(speed)
        self._update_speed_label(speed)
        
        # Load models
        self._refresh_models()
        
        # Load status
        self._refresh_status()
    
    def _update_speed_label(self, value):
        """Update speed value label"""
        self.speed_value_label.configure(text=f"{float(value):.1f}x")
    
    def _refresh_models(self):
        """Refresh available models list"""
        try:
            # Clear existing models
            for widget in self.models_frame.winfo_children():
                widget.destroy()
            
            # Get available models
            models = self.chatbot.get_available_voice_models()
            
            # Create radio buttons for models
            self.model_var = ctk.StringVar()
            current_model = None
            
            for i, model in enumerate(models):
                model_name = model["name"]
                model_path = model["path"]
                is_loaded = model["is_loaded"]
                model_type = model["type"]
                supports_cloning = model["supports_cloning"]
                
                if is_loaded:
                    current_model = model_path
                    self.current_model_label.configure(text=model_name)
                
                # Create frame for model info
                model_frame = ctk.CTkFrame(self.models_frame)
                model_frame.grid(row=i, column=0, sticky="ew", pady=2, padx=5)
                model_frame.grid_columnconfigure(1, weight=1)
                
                # Radio button
                radio = ctk.CTkRadioButton(
                    model_frame,
                    text="",
                    variable=self.model_var,
                    value=model_path
                )
                radio.grid(row=0, column=0, padx=5, pady=5)
                
                # Model info
                info_text = f"{model_name}"
                if model_type == "custom":
                    info_text += " (Custom)"
                if supports_cloning:
                    info_text += " (Supports Cloning)"
                if is_loaded:
                    info_text += " (Current)"
                
                info_label = ctk.CTkLabel(
                    model_frame,
                    text=info_text,
                    font=ctk.CTkFont(size=12),
                    anchor="w"
                )
                info_label.grid(row=0, column=1, padx=5, pady=5, sticky="ew")
            
            if current_model:
                self.model_var.set(current_model)
            
        except Exception as e:
            logger.error(f"Error refreshing models: {e}")
    
    def _load_selected_model(self):
        """Load selected voice model"""
        try:
            selected_model = self.model_var.get()
            if not selected_model:
                messagebox.showwarning("Warning", "Please select a model first.")
                return
            
            success = self.chatbot.load_voice_model(selected_model)
            if success:
                messagebox.showinfo("Success", "Voice model loaded successfully!")
                self._refresh_models()
                self._refresh_status()
            else:
                messagebox.showerror("Error", "Failed to load voice model.")
        except Exception as e:
            messagebox.showerror("Error", f"Model loading failed: {str(e)}")
    
    def _upload_reference_audio(self):
        """Upload reference audio for training"""
        try:
            file_path = filedialog.askopenfilename(
                title="Select Reference Audio",
                filetypes=[
                    ("Audio files", "*.wav *.mp3 *.m4a *.flac"),
                    ("WAV files", "*.wav"),
                    ("MP3 files", "*.mp3"),
                    ("All files", "*.*")
                ]
            )
            
            if file_path:
                # Show shortened path
                short_path = "..." + file_path[-40:] if len(file_path) > 40 else file_path
                self.reference_path_label.configure(text=short_path)
                self.reference_audio_path = file_path
        except Exception as e:
            messagebox.showerror("Error", f"File selection failed: {str(e)}")
    
    def _train_voice_model(self):
        """Train Young Ellens voice model"""
        try:
            if not hasattr(self, 'reference_audio_path'):
                messagebox.showwarning("Warning", "Please upload reference audio first.")
                return
            
            # Show progress
            self.training_progress.set(0.1)
            self.window.update()
            
            result = messagebox.askyesno(
                "Train Voice Model",
                "This will train Young Ellens' voice using the uploaded audio.\\n\\nThis may take several minutes. Continue?"
            )
            
            if not result:
                self.training_progress.set(0)
                return
            
            # Simulate training progress
            for progress in [0.2, 0.4, 0.6, 0.8]:
                self.training_progress.set(progress)
                self.window.update()
                import time
                time.sleep(0.5)
            
            # Train the model
            success = self.chatbot.train_young_ellens_voice(self.reference_audio_path)
            
            self.training_progress.set(1.0)
            
            if success:
                messagebox.showinfo("Success", "Voice model trained successfully!\\n\\nYoung Ellens now has a custom voice.")
                self._refresh_models()
                self._refresh_status()
            else:
                messagebox.showerror("Error", "Voice training failed. Check logs for details.")
            
            self.training_progress.set(0)
            
        except Exception as e:
            self.training_progress.set(0)
            messagebox.showerror("Error", f"Training failed: {str(e)}")
    
    def _test_voice(self):
        """Test voice synthesis"""
        try:
            success = self.chatbot.test_voice_synthesis()
            if not success:
                messagebox.showwarning("Warning", "Voice test failed. Check that voice is enabled and a model is loaded.")
        except Exception as e:
            messagebox.showerror("Error", f"Voice test failed: {str(e)}")
    
    def _refresh_status(self):
        """Refresh voice system status"""
        try:
            status = self.chatbot.get_voice_status()
            
            status_text = f"""Voice System Status:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎤 Voice Enabled: {'✅ Yes' if status['voice_enabled'] else '❌ No'}
🔧 TTS Available: {'✅ Yes' if status['tts_available'] else '❌ No'}
🔊 Audio Available: {'✅ Yes' if status['audio_available'] else '❌ No'}
⚙️ Engine Loaded: {'✅ Yes' if status['engine_loaded'] else '❌ No'}
🎭 Supports Cloning: {'✅ Yes' if status['supports_cloning'] else '❌ No'}

Current Configuration:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📀 Current Model: {status.get('current_model', 'None')}
📊 Available Models: {status.get('available_models', 0)}
🎯 Young Ellens Model: {'✅ Available' if status.get('young_ellens_model') else '❌ Not Available'}

Installation Notes:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

To enable voice features, install:
pip install TTS torch torchaudio soundfile librosa pygame

For voice cloning, upload 10-30 seconds of clear audio
and train the Young Ellens model.
"""
            
            self.status_text.delete("1.0", "end")
            self.status_text.insert("1.0", status_text)
            
        except Exception as e:
            logger.error(f"Error refreshing voice status: {e}")
            self.status_text.delete("1.0", "end")
            self.status_text.insert("1.0", f"Error loading status: {str(e)}")
    
    def _save_settings(self):
        """Save voice settings"""
        try:
            # Save voice enabled
            voice_enabled = self.voice_enabled_var.get()
            self.chatbot.set_voice_enabled(voice_enabled)
            
            # Save voice speed
            speed = self.speed_slider.get()
            config.set("voice.speed", speed)
            self.chatbot.voice_engine.set_voice_settings(speed=speed)
            
            # Notify about changes
            if self.on_settings_changed:
                self.on_settings_changed()
            
            messagebox.showinfo("Success", "Voice settings saved successfully!")
            logger.info("Voice settings saved")
            
        except Exception as e:
            logger.error(f"Error saving voice settings: {e}")
            messagebox.showerror("Error", f"Failed to save settings: {str(e)}")