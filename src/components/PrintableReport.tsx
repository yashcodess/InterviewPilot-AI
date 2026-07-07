import React from 'react';

interface PrintableReportProps {
  activeRecord: { interview: any; evaluation: any } | null;
}

export function PrintableReport({ activeRecord }: PrintableReportProps) {
  if (!activeRecord) return null;

  const { interview, evaluation } = activeRecord;

  return (
    <div className="hidden print:block p-8 bg-white text-black font-sans leading-relaxed max-w-4xl mx-auto">
      {/* Document Header */}
      <div className="border-b-2 border-slate-350 pb-6 mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display">
            InterviewPilot AI
          </h1>
          <p className="text-sm text-text-secondary font-medium mt-1">
            AI-Powered Mock Interview Platform • Feedback Report
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-text-secondary font-bold block uppercase tracking-wide">Overall Score</span>
          <span className="text-4xl font-extrabold text-blue-600">
            {evaluation.overallScore}
            <span className="text-sm text-text-secondary font-semibold ml-0.5">/100</span>
          </span>
        </div>
      </div>

      {/* Setup Information */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg mb-8 text-xs font-semibold text-slate-700">
        <div>
          <span className="text-text-secondary block font-normal">Job Target</span>
          <span>{interview.setup.role}</span>
        </div>
        <div>
          <span className="text-text-secondary block font-normal">Topic Category</span>
          <span>{interview.setup.category}</span>
        </div>
        <div>
          <span className="text-text-secondary block font-normal">Difficulty</span>
          <span>{interview.setup.difficulty}</span>
        </div>
        <div>
          <span className="text-text-secondary block font-normal">Interview Date</span>
          <span>{new Date(interview.timestamp).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Section 1: Scores breakdown */}
      <div className="mb-8">
        <h3 className="text-lg font-bold border-b border-slate-250 pb-2 mb-4 text-slate-900 uppercase tracking-wide">
          1. Evaluation Breakdown
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(evaluation.scores).map(([key, val]: any) => {
            // Capitalize key
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase());
            return (
              <div key={key} className="flex justify-between items-center py-2 border-b border-slate-100 text-sm">
                <span className="text-slate-650 font-medium">{label}</span>
                <span className="font-mono font-bold text-slate-800">{val}/100</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resume Coverage Report */}
      {evaluation.resumeCoverage !== undefined && (
        <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Resume & Skills Coverage Report
            </h4>
            <span className="font-bold text-blue-605 bg-blue-50 px-2 py-1 rounded">
              {evaluation.resumeCoverage}% Match
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-text-secondary block font-normal">Skills Covered</span>
              <span className="text-slate-700 font-medium block leading-relaxed">
                {evaluation.skillsCovered?.join(', ') || 'None detected'}
              </span>
            </div>
            <div>
              <span className="text-text-secondary block font-normal">Missing Topics</span>
              <span className="text-slate-700 font-medium block leading-relaxed">
                {evaluation.skillsMissing?.join(', ') || 'None detected'}
              </span>
            </div>
            <div>
              <span className="text-text-secondary block font-normal">Projects Discussed</span>
              <span className="text-slate-700 font-medium block leading-relaxed">
                {evaluation.projectsDiscussed?.join(', ') || 'None discussed'}
              </span>
            </div>
            <div>
              <span className="text-text-secondary block font-normal">Technologies Asked</span>
              <span className="text-slate-700 font-medium block leading-relaxed">
                {evaluation.technologiesAsked?.join(', ') || 'None detected'}
              </span>
            </div>
          </div>
          {evaluation.weakSkillsDetected && evaluation.weakSkillsDetected.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <span className="text-text-secondary block font-normal">Weak Skills Detected</span>
              <span className="text-red-600 font-semibold block leading-relaxed">
                {evaluation.weakSkillsDetected.join(', ')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Section 2: Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <h3 className="text-base font-bold border-b border-slate-200 pb-2 mb-3 text-slate-900 uppercase tracking-wide">
            Strengths
          </h3>
          <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5">
            {evaluation.strengths.map((str: string, idx: number) => (
              <li key={idx}>
                <span className="font-semibold text-slate-800">{str.split(':')[0]}</span>
                <span>{str.split(':')[1] || ''}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-base font-bold border-b border-slate-200 pb-2 mb-3 text-slate-900 uppercase tracking-wide">
            Areas of Improvement
          </h3>
          <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5">
            {evaluation.weaknesses.map((weak: string, idx: number) => (
              <li key={idx}>
                <span className="font-semibold text-slate-800">{weak.split(':')[0]}</span>
                <span>{weak.split(':')[1] || ''}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Section 3: Recommendations */}
      <div className="mb-8">
        <h3 className="text-lg font-bold border-b border-slate-250 pb-2 mb-4 text-slate-900 uppercase tracking-wide">
          2. Actionable Recommendations
        </h3>
        <ul className="space-y-3 text-sm text-slate-700">
          {evaluation.improvementTips.map((tip: string, idx: number) => (
            <li key={idx} className="flex gap-2">
              <span className="font-bold text-blue-650 shrink-0">{idx + 1}.</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Section 4: Transcript */}
      <div className="page-break-before">
        <h3 className="text-lg font-bold border-b border-slate-250 pb-2 mb-4 text-slate-900 uppercase tracking-wide">
          3. Interview Transcript
        </h3>
        <div className="space-y-6">
          {interview.transcript.map((item: any, idx: number) => (
            <div key={idx} className="border-b border-slate-100 pb-4 mb-4 text-sm">
              <p className="font-bold text-slate-850 mb-1">
                Q{idx + 1}: {typeof item.question === 'object' && item.question !== null ? `${item.question.title || 'Coding Challenge'} - ${item.question.description || ''}` : (item.question || '')}
              </p>
              <p className="text-slate-650 italic pl-4 border-l-2 border-slate-200 mb-3 bg-slate-50 p-2 rounded">
                Your Answer: {item.answer || '(No answer provided)'}
              </p>
              {item.followUp && (
                <div className="pl-6 border-l-2 border-blue-200 mt-2 bg-blue-50/20 p-2 rounded">
                  <p className="font-bold text-blue-800 mb-1">
                    Follow-up Q: {item.followUp.question}
                  </p>
                  <p className="text-slate-650 italic pl-4 border-l-2 border-slate-250">
                    Follow-up Answer: {item.followUp.answer || '(No answer provided)'}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Document Footer */}
      <div className="border-t border-slate-250 pt-4 mt-12 text-center text-xs text-text-secondary">
        Generated by InterviewPilot AI (AI-Powered Mock Interview Platform). Practiced on {new Date(interview.timestamp).toLocaleDateString()}.
      </div>
    </div>
  );
}