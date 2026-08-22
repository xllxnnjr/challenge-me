import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

// Lazy initialize Google Gen AI
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasGeminiKey: !!process.env.GEMINI_API_KEY });
});

// Evaluate speech API endpoint
app.post('/api/evaluate-speech', async (req, res) => {
  try {
    const {
      challengeType,
      targetText,
      spokenText,
      expectedAnswer,
      question,
      targetReps = 1,
      difficulty = 'Medium',
      audioBase64,
      audioMimeType = 'audio/webm',
    } = req.body;

    const ai = getAI();

    // If we have Gemini AI available, analyze through Gemini 3.7 Flash
    if (ai) {
      const promptParts: any[] = [];

      let systemPrompt = `You are an expert voice & speech coach and game judge for the mobile gaming app "Challenge Me".
Your task is to analyze user speech input (provided via audio or transcribed speech) and determine if they correctly solved or pronounced the speech challenge.

Challenge details:
- Challenge Type: ${challengeType || 'speech'}
- Difficulty Tier: ${difficulty}
- Expected Target / Phrase / Answer: "${targetText || expectedAnswer || ''}"
${question ? `- Question / Context: "${question}"` : ''}
${targetReps > 1 ? `- Target Repetitions: ${targetReps} times cleanly` : ''}

Evaluate the user's input against the requirements:
1. For Tongue Twisters: Check if they recited the tricky target phrase clearly without major stumbles, and count how many times they cleanly recited it (repsDetected). High accuracy (>= 75%) qualifies as correct.
2. For Trivia / Riddles: Determine if their spoken answer is semantically, factually, or colloquially correct even if phrasing differs slightly from the exact answer key.
3. For General Speech / Pronunciation: Check clarity, completeness, and accuracy.

Return your response strictly adhering to the JSON schema.`;

      let userPrompt = `User Transcribed Speech: "${spokenText || ''}".
Analyze whether this speech input satisfies the challenge requirement.`;

      // If inline audio is provided, attach the audio part
      if (audioBase64) {
        promptParts.push({
          inlineData: {
            mimeType: audioMimeType || 'audio/webm',
            data: audioBase64,
          },
        });
      }

      promptParts.push({ text: userPrompt });

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: promptParts,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isCorrect: {
                type: Type.BOOLEAN,
                description: 'True if the spoken input passes the challenge requirement, false otherwise.',
              },
              accuracyScore: {
                type: Type.INTEGER,
                description: 'Percentage accuracy score from 0 to 100.',
              },
              detectedSpeech: {
                type: Type.STRING,
                description: 'The clean synthesized/transcribed representation of what the user said.',
              },
              pronunciationQuality: {
                type: Type.STRING,
                description: 'Rating: Excellent, Good, Fair, or Needs Practice.',
              },
              feedback: {
                type: Type.STRING,
                description: 'Friendly, encouraging, punchy 1-2 sentence AI coach feedback.',
              },
              repsDetected: {
                type: Type.INTEGER,
                description: 'Estimated number of clean repetitions detected.',
              },
              bonusPoints: {
                type: Type.INTEGER,
                description: 'Bonus points awarded for exceptional pronunciation or speed (0-15).',
              },
            },
            required: ['isCorrect', 'accuracyScore', 'detectedSpeech', 'pronunciationQuality', 'feedback'],
          },
        },
      });

      const text = response.text?.trim();
      if (text) {
        try {
          const parsed = JSON.parse(text);
          return res.json({
            success: true,
            source: 'gemini',
            ...parsed,
          });
        } catch (parseErr) {
          console.warn('Failed to parse Gemini JSON output, falling back to heuristic', parseErr);
        }
      }
    }

    // Heuristic Fallback evaluation (when Gemini key is missing or fallback needed)
    const cleanSpoken = (spokenText || '').toLowerCase().trim();
    const cleanTarget = (targetText || expectedAnswer || '').toLowerCase().trim();

    // Check similarity
    let isCorrect = false;
    let accuracyScore = 0;
    let repsDetected = 0;

    if (cleanSpoken.length > 0 && cleanTarget.length > 0) {
      if (cleanSpoken.includes(cleanTarget)) {
        isCorrect = true;
        accuracyScore = 92;
        repsDetected = targetReps || 1;
      } else {
        // Word matching ratio
        const targetWords = cleanTarget.split(/\s+/).filter(Boolean);
        const spokenWords = cleanSpoken.split(/\s+/).filter(Boolean);
        const matched = targetWords.filter((w: string) => cleanSpoken.includes(w)).length;
        const ratio = targetWords.length > 0 ? matched / targetWords.length : 0;
        accuracyScore = Math.round(ratio * 100);
        isCorrect = accuracyScore >= 65;
        repsDetected = isCorrect ? 1 : 0;
      }
    }

    return res.json({
      success: true,
      source: 'heuristic',
      isCorrect,
      accuracyScore,
      detectedSpeech: spokenText || 'Audio received',
      pronunciationQuality: accuracyScore >= 85 ? 'Excellent' : accuracyScore >= 65 ? 'Good' : 'Needs Practice',
      feedback: isCorrect
        ? 'Great vocal clarity! The AI recognized your speech accurately.'
        : 'Almost there! Try speaking more clearly and closer to the microphone.',
      repsDetected,
      bonusPoints: accuracyScore >= 90 ? 10 : 0,
    });
  } catch (error: any) {
    console.error('Error evaluating speech with AI:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error evaluating speech',
      isCorrect: false,
      accuracyScore: 0,
      feedback: 'Could not process audio at this moment. Please try again or use manual confirmation.',
    });
  }
});

