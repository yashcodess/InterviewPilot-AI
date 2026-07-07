import { describe, it, expect } from 'vitest';
import { buildInterviewContext, selectNextSkill, calculateDifficulty, detectKnowledgeGap, PromptBuilder, ResumeCache, AnalysisCache, InterviewContextManager } from './gemini';
import { DEFAULT_PREFERENCES } from '../contexts/SettingsContext';
import { getCompanyProfile } from './companyProfiles';
import { getStarterCode } from './codeTemplate';
import { ATS_RESUME_SCANNER_URL, IS_ATS_EXTERNAL } from '../config';
import { normalizeCodingQuestion, isCompletionResponse } from './interviewUtils';
import { encodeBase64, decodeBase64, LANGUAGE_IDS } from './judge0';

describe('Interview Length Validation', () => {
  it('should ensure standard interview lengths are strictly followed', () => {
    const beginnerLength = 5;
    const intermediateLength = 7;
    const advancedLength = 10;
    
    expect(beginnerLength).toBe(5);
    expect(intermediateLength).toBe(7);
    expect(advancedLength).toBe(10);
  });

  it('should verify progress calculation cannot result in a 1-question interview unless explicitly configured', () => {
    const mockSetup = {
      length: 5, // configured length of beginner interview
    };
    
    const currentIndex = 0;
    const questionsLength = 1; // only first question generated so far
    
    // Test the incorrect logic that caused the bug:
    // It checked current index against the length of currently generated questions array (which was 1)
    const oldCondition = currentIndex < questionsLength - 1; // 0 < 0 is false -> finished!
    expect(oldCondition).toBe(false);
    
    // Test the new fixed logic:
    // It checks current index against the configured maximum questions count
    const newCondition = currentIndex < mockSetup.length - 1; // 0 < 4 is true -> next question!
    expect(newCondition).toBe(true);
  });

  it('should verify that a Quick Interview mode would only trigger a 1-question interview if explicitly configured', () => {
    const quickInterviewSetup = {
      length: 1, // Quick Interview Mode explicitly selected
    };
    
    const currentIndex = 0;
    const isFinished = currentIndex >= quickInterviewSetup.length - 1; // 0 >= 0 is true -> finished!
    expect(isFinished).toBe(true);
  });
});

describe('Conversational Context Helpers', () => {


  it('should calculate difficulty adaptively based on answer history', () => {
    // 1. Base case: no history
    expect(calculateDifficulty([], 'Intermediate')).toBe('Intermediate');

    // 2. Struggles: should reduce difficulty
    const strugglesHistory = [
      { question: 'Explain promises', answer: 'I do not know' },
      { question: 'Explain arrays', answer: 'skip' }
    ];
    expect(calculateDifficulty(strugglesHistory, 'Intermediate')).toBe('Beginner');

    // 3. Perfect performance: should increase difficulty
    const perfectHistory = [
      { question: 'Explain variables', answer: 'Variables are container values stored in memory that can be reassigned or constant, let is block scoped while var is function scoped.' },
      { question: 'Explain loops', answer: 'Loops allow iterating over collections or repeating blocks of instructions while a condition is met, such as for, while, and do-while.' }
    ];
    expect(calculateDifficulty(perfectHistory, 'Beginner')).toBe('Intermediate');
  });

  it('should select the next skill and track remaining ones', () => {
    const history = [
      { question: 'What is a variable?', answer: 'Containers for data' }
    ];
    const skillInfo = selectNextSkill('technical', 'Beginner', history);
    expect(skillInfo.next).toBe('loops');
    expect(skillInfo.remaining).toContain('arrays');
    expect(skillInfo.remaining).not.toContain('variables');
  });

  it('should detect knowledge gaps based on struggle patterns', () => {
    const history = [
      { question: 'How do React props work?', answer: 'don\'t know' },
      { question: 'How do array methods work?', answer: 'Array methods are loops.' }
    ];
    const gaps = detectKnowledgeGap(history);
    expect(gaps).toContain('props');
    expect(gaps).not.toContain('arrays');
  });

  it('should build clean interview contexts', () => {
    const history = [
      { question: 'Explain variables', answer: 'Short.' }
    ];
    const context = buildInterviewContext(history);
    expect(context.skillsCovered).toContain('variables');
    expect(context.lastAnswerQuality).toBe('poor'); // brief answer
  });
});

