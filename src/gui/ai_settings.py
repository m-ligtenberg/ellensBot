import customtkinter as ctk
import tkinter as tk
from tkinter import messagebox, filedialog
from typing import Callable
from ..utils.logger import logger
from ..utils.config import config

class AISettingsWindow:
    """AI Settings configuration window"""
    
    def __init__(self, parent, chatbot, on_settings_changed: Callable = None):
        self.parent = parent
        self.chatbot = chatbot
        self.on_settings_changed = on_settings_changed
        self.window = None
        
    def show(self):
        """Show AI settings window"""
        if self.window and self.window.winfo_exists():
            self.window.lift()
            return
        
        self.window = ctk.CTkToplevel(self.parent)
        self.window.title("AI Settings - Young Ellens")
        self.window.geometry("650x800")
        self.window.transient(self.parent)
        self.window.grab_set()
        
        self._create_ui()
        self._load_current_settings()
        
        # Center the window
        self.window.update_idletasks()
        x = (self.window.winfo_screenwidth() // 2) - (650 // 2)
        y = (self.window.winfo_screenheight() // 2) - (800 // 2)
        self.window.geometry(f"650x800+{x}+{y}")
    
    def _create_ui(self):
        """Create AI settings UI"""
        # Configure grid
        self.window.grid_columnconfigure(0, weight=1)
        self.window.grid_rowconfigure(1, weight=1)
        
        # Header
        header_frame = ctk.CTkFrame(self.window)
        header_frame.grid(row=0, column=0, sticky="ew", padx=20, pady=(20, 10))
        
        title_label = ctk.CTkLabel(
            header_frame,
            text="🤖 AI Settings",
            font=ctk.CTkFont(size=24, weight="bold")
        )
        title_label.pack(pady=20)
        
        # Scrollable content
        self.scroll_frame = ctk.CTkScrollableFrame(self.window)
        self.scroll_frame.grid(row=1, column=0, sticky="nsew", padx=20, pady=10)
        self.scroll_frame.grid_columnconfigure(0, weight=1)
        
        self._create_mode_section()
        self._create_openai_section()
        self._create_personality_section()
        self._create_ml_section()
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
        
        close_button = ctk.CTkButton(
            button_frame,
            text="Close",
            command=self.window.destroy,
            fg_color="gray",
            hover_color="darkgray"
        )
        close_button.grid(row=0, column=2, padx=(10, 0), pady=10)
    
    def _create_mode_section(self):
        """Create response mode section"""
        mode_frame = ctk.CTkFrame(self.scroll_frame)
        mode_frame.grid(row=0, column=0, sticky="ew", pady=(0, 15))
        mode_frame.grid_columnconfigure(0, weight=1)
        
        mode_title = ctk.CTkLabel(
            mode_frame,
            text="Response Mode",
            font=ctk.CTkFont(size=18, weight="bold")
        )
        mode_title.grid(row=0, column=0, padx=20, pady=(20, 10), sticky="w")
        
        # Mode selection
        self.mode_var = ctk.StringVar(value="hybrid")
        
        modes = [
            ("Local Only", "local", "Use only built-in responses (fastest, no API needed)"),
            ("AI Only", "ai", "Use only OpenAI API (requires API key)"),
            ("Hybrid", "hybrid", "Combine AI, ML, and local responses (recommended)")
        ]
        
        for i, (label, value, desc) in enumerate(modes):
            radio = ctk.CTkRadioButton(
                mode_frame,
                text=label,
                variable=self.mode_var,
                value=value,
                font=ctk.CTkFont(size=14)
            )
            radio.grid(row=i+1, column=0, padx=40, pady=5, sticky="w")
            
            desc_label = ctk.CTkLabel(
                mode_frame,
                text=desc,
                font=ctk.CTkFont(size=12),
                text_color=("gray60", "gray40")
            )
            desc_label.grid(row=i+1, column=0, padx=60, pady=(0, 10), sticky="w")
    
    def _create_openai_section(self):
        """Create OpenAI settings section"""
        openai_frame = ctk.CTkFrame(self.scroll_frame)
        openai_frame.grid(row=1, column=0, sticky="ew", pady=(0, 15))
        openai_frame.grid_columnconfigure(1, weight=1)
        
        openai_title = ctk.CTkLabel(
            openai_frame,
            text="OpenAI Configuration",
            font=ctk.CTkFont(size=18, weight="bold")
        )
        openai_title.grid(row=0, column=0, columnspan=2, padx=20, pady=(20, 10), sticky="w")
        
        # API Key
        api_key_label = ctk.CTkLabel(openai_frame, text="API Key:", font=ctk.CTkFont(size=14))
        api_key_label.grid(row=1, column=0, padx=(20, 10), pady=10, sticky="w")
        
        self.api_key_entry = ctk.CTkEntry(
            openai_frame,
            placeholder_text="Enter your OpenAI API key...",
            show="*",
            width=300
        )
        self.api_key_entry.grid(row=1, column=1, padx=(0, 20), pady=10, sticky="ew")
        
        # Test API button
        test_button = ctk.CTkButton(
            openai_frame,
            text="Test API",
            command=self._test_openai_api,
            width=100
        )
        test_button.grid(row=2, column=1, padx=(0, 20), pady=10, sticky="e")
        
        # Status indicator
        self.openai_status = ctk.CTkLabel(
            openai_frame,
            text="●",
            font=ctk.CTkFont(size=16),
            text_color="red"
        )
        self.openai_status.grid(row=2, column=0, padx=(20, 10), pady=10, sticky="w")
        
        # Instructions
        instructions = ctk.CTkLabel(
            openai_frame,
            text="Get your API key from: https://platform.openai.com/api-keys",
            font=ctk.CTkFont(size=12),
            text_color=("gray60", "gray40")
        )
        instructions.grid(row=3, column=0, columnspan=2, padx=20, pady=(0, 20), sticky="w")
    
    def _create_personality_section(self):
        """Create personality context section"""
        personality_frame = ctk.CTkFrame(self.scroll_frame)
        personality_frame.grid(row=2, column=0, sticky="ew", pady=(0, 15))
        personality_frame.grid_columnconfigure(1, weight=1)
        
        personality_title = ctk.CTkLabel(
            personality_frame,
            text="Personality Context",
            font=ctk.CTkFont(size=18, weight="bold")
        )
        personality_title.grid(row=0, column=0, columnspan=2, padx=20, pady=(20, 10), sticky="w")
        
        # Instructions
        instructions = ctk.CTkLabel(
            personality_frame,
            text="Upload text files to enhance Young Ellens' personality and knowledge base.\nSupported formats: .txt, .md, .json, .csv",
            font=ctk.CTkFont(size=12),
            text_color=("gray60", "gray40"),
            justify="left"
        )
        instructions.grid(row=1, column=0, columnspan=2, padx=20, pady=10, sticky="w")
        
        # Upload button
        upload_button = ctk.CTkButton(
            personality_frame,
            text="📁 Upload Context Files",
            command=self._upload_personality_context,
            width=200,
            font=ctk.CTkFont(size=14)
        )
        upload_button.grid(row=2, column=0, padx=20, pady=10, sticky="w")
        
        # Upload status
        self.upload_status_label = ctk.CTkLabel(
            personality_frame,
            text="No files uploaded",
            font=ctk.CTkFont(size=12),
            text_color=("gray60", "gray40")
        )
        self.upload_status_label.grid(row=2, column=1, padx=(10, 20), pady=10, sticky="w")
        
        # Uploaded files list
        self.files_frame = ctk.CTkScrollableFrame(personality_frame, height=120)
        self.files_frame.grid(row=3, column=0, columnspan=2, padx=20, pady=10, sticky="ew")
        
        # Management buttons
        manage_frame = ctk.CTkFrame(personality_frame, fg_color="transparent")
        manage_frame.grid(row=4, column=0, columnspan=2, padx=20, pady=10, sticky="ew")
        
        view_button = ctk.CTkButton(
            manage_frame,
            text="📖 View Context",
            command=self._view_personality_context,
            width=150
        )
        view_button.grid(row=0, column=0, padx=(0, 10), pady=5)
        
        clear_button = ctk.CTkButton(
            manage_frame,
            text="🗑️ Clear All",
            command=self._clear_personality_context,
            width=150,
            fg_color="red",
            hover_color="darkred"
        )
        clear_button.grid(row=0, column=1, padx=10, pady=5)
        
        # Context status
        context_status = ctk.CTkLabel(
            personality_frame,
            text="Context files help Young Ellens provide more personalized and accurate responses.",
            font=ctk.CTkFont(size=11),
            text_color=("gray50", "gray50"),
            wraplength=500
        )
        context_status.grid(row=5, column=0, columnspan=2, padx=20, pady=(10, 20), sticky="w")
    
    def _create_ml_section(self):
        """Create ML settings section"""
        ml_frame = ctk.CTkFrame(self.scroll_frame)
        ml_frame.grid(row=3, column=0, sticky="ew", pady=(0, 15))
        ml_frame.grid_columnconfigure(1, weight=1)
        
        ml_title = ctk.CTkLabel(
            ml_frame,
            text="Machine Learning",
            font=ctk.CTkFont(size=18, weight="bold")
        )
        ml_title.grid(row=0, column=0, columnspan=2, padx=20, pady=(20, 10), sticky="w")
        
        # ML insights
        insights_button = ctk.CTkButton(
            ml_frame,
            text="View Conversation Insights",
            command=self._show_ml_insights,
            width=200
        )
        insights_button.grid(row=1, column=0, padx=20, pady=10, sticky="w")
        
        # Reset learning data
        reset_button = ctk.CTkButton(
            ml_frame,
            text="Reset Learning Data",
            command=self._reset_ml_data,
            fg_color="red",
            hover_color="darkred",
            width=200
        )
        reset_button.grid(row=2, column=0, padx=20, pady=10, sticky="w")
        
        # Export data
        export_button = ctk.CTkButton(
            ml_frame,
            text="Export Learning Data",
            command=self._export_ml_data,
            width=200
        )
        export_button.grid(row=3, column=0, padx=20, pady=(10, 20), sticky="w")
    
    def _create_status_section(self):
        """Create AI status section"""
        status_frame = ctk.CTkFrame(self.scroll_frame)
        status_frame.grid(row=4, column=0, sticky="ew", pady=(0, 15))
        status_frame.grid_columnconfigure(0, weight=1)
        
        status_title = ctk.CTkLabel(
            status_frame,
            text="AI Status",
            font=ctk.CTkFont(size=18, weight="bold")
        )
        status_title.grid(row=0, column=0, padx=20, pady=(20, 10), sticky="w")
        
        # Status text
        self.status_text = ctk.CTkTextbox(
            status_frame,
            height=150,
            font=ctk.CTkFont(size=12)
        )
        self.status_text.grid(row=1, column=0, padx=20, pady=(0, 20), sticky="ew")
        
        # Refresh button
        refresh_button = ctk.CTkButton(
            status_frame,
            text="Refresh Status",
            command=self._refresh_status
        )
        refresh_button.grid(row=2, column=0, padx=20, pady=(0, 20))
    
    def _load_current_settings(self):
        """Load current AI settings"""
        # Load response mode
        current_mode = config.get("ai.response_mode", "hybrid")
        self.mode_var.set(current_mode)
        
        # Load API key (don't show it for security)
        api_key = config.get("ai.openai_api_key", "")
        if api_key and api_key != "your_openai_api_key_here":
            self.api_key_entry.insert(0, "••••••••••••••••")  # Show masked
        
        # Load personality context
        self._load_personality_files()
        
        # Update status
        self._refresh_status()
        self._update_openai_status()
    
    def _save_settings(self):
        """Save AI settings"""
        try:
            # Save response mode
            new_mode = self.mode_var.get()
            self.chatbot.set_response_mode(new_mode)
            
            # Save API key if changed
            api_key = self.api_key_entry.get()
            if api_key and api_key != "••••••••••••••••":
                success = self.chatbot.set_openai_key(api_key)
                if success:
                    messagebox.showinfo("Success", "OpenAI API key saved successfully!")
                else:
                    messagebox.showerror("Error", "Failed to save OpenAI API key.")
            
            # Notify about changes
            if self.on_settings_changed:
                self.on_settings_changed()
            
            # Update status
            self._refresh_status()
            self._update_openai_status()
            
            logger.info("AI settings saved successfully")
            
        except Exception as e:
            logger.error(f"Error saving AI settings: {e}")
            messagebox.showerror("Error", f"Failed to save settings: {str(e)}")
    
    def _test_openai_api(self):
        """Test OpenAI API connection"""
        api_key = self.api_key_entry.get()
        if not api_key or api_key == "••••••••••••••••":
            messagebox.showwarning("Warning", "Please enter an API key first.")
            return
        
        try:
            # Test the API key
            success = self.chatbot.set_openai_key(api_key)
            if success:
                messagebox.showinfo("Success", "OpenAI API key is valid!")
                self._update_openai_status()
            else:
                messagebox.showerror("Error", "Invalid OpenAI API key.")
        except Exception as e:
            messagebox.showerror("Error", f"API test failed: {str(e)}")
    
    def _update_openai_status(self):
        """Update OpenAI status indicator"""
        if self.chatbot.openai_service.is_api_available():
            self.openai_status.configure(text="● Connected", text_color="green")
        else:
            self.openai_status.configure(text="● Disconnected", text_color="red")
    
    def _refresh_status(self):
        """Refresh AI status display"""
        try:
            status = self.chatbot.get_ai_status()
            insights = self.chatbot.get_conversation_insights()
            
            status_text = f"""AI System Status:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 Response Mode: {status['response_mode'].upper()}
🔗 OpenAI API: {'✅ Connected' if status['openai_available'] else '❌ Disconnected'}
🧠 ML Engine: {'✅ Active' if status['ml_engine_active'] else '❌ Inactive'}
💬 Conversation Count: {status['conversation_count']}

Machine Learning Insights:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Total Conversations: {insights.get('total_conversations', 0)}
⭐ Average Rating: {insights.get('average_rating', 0):.2f}/5
📈 Average Sentiment: {insights.get('average_sentiment', 0.5):.2f}
🎯 Most Common Topic: {insights.get('most_common_topic', 'none')}

OpenAI Configuration:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 Model: {status['openai_stats'].get('model', 'N/A')}
📝 Max Tokens: {status['openai_stats'].get('max_tokens', 'N/A')}
🌡️ Temperature: {status['openai_stats'].get('temperature', 'N/A')}
"""
            
            self.status_text.delete("1.0", "end")
            self.status_text.insert("1.0", status_text)
            
        except Exception as e:
            logger.error(f"Error refreshing status: {e}")
            self.status_text.delete("1.0", "end")
            self.status_text.insert("1.0", f"Error loading status: {str(e)}")
    
    def _show_ml_insights(self):
        """Show ML conversation insights"""
        try:
            insights = self.chatbot.get_conversation_insights()
            
            insight_window = ctk.CTkToplevel(self.window)
            insight_window.title("ML Conversation Insights")
            insight_window.geometry("500x400")
            insight_window.transient(self.window)
            
            insight_text = ctk.CTkTextbox(insight_window, font=ctk.CTkFont(size=12))
            insight_text.pack(fill="both", expand=True, padx=20, pady=20)
            
            formatted_insights = f"""📊 Conversation Insights
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Conversations: {insights.get('total_conversations', 0)}
Average Rating: {insights.get('average_rating', 0):.2f}/5 stars
Average Sentiment: {insights.get('average_sentiment', 0.5):.2f}
Most Common Topic: {insights.get('most_common_topic', 'none')}

Topic Distribution:
{self._format_topic_distribution(insights.get('topic_distribution', {}))}

Conversation Metrics:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{self._format_metrics(insights.get('conversation_metrics', {}))}
"""
            
            insight_text.insert("1.0", formatted_insights)
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to load insights: {str(e)}")
    
    def _format_topic_distribution(self, topics: dict) -> str:
        """Format topic distribution for display"""
        if not topics:
            return "No topic data available"
        
        lines = []
        for topic, count in sorted(topics.items(), key=lambda x: x[1], reverse=True):
            percentage = (count / sum(topics.values())) * 100
            lines.append(f"  {topic}: {count} ({percentage:.1f}%)")
        
        return "\\n".join(lines)
    
    def _format_metrics(self, metrics: dict) -> str:
        """Format conversation metrics for display"""
        if not metrics:
            return "No metrics available"
        
        return f"""Total Conversations: {metrics.get('total_conversations', 0)}
User Satisfaction: {metrics.get('user_satisfaction', 0):.2f}
Topics Discussed: {len(metrics.get('topics_discussed', set()))}"""
    
    def _reset_ml_data(self):
        """Reset ML learning data"""
        result = messagebox.askyesno(
            "Reset Learning Data",
            "Are you sure you want to reset all ML learning data?\\n\\nThis will remove all conversation history and learning patterns.\\nThis action cannot be undone."
        )
        
        if result:
            try:
                self.chatbot.ml_engine.reset_learning_data()
                self.chatbot.clear_conversation_history()
                self._refresh_status()
                messagebox.showinfo("Success", "ML learning data has been reset.")
            except Exception as e:
                messagebox.showerror("Error", f"Failed to reset data: {str(e)}")
    
    def _export_ml_data(self):
        """Export ML learning data"""
        try:
            from tkinter import filedialog
            import json
            
            file_path = filedialog.asksaveasfilename(
                title="Export Learning Data",
                defaultextension=".json",
                filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
            )
            
            if file_path:
                data = self.chatbot.export_learning_data()
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False, default=str)
                
                messagebox.showinfo("Success", f"Learning data exported to:\\n{file_path}")
        except Exception as e:
            messagebox.showerror("Error", f"Failed to export data: {str(e)}")
    
    def _upload_personality_context(self):
        """Upload personality context files"""
        try:
            file_paths = filedialog.askopenfilenames(
                title="Select Context Files",
                filetypes=[
                    ("Text files", "*.txt"),
                    ("Markdown files", "*.md"),
                    ("JSON files", "*.json"), 
                    ("CSV files", "*.csv"),
                    ("All files", "*.*")
                ]
            )
            
            if file_paths:
                uploaded_count = 0
                for file_path in file_paths:
                    if self._process_context_file(file_path):
                        uploaded_count += 1
                
                if uploaded_count > 0:
                    self._update_upload_status(f"{uploaded_count} file(s) uploaded successfully")
                    self._load_personality_files()
                    messagebox.showinfo("Success", f"Uploaded {uploaded_count} context file(s) successfully!")
                else:
                    messagebox.showwarning("Warning", "No files were uploaded successfully.")
                    
        except Exception as e:
            logger.error(f"Error uploading context files: {e}")
            messagebox.showerror("Error", f"Failed to upload files: {str(e)}")
    
    def _process_context_file(self, file_path: str) -> bool:
        """Process and store a single context file"""
        try:
            import os
            from pathlib import Path
            
            # Read file content
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            if not content.strip():
                logger.warning(f"Empty file: {file_path}")
                return False
            
            # Create personality context directory
            context_dir = Path.home() / ".youngellens" / "personality_context"
            context_dir.mkdir(exist_ok=True, parents=True)
            
            # Save file with metadata
            filename = os.path.basename(file_path)
            safe_filename = "".join(c for c in filename if c.isalnum() or c in "._-")
            output_path = context_dir / safe_filename
            
            # Add metadata header
            metadata = f"""# Personality Context File
# Original: {file_path}
# Uploaded: {self._get_timestamp()}
# Size: {len(content)} characters

{content}
"""
            
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(metadata)
            
            # Store in chatbot's personality engine if available
            if hasattr(self.chatbot, 'add_personality_context'):
                self.chatbot.add_personality_context(filename, content)
            
            logger.info(f"Processed context file: {filename}")
            return True
            
        except Exception as e:
            logger.error(f"Error processing file {file_path}: {e}")
            return False
    
    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    def _load_personality_files(self):
        """Load and display personality context files"""
        try:
            from pathlib import Path
            
            # Clear existing display
            for widget in self.files_frame.winfo_children():
                widget.destroy()
            
            context_dir = Path.home() / ".youngellens" / "personality_context"
            
            if not context_dir.exists():
                self._update_upload_status("No files uploaded")
                return
            
            files = list(context_dir.glob("*"))
            if not files:
                self._update_upload_status("No files uploaded")
                return
            
            # Display files
            for i, file_path in enumerate(files):
                if file_path.is_file():
                    self._add_file_display(i, file_path)
            
            self._update_upload_status(f"{len(files)} file(s) loaded")
            
        except Exception as e:
            logger.error(f"Error loading personality files: {e}")
            self._update_upload_status("Error loading files")
    
    def _add_file_display(self, index: int, file_path):
        """Add a file to the display list"""
        try:
            file_frame = ctk.CTkFrame(self.files_frame)
            file_frame.grid(row=index, column=0, sticky="ew", pady=2, padx=5)
            file_frame.grid_columnconfigure(1, weight=1)
            
            # File icon and name
            name_label = ctk.CTkLabel(
                file_frame,
                text=f"📄 {file_path.name}",
                font=ctk.CTkFont(size=12),
                anchor="w"
            )
            name_label.grid(row=0, column=0, padx=10, pady=5, sticky="w")
            
            # File size
            size = file_path.stat().st_size
            size_text = self._format_file_size(size)
            size_label = ctk.CTkLabel(
                file_frame,
                text=size_text,
                font=ctk.CTkFont(size=10),
                text_color=("gray60", "gray40")
            )
            size_label.grid(row=0, column=1, padx=5, pady=5)
            
            # Remove button
            remove_button = ctk.CTkButton(
                file_frame,
                text="✕",
                width=30,
                height=25,
                command=lambda fp=file_path: self._remove_context_file(fp),
                fg_color="red",
                hover_color="darkred",
                font=ctk.CTkFont(size=12)
            )
            remove_button.grid(row=0, column=2, padx=5, pady=5)
            
        except Exception as e:
            logger.error(f"Error adding file display: {e}")
    
    def _format_file_size(self, size_bytes: int) -> str:
        """Format file size for display"""
        if size_bytes < 1024:
            return f"{size_bytes} B"
        elif size_bytes < 1024 * 1024:
            return f"{size_bytes / 1024:.1f} KB"
        else:
            return f"{size_bytes / (1024 * 1024):.1f} MB"
    
    def _remove_context_file(self, file_path):
        """Remove a context file"""
        try:
            result = messagebox.askyesno(
                "Remove File",
                f"Are you sure you want to remove '{file_path.name}' from the personality context?"
            )
            
            if result:
                file_path.unlink()  # Delete the file
                self._load_personality_files()  # Refresh display
                logger.info(f"Removed context file: {file_path.name}")
                
        except Exception as e:
            logger.error(f"Error removing file: {e}")
            messagebox.showerror("Error", f"Failed to remove file: {str(e)}")
    
    def _update_upload_status(self, status: str):
        """Update upload status label"""
        self.upload_status_label.configure(text=status)
    
    def _view_personality_context(self):
        """View all personality context in a window"""
        try:
            from pathlib import Path
            
            context_dir = Path.home() / ".youngellens" / "personality_context"
            
            if not context_dir.exists() or not list(context_dir.glob("*")):
                messagebox.showinfo("No Context", "No personality context files found.")
                return
            
            # Create view window
            view_window = ctk.CTkToplevel(self.window)
            view_window.title("Personality Context - Young Ellens")
            view_window.geometry("800x600")
            view_window.transient(self.window)
            
            # Text display
            text_widget = ctk.CTkTextbox(
                view_window,
                font=ctk.CTkFont(size=12),
                wrap="word"
            )
            text_widget.pack(fill="both", expand=True, padx=20, pady=20)
            
            # Load and display all context files
            all_content = "# Young Ellens Personality Context\\n\\n"
            all_content += "This is the combined personality context that helps Young Ellens provide better responses.\\n\\n"
            all_content += "=" * 80 + "\\n\\n"
            
            for file_path in context_dir.glob("*"):
                if file_path.is_file():
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                        
                        all_content += f"## File: {file_path.name}\\n\\n"
                        all_content += content + "\\n\\n"
                        all_content += "-" * 40 + "\\n\\n"
                        
                    except Exception as e:
                        all_content += f"## File: {file_path.name} (Error reading)\\n\\n"
                        all_content += f"Error: {str(e)}\\n\\n"
                        all_content += "-" * 40 + "\\n\\n"
            
            text_widget.insert("1.0", all_content)
            text_widget.configure(state="disabled")  # Read-only
            
        except Exception as e:
            logger.error(f"Error viewing context: {e}")
            messagebox.showerror("Error", f"Failed to view context: {str(e)}")
    
    def _clear_personality_context(self):
        """Clear all personality context files"""
        try:
            from pathlib import Path
            
            result = messagebox.askyesno(
                "Clear All Context",
                "Are you sure you want to remove all personality context files?\\n\\nThis will permanently delete all uploaded context data and cannot be undone."
            )
            
            if result:
                context_dir = Path.home() / ".youngellens" / "personality_context"
                
                if context_dir.exists():
                    # Remove all files
                    for file_path in context_dir.glob("*"):
                        if file_path.is_file():
                            file_path.unlink()
                    
                    # Remove directory if empty
                    try:
                        context_dir.rmdir()
                    except:
                        pass  # Directory not empty, that's okay
                
                # Also clear from chatbot's AI services
                self.chatbot.clear_personality_context()
                
                self._load_personality_files()  # Refresh display
                messagebox.showinfo("Success", "All personality context files have been cleared.")
                logger.info("Cleared all personality context files")
                
        except Exception as e:
            logger.error(f"Error clearing context: {e}")
            messagebox.showerror("Error", f"Failed to clear context: {str(e)}")