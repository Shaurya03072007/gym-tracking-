import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

// Lazy Gemini client helper
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return geminiClient;
}

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'FitVision AI Server',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString()
  });
});

// 1. Context-Aware AI Coach Chat Endpoint
app.post('/api/coach/chat', async (req: Request, res: Response) => {
  try {
    const { message, history = [], userProfile, currentExercise, recentWorkouts } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Graceful smart fallback response if API key is not yet configured
      return res.json({
        reply: `Coach response: "${message}". Make sure to keep your core braced, breathe rhythmically through your diaphragm, and control the eccentric phase of your ${currentExercise || 'movement'}! (Tip: Set GEMINI_API_KEY in Settings for custom generative AI reasoning).`,
        source: 'local_engine'
      });
    }

    const systemInstruction = `You are FitVision AI Coach, an elite personal trainer, biomechanist, and sports nutrition specialist.
You provide encouraging, technically precise, and concise fitness coaching.
Always take into account the user's profile and workout context:
- User Profile: ${JSON.stringify(userProfile || {})}
- Current Exercise: ${currentExercise || 'None currently active'}
- Recent Workout Logs: ${JSON.stringify(recentWorkouts || [])}

Rules:
1. Answer directly and concisely (2-4 paragraphs or crisp bullet points).
2. Avoid generic fluff. Give biomechanically sound cues (e.g. "pack your lats", "drive through midfoot", "brace intra-abdominal pressure").
3. Always include a disclaimer if answering medical or injury-related questions: Recommend consulting a qualified physical therapist or doctor for persistent joint pain.
4. Adapt advice for their available equipment and goals.`;

    const contents = [
      ...history.map((h: any) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }]
      })),
      {
        role: 'user',
        parts: [{ text: message }]
      }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7
      }
    });

    res.json({
      reply: response.text || 'Keep moving with purpose and focus!',
      source: 'gemini'
    });
  } catch (error: any) {
    console.error('AI Coach Chat Error:', error);
    res.status(500).json({
      error: 'Failed to generate coaching response',
      details: error?.message || String(error)
    });
  }
});

// 2. Structured Rep Event AI Coaching Audio/Text Cue
app.post('/api/coach/form-feedback', async (req: Request, res: Response) => {
  try {
    const { exercise, rep, knee_angle, hip_angle, torso_angle, depth, tempo, form_score, issues, positive } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Deterministic rule-based coaching feedback fallback
      const cue = issues && issues.length > 0
        ? `Rep ${rep}: ${issues[0]}. Keep your tempo controlled!`
        : `Rep ${rep}: Excellent form! Full depth and smooth tempo. Keep it going!`;
      return res.json({ cue, severity: form_score < 70 ? 'WARNING' : 'INFO' });
    }

    const prompt = `Analyze this live biometric repetition event and provide ONE concise, spoken personal trainer cue (maximum 15 words) for the athlete in their headphones:
Exercise: ${exercise}
Rep: ${rep}
Form Score: ${form_score}/100
Knee Angle: ${knee_angle}°
Hip Angle: ${hip_angle}°
Torso Angle: ${torso_angle}°
Depth: ${depth}
Tempo: ${tempo}s
Issues Detected: ${JSON.stringify(issues)}
Positive Points: ${JSON.stringify(positive)}

Return valid JSON with:
{
  "cue": "spoken instruction to the athlete",
  "severity": "INFO" | "CORRECTION" | "WARNING"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cue: { type: Type.STRING },
            severity: { type: Type.STRING }
          },
          required: ['cue', 'severity']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Form feedback error:', error);
    res.json({
      cue: 'Good effort! Stay tight through the core and control the descent.',
      severity: 'INFO'
    });
  }
});

// 3. AI Meal Plan Generator
app.post('/api/nutrition/generate-plan', async (req: Request, res: Response) => {
  try {
    const { userProfile, targetCalories, targetProtein } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(503).json({ error: 'Gemini API client not initialized' });
    }

    const prompt = `Create a high-protein, delicious 1-day meal plan for this user:
Profile: ${JSON.stringify(userProfile)}
Target Calories: ~${targetCalories} kcal
Target Protein: ~${targetProtein} grams
Preferred Cuisine/Foods: Indian (Roti, Dal, Paneer, Rice, Curd, Eggs/Chicken/Soya depending on diet preference), high fiber vegetables.

Format output as a JSON object with:
{
  "dayName": "Personalized Day Plan",
  "totalEstimatedCalories": number,
  "totalEstimatedProtein": number,
  "meals": [
    {
      "name": "string (e.g. Energizing Breakfast)",
      "time": "string (e.g. 8:00 AM)",
      "itemsDescription": "string list with exact portions",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number
    }
  ],
  "dietaryTips": ["tip 1", "tip 2"],
  "disclaimer": "This is an AI-generated dietary estimate and not medical nutrition therapy."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Meal plan generation error:', error);
    res.status(500).json({ error: 'Failed to generate meal plan' });
  }
});

