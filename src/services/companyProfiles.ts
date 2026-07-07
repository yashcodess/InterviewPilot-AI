import type { CompanyInterviewProfile } from '../types/interview';

export const COMPANY_PROFILES: Record<string, CompanyInterviewProfile> = {
  Generic: {
    company: 'Generic',
    preferredTopics: ['Arrays', 'Strings', 'Sorting', 'Searching', 'Basic DSA'],
    difficultyBias: 'Balanced',
    preferredQuestionTypes: ['standard coding challenges', 'conceptual implementation'],
    instructionSummary: 'Evaluate based on general logic, basic data structures, clean style, and fundamental algorithmic concepts.'
  },
  Google: {
    company: 'Google',
    preferredTopics: ['Trees', 'Graphs', 'Dynamic Programming', 'Recursion', 'Time/Space Complexity', 'Advanced Structures'],
    difficultyBias: 'Hard',
    preferredQuestionTypes: ['highly algorithmic coding rounds', 'optimality puzzles', 'edge case heavy challenges'],
    instructionSummary: 'Evaluate with extreme focus on optimal Big-O complexity, structural design, deep recursion, and boundary edge cases.'
  },
  Amazon: {
    company: 'Amazon',
    preferredTopics: ['Hash Maps', 'Strings', 'Object Oriented Programming', 'Heaps', 'Practical DSA', 'Design Patterns'],
    difficultyBias: 'Balanced',
    preferredQuestionTypes: ['practical coding questions', 'customer-centric scenarios', 'clean and reusable class designs'],
    instructionSummary: 'Focus on code modularity, readability, usage of standard library maps/heaps, clean formatting, and naming conventions.'
  },
  Microsoft: {
    company: 'Microsoft',
    preferredTopics: ['OOP principles', 'Arrays', 'Linked Lists', 'Debugging scenarios', 'System Design fundamentals'],
    difficultyBias: 'Balanced',
    preferredQuestionTypes: ['practical system debugging stubs', 'data manipulation', 'safe type memory checks'],
    instructionSummary: 'Focus on robust error checking, type safety, modular logic, and object-oriented structure.'
  },
  Meta: {
    company: 'Meta',
    preferredTopics: ['Two Pointers', 'Sliding Window', 'Hash Maps', 'Binary Trees', 'Time/Space Optimization'],
    difficultyBias: 'Hard',
    preferredQuestionTypes: ['fast-paced optimal coding tasks', 'scalable structural puzzles', 'clean linear approaches'],
    instructionSummary: 'Focus on writing bugs-free code quickly, optimal memory optimizations, and clean logic flows.'
  },
  TCS: {
    company: 'TCS',
    preferredTopics: ['Variables & Loops', 'Basic Arrays', 'String Manipulation', 'Basic Functions', 'Math logic'],
    difficultyBias: 'Easy',
    preferredQuestionTypes: ['logical arithmetic stubs', 'conditional loops challenges', 'simple math problems'],
    instructionSummary: 'Focus on correct program logic, proper syntax, loops traversal, and clean functional inputs.'
  },
  Infosys: {
    company: 'Infosys',
    preferredTopics: ['Pattern Problems', 'Basic Algorithms', 'Arrays Traversal', 'Function implementations'],
    difficultyBias: 'Easy',
    preferredQuestionTypes: ['visual patterns creation', 'searching items', 'logic transformation stubs'],
    instructionSummary: 'Focus on structured functional code, proper looping logic, index safety, and correct outputs.'
  },
  Accenture: {
    company: 'Accenture',
    preferredTopics: ['Basic Arrays', 'Simple SQL logic', 'Pseudocode logic', 'Logical puzzles'],
    difficultyBias: 'Easy',
    preferredQuestionTypes: ['pseudocode conversion to code', 'simple array sorting', 'basic logical reasoning coding stubs'],
    instructionSummary: 'Focus on simple coding implementations, correct output formatting, clear naming, and syntax correctness.'
  }
};

export function getCompanyProfile(company: string): CompanyInterviewProfile {
  return COMPANY_PROFILES[company] || COMPANY_PROFILES.Generic;
}
