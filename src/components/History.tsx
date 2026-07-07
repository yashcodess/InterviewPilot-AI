import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History as HistoryIcon,
  Clock,
  ChevronRight,
  Award,
  Calendar,
  FolderOpen,
  AlertCircle,
  Search,
  Trash2,
  Download,
  Eye,
  Filter
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { downloadTxtFile, generateReportTxt } from '../utils/export';

interface HistoryProps {
  history: Array<{ interview: any; evaluation: any }>;
  onSelectRecord: (record: { interview: any; evaluation: any }) => void;
  onDeleteRecord?: (id: string) => void;
}

export function History({ history, onSelectRecord, onDeleteRecord }: HistoryProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');

  const handleSelect = (record: { interview: any; evaluation: any }) => {
    onSelectRecord(record);
    navigate('/dashboard');
  };

  const handleDownload = (e: React.MouseEvent, record: { interview: any; evaluation: any }) => {
    e.stopPropagation();
    const { interview, evaluation } = record;
    const txtContent = generateReportTxt(interview, evaluation);
    const filename = `InterviewPilot_Report_${interview.setup.role.replace(/\s+/g, '_')}_${new Date(interview.timestamp).toISOString().split('T')[0]}.txt`;
    downloadTxtFile(filename, txtContent);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (onDeleteRecord && confirm('Are you sure you want to delete this interview record?')) {
      onDeleteRecord(id);
    }
  };

  // Filter history records
  const filteredHistory = history.filter((record) => {
    const { interview } = record;
    const matchesSearch =
      interview.setup.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      interview.setup.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory =
      categoryFilter === 'All' || interview.setup.category === categoryFilter;
      
    const matchesDifficulty =
      difficultyFilter === 'All' || interview.setup.difficulty === difficultyFilter;
      
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="max-w-4xl mx-auto py-8 px-4"
    >
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-text-bright flex items-center gap-2 select-none">
            <HistoryIcon className="w-8 h-8 text-primary" />
            Interview History
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Review past mock sessions, examine detailed performance scorecards, and retrieve study roadmaps.
          </p>
        </div>
      </div>

      {history.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center text-text-secondary">
              <FolderOpen className="w-6 h-6" />
            </div>
            <h4 className="font-semibold text-text">Your completed interviews will appear here.</h4>
            <p className="text-xs text-text-secondary mt-1 max-w-xs mx-auto leading-relaxed">
              Practice your first interview session to start building your analytics and performance history.
            </p>
            <Button onClick={() => navigate('/setup')} className="mt-2" size="sm">
              Take Mock Interview
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Search and Filters panel */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-card/25 border border-input-border/50 backdrop-blur-sm select-none">
            <div className="sm:col-span-2 relative">
              <Search className="w-4 h-4 text-text-secondary absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search job role or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-background border border-input-border/60 rounded-lg text-slate-250 focus:outline-none focus:border-primary focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-text-secondary"
              />
            </div>
            
            <div className="sm:col-span-1">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-background border border-input-border/60 rounded-lg text-slate-350 focus:outline-none focus:border-primary focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
              >
                <option value="All">All Categories</option>
                <option value="Technical">Technical</option>
                <option value="Behavioral">Behavioral</option>
                <option value="HR">HR</option>
                <option value="System Design">System Design</option>
                <option value="Aptitude">Aptitude</option>
              </select>
            </div>

            <div className="sm:col-span-1">
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-background border border-input-border/60 rounded-lg text-slate-350 focus:outline-none focus:border-primary focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
              >
                <option value="All">All Difficulties</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Records grid/list */}
          {filteredHistory.length === 0 ? (
            <div className="text-center py-10 text-text-secondary text-xs">
              No history records matched your filters.
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredHistory.map((record) => {
                  const { interview, evaluation } = record;
                  
                  // Format dates
                  const dateStr = new Date(interview.timestamp).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });
                  const timeStr = new Date(interview.timestamp).toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  // Simulated duration calculation
                  const durationMins = Math.round(interview.setup.length * 1.5);

                  return (
                    <motion.div
                      key={interview.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => handleSelect(record)}
                      className="group cursor-pointer block"
                    >
                      <Card className="hover:border-border hover:shadow-lg transition-all p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-text group-hover:text-primary transition-colors">
                              {interview.setup.role}
                            </h4>
                            <Badge variant="primary" className="text-[10px] py-0.5">{interview.setup.category}</Badge>
                            <Badge variant="secondary" className="text-[10px] py-0.5">{interview.setup.difficulty}</Badge>
                            {evaluation.resumeCoverage !== undefined && (
                              <Badge variant="secondary" className="text-[10px] py-0.5 bg-primary/10 text-primary border-primary/20 font-bold">
                                Resume-based
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-text-secondary font-medium">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-text-secondary" />
                              {dateStr} at {timeStr}
                            </span>
                            <span className="hidden sm:inline text-slate-700">•</span>
                            <span className="flex items-center gap-1">
                              <FolderOpen className="w-3.5 h-3.5 text-text-secondary" />
                              {interview.setup.length} Questions
                            </span>
                            <span className="hidden sm:inline text-slate-700">•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-text-secondary" />
                              {durationMins} min duration
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 pt-4 md:pt-0 border-t md:border-none border-slate-900/50">
                          {/* Score widget */}
                          <div className="text-left md:text-right">
                            <span className="text-[10px] text-text-secondary uppercase font-semibold block tracking-wider">Overall Score</span>
                            <span className="font-display font-extrabold text-2xl text-text-bright flex items-baseline gap-0.5 mt-0.5">
                              {evaluation.overallScore}
                              <span className="text-xs text-text-secondary font-semibold">/100</span>
                            </span>
                          </div>
                          
                          {/* Quick Actions overlay */}
                          <div className="flex items-center gap-2 select-none">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => handleDownload(e, record)}
                              title="Download Report"
                              className="p-2"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </Button>
                            {onDeleteRecord && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => handleDelete(e, interview.id)}
                                title="Delete Record"
                                className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 border-rose-950/40"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            <div className="w-8 h-8 rounded-lg bg-card border border-input-border flex items-center justify-center text-text-secondary group-hover:text-primary group-hover:bg-blue-950/20 group-hover:border-blue-900/30 transition-all">
                              <Eye className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}