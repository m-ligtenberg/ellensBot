import customtkinter as ctk
import tkinter as tk
from tkinter import messagebox
from pathlib import Path
from typing import Dict, List, Optional, Callable, Any
import threading
import os
import sys
from PIL import Image, ImageTk

from ..utils.logger import logger
from .progress_dialog import FileProcessingDialog


class MediaManagerWindow(ctk.CTkToplevel):
    """Media management window for viewing, organizing, and managing training files"""
    
    def __init__(self, parent, app, persona_id: str):
        super().__init__(parent)
        
        self.parent = parent
        self.app = app
        self.persona_id = persona_id
        self.current_filter = "all"
        self.media_items: Dict[str, List[Dict]] = {
            "audio": [],
            "video": [],
            "text": [],
            "images": []
        }
        
        # Configure window
        self.title("Media Manager - Training Files")
        self.geometry("1000x700")
        self.minsize(800, 600)
        
        # Center on parent
        self.transient(parent)
        self._center_on_parent()
        
        # Configure grid
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)
        
        self._create_widgets()
        self._load_media_files()
        
        # Handle window close
        self.protocol("WM_DELETE_WINDOW", self._on_close)
    
    def _center_on_parent(self):
        """Center window on parent"""
        self.update_idletasks()
        
        parent_x = self.parent.winfo_x()
        parent_y = self.parent.winfo_y()
        parent_width = self.parent.winfo_width()
        parent_height = self.parent.winfo_height()
        
        x = parent_x + (parent_width - 1000) // 2
        y = parent_y + (parent_height - 700) // 2
        
        self.geometry(f"1000x700+{x}+{y}")
    
    def _create_widgets(self):
        """Create the media manager interface"""
        # Sidebar for filters and actions
        self._create_sidebar()
        
        # Main content area
        self._create_content_area()
        
        # Status bar
        self._create_status_bar()
    
    def _create_sidebar(self):
        """Create sidebar with filters and actions"""
        sidebar = ctk.CTkFrame(self, width=200)
        sidebar.grid(row=0, column=0, sticky="nsew", padx=(10, 5), pady=10)
        sidebar.grid_propagate(False)
        sidebar.grid_columnconfigure(0, weight=1)
        
        # Title
        title_label = ctk.CTkLabel(
            sidebar,
            text="📁 Media Manager",
            font=ctk.CTkFont(size=18, weight="bold")
        )
        title_label.grid(row=0, column=0, pady=(20, 15), padx=20)
        
        # Persona info
        persona = self.app.get_persona_by_id(self.persona_id)
        if persona:
            persona_label = ctk.CTkLabel(
                sidebar,
                text=f"👤 {persona.name}",
                font=ctk.CTkFont(size=14, weight="bold")
            )
            persona_label.grid(row=1, column=0, pady=(0, 20), padx=20)
        
        # Filter section
        filter_label = ctk.CTkLabel(
            sidebar,
            text="Filter by Type:",
            font=ctk.CTkFont(size=14, weight="bold")
        )
        filter_label.grid(row=2, column=0, pady=(0, 10), padx=20, sticky="w")
        
        # Filter buttons
        self.filter_buttons = {}
        filters = [
            ("all", "📄 All Files", "gray"),
            ("audio", "🎤 Audio", "#3498db"),
            ("video", "🎥 Video", "#e74c3c"),
            ("text", "📝 Text", "#2ecc71"),
            ("images", "🖼️ Images", "#9b59b6")
        ]
        
        for i, (filter_id, text, color) in enumerate(filters):
            btn = ctk.CTkButton(
                sidebar,
                text=text,
                command=lambda f=filter_id: self._set_filter(f),
                fg_color=color if filter_id != "all" else None,
                width=160,
                height=35
            )
            btn.grid(row=3 + i, column=0, pady=2, padx=20, sticky="ew")
            self.filter_buttons[filter_id] = btn
        
        # Highlight current filter
        self._update_filter_buttons()
        
        # Actions section
        actions_label = ctk.CTkLabel(
            sidebar,
            text="Actions:",
            font=ctk.CTkFont(size=14, weight="bold")
        )
        actions_label.grid(row=8, column=0, pady=(20, 10), padx=20, sticky="w")
        
        # Action buttons
        refresh_btn = ctk.CTkButton(
            sidebar,
            text="🔄 Refresh",
            command=self._refresh_media,
            width=160,
            height=35
        )
        refresh_btn.grid(row=9, column=0, pady=2, padx=20, sticky="ew")
        
        organize_btn = ctk.CTkButton(
            sidebar,
            text="📂 Organize Files",
            command=self._organize_files,
            width=160,
            height=35,
            fg_color="orange",
            hover_color="darkorange"
        )
        organize_btn.grid(row=10, column=0, pady=2, padx=20, sticky="ew")
        
        cleanup_btn = ctk.CTkButton(
            sidebar,
            text="🗑️ Clean Up",
            command=self._cleanup_files,
            width=160,
            height=35,
            fg_color="red",
            hover_color="darkred"
        )
        cleanup_btn.grid(row=11, column=0, pady=2, padx=20, sticky="ew")
    
    def _create_content_area(self):
        """Create main content area with file grid"""
        content_frame = ctk.CTkFrame(self)
        content_frame.grid(row=0, column=1, sticky="nsew", padx=(5, 10), pady=10)
        content_frame.grid_columnconfigure(0, weight=1)
        content_frame.grid_rowconfigure(1, weight=1)
        
        # Header
        header_frame = ctk.CTkFrame(content_frame, fg_color="transparent")
        header_frame.grid(row=0, column=0, sticky="ew", padx=10, pady=(10, 5))
        header_frame.grid_columnconfigure(1, weight=1)
        
        # Title and count
        self.content_title = ctk.CTkLabel(
            header_frame,
            text="All Training Files",
            font=ctk.CTkFont(size=20, weight="bold")
        )
        self.content_title.grid(row=0, column=0, sticky="w")
        
        self.file_count_label = ctk.CTkLabel(
            header_frame,
            text="0 files",
            font=ctk.CTkFont(size=14),
            text_color=("gray60", "gray40")
        )
        self.file_count_label.grid(row=0, column=1, sticky="e")
        
        # Search bar
        search_frame = ctk.CTkFrame(header_frame, fg_color="transparent")
        search_frame.grid(row=1, column=0, columnspan=2, sticky="ew", pady=(10, 0))
        search_frame.grid_columnconfigure(0, weight=1)
        
        self.search_entry = ctk.CTkEntry(
            search_frame,
            placeholder_text="🔍 Search files by name...",
            height=35
        )
        self.search_entry.grid(row=0, column=0, sticky="ew", padx=(0, 10))
        self.search_entry.bind("<KeyRelease>", self._on_search_changed)
        
        search_btn = ctk.CTkButton(
            search_frame,
            text="Search",
            command=self._search_files,
            width=80,
            height=35
        )
        search_btn.grid(row=0, column=1)
        
        # Scrollable file grid
        self.file_grid = ctk.CTkScrollableFrame(content_frame)
        self.file_grid.grid(row=1, column=0, sticky="nsew", padx=10, pady=(5, 10))
        
        # Configure grid for file items
        self._update_grid_columns()
    
    def _create_status_bar(self):
        """Create status bar"""
        self.status_bar = ctk.CTkFrame(self, height=30)
        self.status_bar.grid(row=1, column=0, columnspan=2, sticky="ew", padx=10, pady=(0, 10))
        self.status_bar.grid_columnconfigure(0, weight=1)
        self.status_bar.grid_propagate(False)
        
        self.status_label = ctk.CTkLabel(
            self.status_bar,
            text="Ready",
            font=ctk.CTkFont(size=12)
        )
        self.status_label.grid(row=0, column=0, padx=10, pady=5, sticky="w")
    
    def _load_media_files(self):
        """Load media files for the current persona"""
        def load_files():
            try:
                self._set_status("Loading media files...")
                
                persona = self.app.get_persona_by_id(self.persona_id)
                if not persona:
                    self._set_status("Persona not found")
                    return
                
                # Get training data paths
                training_data = persona.training_data_paths
                
                # Process each file type
                for file_type in ["audio", "video", "text", "images"]:
                    files = training_data.get(file_type, [])
                    self.media_items[file_type] = []
                    
                    for file_path in files:
                        path_obj = Path(file_path)
                        if path_obj.exists():
                            try:
                                stat = path_obj.stat()
                                item = {
                                    "path": path_obj,
                                    "name": path_obj.name,
                                    "size": stat.st_size,
                                    "modified": stat.st_mtime,
                                    "type": file_type
                                }
                                # Add type-specific metadata
                                if file_type == "images":
                                    item.update(self._get_image_metadata(path_obj))
                                elif file_type == "audio":
                                    item.update(self._get_audio_metadata(path_obj))
                                elif file_type == "video":
                                    item.update(self._get_video_metadata(path_obj))
                                elif file_type == "text":
                                    item.update(self._get_text_metadata(path_obj))
                                
                                self.media_items[file_type].append(item)
                            except Exception as e:
                                logger.warning(f"Error processing file {file_path}: {e}")
                
                # Update UI in main thread
                self.after(0, self._update_file_display)
                self.after(0, lambda: self._set_status("Media files loaded"))
                
            except Exception as e:
                logger.error(f"Error loading media files: {e}")
                self.after(0, lambda: self._set_status(f"Error loading files: {str(e)}"))
        
        # Load in background thread
        threading.Thread(target=load_files, daemon=True).start()
    
    def _get_image_metadata(self, path: Path) -> Dict:
        """Get metadata for image files"""
        try:
            with Image.open(path) as img:
                return {
                    "width": img.width,
                    "height": img.height,
                    "format": img.format
                }
        except Exception:
            return {}
    
    def _get_audio_metadata(self, path: Path) -> Dict:
        """Get metadata for audio files"""
        try:
            import librosa
            duration = librosa.get_duration(path=str(path))
            return {"duration": duration}
        except Exception:
            return {}
    
    def _get_video_metadata(self, path: Path) -> Dict:
        """Get metadata for video files"""
        try:
            import cv2
            cap = cv2.VideoCapture(str(path))
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT)
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            duration = frame_count / fps if fps > 0 else 0
            cap.release()
            
            return {
                "duration": duration,
                "fps": fps,
                "width": width,
                "height": height
            }
        except Exception:
            return {}
    
    def _get_text_metadata(self, path: Path) -> Dict:
        """Get metadata for text files"""
        try:
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                return {
                    "char_count": len(content),
                    "word_count": len(content.split()),
                    "line_count": len(content.splitlines())
                }
        except Exception:
            return {}
    
    def _update_file_display(self):
        """Update the file display based on current filter"""
        # Clear existing items
        for widget in self.file_grid.winfo_children():
            widget.destroy()
        
        # Get filtered files
        if self.current_filter == "all":
            all_files = []
            for file_type, files in self.media_items.items():
                all_files.extend(files)
            files_to_show = all_files
        else:
            files_to_show = self.media_items.get(self.current_filter, [])
        
        # Apply search filter if active
        search_text = self.search_entry.get().lower().strip()
        if search_text:
            files_to_show = [
                f for f in files_to_show 
                if search_text in f["name"].lower()
            ]
        
        # Update count and title
        count = len(files_to_show)
        self.file_count_label.configure(text=f"{count} file{'s' if count != 1 else ''}")
        
        filter_name = self.current_filter.title() if self.current_filter != "all" else "All"
        self.content_title.configure(text=f"{filter_name} Training Files")
        
        # Create file items
        if files_to_show:
            self._create_file_items(files_to_show)
        else:
            self._show_empty_message()
    
    def _create_file_items(self, files: List[Dict]):
        """Create file item widgets in a grid"""
        columns = self._calculate_grid_columns()
        
        for i, file_item in enumerate(files):
            row = i // columns
            col = i % columns
            
            item_frame = self._create_file_item_widget(self.file_grid, file_item)
            item_frame.grid(row=row, column=col, padx=5, pady=5, sticky="ew")
        
        # Configure column weights
        for col in range(columns):
            self.file_grid.grid_columnconfigure(col, weight=1)
    
    def _create_file_item_widget(self, parent, file_item: Dict) -> ctk.CTkFrame:
        """Create a single file item widget"""
        item_frame = ctk.CTkFrame(parent, corner_radius=10)
        item_frame.grid_columnconfigure(0, weight=1)
        
        # File icon/preview
        preview_frame = ctk.CTkFrame(item_frame, height=80)
        preview_frame.grid(row=0, column=0, sticky="ew", padx=10, pady=(10, 5))
        preview_frame.grid_propagate(False)
        
        self._add_file_preview(preview_frame, file_item)
        
        # File name
        name_label = ctk.CTkLabel(
            item_frame,
            text=file_item["name"],
            font=ctk.CTkFont(size=12, weight="bold"),
            wraplength=200
        )
        name_label.grid(row=1, column=0, padx=10, pady=(0, 5), sticky="ew")
        
        # File details
        details = self._format_file_details(file_item)
        details_label = ctk.CTkLabel(
            item_frame,
            text=details,
            font=ctk.CTkFont(size=10),
            text_color=("gray60", "gray40")
        )
        details_label.grid(row=2, column=0, padx=10, pady=(0, 5))
        
        # Action buttons
        button_frame = ctk.CTkFrame(item_frame, fg_color="transparent")
        button_frame.grid(row=3, column=0, sticky="ew", padx=10, pady=(0, 10))
        button_frame.grid_columnconfigure((0, 1, 2), weight=1)
        
        # View button
        view_btn = ctk.CTkButton(
            button_frame,
            text="👁️",
            width=30,
            height=25,
            command=lambda f=file_item: self._view_file(f),
            font=ctk.CTkFont(size=10)
        )
        view_btn.grid(row=0, column=0, padx=1)
        
        # Open button
        open_btn = ctk.CTkButton(
            button_frame,
            text="📂",
            width=30,
            height=25,
            command=lambda f=file_item: self._open_file_location(f),
            font=ctk.CTkFont(size=10)
        )
        open_btn.grid(row=0, column=1, padx=1)
        
        # Delete button
        delete_btn = ctk.CTkButton(
            button_frame,
            text="🗑️",
            width=30,
            height=25,
            command=lambda f=file_item: self._delete_file(f),
            fg_color="red",
            hover_color="darkred",
            font=ctk.CTkFont(size=10)
        )
        delete_btn.grid(row=0, column=2, padx=1)
        
        return item_frame
    
    def _add_file_preview(self, parent_frame, file_item: Dict):
        """Add preview for file item"""
        file_type = file_item["type"]
        
        try:
            if file_type == "images" and file_item["path"].exists():
                # Show image thumbnail
                image = Image.open(file_item["path"])
                image.thumbnail((60, 60), Image.Resampling.LANCZOS)
                photo = ImageTk.PhotoImage(image)
                
                label = tk.Label(parent_frame, image=photo, bg="gray20")
                label.image = photo  # Keep reference
                label.place(relx=0.5, rely=0.5, anchor="center")
            else:
                # Show type icon
                icons = {
                    "audio": "🎤",
                    "video": "🎥", 
                    "text": "📝",
                    "images": "🖼️"
                }
                
                icon_label = ctk.CTkLabel(
                    parent_frame,
                    text=icons.get(file_type, "📄"),
                    font=ctk.CTkFont(size=32)
                )
                icon_label.place(relx=0.5, rely=0.5, anchor="center")
                
        except Exception as e:
            logger.warning(f"Could not create preview for {file_item['name']}: {e}")
            # Fallback to generic icon
            icon_label = ctk.CTkLabel(
                parent_frame,
                text="📄",
                font=ctk.CTkFont(size=32)
            )
            icon_label.place(relx=0.5, rely=0.5, anchor="center")
    
    def _format_file_details(self, file_item: Dict) -> str:
        """Format file details for display"""
        details = []
        
        # File size
        size_mb = file_item["size"] / (1024 * 1024)
        if size_mb >= 1:
            details.append(f"{size_mb:.1f} MB")
        else:
            size_kb = file_item["size"] / 1024
            details.append(f"{size_kb:.1f} KB")
        
        # Type-specific details
        file_type = file_item["type"]
        if file_type == "images" and "width" in file_item:
            details.append(f"{file_item['width']}×{file_item['height']}")
        elif file_type in ["audio", "video"] and "duration" in file_item:
            duration = file_item["duration"]
            mins, secs = divmod(int(duration), 60)
            details.append(f"{mins}:{secs:02d}")
        elif file_type == "text" and "word_count" in file_item:
            details.append(f"{file_item['word_count']} words")
        
        return " • ".join(details)
    
    def _show_empty_message(self):
        """Show message when no files found"""
        empty_frame = ctk.CTkFrame(self.file_grid)
        empty_frame.grid(row=0, column=0, sticky="ew", padx=20, pady=50)
        
        empty_label = ctk.CTkLabel(
            empty_frame,
            text="📭 No files found",
            font=ctk.CTkFont(size=18, weight="bold"),
            text_color=("gray60", "gray40")
        )
        empty_label.grid(row=0, column=0, padx=40, pady=30)
        
        if self.current_filter != "all":
            hint_label = ctk.CTkLabel(
                empty_frame,
                text=f"No {self.current_filter} files in training data.\nTry uploading some files or changing the filter.",
                font=ctk.CTkFont(size=12),
                text_color=("gray50", "gray50")
            )
            hint_label.grid(row=1, column=0, padx=40, pady=(0, 30))
    
    def _calculate_grid_columns(self) -> int:
        """Calculate optimal number of columns for file grid"""
        width = self.file_grid.winfo_width()
        if width < 400:
            return 1
        elif width < 800:
            return 2
        elif width < 1200:
            return 3
        else:
            return 4
    
    def _update_grid_columns(self):
        """Update grid column configuration"""
        self.after(100, self._update_file_display)  # Delay to allow width calculation
    
    def _set_filter(self, filter_id: str):
        """Set the current file type filter"""
        self.current_filter = filter_id
        self._update_filter_buttons()
        self._update_file_display()
    
    def _update_filter_buttons(self):
        """Update filter button appearances"""
        for filter_id, button in self.filter_buttons.items():
            if filter_id == self.current_filter:
                button.configure(border_width=2, border_color="white")
            else:
                button.configure(border_width=0)
    
    def _on_search_changed(self, event):
        """Handle search text change"""
        # Debounce search to avoid too many updates
        if hasattr(self, '_search_timer'):
            self.after_cancel(self._search_timer)
        
        self._search_timer = self.after(300, self._search_files)
    
    def _search_files(self):
        """Perform file search"""
        self._update_file_display()
    
    def _refresh_media(self):
        """Refresh media file list"""
        self._set_status("Refreshing media files...")
        self._load_media_files()
    
    def _organize_files(self):
        """Organize files by type and date"""
        messagebox.showinfo(
            "Organize Files",
            "File organization feature will be implemented in a future update."
        )
    
    def _cleanup_files(self):
        """Clean up missing or invalid files"""
        messagebox.showinfo(
            "Clean Up Files", 
            "File cleanup feature will be implemented in a future update."
        )
    
    def _view_file(self, file_item: Dict):
        """View/preview a file"""
        try:
            file_path = file_item["path"]
            file_type = file_item["type"]
            
            if file_type == "text":
                self._view_text_file(file_path)
            elif file_type == "images":
                self._view_image_file(file_path)
            else:
                # For audio/video, open with system default
                os.startfile(str(file_path))
                
        except Exception as e:
            logger.error(f"Error viewing file: {e}")
            messagebox.showerror("View Error", f"Could not open file: {str(e)}")
    
    def _view_text_file(self, file_path: Path):
        """View text file in a popup window"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read(5000)  # Limit to first 5000 chars
            
            # Create text viewer window
            viewer = ctk.CTkToplevel(self)
            viewer.title(f"Text Viewer - {file_path.name}")
            viewer.geometry("600x400")
            viewer.transient(self)
            
            # Text widget
            text_widget = ctk.CTkTextbox(viewer)
            text_widget.pack(fill="both", expand=True, padx=10, pady=10)
            text_widget.insert("1.0", content)
            text_widget.configure(state="disabled")
            
        except Exception as e:
            messagebox.showerror("Text Viewer Error", f"Could not read text file: {str(e)}")
    
    def _view_image_file(self, file_path: Path):
        """View image file in a popup window"""
        try:
            # Create image viewer window
            viewer = ctk.CTkToplevel(self)
            viewer.title(f"Image Viewer - {file_path.name}")
            viewer.geometry("500x500")
            viewer.transient(self)
            
            # Load and display image
            image = Image.open(file_path)
            # Resize to fit window while maintaining aspect ratio
            image.thumbnail((450, 450), Image.Resampling.LANCZOS)
            photo = ImageTk.PhotoImage(image)
            
            label = tk.Label(viewer, image=photo, bg="gray20")
            label.image = photo  # Keep reference
            label.pack(expand=True, padx=10, pady=10)
            
        except Exception as e:
            messagebox.showerror("Image Viewer Error", f"Could not display image: {str(e)}")
    
    def _open_file_location(self, file_item: Dict):
        """Open file location in system file manager"""
        try:
            file_path = file_item["path"]
            
            # Open containing folder and select file
            if os.name == 'nt':  # Windows
                os.system(f'explorer /select,"{file_path}"')
            elif os.name == 'posix':  # macOS/Linux
                os.system(f'open -R "{file_path}"' if sys.platform == 'darwin' 
                         else f'xdg-open "{file_path.parent}"')
                
        except Exception as e:
            logger.error(f"Error opening file location: {e}")
            messagebox.showerror("Open Error", f"Could not open file location: {str(e)}")
    
    def _delete_file(self, file_item: Dict):
        """Delete a file from training data"""
        result = messagebox.askyesnocancel(
            "Delete File",
            f"Remove '{file_item['name']}' from training data?\n\n"
            "Choose:\n"
            "• Yes: Remove from training data only\n"
            "• No: Remove from training data AND delete file\n"
            "• Cancel: Do nothing"
        )
        
        if result is None:  # Cancel
            return
        
        try:
            # Remove from persona training data
            success = self.app.persona_manager.remove_training_file(
                self.persona_id,
                file_item["type"],
                str(file_item["path"])
            )
            
            if success:
                if result is False:  # No = delete file too
                    try:
                        file_item["path"].unlink()
                        messagebox.showinfo("File Deleted", "File removed from training data and deleted from disk.")
                    except Exception as e:
                        logger.error(f"Error deleting file: {e}")
                        messagebox.showwarning("Partial Success", 
                                             "File removed from training data but could not be deleted from disk.")
                else:  # Yes = remove from training only
                    messagebox.showinfo("File Removed", "File removed from training data.")
                
                # Refresh display
                self._refresh_media()
            else:
                messagebox.showerror("Error", "Failed to remove file from training data.")
                
        except Exception as e:
            logger.error(f"Error deleting file: {e}")
            messagebox.showerror("Delete Error", f"Failed to delete file: {str(e)}")
    
    def _set_status(self, message: str):
        """Update status bar message"""
        self.status_label.configure(text=message)
    
    def _on_close(self):
        """Handle window close"""
        self.destroy()


def show_media_manager(parent, app, persona_id: str):
    """Show media manager window for a persona"""
    try:
        manager = MediaManagerWindow(parent, app, persona_id)
        manager.focus()
        return manager
    except Exception as e:
        logger.error(f"Error showing media manager: {e}")
        messagebox.showerror("Media Manager Error", f"Could not open media manager: {str(e)}")
        return None