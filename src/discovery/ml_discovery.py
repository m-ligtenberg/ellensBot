import asyncio
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Set, Any, Tuple
from dataclasses import dataclass, asdict
import hashlib

from ..utils.logger import logger
from ..core.persona import PersonaConfig
from .intelligent_scraper import IntelligentScraper, DiscoveredContent, ContentSource

try:
    import numpy as np
    from sklearn.cluster import KMeans
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    from sklearn.decomposition import LatentDirichletAllocation
    import networkx as nx
    ML_DEPENDENCIES_AVAILABLE = True
except ImportError:
    logger.warning("ML Discovery dependencies not available")
    ML_DEPENDENCIES_AVAILABLE = False

@dataclass
class SourceRecommendation:
    """Represents a recommended content source"""
    url: str
    title: str
    description: str
    relevance_score: float
    confidence: float
    reasoning: str
    source_type: str
    estimated_update_frequency: str
    keywords_matched: List[str]
    discovered_via: str  # "similarity", "topic_modeling", "network_analysis"

@dataclass
class ContentPattern:
    """Represents a discovered content pattern"""
    pattern_id: str
    pattern_type: str  # "topic", "style", "source_cluster"
    description: str
    keywords: List[str]
    relevance_sources: List[str]
    strength: float
    discovery_timestamp: str

