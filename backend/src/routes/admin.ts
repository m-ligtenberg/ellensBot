import express from 'express';
import { Request, Response } from 'express';
import { contentLearning } from '../services/contentLearning';

const router = express.Router();

// Types
interface ContentItem {
  id: string;
  type: 'lyrics' | 'interview' | 'social_media' | 'speech' | 'other';
  title: string;
  content: string;
  source: string;
  uploadDate: string;
  status: 'pending' | 'analyzed' | 'integrated';
  analysis?: ContentAnalysis;
}

interface ContentAnalysis {
  keyPhrases: string[];
  emotions: string[];
  streetSlang: string[];
  denialPatterns: string[];
  signaturePhrases: string[];
  personalityTraits: {
    chaosLevel: number;
    denialTendency: number;
    streetCredibility: number;
    musicFocus: number;
  };
}

// In-memory storage (in production, use database)
let contentDatabase: ContentItem[] = [];

// Upload new content
router.post('/content/upload', async (req: Request, res: Response) => {
  try {
    const { type, title, content, source } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const newContent: ContentItem = {
      id: Date.now().toString(),
      type: type || 'other',
      title,
      content,
      source: source || 'Manual upload',
      uploadDate: new Date().toISOString(),
      status: 'pending'
    };

    contentDatabase.push(newContent);

    console.log(`🎤 New Young Ellens content uploaded: ${title} (${type})`);

    res.json({
      success: true,
      content: newContent,
      message: 'Content uploaded successfully'
    });
    return;
  } catch (error) {
    console.error('Error uploading content:', error);
    res.status(500).json({ error: 'Failed to upload content' });
    return;
  }
});

// Get all uploaded content
router.get('/content', async (req: Request, res: Response) => {
  try {
    res.json({
      content: contentDatabase.sort((a, b) => 
        new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
      ),
      total: contentDatabase.length
    });
    return;
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// Analyze content for personality traits
router.post('/content/:id/analyze', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const contentItem = contentDatabase.find(item => item.id === id);
    
    if (!contentItem) {
      return res.status(404).json({ error: 'Content not found' });
    }

    // Perform content analysis
    const analysis = await analyzeContent(contentItem.content, contentItem.type);
    
    // Update content item
    contentItem.status = 'analyzed';
    contentItem.analysis = analysis;

    console.log(`🧠 Analyzed content: ${contentItem.title}`);
    console.log(`   - Key phrases: ${analysis.keyPhrases.length}`);
    console.log(`   - Street slang: ${analysis.streetSlang.length}`);
    console.log(`   - Denial patterns: ${analysis.denialPatterns.length}`);

    res.json({
      success: true,
      content: contentItem,
      analysis
    });
    return;
  } catch (error) {
    console.error('Error analyzing content:', error);
    res.status(500).json({ error: 'Failed to analyze content' });
    return;
  }
});

// Integrate analyzed content into personality engine
router.post('/content/:id/integrate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const contentItem = contentDatabase.find(item => item.id === id);
    
    if (!contentItem || !contentItem.analysis) {
      return res.status(404).json({ error: 'Content not found or not analyzed' });
    }

    // Integrate into personality patterns (this would update the AI model)
    await integrateIntoPersonality(contentItem);
    
    contentItem.status = 'integrated';

    console.log(`🚀 Integrated content into personality: ${contentItem.title}`);

    res.json({
      success: true,
      content: contentItem,
      message: 'Content integrated into personality engine'
    });
    return;
  } catch (error) {
    console.error('Error integrating content:', error);
    res.status(500).json({ error: 'Failed to integrate content' });
    return;
  }
});

// Get analytics about uploaded content
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const analytics = {
      totalContent: contentDatabase.length,
      contentByType: {
        lyrics: contentDatabase.filter(c => c.type === 'lyrics').length,
        interview: contentDatabase.filter(c => c.type === 'interview').length,
        social_media: contentDatabase.filter(c => c.type === 'social_media').length,
        speech: contentDatabase.filter(c => c.type === 'speech').length,
        other: contentDatabase.filter(c => c.type === 'other').length,
      },
      statusBreakdown: {
        pending: contentDatabase.filter(c => c.status === 'pending').length,
        analyzed: contentDatabase.filter(c => c.status === 'analyzed').length,
        integrated: contentDatabase.filter(c => c.status === 'integrated').length,
      },
      recentUploads: contentDatabase
        .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
        .slice(0, 5),
      personalityInsights: generatePersonalityInsights()
    };

    res.json(analytics);
    return;
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Content analysis function
async function analyzeContent(content: string, type: string): Promise<ContentAnalysis> {
  const lowerContent = content.toLowerCase();
  
  // Extract key phrases that are typical Young Ellens language
  const keyPhrases = extractKeyPhrases(lowerContent);
  
  // Identify emotions and mood indicators
  const emotions = extractEmotions(lowerContent);
  
  // Find street slang terms
  const streetSlang = extractStreetSlang(lowerContent);
  
  // Identify denial patterns
  const denialPatterns = extractDenialPatterns(lowerContent);
  
  // Find signature phrases
  const signaturePhrases = extractSignaturePhrases(lowerContent);
  
  // Calculate personality trait scores
  const personalityTraits = calculatePersonalityTraits(lowerContent, type);
  
  return {
    keyPhrases,
    emotions,
    streetSlang,
    denialPatterns,
    signaturePhrases,
    personalityTraits
  };
}

