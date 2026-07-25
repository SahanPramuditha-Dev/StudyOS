const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { GoogleGenAI } = require("@google/genai");
const admin = require("firebase-admin");
const crypto = require("crypto");
// Define the secret for the Gemini API Key
const geminiApiKey = defineSecret("GEMINI_API_KEY");

// Available Active Models with granted quota (Rate Limit > 0)
const MODELS = {
  // Ultra Next-Gen & Advanced Reasoning
  v36Flash: "gemini-3.6-flash",         // 5 RPM / 250K TPM / 20 RPD
  v35Flash: "gemini-3.5-flash",         // 5 RPM / 250K TPM / 20 RPD
  v31Pro: "gemini-3.1-pro",             // Deep analysis fallback
  v3Flash: "gemini-3-flash",             // 5 RPM / 250K TPM / 20 RPD
  
  // High Daily Quota Tiers (500 RPD / 15 RPM)
  v35FlashLite: "gemini-3.5-flash-lite", // 15 RPM / 250K TPM / 500 RPD
  v31FlashLite: "gemini-3.1-flash-lite", // 15 RPM / 250K TPM / 500 RPD

  // Stable 2.5 Generation
  v25Flash: "gemini-2.5-flash",         // 5 RPM / 250K TPM / 20 RPD
  v25FlashLite: "gemini-2.5-flash-lite", // 10 RPM / 250K TPM / 20 RPD
  
  // High Capacity Open Weights Models (14,400 RPD / 30 RPM)
  gemma431b: "gemma-4-31b",             // 30 RPM / 16K TPM / 14,400 RPD
  gemma426b: "gemma-4-26b",             // 30 RPM / 16K TPM / 14,400 RPD

  // Audio & TTS
  tts31: "gemini-3.1-flash-tts-preview", // 3 RPM / 10K TPM / 10 RPD
  tts25: "gemini-2.5-flash-tts-preview", // 3 RPM / 10K TPM / 10 RPD

  // Legacy fallback
  legacy: "gemini-2-flash"
};

/**
 * Strategy 2, 3, 12, 13: Intelligent Auto-Selection & Quota-Aware Routing Logic
 * Determines the best model fallback priority based on task, quality preference, and prompt complexity.
 */
function determineRoutingPriority(task, qualityPreference, prompt) {
  const isComplexPrompt = prompt && prompt.length > 500;
  const isShortPrompt = prompt && prompt.length < 50;

  // 1. Explicit Student Quality Modes
  if (qualityPreference === "Fast") {
    return [
      MODELS.v35FlashLite,
      MODELS.v31FlashLite,
      MODELS.gemma426b,
      MODELS.v25FlashLite,
      MODELS.v25Flash,
      MODELS.v3Flash,
      MODELS.legacy
    ];
  }
  
  if (qualityPreference === "Advanced") {
    return [
      MODELS.v36Flash,
      MODELS.v35Flash,
      MODELS.v31Pro,
      MODELS.gemma431b,
      MODELS.v3Flash,
      MODELS.v35FlashLite,
      MODELS.v31FlashLite
    ];
  }
  
  // 2. Task-Based Auto-Selection
  switch (task) {
    case "chat":
    case "flashcards":
    case "summarize":
    case "quiz":
    case "study_planner":
      return [
        MODELS.v35FlashLite,  // High 500 RPD quota first
        MODELS.v31FlashLite,  // High 500 RPD quota second
        MODELS.v36Flash,
        MODELS.v35Flash,
        MODELS.gemma426b,     // 14,400 RPD backstop
        MODELS.v25FlashLite,
        MODELS.v3Flash
      ];

    case "code":
    case "assignment":
    case "debugging":
      return [
        MODELS.v36Flash,      // Cutting-edge reasoning
        MODELS.v35Flash,
        MODELS.v31Pro,
        MODELS.gemma431b,     // High performance 14,400 RPD backstop
        MODELS.v3Flash,
        MODELS.v35FlashLite,
        MODELS.v31FlashLite
      ];

    default:
      // 3. Prompt Complexity Detection
      if (isShortPrompt) {
        return [
          MODELS.v35FlashLite,
          MODELS.v31FlashLite,
          MODELS.v25FlashLite,
          MODELS.gemma426b,
          MODELS.v3Flash
        ];
      }
      if (isComplexPrompt) {
        return [
          MODELS.v36Flash,
          MODELS.v35Flash,
          MODELS.v31Pro,
          MODELS.gemma431b,
          MODELS.v35FlashLite
        ];
      }
      // Balanced Default fallback chain
      return [
        MODELS.v36Flash,
        MODELS.v35FlashLite,
        MODELS.v31FlashLite,
        MODELS.v35Flash,
        MODELS.gemma431b,
        MODELS.v3Flash,
        MODELS.v25Flash,
        MODELS.gemma426b
      ];
  }
}

