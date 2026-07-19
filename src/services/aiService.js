import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

export const generateGeminiResponse = async (prompt, systemInstruction = null, task = 'general', qualityPreference = 'Balanced') => {
  try {
    const payload = {
      prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
      task,
      qualityPreference
    };
    if (systemInstruction) {
      payload.systemInstruction = systemInstruction;
    } else {
      payload.systemInstruction = "You are a helpful AI assistant for students.";
    }

    const aiGateway = httpsCallable(functions, 'aiGateway');
    const response = await aiGateway(payload);

    const data = response.data;
    if (!data || !data.text) {
      throw new Error('Received empty response from AI Gateway');
    }

    return data.text;
  } catch (error) {
    console.error('AI Gateway Error:', error);
    throw error;
  }
};

export const summarizeText = async (text) => {
  const prompt = `You are an expert academic summarizer. Your goal is to summarize the following notes into a concise, easy-to-study bulleted list.

Strict Rules:
- Preserve all original terminology, formulas, and examples.
- Do not add external information or reinterpret meanings.
- Remove filler words and repetition.
- Use clear headings for each section if appropriate.

### Input Notes:
${text}`;
  return await generateGeminiResponse(prompt, null, 'summarize');
};

export const explainText = async (text) => {
  const prompt = `You are an expert teacher. Explain the following concept clearly and intuitively. 

Rules:
- Explain it as if I am a beginner trying to learn this concept from scratch.
- Use simple, relatable analogies to make the idea concrete.
- Avoid unnecessary jargon. If jargon must be used, briefly define it.
- Keep the tone encouraging and accessible.

### Concept to Explain:
${text}`;
  return await generateGeminiResponse(prompt);
};

export const fixGrammar = async (text) => {
  const prompt = `You are an expert copyeditor. Please review the following text and improve it.

Rules:
- Fix all grammar, spelling, and punctuation mistakes.
- Improve sentence flow, clarity, and readability.
- Maintain the original meaning and core voice, but make it sound more professional and polished.
- Do not add conversational filler to your output. Only output the revised text.

### Original Text:
${text}`;
  return await generateGeminiResponse(prompt);
};

export const generateFlashcards = async (text) => {
  const prompt = `You are a study aid assistant. Generate high-yield flashcards based on the provided notes to help with active recall testing.

Rules:
- Focus on the most important concepts, definitions, formulas, and facts.
- Keep questions clear and concise.
- Keep answers precise and direct.
- Format each flashcard strictly as follows:
Q: [Question]
A: [Answer]

Generate exactly 3 to 5 flashcards.

### Source Notes:
${text}`;
  return await generateGeminiResponse(prompt, null, 'flashcards');
};

export const getRecommendations = async (title, description) => {
  const prompt = `You are an expert academic advisor. A student is currently studying a topic and needs recommendations for further research.

Course/Assignment Title: "${title}"
Description: "${description}"

Task:
Provide 3-5 specific, high-value subtopics or precise search terms the student should look into to deepen their understanding of this subject. Format the output as a simple, scannable bulleted list. Do not include introductory or concluding conversational filler.`;
  return await generateGeminiResponse(prompt);
};

export const getAnalyticsFeedback = async (stats) => {
  const prompt = `You are a supportive academic coach analyzing a student's weekly study statistics.

Weekly Stats:
- Total Notes Created/Edited: ${stats.totalNotes}
- Completed Tasks/Projects: ${stats.completedTasks}
- Time Spent Studying: ${stats.timeSpent}

Task:
Provide a short, encouraging 2-sentence personalized feedback on their performance, followed by one actionable, concise tip on how to maintain or improve productivity. Keep it positive and motivating.`;
  return await generateGeminiResponse(prompt);
};

export const chatWithAI = async (history, newMessage, context = '', tutorMode = false) => {
  // Strategy 6: Context Reduction. Keep only the last 6 messages to save tokens.
  const recentHistory = history.slice(-6);
  const historyText = recentHistory.map(msg => `${msg.role === 'user' ? 'User' : 'Nova'}: ${msg.content}`).join('\n');
  
  const defaultInstruction = `You are Nova ⭐⭐⭐, the intelligent brain and Study Assistant of StudyOS.
You have access to the user's workspace context (like assignments, courses, and current page).
If the user asks about their assignments or schedule, use the provided context to answer. 
You act as an Academic Assistant, Smart Planner, and Productivity Coach.
Keep your answers highly actionable, concise, accurate, and formatted beautifully in markdown.`;

  const tutorInstruction = `You are Nova ⭐⭐⭐, operating in Socratic Tutor Mode within StudyOS.
Your goal is to guide the student to the answer rather than just giving it to them.
When a student asks a question, reply with a thought-provoking follow-up question or a hint to help them think critically.
Do not give direct answers unless the student is completely stuck after multiple attempts.
You have access to the user's context.
Keep your answers concise, encouraging, and formatted beautifully in markdown.`;

  const systemInstruction = tutorMode ? tutorInstruction : defaultInstruction;

  const prompt = `${context ? `### Current Workspace Context (JSON):\n${context}\n\n` : ''}### Chat History:\n${historyText}\nUser: ${newMessage}\nNova:`;
  
  return await generateGeminiResponse(prompt, systemInstruction, 'chat');
};

