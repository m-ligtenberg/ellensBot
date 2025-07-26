import customtkinter as ctk
import tkinter as tk
from tkinter import filedialog, messagebox
from typing import Dict, List, Optional, Any
from pathlib import Path
from ..core.training_pipeline import TrainingProgress
from ..utils.logger import logger
from .drag_drop_upload import DragDropUploadFrame
from .media_manager import show_media_manager

class TrainingDashboard(ctk.CTkFrame):
    """Dashboard for managing persona training"""
    
    def __init__(self, parent, app):
        super().__init__(parent)
        
        self.app = app
        self.current_training_progress: Optional[TrainingProgress] = None
        
        # Configure grid
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(1, weight=1)
        
        self._create_header()
        self._create_content()
        
        # Update display
        self._update_display()
    
    def _create_header(self):
        """Create dashboard header"""
        header_frame = ctk.CTkFrame(self)
        header_frame.grid(row=0, column=0, sticky="ew", padx=10, pady=(10, 5))
        header_frame.grid_columnconfigure(1, weight=1)
        
        # Title
        title_label = ctk.CTkLabel(
            header_frame,
            text="🎯 Training Dashboard",
            font=ctk.CTkFont(size=24, weight="bold")
        )
        title_label.grid(row=0, column=0, padx=20, pady=20, sticky="w")
        
        # Current persona info
        current_persona = self.app.get_current_persona()
        if current_persona:
            persona_label = ctk.CTkLabel(
                header_frame,
                text=f"Training: {current_persona.name}",
                font=ctk.CTkFont(size=16),
                text_color=("gray60", "gray40")
            )
            persona_label.grid(row=0, column=1, padx=20, pady=20, sticky="e")
    
    def _create_content(self):
        """Create main content area"""
        # Scrollable content
        content_frame = ctk.CTkScrollableFrame(self)
        content_frame.grid(row=1, column=0, sticky="nsew", padx=10, pady=5)
        content_frame.grid_columnconfigure(0, weight=1)
        
        current_row = 0
        
        # Upload Section
        current_row = self._create_upload_section(content_frame, current_row)
        
        # Training Status Section
        current_row = self._create_status_section(content_frame, current_row)
        
        # Training History Section
        current_row = self._create_history_section(content_frame, current_row)
    
    def _create_upload_section(self, parent, start_row: int) -> int:
        """Create file upload section with drag-and-drop"""
        # Section header
        upload_frame = ctk.CTkFrame(parent)
        upload_frame.grid(row=start_row, column=0, sticky="ew", pady=(0, 15), padx=5)
        upload_frame.grid_columnconfigure(0, weight=1)
        
        # Title
        title_label = ctk.CTkLabel(
            upload_frame,
            text="📁 Upload Training Data",
            font=ctk.CTkFont(size=18, weight="bold")
        )
        title_label.grid(row=0, column=0, pady=(20, 10), padx=20, sticky="w")
        
        # Description
        desc_label = ctk.CTkLabel(
            upload_frame,
            text="Drag & drop files or use buttons to upload audio, video, text, and image files for training.",
            font=ctk.CTkFont(size=12),
            text_color=("gray60", "gray40"),
            wraplength=600
        )
        desc_label.grid(row=1, column=0, pady=(0, 15), padx=20, sticky="w")
        
        # Tabbed upload interface
        self.upload_notebook = ctk.CTkTabview(upload_frame)
        self.upload_notebook.grid(row=2, column=0, sticky="ew", padx=20, pady=(0, 20))
        
        # Create tabs for each file type
        file_types = ["audio", "video", "text", "images"]
        self.upload_frames = {}
        
        for file_type in file_types:
            tab = self.upload_notebook.add(file_type.title())
            tab.grid_columnconfigure(0, weight=1)
            tab.grid_rowconfigure(0, weight=1)
            
            # Create drag-drop upload frame
            upload_frame_component = DragDropUploadFrame(
                tab,
                file_type=file_type,
                on_files_added=self._on_files_added
            )
            upload_frame_component.grid(row=0, column=0, sticky="nsew", padx=10, pady=10)
            
            self.upload_frames[file_type] = upload_frame_component
        
        return start_row + 1
    
    def _create_status_section(self, parent, start_row: int) -> int:
        """Create training status section"""
        # Status frame
        self.status_frame = ctk.CTkFrame(parent)
        self.status_frame.grid(row=start_row, column=0, sticky="ew", pady=(0, 15), padx=5)
        self.status_frame.grid_columnconfigure(0, weight=1)
        
        # Title
        status_title = ctk.CTkLabel(
            self.status_frame,
            text="⚡ Training Status",
            font=ctk.CTkFont(size=18, weight="bold")
        )
        status_title.grid(row=0, column=0, pady=(20, 10), padx=20, sticky="w")
        
        # Status display area
        self.status_display_frame = ctk.CTkFrame(self.status_frame)
        self.status_display_frame.grid(row=1, column=0, sticky="ew", padx=20, pady=(0, 20))
        self.status_display_frame.grid_columnconfigure(0, weight=1)
        
        # Will be populated by _update_status_display
        self._update_status_display()
        
        return start_row + 1
    
    def _create_history_section(self, parent, start_row: int) -> int:
        """Create training history section"""
        # History frame
        history_frame = ctk.CTkFrame(parent)
        history_frame.grid(row=start_row, column=0, sticky="ew", pady=(0, 15), padx=5)
        history_frame.grid_columnconfigure(0, weight=1)
        
        # Title
        history_title = ctk.CTkLabel(
            history_frame,
            text="📊 Training Data Overview",
            font=ctk.CTkFont(size=18, weight="bold")
        )
        history_title.grid(row=0, column=0, pady=(20, 10), padx=20, sticky="w")
        
        # Data overview
        self._create_data_overview(history_frame)
        
        # Media management button
        manage_btn = ctk.CTkButton(
            history_frame,
            text="🗂️ Manage Training Files",
            command=self._open_media_manager,
            font=ctk.CTkFont(size=14, weight="bold"),
            height=40,
            fg_color="#2ecc71",
            hover_color="#27ae60"
        )
        manage_btn.grid(row=2, column=0, pady=(15, 20), padx=20)
        
        return start_row + 1
    
    def _create_data_overview(self, parent):
        """Create training data overview"""
        current_persona = self.app.get_current_persona()
        if not current_persona:
            no_persona_label = ctk.CTkLabel(
                parent,
                text="No persona selected",
                font=ctk.CTkFont(size=14),
                text_color=("gray60", "gray40")
            )
            no_persona_label.grid(row=1, column=0, pady=20, padx=20)
            return
        
        # Get persona statistics
        stats = self.app.get_persona_statistics(current_persona.id)
        training_counts = stats.get("training_data_counts", {})
        
        # Overview grid
        overview_grid = ctk.CTkFrame(parent, fg_color="transparent")
        overview_grid.grid(row=1, column=0, sticky="ew", padx=20, pady=(0, 20))
        overview_grid.grid_columnconfigure((0, 1, 2, 3), weight=1)
        
        # Data type cards
        data_types = [
            ("🎤", "Audio", training_counts.get("audio", 0)),
            ("🎥", "Video", training_counts.get("video", 0)),
            ("📝", "Text", training_counts.get("text", 0)),
            ("🖼️", "Images", training_counts.get("images", 0))
        ]
        
        for i, (icon, label, count) in enumerate(data_types):
            card = ctk.CTkFrame(overview_grid)
            card.grid(row=0, column=i, padx=5, pady=5, sticky="ew")
            
            icon_label = ctk.CTkLabel(
                card,
                text=icon,
                font=ctk.CTkFont(size=24)
            )
            icon_label.grid(row=0, column=0, pady=(15, 5))
            
            count_label = ctk.CTkLabel(
                card,
                text=str(count),
                font=ctk.CTkFont(size=20, weight="bold")
            )
            count_label.grid(row=1, column=0, pady=2)
            
            type_label = ctk.CTkLabel(
                card,
                text=label,
                font=ctk.CTkFont(size=12),
                text_color=("gray60", "gray40")
            )
            type_label.grid(row=2, column=0, pady=(0, 15))
    
    def _update_status_display(self):
        """Update the training status display"""
        # Clear existing content
        for widget in self.status_display_frame.winfo_children():
            widget.destroy()
        
        current_persona = self.app.get_current_persona()
        if not current_persona:
            return
        
        # Check for ongoing training
        progress = self.app.get_training_progress(current_persona.id)
        
        if progress and progress.status == "running":
            self._show_active_training(progress)
        else:
            self._show_training_ready()
    
    def _show_active_training(self, progress: TrainingProgress):
        """Show active training status"""
        # Progress info
        progress_label = ctk.CTkLabel(
            self.status_display_frame,
            text=f"🔄 {progress.current_step}",
            font=ctk.CTkFont(size=14, weight="bold")
        )
        progress_label.grid(row=0, column=0, pady=(10, 5), padx=20, sticky="w")
        
        # Progress bar
        progress_bar = ctk.CTkProgressBar(self.status_display_frame)
        progress_bar.grid(row=1, column=0, sticky="ew", padx=20, pady=5)
        progress_bar.set(progress.progress_percentage / 100.0)
        
        # Progress percentage
        percentage_label = ctk.CTkLabel(
            self.status_display_frame,
            text=f"{progress.progress_percentage:.1f}%",
            font=ctk.CTkFont(size=12)
        )
        percentage_label.grid(row=2, column=0, pady=(5, 10), padx=20, sticky="w")
        
        # Details
        if progress.details:
            details_label = ctk.CTkLabel(
                self.status_display_frame,
                text=progress.details,
                font=ctk.CTkFont(size=11),
                text_color=("gray60", "gray40"),
                wraplength=400
            )
            details_label.grid(row=3, column=0, pady=(0, 10), padx=20, sticky="w")
        
        # Cancel button
        cancel_btn = ctk.CTkButton(
            self.status_display_frame,
            text="⏹️ Cancel Training",
            command=self._cancel_training,
            fg_color="red",
            hover_color="darkred",
            width=150
        )
        cancel_btn.grid(row=4, column=0, pady=(10, 20), padx=20, sticky="w")
    
    def _show_training_ready(self):
        """Show ready to train status"""
        current_persona = self.app.get_current_persona()
        if not current_persona:
            return
        
        # Check if we have training data
        stats = self.app.get_persona_statistics(current_persona.id)
        total_files = stats.get("total_files", 0)
        
        if total_files > 0:
            # Ready to train
            ready_label = ctk.CTkLabel(
                self.status_display_frame,
                text="✅ Ready to Train",
                font=ctk.CTkFont(size=16, weight="bold"),
                text_color="green"
            )
            ready_label.grid(row=0, column=0, pady=(15, 10), padx=20, sticky="w")
            
            info_label = ctk.CTkLabel(
                self.status_display_frame,
                text=f"Persona has {total_files} training files uploaded and ready for training.",
                font=ctk.CTkFont(size=12),
                text_color=("gray60", "gray40"),
                wraplength=400
            )
            info_label.grid(row=1, column=0, pady=(0, 15), padx=20, sticky="w")
            
            # Start training button
            train_btn = ctk.CTkButton(
                self.status_display_frame,
                text="🚀 Start Training",
                command=self._start_training,
                font=ctk.CTkFont(size=14, weight="bold"),
                width=150,
                height=40
            )
            train_btn.grid(row=2, column=0, pady=(10, 20), padx=20, sticky="w")
            
        else:
            # Need training data
            need_data_label = ctk.CTkLabel(
                self.status_display_frame,
                text="📁 Upload Training Data",
                font=ctk.CTkFont(size=16, weight="bold"),
                text_color="orange"
            )
            need_data_label.grid(row=0, column=0, pady=(15, 10), padx=20, sticky="w")
            
            info_label = ctk.CTkLabel(
                self.status_display_frame,
                text="Upload audio, video, text, or image files to begin training your persona.",
                font=ctk.CTkFont(size=12),
                text_color=("gray60", "gray40"),
                wraplength=400
            )
            info_label.grid(row=1, column=0, pady=(0, 20), padx=20, sticky="w")
    
    def _on_files_added(self, file_type: str, file_paths: List[Path]):
        """Callback when files are added via drag-drop component"""
        try:
            current_persona = self.app.get_current_persona()
            if not current_persona:
                messagebox.showwarning("No Persona", "Please select a persona first.")
                return
            
            # Convert Path objects to strings
            file_path_strings = [str(path) for path in file_paths]
            
            # Add files to persona training data
            success = self.app.persona_manager.add_training_data(
                current_persona.id,
                file_type,
                file_path_strings
            )
            
            if success:
                messagebox.showinfo(
                    "Upload Successful",
                    f"Successfully added {len(file_paths)} {file_type} file(s) to {current_persona.name}'s training data!"
                )
                
                # Refresh display
                self._update_display()
            else:
                messagebox.showerror("Upload Failed", "Failed to add training data to persona.")
                
        except Exception as e:
            logger.error(f"Error adding files to training data: {e}")
            messagebox.showerror("Upload Error", f"Failed to add files: {str(e)}")
    
    def _upload_files(self, file_type: str):
        """Legacy upload method - now delegates to drag-drop component"""
        # Switch to the appropriate tab and trigger browse
        if file_type in self.upload_frames:
            self.upload_notebook.set(file_type.title())
            self.upload_frames[file_type]._browse_files()
    
    def _start_training(self):
        """Start training the current persona"""
        try:
            current_persona = self.app.get_current_persona()
            if not current_persona:
                messagebox.showwarning("No Persona", "Please select a persona first.")
                return
            
            # Confirm training start
            result = messagebox.askyesno(
                "Start Training",
                f"Start training {current_persona.name}?\\n\\nThis will process all uploaded training data to create the AI persona model."
            )
            
            if result:
                # Get training data paths
                training_data = current_persona.training_data_paths
                
                # Start training with progress callback
                future = self.app.start_persona_training(
                    current_persona.id,
                    training_data,
                    self._on_training_progress
                )
                
                if future:
                    messagebox.showinfo("Training Started", f"Training started for {current_persona.name}")
                    self._update_status_display()
                else:
                    messagebox.showerror("Error", "Failed to start training.")
                    
        except Exception as e:
            logger.error(f"Error starting training: {e}")
            messagebox.showerror("Error", f"Failed to start training: {str(e)}")
    
    def _cancel_training(self):
        """Cancel ongoing training"""
        try:
            current_persona = self.app.get_current_persona()
            if not current_persona:
                return
            
            result = messagebox.askyesno(
                "Cancel Training",
                "Are you sure you want to cancel the ongoing training?"
            )
            
            if result:
                success = self.app.cancel_training(current_persona.id)
                if success:
                    messagebox.showinfo("Training Cancelled", "Training has been cancelled.")
                    self._update_status_display()
                    
        except Exception as e:
            logger.error(f"Error cancelling training: {e}")
    
    def _open_media_manager(self):
        """Open the media manager window"""
        try:
            current_persona = self.app.get_current_persona()
            if not current_persona:
                messagebox.showwarning("No Persona", "Please select a persona first.")
                return
            
            # Open media manager window
            show_media_manager(self, self.app, current_persona.id)
            
        except Exception as e:
            logger.error(f"Error opening media manager: {e}")
            messagebox.showerror("Error", f"Failed to open media manager: {str(e)}")
    
    def _on_training_progress(self, progress: TrainingProgress):
        """Handle training progress updates"""
        self.current_training_progress = progress
        
        # Update display in main thread
        self.after(100, self._update_status_display)
        
        if progress.status == "completed":
            self.after(100, lambda: messagebox.showinfo(
                "Training Complete",
                f"Training completed successfully for {progress.persona_id}!"
            ))
        elif progress.status == "failed":
            self.after(100, lambda: messagebox.showerror(
                "Training Failed",
                f"Training failed: {progress.details}"
            ))
    
    def _update_display(self):
        """Update the entire display"""
        self._update_status_display()
        
        # Recreate data overview
        current_persona = self.app.get_current_persona()
        if current_persona:
            # Find and update the history section
            pass  # The overview is recreated each time