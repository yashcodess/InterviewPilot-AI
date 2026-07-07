import { GoogleGenAI } from '@google/genai';
import { getCompanyProfile } from './companyProfiles';
import type { CodingQuestion, InterviewQuestion } from '../types/interview';

export class GeminiApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'GeminiApiError';
    this.status = status;
  }
}

// ========================
// RETRY MANAGER & NETWORK SECURITY
// ========================
export class RetryManager {
  static async execute<T>(
    fn: () => Promise<T>,
    onRetry?: (attempt: number, delay: number, error: any) => void
  ): Promise<T> {
    const delays = [2000, 4000, 8000];
    let lastError: any = null;

    for (let i = 0; i < delays.length; i++) {
      try {
        return await fn();
      } catch (err: any) {
        lastError = err;
        const status = err.status || 500;
        const isTransient = status === 503 || status === 0 || err.message?.includes('fetch') || err.message?.includes('timeout') || err.message?.includes('network');
        
        if (!isTransient || i === delays.length - 1) {
          throw err;
        }

        if (onRetry) {
          onRetry(i + 1, delays[i], err);
        } else {
          console.warn(`[RetryManager] Attempt ${i + 1} failed. Retrying in ${delays[i]}ms...`, err);
        }
        await new Promise(resolve => setTimeout(resolve, delays[i]));
      }
    }
    throw lastError;
  }
}

async function callGenAiSdk(apiKey: string, prompt: string, forceJson = false): Promise<string> {
  if (!navigator.onLine) {
    throw new GeminiApiError('No internet connection detected.', 0);
  }

  const executeCall = async () => {
    const ai = new GoogleGenAI({ apiKey });
    const config: any = {};
    if (forceJson) {
      config.responseMimeType = 'application/json';
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config,
    });

    if (response.text) {
      return response.text;
    } else {
      throw new Error('Response did not contain valid text.');
    }
  };

  try {
    return await RetryManager.execute(executeCall);
  } catch (error: any) {
    console.error('Gemini SDK call failed after retries:', error);
    
    let status = error.status || 500;
    const msg = error.message || '';
    
    if (msg.includes('API key') || msg.includes('401') || msg.includes('API_KEY_INVALID')) {
      status = 401;
    } else if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
      status = 429;
    } else if (msg.includes('403') || msg.includes('PERMISSION_DENIED')) {
      status = 403;
    } else if (msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('overloaded')) {
      status = 503;
    }

    throw new GeminiApiError(error.message || 'An unknown error occurred while calling the Gemini API.', status);
  }
}

export async function validateApiKey(apiKey: string): Promise<{ valid: boolean; status: number; reason?: string }> {
  if (!navigator.onLine) {
    return { valid: false, status: 0, reason: 'OFFLINE' };
  }
  try {
    const ai = new GoogleGenAI({ apiKey });
    await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Respond with OK',
    });
    return { valid: true, status: 200 };
  } catch (error: any) {
    let status = 500;
    let reason = 'UNKNOWN';
    const msg = error.message || '';
    
    if (msg.includes('API key') || msg.includes('401') || msg.includes('API_KEY_INVALID')) {
      status = 401;
      reason = 'API_KEY_INVALID';
    } else if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
      status = 429;
      reason = 'RESOURCE_EXHAUSTED';
    } else if (msg.includes('403') || msg.includes('PERMISSION_DENIED')) {
      status = 403;
      reason = 'PERMISSION_DENIED';
    } else if (msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('overloaded')) {
      status = 503;
      reason = 'SERVICE_UNAVAILABLE';
    }
    
    return { valid: false, status, reason };
  }
}

function trackRequest(type: 'Question Generation' | 'Resume Analysis' | 'Evaluation' | 'Roadmap' | 'Follow-up') {
  if (typeof window !== 'undefined') {
    (window as any).geminiRequestCount = ((window as any).geminiRequestCount || 0) + 1;
    if (import.meta.env.DEV) {
      console.log(`%c[Gemini Request] Type: ${type} | Session Total: ${(window as any).geminiRequestCount}`, 'color: #3b82f6; font-weight: bold;');
    }
    window.dispatchEvent(new CustomEvent('gemini-request-sent', { detail: { type, count: (window as any).geminiRequestCount } }));
  }
}

function cleanAndParseJson(text: string) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return JSON.parse(cleaned.trim());
}

// ========================
// CACHE SERVICE MANAGERS
// ========================
export class ResumeCache {
  static getAnalysis(): ResumeAnalysisResult | null {
    const data = window.localStorage.getItem('interviewpilot_resume_analysis');
    if (!data) return null;
    try {
      const parsed = JSON.parse(data);
      return parsed.analysis || null;
    } catch {
      return null;
    }
  }

  static saveAnalysis(fileName: string, resumeText: string, analysis: ResumeAnalysisResult): void {
    window.localStorage.setItem('interviewpilot_resume_analysis', JSON.stringify({
      fileName,
      resumeText,
      analysis
    }));
  }
}

export class AnalysisCache {
  static getEvaluation(id: string): any | null {
    const data = window.localStorage.getItem(`interviewpilot_eval_${id}`);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  static saveEvaluation(id: string, evaluation: any): void {
    window.localStorage.setItem(`interviewpilot_eval_${id}`, JSON.stringify(evaluation));
  }
}

// ========================
// REUSABLE PROMPT TEMPLATES & SYSTEM CONSTANTS
// ========================
export class PromptBuilder {
  static readonly SYSTEM_INTERVIEWER_INSTRUCTIONS = `You are a supportive, friendly, and highly experienced Technical Interviewer.
  Your goal is to simulate a realistic, progressive, logically structured interview conversation. The questions must flow like a real interview, rather than feeling like a random set of isolated quiz questions.`;

