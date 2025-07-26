import customtkinter as ctk
from typing import Optional, Callable
import threading
import time

class ProgressDialog(ctk.CTkToplevel):
    """Modal progress dialog for long-running operations"""
    
    def __init__(self, parent, title: str = "Processing...", cancelable: bool = True):
        super().__init__(parent)
        
        self.parent = parent
        self.cancelable = cancelable
        self.cancel_callback: Optional[Callable] = None
        self.is_cancelled = False
        
        # Configure window
        self.title(title)
        self.geometry("400x200")
        self.resizable(False, False)
        
        # Center on parent
        self.transient(parent)
        self._center_on_parent()
        
        # Make modal
        self.grab_set()
        
        # Configure grid
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(1, weight=1)
        
        self._create_widgets()
        
        # Handle window close
        self.protocol("WM_DELETE_WINDOW", self._on_close)
    
    def _center_on_parent(self):
        """Center dialog on parent window"""
        self.update_idletasks()
        
        # Get parent geometry
        parent_x = self.parent.winfo_x()
        parent_y = self.parent.winfo_y()
        parent_width = self.parent.winfo_width()
        parent_height = self.parent.winfo_height()
        
        # Calculate center position
        x = parent_x + (parent_width - 400) // 2
        y = parent_y + (parent_height - 200) // 2
        
        self.geometry(f"400x200+{x}+{y}")
    
    def _create_widgets(self):
        """Create dialog widgets"""
        # Header frame
        header_frame = ctk.CTkFrame(self, fg_color="transparent")
        header_frame.grid(row=0, column=0, sticky="ew", padx=20, pady=(20, 10))
        header_frame.grid_columnconfigure(0, weight=1)
        
        # Main message
        self.message_label = ctk.CTkLabel(
            header_frame,
            text="Initializing...",
            font=ctk.CTkFont(size=16, weight="bold")
        )
        self.message_label.grid(row=0, column=0, pady=(0, 10))
        
        # Detail message
        self.detail_label = ctk.CTkLabel(
            header_frame,
            text="Please wait while the operation completes.",
            font=ctk.CTkFont(size=12),
            text_color=("gray60", "gray40")
        )
        self.detail_label.grid(row=1, column=0)
        
        # Progress frame
        progress_frame = ctk.CTkFrame(self, fg_color="transparent")
        progress_frame.grid(row=1, column=0, sticky="ew", padx=20, pady=10)
        progress_frame.grid_columnconfigure(0, weight=1)
        
        # Progress bar
        self.progress_bar = ctk.CTkProgressBar(progress_frame, height=20)
        self.progress_bar.grid(row=0, column=0, sticky="ew", pady=(0, 10))
        self.progress_bar.set(0)
        
        # Progress percentage
        self.percentage_label = ctk.CTkLabel(
            progress_frame,
            text="0%",
            font=ctk.CTkFont(size=12)
        )
        self.percentage_label.grid(row=1, column=0)
        
        # Button frame
        button_frame = ctk.CTkFrame(self, fg_color="transparent")
        button_frame.grid(row=2, column=0, sticky="ew", padx=20, pady=(10, 20))
        button_frame.grid_columnconfigure(0, weight=1)
        
        if self.cancelable:
            self.cancel_btn = ctk.CTkButton(
                button_frame,
                text="Cancel",
                command=self._cancel_operation,
                fg_color="red",
                hover_color="darkred",
                width=100
            )
            self.cancel_btn.grid(row=0, column=0)
    
    def update_progress(self, progress: float, message: str = "", detail: str = ""):
        """Update progress bar and messages
        
        Args:
            progress: Progress value between 0.0 and 1.0
            message: Main status message
            detail: Detailed status message
        """
        # Ensure we're in the main thread
        def update_ui():
            if not self.winfo_exists():
                return
                
            # Update progress bar
            self.progress_bar.set(max(0.0, min(1.0, progress)))
            
            # Update percentage
            percentage = int(progress * 100)
            self.percentage_label.configure(text=f"{percentage}%")
            
            # Update messages
            if message:
                self.message_label.configure(text=message)
            if detail:
                self.detail_label.configure(text=detail)
            
            # Force update
            self.update_idletasks()
        
        # Schedule UI update in main thread
        self.after(0, update_ui)
    
    def set_indeterminate(self, active: bool = True):
        """Set progress bar to indeterminate mode"""
        def update_ui():
            if not self.winfo_exists():
                return
            if active:
                self.progress_bar.configure(mode="indeterminate")
                self.progress_bar.start()
                self.percentage_label.configure(text="Processing...")
            else:
                self.progress_bar.stop()
                self.progress_bar.configure(mode="determinate")
        
        self.after(0, update_ui)
    
    def set_cancel_callback(self, callback: Callable):
        """Set callback function to call when cancel is clicked"""
        self.cancel_callback = callback
    
    def _cancel_operation(self):
        """Handle cancel button click"""
        self.is_cancelled = True
        
        # Update UI to show cancelling
        self.cancel_btn.configure(text="Cancelling...", state="disabled")
        self.message_label.configure(text="Cancelling operation...")
        self.detail_label.configure(text="Please wait while the operation is cancelled.")
        
        # Call cancel callback if provided
        if self.cancel_callback:
            # Run callback in separate thread to avoid blocking UI
            threading.Thread(target=self.cancel_callback, daemon=True).start()
    
    def _on_close(self):
        """Handle window close attempt"""
        if self.cancelable and not self.is_cancelled:
            self._cancel_operation()
        elif not self.cancelable:
            # Don't allow closing non-cancelable dialogs
            pass
    
    def close_dialog(self):
        """Close the dialog"""
        def close_ui():
            if self.winfo_exists():
                self.grab_release()
                self.destroy()
        
        self.after(0, close_ui)
    
    def show_completion(self, success: bool, message: str, detail: str = "", auto_close_delay: int = 2000):
        """Show completion status and optionally auto-close
        
        Args:
            success: Whether operation was successful
            message: Completion message
            detail: Detailed completion message
            auto_close_delay: Delay in milliseconds before auto-closing (0 = don't auto-close)
        """
        def update_completion():
            if not self.winfo_exists():
                return
            
            # Update progress to complete
            self.progress_bar.set(1.0)
            self.percentage_label.configure(text="100%" if success else "Failed")
            
            # Update messages
            self.message_label.configure(
                text=message,
                text_color="green" if success else "red"
            )
            self.detail_label.configure(text=detail)
            
            # Update cancel button to close button
            if hasattr(self, 'cancel_btn'):
                self.cancel_btn.configure(
                    text="Close",
                    state="normal",
                    fg_color="gray",
                    hover_color="darkgray",
                    command=self.close_dialog
                )
            
            # Auto-close if requested
            if auto_close_delay > 0:
                self.after(auto_close_delay, self.close_dialog)
        
        self.after(0, update_completion)


