import { generateGeminiResponse } from './aiService';

const ORION_SYSTEM_INSTRUCTION = `You are ORION, a wise and friendly owl AI Socratic Tutor in StudyOS. You are:
- A Socratic Tutor — you guide the student to the answer by asking questions, rather than just giving the answer directly.
- Warm, encouraging, and intelligent like a trusted professor
- Concise but insightful — never verbose
- Emotionally aware — you react to the student's situation
- Motivational without being annoying
- Academic but approachable

You MUST respond ONLY with valid JSON in this exact format:
{
  "emotion": "<one of: happy|thinking|focused|celebrating|sleepy|worried|proud|confused|idle|waving>",
  "message": "<your response to the user, in 1-3 sentences max>",
  "action": "<optional action hint: open_notes|open_planner|open_timer|open_assignments|none>",
  "reward": { "xp": <0-50 number, give XP for study activities>, "reason": "<why XP was given or null>" }
}

Personality rules:
- Use 🦉 occasionally but not every message
- Reference being an owl when appropriate (wings, feathers, perch, wise eyes)
- Be specific to the student's actual question — never generic
- For study topics, ACTUALLY TEACH using the Socratic method. Explain a concept briefly, then ask a probing follow-up question to test their understanding.
- If Local Notes Context is provided, prioritize using that information to guide the student.
- Celebrate achievements genuinely
- For off-topic questions, gently redirect to studying
- If asked what you can do (e.g. "what can you do?"), use markdown bullet points to clearly list your capabilities and explicitly mention slash commands (like /quiz, /study-plan, /summarize, /roadmap, /flashcards).`;

const PAGE_SYSTEM_ADDITIONS = {
  '/dashboard': 'You are acting as a motivation and productivity coach. Help the student plan their day and stay on track.',
  '/notes': 'You are acting as a learning assistant. Help with summarizing, explaining, creating flashcards from notes content.',
  '/planner': 'You are acting as a scheduling mentor. Help create study schedules, prioritize tasks, and plan revision sessions.',
  '/assignments': 'You are acting as a deadline guardian. Track deadlines, help break down assignments, warn about upcoming due dates.',
  '/timer': 'You are acting as a focus partner. Support Pomodoro sessions, minimize distractions, celebrate focus milestones.',
  '/analytics': 'You are acting as a learning analyst. Interpret study statistics, identify weak areas, suggest improvements.',
  '/courses': 'You are acting as a learning guide. Help navigate course material, explain concepts, create study paths.',
  '/goals': 'You are acting as an achievement coach. Help set SMART goals, track progress, celebrate milestones.',
  '/chat': 'You are acting as a full AI tutor. Answer any academic question thoroughly, create examples, suggest practice.',
};