  static readonly INTERVIEW_STYLE_GUIDELINES = `--- CONVERSATIONAL STYLE & PERSONALITY ---
  - Speak naturally, warmly, and professionally. Maintain a curious, encouraging, and supportive tone.
  - Avoid robotic or repetitive praises (like "Great answer!", "Excellent!", "Fantastic!"). Use varied, natural responses (e.g., "Good explanation", "Interesting approach", "Let's build on that", "Nice way of looking at it").
  - Keep questions focused on one primary concept. No long paragraphs. Maximum 120 words.`;

  static buildNextQuestionPrompt(params: {
    role: string;
    category: string;
    difficulty: string;
    questionNumber: number;
    totalLength: number;
    context: any;
    resumeSummary: string;
    transcriptString: string;
    company?: string;
  }): string {
    if (params.category === 'Code Interview') {
      const profile = getCompanyProfile(params.company || 'Generic');
      return `${this.SYSTEM_INTERVIEWER_INSTRUCTIONS}
      You are conducting a Code Interview for a "${params.role}" candidate.
      Selected difficulty: "${params.difficulty}". Question ${params.questionNumber} of ${params.totalLength}.
      
      Configure the coding problem to match this Company Interview Profile:
      - Target Company: ${profile.company}
      - Preferred Topics: ${profile.preferredTopics.join(', ')}
      - Difficulty Bias: ${profile.difficultyBias} (adjust according to the target difficulty "${params.difficulty}")
      - Question Styles: ${profile.preferredQuestionTypes.join(', ')}
      - Profile Guidelines: ${profile.instructionSummary}
      
      Generate a single coding challenge appropriate for this setup.
      Do NOT include any starter code stubs in the JSON output. Starter code templates are resolved locally.
      
      Output a valid JSON object matching this schema exactly:
      {
        "id": "challenge_${params.questionNumber}",
        "title": "Problem Title",
        "difficulty": "${params.difficulty}",
        "description": "Clear problem statement, constraints, and example inputs/outputs.",
        "constraints": ["constraint 1", "constraint 2"],
        "examples": [
          {
            "input": "nums = [2,7,11,15], target = 9",
            "output": "[0,1]",
            "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
          }
        ],
        "expectedSkills": ["skill1", "skill2"],
        "functionName": "solve",
        "estimatedTime": 25,
        "topic": "${profile.preferredTopics[0] || 'Algorithms'}",
        "companyTags": ["${profile.company}"],
        "hiddenTestCases": [
          {
            "input": "nums = [3,3], target = 6",
            "expectedOutput": "[0,1]",
            "description": "Duplicates handling"
          },
          {
            "input": "nums = [2,5], target = 8",
            "expectedOutput": "[]",
            "description": "No solution found"
          }
        ]
      }
      
      Return ONLY the JSON. Never return markdown code blocks (do NOT use \`\`\`json). Never return any text explanations outside the JSON object. Output pure JSON only.`;
    }

    return `${this.SYSTEM_INTERVIEWER_INSTRUCTIONS}
    You are interviewing a candidate for a "${params.role}" position, under the "${params.category}" category.
    Selected difficulty: "${params.difficulty}". Question ${params.questionNumber} of ${params.totalLength}.
    
    --- DYNAMIC CONTEXT (MEMORY) ---
    - Skills Covered: ${JSON.stringify(params.context.skillsCovered)}
    - Weaknesses Detected: ${JSON.stringify(params.context.weaknessesDetected)}
    - Last Answer Quality: ${params.context.lastAnswerQuality}
    - Candidate Resume Summary: ${params.resumeSummary}
    
    === START CHAT HISTORY ===
    ${params.transcriptString || 'No history yet.'}
    === END CHAT HISTORY ===

    Instructions based on memory & adaptivity:
    1. Review the history to maintain conversational context. Refer back to previously mentioned technologies naturally.
    2. If the last answer quality indicates struggle or incorrectness, slightly reduce the complexity or ask a simplified guiding question to help them rebuild confidence. Do not reveal correct answers immediately.
    3. If they performed consistently well, gradually increase complexity naturally. Do not repeat concepts.
    
    Return ONLY the next question string. No markdown, no JSON brackets, no intro.`;
  }