/**
 * Helper to delay execution (used for exponential backoff)
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * In-memory map for Request Deduplication (Strategy 9)
 * Stores promises of in-flight requests keyed by hash.
 */
const inFlightRequests = new Map();

/**
 * Generates a SHA-256 hash for caching and deduplication based on request payload.
 */
function generateRequestHash(prompt, systemInstruction, config) {
  const payload = JSON.stringify({ prompt, systemInstruction, config });
  return crypto.createHash("sha256").update(payload).digest("hex");
}



/**
 * AI Gateway Cloud Function
 * Handles requests, retries, and automatic fallback routing.
 */
exports.aiGateway = onCall(
  { secrets: [geminiApiKey] },
  async (request) => {
    // 1. Authenticate user
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be logged in.");
    }

    const { prompt, systemInstruction, config, task, qualityPreference } = request.data;
    if (!prompt) {
      throw new HttpsError("invalid-argument", "Missing prompt.");
    }

    const db = admin.firestore();
    
    // Strategy 10: Daily Budget Manager
    const today = new Date().toISOString().split("T")[0];
    const budgetRef = db.collection("ai_budget").doc(today);
    const budgetSnap = await budgetRef.get();
    const currentUsage = budgetSnap.exists ? budgetSnap.data().requests || 0 : 0;
    const DAILY_LIMIT = 500; // Hard limit before forcing Lite models
    
    let forceLite = currentUsage >= DAILY_LIMIT;
    if (forceLite) {
      console.warn(`[AI Gateway] Daily limit reached (${currentUsage}/${DAILY_LIMIT}). Forcing Lite models.`);
    }

    // Determine Model Priority for this specific request
    let modelPriority = determineRoutingPriority(task, qualityPreference, prompt);
    if (forceLite) {
      modelPriority = [MODELS.v35FlashLite, MODELS.v31FlashLite, MODELS.gemma426b, MODELS.v25FlashLite];
    }

    // Phase 2: Caching & Deduplication (Strategies 4, 9)
    const requestHash = generateRequestHash(prompt, systemInstruction, config);

    // 1. Check Deduplication (In-flight requests on this instance)
    if (inFlightRequests.has(requestHash)) {
      console.log(`[AI Gateway] Deduplicating request. Waiting for in-flight request ${requestHash}`);
      return await inFlightRequests.get(requestHash);
    }

    const generateResponsePromise = async () => {
      // 2. Check Persistent Cache (Firestore)
      const db = admin.firestore();
      const cacheRef = db.collection("ai_cache").doc(requestHash);
      
      try {
        const cacheSnap = await cacheRef.get();
        if (cacheSnap.exists) {
          console.log(`[AI Gateway] Cache hit for ${requestHash}`);
          const cachedData = cacheSnap.data();
          
          // Log Cache Hit Analytics
          db.collection("ai_analytics").add({
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            userId: request.auth.uid,
            task: task || 'general',
            modelUsed: cachedData.modelUsed,
            cached: true,
            attempts: 0
          }).catch(err => console.error("Analytics error:", err));

          return {
            text: cachedData.text,
            modelUsed: cachedData.modelUsed,
            cached: true,
          };
        }
      } catch (err) {
        console.error("[AI Gateway] Error reading cache:", err);
        // Continue to generate if cache read fails
      }

      // Initialize SDK with the secret API Key
      const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });

    let lastError = null;

    // Phase 1: Core Router & Resilience (Strategies 1, 11)
    for (let modelIndex = 0; modelIndex < modelPriority.length; modelIndex++) {
      const currentModel = modelPriority[modelIndex];
      let attempts = 0;
      const maxRetries = 3;

      while (attempts < maxRetries) {
        try {
          console.log(`[AI Gateway] Trying model ${currentModel} (Attempt ${attempts + 1})`);
          
          const generateConfig = { ...config };
          if (systemInstruction) {
            generateConfig.systemInstruction = systemInstruction;
          }

          const response = await ai.models.generateContent({
            model: currentModel,
            contents: prompt,
            config: generateConfig,
          });

          console.log(`[AI Gateway] Success with model ${currentModel}`);
          const result = {
            text: response.text,
            modelUsed: currentModel,
            cached: false,
          };

          // Save to persistent cache (Strategy 4)
          try {
            await cacheRef.set({
              ...result,
              prompt,
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`[AI Gateway] Saved result to cache ${requestHash}`);
          } catch (err) {
            console.error("[AI Gateway] Failed to save to cache:", err);
          }

          // Strategy 14 & 10: Cost-Optimized Telemetry (Single Doc Rolling Buffer)
          // Reduces write operations to 1 atomic update per call & eliminates collection bloat
          const logAnalytics = async () => {
            try {
              const userName = request.auth.token?.name || request.auth.token?.email || request.auth.uid?.slice(0, 8) || 'Student';
              const logEntry = {
                id: crypto.randomBytes(6).toString('hex'),
                user: userName,
                task: task || 'general',
                modelUsed: currentModel,
                cached: false,
                attempts: attempts + 1,
                timeIso: new Date().toISOString()
              };

              const liveDashRef = db.collection("ai_telemetry").doc("live_dashboard");
              const snap = await liveDashRef.get();
              let logs = snap.exists && Array.isArray(snap.data()?.recentLogs) ? snap.data().recentLogs : [];
              logs.unshift(logEntry);
              if (logs.length > 15) logs = logs.slice(0, 15);

              await liveDashRef.set({
                requestsToday: admin.firestore.FieldValue.increment(1),
                recentLogs: logs,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
              }, { merge: true });
            } catch (err) {
              console.error("[AI Gateway] Optimized telemetry update failed:", err);
            }
          };
          logAnalytics(); // fire and forget

          return result;
          
        } catch (error) {
          lastError = error;
          const status = error?.status || error?.response?.status;
          const isRateLimit = status === 429;
          const isServerError = status >= 500;
          const isNotFound = status === 404;

          if (isRateLimit || isServerError) {
            attempts++;
            if (attempts < maxRetries) {
              // Strategy 11: Exponential Backoff (1s, 2s, 4s...)
              const waitTime = Math.pow(2, attempts - 1) * 1000;
              console.warn(`[AI Gateway] ${status} Error on ${currentModel}. Retrying in ${waitTime}ms...`);
              await delay(waitTime);
            } else {
              console.warn(`[AI Gateway] Exhausted retries for ${currentModel}. Falling back to next model.`);
              // Break inner while loop to move to the next model in the outer for loop
              break;
            }
          } else if (isNotFound) {
            console.warn(`[AI Gateway] Model ${currentModel} not found (404). Falling back to next model.`);
            break;
          } else {
            // Not a rate limit or server error (e.g. 400 Bad Request, invalid prompt)
            // No point retrying or falling back, throw immediately.
            console.error(`[AI Gateway] Unrecoverable error on ${currentModel}:`, error);
            throw new HttpsError("internal", error.message || "Failed to generate AI content.");
          }
        }
      }
    }

    // If we exhaust all models and all retries:
    console.error("[AI Gateway] All models and retries exhausted.", lastError);
    throw new HttpsError("resource-exhausted", "AI is temporarily busy. Please try again later.");
  };

  // Add the promise to in-flight requests for deduplication
  const promise = generateResponsePromise();
  inFlightRequests.set(requestHash, promise);

  try {
    return await promise;
  } finally {
    // Ensure we clean up the map whether it succeeds or fails
    inFlightRequests.delete(requestHash);
  }
}
);