function extractKeyPhrases(content: string): string[] {
  const phrases: string[] = [];
  
  // Look for drug-related terms
  const drugTerms = ['cocaine', 'coke', 'weed', 'wietje', 'henny', 'hennessy', 'drugs'];
  drugTerms.forEach(term => {
    if (content.includes(term)) phrases.push(term);
  });
  
  // Amsterdam references
  const amsterdamTerms = ['amsterdam', '020', 'damsko', 'dammie'];
  amsterdamTerms.forEach(term => {
    if (content.includes(term)) phrases.push(term);
  });
  
  return [...new Set(phrases)]; // Remove duplicates
}

function extractEmotions(content: string): string[] {
  const emotions = [];
  
  if (content.includes('angry') || content.includes('mad') || content.includes('pissed')) {
    emotions.push('angry');
  }
  if (content.includes('happy') || content.includes('good') || content.includes('nice')) {
    emotions.push('positive');
  }
  if (content.includes('sad') || content.includes('depressed') || content.includes('down')) {
    emotions.push('sad');
  }
  if (content.includes('chaotic') || content.includes('crazy') || content.includes('wild')) {
    emotions.push('chaotic');
  }
  
  return emotions;
}

function extractStreetSlang(content: string): string[] {
  const slangTerms = [
    'yo', 'bro', 'man', 'mattie', 'sahbi', 'akhie', 'skeer', 'chef', 'boss',
    'wallah', 'on god', 'straight up', 'voor real', 'no joke', 'fire', 'sick',
    'lit', 'dope', 'fresh', 'clean', 'owo', 'b-negar', 'b, b, pa'
  ];
  
  return slangTerms.filter(term => content.includes(term));
}

function extractDenialPatterns(content: string): string[] {
  const denials = [];
  
  if (content.includes('never') || content.includes('nooit')) {
    denials.push('absolute_denial');
  }
  if (content.includes('alleen') && (content.includes('wietje') || content.includes('henny'))) {
    denials.push('selective_admission');
  }
  if (content.includes('clean') || content.includes('schoon')) {
    denials.push('clean_claim');
  }
  
  return denials;
}

function extractSignaturePhrases(content: string): string[] {
  const signatures = [];
  
  if (content.includes('alleen me wietje en me henny')) {
    signatures.push('signature_denial');
  }
  if (content.includes('b-negar') || content.includes('b, b, pa')) {
    signatures.push('b_negar_adlib');
  }
  if (content.includes('owo')) {
    signatures.push('owo_expression');
  }
  
  return signatures;
}

function calculatePersonalityTraits(content: string, type: string): ContentAnalysis['personalityTraits'] {
  let chaosLevel = 30; // Base level
  let denialTendency = 50;
  let streetCredibility = 40;
  let musicFocus = 30;
  
  // Adjust based on content type
  if (type === 'lyrics') musicFocus += 30;
  if (type === 'interview') streetCredibility += 20;
  if (type === 'social_media') chaosLevel += 10;
  
  // Adjust based on content
  if (content.includes('drugs') || content.includes('cocaine')) {
    denialTendency += 20;
    chaosLevel += 15;
  }
  
  if (extractStreetSlang(content).length > 5) {
    streetCredibility += 25;
  }
  
  if (content.includes('music') || content.includes('muziek') || content.includes('studio')) {
    musicFocus += 20;
  }
  
  return {
    chaosLevel: Math.min(chaosLevel, 100),
    denialTendency: Math.min(denialTendency, 100),
    streetCredibility: Math.min(streetCredibility, 100),
    musicFocus: Math.min(musicFocus, 100)
  };
}

async function integrateIntoPersonality(contentItem: ContentItem): Promise<void> {
  if (!contentItem.analysis) {
    throw new Error('Content must be analyzed before integration');
  }

  // Use the content learning service to actually integrate the patterns
  await contentLearning.integrateContent(
    contentItem.id,
    contentItem.type,
    contentItem.title,
    contentItem.content,
    contentItem.analysis
  );

  console.log(`🚀 Successfully integrated content: ${contentItem.title}`);
}

function generatePersonalityInsights(): any {
  const analyzedContent = contentDatabase.filter(c => c.analysis);
  
  if (analyzedContent.length === 0) {
    return {
      overallChaosLevel: 50,
      denialTendency: 75,
      streetCredibility: 60,
      musicFocus: 40,
      keyInsights: ['No analyzed content available yet']
    };
  }
  
  // Aggregate personality traits
  const avgTraits = analyzedContent.reduce((acc, item) => {
    if (item.analysis) {
      acc.chaosLevel += item.analysis.personalityTraits.chaosLevel;
      acc.denialTendency += item.analysis.personalityTraits.denialTendency;
      acc.streetCredibility += item.analysis.personalityTraits.streetCredibility;
      acc.musicFocus += item.analysis.personalityTraits.musicFocus;
    }
    return acc;
  }, { chaosLevel: 0, denialTendency: 0, streetCredibility: 0, musicFocus: 0 });
  
  const count = analyzedContent.length;
  
  return {
    overallChaosLevel: Math.round(avgTraits.chaosLevel / count),
    denialTendency: Math.round(avgTraits.denialTendency / count),
    streetCredibility: Math.round(avgTraits.streetCredibility / count),
    musicFocus: Math.round(avgTraits.musicFocus / count),
    keyInsights: [
      `Analyzed ${count} pieces of content`,
      `Found ${contentDatabase.filter(c => c.analysis?.streetSlang.length).length} items with street slang`,
      `${contentDatabase.filter(c => c.analysis?.denialPatterns.length).length} items contain denial patterns`,
      'Content integration helps improve response authenticity'
    ]
  };
}

export default router;