  static buildOnTheFlyEvalPrompt(params: {
    role: string;
    category: string;
    difficulty: string;
    questionNumber: number;
    totalLength: number;
    question: InterviewQuestion;
    answer: string;
    followUp?: { question: string; answer: string };
    context: any;
    resumeSummary: string;
    company?: string;
  }): string {
    const questionText = typeof params.question === 'object'
      ? `${params.question.title} - ${params.question.description}`
      : params.question;

    if (params.category === 'Code Interview') {
      const profile = getCompanyProfile(params.company || 'Generic');
      return `${this.SYSTEM_INTERVIEWER_INSTRUCTIONS}
      Evaluate the candidate's code submission for Question ${params.questionNumber} of ${params.totalLength}.
      Problem details: "${questionText}"
      
      Candidate's Submitted Code:
      "${params.answer}"
      
      Target Company Profile guidelines: ${profile.instructionSummary}
      
      Evaluate their solution for correctness, algorithmic efficiency, Big-O complexities (Time/Space), code style readability, naming, and handling of boundary/edge cases.
      Compare the code against the problem's hidden edge test cases: check if the code logic would fail any boundary cases (e.g. empty lists, negative values, duplicates, large integer limits).
      
      Output a valid JSON object matching this schema exactly:
      {
        "feedback": "Short feedback (max 50 words) analyzing correctness, complexities, and code cleanliness.",
        "technicalScore": 85,
        "communicationScore": 80,
        "confidence": 75,
        "detectedWeaknesses": ["Space complexity optimization", "Boundary checks"],
        "nextDifficulty": "Intermediate",
        "coveredSkills": ["Two sum", "Hash maps"],
        "nextQuestion": "NO_MORE_QUESTIONS",
        "testCasesPassedCount": 3,
        "testCasesTotalCount": 4,
        "edgeCaseFailures": ["Fails duplicates handling edge-case"]
      }
      
      If this is not the final question, the "nextQuestion" field MUST be a new coding problem matching the CodingQuestion JSON schema. If it is the final question, "nextQuestion" must be "NO_MORE_QUESTIONS".
      
      Return ONLY the JSON. Never return markdown code blocks (do NOT use \`\`\`json). Never return any text explanations outside the JSON object. Output pure JSON only.`;
    }

    return `${this.SYSTEM_INTERVIEWER_INSTRUCTIONS}
    ${this.INTERVIEW_STYLE_GUIDELINES}
    Analyze the candidate's response to Question ${params.questionNumber} of ${params.totalLength}.
    Question: "${questionText}"
    Answer: "${params.answer}"
    ${params.followUp ? `Follow-up Question: "${params.followUp.question}"\nFollow-up Answer: "${params.followUp.answer}"` : ''}

    Evaluate this specific response and output a JSON object containing:
    - "feedback": Short, friendly feedback for this answer (max 40 words).
    - "technicalScore": Score from 0 to 100.
    - "communicationScore": Score from 0 to 100.
    - "confidence": Score from 0 to 100.
    - "detectedWeaknesses": Array of strings representing any topic weaknesses found in this answer.
    - "nextDifficulty": Suggested difficulty for next question ("Beginner" | "Intermediate" | "Advanced").
    - "coveredSkills": Array of strings of skills demonstrated in this answer.
    - "nextQuestion": The next progressive question string (or "NO_MORE_QUESTIONS" if this is the final question of the interview).
    
    Make sure the JSON matches the schema exactly with no other surrounding text.`;
  }

  static buildFinalEvaluationPrompt(params: {
    role: string;
    category: string;
    difficulty: string;
    length: number;
    transcriptText: string;
    resumeSummary: string;
    onTheFlyEvaluations: any[];
  }): string {
    return `${this.SYSTEM_INTERVIEWER_INSTRUCTIONS}
    Generate the overall final evaluation report for this completed interview session.
    Role: "${params.role}" | Category: "${params.category}" | Difficulty: "${params.difficulty}"
    
    === START CHAT HISTORY ===
    ${params.transcriptText}
    === END CHAT HISTORY ===
    
    Step-by-step intermediate evaluations: ${JSON.stringify(params.onTheFlyEvaluations)}
    Candidate Resume Summary: ${params.resumeSummary}

    Output a valid JSON object matching this schema exactly:
    {
      "overallScore": number (0 to 100),
      "scores": {
        "communication": number (0 to 100),
        "technicalAccuracy": number (0 to 100),
        "confidence": number (0 to 100),
        "problemSolving": number (0 to 100),
        "completeness": number (0 to 100)
      },
      "strengths": ["string"],
      "weaknesses": ["string"],
      "improvementTips": ["string"],
      "roadmap": [
        {
          "week": "string",
          "topics": ["string"],
          "learningGoals": ["string"],
          "practiceTasks": ["string"],
          "resources": ["string"],
          "estimatedStudyTime": "string"
        }
      ],
      "resumeCoverage": number (0 to 100),
      "skillsCovered": ["string"],
      "skillsMissing": ["string"],
      "projectsDiscussed": ["string"],
      "technologiesAsked": ["string"],
      "weakSkillsDetected": ["string"],
      "communicationAnalysis": {
        "speakingSpeed": number,
        "averageAnswerLength": number,
        "responseDuration": number,
        "longestPause": number,
        "speakingConsistency": "string",
        "answerCompleteness": "string",
        "confidenceTrend": "string",
        "technicalVocabulary": "string",
        "conciseness": number,
        "clarity": number,
        "communicationScore": number,
        "speakingStyle": "string",
        "overusedWords": ["string"],
        "coachingFeedback": ["string"],
        "communicationExercises": ["string"],
        "fillerWords": number
      }
    }
    No surrounding markdown formatting. Output pure JSON.`;
  }

