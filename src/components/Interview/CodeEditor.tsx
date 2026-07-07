import React, { memo } from 'react';
import Editor from '@monaco-editor/react';
import { Loader2 } from 'lucide-react';

interface CodeEditorProps {
  value: string;
  onChange: (val: string | undefined) => void;
  language: string;
  theme: string;
  fontSize: number;
  wordWrap: 'on' | 'off';
}

export const CodeEditor = memo(function CodeEditor({
  value,
  onChange,
  language,
  theme,
  fontSize,
  wordWrap
}: CodeEditorProps) {
  
  const getMonacoLang = (lang: string) => {
    const l = lang.toLowerCase();
    if (l === 'c++') return 'cpp';
    return l;
  };

  return (
    <div className="w-full h-[300px] relative border-x border-border/85 bg-slate-950/40">
      <Editor
        height="100%"
        language={getMonacoLang(language)}
        theme={theme}
        value={value}
        onChange={onChange}
        loading={
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/20 text-xs text-text-secondary select-none">
            <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
            Loading Code Environment...
          </div>
        }
        options={{
          fontSize,
          wordWrap,
          minimap: { enabled: false },
          automaticLayout: true,
          fontFamily: 'Consolas, Monaco, "Courier New", monospace',
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible'
          },
          lineNumbers: 'on',
          roundedSelection: true,
          scrollBeyondLastLine: false,
          readOnly: false
        }}
      />
    </div>
  );
});
