/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { 
  Plus, 
  Minus,
  Trash2, 
  RotateCcw, 
  Users, 
  Award,
  PlusCircle,
  Hash,
  Trophy,
  XCircle,
  Save,
  Undo2,
  Redo2,
  Menu,
  X,
  PlaneTakeoff,
  Sparkles,
  Moon,
  Sun,
  Layout,
  ExternalLink,
  Info,
  HelpCircle,
  ChevronRight,
  FileDown,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';

interface Team {
  id: string;
  name: string;
}

interface RoundScore {
  teamId: string;
  roundIndex: number;
  points: number;
}

const STORAGE_KEY = 'quizmaster-scoreboard-v2';

// Reusable Logo Component
const ScorePilotLogo = ({ isDarkMode, className = "", onClick }: { isDarkMode: boolean; className?: string; onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className={`flex items-center gap-3 group cursor-pointer ${className}`}
  >
    <div className="relative">
      {/* Main Container with Gradient Background */}
      <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center">
        <div className="relative">
          {/* Exact same plane taking off icon */}
          <PlaneTakeoff className="w-7 h-7 text-white" />
          
          {/* The Secondary Icon Container (Bottom Right) */}
          <div className="absolute -bottom-1 -right-1 bg-white rounded-md p-0.5 shadow-sm">
            {/* Swapped FileText for Hash (#) icon */}
            <Hash className="w-3 h-3 text-blue-600" />
          </div>
        </div>
      </div>
      
      {/* Decorative Sparkles */}
      <div className="absolute -top-1.5 -right-1.5">
        <Sparkles className="w-5 h-5 text-yellow-400 fill-yellow-400" />
      </div>
    </div>

    {/* App Title Text Styling */}
    <span className={`text-2xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
      Score<span className="text-blue-600">Pilot</span>
    </span>
  </div>
);

/// Reusable Memoized Score Cell for performance
const ScoreCell = memo(({ teamId, roundIndex, score, updateScore, isDarkMode }: { 
  teamId: string, 
  roundIndex: number, 
  score: number, 
  updateScore: (teamId: string, roundIndex: number, value: string) => void,
  isDarkMode: boolean
}) => {
  return (
    <div className={`flex items-center justify-center gap-0.5 sm:gap-1 rounded-lg sm:rounded-xl border p-0.5 sm:p-1 transition-all group/score-cell ${
      isDarkMode 
        ? 'bg-blue-900/10 border-blue-900/30 focus-within:border-blue-500/50' 
        : 'bg-slate-50 border-gray-100 focus-within:border-blue-200'
    }`}>
      <button 
        onClick={() => updateScore(teamId, roundIndex, (score - 1).toString())}
        className={`w-6 h-6 flex items-center justify-center rounded-lg transition-all md:opacity-0 group-hover/score-cell:opacity-100 group-focus-within/score-cell:opacity-100 ${
          isDarkMode ? 'hover:bg-red-900/30 text-red-400 active:bg-red-900/50' : 'hover:bg-red-50 text-red-500 active:bg-red-100'
        }`}
      >
        <Minus className="w-2.5 h-2.5" strokeWidth={4} />
      </button>
      <input
        type="number"
        inputMode="numeric"
        value={score || ''}
        onChange={(e) => updateScore(teamId, roundIndex, e.target.value)}
        placeholder="0"
        className={`w-8 sm:w-12 bg-transparent text-center font-mono text-base sm:text-xl font-black outline-none transition-colors appearance-none ${
          isDarkMode 
            ? 'text-white placeholder:text-blue-900/50 focus:text-blue-300' 
            : 'text-slate-900 placeholder:text-slate-200 focus:text-blue-600'
        }`}
      />
      <button 
        onClick={() => updateScore(teamId, roundIndex, (score + 1).toString())}
        className={`w-6 h-6 flex items-center justify-center rounded-lg transition-all md:opacity-0 group-hover/score-cell:opacity-100 group-focus-within/score-cell:opacity-100 ${
          isDarkMode ? 'hover:bg-green-900/30 text-green-400 active:bg-green-900/50' : 'hover:bg-green-50 text-green-500 active:bg-green-100'
        }`}
      >
        <Plus className="w-2.5 h-2.5" strokeWidth={4} />
      </button>
    </div>
  );
});

// Reusable Memoized Team Header for performance
const TeamHeader = memo(({ team, isActive, isEditing, tempName, setTempName, onUpdate, onCancel, onEdit, onDelete, onToggleActive, isDarkMode }: any) => {
  return (
    <th 
      className={`px-2 md:px-4 py-4 md:py-8 min-w-[70px] sm:min-w-[120px] md:min-w-[160px] transition-colors relative border-l first:border-l-0 cursor-pointer ${
        isDarkMode 
          ? `border-white/5 ${isActive ? 'bg-blue-900/40' : 'hover:bg-slate-800/40'}` 
          : `border-gray-200/60 ${isActive ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`
      }`}
      onClick={(e) => { 
        e.stopPropagation(); 
        if (!isEditing) {
          onToggleActive();
        }
      }}
    >
      <div className="flex flex-col items-center justify-center h-full gap-1 md:gap-2 transition-colors">
        {isEditing ? (
          <div className="flex items-center gap-1 w-full px-1" onClick={e => e.stopPropagation()}>
            <input
              type="text"
              value={tempName}
              onChange={e => setTempName(e.target.value)}
              autoFocus
              className="w-full bg-white dark:bg-blue-950/40 border border-blue-400 dark:border-blue-500 rounded-lg px-2 py-1 text-xs font-black uppercase text-center text-slate-900 dark:text-white transition-colors shadow-sm"
              onKeyDown={e => {
                if (e.key === 'Enter') onUpdate();
                if (e.key === 'Escape') onCancel();
              }}
            />
          </div>
        ) : (
          <span className={`text-[10px] sm:text-base md:text-xl font-black tracking-tight text-center uppercase break-words w-full leading-tight px-0.5 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400 ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
            {team.name}
          </span>
        )}

        {isActive && !isEditing && (
          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <button
              onClick={onEdit}
              className={`p-1 px-1.5 border rounded-md text-[7px] md:text-[8px] font-black uppercase tracking-widest shadow-sm transition-all ${
                isDarkMode 
                  ? 'bg-blue-600 text-white border-blue-400 hover:bg-blue-500' 
                  : 'bg-white text-blue-600 border-blue-100 hover:bg-blue-50'
              }`}
            >
              Edit
            </button>
            <button 
              type="button"
              onClick={onDelete}
              className={`p-1 border rounded-md shadow-sm transition-all ${
                isDarkMode 
                  ? 'bg-red-600 text-white border-red-400 hover:bg-red-500' 
                  : 'bg-white text-red-500 border-red-100 hover:bg-red-50'
              }`}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </th>
  );
});

export default function App() {
  const [quizTitle, setQuizTitle] = useState('DCSE, CDLU Sirsa');
  const [teams, setTeams] = useState<Team[]>([]);
  const [rounds, setRounds] = useState<number>(3);
  const [scores, setScores] = useState<RoundScore[]>([]);
  const [calculatedScores, setCalculatedScores] = useState<Record<string, number>>({});
  const [showFinalDashboard, setShowFinalDashboard] = useState(false);
  const [showWinnerPopup, setShowWinnerPopup] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [activeRoundIndex, setActiveRoundIndex] = useState<number | null>(null);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [tempTeamName, setTempTeamName] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // History management
  const pushToHistory = useCallback(() => {
    const currentState = {
      teams: [...teams],
      rounds,
      scores: [...scores],
      calculatedScores: { ...calculatedScores },
      quizTitle
    };
    setHistory(prev => [currentState, ...prev].slice(0, 20)); // Store up to 20 steps
    setRedoStack([]); // Clear redo stack on new action
  }, [teams, rounds, scores, calculatedScores, quizTitle]);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const [lastState, ...remainingHistory] = history;
    
    // Save current state to redo stack
    const currentState = {
      teams: [...teams],
      rounds,
      scores: [...scores],
      calculatedScores: { ...calculatedScores },
      quizTitle
    };
    setRedoStack(prev => [currentState, ...prev]);

    // Restore last state
    setTeams(lastState.teams);
    setRounds(lastState.rounds);
    setScores(lastState.scores);
    setCalculatedScores(lastState.calculatedScores);
    setQuizTitle(lastState.quizTitle);
    setHistory(remainingHistory);
  }, [history, teams, rounds, scores, calculatedScores, quizTitle]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const [nextState, ...remainingRedo] = redoStack;

    // Save current state to history
    const currentState = {
      teams: [...teams],
      rounds,
      scores: [...scores],
      calculatedScores: { ...calculatedScores },
      quizTitle
    };
    setHistory(prev => [currentState, ...prev]);

    // Restore next state
    setTeams(nextState.teams);
    setRounds(nextState.rounds);
    setScores(nextState.scores);
    setCalculatedScores(nextState.calculatedScores);
    setQuizTitle(nextState.quizTitle);
    setRedoStack(remainingRedo);
  }, [redoStack, teams, rounds, scores, calculatedScores, quizTitle]);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setQuizTitle(parsed.quizTitle || 'DCSE, CDLU Sirsa');
        setTeams(parsed.teams || []);
        setRounds(parsed.rounds || 3);
        setScores(parsed.scores || []);
        setCalculatedScores(parsed.calculatedScores || {});
      } catch (e) {
        console.error('Failed to load scoreboard data', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to local storage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        quizTitle,
        teams,
        rounds,
        scores,
        calculatedScores
      }));
    }
  }, [quizTitle, teams, rounds, scores, calculatedScores, isLoaded]);

  const addTeam = useCallback(() => {
    if (!newTeamName.trim()) return;
    pushToHistory();
    const newTeam: Team = {
      id: crypto.randomUUID(),
      name: newTeamName.trim(),
    };
    setTeams(prev => [...prev, newTeam]);
    setNewTeamName('');
  }, [newTeamName, pushToHistory]);

  const updateTeamName = useCallback((id: string, name: string) => {
    if (!name.trim()) return;
    pushToHistory();
    setTeams(prev => prev.map(t => t.id === id ? { ...t, name: name.trim() } : t));
    setEditingTeamId(null);
  }, [pushToHistory]);

  const removeTeam = useCallback((id: string) => {
    pushToHistory();
    setTeams(prevTeams => prevTeams.filter(t => t.id !== id));
    setScores(prevScores => prevScores.filter(s => s.teamId !== id));
    setCalculatedScores(prevCalculated => {
      const newCalculated = { ...prevCalculated };
      delete newCalculated[id];
      return newCalculated;
    });
  }, [pushToHistory]);

  const addRound = useCallback(() => {
    pushToHistory();
    setRounds(prev => prev + 1);
  }, [pushToHistory]);

  const removeRound = useCallback(() => {
    if (rounds > 1) {
      pushToHistory();
      setRounds(prev => prev - 1);
    }
  }, [pushToHistory, rounds]);

  const updateScore = useCallback((teamId: string, roundIndex: number, value: string) => {
    const points = parseInt(value) || 0;
    setScores(prev => {
      const existingIndex = prev.findIndex(s => s.teamId === teamId && s.roundIndex === roundIndex);
      if (existingIndex >= 0) {
        if (prev[existingIndex].points === points) return prev;
        const next = [...prev];
        next[existingIndex] = { ...next[existingIndex], points };
        return next;
      }
      return [...prev, { teamId, roundIndex, points }];
    });
  }, []);

  const getScore = useCallback((teamId: string, roundIndex: number) => {
    return scores.find(s => s.teamId === teamId && s.roundIndex === roundIndex)?.points || 0;
  }, [scores]);

  const calculateTeamTotal = useCallback((teamId: string) => {
    const total = scores
      .filter(s => s.teamId === teamId && s.roundIndex < rounds)
      .reduce((sum, s) => sum + s.points, 0);
    
    setCalculatedScores(prev => ({
      ...prev,
      [teamId]: total
    }));
  }, [scores, rounds]);

  const calculateAllScores = useCallback(() => {
    pushToHistory();
    const newCalculatedScores: Record<string, number> = {};
    teams.forEach(team => {
      const total = scores
        .filter(s => s.teamId === team.id && s.roundIndex < rounds)
        .reduce((sum, s) => sum + s.points, 0);
      newCalculatedScores[team.id] = total;
    });
    setCalculatedScores(newCalculatedScores);
  }, [teams, scores, rounds, pushToHistory]);

  const clearRoundScores = useCallback((roundIndex: number) => {
    pushToHistory();
    setScores(prev => prev.filter(s => s.roundIndex !== roundIndex));
    setCalculatedScores({});
  }, [pushToHistory]);

  const clearAllScores = useCallback(() => {
    pushToHistory();
    setScores([]);
    setCalculatedScores({});
    setShowFinalDashboard(false);
  }, [pushToHistory]);

  const revealWinner = useCallback(() => {
    if (Object.keys(calculatedScores).length === 0) {
      alert('Please calculate totals for teams first!');
      return;
    }
    setShowWinnerPopup(true);
    setTimeout(() => {
      setShowWinnerPopup(false);
      setShowFinalDashboard(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 3000);
  }, [calculatedScores]);


  const clearCalculatedScores = useCallback(() => {
    pushToHistory();
    setCalculatedScores({});
    setShowFinalDashboard(false);
  }, [pushToHistory]);

  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => (calculatedScores[b.id] || 0) - (calculatedScores[a.id] || 0));
  }, [teams, calculatedScores]);

  const clearAll = useCallback(() => {
    pushToHistory();
    setTeams([]);
    setScores([]);
    setCalculatedScores({});
    setShowFinalDashboard(false);
    setRounds(3);
  }, [pushToHistory]);

  const toggleTheme = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  const winner = sortedTeams[0];
  const allTeamsCalculated = teams.length > 0 && teams.every(t => calculatedScores[t.id] !== undefined);

  const exportToPDF = useCallback(() => {
    const isLandscape = teams.length > 5;
    const doc = new jsPDF({
      orientation: isLandscape ? 'l' : 'p',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let currentY = 15;

    // Helper for text truncation
    const truncateText = (text: string, maxWidth: number, fontSize: number) => {
      doc.setFontSize(fontSize);
      let str = text;
      if (doc.getTextWidth(str) <= maxWidth) return str;
      while (str.length > 0 && doc.getTextWidth(str + '...') > maxWidth) {
        str = str.slice(0, -1);
      }
      return str + '...';
    };

    // Helper to draw standard cell with border
    const drawTableCell = (
      text: string, 
      x: number, 
      y: number, 
      width: number, 
      height: number, 
      options: { 
        align?: 'left' | 'center' | 'right'; 
        isBold?: boolean; 
        fontSize?: number; 
        textColor?: number[]; 
        bgColor?: number[] | null; 
        borderWidth?: number;
        borderColor?: number[];
      } = {}
    ) => {
      const {
        align = 'center',
        isBold = false,
        fontSize = 9,
        textColor = [15, 23, 42],
        bgColor = null,
        borderWidth = 0.15,
        borderColor = [226, 232, 240] // slate-200
      } = options;

      // Fill background
      if (bgColor) {
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        doc.rect(x, y, width, height, 'F');
      }

      // Draw Borders
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.setLineWidth(borderWidth);
      doc.rect(x, y, width, height, 'D');

      // Set font & color
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setFontSize(fontSize);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);

      // Truncate text to avoid overlap
      const truncated = truncateText(text, width - 2, fontSize);

      // Calculate positioning
      let textX = x + 1;
      if (align === 'center') {
        textX = x + (width - doc.getTextWidth(truncated)) / 2;
      } else if (align === 'right') {
        textX = x + width - doc.getTextWidth(truncated) - 1;
      }

      const textY = y + (height / 2) + (fontSize * 0.35 / 2.83); // Center vertically approx
      doc.text(truncated, textX, textY);
    };

    const drawPageLink = (isFirstPage: boolean) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      if (isFirstPage) {
        doc.setTextColor(148, 163, 184); // slate-400 (light color for dark header banner)
      } else {
        doc.setTextColor(59, 130, 246); // blue-500
      }
      const linkText = 'ScorePilot';
      const linkWidth = doc.getTextWidth(linkText);
      const x = pageWidth - margin - linkWidth;
      const y = isFirstPage ? 12 : 10;
      doc.textWithLink(linkText, x, y, { url: 'https://sahilkhatkar11.github.io/scorepilot/' });

      // Optional underline to make it clear it's a link
      if (isFirstPage) {
        doc.setDrawColor(148, 163, 184);
      } else {
        doc.setDrawColor(59, 130, 246);
      }
      doc.setLineWidth(0.2);
      doc.line(x, y + 0.6, x + linkWidth, y + 0.6);
    };

    // Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 26, 'F');

    // App Header text (dynamic competition name)
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text((quizTitle || 'Untitled Scoreboard').toUpperCase(), margin, 12);

    drawPageLink(true);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184); // slate-400
    const dateStr = new Date().toLocaleString('en-US', { 
      dateStyle: 'medium', 
      timeStyle: 'short' 
    });
    doc.text(`Generated on: ${dateStr}`, margin, 17);
    doc.text('Professional scoring analytics sheet', margin, 21);

    // Dynamic color accent band
    doc.setFillColor(59, 130, 246); // blue-500
    doc.rect(0, 26, pageWidth, 1.5, 'F');

    currentY = 36;

    // Overview Statistics
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Total Competitors: ${teams.length}  |  Total Rounds Tracked: ${rounds}`, margin, currentY);
    currentY += 8;

    // Winner Box (if winner exists)
    if (winner) {
      const winnerScore = calculatedScores[winner.id] !== undefined ? calculatedScores[winner.id] : 0;
      
      doc.setFillColor(254, 243, 199); // amber-100
      doc.setDrawColor(251, 191, 36); // amber-400
      doc.rect(margin, currentY, pageWidth - 2 * margin, 20, 'FD');

      // Left bar highlight
      doc.setFillColor(245, 158, 11); // amber-500
      doc.rect(margin, currentY, 3.5, 20, 'F');

      // Text
      doc.setTextColor(146, 64, 14); // amber-800
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('CHAMPION PLATINUM LIGHTNING', margin + 7, currentY + 6);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(`${winner.name.toUpperCase()}`, margin + 7, currentY + 14);

      // Score on the right
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(217, 119, 6); // amber-600
      const scoreText = `${winnerScore} POINTS`;
      const scoreWidth = doc.getTextWidth(scoreText);
      doc.text(scoreText, pageWidth - margin - 8 - scoreWidth, currentY + 12);

      currentY += 28;
    }

    // detailed score sheet header
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('COMPLETE ROUND-BY-ROUND SCOREBOARD', margin, currentY);
    currentY += 5;

    // Columns calculations
    const printableWidth = pageWidth - 2 * margin;
    const col0Width = 22; // ROUND col width
    const teamColWidth = (printableWidth - col0Width) / teams.length;
    const rowHeight = 8.5;

    // Drawing Table Header helper
    const drawTableHeader = (y: number) => {
      const headerBg = [30, 41, 59]; // slate-800
      const headerTextColor = [255, 255, 255];

      drawTableCell('ROUND', margin, y, col0Width, rowHeight, {
        isBold: true,
        bgColor: headerBg,
        textColor: headerTextColor,
        fontSize: 8.5
      });

      teams.forEach((team, idx) => {
        const x = margin + col0Width + idx * teamColWidth;
        drawTableCell(team.name.toUpperCase(), x, y, teamColWidth, rowHeight, {
          isBold: true,
          bgColor: headerBg,
          textColor: headerTextColor,
          fontSize: 8.5
        });
      });
    };

    // Draw header initially
    drawTableHeader(currentY);
    currentY += rowHeight;

    // Draw row content
    for (let rIndex = 0; rIndex < rounds; rIndex++) {
      if (currentY + rowHeight > pageHeight - 18) {
        doc.addPage();
        drawPageLink(false);
        currentY = 15;
        drawTableHeader(currentY);
        currentY += rowHeight;
      }

      const isEven = rIndex % 2 === 0;
      const rowBg = isEven ? [248, 250, 252] : [255, 255, 255];

      // Round cell
      drawTableCell(`Round #${rIndex + 1}`, margin, currentY, col0Width, rowHeight, {
        isBold: true,
        bgColor: rowBg,
        textColor: [100, 116, 139],
        align: 'center'
      });

      // Team scores
      teams.forEach((team, idx) => {
        const x = margin + col0Width + idx * teamColWidth;
        const score = getScore(team.id, rIndex);
        drawTableCell(String(score), x, currentY, teamColWidth, rowHeight, {
          bgColor: rowBg,
          textColor: [30, 41, 59],
          align: 'center'
        });
      });

      currentY += rowHeight;
    }

    // Draw Total Row
    if (currentY + rowHeight > pageHeight - 18) {
      doc.addPage();
      drawPageLink(false);
      currentY = 15;
      drawTableHeader(currentY);
      currentY += rowHeight;
    }

    const totalBg = [241, 245, 249]; // slate-100
    drawTableCell('TOTALS', margin, currentY, col0Width, rowHeight, {
      isBold: true,
      bgColor: totalBg,
      textColor: [15, 23, 42],
      align: 'center',
      borderWidth: 0.45,
      borderColor: [100, 116, 139] // slate-500
    });

    teams.forEach((team, idx) => {
      const x = margin + col0Width + idx * teamColWidth;
      const total = calculatedScores[team.id] !== undefined ? calculatedScores[team.id] : 0;
      drawTableCell(String(total), x, currentY, teamColWidth, rowHeight, {
        isBold: true,
        bgColor: totalBg,
        textColor: [29, 78, 216], // blue-700
        align: 'center',
        borderWidth: 0.45,
        borderColor: [100, 116, 139] // slate-500
      });
    });

    currentY += rowHeight + 10;

    // Footer signature line
    if (currentY + 15 > pageHeight - 10) {
      doc.addPage();
      drawPageLink(false);
      currentY = 15;
    }

    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 5;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('Generated dynamically with ScorePilot. Tracking, scoring, and analytics for any game.', margin, currentY);
    
    doc.setFont('helvetica', 'normal');
    doc.text('Author: Sahil Khatkar', pageWidth - margin - doc.getTextWidth('Author: Sahil Khatkar'), currentY);

    const fileName = `${quizTitle ? quizTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'scorepilot'}_scoreboard.pdf`;
    doc.save(fileName);
  }, [teams, rounds, calculatedScores, quizTitle, winner, getScore]);

  const exportToCSV = useCallback(() => {
    const csvRows: string[][] = [];

    const title = quizTitle || 'Untitled Scoreboard';
    const dateStr = new Date().toLocaleString('en-US', { 
      dateStyle: 'medium', 
      timeStyle: 'short' 
    });

    csvRows.push(['SCOREMASTER REPORT', title]);
    csvRows.push(['Generated on', dateStr]);
    csvRows.push(['Total Competitors', String(teams.length)]);
    csvRows.push(['Total Rounds Tracked', String(rounds)]);
    csvRows.push([]); // blank separator

    // Table Header
    const headerRow = ['ROUND'];
    teams.forEach(team => {
      headerRow.push(team.name.toUpperCase());
    });
    csvRows.push(headerRow);

    // Table Rows (each round)
    for (let rIndex = 0; rIndex < rounds; rIndex++) {
      const row = [`Round #${rIndex + 1}`];
      teams.forEach(team => {
        const score = getScore(team.id, rIndex);
        row.push(String(score));
      });
      csvRows.push(row);
    }

    // Divider blank line before total row
    csvRows.push([]);

    // Total Row
    const totalRow = ['TOTAL'];
    teams.forEach(team => {
      const total = calculatedScores[team.id] || 0;
      totalRow.push(String(total));
    });
    csvRows.push(totalRow);

    // Escape CSV cell function
    const escapeCSVCell = (val: string) => {
      if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\r')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    // Construct the CSV content
    const csvContent = csvRows
      .map(row => row.map(escapeCSVCell).join(','))
      .join('\r\n');

    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_scoreboard.csv`;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [quizTitle, teams, rounds, getScore, calculatedScores]);

  if (!isLoaded) return null;

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-hidden transition-colors duration-500 ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans relative`}>
      {/* Background Glows for Dark Mode */}
      {isDarkMode && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
          <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-indigo-600/10 blur-[120px] rounded-full" />
          <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] bg-blue-500/5 blur-[100px] rounded-full" />
        </div>
      )}

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Content */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className={`fixed left-0 top-0 bottom-0 w-[60vw] sm:w-72 md:w-80 shadow-2xl z-50 overflow-hidden flex flex-col border-r transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-[#0f172a] border-white/5' 
                : 'bg-white border-gray-200/60'
            }`}
          >
            {/* Sidebar Header/Logo - Pinned */}
            <div className={`p-4 sm:p-6 border-b flex items-center justify-between shrink-0 transition-colors duration-300 ${
              isDarkMode ? 'border-white/5 bg-blue-950/30' : 'border-gray-200/60 bg-white/40'
            }`}>
              <ScorePilotLogo isDarkMode={isDarkMode} className="scale-90 origin-left sm:scale-100" />
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className={`p-1.5 sm:p-2 rounded-xl transition-colors group ${isDarkMode ? 'hover:bg-blue-900/40' : 'hover:bg-slate-100'}`}
                type="button"
              >
                <X className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${isDarkMode ? 'text-blue-400 group-hover:text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
              </button>
            </div>

            {/* Sidebar Body - Scrollable */}
            <div className="flex-1 p-4 sm:p-6 space-y-6 sm:space-y-8 overflow-y-auto custom-scrollbar">
              <section>
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-blue-400/60 mb-3 flex items-center gap-2">
                  <Info className="w-3 h-3" /> About ScorePilot
                </h2>
                <p className={`text-sm font-normal leading-relaxed transition-colors ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  Your versatile companion for any competition. Track complex scoring across multiple rounds for games, sports, quizzes, or tournaments with a fluid, intuitive interface.
                </p>
              </section>

              <section>
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-blue-400 mb-4 flex items-center gap-2">
                  <HelpCircle className="w-3 h-3" /> Working Guide
                </h2>
                <div className="space-y-4">
                  {[
                    { icon: PlusCircle, text: 'Create participants & rounds', color: 'text-blue-500' },
                    { icon: Hash, text: 'Enter scores per round in the grid', color: 'text-indigo-500' },
                    { icon: Layout, text: 'Calculate totals for each team', color: 'text-blue-400' },
                    { icon: Award, text: 'Reveal the ultimate champion', color: 'text-yellow-500' },
                    { icon: RotateCcw, text: 'Use Undo/Redo for easy recovery', color: 'text-red-500' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 group">
                      <div className={`p-2 rounded-xl border transition-all ${
                        isDarkMode 
                          ? 'bg-blue-600 border-blue-400/30 group-hover:bg-blue-500' 
                          : 'bg-slate-50 border-gray-200 group-hover:bg-blue-50'
                      }`}>
                        <item.icon className={`w-3.5 h-3.5 transition-colors ${
                          isDarkMode ? 'text-white' : item.color
                        } opacity-90 group-hover:opacity-100`} />
                      </div>
                      <span className={`text-xs font-semibold transition-colors ${
                        isDarkMode 
                          ? 'text-slate-300 group-hover:text-white' 
                          : 'text-slate-600 group-hover:text-slate-900'
                      }`}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar Footer - Pinned */}
            <div className={`p-4 sm:p-6 border-t shrink-0 space-y-4 sm:space-y-6 transition-colors duration-300 ${
              isDarkMode ? 'border-white/5 bg-blue-950/20' : 'border-gray-200/60 bg-gray-50/50'
            }`}>
              <section 
                onClick={toggleTheme}
                className={`p-2.5 rounded-xl border shadow-sm transition-colors cursor-pointer group/theme ${
                isDarkMode ? 'bg-slate-900 border-white/5 hover:bg-slate-800' : 'bg-white border-gray-200/60 hover:bg-gray-50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isDarkMode ? <Moon className="w-3.5 h-3.5 text-blue-400 group-hover/theme:rotate-12 transition-transform" /> : <Sun className="w-3.5 h-3.5 text-yellow-500 group-hover/theme:rotate-90 transition-transform" />}
                    <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      Theme
                    </span>
                  </div>
                  <div 
                    className={`relative w-10 h-5.5 rounded-full transition-all duration-300 ${isDarkMode ? 'bg-blue-600' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-all duration-300 ${isDarkMode ? 'left-4.5' : 'left-1'}`} />
                  </div>
                </div>
              </section>

              <div className="h-px bg-gray-200/60 dark:bg-blue-900/40 mx-2" />

              <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
                <motion.div
                  whileHover="hover"
                  whileTap="hover"
                  variants={{
                    hover: { scale: 1.05, y: -5 }
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className="flex flex-col items-center gap-2 cursor-pointer select-none"
                >
                  <div className={`flex items-center gap-2 md:gap-3 px-4 md:px-8 py-3 md:py-4 rounded-2xl md:rounded-3xl border transition-all duration-500 ${
                    isDarkMode
                      ? 'bg-slate-900/80 border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.2)] backdrop-blur-md'
                      : 'bg-white/80 border-blue-200 shadow-[0_0_30px_rgba(59,130,246,0.1)] backdrop-blur-md'
                  }`}>
                    <motion.span
                      variants={{
                        hover: {
                          scale: [1, 1.3, 1, 1.3, 1],
                          rotate: [0, 90, 180, 270, 360],
                          filter: isDarkMode 
                            ? [
                                'drop-shadow(0 0 2px rgba(96,165,250,0.2))',
                                'drop-shadow(0 0 12px rgba(96,165,250,0.9))',
                                'drop-shadow(0 0 4px rgba(168,85,247,0.4))',
                                'drop-shadow(0 0 12px rgba(168,85,247,0.9))',
                                'drop-shadow(0 0 2px rgba(96,165,250,0.2))'
                              ]
                            : [
                                'drop-shadow(0 0 2px rgba(59,130,246,0.2))',
                                'drop-shadow(0 0 10px rgba(59,130,246,0.8))',
                                'drop-shadow(0 0 3px rgba(147,51,234,0.3))',
                                'drop-shadow(0 0 10px rgba(147,51,234,0.8))',
                                'drop-shadow(0 0 2px rgba(59,130,246,0.2))'
                              ]
                        }
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                      className="inline-block"
                    >
                      <Sparkles className={`w-5 h-5 md:w-6 md:h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                    </motion.span>
                    <p className={`text-sm md:text-xl font-medium tracking-tight ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                      Developed by{' '}
                      <a
                        href="https://github.com/sahilkhatkar11"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`font-black transition-all duration-300 relative group inline-block ${
                          isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                        }`}
                      >
                        Sahil Khatkar
                        <span className={`absolute -bottom-1 left-0 w-0 h-1 transition-all duration-500 group-hover:w-full rounded-full ${
                          isDarkMode ? 'bg-gradient-to-r from-blue-400 to-purple-400' : 'bg-gradient-to-r from-blue-600 to-purple-600'
                        }`}></span>
                      </a>
                    </p>
                    <motion.span
                      variants={{
                        hover: {
                          scale: [1, 1.3, 1, 1.3, 1],
                          rotate: [0, -90, -180, -270, -360],
                          filter: isDarkMode 
                            ? [
                                'drop-shadow(0 0 2px rgba(96,165,250,0.2))',
                                'drop-shadow(0 0 12px rgba(96,165,250,0.9))',
                                'drop-shadow(0 0 4px rgba(168,85,247,0.4))',
                                'drop-shadow(0 0 12px rgba(168,85,247,0.9))',
                                'drop-shadow(0 0 2px rgba(96,165,250,0.2))'
                              ]
                            : [
                                'drop-shadow(0 0 2px rgba(59,130,246,0.2))',
                                'drop-shadow(0 0 10px rgba(59,130,246,0.8))',
                                'drop-shadow(0 0 3px rgba(147,51,234,0.3))',
                                'drop-shadow(0 0 10px rgba(147,51,234,0.8))',
                                'drop-shadow(0 0 2px rgba(59,130,246,0.2))'
                              ]
                        }
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                      className="inline-block"
                    >
                      <Sparkles className={`w-5 h-5 md:w-6 md:h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                    </motion.span>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Winner Popup */}
      <AnimatePresence>
        {showWinnerPopup && winner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6"
            onClick={() => setShowWinnerPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.5, y: 100 }}
              animate={{ scale: 1, y: 0 }}
              className="text-center space-y-8 pointer-events-none w-full max-w-4xl"
            >
              <Trophy className="w-32 h-32 text-yellow-400 mx-auto animate-bounce" />
              <div className="space-y-4 text-center w-full px-4">
                <h2 className="text-white/60 text-xl font-bold uppercase tracking-[0.3em] text-center">The Winner is</h2>
                <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter uppercase text-center w-full block">
                  {winner.name}
                </h1>
              </div>
              <div className="text-yellow-400 font-mono text-5xl font-black text-center">
                {calculatedScores[winner.id]} Points
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className={`fixed top-0 left-0 right-0 z-40 backdrop-blur-3xl border-b px-2 sm:px-4 py-2 sm:py-3 shadow-md transition-all duration-500 will-change-[transform,opacity,filter] ${
        isDarkMode ? 'bg-[#020617]/70 border-white/10' : 'bg-white/60 border-gray-200/40'
      } ${isSidebarOpen ? 'blur-md scale-[0.98] grayscale-[0.5] pointer-events-none' : ''}`}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-2 gap-x-2">
            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className={`p-1.5 sm:p-2 rounded-xl transition-colors group ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
              type="button"
            >
              <Menu className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${isDarkMode ? 'text-slate-400 group-hover:text-white' : 'text-slate-500 group-hover:text-blue-600'}`} />
            </button>
            <div className={`h-5 sm:h-6 w-[1px] mx-1 sm:mx-2 ${isDarkMode ? 'bg-blue-900/40' : 'bg-slate-200'}`} />
            
            <Award className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <input
              type="text"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              onFocus={pushToHistory}
              className={`text-xs sm:text-sm md:text-base font-extrabold bg-transparent border-none focus:ring-0 w-24 xs:w-32 sm:w-48 md:w-auto p-0 transition-colors truncate ${isDarkMode ? 'text-white placeholder:text-blue-800' : 'text-slate-900 placeholder:text-slate-300'}`}
              placeholder="Quiz Title..."
            />
          </div>
        
          <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-2 flex-1">
            <div className="hidden sm:flex flex-wrap items-center gap-1">
              {history.length > 0 && (
                <button
                  onClick={undo}
                  className={`px-3 py-1.5 rounded-xl font-bold text-[9px] uppercase tracking-wider transition-all border flex items-center gap-1.5 shadow-sm active:scale-95 ${
                    isDarkMode 
                      ? 'bg-slate-800 text-slate-100 border-blue-500/30 hover:bg-slate-700' 
                      : 'bg-white text-slate-600 border-gray-200 hover:bg-slate-50'
                  }`}
                  title="Undo last action"
                >
                  <Undo2 className="w-3 h-3" />
                  Undo
                </button>
              )}
              {redoStack.length > 0 && (
                <button
                  onClick={redo}
                  className={`px-3 py-1.5 rounded-xl font-bold text-[9px] uppercase tracking-wider transition-all border flex items-center gap-1.5 shadow-sm active:scale-95 ${
                    isDarkMode 
                      ? 'bg-slate-800 text-slate-100 border-blue-500/30 hover:bg-slate-700' 
                      : 'bg-white text-slate-600 border-gray-200 hover:bg-slate-50'
                  }`}
                  title="Redo action"
                >
                  Redo
                  <Redo2 className="w-3 h-3" />
                </button>
              )}
            </div>
            
            {Object.keys(calculatedScores).length > 0 && !showFinalDashboard && (
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                <button
                  onClick={clearCalculatedScores}
                  className={`px-3 py-1.5 rounded-xl font-bold text-[9px] uppercase tracking-wider transition-all border shadow-sm ${
                    isDarkMode 
                      ? 'bg-slate-900 text-slate-300 border-white/5 hover:bg-slate-800 hover:text-white' 
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  Reset Totals
                </button>
                <button
                  onClick={clearAllScores}
                  className={`px-3 py-1.5 rounded-xl font-bold text-[9px] uppercase tracking-wider transition-all border ${
                    isDarkMode
                      ? 'bg-red-950/20 text-red-400 border-red-900/30 hover:bg-red-950/40 hover:text-red-300'
                      : 'bg-red-50 text-red-500 border-red-100 hover:bg-red-100'
                  }`}
                >
                  Clear Scores
                </button>
              </div>
            )}
            <div className={`flex items-center gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl p-0.5 sm:p-1 border transition-colors ${
              isDarkMode ? 'bg-blue-950/50 border-white/5' : 'bg-[#F1F3F5] border-[#DEE2E6]'
            }`}>
              <button 
                onClick={removeRound}
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded transition-all text-[10px] sm:text-xs font-bold shadow-sm ${
                  isDarkMode ? 'bg-slate-800 text-white hover:bg-slate-700 active:scale-95' : 'bg-white hover:bg-gray-50 text-slate-700'
                }`}
              >
                -
              </button>
              <span className={`text-[9px] sm:text-[10px] font-mono font-black px-0.5 sm:px-1 ${isDarkMode ? 'text-blue-200' : 'text-slate-600'}`}>{rounds}<span className="hidden xs:inline"> R</span></span>
              <button 
                onClick={addRound}
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded transition-all text-[10px] sm:text-xs font-bold shadow-sm ${
                  isDarkMode ? 'bg-slate-800 text-white hover:bg-slate-700 active:scale-95' : 'bg-white hover:bg-gray-50 text-slate-700'
                }`}
              >
                +
              </button>
            </div>
            <button
              onClick={clearAll}
              className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all border flex items-center gap-1 group shadow-sm active:scale-95 ${
                isDarkMode 
                  ? 'text-red-400 hover:bg-red-950/20 border-transparent hover:border-red-900/30' 
                  : 'text-red-500 hover:bg-red-50 border-transparent hover:border-red-200'
              }`}
              title="Reset All Data (Teams, Scores, Rounds)"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:rotate-[-90deg] transition-transform" />
              <span className="hidden lg:inline text-[10px] font-black uppercase tracking-widest">Reset All</span>
            </button>
          </div>
        </div>
      </header>

      <div className={`flex flex-col min-h-screen w-full max-w-full overflow-x-hidden transition-all duration-500 ${isSidebarOpen ? 'blur-md scale-[0.98] pointer-events-none grayscale-[0.5]' : ''}`}>

      {/* Header Spacer to avoid content overlap with fixed header */}
      <div className="h-20" />

      <main className="w-full max-w-7xl mx-auto p-4 space-y-4 pb-12 transition-all min-w-0 overflow-x-hidden">
        {/* Team Input Area */}
        {!showFinalDashboard && (
          <section className={`p-4 sm:p-6 rounded-3xl border shadow-sm transition-all relative z-10 mx-auto w-full max-w-2xl ${
            isDarkMode ? 'bg-[#0f172a] border-white/5' : 'bg-white border-gray-200/60'
          }`}>
              <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-center justify-center">
                <div className="relative w-full md:max-w-sm">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-slate-600" />
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTeam()}
                    placeholder="New Team Name..."
                    className={`w-full border rounded-2xl pl-11 pr-4 py-3.5 sm:py-3 outline-none transition-all font-semibold italic text-base sm:text-sm text-center md:text-left ${
                      isDarkMode 
                        ? 'bg-[#020617] border-blue-900/50 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/40 shadow-inner' 
                        : 'bg-slate-50 border-gray-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600/20'
                    }`}
                  />
                </div>
                <button
                  onClick={addTeam}
                  disabled={!newTeamName.trim()}
                  className="w-full md:w-auto px-8 py-3.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-600/20"
                >
                <PlusCircle className="w-4 h-4" />
                <span>Add Participant</span>
              </button>
            </div>
          </section>
        )}

        {/* Score Sheet Section */}
        {!showFinalDashboard && (
          <section className="space-y-6 relative z-10 transition-all">
            <div className={`overflow-x-auto custom-scrollbar w-full border rounded-3xl shadow-sm transition-all ${
              isDarkMode ? 'bg-[#0f172a] border-white/5' : 'bg-white border-gray-200/60'
            }`}>
                <table className="min-w-full w-max border-separate border-spacing-0">
                  <thead>
                    <tr className={`border-b divide-x transition-colors ${
                      isDarkMode ? 'bg-[#1e293b] border-white/5 divide-white/5' : 'bg-slate-50 border-gray-200/60 divide-gray-200/60'
                    }`}>
                      <th className={`px-2 py-3 text-left font-mono text-[8px] font-black uppercase tracking-widest w-16 sm:w-24 sticky left-0 z-30 transition-colors shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)] border-r ${
                        isDarkMode ? 'bg-[#1e293b] text-slate-400 border-white/5' : 'bg-slate-50 text-slate-400 border-gray-200'
                      }`}>
                        ROUND
                      </th>
                      {teams.map(team => (
                        <TeamHeader 
                          key={team.id}
                          team={team}
                          isDarkMode={isDarkMode}
                          isActive={activeTeamId === team.id}
                          isEditing={editingTeamId === team.id}
                          tempName={tempTeamName}
                          setTempName={setTempTeamName}
                          onUpdate={() => updateTeamName(team.id, tempTeamName)}
                          onCancel={() => setEditingTeamId(null)}
                          onEdit={() => {
                            setEditingTeamId(team.id);
                            setTempTeamName(team.name);
                            setActiveTeamId(team.id);
                          }}
                          onToggleActive={() => {
                            setActiveTeamId(activeTeamId === team.id ? null : team.id);
                            if (activeTeamId !== team.id) setEditingTeamId(null);
                          }}
                          onDelete={() => removeTeam(team.id)}
                        />
                      ))}
                      {teams.length === 0 && (
                        <th className="px-4 py-8 text-slate-300 dark:text-slate-700 italic text-sm font-medium text-center">
                          Add participants to start tracking scores
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className={`divide-y transition-colors ${isDarkMode ? 'divide-white/5' : 'divide-gray-200/60'}`}>
                    {Array.from({ length: rounds }).map((_, rIndex) => (
                      <tr key={`round-${rIndex}`} className={`group transition-colors divide-x ${
                        isDarkMode ? 'divide-white/5' : 'divide-gray-200/60'
                      } ${
                        activeRoundIndex === rIndex 
                          ? (isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50/20') 
                          : (isDarkMode ? 'hover:bg-slate-800/20' : 'hover:bg-slate-50/50')
                      }`}>
                          <td 
                          className={`px-2 py-3 font-black sticky left-0 z-20 transition-colors cursor-pointer border-r shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)] ${
                            isDarkMode ? 'bg-[#020617] border-white/5' : 'bg-white border-gray-200'
                          }`}
                          onClick={() => setActiveRoundIndex(activeRoundIndex === rIndex ? null : rIndex)}
                        >
                          <div className="flex items-center justify-between gap-1 min-w-[60px] sm:min-w-[80px]">
                            <span className={`text-base sm:text-lg font-mono transition-colors ${
                              activeRoundIndex === rIndex 
                                ? 'text-blue-500 dark:text-white font-black' 
                                : isDarkMode ? 'text-slate-600' : 'text-slate-400'
                            }`}>#{rIndex + 1}</span>
                            {activeRoundIndex === rIndex && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearRoundScores(rIndex);
                                  setActiveRoundIndex(null);
                                }}
                                className="p-1 px-1.5 bg-red-50 dark:bg-red-950/30 text-red-500 rounded-lg border border-red-100 dark:border-red-900/30 text-[7px] md:text-[8px] font-black uppercase tracking-widest transition-all hover:bg-red-100 dark:hover:bg-red-900/50"
                              >
                                CLEAR
                              </button>
                            )}
                          </div>
                        </td>
                        {teams.map(team => (
                          <td key={`${team.id}-${rIndex}`} className="px-3 py-2">
                             <ScoreCell 
                               teamId={team.id}
                               roundIndex={rIndex}
                               score={getScore(team.id, rIndex)}
                               updateScore={updateScore}
                               isDarkMode={isDarkMode}
                             />
                          </td>
                        ))}
                      </tr>
                    ))}
                    
                    <tr className={`border-t-2 divide-x transition-colors ${
                      isDarkMode 
                        ? 'bg-slate-950 border-blue-500/50 divide-white/5' 
                        : 'bg-slate-50 border-slate-950 divide-gray-200/60'
                    }`}>
                      <td 
                        onClick={calculateAllScores}
                        className={`p-0 sticky left-0 z-30 transition-all cursor-pointer group/total-all border-t-2 border-r shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)] min-w-[60px] sm:min-w-[80px] ${
                        isDarkMode 
                          ? 'bg-slate-900 border-blue-500/30 hover:bg-slate-800' 
                          : 'bg-slate-200 border-gray-300 hover:bg-slate-300'
                      }`}>
                        <div className="flex flex-col items-center justify-center py-4 px-1 select-none">
                          <span className={`text-[8px] sm:text-[9px] font-black tracking-[0.2em] opacity-70 leading-none mb-1 transition-colors ${isDarkMode ? 'text-blue-400 group-hover/total-all:text-blue-300' : 'text-slate-500'}`}>CALC ALL</span>
                          <span className={`text-xs sm:text-sm font-black leading-none transition-colors ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>= TOTAL</span>
                        </div>
                      </td>
                      {teams.map(team => (
                        <td key={`total-${team.id}`} className={`px-3 py-4 text-center align-middle transition-colors ${
                          isDarkMode ? 'bg-slate-950' : 'bg-white'
                        }`}>
                          <div className="flex flex-col items-center gap-2">
                            <div className={`font-mono text-2xl font-black transition-colors ${
                              isDarkMode ? 'text-white' : 'text-slate-950'
                            }`}>
                              {calculatedScores[team.id] !== undefined ? calculatedScores[team.id] : '--'}
                            </div>
                            <button
                              onClick={() => { pushToHistory(); calculateTeamTotal(team.id); }}
                              className={`w-full py-1.5 px-2 text-[8px] font-black uppercase tracking-widest rounded-xl transition-all hover:scale-[1.02] active:scale-95 whitespace-nowrap shadow-sm border ${
                                isDarkMode 
                                  ? 'bg-blue-600 text-white border-blue-400 hover:bg-blue-500' 
                                  : 'bg-slate-950 text-white border-transparent hover:bg-black'
                              }`}
                            >
                              {calculatedScores[team.id] !== undefined ? 'Recalculate' : 'Calculate'}
                            </button>
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

            {/* Reveal Winner Button - Positioned below the table */}
            {allTeamsCalculated && !showFinalDashboard && (
            <div className="pt-8 pb-4 flex justify-center w-full px-4">
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={revealWinner}
                  className={`w-full sm:w-auto px-8 md:px-12 py-4 md:py-5 bg-yellow-400 text-black rounded-2xl md:rounded-3xl font-black text-xs md:text-sm uppercase tracking-[0.2em] md:tracking-[0.3em] hover:bg-yellow-300 transition-all shadow-2xl shadow-yellow-400/30 hover:scale-105 active:scale-95 border-b-4 border-yellow-600 flex items-center justify-center gap-3 md:gap-4 group will-change-transform`}
                >
                  <Trophy className="w-5 h-5 md:w-6 md:h-6 group-hover:rotate-12 transition-transform" />
                  Reveal Final Winner
                </motion.button>
              </div>
            )}
          </section>
        )}

        {/* Leaderboard View (Final Dashboard) */}
        {showFinalDashboard && (
          <section className="space-y-6 pt-10 relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200/60 dark:border-blue-900/30 pb-6 max-w-2xl mx-auto transition-colors relative">
              <div className="flex items-center gap-3">
                <Trophy className="w-10 h-10 text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)] animate-pulse" />
                <h2 className={`text-4xl font-extrabold uppercase tracking-tighter transition-colors ${
                  isDarkMode ? 'text-white' : 'text-slate-950'
                }`}>
                  Final Standings
                </h2>
              </div>
              
              <button 
                onClick={() => setShowFinalDashboard(false)}
                className={`text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all border shadow-lg active:scale-95 mt-4 md:mt-0 md:fixed md:top-24 md:right-8 lg:right-12 z-50 ${
                  isDarkMode 
                    ? 'bg-blue-600 text-white border-blue-400 hover:bg-blue-500 shadow-blue-900/40' 
                    : 'bg-white text-blue-600 border-blue-100 hover:bg-blue-50 shadow-sm'
                }`}
              >
                Return to Scores
              </button>
            </div>
            
            <div className="flex flex-col gap-5 max-w-2xl mx-auto">
              <AnimatePresence mode="popLayout">
                {sortedTeams.map((team, index) => {
                  const total = calculatedScores[team.id] || 0;
                  const isFirst = index === 0;
                  
                  return (
                    <motion.div
                      key={team.id}
                      layout
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`group relative overflow-hidden flex items-center justify-between p-5 rounded-3xl border transition-all hover:scale-[1.02] will-change-transform ${
                        isFirst 
                          ? 'bg-slate-950 dark:bg-blue-600 text-white dark:text-white border-slate-950 dark:border-blue-300 shadow-2xl py-8 mb-2 ring-4 ring-blue-500/20 dark:ring-white/10' 
                          : isDarkMode 
                            ? 'bg-blue-950/60 border-blue-900/50 backdrop-blur-xl shadow-lg' 
                            : 'bg-white border-gray-200/60 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-5">
                        <div className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl italic ${
                          isFirst 
                            ? 'bg-yellow-400 text-black shadow-[0_0_20px_rgba(250,204,21,0.5)]' 
                            : isDarkMode 
                              ? 'bg-blue-900/50 text-blue-400' 
                              : 'bg-slate-50 text-slate-400'
                        }`}>
                          #{index + 1}
                        </div>
                        
                        <div className="space-y-1">
                          <h3 className={`font-black tracking-tight uppercase leading-none ${isFirst ? 'text-4xl' : 'text-2xl'} ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
                            {team.name}
                          </h3>
                          <div className={`text-[10px] uppercase font-bold tracking-[0.2em] ${isFirst ? 'text-white/60 dark:text-blue-200/60' : 'text-slate-400 dark:text-blue-400/60'}`}>
                            {isFirst ? '🏆 Champion' : `Position #${index + 1}`}
                          </div>
                        </div>
                      </div>

                      <div className="text-right px-4">
                        <div className={`font-mono font-black tabular-nums tracking-tighter ${
                          isFirst ? 'text-5xl text-yellow-400' : `text-3xl ${isDarkMode ? 'text-white' : 'text-slate-950'}`
                        }`}>
                          {total}
                        </div>
                        <div className={`text-[8px] uppercase font-bold tracking-widest ${isFirst ? 'text-white/60 dark:text-blue-200/60' : 'text-slate-400 dark:text-blue-400/60'}`}>
                          Points
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Export Options */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 pb-12 max-w-2xl mx-auto px-4">
              <motion.button
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={exportToPDF}
                className={`w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl md:rounded-3xl font-black text-xs md:text-sm uppercase tracking-widest transition-all border shadow-lg hover:scale-105 active:scale-95 cursor-pointer select-none ${
                  isDarkMode
                    ? 'bg-[#1e293b] text-blue-400 border-blue-500/20 hover:bg-[#334155] hover:text-blue-300 shadow-blue-950/25'
                    : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50/50 hover:text-blue-700 shadow-sm'
                }`}
              >
                <FileDown className="w-4 h-4 md:w-5 md:h-5 text-blue-500 dark:text-blue-400" />
                <span>Export Scores to PDF</span>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38 }}
                onClick={exportToCSV}
                className={`w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl md:rounded-3xl font-black text-xs md:text-sm uppercase tracking-widest transition-all border shadow-lg hover:scale-105 active:scale-95 cursor-pointer select-none ${
                  isDarkMode
                    ? 'bg-[#1e293b] text-blue-400 border-blue-500/20 hover:bg-[#334155] hover:text-blue-300 shadow-blue-950/25'
                    : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50/50 hover:text-blue-700 shadow-sm'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 md:w-5 md:h-5 text-blue-500 dark:text-blue-400" />
                <span>Export Scores to CSV</span>
              </motion.button>
            </div>
          </section>
        )}
      </main>
      </div>
    </div>
  );
}