  static buildCodingInterviewPrompt(params: {
    role: string;
    difficulty: string;
    length: number;
    company: string;
    resumeSummary: string;
  }): string {
    const profile = getCompanyProfile(params.company || 'Generic');
    return `${this.SYSTEM_INTERVIEWER_INSTRUCTIONS}
    You are conducting a Code Interview for a "${params.role}" candidate.
    Selected difficulty: "${params.difficulty}".
    Selected target round length: ${params.length} questions.
    
    Configure the coding problems to match this Company Interview Profile:
    - Target Company: ${profile.company}
    - Preferred Topics: ${profile.preferredTopics.join(', ')}
    - Difficulty Bias: ${profile.difficultyBias} (adjust according to the overall difficulty "${params.difficulty}")
    - Question Styles: ${profile.preferredQuestionTypes.join(', ')}
    - Profile Guidelines: ${profile.instructionSummary}
    
    Generate exactly ${params.length} unique coding challenges appropriate for this candidate.
    For each challenge, do NOT include starter code stubs in the JSON output. Templates are resolved locally.
    
    Output a single valid JSON object containing a "questions" array of exactly ${params.length} coding questions:
    {
      "questions": [
        {
          "id": "challenge_1",
          "title": "Problem Title",
          "difficulty": "${params.difficulty}",
          "description": "Clear problem statement, constraints, and example inputs/outputs.",
          "constraints": ["constraint 1", "constraint 2"],
          "examples": [
            {
              "input": "nums = [2,7,11,15], target = 9",
              "output": "[0,1]",
              "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
            }
          ],
          "expectedSkills": ["skill1", "skill2"],
          "functionName": "solve",
          "estimatedTime": 25,
          "topic": "${profile.preferredTopics[0] || 'Algorithms'}",
          "companyTags": ["${profile.company}"],
          "hiddenTestCases": [
            {
              "input": "nums = [3,3], target = 6",
              "expectedOutput": "[0,1]",
              "description": "Duplicates handling"
            }
          ]
        }
      ]
    }
    
    Return ONLY the JSON object. Never return markdown code blocks (do NOT use \`\`\`json). Never return any text explanations outside the JSON. Output pure JSON only.`;
  }
}

// ========================
// CONVERSATIONAL MEMORY MANAGER
// ========================
export class InterviewContextManager {
  private state: {
    questionsAsked: string[];
    candidateAnswers: string[];
    coveredSkills: string[];
    difficulty: string;
    resumeSummary: string;
    knowledgeGaps: string[];
    interviewHistory: any[];
  };

  constructor(baseDifficulty: string, resumeAnalysis?: ResumeAnalysisResult) {
    this.state = {
      questionsAsked: [],
      candidateAnswers: [],
      coveredSkills: [],
      difficulty: baseDifficulty,
      resumeSummary: resumeAnalysis ? `${resumeAnalysis.experienceLevel} candidate. Skills: ${Object.values(resumeAnalysis.skills).flat().join(', ')}` : '',
      knowledgeGaps: [],
      interviewHistory: []
    };
  }

  addQuestion(question: string) {
    this.state.questionsAsked.push(question);
  }

  addAnswer(answer: string, feedback?: any) {
    this.state.candidateAnswers.push(answer);
    if (feedback) {
      this.state.interviewHistory.push({
        question: this.state.questionsAsked[this.state.questionsAsked.length - 1],
        answer,
        feedback
      });
      if (feedback.coveredSkills) {
        this.state.coveredSkills = [...new Set([...this.state.coveredSkills, ...feedback.coveredSkills])];
      }
      if (feedback.detectedWeaknesses) {
        this.state.knowledgeGaps = [...new Set([...this.state.knowledgeGaps, ...feedback.detectedWeaknesses])];
      }
      if (feedback.nextDifficulty) {
        this.state.difficulty = feedback.nextDifficulty;
      }
    }
  }

  getContextSummary() {
    return {
      skillsCovered: this.state.coveredSkills,
      weaknessesDetected: this.state.knowledgeGaps,
      lastAnswerQuality: this.state.candidateAnswers.length > 0 ? (this.state.candidateAnswers[this.state.candidateAnswers.length - 1].length < 15 ? 'poor' : 'good') : 'unknown'
    };
  }

  getResumeSummary(): string {
    return this.state.resumeSummary;
  }
}

// ========================
// CONVERSATIONAL INTERVIEW SERVICES
// ========================
export interface OnTheFlyEvaluation {
  feedback: string;
  technicalScore: number;
  communicationScore: number;
  confidence: number;
  detectedWeaknesses: string[];
  nextDifficulty: string;
  coveredSkills: string[];
  nextQuestion: InterviewQuestion;
  testCasesPassedCount?: number;
  testCasesTotalCount?: number;
  edgeCaseFailures?: string[];
}

export class GeminiInterviewService {
  static async evaluateAnswerOnTheFly(
    apiKey: string,
    setup: { role: string; category: string; difficulty: string; length: number; company?: string },
    question: InterviewQuestion,
    answer: string,
    questionNumber: number,
    followUp?: { question: string; answer: string },
    resumeAnalysis?: ResumeAnalysisResult,
    transcriptSoFar: Array<{ question: InterviewQuestion; answer: string; followUp?: { question: string; answer: string } }> = []
  ): Promise<OnTheFlyEvaluation> {
    const resumeSummary = resumeAnalysis 
      ? `${resumeAnalysis.experienceLevel} candidate. Skills: ${Object.values(resumeAnalysis.skills).flat().join(', ')}` 
      : 'No resume uploaded.';

    const context = buildInterviewContext(transcriptSoFar, resumeAnalysis);

    const prompt = PromptBuilder.buildOnTheFlyEvalPrompt({
      role: setup.role,
      category: setup.category,
      difficulty: setup.difficulty,
      questionNumber,
      totalLength: setup.length,
      question,
      answer,
      followUp,
      context,
      resumeSummary,
      company: setup.company
    });

    trackRequest('Question Generation');
    const responseText = await callGenAiSdk(apiKey, prompt, true);
    return cleanAndParseJson(responseText) as OnTheFlyEvaluation;
  }

