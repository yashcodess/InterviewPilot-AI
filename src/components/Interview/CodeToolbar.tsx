import React, { memo } from 'react';
import { RotateCcw, Copy, Download, Maximize, Minimize, AlignLeft, Type, Palette } from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';

interface CodeToolbarProps {
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  editorTheme: string;
  onThemeChange: (theme: string) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  wordWrap: 'on' | 'off';
  onWordWrapToggle: () => void;
  onReset: () => void;
  onCopy: () => void;
  onDownload: () => void;
  isFullscreen: boolean;
  onFullscreenToggle: () => void;
}

export const CodeToolbar = memo(function CodeToolbar({
  selectedLanguage,
  onLanguageChange,
  editorTheme,
  onThemeChange,
  fontSize,
  onFontSizeChange,
  wordWrap,
  onWordWrapToggle,
  onReset,
  onCopy,
  onDownload,
  isFullscreen,
  onFullscreenToggle
}: CodeToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-card border-b border-border/60 px-4 py-2.5 rounded-t-xl select-none no-print">
      {/* Left items: Language, Font, Wrap, Theme */}
      <div className="flex flex-wrap items-center gap-4">
        <LanguageSelector selectedLanguage={selectedLanguage} onLanguageChange={onLanguageChange} />

        <div className="h-4 w-px bg-border/40 hidden md:block" />

        {/* Font size */}
        <div className="flex items-center gap-1.5 text-text-secondary">
          <Type className="w-3.5 h-3.5" />
          <select
            value={fontSize}
            onChange={(e) => onFontSizeChange(Number(e.target.value))}
            className="text-xs bg-slate-900 border border-border/80 rounded px-1.5 py-1 text-text focus:outline-none cursor-pointer"
          >
            {[12, 14, 16, 18].map((size) => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </select>
        </div>

        {/* Word Wrap */}
        <button
          onClick={onWordWrapToggle}
          className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-colors cursor-pointer ${
            wordWrap === 'on' ? 'bg-primary/10 text-primary border border-primary/25' : 'text-text-secondary border border-border/60 hover:text-text'
          }`}
          title="Toggle Word Wrap"
        >
          <AlignLeft className="w-3.5 h-3.5" />
          <span>Wrap</span>
        </button>

        {/* Theme select */}
        <div className="flex items-center gap-1.5 text-text-secondary">
          <Palette className="w-3.5 h-3.5" />
          <select
            value={editorTheme}
            onChange={(e) => onThemeChange(e.target.value)}
            className="text-xs bg-slate-900 border border-border/80 rounded px-1.5 py-1 text-text focus:outline-none cursor-pointer"
          >
            <option value="vs-dark">VS Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
      </div>

      {/* Right actions: Reset, Copy, Download, Fullscreen */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onReset}
          className="p-1.5 rounded hover:bg-slate-800 text-text-secondary hover:text-text transition-all cursor-pointer"
          title="Reset Starter Code"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onCopy}
          className="p-1.5 rounded hover:bg-slate-800 text-text-secondary hover:text-text transition-all cursor-pointer"
          title="Copy Code to Clipboard"
        >
          <Copy className="w-4 h-4" />
        </button>

        <button
          onClick={onDownload}
          className="p-1.5 rounded hover:bg-slate-800 text-text-secondary hover:text-text transition-all cursor-pointer"
          title="Download Code File"
        >
          <Download className="w-4 h-4" />
        </button>

        <button
          onClick={onFullscreenToggle}
          className="p-1.5 rounded hover:bg-slate-800 text-text-secondary hover:text-text transition-all cursor-pointer"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
});