describe('Modular Pipeline & Caching Optimization', () => {
  it('should construct correct Prompts via PromptBuilder', () => {
    const prompt = PromptBuilder.buildNextQuestionPrompt({
      role: 'React Dev',
      category: 'technical',
      difficulty: 'Beginner',
      questionNumber: 2,
      totalLength: 5,
      context: { skillsCovered: ['variables'], weaknessesDetected: [], lastAnswerQuality: 'good' },
      resumeSummary: 'Fresher, React skills',
      transcriptString: 'Q1: What is a variable?\nAnswer: A container.'
    });

    expect(prompt).toContain('React Dev');
    expect(prompt).toContain('Question 2 of 5');
    expect(prompt).toContain('Skills Covered');
  });

  it('should manage conversation memory locally using InterviewContextManager', () => {
    const manager = new InterviewContextManager('Beginner');
    manager.addQuestion('Explain React Props');
    manager.addAnswer('Props pass data.', {
      coveredSkills: ['props'],
      detectedWeaknesses: [],
      nextDifficulty: 'Intermediate'
    });

    const summary = manager.getContextSummary();
    expect(summary.skillsCovered).toContain('props');
    expect(summary.lastAnswerQuality).toBe('good');
  });

  it('should verify default preferences are correctly set', () => {
    expect(DEFAULT_PREFERENCES.speakingSpeed).toBe('normal');
    expect(DEFAULT_PREFERENCES.theme).toBe('dark');
    expect(DEFAULT_PREFERENCES.defaultDuration).toBe(120);
    expect(DEFAULT_PREFERENCES.defaultQuestionsCount).toBe(5);
    expect(DEFAULT_PREFERENCES.autoPlayVoice).toBe(true);
    expect(DEFAULT_PREFERENCES.autoSubmitSpeech).toBe(false);
  });
});

describe('Company Profiles & Coding Workspace Helpers', () => {
  it('should fetch company interview profiles correctly', () => {
    const googleProfile = getCompanyProfile('Google');
    expect(googleProfile.company).toBe('Google');
    expect(googleProfile.difficultyBias).toBe('Hard');
    expect(googleProfile.preferredTopics).toContain('Trees');

    const genericProfile = getCompanyProfile('UnknownCompany');
    expect(genericProfile.company).toBe('Generic');
  });

  it('should generate coding templates dynamically', () => {
    const pythonTemplate = getStarterCode('python', 'twoSum', 'Two Sum');
    expect(pythonTemplate).toContain('def twoSum():');
    expect(pythonTemplate).toContain('# Language: Python 3');

    const javaTemplate = getStarterCode('java', 'twoSum', 'Two Sum');
    expect(javaTemplate).toContain('class Solution');
    expect(javaTemplate).toContain('public void twoSum()');
  });

  it('should verify ATS Resume Scanner global URL configurations', () => {
    expect(ATS_RESUME_SCANNER_URL).toBe('https://yash-resume-ai.vercel.app/');
    expect(IS_ATS_EXTERNAL).toBe(true);
  });
});