  static async evaluateFinalInterview(
    apiKey: string,
    setup: { role: string; category: string; difficulty: string; length: number },
    transcript: Array<{ question: InterviewQuestion; answer: string; followUp?: { question: string; answer: string } }>,
    onTheFlyEvaluations: OnTheFlyEvaluation[],
    resumeAnalysis?: ResumeAnalysisResult
  ): Promise<EvaluationResult> {
    const resumeSummary = resumeAnalysis 
      ? `${resumeAnalysis.experienceLevel} candidate. Skills: ${Object.values(resumeAnalysis.skills).flat().join(', ')}` 
      : 'No resume uploaded.';

    const transcriptText = transcript
      .map((item, index) => {
        const qText = typeof item.question === 'object'
          ? `${item.question.title} - ${item.question.description}`
          : item.question;
        let text = `Q${index + 1}: ${qText}\nAnswer: ${item.answer || '(No answer provided)'}`;
        if (item.followUp) {
          text += `\nFollow-up Q: ${item.followUp.question}\nFollow-up Answer: ${item.followUp.answer || '(No answer provided)'}`;
        }
        return text;
      })
      .join('\n\n');

    const prompt = PromptBuilder.buildFinalEvaluationPrompt({
      role: setup.role,
      category: setup.category,
      difficulty: setup.difficulty,
      length: setup.length,
      transcriptText,
      resumeSummary,
      onTheFlyEvaluations
    });

    trackRequest('Evaluation');
    const responseText = await callGenAiSdk(apiKey, prompt, true);
    return cleanAndParseJson(responseText) as EvaluationResult;
  }