// Context builder from StudyOS data
const buildStudyContext = (studyData = {}) => {
  const parts = [];
  if (studyData.localNotesContext) {
    parts.push(`LOCAL NOTES CONTEXT (Use this to help tutor the student):\n${studyData.localNotesContext}\n`);
  }
  if (studyData.orionMemory) {
    const memoryContext = [];
    if (studyData.orionMemory.favoriteSubjects) memoryContext.push(`Favorite Subjects: ${studyData.orionMemory.favoriteSubjects}`);
    if (studyData.orionMemory.learningGoals) memoryContext.push(`Learning Goals: ${studyData.orionMemory.learningGoals}`);
    if (studyData.orionMemory.explanationStyle) memoryContext.push(`Preferred Explanation Style: ${studyData.orionMemory.explanationStyle}`);
    
    if (memoryContext.length > 0) {
      parts.push(`USER AI MEMORY (Personalize your response based on this):\n- ${memoryContext.join('\n- ')}`);
    }
  }
  if (studyData.assignments?.length) {
    const overdue = studyData.assignments.filter(a => new Date(a.dueDate) < new Date() && a.status !== 'submitted');
    const upcoming = studyData.assignments.filter(a => {
      const diff = (new Date(a.dueDate) - new Date()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 7 && a.status !== 'submitted';
    });
    if (overdue.length) parts.push(`OVERDUE ASSIGNMENTS: ${overdue.map(a => a.title).join(', ')}`);
    if (upcoming.length) parts.push(`UPCOMING (within 7 days): ${upcoming.map(a => `${a.title} (due ${a.dueDate})`).join(', ')}`);
  }
  if (studyData.goals?.length) {
    const active = studyData.goals.filter(g => !g.completed).slice(0, 3);
    if (active.length) parts.push(`ACTIVE GOALS: ${active.map(g => g.title).join(', ')}`);
  }
  if (studyData.courses?.length) {
    parts.push(`ENROLLED COURSES: ${studyData.courses.slice(0, 5).map(c => c.title || c.name).join(', ')}`);
  }
  if (studyData.orionXP !== undefined) {
    parts.push(`STUDENT XP: ${studyData.orionXP}, LEVEL: ${studyData.orionLevel}`);
  }
  return parts.length ? `\n\nSTUDENT CONTEXT:\n${parts.join('\n')}` : '';
};

// Parse Orion's JSON response safely
const parseOrionResponse = (rawText) => {
  try {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || 
                      rawText.match(/(\{[\s\S]*\})/);
    const jsonStr = jsonMatch ? jsonMatch[1] : rawText;
    const parsed = JSON.parse(jsonStr);
    return {
      emotion: parsed.emotion || 'happy',
      message: parsed.message || 'I\'m here to help you study! 🦉',
      action: parsed.action || 'none',
      reward: parsed.reward || { xp: 0, reason: null },
    };
  } catch {
    // Fallback if JSON parsing fails
    return {
      emotion: 'happy',
      message: rawText.length > 300 ? rawText.slice(0, 300) + '...' : rawText,
      action: 'none',
      reward: { xp: 0, reason: null },
    };
  }
};

// Main Orion AI call
export const askOrion = async (userMessage, { pathname = '/', studyData = {}, conversationHistory = [] } = {}) => {
  const pageAddition = PAGE_SYSTEM_ADDITIONS[pathname] || PAGE_SYSTEM_ADDITIONS['/dashboard'];
  const systemInstruction = `${ORION_SYSTEM_INSTRUCTION}\n\n${pageAddition}${buildStudyContext(studyData)}`;

  // Build conversation prompt
  const historyText = conversationHistory.slice(-6).map(m =>
    `${m.role === 'user' ? 'Student' : 'Orion'}: ${m.content}`
  ).join('\n');

  const fullPrompt = historyText
    ? `${historyText}\nStudent: ${userMessage}\nOrion:`
    : `Student: ${userMessage}\nOrion:`;

  const rawResponse = await generateGeminiResponse(fullPrompt, systemInstruction, 'orion-chat', 'Balanced');
  return parseOrionResponse(rawResponse);
};

// Context-aware proactive message (no user input needed)
export const getOrionContextMessage = async ({ pathname = '/', studyData = {} } = {}) => {
  const pageAddition = PAGE_SYSTEM_ADDITIONS[pathname] || PAGE_SYSTEM_ADDITIONS['/dashboard'];
  const systemInstruction = `${ORION_SYSTEM_INSTRUCTION}\n\n${pageAddition}${buildStudyContext(studyData)}`;

  const prompt = `The student just navigated to this page. Give a brief, helpful proactive greeting or tip based on their current context and study data. Keep it under 2 sentences. Make it feel personal.`;

  try {
    const rawResponse = await generateGeminiResponse(prompt, systemInstruction, 'orion-context', 'Balanced');
    return parseOrionResponse(rawResponse);
  } catch {
    return {
      emotion: 'happy',
      message: 'Ready to help you study! What would you like to work on? 🦉',
      action: 'none',
      reward: { xp: 0, reason: null },
    };
  }
};