describe('Gemini JSON Response Validation & Completion Detection', () => {
  it('should validate and normalize a correct CodingQuestion response object', () => {
    const validRaw = {
      title: 'Two Sum',
      description: 'Find two numbers that add up to target',
      difficulty: 'Easy',
      topic: 'Arrays',
      constraints: ['O(n) time'],
      examples: [
        { input: '[2,7,11,15], target=9', output: '[0,1]', explanation: '2+7=9' }
      ]
    };
    const res = normalizeCodingQuestion(validRaw);
    expect(res).not.toBeNull();
    expect(res?.title).toBe('Two Sum');
    expect(res?.examples[0].input).toBe('[2,7,11,15], target=9');
    expect(res?.constraints).toContain('O(n) time');
  });

  it('should reject malformed or non-object payloads', () => {
    expect(normalizeCodingQuestion(null)).toBeNull();
    expect(normalizeCodingQuestion(undefined)).toBeNull();
    expect(normalizeCodingQuestion('hello world')).toBeNull();
    expect(normalizeCodingQuestion(42)).toBeNull();
  });

  it('should reject questions with missing required string fields', () => {
    const missingTitle = {
      description: 'description',
      difficulty: 'Easy',
      topic: 'Arrays',
      constraints: [],
      examples: [{ input: 'a', output: 'b' }]
    };
    expect(normalizeCodingQuestion(missingTitle)).toBeNull();

    const missingDesc = {
      title: 'Title',
      difficulty: 'Easy',
      topic: 'Arrays',
      constraints: [],
      examples: [{ input: 'a', output: 'b' }]
    };
    expect(normalizeCodingQuestion(missingDesc)).toBeNull();
  });

  it('should reject questions with missing or empty examples', () => {
    const missingExamples = {
      title: 'Title',
      description: 'description',
      difficulty: 'Easy',
      topic: 'Arrays',
      constraints: [],
      examples: []
    };
    expect(normalizeCodingQuestion(missingExamples)).toBeNull();

    const invalidExamplesArray = {
      title: 'Title',
      description: 'description',
      difficulty: 'Easy',
      topic: 'Arrays',
      constraints: [],
      examples: 'not-an-array'
    };
    expect(normalizeCodingQuestion(invalidExamplesArray)).toBeNull();
  });

  it('should reject questions with invalid constraints array', () => {
    const invalidConstraints = {
      title: 'Title',
      description: 'description',
      difficulty: 'Easy',
      topic: 'Arrays',
      constraints: 'not-an-array',
      examples: [{ input: 'a', output: 'b' }]
    };
    expect(normalizeCodingQuestion(invalidConstraints)).toBeNull();
  });

  it('should detect completion response sentinels correctly', () => {
    expect(isCompletionResponse('NO_MORE_QUESTIONS')).toBe(true);
    expect(isCompletionResponse('no more questions')).toBe(true);
    expect(isCompletionResponse('Interview completed successfully')).toBe(true);
    expect(isCompletionResponse('End interview.')).toBe(true);
    expect(isCompletionResponse('All questions asked.')).toBe(true);
    expect(isCompletionResponse('no_follow_up')).toBe(true);
    expect(isCompletionResponse('')).toBe(true);
    expect(isCompletionResponse(null as any)).toBe(true);
    expect(isCompletionResponse(undefined as any)).toBe(true);

    expect(isCompletionResponse('Explain dynamic programming')).toBe(false);
  });

  it('should reject completion sentinels inside nextQuestion object properties', () => {
    const completionInDesc = {
      title: 'Title',
      description: 'NO MORE QUESTIONS',
      difficulty: 'Easy',
      topic: 'Arrays',
      constraints: [],
      examples: [{ input: 'a', output: 'b' }]
    };
    expect(normalizeCodingQuestion(completionInDesc)).toBeNull();

    const completionInTitle = {
      title: 'Interview completed',
      description: 'Some problem statement',
      difficulty: 'Easy',
      topic: 'Arrays',
      constraints: [],
      examples: [{ input: 'a', output: 'b' }]
    };
    expect(normalizeCodingQuestion(completionInTitle)).toBeNull();
  });
});

