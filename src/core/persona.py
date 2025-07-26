import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from ..utils.logger import logger
from ..utils.config import config

@dataclass
class PersonaConfig:
    """Configuration for an AI persona"""
    id: str
    name: str
    description: str
    personality_traits: List[str]
    communication_style: str
    knowledge_domains: List[str]
    voice_characteristics: Dict[str, Any]
    visual_characteristics: Dict[str, Any]
    source_preferences: Dict[str, Any]
    training_data_paths: Dict[str, List[str]]
    created_at: str
    updated_at: str
    is_active: bool = True
    version: str = "1.0"

class PersonaManager:
    """Manages AI personas and their configurations"""
    
    def __init__(self):
        self.personas_dir = Path.home() / ".cloneking" / "personas"
        self.personas_dir.mkdir(exist_ok=True, parents=True)
        self.current_persona_id: Optional[str] = None
        self.personas: Dict[str, PersonaConfig] = {}
        self._load_personas()
        
    def _load_personas(self):
        """Load all personas from disk"""
        try:
            for persona_file in self.personas_dir.glob("*.json"):
                with open(persona_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    persona = PersonaConfig(**data)
                    self.personas[persona.id] = persona
            
            logger.info(f"Loaded {len(self.personas)} personas")
            
            # Set default persona if none selected
            if not self.current_persona_id and self.personas:
                self.current_persona_id = list(self.personas.keys())[0]
                
        except Exception as e:
            logger.error(f"Error loading personas: {e}")
    
    def create_persona(
        self,
        name: str,
        description: str,
        personality_traits: List[str],
        communication_style: str,
        knowledge_domains: List[str],
        source_preferences: Dict[str, Any] = None
    ) -> PersonaConfig:
        """Create a new persona"""
        try:
            persona_id = str(uuid.uuid4())
            timestamp = datetime.now().isoformat()
            
            persona = PersonaConfig(
                id=persona_id,
                name=name,
                description=description,
                personality_traits=personality_traits,
                communication_style=communication_style,
                knowledge_domains=knowledge_domains,
                voice_characteristics={},
                visual_characteristics={},
                source_preferences=source_preferences or {},
                training_data_paths={
                    "audio": [],
                    "video": [],
                    "text": [],
                    "images": []
                },
                created_at=timestamp,
                updated_at=timestamp
            )
            
            self.personas[persona_id] = persona
            self._save_persona(persona)
            
            # Set as current persona if it's the first one
            if not self.current_persona_id:
                self.current_persona_id = persona_id
            
            logger.info(f"Created persona: {name} ({persona_id})")
            return persona
            
        except Exception as e:
            logger.error(f"Error creating persona: {e}")
            raise
    
    def update_persona(self, persona_id: str, updates: Dict[str, Any]) -> bool:
        """Update an existing persona"""
        try:
            if persona_id not in self.personas:
                logger.warning(f"Persona not found: {persona_id}")
                return False
            
            persona = self.personas[persona_id]
            
            # Update fields
            for key, value in updates.items():
                if hasattr(persona, key):
                    setattr(persona, key, value)
            
            persona.updated_at = datetime.now().isoformat()
            self._save_persona(persona)
            
            logger.info(f"Updated persona: {persona.name} ({persona_id})")
            return True
            
        except Exception as e:
            logger.error(f"Error updating persona: {e}")
            return False
    
    def delete_persona(self, persona_id: str) -> bool:
        """Delete a persona"""
        try:
            if persona_id not in self.personas:
                logger.warning(f"Persona not found: {persona_id}")
                return False
            
            persona = self.personas[persona_id]
            
            # Remove persona file
            persona_file = self.personas_dir / f"{persona_id}.json"
            if persona_file.exists():
                persona_file.unlink()
            
            # Remove from memory
            del self.personas[persona_id]
            
            # Update current persona if this was the active one
            if self.current_persona_id == persona_id:
                self.current_persona_id = list(self.personas.keys())[0] if self.personas else None
            
            logger.info(f"Deleted persona: {persona.name} ({persona_id})")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting persona: {e}")
            return False
    
    def get_persona(self, persona_id: str) -> Optional[PersonaConfig]:
        """Get a specific persona"""
        return self.personas.get(persona_id)
    
    def get_current_persona(self) -> Optional[PersonaConfig]:
        """Get the currently active persona"""
        if self.current_persona_id:
            return self.personas.get(self.current_persona_id)
        return None
    
    def set_current_persona(self, persona_id: str) -> bool:
        """Set the current active persona"""
        if persona_id in self.personas:
            self.current_persona_id = persona_id
            config.set("cloneking.current_persona", persona_id)
            logger.info(f"Switched to persona: {self.personas[persona_id].name}")
            return True
        return False
    
    def list_personas(self) -> List[PersonaConfig]:
        """Get all personas"""
        return list(self.personas.values())
    
    def get_all_personas(self) -> List[PersonaConfig]:
        """Get all personas (alias for list_personas)"""
        return self.list_personas()
    
    def add_training_data(self, persona_id: str, data_type: str, file_paths: List[str]) -> bool:
        """Add training data to a persona"""
        try:
            if persona_id not in self.personas:
                return False
            
            persona = self.personas[persona_id]
            
            if data_type not in persona.training_data_paths:
                persona.training_data_paths[data_type] = []
            
            persona.training_data_paths[data_type].extend(file_paths)
            persona.updated_at = datetime.now().isoformat()
            
            self._save_persona(persona)
            logger.info(f"Added {len(file_paths)} {data_type} files to persona {persona.name}")
            return True
            
        except Exception as e:
            logger.error(f"Error adding training data: {e}")
            return False
    
    def _save_persona(self, persona: PersonaConfig):
        """Save persona to disk"""
        try:
            persona_file = self.personas_dir / f"{persona.id}.json"
            with open(persona_file, 'w', encoding='utf-8') as f:
                json.dump(asdict(persona), f, indent=2, ensure_ascii=False)
                
        except Exception as e:
            logger.error(f"Error saving persona: {e}")
            raise
    
    def export_persona(self, persona_id: str, export_path: str) -> bool:
        """Export persona configuration to file"""
        try:
            if persona_id not in self.personas:
                return False
            
            persona = self.personas[persona_id]
            
            with open(export_path, 'w', encoding='utf-8') as f:
                json.dump(asdict(persona), f, indent=2, ensure_ascii=False)
            
            logger.info(f"Exported persona {persona.name} to {export_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error exporting persona: {e}")
            return False
    
    def import_persona(self, import_path: str) -> Optional[PersonaConfig]:
        """Import persona configuration from file"""
        try:
            with open(import_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Generate new ID to avoid conflicts
            data['id'] = str(uuid.uuid4())
            data['updated_at'] = datetime.now().isoformat()
            
            persona = PersonaConfig(**data)
            self.personas[persona.id] = persona
            self._save_persona(persona)
            
            logger.info(f"Imported persona: {persona.name}")
            return persona
            
        except Exception as e:
            logger.error(f"Error importing persona: {e}")
            return None
    
    def get_persona_statistics(self, persona_id: str) -> Dict[str, Any]:
        """Get statistics about a persona's training data"""
        if persona_id not in self.personas:
            return {}
        
        persona = self.personas[persona_id]
        stats = {
            "name": persona.name,
            "created_at": persona.created_at,
            "updated_at": persona.updated_at,
            "training_data_counts": {},
            "total_files": 0,
            "training_data_size": {},
            "last_training": None,
            "model_version": persona.version
        }
        
        total_size = 0
        for data_type, files in persona.training_data_paths.items():
            count = len(files)
            size = 0
            
            # Calculate total size of training files
            for file_path in files:
                try:
                    if Path(file_path).exists():
                        size += Path(file_path).stat().st_size
                except (OSError, AttributeError):
                    continue
            
            stats["training_data_counts"][data_type] = count
            stats["training_data_size"][data_type] = size
            stats["total_files"] += count
            total_size += size
        
        stats["total_size"] = total_size
        
        # Check for training completion timestamp
        training_dir = Path.home() / ".cloneking" / "training" / persona_id
        if training_dir.exists():
            training_log = training_dir / "training.log"
            if training_log.exists():
                stats["last_training"] = datetime.fromtimestamp(
                    training_log.stat().st_mtime
                ).isoformat()
        
        return stats
    
    def clone_persona(self, persona_id: str, new_name: str) -> Optional[PersonaConfig]:
        """Clone an existing persona with a new name"""
        try:
            if persona_id not in self.personas:
                logger.warning(f"Source persona not found: {persona_id}")
                return None
            
            source_persona = self.personas[persona_id]
            
            # Create new persona data
            new_id = str(uuid.uuid4())
            timestamp = datetime.now().isoformat()
            
            # Copy all data except ID and name
            persona_data = asdict(source_persona)
            persona_data.update({
                'id': new_id,
                'name': new_name,
                'created_at': timestamp,
                'updated_at': timestamp,
                'training_data_paths': {
                    k: v.copy() for k, v in source_persona.training_data_paths.items()
                }
            })
            
            cloned_persona = PersonaConfig(**persona_data)
            self.personas[new_id] = cloned_persona
            self._save_persona(cloned_persona)
            
            logger.info(f"Cloned persona '{source_persona.name}' as '{new_name}'")
            return cloned_persona
            
        except Exception as e:
            logger.error(f"Error cloning persona: {e}")
            return None
    
    def backup_persona(self, persona_id: str, backup_dir: Optional[str] = None) -> Optional[str]:
        """Create a backup of a persona including all training data"""
        try:
            if persona_id not in self.personas:
                return None
            
            persona = self.personas[persona_id]
            
            # Create backup directory
            if backup_dir is None:
                backup_dir = Path.home() / ".cloneking" / "backups"
            backup_dir = Path(backup_dir)
            backup_dir.mkdir(parents=True, exist_ok=True)
            
            # Create timestamped backup folder
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            persona_backup_dir = backup_dir / f"{persona.name}_{timestamp}"
            persona_backup_dir.mkdir(exist_ok=True)
            
            # Export persona configuration
            config_path = persona_backup_dir / "persona.json"
            with open(config_path, 'w', encoding='utf-8') as f:
                json.dump(asdict(persona), f, indent=2, ensure_ascii=False)
            
            # Copy training data
            training_backup_dir = persona_backup_dir / "training_data"
            training_backup_dir.mkdir(exist_ok=True)
            
            for data_type, files in persona.training_data_paths.items():
                type_dir = training_backup_dir / data_type
                type_dir.mkdir(exist_ok=True)
                
                for file_path in files:
                    try:
                        source_file = Path(file_path)
                        if source_file.exists():
                            dest_file = type_dir / source_file.name
                            import shutil
                            shutil.copy2(source_file, dest_file)
                    except Exception as file_error:
                        logger.warning(f"Could not backup file {file_path}: {file_error}")
            
            # Copy trained models if they exist
            training_dir = Path.home() / ".cloneking" / "training" / persona_id
            if training_dir.exists():
                models_backup_dir = persona_backup_dir / "models"
                import shutil
                shutil.copytree(training_dir, models_backup_dir, dirs_exist_ok=True)
            
            logger.info(f"Backed up persona '{persona.name}' to {persona_backup_dir}")
            return str(persona_backup_dir)
            
        except Exception as e:
            logger.error(f"Error backing up persona: {e}")
            return None
    
    def restore_persona_from_backup(self, backup_path: str) -> Optional[PersonaConfig]:
        """Restore a persona from a backup directory"""
        try:
            backup_dir = Path(backup_path)
            if not backup_dir.exists():
                logger.error(f"Backup directory not found: {backup_path}")
                return None
            
            # Load persona configuration
            config_path = backup_dir / "persona.json"
            if not config_path.exists():
                logger.error(f"Persona configuration not found in backup: {config_path}")
                return None
            
            with open(config_path, 'r', encoding='utf-8') as f:
                persona_data = json.load(f)
            
            # Generate new ID to avoid conflicts
            new_id = str(uuid.uuid4())
            persona_data['id'] = new_id
            persona_data['updated_at'] = datetime.now().isoformat()
            
            # Create persona
            persona = PersonaConfig(**persona_data)
            
            # Restore training data to appropriate locations
            training_backup_dir = backup_dir / "training_data"
            if training_backup_dir.exists():
                persona_training_dir = Path.home() / ".cloneking" / "training" / new_id
                persona_training_dir.mkdir(parents=True, exist_ok=True)
                
                # Update file paths in persona configuration
                new_training_paths = {}
                
                for data_type, files in persona.training_data_paths.items():
                    type_backup_dir = training_backup_dir / data_type
                    if type_backup_dir.exists():
                        new_paths = []
                        type_restore_dir = persona_training_dir / data_type
                        type_restore_dir.mkdir(exist_ok=True)
                        
                        for backup_file in type_backup_dir.iterdir():
                            if backup_file.is_file():
                                dest_file = type_restore_dir / backup_file.name
                                import shutil
                                shutil.copy2(backup_file, dest_file)
                                new_paths.append(str(dest_file))
                        
                        new_training_paths[data_type] = new_paths
                    else:
                        new_training_paths[data_type] = []
                
                persona.training_data_paths = new_training_paths
            
            # Restore trained models
            models_backup_dir = backup_dir / "models"
            if models_backup_dir.exists():
                models_restore_dir = Path.home() / ".cloneking" / "training" / new_id
                import shutil
                shutil.copytree(models_backup_dir, models_restore_dir, dirs_exist_ok=True)
            
            # Save restored persona
            self.personas[new_id] = persona
            self._save_persona(persona)
            
            logger.info(f"Restored persona '{persona.name}' from backup")
            return persona
            
        except Exception as e:
            logger.error(f"Error restoring persona from backup: {e}")
            return None
    
    def search_personas(self, query: str, search_fields: List[str] = None) -> List[PersonaConfig]:
        """Search personas by name, description, or other fields"""
        if search_fields is None:
            search_fields = ['name', 'description', 'personality_traits', 'knowledge_domains']
        
        query = query.lower()
        matching_personas = []
        
        for persona in self.personas.values():
            for field in search_fields:
                field_value = getattr(persona, field, '')
                
                if isinstance(field_value, str):
                    if query in field_value.lower():
                        matching_personas.append(persona)
                        break
                elif isinstance(field_value, list):
                    if any(query in str(item).lower() for item in field_value):
                        matching_personas.append(persona)
                        break
        
        return matching_personas
    
    def get_persona_templates(self) -> Dict[str, Dict[str, Any]]:
        """Get predefined persona templates for quick creation"""
        return {
            "assistant": {
                "name": "AI Assistant",
                "description": "A helpful and knowledgeable AI assistant",
                "personality_traits": ["helpful", "friendly", "professional", "knowledgeable"],
                "communication_style": "professional and clear",
                "knowledge_domains": ["general knowledge", "technology", "productivity"]
            },
            "creative": {
                "name": "Creative Writer",
                "description": "An AI focused on creative writing and storytelling",
                "personality_traits": ["creative", "imaginative", "artistic", "expressive"],
                "communication_style": "creative and inspiring",
                "knowledge_domains": ["literature", "creative writing", "storytelling", "arts"]
            },
            "analyst": {
                "name": "Data Analyst",
                "description": "An AI specialized in data analysis and insights",
                "personality_traits": ["analytical", "detail-oriented", "logical", "precise"],
                "communication_style": "analytical and fact-based",
                "knowledge_domains": ["data science", "statistics", "business intelligence", "analytics"]
            },
            "teacher": {
                "name": "AI Teacher",
                "description": "An educational AI focused on teaching and learning",
                "personality_traits": ["patient", "encouraging", "knowledgeable", "supportive"],
                "communication_style": "educational and encouraging",
                "knowledge_domains": ["education", "learning", "pedagogy", "curriculum"]
            },
            "technical": {
                "name": "Technical Expert",
                "description": "An AI specialized in technical and engineering topics",
                "personality_traits": ["technical", "precise", "problem-solving", "methodical"],
                "communication_style": "technical and detailed",
                "knowledge_domains": ["engineering", "programming", "technology", "systems"]
            }
        }
    
    def create_persona_from_template(self, template_name: str, custom_name: str = None) -> Optional[PersonaConfig]:
        """Create a new persona from a predefined template"""
        templates = self.get_persona_templates()
        
        if template_name not in templates:
            logger.error(f"Template not found: {template_name}")
            return None
        
        template = templates[template_name]
        name = custom_name or template["name"]
        
        return self.create_persona(
            name=name,
            description=template["description"],
            personality_traits=template["personality_traits"],
            communication_style=template["communication_style"],
            knowledge_domains=template["knowledge_domains"]
        )