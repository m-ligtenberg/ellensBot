import numpy as np
import pandas as pd
import pickle
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import KMeans
from sklearn.decomposition import TruncatedSVD
import nltk
from textblob import TextBlob
from pathlib import Path
from ..utils.logger import logger
from ..utils.config import config

try:
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)
    nltk.download('vader_lexicon', quiet=True)
except:
    pass

class MLEngine:
    """Machine Learning engine for conversation analysis and response improvement"""
    
    def __init__(self):
        self.model_dir = Path.home() / ".youngellens" / "ml_models"
        self.model_dir.mkdir(exist_ok=True, parents=True)
        
        # ML Models
        self.vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 2),
            lowercase=True
        )
        self.similarity_model = None
        self.cluster_model = None
        self.response_patterns = {}
        self.conversation_embeddings = []
        self.user_preferences = {}
        
        # Data storage
        self.conversations_df = None
        self.response_history = []
        self.learning_data = []
        
        # Performance metrics
        self.response_ratings = []
        self.conversation_metrics = {
            'total_conversations': 0,
            'avg_response_time': 0,
            'user_satisfaction': 0,
            'topics_discussed': set()
        }
        
        self._initialize_models()
        logger.info("ML Engine initialized")
    
    def _initialize_models(self):
        """Initialize or load existing ML models"""
        try:
            # Try to load existing models
            self._load_models()
            
            # If no models exist, create initial training data
            if self.conversations_df is None or self.conversations_df.empty:
                self._create_initial_training_data()
                
        except Exception as e:
            logger.warning(f"Could not load existing models: {e}")
            self._create_initial_training_data()
    
    def _create_initial_training_data(self):
        """Create initial training data with Young Ellens personality patterns"""
        initial_data = [
            {"user_input": "hello", "response": "Yo! B-Negar, what's good? 😎", "topic": "greeting", "sentiment": 0.8},
            {"user_input": "how are you", "response": "Safe bro! I'm vibing, 020 energy! 🔥", "topic": "greeting", "sentiment": 0.9},
            {"user_input": "what's up", "response": "OWO! Just keeping it real in Amsterdam! 🎤", "topic": "greeting", "sentiment": 0.8},
            {"user_input": "music", "response": "B-Negar! Music is life, you feel me? 🎵", "topic": "music", "sentiment": 0.9},
            {"user_input": "amsterdam", "response": "020 representing! Amsterdam is mijn stad! 🏙️", "topic": "location", "sentiment": 0.9},
            {"user_input": "drugs", "response": "Alleen me wietje en me henny, verder niks! 🚫", "topic": "drugs", "sentiment": 0.3},
            {"user_input": "rap", "response": "Yo! That's what I do best! Street rap from the heart! 💯", "topic": "music", "sentiment": 0.9},
            {"user_input": "fire", "response": "YOOO! That's straight fire! 🔥🔥🔥", "topic": "positive", "sentiment": 0.95},
            {"user_input": "cool", "response": "Voor real! That's the vibe I'm talking about! ✨", "topic": "positive", "sentiment": 0.85},
            {"user_input": "sad", "response": "Ey yo, we all got our moments. Keep your head up! 💪", "topic": "support", "sentiment": 0.7}
        ]
        
        self.conversations_df = pd.DataFrame(initial_data)
        self._train_models()
    
    def _train_models(self):
        """Train ML models on conversation data"""
        try:
            if self.conversations_df is None or self.conversations_df.empty:
                logger.warning("No training data available")
                return
            
            # Extract features
            user_inputs = self.conversations_df['user_input'].astype(str).tolist()
            
            # Train TF-IDF vectorizer
            self.vectorizer.fit(user_inputs)
            
            # Create embeddings
            embeddings = self.vectorizer.transform(user_inputs)
            self.conversation_embeddings = embeddings.toarray()
            
            # Train clustering model
            n_clusters = min(5, len(user_inputs))
            if n_clusters > 1:
                self.cluster_model = KMeans(n_clusters=n_clusters, random_state=42)
                self.cluster_model.fit(self.conversation_embeddings)
            
            # Build response patterns
            self._build_response_patterns()
            
            # Save models
            self._save_models()
            
            logger.info(f"ML models trained on {len(user_inputs)} conversations")
            
        except Exception as e:
            logger.error(f"Error training ML models: {e}")
    
    def _build_response_patterns(self):
        """Build response patterns based on topics and sentiment"""
        self.response_patterns = {}
        
        for _, row in self.conversations_df.iterrows():
            topic = row.get('topic', 'general')
            sentiment = row.get('sentiment', 0.5)
            response = row.get('response', '')
            
            if topic not in self.response_patterns:
                self.response_patterns[topic] = {
                    'positive': [],
                    'neutral': [],
                    'negative': []
                }
            
            # Categorize by sentiment
            if sentiment > 0.7:
                sentiment_cat = 'positive'
            elif sentiment < 0.3:
                sentiment_cat = 'negative'
            else:
                sentiment_cat = 'neutral'
            
            self.response_patterns[topic][sentiment_cat].append(response)
    
    def analyze_message(self, message: str) -> Dict[str, Any]:
        """Analyze user message using ML"""
        try:
            # Sentiment analysis
            blob = TextBlob(message)
            sentiment = blob.sentiment.polarity
            
            # Topic detection using clustering
            message_embedding = self.vectorizer.transform([message])
            
            topic = "general"
            cluster_id = None
            
            if self.cluster_model and hasattr(self.cluster_model, 'predict'):
                cluster_id = self.cluster_model.predict(message_embedding)[0]
                
                # Map cluster to topic (simplified)
                topic_mapping = {
                    0: "greeting",
                    1: "music", 
                    2: "location",
                    3: "positive",
                    4: "general"
                }
                topic = topic_mapping.get(cluster_id, "general")
            
            # Find similar conversations
            similarities = []
            if len(self.conversation_embeddings) > 0:
                message_vec = message_embedding.toarray()[0]
                for emb in self.conversation_embeddings:
                    sim = cosine_similarity([message_vec], [emb])[0][0]
                    similarities.append(sim)
            
            max_similarity = max(similarities) if similarities else 0
            
            analysis = {
                'sentiment': sentiment,
                'topic': topic,
                'cluster_id': cluster_id,
                'max_similarity': max_similarity,
                'message_length': len(message),
                'word_count': len(message.split()),
                'timestamp': datetime.now().isoformat()
            }
            
            logger.debug(f"Message analysis: {analysis}")
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing message: {e}")
            return {
                'sentiment': 0.5,
                'topic': 'general',
                'cluster_id': None,
                'max_similarity': 0,
                'message_length': len(message),
                'word_count': len(message.split()),
                'timestamp': datetime.now().isoformat()
            }
    
    def suggest_response_style(self, analysis: Dict[str, Any]) -> str:
        """Suggest response style based on analysis"""
        sentiment = analysis.get('sentiment', 0.5)
        topic = analysis.get('topic', 'general')
        
        # Determine response style
        if sentiment > 0.7:
            return "hyped"  # High energy, excited
        elif sentiment < 0.3:
            return "supportive"  # Supportive, empathetic
        elif topic in ["music", "amsterdam", "positive"]:
            return "enthusiastic"  # Energetic but not over the top
        else:
            return "chill"  # Relaxed, casual
    
    def get_ml_enhanced_response(self, user_message: str) -> Optional[str]:
        """Get ML-enhanced response suggestion"""
        try:
            analysis = self.analyze_message(user_message)
            topic = analysis.get('topic', 'general')
            sentiment = analysis.get('sentiment', 0.5)
            
            # Get responses for topic and sentiment
            if topic in self.response_patterns:
                if sentiment > 0.7 and self.response_patterns[topic]['positive']:
                    responses = self.response_patterns[topic]['positive']
                elif sentiment < 0.3 and self.response_patterns[topic]['negative']:
                    responses = self.response_patterns[topic]['negative']
                else:
                    responses = self.response_patterns[topic]['neutral']
                
                if responses:
                    return np.random.choice(responses)
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting ML enhanced response: {e}")
            return None
    
    def learn_from_conversation(self, user_message: str, bot_response: str, user_rating: Optional[float] = None):
        """Learn from conversation interaction"""
        try:
            analysis = self.analyze_message(user_message)
            
            # Store learning data
            learning_entry = {
                'user_message': user_message,
                'bot_response': bot_response,
                'analysis': analysis,
                'user_rating': user_rating,
                'timestamp': datetime.now().isoformat()
            }
            
            self.learning_data.append(learning_entry)
            
            # Add to conversation dataframe
            new_row = {
                'user_input': user_message,
                'response': bot_response,
                'topic': analysis.get('topic', 'general'),
                'sentiment': analysis.get('sentiment', 0.5)
            }
            
            if self.conversations_df is not None:
                self.conversations_df = pd.concat([self.conversations_df, pd.DataFrame([new_row])], ignore_index=True)
            else:
                self.conversations_df = pd.DataFrame([new_row])
            
            # Update metrics
            self.conversation_metrics['total_conversations'] += 1
            if user_rating:
                self.response_ratings.append(user_rating)
                self.conversation_metrics['user_satisfaction'] = np.mean(self.response_ratings)
            
            # Retrain periodically
            if len(self.learning_data) % 10 == 0:
                self._train_models()
            
            logger.debug(f"Learned from conversation: {user_message[:50]}...")
            
        except Exception as e:
            logger.error(f"Error learning from conversation: {e}")
    
    def get_conversation_insights(self) -> Dict[str, Any]:
        """Get insights about conversations"""
        try:
            if not self.learning_data:
                return {"message": "No conversation data available"}
            
            # Analyze topics
            topics = [entry['analysis'].get('topic', 'general') for entry in self.learning_data]
            topic_counts = pd.Series(topics).value_counts().to_dict()
            
            # Analyze sentiment trends
            sentiments = [entry['analysis'].get('sentiment', 0.5) for entry in self.learning_data]
            avg_sentiment = np.mean(sentiments) if sentiments else 0.5
            
            # Response ratings
            avg_rating = np.mean(self.response_ratings) if self.response_ratings else 0
            
            insights = {
                'total_conversations': len(self.learning_data),
                'topic_distribution': topic_counts,
                'average_sentiment': avg_sentiment,
                'average_rating': avg_rating,
                'most_common_topic': max(topic_counts.items(), key=lambda x: x[1])[0] if topic_counts else 'none',
                'conversation_metrics': self.conversation_metrics
            }
            
            return insights
            
        except Exception as e:
            logger.error(f"Error generating insights: {e}")
            return {"error": str(e)}
    
    def _save_models(self):
        """Save ML models to disk"""
        try:
            # Save vectorizer
            with open(self.model_dir / "vectorizer.pkl", "wb") as f:
                pickle.dump(self.vectorizer, f)
            
            # Save cluster model
            if self.cluster_model:
                with open(self.model_dir / "cluster_model.pkl", "wb") as f:
                    pickle.dump(self.cluster_model, f)
            
            # Save response patterns
            with open(self.model_dir / "response_patterns.json", "w") as f:
                json.dump(self.response_patterns, f, indent=2)
            
            # Save conversation data
            if self.conversations_df is not None:
                self.conversations_df.to_csv(self.model_dir / "conversations.csv", index=False)
            
            # Save learning data
            with open(self.model_dir / "learning_data.json", "w") as f:
                json.dump(self.learning_data, f, indent=2)
            
            logger.debug("ML models saved successfully")
            
        except Exception as e:
            logger.error(f"Error saving ML models: {e}")
    
    def _load_models(self):
        """Load ML models from disk"""
        try:
            # Load vectorizer
            vectorizer_path = self.model_dir / "vectorizer.pkl"
            if vectorizer_path.exists():
                with open(vectorizer_path, "rb") as f:
                    self.vectorizer = pickle.load(f)
            
            # Load cluster model
            cluster_path = self.model_dir / "cluster_model.pkl"
            if cluster_path.exists():
                with open(cluster_path, "rb") as f:
                    self.cluster_model = pickle.load(f)
            
            # Load response patterns
            patterns_path = self.model_dir / "response_patterns.json"
            if patterns_path.exists():
                with open(patterns_path, "r") as f:
                    self.response_patterns = json.load(f)
            
            # Load conversation data
            conv_path = self.model_dir / "conversations.csv"
            if conv_path.exists():
                self.conversations_df = pd.read_csv(conv_path)
            
            # Load learning data
            learning_path = self.model_dir / "learning_data.json"
            if learning_path.exists():
                with open(learning_path, "r") as f:
                    self.learning_data = json.load(f)
            
            logger.info("ML models loaded successfully")
            
        except Exception as e:
            logger.error(f"Error loading ML models: {e}")
            raise
    
    def reset_learning_data(self):
        """Reset all learning data and models"""
        try:
            self.learning_data = []
            self.response_ratings = []
            self.conversation_metrics = {
                'total_conversations': 0,
                'avg_response_time': 0,
                'user_satisfaction': 0,
                'topics_discussed': set()
            }
            
            # Remove saved files
            for file in self.model_dir.glob("*"):
                file.unlink()
            
            # Reinitialize
            self._create_initial_training_data()
            
            logger.info("Learning data reset successfully")
            
        except Exception as e:
            logger.error(f"Error resetting learning data: {e}")