class MLDiscoveryEngine:
    """Machine Learning powered content source discovery"""
    
    def __init__(self, scraper: IntelligentScraper):
        self.scraper = scraper
        self.discovery_dir = Path.home() / ".cloneking" / "ml_discovery"
        self.discovery_dir.mkdir(exist_ok=True, parents=True)
        
        self.patterns_file = self.discovery_dir / "content_patterns.json"
        self.recommendations_file = self.discovery_dir / "source_recommendations.json"
        
        self.content_patterns: Dict[str, List[ContentPattern]] = {}  # persona_id -> patterns
        self.source_recommendations: Dict[str, List[SourceRecommendation]] = {}  # persona_id -> recommendations
        
        # ML models
        self.vectorizer = None
        self.topic_model = None
        self.source_graph = None
        
        if ML_DEPENDENCIES_AVAILABLE:
            self.vectorizer = TfidfVectorizer(
                max_features=1000,
                stop_words='english',
                ngram_range=(1, 2)
            )
        
        self._load_patterns()
        self._load_recommendations()
    
    def _load_patterns(self):
        """Load content patterns from disk"""
        try:
            if self.patterns_file.exists():
                with open(self.patterns_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    for persona_id, patterns_data in data.items():
                        self.content_patterns[persona_id] = [
                            ContentPattern(**pattern_data) for pattern_data in patterns_data
                        ]
            logger.info(f"Loaded content patterns for {len(self.content_patterns)} personas")
        except Exception as e:
            logger.error(f"Error loading content patterns: {e}")
    
    def _load_recommendations(self):
        """Load source recommendations from disk"""
        try:
            if self.recommendations_file.exists():
                with open(self.recommendations_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    for persona_id, rec_data in data.items():
                        self.source_recommendations[persona_id] = [
                            SourceRecommendation(**rec_item) for rec_item in rec_data
                        ]
            logger.info(f"Loaded recommendations for {len(self.source_recommendations)} personas")
        except Exception as e:
            logger.error(f"Error loading recommendations: {e}")
    
    def _save_patterns(self):
        """Save content patterns to disk"""
        try:
            data = {}
            for persona_id, patterns in self.content_patterns.items():
                data[persona_id] = [asdict(pattern) for pattern in patterns]
            
            with open(self.patterns_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Error saving patterns: {e}")
    
    def _save_recommendations(self):
        """Save recommendations to disk"""
        try:
            data = {}
            for persona_id, recommendations in self.source_recommendations.items():
                data[persona_id] = [asdict(rec) for rec in recommendations]
            
            with open(self.recommendations_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Error saving recommendations: {e}")
    
    async def analyze_persona_content_patterns(self, persona_id: str) -> List[ContentPattern]:
        """Analyze existing content to discover patterns"""
        if not ML_DEPENDENCIES_AVAILABLE:
            logger.warning("ML dependencies not available for pattern analysis")
            return []
        
        try:
            # Get discovered content for the persona
            content_items = self.scraper.get_discovered_content(persona_id, limit=200)
            
            if len(content_items) < 10:
                logger.info(f"Not enough content for pattern analysis (need 10+, have {len(content_items)})")
                return []
            
            patterns = []
            
            # Extract text content
            texts = [item.content for item in content_items if item.content_type == "text"]
            
            if texts:
                # Topic modeling patterns
                topic_patterns = await self._discover_topic_patterns(texts, persona_id)
                patterns.extend(topic_patterns)
                
                # Content clustering patterns
                cluster_patterns = await self._discover_clustering_patterns(texts, content_items, persona_id)
                patterns.extend(cluster_patterns)
                
                # Source relationship patterns
                source_patterns = await self._discover_source_patterns(content_items, persona_id)
                patterns.extend(source_patterns)
            
            # Store patterns
            self.content_patterns[persona_id] = patterns
            self._save_patterns()
            
            logger.info(f"Discovered {len(patterns)} content patterns for persona {persona_id}")
            return patterns
            
        except Exception as e:
            logger.error(f"Error analyzing content patterns: {e}")
            return []
    
    async def _discover_topic_patterns(self, texts: List[str], persona_id: str) -> List[ContentPattern]:
        """Discover topic patterns using LDA"""
        try:
            patterns = []
            
            if len(texts) < 5:
                return patterns
            
            # Vectorize texts
            tfidf_matrix = self.vectorizer.fit_transform(texts)
            
            # Apply LDA for topic modeling
            n_topics = min(5, max(2, len(texts) // 10))  # Adaptive number of topics
            lda = LatentDirichletAllocation(n_components=n_topics, random_state=42)
            lda.fit(tfidf_matrix)
            
            # Extract topics
            feature_names = self.vectorizer.get_feature_names_out()
            
            for topic_idx, topic in enumerate(lda.components_):
                # Get top words for this topic
                top_word_indices = topic.argsort()[-10:][::-1]
                top_words = [feature_names[i] for i in top_word_indices]
                
                # Calculate topic strength
                topic_strength = float(np.mean(topic[top_word_indices]))
                
                if topic_strength > 0.1:  # Only include significant topics
                    pattern = ContentPattern(
                        pattern_id=f"topic_{persona_id}_{topic_idx}",
                        pattern_type="topic",
                        description=f"Topic cluster around: {', '.join(top_words[:5])}",
                        keywords=top_words,
                        relevance_sources=[],
                        strength=topic_strength,
                        discovery_timestamp=datetime.now().isoformat()
                    )
                    patterns.append(pattern)
            
            return patterns
            
        except Exception as e:
            logger.error(f"Error discovering topic patterns: {e}")
            return []
    
    async def _discover_clustering_patterns(
        self, 
        texts: List[str], 
        content_items: List[DiscoveredContent], 
        persona_id: str
    ) -> List[ContentPattern]:
        """Discover content clustering patterns"""
        try:
            patterns = []
            
            if len(texts) < 10:
                return patterns
            
            # Vectorize and cluster content
            tfidf_matrix = self.vectorizer.fit_transform(texts)
            
            n_clusters = min(5, max(2, len(texts) // 15))
            kmeans = KMeans(n_clusters=n_clusters, random_state=42)
            cluster_labels = kmeans.fit_predict(tfidf_matrix)
            
            # Analyze each cluster
            for cluster_id in range(n_clusters):
                cluster_indices = np.where(cluster_labels == cluster_id)[0]
                
                if len(cluster_indices) < 3:  # Skip small clusters
                    continue
                
                # Get cluster content
                cluster_items = [content_items[i] for i in cluster_indices]
                cluster_sources = list(set(item.source_description for item in cluster_items))
                
                # Extract representative keywords
                cluster_texts = [texts[i] for i in cluster_indices]
                cluster_tfidf = self.vectorizer.transform(cluster_texts)
                mean_tfidf = np.mean(cluster_tfidf.toarray(), axis=0)
                
                top_feature_indices = mean_tfidf.argsort()[-10:][::-1]
                feature_names = self.vectorizer.get_feature_names_out()
                cluster_keywords = [feature_names[i] for i in top_feature_indices]
                
                pattern = ContentPattern(
                    pattern_id=f"cluster_{persona_id}_{cluster_id}",
                    pattern_type="style_cluster",
                    description=f"Content style cluster with {len(cluster_indices)} items",
                    keywords=cluster_keywords,
                    relevance_sources=cluster_sources,
                    strength=float(len(cluster_indices) / len(texts)),
                    discovery_timestamp=datetime.now().isoformat()
                )
                patterns.append(pattern)
            
            return patterns
            
        except Exception as e:
            logger.error(f"Error discovering clustering patterns: {e}")
            return []
    
    async def _discover_source_patterns(
        self, 
        content_items: List[DiscoveredContent], 
        persona_id: str
    ) -> List[ContentPattern]:
        """Discover source relationship patterns"""
        try:
            patterns = []
            
            # Analyze source distributions
            source_counts = {}
            source_relevance = {}
            
            for item in content_items:
                source = item.source_description
                source_counts[source] = source_counts.get(source, 0) + 1
                
                if source not in source_relevance:
                    source_relevance[source] = []
                source_relevance[source].append(item.relevance_score)
            
            # Find high-performing source clusters
            for source, count in source_counts.items():
                if count >= 3:  # Sources with multiple content items
                    avg_relevance = np.mean(source_relevance[source])
                    
                    if avg_relevance > 0.6:  # High-relevance sources
                        pattern = ContentPattern(
                            pattern_id=f"source_{persona_id}_{hashlib.md5(source.encode()).hexdigest()[:8]}",
                            pattern_type="source_cluster",
                            description=f"High-performing source: {source}",
                            keywords=[],
                            relevance_sources=[source],
                            strength=float(avg_relevance),
                            discovery_timestamp=datetime.now().isoformat()
                        )
                        patterns.append(pattern)
            
            return patterns
            
        except Exception as e:
            logger.error(f"Error discovering source patterns: {e}")
            return []
    
    async def generate_source_recommendations(self, persona: PersonaConfig) -> List[SourceRecommendation]:
        """Generate intelligent source recommendations for a persona"""
        try:
            recommendations = []
            
            # Get existing patterns for this persona
            patterns = self.content_patterns.get(persona.id, [])
            
            if not patterns:
                # No patterns yet, use persona description for initial recommendations
                recommendations = await self._generate_initial_recommendations(persona)
            else:
                # Use patterns to find similar sources
                recommendations = await self._generate_pattern_based_recommendations(persona, patterns)
            
            # Deduplicate and rank recommendations
            recommendations = self._deduplicate_recommendations(recommendations)
            recommendations.sort(key=lambda x: x.relevance_score * x.confidence, reverse=True)
            
            # Store recommendations
            self.source_recommendations[persona.id] = recommendations[:20]  # Keep top 20
            self._save_recommendations()
            
            logger.info(f"Generated {len(recommendations)} source recommendations for {persona.name}")
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return []
    
    async def _generate_initial_recommendations(self, persona: PersonaConfig) -> List[SourceRecommendation]:
        """Generate initial recommendations based on persona description"""
        recommendations = []
        
        # Use the intelligent scraper to discover initial sources
        discovered_urls = self.scraper.discover_sources_for_persona(persona)
        
        for url in discovered_urls:
            rec = SourceRecommendation(
                url=url,
                title=f"Discovered source for {persona.name}",
                description="Automatically discovered based on persona characteristics",
                relevance_score=0.7,
                confidence=0.6,
                reasoning="Initial discovery based on persona description and knowledge domains",
                source_type="website",
                estimated_update_frequency="daily",
                keywords_matched=persona.knowledge_domains[:3],
                discovered_via="similarity"
            )
            recommendations.append(rec)
        
        return recommendations
    
    async def _generate_pattern_based_recommendations(
        self, 
        persona: PersonaConfig, 
        patterns: List[ContentPattern]
    ) -> List[SourceRecommendation]:
        """Generate recommendations based on discovered patterns"""
        recommendations = []
        
        try:
            # For each pattern, find similar sources
            for pattern in patterns:
                if pattern.strength < 0.3:  # Skip weak patterns
                    continue
                
                # Generate search queries from pattern keywords
                pattern_recommendations = await self._find_sources_for_pattern(pattern, persona)
                recommendations.extend(pattern_recommendations)
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generating pattern-based recommendations: {e}")
            return []
    
    async def _find_sources_for_pattern(
        self, 
        pattern: ContentPattern, 
        persona: PersonaConfig
    ) -> List[SourceRecommendation]:
        """Find sources that match a specific content pattern"""
        recommendations = []
        
        # This would integrate with search APIs or web crawling
        # For now, we'll create example recommendations based on the pattern
        
        if pattern.pattern_type == "topic":
            for i, keyword in enumerate(pattern.keywords[:3]):
                rec = SourceRecommendation(
                    url=f"https://example-{keyword.replace(' ', '-')}-site.com",
                    title=f"{keyword.title()} Content Hub",
                    description=f"Specialized content source for {keyword}",
                    relevance_score=pattern.strength * 0.9,
                    confidence=0.8,
                    reasoning=f"Matches topic pattern: {pattern.description}",
                    source_type="website",
                    estimated_update_frequency="daily",
                    keywords_matched=[keyword],
                    discovered_via="topic_modeling"
                )
                recommendations.append(rec)
        
        return recommendations
    
    def _deduplicate_recommendations(self, recommendations: List[SourceRecommendation]) -> List[SourceRecommendation]:
        """Remove duplicate recommendations"""
        seen_urls = set()
        unique_recommendations = []
        
        for rec in recommendations:
            if rec.url not in seen_urls:
                seen_urls.add(rec.url)
                unique_recommendations.append(rec)
        
        return unique_recommendations
    
    async def monitor_content_quality(self, persona_id: str) -> Dict[str, Any]:
        """Monitor the quality of discovered content for a persona"""
        try:
            content_items = self.scraper.get_discovered_content(persona_id, limit=100)
            
            if not content_items:
                return {"status": "no_content", "recommendations": []}
            
            # Analyze content quality metrics
            relevance_scores = [item.relevance_score for item in content_items]
            avg_relevance = np.mean(relevance_scores)
            relevance_trend = self._calculate_relevance_trend(content_items)
            
            # Source diversity
            sources = set(item.source_description for item in content_items)
            source_diversity = len(sources) / len(content_items) if content_items else 0
            
            # Content freshness
            recent_content = [
                item for item in content_items
                if (datetime.now() - datetime.fromisoformat(item.discovery_timestamp)).days <= 7
            ]
            freshness_ratio = len(recent_content) / len(content_items) if content_items else 0
            
            quality_report = {
                "status": "analyzed",
                "metrics": {
                    "average_relevance": float(avg_relevance),
                    "relevance_trend": relevance_trend,
                    "source_diversity": float(source_diversity),
                    "content_freshness": float(freshness_ratio),
                    "total_content_items": len(content_items),
                    "unique_sources": len(sources)
                },
                "recommendations": []
            }
            
            # Generate improvement recommendations
            if avg_relevance < 0.6:
                quality_report["recommendations"].append(
                    "Consider refining content source keywords to improve relevance"
                )
            
            if source_diversity < 0.3:
                quality_report["recommendations"].append(
                    "Add more diverse content sources to improve variety"
                )
            
            if freshness_ratio < 0.2:
                quality_report["recommendations"].append(
                    "Some content sources may not be updating regularly"
                )
            
            return quality_report
            
        except Exception as e:
            logger.error(f"Error monitoring content quality: {e}")
            return {"status": "error", "error": str(e)}
    
    def _calculate_relevance_trend(self, content_items: List[DiscoveredContent]) -> str:
        """Calculate whether content relevance is improving, declining, or stable"""
        try:
            # Sort by discovery timestamp
            sorted_items = sorted(content_items, key=lambda x: x.discovery_timestamp)
            
            if len(sorted_items) < 10:
                return "insufficient_data"
            
            # Split into older and newer halves
            mid_point = len(sorted_items) // 2
            older_half = sorted_items[:mid_point]
            newer_half = sorted_items[mid_point:]
            
            older_avg = np.mean([item.relevance_score for item in older_half])
            newer_avg = np.mean([item.relevance_score for item in newer_half])
            
            difference = newer_avg - older_avg
            
            if difference > 0.1:
                return "improving"
            elif difference < -0.1:
                return "declining"
            else:
                return "stable"
                
        except Exception as e:
            logger.error(f"Error calculating relevance trend: {e}")
            return "unknown"
    
    def get_content_patterns(self, persona_id: str) -> List[ContentPattern]:
        """Get discovered content patterns for a persona"""
        return self.content_patterns.get(persona_id, [])
    
    def get_source_recommendations(self, persona_id: str) -> List[SourceRecommendation]:
        """Get source recommendations for a persona"""
        return self.source_recommendations.get(persona_id, [])
    
    async def auto_discover_and_monitor(self, persona_id: str) -> Dict[str, Any]:
        """Automatically discover patterns and generate recommendations"""
        try:
            # First, analyze existing content for patterns
            patterns = await self.analyze_persona_content_patterns(persona_id)
            
            # Get persona config
            # Note: This would need to be passed in or retrieved from persona manager
            # For now, we'll skip the recommendation generation part
            
            # Monitor content quality
            quality_report = await self.monitor_content_quality(persona_id)
            
            return {
                "patterns_discovered": len(patterns),
                "quality_report": quality_report,
                "status": "completed"
            }
            
        except Exception as e:
            logger.error(f"Error in auto discovery and monitoring: {e}")
            return {"status": "error", "error": str(e)}