  static async generateAllCodingQuestions(
    apiKey: string,
    role: string,
    difficulty: string,
    length: number,
    resumeSummary: string,
    company: string
  ): Promise<CodingQuestion[]> {
    const prompt = PromptBuilder.buildCodingInterviewPrompt({
      role,
      difficulty,
      length,
      company,
      resumeSummary
    });

    trackRequest('Question Generation');
    const responseText = await callGenAiSdk(apiKey, prompt, true);
    
    // Parse the JSON response
    const parsed = cleanAndParseJson(responseText);
    if (!parsed || !Array.isArray(parsed.questions)) {
      throw new Error("Invalid response format: 'questions' array is missing or empty.");
    }
    
    return parsed.questions;
  }
}

// Wrapper delegates for direct import compatibility
export async function evaluateAnswerOnTheFly(
  apiKey: string,
  setup: { role: string; category: string; difficulty: string; length: number; company?: string },
  question: InterviewQuestion,
  answer: string,
  questionNumber: number,
  followUp?: { question: string; answer: string },
  resumeAnalysis?: ResumeAnalysisResult,
  transcriptSoFar: Array<{ question: InterviewQuestion; answer: string; followUp?: { question: string; answer: string } }> = []
): Promise<OnTheFlyEvaluation> {
  return GeminiInterviewService.evaluateAnswerOnTheFly(apiKey, setup, question, answer, questionNumber, followUp, resumeAnalysis, transcriptSoFar);
}

export async function evaluateFinalInterview(
  apiKey: string,
  setup: { role: string; category: string; difficulty: string; length: number },
  transcript: Array<{ question: InterviewQuestion; answer: string; followUp?: { question: string; answer: string } }>,
  onTheFlyEvaluations: OnTheFlyEvaluation[],
  resumeAnalysis?: ResumeAnalysisResult
): Promise<EvaluationResult> {
  return GeminiInterviewService.evaluateFinalInterview(apiKey, setup, transcript, onTheFlyEvaluations, resumeAnalysis);
}

export async function generateAllCodingQuestions(
  apiKey: string,
  role: string,
  difficulty: string,
  length: number,
  resumeSummary: string,
  company: string
): Promise<CodingQuestion[]> {
  return GeminiInterviewService.generateAllCodingQuestions(apiKey, role, difficulty, length, resumeSummary, company);
}

// ========================
// LEGACY COMPATIBILITY API WRAPPERS
// ========================
export interface InterviewContext {
  skillsCovered: string[];
  skillsRemaining: string[];
  weaknessesDetected: string[];
  difficultyHistory: string[];
  lastAnswerQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
}

export function buildInterviewContext(
  transcriptSoFar: Array<{ question: InterviewQuestion; answer: string; followUp?: { question: string; answer: string } }>,
  resumeAnalysis?: ResumeAnalysisResult
): InterviewContext {
  const skillsCovered: string[] = [];
  const weaknessesDetected: string[] = [];
  const difficultyHistory: string[] = [];
  let lastAnswerQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown' = 'unknown';

  transcriptSoFar.forEach((item, idx) => {
    const qText = (typeof item.question === 'object' ? `${item.question.title} - ${item.question.description}` : item.question).toLowerCase();
    const aText = item.answer.toLowerCase();
    
    const topics = ['props', 'usestate', 'useeffect', 'usecontext', 'usereducer', 'middleware', 'indexing', 'branching', 'closures', 'promises', 'async await', 'variables', 'loops', 'arrays', 'strings', 'functions', 'objects', 'json', 'git', 'api', 'http', 'debugging', 'node', 'express', 'sql', 'react'];
    topics.forEach(t => {
      if (qText.includes(t) && !skillsCovered.includes(t)) {
        skillsCovered.push(t);
      }
    });

    const weakKeywords = ['don\'t know', 'not sure', 'forgot', 'no idea', 'skip', 'sorry'];
    weakKeywords.forEach(kw => {
      if (aText.includes(kw)) {
        const gap = topics.find(t => qText.includes(t)) || 'unknown topic';
        if (!weaknessesDetected.includes(gap)) {
          weaknessesDetected.push(gap);
        }
      }
    });

    if (idx === transcriptSoFar.length - 1) {
      if (aText.length < 15 || aText.includes('don\'t know') || aText.includes('skip')) {
        lastAnswerQuality = 'poor';
      } else if (aText.length > 80 && !aText.includes('not sure')) {
        lastAnswerQuality = 'excellent';
      } else {
        lastAnswerQuality = 'good';
      }
    }
  });

  return {
    skillsCovered,
    skillsRemaining: selectNextSkill('', '', transcriptSoFar, resumeAnalysis).remaining,
    weaknessesDetected,
    difficultyHistory,
    lastAnswerQuality
  };
}

export function selectNextSkill(
  category: string,
  difficulty: string,
  transcriptSoFar: Array<{ question: InterviewQuestion; answer: string; followUp?: { question: string; answer: string } }>,
  resumeAnalysis?: ResumeAnalysisResult
): { next: string; remaining: string[] } {
  const beginnerPool = ['variables', 'loops', 'arrays', 'strings', 'functions', 'objects', 'json', 'git', 'api', 'http', 'debugging'];
  const intermediatePool = ['react hooks', 'promises', 'async await', 'error handling', 'time complexity', 'api integration', 'sql', 'testing'];
  const advancedPool = ['system design', 'scalability', 'performance optimization', 'concurrency', 'architecture', 'security', 'design patterns'];

  let pool = beginnerPool;
  const diffLower = (difficulty || '').toLowerCase();
  if (diffLower === 'intermediate') {
    pool = intermediatePool;
  } else if (diffLower === 'advanced') {
    pool = advancedPool;
  }

  if (resumeAnalysis?.skills) {
    const resumeSkills = Object.values(resumeAnalysis.skills).flat().map(s => s.toLowerCase());
    pool = [...new Set([...pool, ...resumeSkills])];
  }

  const covered = transcriptSoFar.map(t => {
    const qText = (typeof t.question === 'object' ? `${t.question.title} - ${t.question.description}` : t.question).toLowerCase();
    return pool.find(s => qText.includes(s) || (s.endsWith('s') && qText.includes(s.slice(0, -1)))) || '';
  }).filter(Boolean);

  const remaining = pool.filter(s => !covered.includes(s));
  const next = remaining[0] || 'general knowledge';

  return { next, remaining };
}

export function calculateDifficulty(
  transcriptSoFar: Array<{ question: InterviewQuestion; answer: string; followUp?: { question: string; answer: string } }>,
  baseDifficulty: string
): string {
  if (transcriptSoFar.length === 0) return baseDifficulty;
  
  let score = 0;
  transcriptSoFar.forEach(item => {
    const ans = item.answer.toLowerCase();
    if (ans.includes('don\'t know') || ans.includes('skip') || ans.length < 15) {
      score -= 1;
    } else if (ans.length > 60) {
      score += 1;
    }
  });

  if (score < -1) {
    return baseDifficulty === 'Advanced' ? 'Intermediate' : 'Beginner';
  } else if (score > 1) {
    return baseDifficulty === 'Beginner' ? 'Intermediate' : 'Advanced';
  }

  return baseDifficulty;
}

export function detectKnowledgeGap(
  transcriptSoFar: Array<{ question: InterviewQuestion; answer: string; followUp?: { question: string; answer: string } }>
): string[] {
  const gaps: string[] = [];
  transcriptSoFar.forEach(item => {
    const ans = item.answer.toLowerCase();
    const qText = (typeof item.question === 'object' ? `${item.question.title} - ${item.question.description}` : item.question).toLowerCase();
    if (ans.includes('don\'t know') || ans.includes('skip') || ans.length < 15) {
      const topics = ['props', 'state', 'usestate', 'useeffect', 'middleware', 'indexing', 'branching', 'closures', 'promises', 'async await', 'variables', 'loops', 'arrays', 'strings', 'functions', 'objects', 'json', 'git', 'api', 'http'];
      const topic = topics.find(t => qText.includes(t));
      if (topic && !gaps.includes(topic)) {
        gaps.push(topic);
      }
    }
  });
  return gaps;
}

export function buildFollowUpPrompt(
  question: InterviewQuestion,
  answer: string,
  difficulty: string,
  resumeAnalysis?: ResumeAnalysisResult
): string {
  const qText = typeof question === 'object'
    ? `${question.title} - ${question.description}`
    : question;

  let resumeContext = '';
  if (resumeAnalysis) {
    resumeContext = `\nCandidate Resume Profile context:
    Skills: ${JSON.stringify(resumeAnalysis.skills)}
    Projects: ${JSON.stringify(resumeAnalysis.projects)}
    Recommended Focus: ${JSON.stringify(resumeAnalysis.recommendedInterviewFocus)}`;
  }

  return `You are a supportive, friendly, and experienced Technical Interviewer.
  Analyze the candidate's answer to the interview question below and determine if a follow-up question is appropriate. 
  
  FOLLOW-UP & CONVERSATIONAL RULES:
  - If the candidate says "I don't know", "skip", or indicates they do not know the answer, do NOT punish them or ask another hard question. Instead, ask a friendly, supportive question (e.g. "That's completely okay. Can you explain what you think it might do, or how you would go about finding out?").
  - If the candidate's answer is extremely brief (e.g. under 15 words), empty, or completely incorrect, do NOT ask a follow-up. Return exactly the string: "NO_FOLLOW_UP".
  - If the answer indicates reasonable knowledge, generate exactly one highly relevant, friendly follow-up question to probe deeper (e.g., if they mention using Java, ask what project they built with it; if they mention React, ask which hooks they used).
  - Talk naturally like a human. Avoid robotic, cold, or intimidating language. Keep it under 120 words. No long paragraphs.
  - Tailor the follow-up question to the difficulty level "${difficulty}".
  
  DIFFICULTY LEVEL RULES:
  - BEGINNER: Clear, simple follow-up, asking to explain a basic concept.
  - INTERMEDIATE: Ask about edge cases, error handling, or time complexity.
  - ADVANCED: Ask about scalability, tradeoffs, or alternative architectures.
  
  Original Question: "${qText}"
  Candidate's Answer: "${answer}"
  ${resumeContext}`;
}

export async function generateFollowUpQuestion(
  apiKey: string,
  question: InterviewQuestion,
  answer: string,
  difficulty: string,
  resumeAnalysis?: ResumeAnalysisResult
): Promise<string> {
  const prompt = buildFollowUpPrompt(question, answer, difficulty, resumeAnalysis);
  trackRequest('Follow-up');
  return await callGenAiSdk(apiKey, prompt, false);
}

export async function generateNextQuestion(
  apiKey: string,
  role: string,
  category: string,
  difficulty: string,
  questionNumber: number,
  totalLength: number,
  transcriptSoFar: Array<{ question: InterviewQuestion; answer: string; followUp?: { question: string; answer: string } }>,
  resumeAnalysis?: ResumeAnalysisResult,
  company?: string
): Promise<string> {
  const context = buildInterviewContext(transcriptSoFar, resumeAnalysis);
  const currentDiff = calculateDifficulty(transcriptSoFar, difficulty);
  const resumeSummary = resumeAnalysis 
    ? `${resumeAnalysis.experienceLevel} candidate. Skills: ${Object.values(resumeAnalysis.skills).flat().join(', ')}` 
    : 'No resume uploaded.';

  const transcriptString = transcriptSoFar.map((t, idx) => {
    let segment = `Q${idx + 1}: ${t.question}\nCandidate: ${t.answer}`;
    if (t.followUp) {
      segment += `\nFollow-up Q: ${t.followUp.question}\nCandidate: ${t.followUp.answer}`;
    }
    return segment;
  }).join('\n\n');

  const prompt = PromptBuilder.buildNextQuestionPrompt({
    role,
    category,
    difficulty: currentDiff,
    questionNumber,
    totalLength,
    context,
    resumeSummary,
    transcriptString,
    company
  });

  trackRequest('Question Generation');
  return await callGenAiSdk(apiKey, prompt, false);
}

export interface EvaluationResult {
  overallScore: number;
  scores: {
    communication: number;
    technicalAccuracy: number;
    confidence: number;
    problemSolving: number;
    completeness: number;
  };
  strengths: string[];
  weaknesses: string[];
  improvementTips: string[];
  roadmap: Array<{
    week: string;
    topics: string[];
    learningGoals: string[];
    practiceTasks: string[];
    resources: string[];
    estimatedStudyTime: string;
  }>;
  resumeCoverage?: number;
  skillsCovered?: string[];
  skillsMissing?: string[];
  projectsDiscussed?: string[];
  technologiesAsked?: string[];
  weakSkillsDetected?: string[];
  questionEvaluations?: Array<{
    questionIndex: number;
    score: number;
    feedback: string;
    confidence: 'High' | 'Medium' | 'Low' | string;
  }>;
  communicationAnalysis?: {
    speakingSpeed: number;
    averageAnswerLength: number;
    responseDuration: number;
    longestPause: number;
    speakingConsistency: 'High' | 'Medium' | 'Low' | string;
    answerCompleteness: 'High' | 'Medium' | 'Low' | string;
    confidenceTrend: string;
    technicalVocabulary: string;
    conciseness: number;
    clarity: number;
    communicationScore: number;
    speakingStyle: string;
    overusedWords: string[];
    coachingFeedback: string[];
    communicationExercises: string[];
    fillerWords: number;
  };
}

export async function evaluateInterview(
  apiKey: string,
  setup: { role: string; category: string; difficulty: string; length: number; resumeText?: string },
  transcript: Array<{ question: string; answer: string; followUp?: { question: string; answer: string } }>,
  resumeAnalysis?: ResumeAnalysisResult
): Promise<EvaluationResult> {
  return GeminiInterviewService.evaluateFinalInterview(apiKey, setup, transcript, [], resumeAnalysis);
}

export interface ResumeAnalysisResult {
  candidateName: string;
  email: string;
  phone: string;
  experienceLevel: 'Student' | 'Fresher' | 'Junior' | 'Mid Level' | 'Senior' | string;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  skills: {
    languages: string[];
    frameworks: string[];
    libraries: string[];
    databases: string[];
    tools: string[];
    cloud: string[];
    other: string[];
  };
  projects: Array<{
    title: string;
    description: string;
    technologies: string[];
  }>;
  certifications: string[];
  strengths: string[];
  weakAreas: string[];
  recommendedInterviewFocus: string[];
}

export async function analyzeResume(apiKey: string, resumeText: string, _retry = true): Promise<ResumeAnalysisResult> {
  const cached = ResumeCache.getAnalysis();
  if (cached) {
    return cached;
  }

  const prompt = `You are an expert AI Resume Analyzer and Technical Recruiter.
  Analyze the following candidate resume text and extract structured information.
  Never hallucinate. If details do not exist for a field, return an empty array or empty string as appropriate.
  
  Resume Text:
  ${resumeText}
  
  Estimate experience level:
  Possible values are exactly: "Student", "Fresher", "Junior", "Mid Level", or "Senior".
  Infer strengths based on explicit skills, projects, and work history.
  Infer weak areas ONLY from missing information (e.g. "No deployment projects", "No cloud experience", "No testing experience", "No backend projects"). Do not invent weaknesses.
  Recommend specific interview focus areas (e.g. "React", "System Design", "Node.js", "Java", "REST APIs", "Git", "JavaScript").
  
  Return ONLY valid JSON matching this schema exactly. Do not wrap in markdown or prefix with other text.
  
  JSON Schema:
  {
    "candidateName": "Name of candidate",
    "email": "Email address",
    "phone": "Phone number",
    "experienceLevel": "Student | Fresher | Junior | Mid Level | Senior",
    "education": [
      {
        "degree": "Degree",
        "institution": "Institution name",
        "year": "Graduation year"
      }
    ],
    "skills": {
      "languages": [],
      "frameworks": [],
      "libraries": [],
      "databases": [],
      "tools": [],
      "cloud": [],
      "other": []
    },
    "projects": [
      {
        "title": "Project Title",
        "description": "Project Description",
        "technologies": []
      }
    ],
    "certifications": [],
    "strengths": [],
    "weakAreas": [],
    "recommendedInterviewFocus": []
  }`;

  trackRequest('Resume Analysis');
  const rawResult = await callGenAiSdk(apiKey, prompt, true);
  const parsed = cleanAndParseJson(rawResult) as ResumeAnalysisResult;
  ResumeCache.saveAnalysis('resume', resumeText, parsed);
  return parsed;
}

export interface CareerGapAnalysis {
  overallReadiness: number;
  scores: {
    technicalReadiness: number;
    communicationReadiness: number;
    portfolioStrength: number;
  };
  jobFit: string;
  missingSkills: Array<{
    skill: string;
    importance: 'High' | 'Medium' | 'Low' | string;
    reason: string;
  }>;
  strongSkills: string[];
  learningRoadmap: Array<{
    week: number;
    title: string;
    topics: string[];
    practiceTasks: string[];
    estimatedHours: number;
    resources: string[];
  }>;
  projectRecommendations: string[];
  certificationRecommendations: string[];
  careerAdvice: string;
}

export async function analyzeCareerGap(
  apiKey: string,
  role: string,
  resumeAnalysis: any | null,
  transcript: any[],
  evaluation: any,
  _retry = true
): Promise<CareerGapAnalysis> {
  const resumeStr = resumeAnalysis ? JSON.stringify(resumeAnalysis) : 'No resume uploaded.';
  const transcriptText = transcript
    .map((item, index) => `Q${index + 1}: ${item.question}\nAnswer: ${item.answer || '(No answer)'}`)
    .join('\n\n');
  const evaluationStr = JSON.stringify(evaluation);

  const prompt = `You are a Principal Technical Recruiter and Career Coach.
  Compare the candidate's resume analysis, their performance in the interview transcript, and the evaluation score card against the target job role "${role}".
  Identify the technical gaps, communication strengths, portfolio missing links, and overall readiness for the job.
  
  Target Job Role: ${role}
  
  Resume Analysis Context:
  ${resumeStr}
  
  Interview Transcript Context:
  ${transcriptText}
  
  Evaluation Scores & Feedback Context:
  ${evaluationStr}
  
  Generate a Career Gap Analysis. 
  Estimate the Readiness Scores:
  - overallReadiness (weighted score out of 100)
  - scores.technicalReadiness (score out of 100)
  - scores.communicationReadiness (score out of 100)
  - scores.portfolioStrength (score out of 100)
  - jobFit (e.g. "Excellent", "Good", "Fair", "Poor")
  
  Identify missingSkills (with importance "High", "Medium", or "Low" and a brief reason why they need it for the role).
  Identify strongSkills (list of skills they demonstrated well).
  Identify projectRecommendations (recommend specific hand-on projects that bridge their gaps, e.g. "Deploy a Node.js app using Docker").
  Identify certificationRecommendations (recommend official industry credentials to boost their credibility).
  Provide careerAdvice (constructive, high-impact career advice).
  
  Generate a structured 4-week learningRoadmap (Week 1, Week 2, Week 3, Week 4) containing:
  - week (number: 1, 2, 3, 4)
  - title (string description of the weekly module focus)
  - topics (array of detailed subtopics)
  - practiceTasks (array of hands-on practical exercises)
  - estimatedHours (number of hours required)
  - resources (array of URLs referencing official documentations like MDN, React.dev, Microsoft Learn, FreeCodeCamp, Roadmap.sh, etc.)
  
  Return ONLY valid JSON matching this schema exactly. Do not wrap in markdown or add text outside of it.
  
  JSON Schema:
  {
    "overallReadiness": number,
    "scores": {
      "technicalReadiness": number,
      "communicationReadiness": number,
      "portfolioStrength": number
    },
    "jobFit": "Excellent | Good | Fair | Poor",
    "missingSkills": [
      {
        "skill": "Skill name",
        "importance": "High | Medium | Low",
        "reason": "Reason details"
      }
    ],
    "strongSkills": [],
    "learningRoadmap": [
      {
        "week": 1,
        "title": "Week focus title",
        "topics": [],
        "practiceTasks": [],
        "estimatedHours": number,
        "resources": []
      }
    ],
    "projectRecommendations": [],
    "certificationRecommendations": [],
    "careerAdvice": "Detailed career advice"
  }`;

  trackRequest('Roadmap');
  const rawResult = await callGenAiSdk(apiKey, prompt, true);
  return cleanAndParseJson(rawResult);
}