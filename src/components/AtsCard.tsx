import React from 'react';
import { ExternalLink, FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { ATS_RESUME_SCANNER_URL, IS_ATS_EXTERNAL } from '../config';
import { Link } from 'react-router-dom';

export function AtsCard() {
  const cardContent = (
    <Card className="h-full hover:border-primary/45 hover:shadow-lg transition-all duration-300 cursor-pointer group bg-card/45 backdrop-blur-md relative overflow-hidden">
      {/* Premium gradient glow on hover */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-bl-full pointer-events-none" />
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform duration-300">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="secondary" className="text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border-emerald-500/20 uppercase tracking-wide px-2 py-0.5 select-none">
              External Tool
            </Badge>
            <ExternalLink className="w-3.5 h-3.5 text-text-secondary group-hover:text-primary transition-colors" />
          </div>
        </div>
        <CardTitle className="text-base font-bold text-text-bright mt-4 flex items-center gap-1.5 group-hover:text-primary transition-colors">
          📄 ATS Resume Scanner
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <CardDescription className="text-xs text-text-secondary leading-relaxed group-hover:text-slate-200 transition-colors">
          Analyze your resume for ATS compatibility, keyword optimization, formatting, and job readiness.
        </CardDescription>
        <div className="text-[10px] text-primary font-bold uppercase tracking-wider mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-1 select-none">
          Open ATS Resume Scanner &rarr;
        </div>
      </CardContent>
    </Card>
  );

  if (IS_ATS_EXTERNAL) {
    return (
      <a
        href={ATS_RESUME_SCANNER_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="block no-underline h-full"
        title="Open ATS Resume Scanner"
      >
        {cardContent}
      </a>
    );
  }

  return (
    <Link to="/ats" className="block no-underline h-full" title="Open ATS Resume Scanner">
      {cardContent}
    </Link>
  );
}
