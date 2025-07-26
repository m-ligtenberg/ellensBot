import asyncio
import aiohttp
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Set, Any
from dataclasses import dataclass, asdict
from urllib.parse import urljoin, urlparse
import hashlib
import re

from ..utils.logger import logger
from ..core.persona import PersonaConfig

try:
    from bs4 import BeautifulSoup
    import requests
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    SCRAPING_DEPENDENCIES_AVAILABLE = True
except ImportError:
    logger.warning("Web scraping dependencies not available. Install: pip install beautifulsoup4 requests")
    SCRAPING_DEPENDENCIES_AVAILABLE = False

@dataclass
class DiscoveredContent:
    """Represents content discovered by the scraper"""
    url: str
    title: str
    content: str
    content_type: str  # "text", "video", "audio", "image"
    relevance_score: float
    discovery_timestamp: str
    source_description: str
    metadata: Dict[str, Any]
    persona_id: str

@dataclass
class ContentSource:
    """Represents a content source for monitoring"""
    url: str
    source_type: str  # "website", "rss", "api", "social"
    keywords: List[str]
    update_frequency: str  # "hourly", "daily", "weekly"
    last_checked: Optional[str]
    persona_id: str
    is_active: bool = True
    relevance_threshold: float = 0.5

class IntelligentScraper:
    """ML-powered web scraper for persona-specific content discovery"""
    
    def __init__(self):
        self.discovery_dir = Path.home() / ".cloneking" / "discovery"
        self.discovery_dir.mkdir(exist_ok=True, parents=True)
        
        self.sources_file = self.discovery_dir / "sources.json"
        self.content_file = self.discovery_dir / "discovered_content.json"
        
        self.sources: Dict[str, List[ContentSource]] = {}  # persona_id -> sources
        self.discovered_content: Dict[str, List[DiscoveredContent]] = {}  # persona_id -> content
        self.vectorizer = None
        
        if SCRAPING_DEPENDENCIES_AVAILABLE:
            self.vectorizer = TfidfVectorizer(stop_words='english', max_features=1000)
        
        self._load_sources()
        self._load_discovered_content()
    
    def _load_sources(self):
        """Load content sources from disk"""
        try:
            if self.sources_file.exists():
                with open(self.sources_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    for persona_id, sources_data in data.items():
                        self.sources[persona_id] = [
                            ContentSource(**source_data) for source_data in sources_data
                        ]
            logger.info(f"Loaded sources for {len(self.sources)} personas")
        except Exception as e:
            logger.error(f"Error loading sources: {e}")
    
    def _load_discovered_content(self):
        """Load discovered content from disk"""
        try:
            if self.content_file.exists():
                with open(self.content_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    for persona_id, content_data in data.items():
                        self.discovered_content[persona_id] = [
                            DiscoveredContent(**content_item) for content_item in content_data
                        ]
            logger.info(f"Loaded discovered content for {len(self.discovered_content)} personas")
        except Exception as e:
            logger.error(f"Error loading discovered content: {e}")
    
    def _save_sources(self):
        """Save content sources to disk"""
        try:
            data = {}
            for persona_id, sources in self.sources.items():
                data[persona_id] = [asdict(source) for source in sources]
            
            with open(self.sources_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Error saving sources: {e}")
    
    def _save_discovered_content(self):
        """Save discovered content to disk"""
        try:
            data = {}
            for persona_id, content_list in self.discovered_content.items():
                # Keep only recent content (last 30 days)
                cutoff_date = datetime.now() - timedelta(days=30)
                recent_content = [
                    content for content in content_list
                    if datetime.fromisoformat(content.discovery_timestamp) > cutoff_date
                ]
                data[persona_id] = [asdict(content) for content in recent_content]
            
            with open(self.content_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Error saving discovered content: {e}")
    
    def add_content_source(
        self,
        persona_id: str,
        url: str,
        source_type: str,
        keywords: List[str],
        update_frequency: str = "daily",
        relevance_threshold: float = 0.5
    ) -> bool:
        """Add a new content source for a persona"""
        try:
            source = ContentSource(
                url=url,
                source_type=source_type,
                keywords=keywords,
                update_frequency=update_frequency,
                last_checked=None,
                persona_id=persona_id,
                relevance_threshold=relevance_threshold
            )
            
            if persona_id not in self.sources:
                self.sources[persona_id] = []
            
            self.sources[persona_id].append(source)
            self._save_sources()
            
            logger.info(f"Added content source for persona {persona_id}: {url}")
            return True
            
        except Exception as e:
            logger.error(f"Error adding content source: {e}")
            return False
    
    def discover_sources_for_persona(self, persona: PersonaConfig) -> List[str]:
        """Automatically discover potential content sources based on persona description"""
        if not SCRAPING_DEPENDENCIES_AVAILABLE:
            logger.warning("Cannot discover sources - scraping dependencies not available")
            return []
        
        try:
            discovered_urls = []
            
            # Generate search queries from persona characteristics
            search_queries = self._generate_search_queries(persona)
            
            for query in search_queries[:5]:  # Limit to 5 queries
                urls = self._search_web_for_sources(query)
                discovered_urls.extend(urls[:3])  # Top 3 results per query
            
            # Remove duplicates and filter
            unique_urls = list(set(discovered_urls))
            filtered_urls = self._filter_relevant_sources(unique_urls, persona)
            
            logger.info(f"Discovered {len(filtered_urls)} potential sources for persona {persona.name}")
            return filtered_urls
            
        except Exception as e:
            logger.error(f"Error discovering sources: {e}")
            return []
    
    def _generate_search_queries(self, persona: PersonaConfig) -> List[str]:
        """Generate search queries based on persona characteristics"""
        queries = []
        
        # Use knowledge domains
        for domain in persona.knowledge_domains:
            queries.append(f'"{domain}" blog articles')
            queries.append(f'"{domain}" news updates')
        
        # Use personality traits for style matching
        if persona.personality_traits:
            trait_query = " ".join(persona.personality_traits[:3])
            queries.append(f'"{trait_query}" content creator')
        
        # Use description keywords
        description_words = persona.description.split()
        important_words = [word for word in description_words if len(word) > 4][:5]
        if important_words:
            queries.append(" ".join(important_words))
        
        return queries
    
    def _search_web_for_sources(self, query: str) -> List[str]:
        """Search the web for potential content sources"""
        # This is a placeholder - in a real implementation, you would:
        # 1. Use a search API (Google Custom Search, Bing, etc.)
        # 2. Parse search results
        # 3. Extract URLs from results
        
        # For now, return some example URLs based on the query
        example_sources = [
            "https://example-blog.com",
            "https://news-site.com", 
            "https://content-creator.com"
        ]
        
        logger.debug(f"Mock search for query: {query}")
        return example_sources
    
    def _filter_relevant_sources(self, urls: List[str], persona: PersonaConfig) -> List[str]:
        """Filter URLs based on relevance to persona"""
        if not SCRAPING_DEPENDENCIES_AVAILABLE:
            return urls[:5]  # Return first 5 if can't analyze
        
        relevant_urls = []
        
        for url in urls:
            try:
                # Quick check of the webpage content
                response = requests.get(url, timeout=10, headers={
                    'User-Agent': 'CloneKing Content Discovery Bot 1.0'
                })
                
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'html.parser')
                    text_content = soup.get_text()
                    
                    # Calculate relevance score
                    relevance = self._calculate_relevance(text_content, persona)
                    
                    if relevance > 0.3:  # Threshold for relevance
                        relevant_urls.append(url)
                        
            except Exception as e:
                logger.debug(f"Error checking URL {url}: {e}")
                continue
        
        return relevant_urls
    
    def _calculate_relevance(self, content: str, persona: PersonaConfig) -> float:
        """Calculate how relevant content is to a persona"""
        try:
            # Combine persona characteristics into a reference text
            persona_text = " ".join([
                persona.description,
                " ".join(persona.personality_traits),
                " ".join(persona.knowledge_domains),
                persona.communication_style
            ])
            
            # Use TF-IDF similarity
            if self.vectorizer:
                tfidf_matrix = self.vectorizer.fit_transform([persona_text, content])
                similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
                return float(similarity)
            else:
                # Fallback: simple keyword matching
                persona_words = set(persona_text.lower().split())
                content_words = set(content.lower().split())
                intersection = len(persona_words.intersection(content_words))
                union = len(persona_words.union(content_words))
                return intersection / union if union > 0 else 0.0
                
        except Exception as e:
            logger.error(f"Error calculating relevance: {e}")
            return 0.0
    
    async def scrape_content_for_persona(self, persona_id: str) -> List[DiscoveredContent]:
        """Scrape content from all sources for a specific persona"""
        if not SCRAPING_DEPENDENCIES_AVAILABLE:
            logger.warning("Cannot scrape content - dependencies not available")
            return []
        
        if persona_id not in self.sources:
            logger.info(f"No sources configured for persona {persona_id}")
            return []
        
        discovered_content = []
        
        async with aiohttp.ClientSession() as session:
            for source in self.sources[persona_id]:
                if not source.is_active:
                    continue
                
                try:
                    content_items = await self._scrape_source(session, source)
                    discovered_content.extend(content_items)
                    
                    # Update last checked timestamp
                    source.last_checked = datetime.now().isoformat()
                    
                except Exception as e:
                    logger.error(f"Error scraping source {source.url}: {e}")
                    continue
        
        # Save discovered content
        if persona_id not in self.discovered_content:
            self.discovered_content[persona_id] = []
        
        self.discovered_content[persona_id].extend(discovered_content)
        self._save_discovered_content()
        self._save_sources()
        
        logger.info(f"Discovered {len(discovered_content)} new content items for persona {persona_id}")
        return discovered_content
    
    async def _scrape_source(self, session: aiohttp.ClientSession, source: ContentSource) -> List[DiscoveredContent]:
        """Scrape content from a single source"""
        try:
            headers = {
                'User-Agent': 'CloneKing Content Discovery Bot 1.0'
            }
            
            async with session.get(source.url, headers=headers, timeout=30) as response:
                if response.status != 200:
                    logger.warning(f"HTTP {response.status} for {source.url}")
                    return []
                
                text = await response.text()
                soup = BeautifulSoup(text, 'html.parser')
                
                content_items = []
                
                if source.source_type == "website":
                    content_items = await self._extract_website_content(soup, source)
                elif source.source_type == "rss":
                    content_items = await self._extract_rss_content(text, source)
                # Add more source types as needed
                
                return content_items
                
        except Exception as e:
            logger.error(f"Error scraping source {source.url}: {e}")
            return []
    
    async def _extract_website_content(self, soup: BeautifulSoup, source: ContentSource) -> List[DiscoveredContent]:
        """Extract content from a website"""
        content_items = []
        
        try:
            # Extract articles, blog posts, etc.
            articles = soup.find_all(['article', 'div'], class_=re.compile(r'(post|article|content|entry)'))
            
            for article in articles[:10]:  # Limit to 10 articles per page
                title_elem = article.find(['h1', 'h2', 'h3'])
                title = title_elem.get_text().strip() if title_elem else "Untitled"
                
                # Extract text content
                content_text = article.get_text().strip()
                
                # Skip if content is too short
                if len(content_text) < 100:
                    continue
                
                # Calculate relevance
                relevance = self._calculate_content_relevance(content_text, source.keywords)
                
                if relevance >= source.relevance_threshold:
                    # Generate unique URL (might be relative)
                    link_elem = article.find('a')
                    url = urljoin(source.url, link_elem.get('href')) if link_elem else source.url
                    
                    content_item = DiscoveredContent(
                        url=url,
                        title=title,
                        content=content_text[:5000],  # Limit content length
                        content_type="text",
                        relevance_score=relevance,
                        discovery_timestamp=datetime.now().isoformat(),
                        source_description=f"Website: {source.url}",
                        metadata={
                            "source_type": source.source_type,
                            "keywords_matched": self._find_matching_keywords(content_text, source.keywords)
                        },
                        persona_id=source.persona_id
                    )
                    
                    content_items.append(content_item)
            
        except Exception as e:
            logger.error(f"Error extracting website content: {e}")
        
        return content_items
    
    async def _extract_rss_content(self, rss_text: str, source: ContentSource) -> List[DiscoveredContent]:
        """Extract content from RSS feed"""
        # Placeholder for RSS parsing
        # Would use feedparser library in real implementation
        return []
    
    def _calculate_content_relevance(self, content: str, keywords: List[str]) -> float:
        """Calculate relevance of content based on keywords"""
        if not keywords:
            return 0.5  # Default relevance if no keywords
        
        content_lower = content.lower()
        keyword_matches = sum(1 for keyword in keywords if keyword.lower() in content_lower)
        
        return min(1.0, keyword_matches / len(keywords))
    
    def _find_matching_keywords(self, content: str, keywords: List[str]) -> List[str]:
        """Find which keywords match in the content"""
        content_lower = content.lower()
        return [keyword for keyword in keywords if keyword.lower() in content_lower]
    
    def get_discovered_content(self, persona_id: str, limit: int = 50) -> List[DiscoveredContent]:
        """Get discovered content for a persona"""
        if persona_id not in self.discovered_content:
            return []
        
        # Return most recent content first
        content = sorted(
            self.discovered_content[persona_id],
            key=lambda x: x.discovery_timestamp,
            reverse=True
        )
        
        return content[:limit]
    
    def get_content_sources(self, persona_id: str) -> List[ContentSource]:
        """Get content sources for a persona"""
        return self.sources.get(persona_id, [])
    
    def update_source_status(self, persona_id: str, source_url: str, is_active: bool) -> bool:
        """Update the active status of a content source"""
        if persona_id not in self.sources:
            return False
        
        for source in self.sources[persona_id]:
            if source.url == source_url:
                source.is_active = is_active
                self._save_sources()
                return True
        
        return False
    
    def remove_content_source(self, persona_id: str, source_url: str) -> bool:
        """Remove a content source"""
        if persona_id not in self.sources:
            return False
        
        original_count = len(self.sources[persona_id])
        self.sources[persona_id] = [
            source for source in self.sources[persona_id] 
            if source.url != source_url
        ]
        
        if len(self.sources[persona_id]) < original_count:
            self._save_sources()
            return True
        
        return False