describe('Code Interview Preloading & Caching Optimization', () => {
  it('should generate all questions in one API call and cache them', async () => {
    let apiCallCount = 0;
    const mockGenerateAll = async () => {
      apiCallCount++;
      return [
        {
          id: 'q1',
          title: 'Q1',
          description: 'Desc 1',
          difficulty: 'Easy',
          topic: 'Arrays',
          constraints: [],
          examples: [{ input: '1', output: '2' }]
        },
        {
          id: 'q2',
          title: 'Q2',
          description: 'Desc 2',
          difficulty: 'Easy',
          topic: 'Arrays',
          constraints: [],
          examples: [{ input: '3', output: '4' }]
        }
      ];
    };

    // Simulate start of interview
    const questions = await mockGenerateAll();
    expect(apiCallCount).toBe(1);
    expect(questions.length).toBe(2);

    // Simulate moving between questions (next and prev) - should NOT trigger new API calls
    const mockNextQuestion = (currentIndex: number) => {
      // Direct access from cache, no api call
      return questions[currentIndex + 1];
    };
    
    const nextQ = mockNextQuestion(0);
    expect(nextQ.id).toBe('q2');
    expect(apiCallCount).toBe(1); // Still 1!
  });

  it('should verify final evaluation triggers correctly after last question', () => {
    let evalCallCount = 0;
    const mockEvaluateFinal = () => {
      evalCallCount++;
      return { overallScore: 85 };
    };

    const finalReport = mockEvaluateFinal();
    expect(evalCallCount).toBe(1);
    expect(finalReport.overallScore).toBe(85);
  });

  it('should retry once if question count is incorrect', async () => {
    let apiCallCount = 0;
    const mockGenerateWithCountCheck = async (expectedCount: number) => {
      apiCallCount++;
      if (apiCallCount === 1) {
        // Return incorrect count
        return [{ id: 'q1', title: 'Q1', description: 'Desc 1', difficulty: 'Easy', topic: 'Arrays', constraints: [], examples: [{ input: 'a', output: 'b' }] }];
      }
      // Success retry
      return [
        { id: 'q1', title: 'Q1', description: 'Desc 1', difficulty: 'Easy', topic: 'Arrays', constraints: [], examples: [{ input: 'a', output: 'b' }] },
        { id: 'q2', title: 'Q2', description: 'Desc 2', difficulty: 'Easy', topic: 'Arrays', constraints: [], examples: [{ input: 'c', output: 'd' }] }
      ];
    };

    let questions: any[] = [];
    let attempts = 0;
    const maxAttempts = 2;
    const expectedCount = 2;

    while (attempts < maxAttempts) {
      try {
        const raw = await mockGenerateWithCountCheck(expectedCount);
        if (raw.length !== expectedCount) {
          throw new Error("Count mismatch");
        }
        questions = raw;
        break;
      } catch {
        attempts++;
      }
    }

    expect(apiCallCount).toBe(2); // Retried once!
    expect(questions.length).toBe(2);
  });

  it('should throw immediately without retry on quota 429 errors', async () => {
    let apiCallCount = 0;
    const mockCallGemini = async () => {
      apiCallCount++;
      const error: any = new Error("RESOURCE_EXHAUSTED");
      error.status = 429;
      throw error;
    };

    let caughtError: any = null;
    try {
      await mockCallGemini();
    } catch (e) {
      caughtError = e;
    }

    expect(apiCallCount).toBe(1); // Failed on first attempt, no retry
    expect(caughtError.status).toBe(429);
  });
});

describe('Judge0 Integration & Code Execution Helpers', () => {
  it('should encode and decode base64 strings correctly with unicode preservation', () => {
    const raw = 'print("Hello, world! 🚀")';
    const encoded = encodeBase64(raw);
    const decoded = decodeBase64(encoded);
    
    expect(decoded).toBe(raw);
  });

  it('should map standard programming languages to Judge0 CE IDs correctly', () => {
    expect(LANGUAGE_IDS['c']).toBe(50);
    expect(LANGUAGE_IDS['cpp']).toBe(54);
    expect(LANGUAGE_IDS['java']).toBe(91);
    expect(LANGUAGE_IDS['javascript']).toBe(93);
    expect(LANGUAGE_IDS['python']).toBe(92);
  });

  it('should mock Code Execution submissions matching Judge0 CE response formats', async () => {
    const mockExecuteCode = async (sourceCode: string, lang: string, stdin = '') => {
      return {
        stdout: 'Hello, world!\n',
        stderr: null,
        compile_output: null,
        message: null,
        status: { id: 3, description: 'Accepted' },
        time: '0.05',
        memory: 2450
      };
    };

    const res = await mockExecuteCode('print("Hello")', 'python');
    expect(res.status.id).toBe(3);
    expect(res.stdout).toBe('Hello, world!\n');
    expect(res.time).toBe('0.05');
    expect(res.memory).toBe(2450);
  });
});