class FileProcessingDialog(ProgressDialog):
    """Specialized progress dialog for file processing operations"""
    
    def __init__(self, parent, operation_name: str = "Processing files", total_files: int = 0):
        super().__init__(parent, f"{operation_name}...", cancelable=True)
        
        self.operation_name = operation_name
        self.total_files = total_files
        self.processed_files = 0
        self.failed_files = []
        
        # Update initial message
        self.update_progress(
            0.0,
            f"{operation_name}...",
            f"0 of {total_files} files processed" if total_files > 0 else "Preparing files..."
        )
    
    def update_file_progress(self, processed: int, current_file: str = "", failed_files: list = None):
        """Update progress based on file processing
        
        Args:
            processed: Number of files processed so far
            current_file: Name of currently processing file
            failed_files: List of files that failed processing
        """
        self.processed_files = processed
        if failed_files:
            self.failed_files = failed_files
        
        # Calculate progress
        if self.total_files > 0:
            progress = processed / self.total_files
        else:
            progress = 0.0
        
        # Create status message
        if current_file:
            message = f"Processing: {current_file}"
        else:
            message = f"{self.operation_name}..."
        
        # Create detail message
        if self.total_files > 0:
            detail = f"{processed} of {self.total_files} files processed"
            if self.failed_files:
                detail += f" ({len(self.failed_files)} failed)"
        else:
            detail = f"{processed} files processed"
            if self.failed_files:
                detail += f" ({len(self.failed_files)} failed)"
        
        self.update_progress(progress, message, detail)
    
    def show_file_completion(self, auto_close_delay: int = 3000):
        """Show file processing completion"""
        success = len(self.failed_files) == 0
        
        if success:
            message = f"✅ {self.operation_name} completed successfully!"
            detail = f"Processed {self.processed_files} files"
        else:
            message = f"⚠️ {self.operation_name} completed with errors"
            detail = f"Processed {self.processed_files} files, {len(self.failed_files)} failed"
        
        self.show_completion(success, message, detail, auto_close_delay)


def show_progress_dialog(parent, title: str, operation_func: Callable, *args, **kwargs):
    """Convenience function to show a progress dialog for an operation
    
    Args:
        parent: Parent window
        title: Dialog title
        operation_func: Function to execute (should accept a progress callback)
        *args, **kwargs: Arguments to pass to operation_func
    
    Returns:
        Result of operation_func or None if cancelled
    """
    dialog = ProgressDialog(parent, title)
    result = None
    exception = None
    
    def run_operation():
        nonlocal result, exception
        try:
            # Create progress callback
            def progress_callback(progress, message="", detail=""):
                dialog.update_progress(progress, message, detail)
            
            # Run operation with progress callback
            result = operation_func(progress_callback, *args, **kwargs)
            
            # Show completion
            dialog.show_completion(
                True, 
                "Operation completed successfully!",
                "The operation has finished.",
                2000
            )
            
        except Exception as e:
            exception = e
            dialog.show_completion(
                False,
                "Operation failed",
                str(e),
                0  # Don't auto-close on error
            )
    
    # Set up cancellation
    operation_cancelled = threading.Event()
    
    def cancel_callback():
        operation_cancelled.set()
    
    dialog.set_cancel_callback(cancel_callback)
    
    # Start operation in background
    operation_thread = threading.Thread(target=run_operation, daemon=True)
    operation_thread.start()
    
    # Show dialog (blocks until closed)
    dialog.wait_window()
    
    # Clean up
    operation_cancelled.set()
    
    if exception:
        raise exception
    
    return result