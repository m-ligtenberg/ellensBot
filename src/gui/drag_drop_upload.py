import customtkinter as ctk
import tkinter as tk
from tkinter import messagebox
from pathlib import Path
from typing import List, Dict, Callable, Optional, Any
from ..utils.logger import logger
import os
import threading
from PIL import Image, ImageTk

# Try to import tkinterdnd2, fall back gracefully if not available
try:
    import tkinterdnd2 as tkdnd
    DND_AVAILABLE = True
except ImportError:
    logger.warning("tkinterdnd2 not available - drag and drop will be disabled")
    tkdnd = None
    DND_AVAILABLE = False

class DragDropUploadFrame(ctk.CTkFrame):
    """Advanced drag-and-drop file upload component with preview and validation"""
    
    def __init__(self, parent, file_type: str, on_files_added: Callable, **kwargs):
        super().__init__(parent, **kwargs)
        
        self.file_type = file_type
        self.on_files_added = on_files_added
        self.pending_files: List[Path] = []
        self.file_previews: Dict[str, Any] = {}
        
        # File type configurations
        self.file_configs = {
            "audio": {
                "extensions": [".wav", ".mp3", ".m4a", ".flac", ".ogg", ".aac"],
                "icon": "🎤",
                "color": "#3498db",
                "max_size_mb": 100,
                "description": "Audio files for voice training"
            },
            "video": {
                "extensions": [".mp4", ".avi", ".mov", ".mkv", ".wmv", ".webm"],
                "icon": "🎥", 
                "color": "#e74c3c",
                "max_size_mb": 500,
                "description": "Video files for visual and audio training"
            },
            "text": {
                "extensions": [".txt", ".md", ".doc", ".docx", ".pdf", ".rtf"],
                "icon": "📝",
                "color": "#2ecc71",
                "max_size_mb": 50,
                "description": "Text documents for knowledge training"
            },
            "images": {
                "extensions": [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"],
                "icon": "🖼️",
                "color": "#9b59b6", 
                "max_size_mb": 25,
                "description": "Images for visual reference training"
            }
        }
        
        self.config = self.file_configs.get(file_type, self.file_configs["text"])
        
        # Configure grid
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(1, weight=1)
        
        self._create_widgets()
        self._setup_drag_drop()
    
    def _create_widgets(self):
        """Create the upload interface widgets"""
        # Header
        header_frame = ctk.CTkFrame(self, fg_color="transparent")
        header_frame.grid(row=0, column=0, sticky="ew", padx=10, pady=(10, 5))
        header_frame.grid_columnconfigure(1, weight=1)
        
        title_label = ctk.CTkLabel(
            header_frame,
            text=f"{self.config['icon']} Upload {self.file_type.title()} Files",
            font=ctk.CTkFont(size=16, weight="bold")
        )
        title_label.grid(row=0, column=0, sticky="w")
        
        # Browse button
        browse_btn = ctk.CTkButton(
            header_frame,
            text="Browse Files",
            width=100,
            height=30,
            command=self._browse_files,
            font=ctk.CTkFont(size=12)
        )
        browse_btn.grid(row=0, column=1, sticky="e", padx=(10, 0))
        
        # Drop zone
        self.drop_zone = ctk.CTkFrame(self, border_width=2, border_color=self.config['color'])
        self.drop_zone.grid(row=1, column=0, sticky="nsew", padx=10, pady=5)
        self.drop_zone.grid_columnconfigure(0, weight=1)
        self.drop_zone.grid_rowconfigure(1, weight=1)
        
        # Drop zone content
        self.drop_content_frame = ctk.CTkFrame(self.drop_zone, fg_color="transparent")
        self.drop_content_frame.grid(row=0, column=0, sticky="ew", padx=20, pady=20)
        self.drop_content_frame.grid_columnconfigure(0, weight=1)
        
        # Drop icon and text
        self.drop_icon_label = ctk.CTkLabel(
            self.drop_content_frame,
            text=self.config['icon'],
            font=ctk.CTkFont(size=48)
        )
        self.drop_icon_label.grid(row=0, column=0, pady=(0, 10))
        
        self.drop_text_label = ctk.CTkLabel(
            self.drop_content_frame,
            text=f"Drag & drop {self.file_type} files here",
            font=ctk.CTkFont(size=16, weight="bold"),
            text_color=self.config['color']
        )
        self.drop_text_label.grid(row=1, column=0, pady=(0, 5))
        
        self.drop_desc_label = ctk.CTkLabel(
            self.drop_content_frame,
            text=self.config['description'],
            font=ctk.CTkFont(size=12),
            text_color=("gray60", "gray40")
        )
        self.drop_desc_label.grid(row=2, column=0, pady=(0, 10))
        
        # File format info
        formats_text = " • ".join(self.config['extensions'][:6])
        if len(self.config['extensions']) > 6:
            formats_text += " • ..."
            
        self.formats_label = ctk.CTkLabel(
            self.drop_content_frame,
            text=f"Supported: {formats_text}",
            font=ctk.CTkFont(size=10),
            text_color=("gray50", "gray50")
        )
        self.formats_label.grid(row=3, column=0)
        
        # File list area (initially hidden)
        self.file_list_frame = ctk.CTkScrollableFrame(self.drop_zone)
        # Will be shown when files are added
        
        # Action buttons frame
        self.action_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.action_frame.grid(row=2, column=0, sticky="ew", padx=10, pady=(5, 10))
        self.action_frame.grid_columnconfigure(1, weight=1)
        
        # Batch upload button (initially hidden)
        self.batch_btn = ctk.CTkButton(
            self.action_frame,
            text="📁 Add Folder",
            command=self._browse_folder,
            width=120,
            height=40,
            font=ctk.CTkFont(size=12)
        )
        
        # Upload button (initially hidden)
        self.upload_btn = ctk.CTkButton(
            self.action_frame,
            text=f"Upload Files ({len(self.pending_files)})",
            command=self._upload_files,
            fg_color=self.config['color'],
            font=ctk.CTkFont(size=14, weight="bold"),
            height=40
        )
        
        # Clear button (initially hidden)
        self.clear_btn = ctk.CTkButton(
            self.action_frame,
            text="Clear All",
            command=self._clear_files,
            fg_color="gray",
            width=100,
            height=40
        )
        
        # Progress bar for batch operations (initially hidden)
        self.progress_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.progress_frame.grid(row=3, column=0, sticky="ew", padx=10, pady=(0, 10))
        self.progress_frame.grid_columnconfigure(0, weight=1)
        
        self.progress_bar = ctk.CTkProgressBar(self.progress_frame, height=20)
        self.progress_label = ctk.CTkLabel(
            self.progress_frame,
            text="",
            font=ctk.CTkFont(size=12)
        )
    
    def _setup_drag_drop(self):
        """Setup drag and drop functionality"""
        if not DND_AVAILABLE or not tkdnd:
            logger.info("Drag-and-drop not available - using browse-only mode")
            self.drop_text_label.configure(text=f"Click 'Browse Files' to select {self.file_type} files")
            return
            
        try:
            # Make the drop zone accept drag and drop
            self.drop_zone.drop_target_register(tkdnd.DND_FILES)
            self.drop_zone.dnd_bind('<<DropEnter>>', self._on_drag_enter)
            self.drop_zone.dnd_bind('<<DropLeave>>', self._on_drag_leave)
            self.drop_zone.dnd_bind('<<Drop>>', self._on_drop)
            
        except Exception as e:
            logger.warning(f"Drag-and-drop setup failed: {e}")
            # Fallback to browse-only mode
            self.drop_text_label.configure(text=f"Click 'Browse Files' to select {self.file_type} files")
    
    def _on_drag_enter(self, event):
        """Handle drag enter event"""
        self.drop_zone.configure(border_color="green", border_width=3)
        self.drop_text_label.configure(text_color="green")
    
    def _on_drag_leave(self, event):
        """Handle drag leave event"""
        self.drop_zone.configure(border_color=self.config['color'], border_width=2)
        self.drop_text_label.configure(text_color=self.config['color'])
    
    def _on_drop(self, event):
        """Handle file drop event"""
        self.drop_zone.configure(border_color=self.config['color'], border_width=2)
        self.drop_text_label.configure(text_color=self.config['color'])
        
        # Get dropped files
        files = event.data.split()
        file_paths = [Path(f.strip('{}')) for f in files]
        
        self._add_files(file_paths)
    
    def _browse_files(self):
        """Open file browser dialog"""
        from tkinter import filedialog
        
        # Create file type filter
        file_types = []
        extensions = " ".join([f"*{ext}" for ext in self.config['extensions']])
        file_types.append((f"{self.file_type.title()} files", extensions))
        file_types.append(("All files", "*.*"))
        
        files = filedialog.askopenfilenames(
            title=f"Select {self.file_type.title()} Files",
            filetypes=file_types
        )
        
        if files:
            file_paths = [Path(f) for f in files]
            self._add_files(file_paths)
    
    def _browse_folder(self):
        """Browse and add all compatible files from a folder"""
        from tkinter import filedialog
        
        folder_path = filedialog.askdirectory(
            title=f"Select Folder with {self.file_type.title()} Files"
        )
        
        if folder_path:
            self._process_folder_batch(Path(folder_path))
    
    def _process_folder_batch(self, folder_path: Path):
        """Process all files in a folder recursively"""
        def process_files():
            try:
                self._show_progress("Scanning folder...")
                
                # Find all compatible files
                all_files = []
                processed = 0
                
                # Count total files first for progress
                total_files = sum(1 for _ in folder_path.rglob("*") if _.is_file())
                
                for file_path in folder_path.rglob("*"):
                    if file_path.is_file():
                        processed += 1
                        progress = processed / total_files if total_files > 0 else 0
                        
                        # Update progress in main thread
                        self.after(0, lambda p=progress: self._update_progress(
                            p, f"Scanning: {processed}/{total_files} files"
                        ))
                        
                        # Check if file is compatible
                        if file_path.suffix.lower() in self.config['extensions']:
                            if self._validate_file(file_path):
                                all_files.append(file_path)
                
                # Update UI in main thread
                if all_files:
                    # Filter out already added files
                    new_files = [f for f in all_files if f not in self.pending_files]
                    
                    if new_files:
                        self.after(0, lambda: self._update_progress(
                            1.0, f"Found {len(new_files)} new compatible files"
                        ))
                        
                        # Add files in batches to avoid UI freeze
                        batch_size = 50
                        for i in range(0, len(new_files), batch_size):
                            batch = new_files[i:i + batch_size]
                            self.after(100 * (i // batch_size), lambda b=batch: self._add_files_batch(b))
                        
                        # Show success message after all batches
                        self.after(100 * ((len(new_files) // batch_size) + 1), 
                                 lambda: self._batch_complete(len(new_files)))
                    else:
                        self.after(0, lambda: self._update_progress(
                            1.0, "No new files found in folder"
                        ))
                        self.after(2000, self._hide_progress)
                else:
                    self.after(0, lambda: self._update_progress(
                        1.0, f"No compatible {self.file_type} files found"
                    ))
                    self.after(2000, self._hide_progress)
                    
            except Exception as e:
                logger.error(f"Error processing folder batch: {e}")
                self.after(0, lambda: self._update_progress(
                    0, f"Error scanning folder: {str(e)}"
                ))
                self.after(3000, self._hide_progress)
        
        # Run in background thread
        threading.Thread(target=process_files, daemon=True).start()
    
    def _add_files_batch(self, files: List[Path]):
        """Add a batch of files without validation (already validated)"""
        self.pending_files.extend(files)
        self._update_display()
        self._generate_previews(files)
    
    def _batch_complete(self, file_count: int):
        """Called when batch processing is complete"""
        self._update_progress(1.0, f"Added {file_count} files successfully!")
        self.after(2000, self._hide_progress)
        messagebox.showinfo(
            "Batch Upload Complete",
            f"Successfully added {file_count} {self.file_type} files to the upload queue."
        )
    
    def _add_files(self, file_paths: List[Path]):
        """Add files to the upload queue with validation"""
        valid_files = []
        invalid_files = []
        
        for file_path in file_paths:
            if self._validate_file(file_path):
                if file_path not in self.pending_files:
                    valid_files.append(file_path)
            else:
                invalid_files.append(file_path)
        
        if valid_files:
            self.pending_files.extend(valid_files)
            self._update_display()
            self._generate_previews(valid_files)
        
        if invalid_files:
            self._show_validation_errors(invalid_files)
    
    def _validate_file(self, file_path: Path) -> bool:
        """Validate a single file"""
        # Check if file exists
        if not file_path.exists():
            logger.warning(f"File does not exist: {file_path}")
            return False
        
        # Check extension
        if file_path.suffix.lower() not in self.config['extensions']:
            logger.warning(f"Invalid file type: {file_path.suffix}")
            return False
        
        # Check file size
        try:
            size_mb = file_path.stat().st_size / (1024 * 1024)
            if size_mb > self.config['max_size_mb']:
                logger.warning(f"File too large: {size_mb:.1f}MB > {self.config['max_size_mb']}MB")
                return False
        except Exception as e:
            logger.error(f"Error checking file size: {e}")
            return False
        
        return True
    
    def _show_validation_errors(self, invalid_files: List[Path]):
        """Show validation error message"""
        error_msg = f"Some files could not be added:\n\n"
        for file_path in invalid_files[:5]:  # Show max 5 files
            reason = self._get_validation_error_reason(file_path)
            error_msg += f"• {file_path.name}: {reason}\n"
        
        if len(invalid_files) > 5:
            error_msg += f"• ... and {len(invalid_files) - 5} more files"
        
        messagebox.showwarning("Invalid Files", error_msg)
    
    def _get_validation_error_reason(self, file_path: Path) -> str:
        """Get the reason why a file is invalid"""
        if not file_path.exists():
            return "File not found"
        
        if file_path.suffix.lower() not in self.config['extensions']:
            return f"Unsupported format ({file_path.suffix})"
        
        try:
            size_mb = file_path.stat().st_size / (1024 * 1024)
            if size_mb > self.config['max_size_mb']:
                return f"File too large ({size_mb:.1f}MB)"
        except Exception:
            return "Cannot read file"
        
        return "Unknown error"
    
    def _update_display(self):
        """Update the display based on current files"""
        if self.pending_files:
            self._show_file_list()
            self._show_action_buttons()
        else:
            self._hide_file_list()
            self._hide_action_buttons()
    
    def _show_file_list(self):
        """Show the file list with previews"""
        # Hide drop content and show file list
        self.drop_content_frame.grid_remove()
        self.file_list_frame.grid(row=1, column=0, sticky="nsew", padx=10, pady=10)
        
        # Clear existing file widgets
        for widget in self.file_list_frame.winfo_children():
            widget.destroy()
        
        # Add file items
        for i, file_path in enumerate(self.pending_files):
            self._create_file_item(self.file_list_frame, i, file_path)
    
    def _hide_file_list(self):
        """Hide the file list and show drop content"""
        self.file_list_frame.grid_remove()
        self.drop_content_frame.grid(row=0, column=0, sticky="ew", padx=20, pady=20)
    
    def _show_action_buttons(self):
        """Show upload and clear buttons"""
        self.batch_btn.grid(row=0, column=0, sticky="w", padx=(0, 5))
        self.upload_btn.configure(text=f"Upload {len(self.pending_files)} File(s)")
        self.upload_btn.grid(row=0, column=1, sticky="ew", padx=5)
        self.clear_btn.grid(row=0, column=2, sticky="e", padx=(5, 0))
    
    def _hide_action_buttons(self):
        """Hide upload and clear buttons"""
        self.batch_btn.grid_remove()
        self.upload_btn.grid_remove()
        self.clear_btn.grid_remove()
        self._hide_progress()
    
    def _show_progress(self, text: str = ""):
        """Show progress bar"""
        self.progress_bar.grid(row=0, column=0, sticky="ew", padx=10, pady=(5, 0))
        self.progress_label.grid(row=1, column=0, padx=10, pady=(2, 5))
        if text:
            self.progress_label.configure(text=text)
    
    def _hide_progress(self):
        """Hide progress bar"""  
        self.progress_bar.grid_remove()
        self.progress_label.grid_remove()
    
    def _update_progress(self, value: float, text: str = ""):
        """Update progress bar"""
        self.progress_bar.set(value)
        if text:
            self.progress_label.configure(text=text)
    
    def _create_file_item(self, parent, index: int, file_path: Path):
        """Create a file item widget with preview"""
        item_frame = ctk.CTkFrame(parent)
        item_frame.grid(row=index, column=0, sticky="ew", padx=5, pady=2)
        item_frame.grid_columnconfigure(1, weight=1)
        
        # File icon/preview
        preview_frame = ctk.CTkFrame(item_frame, width=60, height=60)
        preview_frame.grid(row=0, column=0, padx=10, pady=10)
        preview_frame.grid_propagate(False)
        
        # Add preview content
        self._add_file_preview(preview_frame, file_path)
        
        # File info
        info_frame = ctk.CTkFrame(item_frame, fg_color="transparent")
        info_frame.grid(row=0, column=1, sticky="ew", padx=10, pady=10)
        info_frame.grid_columnconfigure(0, weight=1)
        
        # File name
        name_label = ctk.CTkLabel(
            info_frame,
            text=file_path.name,
            font=ctk.CTkFont(size=14, weight="bold"),
            anchor="w"
        )
        name_label.grid(row=0, column=0, sticky="ew")
        
        # File details
        try:
            size_mb = file_path.stat().st_size / (1024 * 1024)
            size_text = f"{size_mb:.1f} MB" if size_mb >= 1 else f"{file_path.stat().st_size / 1024:.1f} KB"
        except Exception:
            size_text = "Unknown size"
        
        details_label = ctk.CTkLabel(
            info_frame,
            text=f"{file_path.suffix.upper()} • {size_text}",
            font=ctk.CTkFont(size=12),
            text_color=("gray60", "gray40"),
            anchor="w"
        )
        details_label.grid(row=1, column=0, sticky="ew")
        
        # Remove button
        remove_btn = ctk.CTkButton(
            item_frame,
            text="✕",
            width=30,
            height=30,
            command=lambda: self._remove_file(file_path),
            fg_color="red",
            hover_color="darkred",
            font=ctk.CTkFont(size=12, weight="bold")
        )
        remove_btn.grid(row=0, column=2, padx=10)
    
    def _add_file_preview(self, parent_frame, file_path: Path):
        """Add preview content for a file"""
        try:
            if self.file_type == "images":
                self._add_image_preview(parent_frame, file_path)
            else:
                # Generic icon for other file types
                icon_label = ctk.CTkLabel(
                    parent_frame,
                    text=self.config['icon'],
                    font=ctk.CTkFont(size=24)
                )
                icon_label.place(relx=0.5, rely=0.5, anchor="center")
                
        except Exception as e:
            logger.warning(f"Could not create preview for {file_path}: {e}")
            # Fallback to generic icon
            icon_label = ctk.CTkLabel(
                parent_frame,
                text=self.config['icon'],
                font=ctk.CTkFont(size=24)
            )
            icon_label.place(relx=0.5, rely=0.5, anchor="center")
    
    def _add_image_preview(self, parent_frame, file_path: Path):
        """Add image preview"""
        try:
            # Load and resize image
            image = Image.open(file_path)
            image.thumbnail((50, 50), Image.Resampling.LANCZOS)
            photo = ImageTk.PhotoImage(image)
            
            # Create label with image
            image_label = tk.Label(parent_frame, image=photo, bg="gray20")
            image_label.image = photo  # Keep a reference
            image_label.place(relx=0.5, rely=0.5, anchor="center")
            
        except Exception as e:
            logger.warning(f"Could not load image preview: {e}")
            # Fallback to icon
            icon_label = ctk.CTkLabel(
                parent_frame,
                text="🖼️",
                font=ctk.CTkFont(size=24)
            )
            icon_label.place(relx=0.5, rely=0.5, anchor="center")
    
    def _generate_previews(self, file_paths: List[Path]):
        """Generate previews for files in background"""
        def generate_previews_bg():
            for file_path in file_paths:
                try:
                    if self.file_type == "audio":
                        self._generate_audio_preview(file_path)
                    elif self.file_type == "video":
                        self._generate_video_preview(file_path)
                    elif self.file_type == "text":
                        self._generate_text_preview(file_path)
                except Exception as e:
                    logger.warning(f"Could not generate preview for {file_path}: {e}")
        
        # Run in background thread
        threading.Thread(target=generate_previews_bg, daemon=True).start()
    
    def _generate_audio_preview(self, file_path: Path):
        """Generate audio file preview info"""
        try:
            import librosa
            duration = librosa.get_duration(path=str(file_path))
            self.file_previews[str(file_path)] = {
                "duration": duration,
                "type": "audio"
            }
        except Exception as e:
            logger.warning(f"Could not analyze audio file: {e}")
    
    def _generate_video_preview(self, file_path: Path):
        """Generate video file preview info"""
        try:
            import cv2
            cap = cv2.VideoCapture(str(file_path))
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT)
            duration = frame_count / fps if fps > 0 else 0
            cap.release()
            
            self.file_previews[str(file_path)] = {
                "duration": duration,
                "fps": fps,
                "type": "video"
            }
        except Exception as e:
            logger.warning(f"Could not analyze video file: {e}")
    
    def _generate_text_preview(self, file_path: Path):
        """Generate text file preview info"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read(1000)  # First 1000 chars
                word_count = len(content.split())
                
            self.file_previews[str(file_path)] = {
                "preview": content[:200] + "..." if len(content) > 200 else content,
                "word_count": word_count,
                "type": "text"
            }
        except Exception as e:
            logger.warning(f"Could not analyze text file: {e}")
    
    def _remove_file(self, file_path: Path):
        """Remove a file from the upload queue"""
        if file_path in self.pending_files:
            self.pending_files.remove(file_path)
            
            # Remove preview data
            if str(file_path) in self.file_previews:
                del self.file_previews[str(file_path)]
            
            self._update_display()
    
    def _clear_files(self):
        """Clear all files from upload queue"""
        self.pending_files.clear()
        self.file_previews.clear()
        self._update_display()
    
    def _upload_files(self):
        """Upload all pending files"""
        if not self.pending_files:
            return
        
        try:
            # Call the callback with file paths
            self.on_files_added(self.file_type, self.pending_files.copy())
            
            # Clear the queue after successful upload
            self._clear_files()
            
        except Exception as e:
            logger.error(f"Error uploading files: {e}")
            messagebox.showerror("Upload Error", f"Failed to upload files: {str(e)}")