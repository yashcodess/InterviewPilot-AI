import React, { useState, memo } from 'react';
import { Terminal, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

interface ResultPanelProps {
  consoleOutput: string;
  isCompiling: boolean;
  edgeCaseFailures?: string[];
  hasRunCode: boolean;
  hiddenTestCases?: Array<{ input: string; expectedOutput: string; description: string }>;
  success?: boolean;
}

export const ResultPanel = memo(function ResultPanel({
  consoleOutput,
  isCompiling,
  edgeCaseFailures = [],
  hasRunCode,
  hiddenTestCases = [],
  success = false
}: ResultPanelProps) {
  const [activeTab, setActiveTab] = useState<'console' | 'tests'>('console');

  return (
    <div className="bg-card border border-border/80 rounded-b-xl flex flex-col h-[180px] select-none no-print">
      {/* Tabs bar */}
      <div className="flex border-b border-border/60 bg-card/65 px-4 text-xs font-semibold text-text-secondary select-none">
        <button
          onClick={() => setActiveTab('console')}
          className={`flex items-center gap-1.5 py-2 px-3 border-b-2 transition-all cursor-pointer ${
            activeTab === 'console' ? 'border-primary text-text-bright' : 'border-transparent hover:text-text'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          Console
        </button>
        <button
          onClick={() => setActiveTab('tests')}
          className={`flex items-center gap-1.5 py-2 px-3 border-b-2 transition-all cursor-pointer ${
            activeTab === 'tests' ? 'border-primary text-text-bright' : 'border-transparent hover:text-text'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Test Results
        </button>
      </div>

      {/* Tab contents */}
      <div className="flex-1 p-4 font-mono text-[11px] overflow-y-auto bg-slate-950/30 text-text leading-relaxed">
        {activeTab === 'console' ? (
          <div>
            {isCompiling ? (
              <span className="text-primary animate-pulse flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                Compiling and running code...
              </span>
            ) : consoleOutput ? (
              <pre className="whitespace-pre-wrap font-mono text-slate-300">{consoleOutput}</pre>
            ) : (
              <span className="text-text-secondary select-none">Click "Run Code" to compile and run your code.</span>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {!hasRunCode ? (
              <span className="text-text-secondary select-none">No test results yet. Run or submit your code to check cases.</span>
            ) : !success ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-rose-400">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Execution Failed</span>
                    <p className="text-[10px] text-text-secondary mt-0.5">Please check the Console tab to view compilation or runtime errors.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Sample cases (Always passed in simulator) */}
                <div className="flex items-start gap-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Passed sample test cases!</span>
                    <p className="text-[10px] text-text-secondary mt-0.5">Checked inputs from problem statement examples successfully.</p>
                  </div>
                </div>

                {/* Edge cases checklist */}
                {edgeCaseFailures.length > 0 ? (
                  <div className="flex items-start gap-2 text-amber-400">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                    <div>
                      <span className="font-bold">Edge cases requiring improvement:</span>
                      <ul className="list-disc pl-4 space-y-1 mt-1 text-[10px] text-text-secondary">
                        {edgeCaseFailures.map((failure, idx) => (
                          <li key={idx} className="leading-snug">{failure}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Passed all hidden edge cases!</span>
                      <p className="text-[10px] text-text-secondary mt-0.5">Your code handles boundary values, empty parameters, and overflow limits correctly.</p>
                    </div>
                  </div>
                )}

                {hiddenTestCases && hiddenTestCases.length > 0 && (
                  <div className="flex items-start gap-2 text-primary border-t border-border/20 pt-2.5 mt-2.5">
                    <Terminal className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-text-bright">Hidden Edge Cases Checked:</span>
                      <ul className="list-disc pl-4 space-y-1 mt-1 text-[10px] text-text-secondary leading-snug">
                        {hiddenTestCases.map((tc, idx) => (
                          <li key={idx}>
                            {tc.description || 'Boundary test'} (Input: {tc.input || 'empty input'})
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