// 4. AI Food Swapper (e.g. "Replace chicken with vegetarian protein")
app.post('/api/nutrition/swap-food', async (req: Request, res: Response) => {
  try {
    const { currentFood, swapRequest, currentCalories, currentProtein } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        replacement: {
          name: 'Paneer / Soya Chunks Bhurji',
          servingSize: '150g',
          calories: currentCalories || 220,
          proteinG: currentProtein || 25,
          carbsG: 6,
          fatG: 10,
          notes: 'High protein vegetarian replacement preserving approximate nutritional macro targets.'
        }
      });
    }

    const prompt = `The user wants to replace a food item in their meal plan:
Original Food: ${currentFood} (~${currentCalories} kcal, ~${currentProtein}g protein)
User Swap Request: "${swapRequest}"

Suggest a nutritionally equivalent replacement that closely matches the original calories and protein while respecting the request (e.g. vegetarian, vegan, or different food item).

Return valid JSON:
{
  "replacement": {
    "name": "string",
    "servingSize": "string",
    "calories": number,
    "proteinG": number,
    "carbsG": number,
    "fatG": number,
    "notes": "string"
  }
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Food swap error:', error);
    res.status(500).json({ error: 'Failed to swap food' });
  }
});

// 5. Body Photo Analysis (Non-diagnostic Posture & Proportions)
app.post('/api/body/analyze', async (req: Request, res: Response) => {
  try {
    const { photoBase64, angle = 'front', userProfile } = req.body;
    const ai = getGeminiClient();

    if (!photoBase64) {
      return res.status(400).json({ error: 'No image provided' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'Gemini Vision AI is required for photographic posture analysis. Please add your GEMINI_API_KEY in the environment or Settings.'
      });
    }

    // Clean base64 data
    const cleanBase64 = photoBase64.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `Analyze this fitness user's body photo (${angle} view) for non-diagnostic athletic posture and physical balance.
User Stats: Height: ${userProfile?.heightCm || 175}cm, Weight: ${userProfile?.weightKg || 70}kg, Goal: ${userProfile?.primaryGoal || 'general fitness'}.

CRITICAL MANDATES:
1. Do NOT claim exact body fat percentage from a photo. State clearly that photographic analysis is an estimate and not a medical measurement.
2. Note visible posture traits (e.g. shoulder leveling, thoracic kyphosis, pelvic tilt, knee tracking).
3. Offer constructive mobility and exercise suggestions.

Return valid JSON:
{
  "observations": ["observation 1", "observation 2", "observation 3"],
  "bodyProportions": "string description",
  "mobilityRecommendations": ["exercise 1", "exercise 2"],
  "disclaimer": "Photographic posture observations are non-diagnostic estimates. Consult a medical professional for clinical evaluations."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Body analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze body photo' });
  }
});

// Vite & Static file serving
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FitVision AI Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
