import type { CodingQuestion } from '../types/interview';

export function normalizeCodingQuestion(raw: any, difficulty?: string, company?: string): CodingQuestion | null {
  if (!raw || typeof raw !== 'object') {
    if (import.meta.env.DEV) {
      console.warn('[Validation Result] Rejected: raw question is null, undefined, or not an object', raw);
    }
    return null;
  }

  // Detect completion inside the object properties
  const isCompletionText = (str: any): boolean => {
    if (typeof str !== 'string') return false;
    const clean = str.trim().toLowerCase();
    return (
      clean === 'no_more_questions' ||
      clean === 'no more questions' ||
      clean.includes('interview completed') ||
      clean.includes('end interview') ||
      clean.includes('all questions asked')
    );
  };

  if (
    isCompletionText(raw.title) ||
    isCompletionText(raw.description) ||
    isCompletionText(raw.nextQuestion)
  ) {
    if (import.meta.env.DEV) {
      console.log('[Validation Result] Detected completion sentinel in response properties:', raw);
    }
    return null;
  }

  // Required fields check
  const requiredFields = ['title', 'description', 'difficulty', 'topic'];
  for (const field of requiredFields) {
    if (!raw[field] || typeof raw[field] !== 'string' || raw[field].trim() === '') {
      if (import.meta.env.DEV) {
        console.warn(`[Validation Result] Rejected: missing or invalid required string field "${field}"`, raw);
      }
      return null;
    }
  }

  // Required arrays check
  if (!Array.isArray(raw.examples) || raw.examples.length === 0) {
    if (import.meta.env.DEV) {
      console.warn('[Validation Result] Rejected: examples is missing or not a non-empty array', raw.examples);
    }
    return null;
  }

  if (!Array.isArray(raw.constraints)) {
    if (import.meta.env.DEV) {
      console.warn('[Validation Result] Rejected: constraints is missing or not an array', raw.constraints);
    }
    return null;
  }

  // Safe checks for each example object
  const validExamples = raw.examples.every((ex: any) => {
    return ex && typeof ex === 'object' && typeof ex.input === 'string' && typeof ex.output === 'string';
  });

  if (!validExamples) {
    if (import.meta.env.DEV) {
      console.warn('[Validation Result] Rejected: some example objects are missing input or output', raw.examples);
    }
    return null;
  }

  // Create validated, filled object
  const normalized: CodingQuestion = {
    id: raw.id || `challenge-${Date.now()}`,
    title: raw.title.trim(),
    difficulty: raw.difficulty,
    description: raw.description.trim(),
    constraints: raw.constraints.map((c: any) => String(c).trim()),
    examples: raw.examples.map((ex: any) => ({
      input: String(ex.input).trim(),
      output: String(ex.output).trim(),
      explanation: ex.explanation ? String(ex.explanation).trim() : undefined
    })),
    expectedSkills: Array.isArray(raw.expectedSkills) ? raw.expectedSkills.map((s: any) => String(s).trim()) : [],
    functionName: raw.functionName ? String(raw.functionName).trim() : 'solve',
    estimatedTime: typeof raw.estimatedTime === 'number' ? raw.estimatedTime : 30,
    topic: raw.topic.trim(),
    companyTags: Array.isArray(raw.companyTags) ? raw.companyTags.map((t: any) => String(t).trim()) : [company || 'Generic'],
    hiddenTestCases: Array.isArray(raw.hiddenTestCases) 
      ? raw.hiddenTestCases.filter((tc: any) => tc && typeof tc === 'object' && tc.input && tc.expectedOutput).map((tc: any) => ({
          input: String(tc.input).trim(),
          expectedOutput: String(tc.expectedOutput).trim(),
          description: tc.description ? String(tc.description).trim() : 'Boundary case'
        }))
      : []
  };

  if (import.meta.env.DEV) {
    console.log('[Validation Result] Passed validation successfully:', normalized);
  }

  return normalized;
}

export function isCompletionResponse(raw: string): boolean {
  if (!raw) return true;
  const clean = raw.trim().toLowerCase();
  return (
    clean === 'no_more_questions' ||
    clean === 'no more questions' ||
    clean.includes('interview completed') ||
    clean.includes('end interview') ||
    clean.includes('all questions asked') ||
    clean === 'no_follow_up'
  );
}
