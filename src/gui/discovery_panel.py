import customtkinter as ctk
import tkinter as tk
from tkinter import messagebox
from typing import List, Dict, Any, Optional
from ..discovery.intelligent_scraper import DiscoveredContent, ContentSource
from ..discovery.ml_discovery import SourceRecommendation, ContentPattern
from ..utils.logger import logger

class DiscoveryPanel(ctk.CTkFrame):
    """Panel for content discovery and source management"""
    
    def __init__(self, parent, app):
        super().__init__(parent)
        
        self.app = app
        
        # Configure grid
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(1, weight=1)
        
        self._create_header()
        self._create_content()
        
        # Load initial data
        self._refresh_display()
    
    def _create_header(self):
        """Create panel header"""
        header_frame = ctk.CTkFrame(self)
        header_frame.grid(row=0, column=0, sticky="ew", padx=10, pady=(10, 5))
        header_frame.grid_columnconfigure(1, weight=1)
        
        # Title
        title_label = ctk.CTkLabel(
            header_frame,
            text="🔍 Content Discovery",
            font=ctk.CTkFont(size=24, weight="bold")
        )
        title_label.grid(row=0, column=0, padx=20, pady=20, sticky="w")
        
        # Actions
        actions_frame = ctk.CTkFrame(header_frame, fg_color="transparent")
        actions_frame.grid(row=0, column=1, padx=20, pady=20, sticky="e")
        
        discover_btn = ctk.CTkButton(
            actions_frame,
            text="🚀 Start Discovery",
            command=self._start_discovery,
            font=ctk.CTkFont(size=12, weight="bold"),
            width=140
        )
        discover_btn.grid(row=0, column=0, padx=5)
        
        analyze_btn = ctk.CTkButton(
            actions_frame,
            text="🧠 Analyze Patterns",
            command=self._analyze_patterns,
            font=ctk.CTkFont(size=12),
            width=140,
            fg_color="purple",
            hover_color="darkmagenta"
        )
        analyze_btn.grid(row=0, column=1, padx=5)
    
    def _create_content(self):
        """Create main content area"""
        # Tab view for different sections
        self.tab_view = ctk.CTkTabview(self)
        self.tab_view.grid(row=1, column=0, sticky="nsew", padx=10, pady=5)
        
        # Create tabs
        self.sources_tab = self.tab_view.add("📡 Sources")
        self.discovered_tab = self.tab_view.add("📚 Discovered")
        self.recommendations_tab = self.tab_view.add("💡 Recommendations")
        self.patterns_tab = self.tab_view.add("🧠 Patterns")
        
        # Configure tab content
        self._create_sources_tab()
        self._create_discovered_tab()
        self._create_recommendations_tab()
        self._create_patterns_tab()
    
    def _create_sources_tab(self):
        """Create content sources management tab"""
        # Configure grid
        self.sources_tab.grid_columnconfigure(0, weight=1)
        self.sources_tab.grid_rowconfigure(1, weight=1)
        
        # Header
        sources_header = ctk.CTkFrame(self.sources_tab)
        sources_header.grid(row=0, column=0, sticky="ew", padx=10, pady=10)
        sources_header.grid_columnconfigure(1, weight=1)
        
        sources_title = ctk.CTkLabel(
            sources_header,
            text="Content Sources",
            font=ctk.CTkFont(size=16, weight="bold")
        )
        sources_title.grid(row=0, column=0, padx=15, pady=15, sticky="w")
        
        add_source_btn = ctk.CTkButton(
            sources_header,
            text="➕ Add Source",
            command=self._add_source,
            width=120
        )
        add_source_btn.grid(row=0, column=1, padx=15, pady=15, sticky="e")
        
        # Sources list
        self.sources_frame = ctk.CTkScrollableFrame(self.sources_tab)
        self.sources_frame.grid(row=1, column=0, sticky="nsew", padx=10, pady=(0, 10))
        self.sources_frame.grid_columnconfigure(0, weight=1)
    
    def _create_discovered_tab(self):
        """Create discovered content tab"""
        # Configure grid
        self.discovered_tab.grid_columnconfigure(0, weight=1)
        self.discovered_tab.grid_rowconfigure(1, weight=1)
        
        # Header with filters
        discovered_header = ctk.CTkFrame(self.discovered_tab)
        discovered_header.grid(row=0, column=0, sticky="ew", padx=10, pady=10)
        discovered_header.grid_columnconfigure(2, weight=1)
        
        content_title = ctk.CTkLabel(
            discovered_header,
            text="Discovered Content",
            font=ctk.CTkFont(size=16, weight="bold")
        )
        content_title.grid(row=0, column=0, padx=15, pady=15, sticky="w")
        
        # Filter dropdown
        filter_label = ctk.CTkLabel(
            discovered_header,
            text="Filter:",
            font=ctk.CTkFont(size=12)
        )
        filter_label.grid(row=0, column=1, padx=(20, 5), pady=15)
        
        self.content_filter = ctk.CTkOptionMenu(
            discovered_header,
            values=["All", "High Relevance", "Recent", "Text", "Video", "Audio"],
            command=self._filter_content,
            width=120
        )
        self.content_filter.grid(row=0, column=2, padx=5, pady=15, sticky="w")
        
        # Content list
        self.discovered_content_frame = ctk.CTkScrollableFrame(self.discovered_tab)
        self.discovered_content_frame.grid(row=1, column=0, sticky="nsew", padx=10, pady=(0, 10))
        self.discovered_content_frame.grid_columnconfigure(0, weight=1)
    
    def _create_recommendations_tab(self):
        """Create source recommendations tab"""
        # Configure grid
        self.recommendations_tab.grid_columnconfigure(0, weight=1)
        self.recommendations_tab.grid_rowconfigure(1, weight=1)
        
        # Header
        rec_header = ctk.CTkFrame(self.recommendations_tab)
        rec_header.grid(row=0, column=0, sticky="ew", padx=10, pady=10)
        rec_header.grid_columnconfigure(1, weight=1)
        
        rec_title = ctk.CTkLabel(
            rec_header,
            text="Source Recommendations",
            font=ctk.CTkFont(size=16, weight="bold")
        )
        rec_title.grid(row=0, column=0, padx=15, pady=15, sticky="w")
        
        generate_rec_btn = ctk.CTkButton(
            rec_header,
            text="🎯 Generate Recommendations",
            command=self._generate_recommendations,
            width=180
        )
        generate_rec_btn.grid(row=0, column=1, padx=15, pady=15, sticky="e")
        
        # Recommendations list
        self.recommendations_frame = ctk.CTkScrollableFrame(self.recommendations_tab)
        self.recommendations_frame.grid(row=1, column=0, sticky="nsew", padx=10, pady=(0, 10))
        self.recommendations_frame.grid_columnconfigure(0, weight=1)
    
    def _create_patterns_tab(self):
        """Create content patterns tab"""
        # Configure grid
        self.patterns_tab.grid_columnconfigure(0, weight=1)
        self.patterns_tab.grid_rowconfigure(1, weight=1)
        
        # Header
        patterns_header = ctk.CTkFrame(self.patterns_tab)
        patterns_header.grid(row=0, column=0, sticky="ew", padx=10, pady=10)
        
        patterns_title = ctk.CTkLabel(
            patterns_header,
            text="Content Patterns",
            font=ctk.CTkFont(size=16, weight="bold")
        )
        patterns_title.grid(row=0, column=0, padx=15, pady=15, sticky="w")
        
        # Patterns list
        self.patterns_frame = ctk.CTkScrollableFrame(self.patterns_tab)
        self.patterns_frame.grid(row=1, column=0, sticky="nsew", padx=10, pady=(0, 10))
        self.patterns_frame.grid_columnconfigure(0, weight=1)
    
    def _refresh_display(self):
        """Refresh all content"""
        self._refresh_sources()
        self._refresh_discovered_content()
        self._refresh_recommendations()
        self._refresh_patterns()
    
    def _refresh_sources(self):
        """Refresh sources list"""
        try:
            # Clear existing content
            for widget in self.sources_frame.winfo_children():
                widget.destroy()
            
            current_persona = self.app.get_current_persona()
            if not current_persona:
                self._show_no_persona_message(self.sources_frame)
                return
            
            # Get sources
            sources = self.app.intelligent_scraper.get_content_sources(current_persona.id)
            
            if not sources:
                # Show empty state
                empty_label = ctk.CTkLabel(
                    self.sources_frame,
                    text="📡 No content sources yet\\n\\nClick 'Add Source' to add your first source,\\nor use 'Generate Recommendations' to discover sources automatically.",
                    font=ctk.CTkFont(size=14),
                    text_color=("gray60", "gray40")
                )
                empty_label.grid(row=0, column=0, pady=50)
                return
            
            # Display sources
            for i, source in enumerate(sources):
                self._create_source_widget(source, i)
                
        except Exception as e:
            logger.error(f"Error refreshing sources: {e}")
    
    def _create_source_widget(self, source: ContentSource, row: int):
        """Create widget for a content source"""
        try:
            source_frame = ctk.CTkFrame(self.sources_frame)
            source_frame.grid(row=row, column=0, sticky="ew", pady=5, padx=5)
            source_frame.grid_columnconfigure(1, weight=1)
            
            # Status indicator
            status_color = "green" if source.is_active else "gray"
            status_indicator = ctk.CTkLabel(
                source_frame,
                text="●",
                font=ctk.CTkFont(size=16),
                text_color=status_color
            )
            status_indicator.grid(row=0, column=0, padx=10, pady=10)
            
            # Source info
            info_frame = ctk.CTkFrame(source_frame, fg_color="transparent")
            info_frame.grid(row=0, column=1, sticky="ew", padx=5, pady=10)
            info_frame.grid_columnconfigure(0, weight=1)
            
            # URL
            url_label = ctk.CTkLabel(
                info_frame,
                text=source.url,
                font=ctk.CTkFont(size=12, weight="bold"),
                anchor="w"
            )
            url_label.grid(row=0, column=0, sticky="w")
            
            # Details
            details = []
            if source.keywords:
                details.append(f"Keywords: {', '.join(source.keywords[:3])}")
            details.append(f"Type: {source.source_type}")
            details.append(f"Frequency: {source.update_frequency}")
            
            details_text = " • ".join(details)
            details_label = ctk.CTkLabel(
                info_frame,
                text=details_text,
                font=ctk.CTkFont(size=10),
                text_color=("gray60", "gray40"),
                anchor="w"
            )
            details_label.grid(row=1, column=0, sticky="w")
            
            # Actions
            actions_frame = ctk.CTkFrame(source_frame, fg_color="transparent")
            actions_frame.grid(row=0, column=2, padx=10, pady=10)
            
            toggle_btn = ctk.CTkButton(
                actions_frame,
                text="⏸️" if source.is_active else "▶️",
                width=30,
                command=lambda s=source: self._toggle_source(s)
            )
            toggle_btn.grid(row=0, column=0, padx=2)
            
            remove_btn = ctk.CTkButton(
                actions_frame,
                text="🗑️",
                width=30,
                fg_color="red",
                hover_color="darkred",
                command=lambda s=source: self._remove_source(s)
            )
            remove_btn.grid(row=0, column=1, padx=2)
            
        except Exception as e:
            logger.error(f"Error creating source widget: {e}")
    
    def _refresh_discovered_content(self):
        """Refresh discovered content list"""
        try:
            # Clear existing content
            for widget in self.discovered_content_frame.winfo_children():
                widget.destroy()
            
            current_persona = self.app.get_current_persona()
            if not current_persona:
                self._show_no_persona_message(self.discovered_content_frame)
                return
            
            # Get discovered content
            content_items = self.app.intelligent_scraper.get_discovered_content(current_persona.id, limit=50)
            
            if not content_items:
                # Show empty state
                empty_label = ctk.CTkLabel(
                    self.discovered_content_frame,
                    text="📚 No content discovered yet\\n\\nStart content discovery to find relevant content for your persona.",
                    font=ctk.CTkFont(size=14),
                    text_color=("gray60", "gray40")
                )
                empty_label.grid(row=0, column=0, pady=50)
                return
            
            # Apply filters
            filtered_items = self._apply_content_filter(content_items)
            
            # Display content
            for i, item in enumerate(filtered_items):
                self._create_content_widget(item, i)
                
        except Exception as e:
            logger.error(f"Error refreshing discovered content: {e}")
    
    def _create_content_widget(self, content: DiscoveredContent, row: int):
        """Create widget for discovered content"""
        try:
            content_frame = ctk.CTkFrame(self.discovered_content_frame)
            content_frame.grid(row=row, column=0, sticky="ew", pady=3, padx=5)
            content_frame.grid_columnconfigure(1, weight=1)
            
            # Content type icon
            type_icons = {
                "text": "📝",
                "video": "🎥",
                "audio": "🎵",
                "image": "🖼️"
            }
            
            type_icon = ctk.CTkLabel(
                content_frame,
                text=type_icons.get(content.content_type, "📄"),
                font=ctk.CTkFont(size=16)
            )
            type_icon.grid(row=0, column=0, padx=10, pady=8)
            
            # Content info
            info_frame = ctk.CTkFrame(content_frame, fg_color="transparent")
            info_frame.grid(row=0, column=1, sticky="ew", padx=5, pady=8)
            info_frame.grid_columnconfigure(0, weight=1)
            
            # Title
            title_label = ctk.CTkLabel(
                info_frame,
                text=content.title[:60] + "..." if len(content.title) > 60 else content.title,
                font=ctk.CTkFont(size=12, weight="bold"),
                anchor="w"
            )
            title_label.grid(row=0, column=0, sticky="w")
            
            # Source and relevance
            source_text = f"From: {content.source_description} • Relevance: {content.relevance_score:.1%}"
            source_label = ctk.CTkLabel(
                info_frame,
                text=source_text,
                font=ctk.CTkFont(size=10),
                text_color=("gray60", "gray40"),
                anchor="w"
            )
            source_label.grid(row=1, column=0, sticky="w")
            
            # Relevance bar
            relevance_color = "green" if content.relevance_score > 0.7 else "orange" if content.relevance_score > 0.4 else "red"
            relevance_frame = ctk.CTkFrame(content_frame, fg_color="transparent")
            relevance_frame.grid(row=0, column=2, padx=10, pady=8)
            
            relevance_bar = ctk.CTkProgressBar(relevance_frame, width=80, height=8)
            relevance_bar.grid(row=0, column=0)
            relevance_bar.set(content.relevance_score)
            
        except Exception as e:
            logger.error(f"Error creating content widget: {e}")
    
    def _refresh_recommendations(self):
        """Refresh recommendations list"""
        try:
            # Clear existing content
            for widget in self.recommendations_frame.winfo_children():
                widget.destroy()
            
            current_persona = self.app.get_current_persona()
            if not current_persona:
                self._show_no_persona_message(self.recommendations_frame)
                return
            
            # Get recommendations
            recommendations = self.app.ml_discovery.get_source_recommendations(current_persona.id)
            
            if not recommendations:
                # Show empty state
                empty_label = ctk.CTkLabel(
                    self.recommendations_frame,
                    text="💡 No recommendations yet\\n\\nClick 'Generate Recommendations' to discover new sources based on AI analysis.",
                    font=ctk.CTkFont(size=14),
                    text_color=("gray60", "gray40")
                )
                empty_label.grid(row=0, column=0, pady=50)
                return
            
            # Display recommendations
            for i, rec in enumerate(recommendations):
                self._create_recommendation_widget(rec, i)
                
        except Exception as e:
            logger.error(f"Error refreshing recommendations: {e}")
    
    def _create_recommendation_widget(self, recommendation: SourceRecommendation, row: int):
        """Create widget for a source recommendation"""
        try:
            rec_frame = ctk.CTkFrame(self.recommendations_frame)
            rec_frame.grid(row=row, column=0, sticky="ew", pady=5, padx=5)
            rec_frame.grid_columnconfigure(1, weight=1)
            
            # Confidence indicator
            confidence_color = "green" if recommendation.confidence > 0.8 else "orange" if recommendation.confidence > 0.6 else "gray"
            confidence_indicator = ctk.CTkLabel(
                rec_frame,
                text="⭐" * int(recommendation.confidence * 5),
                font=ctk.CTkFont(size=12),
                text_color=confidence_color
            )
            confidence_indicator.grid(row=0, column=0, padx=10, pady=10)
            
            # Recommendation info
            info_frame = ctk.CTkFrame(rec_frame, fg_color="transparent")
            info_frame.grid(row=0, column=1, sticky="ew", padx=5, pady=10)
            info_frame.grid_columnconfigure(0, weight=1)
            
            # Title and URL
            title_label = ctk.CTkLabel(
                info_frame,
                text=recommendation.title,
                font=ctk.CTkFont(size=12, weight="bold"),
                anchor="w"
            )
            title_label.grid(row=0, column=0, sticky="w")
            
            url_label = ctk.CTkLabel(
                info_frame,
                text=recommendation.url,
                font=ctk.CTkFont(size=10),
                text_color=("blue", "lightblue"),
                anchor="w"
            )
            url_label.grid(row=1, column=0, sticky="w")
            
            # Reasoning
            reasoning_label = ctk.CTkLabel(
                info_frame,
                text=recommendation.reasoning,
                font=ctk.CTkFont(size=10),
                text_color=("gray60", "gray40"),
                anchor="w",
                wraplength=400
            )
            reasoning_label.grid(row=2, column=0, sticky="w")
            
            # Add button
            add_btn = ctk.CTkButton(
                rec_frame,
                text="➕ Add",
                width=60,
                command=lambda r=recommendation: self._add_recommended_source(r)
            )
            add_btn.grid(row=0, column=2, padx=10, pady=10)
            
        except Exception as e:
            logger.error(f"Error creating recommendation widget: {e}")
    
    def _refresh_patterns(self):
        """Refresh patterns list"""
        try:
            # Clear existing content
            for widget in self.patterns_frame.winfo_children():
                widget.destroy()
            
            current_persona = self.app.get_current_persona()
            if not current_persona:
                self._show_no_persona_message(self.patterns_frame)
                return
            
            # Get patterns
            patterns = self.app.ml_discovery.get_content_patterns(current_persona.id)
            
            if not patterns:
                # Show empty state
                empty_label = ctk.CTkLabel(
                    self.patterns_frame,
                    text="🧠 No patterns discovered yet\\n\\nClick 'Analyze Patterns' to discover content patterns using machine learning.",
                    font=ctk.CTkFont(size=14),
                    text_color=("gray60", "gray40")
                )
                empty_label.grid(row=0, column=0, pady=50)
                return
            
            # Display patterns
            for i, pattern in enumerate(patterns):
                self._create_pattern_widget(pattern, i)
                
        except Exception as e:
            logger.error(f"Error refreshing patterns: {e}")
    
    def _create_pattern_widget(self, pattern: ContentPattern, row: int):
        """Create widget for a content pattern"""
        try:
            pattern_frame = ctk.CTkFrame(self.patterns_frame)
            pattern_frame.grid(row=row, column=0, sticky="ew", pady=5, padx=5)
            pattern_frame.grid_columnconfigure(1, weight=1)
            
            # Pattern type icon
            type_icons = {
                "topic": "🏷️",
                "style_cluster": "🎨",
                "source_cluster": "📡"
            }
            
            type_icon = ctk.CTkLabel(
                pattern_frame,
                text=type_icons.get(pattern.pattern_type, "🧠"),
                font=ctk.CTkFont(size=16)
            )
            type_icon.grid(row=0, column=0, padx=10, pady=10)
            
            # Pattern info
            info_frame = ctk.CTkFrame(pattern_frame, fg_color="transparent")
            info_frame.grid(row=0, column=1, sticky="ew", padx=5, pady=10)
            info_frame.grid_columnconfigure(0, weight=1)
            
            # Description
            desc_label = ctk.CTkLabel(
                info_frame,
                text=pattern.description,
                font=ctk.CTkFont(size=12, weight="bold"),
                anchor="w"
            )
            desc_label.grid(row=0, column=0, sticky="w")
            
            # Keywords
            if pattern.keywords:
                keywords_text = f"Keywords: {', '.join(pattern.keywords[:5])}"
                keywords_label = ctk.CTkLabel(
                    info_frame,
                    text=keywords_text,
                    font=ctk.CTkFont(size=10),
                    text_color=("gray60", "gray40"),
                    anchor="w"
                )
                keywords_label.grid(row=1, column=0, sticky="w")
            
            # Strength indicator
            strength_frame = ctk.CTkFrame(pattern_frame, fg_color="transparent")
            strength_frame.grid(row=0, column=2, padx=10, pady=10)
            
            strength_label = ctk.CTkLabel(
                strength_frame,
                text=f"Strength: {pattern.strength:.1%}",
                font=ctk.CTkFont(size=10)
            )
            strength_label.grid(row=0, column=0)
            
            strength_bar = ctk.CTkProgressBar(strength_frame, width=60, height=8)
            strength_bar.grid(row=1, column=0)
            strength_bar.set(pattern.strength)
            
        except Exception as e:
            logger.error(f"Error creating pattern widget: {e}")
    
    def _show_no_persona_message(self, parent):
        """Show message when no persona is selected"""
        no_persona_label = ctk.CTkLabel(
            parent,
            text="👤 No persona selected\\n\\nPlease select or create a persona to manage content discovery.",
            font=ctk.CTkFont(size=14),
            text_color=("gray60", "gray40")
        )
        no_persona_label.grid(row=0, column=0, pady=50)
    
    def _apply_content_filter(self, content_items: List[DiscoveredContent]) -> List[DiscoveredContent]:
        """Apply content filter"""
        filter_value = self.content_filter.get()
        
        if filter_value == "All":
            return content_items
        elif filter_value == "High Relevance":
            return [item for item in content_items if item.relevance_score > 0.7]
        elif filter_value == "Recent":
            # Return items from last 7 days
            from datetime import datetime, timedelta
            cutoff = datetime.now() - timedelta(days=7)
            return [
                item for item in content_items 
                if datetime.fromisoformat(item.discovery_timestamp) > cutoff
            ]
        else:
            # Filter by content type
            content_type = filter_value.lower()
            return [item for item in content_items if item.content_type == content_type]
    
    # Action methods
    def _start_discovery(self):
        """Start content discovery"""
        try:
            current_persona = self.app.get_current_persona()
            if not current_persona:
                messagebox.showwarning("No Persona", "Please select a persona first.")
                return
            
            # Start discovery
            future = self.app.start_content_discovery(current_persona.id)
            if future:
                messagebox.showinfo("Discovery Started", f"Content discovery started for {current_persona.name}")
                # Refresh after a delay
                self.after(5000, self._refresh_discovered_content)
            else:
                messagebox.showerror("Error", "Failed to start content discovery.")
                
        except Exception as e:
            logger.error(f"Error starting discovery: {e}")
            messagebox.showerror("Error", f"Failed to start discovery: {str(e)}")
    
    def _analyze_patterns(self):
        """Analyze content patterns"""
        try:
            current_persona = self.app.get_current_persona()
            if not current_persona:
                messagebox.showwarning("No Persona", "Please select a persona first.")
                return
            
            # Start pattern analysis
            future = self.app.analyze_content_patterns(current_persona.id)
            if future:
                messagebox.showinfo("Analysis Started", "Content pattern analysis started")
                # Refresh after a delay
                self.after(10000, self._refresh_patterns)
            else:
                messagebox.showerror("Error", "Failed to start pattern analysis.")
                
        except Exception as e:
            logger.error(f"Error analyzing patterns: {e}")
            messagebox.showerror("Error", f"Failed to analyze patterns: {str(e)}")
    
    def _generate_recommendations(self):
        """Generate source recommendations"""
        try:
            current_persona = self.app.get_current_persona()
            if not current_persona:
                messagebox.showwarning("No Persona", "Please select a persona first.")
                return
            
            # Generate recommendations
            future = self.app.generate_source_recommendations(current_persona.id)
            if future:
                messagebox.showinfo("Generation Started", "Source recommendations are being generated")
                # Refresh after a delay
                self.after(15000, self._refresh_recommendations)
            else:
                messagebox.showerror("Error", "Failed to generate recommendations.")
                
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            messagebox.showerror("Error", f"Failed to generate recommendations: {str(e)}")
    
    def _add_source(self):
        """Add a new content source"""
        # This would open a dialog to add a source manually
        messagebox.showinfo("Add Source", "Manual source addition coming soon!")
    
    def _toggle_source(self, source: ContentSource):
        """Toggle source active status"""
        try:
            current_persona = self.app.get_current_persona()
            if current_persona:
                new_status = not source.is_active
                success = self.app.intelligent_scraper.update_source_status(
                    current_persona.id, source.url, new_status
                )
                if success:
                    self._refresh_sources()
                    
        except Exception as e:
            logger.error(f"Error toggling source: {e}")
    
    def _remove_source(self, source: ContentSource):
        """Remove a content source"""
        try:
            result = messagebox.askyesno(
                "Remove Source",
                f"Are you sure you want to remove this source?\\n\\n{source.url}"
            )
            
            if result:
                current_persona = self.app.get_current_persona()
                if current_persona:
                    success = self.app.intelligent_scraper.remove_content_source(
                        current_persona.id, source.url
                    )
                    if success:
                        self._refresh_sources()
                        
        except Exception as e:
            logger.error(f"Error removing source: {e}")
    
    def _add_recommended_source(self, recommendation: SourceRecommendation):
        """Add a recommended source"""
        try:
            current_persona = self.app.get_current_persona()
            if not current_persona:
                return
            
            # Add source
            success = self.app.intelligent_scraper.add_content_source(
                persona_id=current_persona.id,
                url=recommendation.url,
                source_type=recommendation.source_type,
                keywords=recommendation.keywords_matched,
                update_frequency=recommendation.estimated_update_frequency.lower(),
                relevance_threshold=0.5
            )
            
            if success:
                messagebox.showinfo("Source Added", f"Added source: {recommendation.title}")
                self._refresh_sources()
            else:
                messagebox.showerror("Error", "Failed to add source.")
                
        except Exception as e:
            logger.error(f"Error adding recommended source: {e}")
    
    def _filter_content(self, filter_value: str):
        """Handle content filter change"""
        self._refresh_discovered_content()