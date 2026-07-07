export interface CodingQuestion {
  id: string;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  constraints: string[];
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  expectedSkills: string[];
  functionName?: string;
  estimatedTime: number; // in minutes
  topic: string;
  companyTags: string[];
  hiddenTestCases: Array<{
    input: string;
    expectedOutput: string;
    description: string;
  }>;
}

export interface CodingEvaluation {
  overallScore: number;
  correctness: number;
  algorithm: number;
  timeComplexity: string;
  spaceComplexity: string;
  readability: number;
  bestPractices: number;
  edgeCases: number;
  feedback: string;
  improvedSolution: string;
  testCasesPassedCount: number;
  testCasesTotalCount: number;
  edgeCaseFailures: string[];
}

export interface CompanyInterviewProfile {
  company: string;
  preferredTopics: string[];
  difficultyBias: 'Easy' | 'Balanced' | 'Hard';
  preferredQuestionTypes: string[];
  instructionSummary: string;
}

export type InterviewQuestion = string | CodingQuestion;

export interface InterviewAnswer {
  text: string;
  isCode: boolean;
  language?: string;
}

export interface ConversationMessage {
  role: 'user' | 'model' | 'system';
  content: string;
}

export interface InterviewResult {
  id: string;
  timestamp: string;
  setup: {
    role: string;
    category: string;
    difficulty: string;
    length: number;
    company?: string;
    resumeText?: string;
  };
  questions: InterviewQuestion[];
  answers: string[];
  timesTaken: number[];
  evaluations: any[]; 
  finalEvaluation: any; 
  resumeAnalysis?: any;
}