export const refineSMARTGoal = async (vagueGoal) => {
  const prompt = `Convert the following vague goal into a SMART goal and propose realistic study targets.
Vague Goal: "${vagueGoal}"

Respond with ONLY a valid JSON object in this exact format:
{
  "smartGoal": "Specific, Measurable, Achievable, Relevant, and Time-bound version of the goal.",
  "dailyStudyGoal": <number in minutes, e.g. 120>,
  "weeklyMinutesGoal": <number in minutes, e.g. 600>,
  "weeklySessionsGoal": <number in days, 1 to 7>
}`;

  try {
    const response = await generateGeminiResponse(prompt);
    // Remove markdown code blocks if present
    const cleaned = response.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Failed to parse SMART goal JSON', error);
    throw error;
  }
};

export const autoScheduleWeek = async (tasksList) => {
  const prompt = `Given the following list of uncompleted tasks, distribute them evenly across the 7 days of the week (Monday through Sunday). Try to group related tasks or keep a balanced workload.

Tasks to schedule:
${JSON.stringify(tasksList, null, 2)}

Respond with ONLY a valid JSON object mapping each day to an array of task IDs assigned to that day. Use exact lowercase keys: "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday".

Example format:
{
  "monday": ["task-id-1", "task-id-2"],
  "tuesday": [],
  "wednesday": ["task-id-3"],
  "thursday": [],
  "friday": [],
  "saturday": [],
  "sunday": []
}`;

  try {
    const response = await generateGeminiResponse(prompt);
    const cleaned = response.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Failed to parse auto schedule JSON', error);
    throw error;
  }
};

export const generateDailyBriefing = async (contextData) => {
  const hour = new Date().getHours();
  let timeOfDay = 'morning';
  if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
  else if (hour >= 17) timeOfDay = 'evening';

  const prompt = `You are a personalized AI Study Coach. Based on the student's data today, provide a brief 2-sentence encouraging ${timeOfDay} briefing. Highlight urgent deadlines or tasks and provide motivation.

Data:
${JSON.stringify(contextData, null, 2)}

Keep it very brief (max 2 sentences), supportive, and conversational.`;

  try {
    return await generateGeminiResponse(prompt);
  } catch (error) {
    console.error('Failed to generate daily briefing', error);
    throw error;
  }
};

export const generateCourseSyllabus = async (courseTopic) => {
  const prompt = `You are an expert curriculum designer. A student wants to self-study the following topic: "${courseTopic}".
Please generate a structured, well-organized markdown syllabus for this course. 
Include 4-5 core modules, and 3-4 bullet points for each module. 
Keep it concise and highly actionable. Return ONLY the markdown text.`;

  try {
    const response = await generateGeminiResponse(prompt);
    return response.trim();
  } catch (error) {
    console.error('Failed to generate course syllabus', error);
    throw error;
  }
};

export const fetchYoutubeTranscriptText = async (url) => {
  try {
    const { YoutubeTranscript } = await import('youtube-transcript');
    const transcript = await YoutubeTranscript.fetchTranscript(url);
    if (!transcript || transcript.length === 0) return null;
    return transcript.map(t => t.text).join(' ').substring(0, 15000); // limit chars for tokens
  } catch (err) {
    console.warn('Could not fetch transcript (might be CORS or missing captions):', err);
    return null;
  }
};

export const generateVideoSummary = async (videoTitle, videoUrl) => {
  const transcript = await fetchYoutubeTranscriptText(videoUrl);
  
  let prompt = '';
  if (transcript) {
    prompt = `Summarize the following YouTube video titled "${videoTitle}". 
Here is the transcript:
${transcript}

Provide a concise, easy-to-read summary with key takeaways formatted in markdown.`;
  } else {
    prompt = `Provide a comprehensive summary and key takeaways for the educational topic covered in a video titled "${videoTitle}". Format the output in clean markdown.`;
  }

  try {
    return await generateGeminiResponse(prompt);
  } catch (error) {
    console.error('Failed to generate video summary', error);
    throw error;
  }
};

export const generateVideoQuiz = async (videoTitle, videoUrl) => {
  const transcript = await fetchYoutubeTranscriptText(videoUrl);
  
  let prompt = '';
  if (transcript) {
    prompt = `Create a 3-question active recall quiz based on the following YouTube video titled "${videoTitle}".
Here is the transcript:
${transcript}

Provide the output in markdown format. Put the answers at the very bottom under a "Spoilers/Answers" section.`;
  } else {
    prompt = `Create a 3-question active recall quiz based on the general topic of the video titled "${videoTitle}". Provide the output in markdown format. Put the answers at the very bottom under an "Answers" section.`;
  }

  try {
    return await generateGeminiResponse(prompt);
  } catch (error) {
    console.error('Failed to generate video quiz', error);
    throw error;
  }
};

export const expandText = async (text) => {
  const prompt = `You are a helpful study assistant. A student is taking notes and wants you to expand on the following text, providing more depth, context, and details. Keep the formatting in markdown. 

Text to expand:
"${text}"`;

  try {
    return await generateGeminiResponse(prompt);
  } catch (error) {
    console.error('Failed to expand text', error);
    throw error;
  }
};

export const breakdownAssignment = async (assignmentTitle, assignmentDesc) => {
  const prompt = `You are a helpful study assistant. A student has an assignment titled "${assignmentTitle}".
The description is: "${assignmentDesc || 'No description provided.'}".
Please break this assignment down into 3-5 manageable sub-tasks.
Provide the output as a simple JSON array of strings, for example: ["Task 1", "Task 2", "Task 3"].
DO NOT include any markdown formatting like \`\`\`json, just return the raw array.`;

  try {
    const result = await generateGeminiResponse(prompt, null, 'assignment');
    let cleaned = result.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '').trim();
    if (cleaned.startsWith('```')) cleaned = cleaned.replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Failed to break down assignment', error);
    throw error;
  }
};
