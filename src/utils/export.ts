export function downloadTxtFile(filename: string, content: string) {
  const element = document.createElement('a');
  const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

export function generateReportTxt(interview: any, evaluation: any): string {
  let report = `====================================================\n`;
  report += `AI INTERVIEW COACH - REPORT CARD\n`;
  report += `====================================================\n\n`;
  report += `Date: ${new Date(interview.timestamp).toLocaleString()}\n`;
  report += `Job Role: ${interview.setup.role}\n`;
  report += `Category: ${interview.setup.category}\n`;
  report += `Difficulty: ${interview.setup.difficulty}\n`;
  report += `Total Questions: ${interview.setup.length}\n`;
  report += `Overall Score: ${evaluation.overallScore}/100\n\n`;

  report += `====================================================\n`;
  report += `SCORE BREAKDOWN\n`;
  report += `====================================================\n`;
  report += `Communication: ${evaluation.scores.communication}/100\n`;
  report += `Technical Accuracy: ${evaluation.scores.technicalAccuracy}/100\n`;
  report += `Confidence: ${evaluation.scores.confidence}/100\n`;
  report += `Problem Solving: ${evaluation.scores.problemSolving}/100\n`;
  report += `Completeness: ${evaluation.scores.completeness}/100\n\n`;

  report += `====================================================\n`;
  report += `KEY FEEDBACK\n`;
  report += `====================================================\n`;
  report += `Strengths:\n`;
  evaluation.strengths.forEach((s: string) => {
    report += `  - ${s}\n`;
  });
  report += `\nWeaknesses:\n`;
  evaluation.weaknesses.forEach((w: string) => {
    report += `  - ${w}\n`;
  });
  report += `\nImprovement Tips:\n`;
  evaluation.improvementTips.forEach((t: string) => {
    report += `  - ${t}\n`;
  });
  report += `\n`;

  if (evaluation.resumeCoverage !== undefined) {
    report += `====================================================\n`;
    report += `RESUME & SKILLS COVERAGE REPORT\n`;
    report += `====================================================\n`;
    report += `Resume Coverage: ${evaluation.resumeCoverage}%\n`;
    report += `Skills Covered: ${evaluation.skillsCovered?.join(', ') || 'None detected'}\n`;
    report += `Missing Topics: ${evaluation.skillsMissing?.join(', ') || 'None detected'}\n`;
    report += `Projects Discussed: ${evaluation.projectsDiscussed?.join(', ') || 'None discussed'}\n`;
    report += `Technologies Asked: ${evaluation.technologiesAsked?.join(', ') || 'None detected'}\n`;
    if (evaluation.weakSkillsDetected && evaluation.weakSkillsDetected.length > 0) {
      report += `Weak Skills Detected: ${evaluation.weakSkillsDetected.join(', ')}\n`;
    }
    report += `\n`;
  }

  report += `====================================================\n`;
  report += `INTERVIEW TRANSCRIPT\n`;
  report += `====================================================\n`;
  interview.transcript.forEach((qa: any, idx: number) => {
    const qText = typeof qa.question === 'object' ? `${qa.question.title} - ${qa.question.description}` : qa.question;
    report += `Q${idx + 1}: ${qText}\n`;
    report += `Your Answer: ${qa.answer || '(No answer provided)'}\n`;
    if (qa.followUp) {
      report += `Follow-up Q: ${qa.followUp.question}\n`;
      report += `Follow-up Answer: ${qa.followUp.answer || '(No answer provided)'}\n`;
    }
    report += `\n`;
  });

  return report;
}

export function triggerPrint() {
  window.print();
}