/**
 * Orion TTS Gateway Cloud Function
 * Converts text to speech using Gemini's audio modality.
 */
exports.orionTTSGateway = onCall(
  { secrets: [geminiApiKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be logged in.");
    }

    const { text } = request.data;
    if (!text) {
      throw new HttpsError("invalid-argument", "Missing text for TTS.");
    }

    const ttsModels = [MODELS.tts31, MODELS.tts25];
    const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });
    
    const config = {
      responseModalities: ['audio'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: 'Kore' // Natural, warm voice
          }
        }
      }
    };

    let lastTtsError = null;
    for (const ttsModel of ttsModels) {
      try {
        console.log(`[TTS Gateway] Requesting speech with model ${ttsModel}...`);
        const response = await ai.models.generateContent({
          model: ttsModel,
          contents: text,
          config: config,
        });

        const parts = response.candidates?.[0]?.content?.parts || [];
        const inlineData = parts.find(p => p.inlineData)?.inlineData;

        if (inlineData && inlineData.data) {
          return {
            mimeType: inlineData.mimeType || 'audio/wav',
            data: inlineData.data, // base64 string
            modelUsed: ttsModel
          };
        }
      } catch (err) {
        console.warn(`[TTS Gateway] Failed with ${ttsModel}:`, err.message);
        lastTtsError = err;
      }
    }

    console.error("[TTS Gateway] All TTS models failed:", lastTtsError);
    throw new HttpsError("internal", "Failed to generate speech audio.");
  }
);