// AI Generated Friend Challenge Duel API
app.post('/api/generate-duel', async (req, res) => {
  try {
    const {
      challengerName = 'Player 1',
      opponentName = 'Friend',
      opponentAvatar = '🧑‍💻',
      category = 'All',
      difficulty = 'Medium',
      wagerDiamonds = 50,
    } = req.body;

    const ai = getAI();

    if (ai) {
      const systemPrompt = `You are the ultimate AI Challenge Referee & Arena Host for the high-octane mobile multiplayer game "Challenge Me".
Your task is to generate an epic, high-stakes 3-round Head-to-Head Duel between two rival friends: "${challengerName}" and "${opponentName}".

Rules for generating the 3-round duel:
- Title should be cinematic and punchy (e.g. "Clash of Quantum Wits", "Reflex Velocity Showdown", "Cinematic Code Battle").
- Storyline: 1-2 thrilling sentences setting the rivalry stakes.
- Referee Banter: Witty, energetic, slightly playful commentary from the AI host hyping up both players.
- Exactly 3 progressive Rounds:
  * Round 1: Fast opener (e.g. Speed Arithmetic, Code Breaker, Anagram Blitz, or Cinema Trivia).
  * Round 2: Mind bender or deduction (e.g. Detective Riddle, Voice Riddle, Emoji Decipher, or Stroop Focus).
  * Round 3: High-adrenaline climactic decider (e.g. Reaction Flash, Rhythm Strike, Simon Flow, or Turbo Tap).
- Select round types from: 'math', 'number', 'memory', 'reaction', 'cinema_quiz', 'detective_riddle', 'code_breaker', 'emoji_riddle', 'stroop', 'simon', 'speedtap', 'rhythm', 'pairs', 'anagram_blitz'.

Return JSON strictly adhering to the schema.`;

      const userPrompt = `Generate a 3-round duel between ${challengerName} and ${opponentName}. Preferred theme: ${category}, Difficulty: ${difficulty}, Wager: ${wagerDiamonds} diamonds.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'Epic title of the duel.' },
              storyline: { type: Type.STRING, description: '1-2 sentence dramatic storyline/theme.' },
              refereeBanter: { type: Type.STRING, description: 'AI Referee hype commentary.' },
              rounds: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    roundNum: { type: Type.INTEGER },
                    title: { type: Type.STRING },
                    type: { type: Type.STRING },
                    instructions: { type: Type.STRING },
                    targetGoal: { type: Type.STRING },
                    timeLimitSec: { type: Type.INTEGER },
                  },
                  required: ['roundNum', 'title', 'type', 'instructions', 'targetGoal', 'timeLimitSec'],
                },
              },
            },
            required: ['title', 'storyline', 'refereeBanter', 'rounds'],
          },
        },
      });

      const text = response.text?.trim();
      if (text) {
        try {
          const parsed = JSON.parse(text);
          return res.json({
            success: true,
            source: 'gemini',
            duel: {
              id: `duel_${Date.now()}`,
              challengerName,
              opponentName,
              opponentAvatar,
              wagerDiamonds,
              difficulty,
              ...parsed,
            },
          });
        } catch (err) {
          console.warn('Failed to parse Gemini Duel JSON, using smart fallback', err);
        }
      }
    }

    // Heuristic Fallback Duel Generator
    const fallbackDuels = [
      {
        title: `The Ultimate Brain Duel: ${challengerName} vs ${opponentName}`,
        storyline: `${challengerName} has stepped into the cyber arena to challenge ${opponentName} for diamonds and leaderboard supremacy!`,
        refereeBanter: `⚡ Sparks are flying! Two top challengers enter the arena, but only one will claim the ${wagerDiamonds} 💎 prize pool. Bring your best reflexes!`,
        rounds: [
          {
            roundNum: 1,
            title: 'Round 1: Rapid Code & Math Sprint',
            type: 'math',
            instructions: 'Solve fast arithmetic and equation challenges against the ticking clock.',
            targetGoal: 'Score >= 80% accuracy under 15 seconds',
            timeLimitSec: 15,
          },
          {
            roundNum: 2,
            title: 'Round 2: Emoji & Pop Culture Cryptogram',
            type: 'emoji_riddle',
            instructions: 'Decipher the movie and world concept cryptic emojis before time runs out.',
            targetGoal: 'Solve in 2 guesses or fewer',
            timeLimitSec: 20,
          },
          {
            roundNum: 3,
            title: 'Round 3: Sudden Death Reflex Strike',
            type: 'reaction',
            instructions: 'Hit the target with superhuman millisecond reaction speed!',
            targetGoal: 'Reaction time under 250ms',
            timeLimitSec: 10,
          },
        ],
      },
      {
        title: `Detective & Mystery Clash: ${challengerName} vs ${opponentName}`,
        storyline: `A locked-room riddle and cipher vault have been placed between ${challengerName} and ${opponentName}. Who will crack it first?`,
        refereeBanter: `🕵️ Put on your thinking caps! The AI mainframe is tracking every single microsecond and input.`,
        rounds: [
          {
            roundNum: 1,
            title: 'Round 1: Mastermind Code Breaker',
            type: 'code_breaker',
            instructions: 'Crack the 3-digit secret security code using deduction clues.',
            targetGoal: 'Crack the code within 4 attempts',
            timeLimitSec: 25,
          },
          {
            roundNum: 2,
            title: 'Round 2: Crime Mystery Deduction',
            type: 'detective_riddle',
            instructions: 'Analyze the suspect alibis and spot the fatal logical contradiction.',
            targetGoal: 'Identify the culprit correctly on the first attempt',
            timeLimitSec: 20,
          },
          {
            roundNum: 3,
            title: 'Round 3: Stroop Cognitive Clash',
            type: 'stroop',
            instructions: 'Resist optical illusions and match font colors in high-speed succession.',
            targetGoal: 'Clear 6 consecutive colors with zero errors',
            timeLimitSec: 15,
          },
        ],
      },
    ];

    const randomDuel = fallbackDuels[Math.floor(Math.random() * fallbackDuels.length)];

    return res.json({
      success: true,
      source: 'heuristic',
      duel: {
        id: `duel_${Date.now()}`,
        challengerName,
        opponentName,
        opponentAvatar,
        wagerDiamonds,
        difficulty,
        ...randomDuel,
      },
    });
  } catch (error: any) {
    console.error('Error generating AI duel:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Could not generate duel',
    });
  }
});


async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Challenge Me server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
