/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, 
  Target, 
  PieChart, 
  BookOpen, 
  User, 
  ChevronRight, 
  Bell, 
  Plus, 
  MessageSquare, 
  ArrowUpRight, 
  ArrowDownRight,
  PlayCircle,
  Clock,
  Send,
  Mic,
  Calendar,
  IndianRupee,
  ShieldCheck,
  TrendingUp,
  Award,
  Users,
  Check,
  X,
  Users2,
  Share2,
  Receipt,
  ShoppingBag,
  History,
  Camera,
  Zap,
  Tv,
  CreditCard,
  AlertCircle,
  GraduationCap,
  Car,
  Plane,
  Copy,
  Sparkles,
  TrendingDown,
  Lightbulb,
  Tag,
  Download,
  FileText,
  Mail,
  CheckCircle,
  Shield,
  HelpCircle,
  Settings,
  ChevronLeft,
  Search,
  Palmtree,
  Smartphone,
  Heart,
  Store,
  Gem,
  ArrowRight,
  ArrowLeft,
  Activity,
  PlusCircle,
  Archive,
  RefreshCw,
  Trash2,
  Edit3,
  Map,
  MoreVertical,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PieChart as RePieChart, 
  Pie, 
  Cell as ReCell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip,
  Legend,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import { calculateMetrics, mapPersona, getSmartActions, PROFILING_QUESTIONS } from './lib/profilingLogic';
import { calculateHomepageMetrics, generateAlertsAndActions, suggestionEngine, journeyMap, searchIntentMap } from './lib/goalEngine';
import { 
  goalQuestionEngine, 
  goalEstimator, 
  inflationAdjuster, 
  feasibilityAnalyzer, 
  expenseCutAnalyzer, 
  planGenerator, 
  rule72Helper, 
  goalCardBuilder,
  getMutualFundSubOptions
} from './lib/smartGoalEngine';
import { cn } from './lib/utils';
import { generateTripGoalReport, getCoachResponse, generateMiniGoalReport } from './services/gemini';
import { getOpenAIResponse } from './services/openai';
import EnhancedOnboarding from './components/EnhancedOnboarding';
import { calculateGroupBalances, getWhoOwesWhom, getUserNetPosition, formatCurrency, getRelativeTime } from './lib/splitLogic';
import { UserProfile, DEFAULT_USER, Goal, Loan, InvestmentOption, VerificationItem, RecurringExpense, Tab, MiniGoal, GoalPlan, GoalInterviewAnswer, InvestmentInstrument, SplitGroup, SplitMember, SplitExpense, SplitSettlement, ActivityLog, Referral, Achievement, FamilyProfile, SupportTicket } from './types';
import { supabase } from './lib/supabase';
import { databaseService } from './services/database';
import { Auth } from './components/Auth';
import { Session } from '@supabase/supabase-js';

// --- Types ---

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'coach';
  timestamp: Date;
}

// --- Constants ---

const GOAL_PRICE_DATABASE: Record<string, { price: number, inflation: number }> = {
  'Europe Trip 5 Days (1 person)': { price: 150000, inflation: 0.06 },
  'Europe Trip 5 Days (couple)': { price: 275000, inflation: 0.06 },
  'Maldives Trip 4 Days': { price: 80000, inflation: 0.05 },
  'Goa Trip 4 Days': { price: 25000, inflation: 0.05 },
  'Buy Home Chennai (1BHK, 600sqft)': { price: 4500000, inflation: 0.08 },
  'Buy Home Chennai (2BHK, 1000sqft)': { price: 7500000, inflation: 0.08 },
  'Buy Home Chennai (3BHK, 1500sqft)': { price: 12000000, inflation: 0.08 },
  'Hatchback Car (Maruti Swift/Tata Punch)': { price: 700000, inflation: 0.04 },
  'Sedan Car (Honda City/Hyundai Verna)': { price: 1200000, inflation: 0.04 },
  'SUV (Creta/Nexon)': { price: 1500000, inflation: 0.04 },
  'Child Higher Education (India, Engineering/Medical)': { price: 1000000, inflation: 0.11 },
  'Child Higher Education (Abroad, USA/UK)': { price: 6000000, inflation: 0.08 },
  'Indian Wedding (South India, 150 guests)': { price: 1500000, inflation: 0.07 },
  'Destination Wedding (Goa/Jaipur)': { price: 3500000, inflation: 0.07 },
  'Child Marriage': { price: 1000000, inflation: 0.07 },
};

const INVESTMENT_OPTIONS: InvestmentOption[] = [
  { method: 'Fixed Deposit (FD)', expectedReturn: 6.5, riskLevel: 'VERY LOW', bestFor: 'Short term, safe' },
  { method: 'Gold / Gold ETF', expectedReturn: 8, riskLevel: 'LOW', bestFor: '5+ years, hedge' },
  { method: 'Debt Mutual Fund', expectedReturn: 7.5, riskLevel: 'LOW', bestFor: '3-5 years' },
  { method: 'SIP in Index Fund', expectedReturn: 12, riskLevel: 'MEDIUM', bestFor: '7+ years' },
  { method: 'SIP in Equity Fund', expectedReturn: 14, riskLevel: 'MEDIUM-HIGH', bestFor: '10+ years' },
  { method: 'Direct Stock/Trading', expectedReturn: 18, riskLevel: 'HIGH', bestFor: '10+ years, risky' },
  { method: 'PPF', expectedReturn: 7.1, riskLevel: 'VERY LOW', bestFor: 'Long term tax-free' },
  { method: 'NPS (Retirement)', expectedReturn: 10, riskLevel: 'LOW-MEDIUM' as any, bestFor: 'Retirement only' },
  { method: 'Bonds / G-Sec', expectedReturn: 7, riskLevel: 'VERY LOW', bestFor: 'Capital preservation' },
];

// --- Components ---

const BottomNav = ({ activeTab, onTabChange }: { activeTab: Tab, onTabChange: (tab: Tab) => void }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'HOME' },
    { id: 'goals', icon: Target, label: 'GOALS' },
    { id: 'roadmap', icon: Map, label: 'ROADMAP' },
    { id: 'split', icon: Users, label: 'SPLIT' },
    { id: 'report', icon: PieChart, label: 'REPORT' },
    { id: 'profile', icon: User, label: 'PROFILE' },
  ];

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white border-t border-gray-100 px-4 py-3 flex justify-between items-center z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id as Tab)}
          className={cn(
            "flex flex-col items-center gap-1 transition-all",
            activeTab === tab.id ? "text-accent" : "text-text-soft"
          )}
        >
          <tab.icon size={18} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
          <span className="text-[8px] font-bold tracking-wider">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

const Header = ({ title, showBack, onBack, rightElement, transparent }: { title: string, showBack?: boolean, onBack?: () => void, rightElement?: React.ReactNode, transparent?: boolean }) => {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  
  return (
    <div className={cn(
      "sticky top-0 px-6 py-4 flex justify-between items-center z-40 transition-all duration-300",
      transparent ? "bg-transparent" : "bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm"
    )}>
      <div className="flex items-center gap-4">
        {showBack && (
          <button onClick={onBack} className="p-2 hover:bg-primary/5 rounded-2xl transition-colors">
            <ChevronRight className="rotate-180 text-primary" size={20} />
          </button>
        )}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <h1 className={cn(
              "text-lg font-black tracking-tight uppercase",
              transparent ? "text-white" : "text-primary"
            )}>FinPath</h1>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className={cn(
              "text-[9px] font-black uppercase tracking-[0.2em]",
              transparent ? "text-white/60" : "text-text-soft"
            )}>{title}</p>
            {title === 'Dashboard' && (
              <>
                <span className={cn("w-1 h-1 rounded-full", transparent ? "bg-white/20" : "bg-gray-200")} />
                <p className={cn(
                  "text-[9px] font-black uppercase tracking-[0.2em]",
                  transparent ? "text-white/40" : "text-text-soft/60"
                )}>{dateStr}</p>
              </>
            )}
          </div>
        </div>
      </div>
      {rightElement || (
        <button className={cn(
          "w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-sm",
          transparent ? "bg-white/10 text-white border border-white/10" : "bg-primary/5 text-primary border border-primary/5"
        )}>
          <User size={18} className="opacity-90" />
        </button>
      )}
    </div>
  );
};

// --- Screens ---

const LoginScreen = ({ onLogin }: { onLogin: (loginData: { email?: string; phone?: string; name?: string }) => void }) => {
  const [activeTab, setActiveTab] = useState<'otp' | 'email'>('otp');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [showOtp, setShowOtp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (showOtp) {
      otpRefs.current[0]?.focus();
    } else {
      setOtp(['', '', '', '']);
    }
  }, [showOtp]);

  const handleOtpChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    
    // Handle multiple characters (e.g. from mobile keyboard suggestions)
    if (value.length > 1) {
      const digits = value.split('').slice(0, 4 - index);
      digits.forEach((d, i) => {
        if (index + i < 4) newOtp[index + i] = d;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, 3);
      otpRefs.current[nextIndex]?.focus();
      return;
    }

    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next
    if (value && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const data = e.clipboardData.getData('text').slice(0, 4);
    if (!/^\d+$/.test(data)) return;

    const newOtp = [...otp];
    data.split('').forEach((char, i) => {
      newOtp[i] = char;
    });
    setOtp(newOtp);
    otpRefs.current[Math.min(data.length, 3)]?.focus();
  };

  const handleVerifyOtp = () => {
    if (otp.join('') === '1234') {
      onLogin({ phone });
    } else {
      alert('Invalid OTP. Use 1234 for demo.');
      setOtp(['', '', '', '']);
      otpRefs.current[0]?.focus();
    }
  };

  const handleEmailLogin = () => {
    if (isSignUp) {
      if (name && email && password) onLogin({ email, name });
    } else {
      if (email && password) onLogin({ email });
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="flex-1 flex flex-col justify-center px-8 py-12 max-w-md mx-auto w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/5 rounded-3xl mb-6 relative">
            <div className="absolute inset-0 bg-primary/10 rounded-3xl transform rotate-6 scale-105 transition-transform"></div>
            <IndianRupee size={36} className="text-primary relative z-10" />
          </div>
          <h2 className="text-3xl font-black text-primary tracking-tight mb-3">FinPath</h2>
          <p className="text-text-soft font-medium text-sm px-4">Your secure, intelligent companion for financial clarity and wealth creation.</p>
        </div>

        <div className="bg-gray-50 p-1.5 rounded-2xl shadow-inner mb-8 flex">
          <button 
            onClick={() => setActiveTab('otp')}
            className={cn("flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300", activeTab === 'otp' ? "bg-white text-primary shadow-sm" : "text-text-soft hover:text-primary/70")}
          >
            Mobile OTP
          </button>
          <button 
            onClick={() => setActiveTab('email')}
            className={cn("flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300", activeTab === 'email' ? "bg-white text-primary shadow-sm" : "text-text-soft hover:text-primary/70")}
          >
            Email
          </button>
        </div>

        {activeTab === 'otp' ? (
          <div className="space-y-6">
            {!showOtp ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-primary/60 uppercase tracking-wider mb-2 block">Phone Number</label>
                  <div className="flex gap-3">
                    <div className="bg-gray-50 border-2 border-gray-100 px-4 py-4 rounded-2xl text-sm font-bold text-primary flex items-center justify-center">
                      +91
                    </div>
                    <input 
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter 10 digit number"
                      className="flex-1 bg-white border-2 border-gray-100 focus:border-primary rounded-2xl px-4 py-4 text-sm font-bold text-primary outline-none transition-all"
                    />
                  </div>
                </div>
                <button onClick={() => setShowOtp(true)} className="w-full bg-primary text-white py-4 rounded-2xl font-bold tracking-wide shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98]">
                  Send OTP
                </button>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <label className="text-xs font-bold text-primary/60 uppercase tracking-wider block">Enter 4-Digit OTP</label>
                    <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-1 rounded-md">Demo: 1234</span>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {otp.map((digit, i) => (
                      <input 
                        key={i}
                        ref={el => otpRefs.current[i] = el}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        onPaste={handlePaste}
                        className="w-full h-16 bg-white border-2 border-gray-100 rounded-2xl text-center text-2xl font-black text-primary focus:border-primary focus:ring-0 transition-all outline-none"
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <button onClick={handleVerifyOtp} className="w-full bg-primary text-white py-4 rounded-2xl font-bold tracking-wide shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98]">
                    Verify & Login
                  </button>
                  <button onClick={() => setShowOtp(false)} className="w-full text-sm text-text-soft font-bold hover:text-primary transition-colors py-2">
                    Change Number
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {isSignUp && (
              <div>
                <label className="text-xs font-bold text-primary/60 uppercase tracking-wider mb-2 block">Full Name</label>
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Arjun Sharma"
                  className="w-full bg-white border-2 border-gray-100 focus:border-primary rounded-2xl px-4 py-4 text-sm font-bold text-primary outline-none transition-all"
                />
              </div>
            )}
            <div>
              <label className="text-xs font-bold text-primary/60 uppercase tracking-wider mb-2 block">Email Address</label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-white border-2 border-gray-100 focus:border-primary rounded-2xl px-4 py-4 text-sm font-bold text-primary outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-primary/60 uppercase tracking-wider mb-2 block">Password</label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border-2 border-gray-100 focus:border-primary rounded-2xl px-4 py-4 text-sm font-bold text-primary outline-none transition-all"
              />
            </div>
            <div className="pt-2 space-y-4">
              <button onClick={handleEmailLogin} className="w-full bg-primary text-white py-4 rounded-2xl font-bold tracking-wide shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98]">
                {isSignUp ? 'Create Account' : 'Login'}
              </button>
              <button onClick={() => setIsSignUp(!isSignUp)} className="w-full text-sm text-text-soft font-bold hover:text-primary transition-colors py-2">
                {isSignUp ? 'Already have an account? Login' : 'New user? Sign Up'}
              </button>
            </div>
          </motion.div>
        )}

        <div className="mt-12 flex items-center justify-center gap-2 text-xs font-bold text-text-soft/60">
          <ShieldCheck size={14} />
          <span>Bank-grade 256-bit encryption</span>
        </div>
      </div>
    </div>
  );
};

const WelcomeScreen = ({ onStart }: { onStart: () => void }) => (
  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-bg-soft">
    <motion.div 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mb-8 shadow-xl"
    >
      <IndianRupee size={48} className="text-white" />
    </motion.div>
    
    <motion.h1 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="text-4xl font-extrabold text-primary mb-2"
    >
      FinPath
    </motion.h1>
    <motion.p 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="text-gray-600 font-medium mb-12"
    >
      Your Wealth Companion<br />
      <span className="text-accent italic">From Confusion to Clarity</span>
    </motion.p>

    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="card mb-12 w-full"
    >
      <p className="text-gray-700 italic">"Let us simplify your wealth journey today"</p>
    </motion.div>

    <motion.button
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5 }}
      onClick={onStart}
      className="btn-accent w-full text-lg py-4 shadow-lg shadow-accent/20"
    >
      Get Started - It's Free
    </motion.button>

    <p className="mt-12 text-xs text-gray-400 font-medium">
      Trusted by Working Indians in Chennai
    </p>
  </div>
);

const HomeScreen = ({ user, onNavigate }: { user: UserProfile, onNavigate: (tab: Tab, goalId?: string) => void }) => {
  const metrics = calculateHomepageMetrics(user);
  const { alerts, actions } = generateAlertsAndActions(user);
  
  const growthData = [
    { name: 'Jan', value: metrics.netWorth * 0.85 },
    { name: 'Feb', value: metrics.netWorth * 0.92 },
    { name: 'Mar', value: metrics.netWorth * 0.96 },
    { name: 'Apr', value: metrics.netWorth },
  ];

  return (
    <div className="flex-1 overflow-y-auto pb-32 bg-bg-main no-scrollbar">
      <Header title="Dashboard" transparent />
      
      {/* Hero Section */}
      <div className="bg-primary text-white px-6 pt-4 pb-16 rounded-b-[48px] shadow-[0_20px_50px_rgba(26,58,92,0.2)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px]"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-success/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-[80px]"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Total Net Worth</p>
            <div className="px-2 py-1 bg-white/10 rounded-lg border border-white/10 backdrop-blur-md">
              <p className="text-[9px] font-black text-accent uppercase tracking-widest">Premium Tier</p>
            </div>
          </div>
          
          <div className="flex items-baseline gap-3 mb-8">
            <h2 className="text-4xl font-black tracking-tight">₹{(metrics.netWorth || 0).toLocaleString('en-IN')}</h2>
            <div className="flex items-center gap-1 text-success font-black text-[10px] bg-success/10 px-2 py-1 rounded-full border border-success/20">
              <TrendingUp size={10} /> 12.4%
            </div>
          </div>

          <div className="h-28 w-full -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f5a623" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f5a623" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#f5a623" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorNetWorth)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_8px_rgba(13,148,136,0.8)] animate-pulse" />
              <p className="text-[9px] text-white/40 uppercase font-black tracking-widest">Market Status: Stable</p>
            </div>
            <p className="text-[9px] text-white/60 font-black uppercase tracking-widest">Live Update</p>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-10 relative z-20">
        {/* Alerts Strip */}
        <div className="flex gap-3 overflow-x-auto pb-6 no-scrollbar">
          {alerts.map((alert, i) => (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              key={i} 
              className={cn(
                "flex-shrink-0 px-4 py-3 rounded-[24px] flex items-center gap-3 border shadow-xl shadow-black/5 backdrop-blur-xl",
                alert.type === 'warning' ? "bg-white text-alert border-alert/10" :
                alert.type === 'success' ? "bg-white text-success border-success/10" :
                "bg-white text-accent border-accent/10"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center",
                alert.type === 'warning' ? "bg-alert/10" :
                alert.type === 'success' ? "bg-success/10" :
                "bg-accent/10"
              )}>
                {alert.type === 'warning' ? <AlertCircle size={16} /> :
                 alert.type === 'success' ? <TrendingUp size={16} /> :
                 <Clock size={16} />}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest leading-tight max-w-[140px]">{alert.text}</span>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { id: 'sip-calculator', label: 'SIP Calc', icon: IndianRupee, color: 'bg-blue-500/10 text-blue-600', iconColor: 'text-blue-600' },
            { id: 'chat', label: 'AI Coach', icon: MessageSquare, color: 'bg-orange-500/10 text-orange-600', iconColor: 'text-orange-600' },
            { id: 'roadmap', label: 'Roadmap', icon: Map, color: 'bg-emerald-500/10 text-emerald-600', iconColor: 'text-emerald-600' },
            { id: 'split', label: 'Split', icon: Users2, color: 'bg-violet-500/10 text-violet-600', iconColor: 'text-violet-600' }
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => onNavigate(item.id as Tab)}
              className="flex flex-col items-center gap-3 group"
            >
              <div className={cn(
                "w-16 h-16 rounded-[24px] flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-active:scale-95 shadow-lg shadow-black/5 border border-white",
                item.color
              )}>
                <item.icon size={24} className={item.iconColor} />
              </div>
              <span className="text-[9px] font-black text-text-soft uppercase tracking-[0.15em] group-hover:text-primary transition-colors">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Learn Shortcut */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <button 
            onClick={() => onNavigate('learn')}
            className="w-full card p-5 bg-gradient-to-r from-accent/10 to-orange-400/10 border-accent/20 flex items-center justify-between group active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center text-white shadow-lg shadow-accent/20 group-hover:scale-110 transition-transform">
                <BookOpen size={24} />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-black text-primary uppercase tracking-wider">Learn & Grow</h4>
                <p className="text-[10px] font-bold text-text-soft uppercase tracking-widest">Master your money with FinPath Hub</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-accent shadow-sm">
              <ChevronRight size={18} />
            </div>
          </button>
        </motion.div>

        {/* Monthly Snapshot */}
        <div className="mb-10">
          <div className="flex justify-between items-end mb-4 px-1">
            <h3 className="text-[10px] font-black text-text-soft uppercase tracking-[0.2em]">Monthly Snapshot</h3>
            <p className="text-[9px] font-black text-accent uppercase tracking-widest">April 2026</p>
          </div>
          
          <div className="card p-0 overflow-hidden bg-white shadow-[0_15px_40px_rgba(0,0,0,0.04)] border-gray-100/50">
            <div className="p-6 grid grid-cols-2 gap-6 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-12 bg-gray-100" />
              
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-success" />
                  <p className="text-[9px] font-black text-text-soft uppercase tracking-widest">Income</p>
                </div>
                <p className="text-xl font-black text-primary tracking-tight">₹{(metrics.totalIncome || 0).toLocaleString('en-IN')}</p>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-2 mb-2 justify-end">
                  <p className="text-[9px] font-black text-text-soft uppercase tracking-widest">Expenses</p>
                  <div className="w-1.5 h-1.5 rounded-full bg-alert" />
                </div>
                <p className="text-xl font-black text-alert tracking-tight">₹{(metrics.totalExpenses || 0).toLocaleString('en-IN')}</p>
              </div>
            </div>
            
            <div className="px-6 pb-6">
              <div className="h-2 w-full bg-bg-main rounded-full overflow-hidden flex p-0.5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${metrics.totalIncome > 0 ? (metrics.surplus/metrics.totalIncome)*100 : 0}%` }}
                  className="h-full bg-success rounded-full shadow-[0_0_10px_rgba(13,148,136,0.3)]" 
                />
                <div className="w-1" />
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${metrics.totalIncome > 0 ? (metrics.totalExpenses/metrics.totalIncome)*100 : 0}%` }}
                  className="h-full bg-alert/40 rounded-full" 
                />
              </div>
              
              <div className="flex justify-between mt-4">
                <div className="flex flex-col">
                  <p className="text-[9px] font-black text-text-soft uppercase tracking-widest mb-1">Net Surplus</p>
                  <p className="text-sm font-black text-success">₹{(metrics.surplus || 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="flex flex-col text-right">
                  <p className="text-[9px] font-black text-text-soft uppercase tracking-widest mb-1">Savings Rate</p>
                  <div className="flex items-center gap-2 justify-end">
                    <div className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-black",
                      metrics.savingsRatio >= 20 ? "bg-success/10 text-success" : "bg-accent/10 text-accent"
                    )}>
                      {metrics.savingsRatio.toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Goals */}
        <div className="mt-10">
          <div className="flex justify-between items-center mb-6 px-1">
            <h3 className="text-[10px] font-black text-text-soft uppercase tracking-[0.2em]">Financial Goals</h3>
            <button 
              onClick={() => onNavigate('goals')} 
              className="text-accent text-[10px] font-black uppercase tracking-widest hover:text-accent/80 transition-colors"
            >
              View All
            </button>
          </div>

          <div className="space-y-5">
            {(() => {
              const activeGoals = (Array.isArray(user.goals) ? user.goals : [])
                .filter(g => g.target > 0 && g.status !== 'DELETED')
                .slice(0, 3);

              if (activeGoals.length === 0) {
                return (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="card p-10 text-center border-dashed border-2 border-primary/10 bg-white shadow-xl shadow-black/5 rounded-[32px]"
                  >
                    <div className="w-20 h-20 bg-primary/5 rounded-[32px] flex items-center justify-center mx-auto mb-6 relative">
                      <div className="absolute inset-0 bg-accent/5 rounded-[32px] rotate-6 scale-110" />
                      <Target className="text-accent relative z-10" size={36} />
                    </div>
                    <h4 className="text-xl font-black text-primary mb-2">Dream Big, Start Small</h4>
                    <p className="text-xs font-bold text-text-soft mb-8 max-w-[220px] mx-auto leading-relaxed">
                      You haven't set any financial goals yet. Let's map your future.
                    </p>
                    <button 
                      onClick={() => onNavigate('goals')}
                      className="btn-accent w-full py-4 rounded-2xl text-[10px] font-black tracking-[0.2em] uppercase shadow-xl shadow-accent/20"
                    >
                      Create First Goal
                    </button>
                  </motion.div>
                );
              }

              return activeGoals.map((goal, idx) => {
                const target = goal.target || 0;
                const current = goal.current || 0;
                const progress = target > 0 ? (current / target) * 100 : 0;
                const remaining = Math.max(0, target - current);
                
                return (
                  <motion.div 
                    key={goal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onNavigate('goal-detail', goal.id)}
                    className="card group cursor-pointer p-6 bg-white hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 border-gray-100/50 rounded-[32px]"
                  >
                    <div className="flex justify-between items-start mb-5">
                      <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300">
                          {goal.category === 'education' ? '🎓' : 
                           goal.category === 'travel' ? '🏖️' : 
                           goal.category === 'family' ? '💍' : 
                           goal.category === 'luxury' ? '🏎️' : 
                           goal.category === 'home' ? '🏠' : '🌅'}
                        </div>
                        <div>
                          <h4 className="text-base font-black text-primary group-hover:text-accent transition-colors tracking-tight">{goal.name}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Clock size={10} className="text-text-soft" />
                            <p className="text-[9px] text-text-soft font-black uppercase tracking-widest">{goal.timeline} Year Plan</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-primary tracking-tight">₹{target.toLocaleString('en-IN')}</p>
                        <p className="text-[8px] text-text-soft font-black uppercase tracking-widest mt-0.5">Target</p>
                      </div>
                    </div>
                    
                    <div className="relative h-2.5 w-full bg-bg-main rounded-full overflow-hidden mb-4 p-0.5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, progress)}%` }}
                        className="h-full bg-gradient-to-r from-accent to-orange-400 rounded-full shadow-[0_0_10px_rgba(245,166,35,0.4)]"
                      />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-success" />
                        <span className="text-[10px] font-black text-success uppercase tracking-widest">₹{remaining.toLocaleString('en-IN')} Left</span>
                      </div>
                      <div className="px-2 py-0.5 bg-primary/5 rounded-md">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">{Math.round(progress)}%</span>
                      </div>
                    </div>
                  </motion.div>
                );
              });
            })()}
          </div>
        </div>

        {/* Upsell Card */}
        <div className="mt-12 mb-12">
          <div className="bg-gradient-to-br from-primary to-[#2a4a6c] rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-primary/20">
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/10">
                <Sparkles className="text-accent" size={24} />
              </div>
              <h4 className="text-2xl font-black mb-3 tracking-tight">Smart Goal Pricing</h4>
              <p className="text-sm text-white/60 mb-8 leading-relaxed font-medium">Not sure how much your dream vacation or home costs today? Use our AI engine to find out with inflation adjustments.</p>
              <button 
                onClick={() => onNavigate('goals')}
                className="bg-white text-primary py-4 px-8 rounded-2xl uppercase tracking-[0.2em] text-[10px] font-black shadow-xl shadow-black/10 active:scale-95 transition-all"
              >
                Calculate Now
              </button>
            </div>
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-accent/10 rounded-full blur-[60px]"></div>
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <IndianRupee size={120} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChatScreen = ({ user, onBack }: { user: UserProfile, onBack: () => void }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: `Namaste ${user.name}! I'm your FinPath Coach. I've reviewed your profile. How can I help you with your wealth journey today?`, sender: 'coach', timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiModel, setAiModel] = useState<'gemini' | 'gpt4o'>('gemini');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), text: input, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    let responseText = "";
    if (aiModel === 'gemini') {
      const history = messages.map(m => ({
        role: m.sender === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: m.text }]
      }));
      responseText = await getCoachResponse(input, history, user);
    } else {
      const history = messages.map(m => ({
        role: m.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: m.text
      }));
      responseText = await getOpenAIResponse(input, history, user);
    }
    
    setIsTyping(false);
    const coachMsg: Message = { id: (Date.now() + 1).toString(), text: responseText, sender: 'coach', timestamp: new Date() };
    setMessages(prev => [...prev, coachMsg]);
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="bg-primary text-white p-6 rounded-b-3xl shadow-lg flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-1 hover:bg-white/10 rounded-full">
            <ChevronRight className="rotate-180" size={24} />
          </button>
          <div className="flex-1">
            <h2 className="font-bold text-lg">FinPath Coach</h2>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-success rounded-full" />
              <span className="text-[10px] opacity-80 uppercase tracking-widest">Always Online</span>
            </div>
          </div>
          <div className="flex bg-white/10 p-1 rounded-xl border border-white/10">
            <button 
              onClick={() => setAiModel('gemini')}
              className={cn(
                "px-3 py-1 rounded-lg text-[10px] font-bold transition-all",
                aiModel === 'gemini' ? "bg-accent text-white" : "text-white/60 hover:text-white"
              )}
            >
              GEMINI
            </button>
            <button 
              onClick={() => setAiModel('gpt4o')}
              className={cn(
                "px-3 py-1 rounded-lg text-[10px] font-bold transition-all",
                aiModel === 'gpt4o' ? "bg-accent text-white" : "text-white/60 hover:text-white"
              )}
            >
              GPT-4o
            </button>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((m) => (
          <div key={m.id} className={cn("flex", m.sender === 'user' ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[85%] p-4 rounded-2xl text-sm",
              m.sender === 'user' ? "bg-primary text-white rounded-tr-none" : "bg-bg-soft text-gray-800 rounded-tl-none border border-gray-100"
            )}>
              {m.text}
              {m.id === '3' && (
                <div className="mt-3 p-3 bg-accent/10 border border-accent/20 rounded-xl">
                  <p className="text-[10px] font-bold text-accent uppercase mb-1">Pro Tip</p>
                  <p className="text-xs text-primary">Setting this to auto-debit on the 1st increases success rate by 80%.</p>
                  <button className="mt-2 w-full bg-accent text-white py-2 rounded-lg text-xs font-bold">Show me the plan</button>
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-bg-soft p-4 rounded-2xl rounded-tl-none border border-gray-100 flex gap-1">
              <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-100 flex items-center gap-2">
        <button className="p-3 text-gray-400 hover:text-primary transition-colors">
          <Mic size={20} />
        </button>
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask anything about wealth..."
          className="flex-1 bg-bg-soft border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
        />
        <button 
          onClick={handleSend}
          className="p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

const NetWorthScreen = ({ user, onBack }: { user: UserProfile, onBack: () => void }) => {
  const totalLiabilities = (Array.isArray(user.loans) ? user.loans : []).reduce((acc, l) => acc + l.amount, 0);
  const totalAssets = (Array.isArray(user.goals) ? user.goals : []).reduce((acc, g) => acc + g.current, 0) + 50000; // Adding 50k as base savings
  const netWorth = totalAssets - totalLiabilities;

  return (
    <div className="flex-1 overflow-y-auto pb-24">
      <Header title="My Financial Picture" showBack onBack={onBack} />
      <div className="p-6">
        <div className="card mb-6">
          <h3 className="text-center text-sm font-bold text-gray-400 uppercase mb-4">Assets vs Liabilities</h3>
          <div className="flex items-end justify-center gap-8 h-48 mb-4">
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 bg-success rounded-t-xl" style={{ height: `${Math.max(10, Math.min(100, (totalAssets / Math.max(totalAssets, totalLiabilities || 1)) * 100))}%` }} />
              <span className="text-xs font-bold text-success">{(totalAssets / 100000).toFixed(2)}L</span>
              <span className="text-[10px] text-gray-400 uppercase">Assets</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 bg-alert rounded-t-xl" style={{ height: `${Math.max(10, Math.min(100, (totalLiabilities / Math.max(totalAssets, totalLiabilities || 1)) * 100))}%` }} />
              <span className="text-xs font-bold text-alert">{(totalLiabilities / 100000).toFixed(2)}L</span>
              <span className="text-[10px] text-gray-400 uppercase">Liabilities</span>
            </div>
          </div>
          <div className="text-center p-4 bg-alert/5 rounded-2xl">
            <p className="text-xs text-gray-500 mb-1">Net Worth</p>
            <h4 className={cn("text-2xl font-bold", netWorth < 0 ? "text-alert" : "text-success")}>
              {netWorth < 0 ? '-' : ''}Rs {Math.abs(netWorth || 0).toLocaleString('en-IN')}
            </h4>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-success">Assets</h4>
              <span className="text-sm font-bold">Rs {(totalAssets || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Bank Savings</span>
                <span className="font-medium">Rs 50,000</span>
              </div>
              {(Array.isArray(user.goals) ? user.goals : []).map((goal, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-500">{goal.name} (Saved)</span>
                  <span className="font-medium">Rs {(goal.current || 0).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-alert">Liabilities</h4>
              <span className="text-sm font-bold">Rs {(totalLiabilities || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="space-y-3">
              {(Array.isArray(user.loans) ? user.loans : []).length > 0 ? (Array.isArray(user.loans) ? user.loans : []).map((loan, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-500">{loan.type}</span>
                  <span className="font-medium">Rs {(loan.amount || 0).toLocaleString('en-IN')}</span>
                </div>
              )) : (
                <p className="text-sm text-gray-400 italic">No outstanding loans</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const getGoalIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('emergency')) return <ShieldCheck size={24} className="text-accent" />;
  if (n.includes('education') || n.includes('higher') || n.includes('studies') || n.includes('mba')) return <GraduationCap size={24} className="text-purple-500" />;
  if (n.includes('home') || n.includes('house') || n.includes('renovation') || n.includes('interior') || n.includes('build')) return <Home size={24} className="text-orange-500" />;
  if (n.includes('car') || n.includes('vehicle') || n.includes('bike') || n.includes('bmw')) return <Car size={24} className="text-red-500" />;
  if (n.includes('travel') || n.includes('trip') || n.includes('vacation') || n.includes('bali') || n.includes('europe') || n.includes('international') || n.includes('domestic')) return <Plane size={24} className="text-blue-500" />;
  if (n.includes('wedding') || n.includes('marriage') || n.includes('anniversary') || n.includes('baby')) return <Heart size={24} className="text-pink-500" />;
  if (n.includes('wealth') || n.includes('retirement') || n.includes('fire') || n.includes('corpus')) return <TrendingUp size={24} className="text-green-500" />;
  if (n.includes('lifestyle') || n.includes('purchase') || n.includes('dream') || n.includes('watch') || n.includes('gadget') || n.includes('luxury')) return <Sparkles size={24} className="text-amber-500" />;
  if (n.includes('debt') || n.includes('loan') || n.includes('emi') || n.includes('credit card')) return <CreditCard size={24} className="text-red-500" />;
  if (n.includes('gadget') || n.includes('iphone') || n.includes('macbook')) return <Smartphone size={24} className="text-gray-500" />;
  return <Target size={24} className="text-accent" />;
};

const MiniGoalDetailModal = ({ goal, onClose, onSelectInvestment, expenses, onNavigate }: { goal: Goal, onClose: () => void, onSelectInvestment: (opt: InvestmentOption) => void, expenses: number, onNavigate?: (tab: Tab) => void }) => {
  const years = goal.timeline;
  const todayPrice = goal.todayPrice || goal.target;
  const inflationRate = goal.inflationRate || 0.06;
  const futureCost = Math.round(todayPrice * Math.pow(1 + inflationRate, years));
  const progress = (goal.current / goal.target) * 100;
  
  const calculateSIP = (fv: number, annualRate: number, years: number) => {
    const r = annualRate / 100 / 12;
    const n = years * 12;
    if (r === 0) return fv / n;
    return Math.round((fv * r) / (Math.pow(1 + r, n) - 1));
  };

  const isVacation = goal.name.toLowerCase().includes('trip') || goal.name.toLowerCase().includes('vacation') || goal.name.toLowerCase().includes('europe');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-[100] flex items-end justify-center backdrop-blur-sm"
    >
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="bg-white w-full max-w-md rounded-t-[40px] overflow-hidden flex flex-col shadow-2xl"
      >
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-4 mb-2" />
        
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex gap-4 items-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                {getGoalIcon(goal.name)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-primary">{goal.name}</h3>
                <p className="text-[10px] text-text-soft font-bold uppercase tracking-widest">{goal.timeline} Years Remaining</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 bg-bg-soft rounded-full"><X size={20} /></button>
          </div>

          <div className="space-y-6 mb-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-bg-soft p-4 rounded-2xl">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Current Savings</p>
                <p className="text-lg font-bold text-primary">₹{(goal.current || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-bg-soft p-4 rounded-2xl">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Target Amount</p>
                <p className="text-lg font-bold text-primary">₹{(goal.target || 0).toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="card bg-primary/5 border-primary/10 p-5">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Overall Progress</span>
                <span className="text-sm font-bold text-primary">{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-primary/10">
                <div 
                  className="h-full bg-accent rounded-full transition-all duration-1000" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  onClose();
                  // In a real app, this would open a "Mark Progress" modal
                }}
                className="flex-1 btn-accent py-4 text-xs shadow-lg shadow-accent/20"
              >
                MARK PROGRESS
              </button>
              <button 
                onClick={() => {
                  onClose();
                  // In a real app, this would show the full investment plan
                }}
                className="flex-1 btn-primary py-4 text-xs shadow-lg shadow-primary/20"
              >
                VIEW FULL PLAN
              </button>
            </div>
          </div>

          {isVacation && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onClose();
                onNavigate?.('smart-goal-questions');
              }}
              className="w-full bg-accent/10 text-accent py-4 rounded-2xl font-bold flex items-center justify-center gap-3 border-2 border-accent/20"
            >
              <PieChart size={18} />
              <span className="text-xs uppercase tracking-widest">Generate Smart AI Report</span>
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const SmartGoalDiscoveryScreen = ({ user, onBack, onNavigate, setInitialSmartGoalName, setInitialGoalCategory }: { user: UserProfile, onBack: () => void, onNavigate: (tab: Tab) => void, setInitialSmartGoalName: (name: string) => void, setInitialGoalCategory: (cat: string) => void }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const categories = [
    { id: 'travel', name: 'Travel', icon: Plane, color: '#1a3a5c' },
    { id: 'education', name: 'Education', icon: GraduationCap, color: '#f5a623' },
    { id: 'luxury', name: 'Luxury', icon: Sparkles, color: '#8b5cf6' },
    { id: 'family', name: 'Family', icon: Users2, color: '#0d9488' },
    { id: 'debt', name: 'Debt-Free', icon: CreditCard, color: '#ef4444' },
    { id: 'custom', name: 'Custom', icon: Plus, color: '#64748b' }
  ];

  const suggestions = suggestionEngine(user, selectedCategory, searchQuery);

  return (
    <div className="flex-1 flex flex-col bg-bg-main overflow-y-auto pb-24">
      <Header title="Goal Discovery" showBack onBack={onBack} />
      <div className="p-6 space-y-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search goals (e.g. MBA, Rolex, Europe)" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-primary shadow-sm focus:ring-2 focus:ring-accent outline-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="heading-section">CATEGORIES</h3>
            {selectedCategory && (
              <button onClick={() => setSelectedCategory(null)} className="text-xs font-bold text-accent uppercase tracking-widest">Clear</button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {categories.map((cat) => (
              <motion.div
                key={cat.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                className={cn(
                  "card p-6 flex flex-col items-center gap-3 cursor-pointer group transition-all",
                  selectedCategory === cat.id ? "ring-2 ring-accent bg-accent/5" : ""
                )}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform" style={{ backgroundColor: cat.color }}>
                  <cat.icon size={24} />
                </div>
                <span className="text-xs font-black text-primary uppercase tracking-widest">{cat.name}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="heading-section">AI SUGGESTIONS</h3>
          <div className="space-y-4">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setInitialSmartGoalName('');
                setInitialGoalCategory(selectedCategory || 'custom');
                onNavigate('smart-goal-questions');
              }}
              className="w-full bg-primary text-white py-5 rounded-[24px] font-black text-sm shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
            >
              <Plus size={20} />
              <span>Start Goal from Scratch</span>
            </motion.button>
            
            {(suggestions || []).map((s) => (
              <motion.div
                key={s.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setInitialSmartGoalName(s.title);
                  setInitialGoalCategory(s.category);
                  onNavigate('smart-goal-questions');
                }}
                className="card group cursor-pointer flex flex-col gap-3"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center text-2xl">
                      {s.icon}
                    </div>
                    <div>
                      <p className="text-sm font-black text-primary">{s.title}</p>
                      <p className="text-[10px] font-bold text-text-soft uppercase tracking-wider">Est. ₹{(s.baseCost/100000).toFixed(1)}L • {s.timeline} Years</p>
                    </div>
                  </div>
                  <ChevronRight className="text-gray-300 group-hover:text-accent transition-colors" size={20} />
                </div>
                <div className="bg-bg-soft p-3 rounded-xl flex items-start gap-2">
                  <Sparkles size={14} className="text-accent mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] font-bold text-text-soft leading-relaxed">{(s as any).reason}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const GoalStrategyReportScreen = ({ goal, onBack }: { goal: Goal, onBack: () => void }) => {
  const strategies = [
    { name: 'Equity Mutual Funds', weight: 60, color: '#1a3a5c', icon: TrendingUp },
    { name: 'Debt / FDs', weight: 30, color: '#f5a623', icon: ShieldCheck },
    { name: 'Gold / SGB', weight: 10, color: '#0d9488', icon: Sparkles }
  ];

  return (
    <div className="flex-1 flex flex-col bg-bg-main overflow-y-auto pb-24">
      <Header title="Strategy Report" showBack onBack={onBack} />
      <div className="p-8 space-y-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl shadow-primary/30"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-3">Recommended Mix</p>
          <h3 className="text-3xl font-black mb-10 tracking-tight">{goal.name}</h3>
          
          <div className="h-4 w-full bg-white/10 rounded-full overflow-hidden flex shadow-inner border border-white/5">
            {strategies.map((s, i) => (
              <motion.div 
                key={i} 
                initial={{ width: 0 }}
                animate={{ width: `${s.weight}%` }}
                transition={{ duration: 1, delay: i * 0.2 }}
                style={{ backgroundColor: s.color }} 
                className="h-full" 
              />
            ))}
          </div>
          <div className="flex justify-between mt-6">
            {strategies.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: s.color }} />
                <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{s.weight}%</span>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <PieChart size={16} className="text-primary" />
            <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em]">Asset Allocation</h3>
          </div>
          <div className="space-y-4">
            {strategies.map((s, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-6 rounded-[32px] flex justify-between items-center shadow-xl shadow-primary/5 border border-gray-50"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: s.color }}>
                    <s.icon size={24} />
                  </div>
                  <div>
                    <p className="text-base font-black text-primary mb-1">{s.name}</p>
                    <p className="text-[10px] font-black text-text-soft uppercase tracking-[0.2em]">{s.weight}% Allocation</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-primary mb-1">₹{Math.round((goal.target * s.weight) / 100 || 0).toLocaleString('en-IN')}</p>
                  <p className="text-[10px] font-black text-text-soft uppercase tracking-[0.2em]">Target Value</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-success/5 border-2 border-dashed border-success/20 p-10 rounded-[40px] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-success/5 rounded-full -mr-12 -mt-12 blur-2xl" />
          <div className="flex items-center gap-4 mb-6 text-success">
            <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center">
              <ShieldCheck size={28} />
            </div>
            <span className="text-sm font-black uppercase tracking-[0.2em]">Risk Analysis</span>
          </div>
          <p className="text-base text-primary/80 leading-relaxed font-medium">
            This portfolio is optimized for a {goal.timeline}-year horizon. We've balanced growth with stability to ensure you reach your ₹{(goal.target || 0).toLocaleString('en-IN')} target even in market downturns.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

const MiniGoalDetailScreen = ({ goal, onBack, onUpdateGoal, user, onUpdateInstruments, onDeleteMiniGoal, onNavigate }: { goal: MiniGoal, onBack: () => void, onUpdateGoal: (goal: MiniGoal) => void, user: UserProfile, onUpdateInstruments: (insts: InvestmentInstrument[]) => void, onDeleteMiniGoal: (id: string, reason: string, note: string) => void, onNavigate: (tab: Tab, id?: string) => void }) => {
  const [loading, setLoading] = useState(false);
  const [showFundingPlan, setShowFundingPlan] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const report = await generateMiniGoalReport(goal.name);
      onUpdateGoal({
        ...goal,
        target: report.targetPrice,
        category: report.category,
        tips: report.tips,
        comparisons: report.comparisons
      });
    } catch (error) {
      console.error("Error refreshing mini goal:", error);
    } finally {
      setLoading(false);
    }
  };

  const progress = (goal.current / goal.target) * 100;
  const monthsLeft = goal.timelineMonths || 6;
  const monthlyRequired = (goal.target - goal.current) / monthsLeft;
  const monthlySurplus = user.income - user.expenses;
  
  // Horizon Classification
  const horizon = monthsLeft <= 12 ? 'near term' : monthsLeft <= 36 ? 'short term' : 'medium term';
  
  // Discretionary spend estimation
  const discretionarySpend = user.budgets?.find(b => b.category === 'Entertainment')?.budget || 5000;
  const requiredDiscretionaryChange = Math.max(0, monthlyRequired - monthlySurplus);

  const fundingPatterns = [
    {
      id: 'cash-flow',
      name: 'Cash-flow-only',
      description: 'Pay directly from current surplus by reducing discretionary expenses.',
      risk: 'LOW',
      liquidity: 'HIGH',
      products: 'Current Account, Savings Account',
      status: monthlyRequired <= monthlySurplus ? 'On track' : `Need ₹${Math.round(monthlyRequired - monthlySurplus).toLocaleString('en-IN')} more per month`,
      icon: <IndianRupee size={20} />
    },
    {
      id: 'parking',
      name: 'Short-term parking',
      description: 'Low-risk, high-liquidity vehicles for immediate goals.',
      risk: 'LOW',
      liquidity: 'HIGH',
      products: 'Sweep FD, Liquid Funds, Very-short-term Debt',
      status: monthsLeft >= 3 && monthsLeft <= 12 ? 'Ideal for your timeline' : 'Consider for 3-12 month horizon',
      icon: <ShieldCheck size={20} />
    },
    {
      id: 'step-up',
      name: 'Step-up plan',
      description: 'Start smaller now, auto-increase every 3-6 months.',
      risk: 'MODERATE',
      liquidity: 'HIGH',
      products: 'Recurring Deposit, Flexi-SIP',
      status: 'Great for building habits',
      icon: <TrendingUp size={20} />
    },
    {
      id: 'bundle',
      name: 'Bundle-with-major-goal',
      description: 'Combine with a related major goal for better planning.',
      risk: 'MODERATE',
      liquidity: 'MEDIUM',
      products: 'Hybrid Funds, Balanced Advantage',
      status: 'Efficient for long-term lifestyle upgrades',
      icon: <PlusCircle size={20} />
    }
  ];

  return (
    <div className="flex-1 flex flex-col bg-bg-main overflow-y-auto pb-24">
      <Header title="Mini Goal" showBack onBack={onBack} />
      <div className="p-8 space-y-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[40px] overflow-hidden shadow-2xl shadow-primary/5 border border-gray-50"
        >
          <div className="relative h-72">
            <img src={goal.image} alt={goal.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-8 left-8 right-8">
              <span className="inline-block px-4 py-1.5 bg-accent text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-3 shadow-lg">
                {goal.category}
              </span>
              <h3 className="text-3xl font-black text-white tracking-tight">{goal.name}</h3>
            </div>
          </div>
          
          <div className="p-8 space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black text-text-soft uppercase tracking-[0.2em] mb-1">Target Price</p>
                <p className="text-3xl font-black text-primary">₹{(goal.target || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-text-soft uppercase tracking-[0.2em] mb-1">Progress</p>
                <p className="text-xl font-black text-accent">{Math.round(progress)}%</p>
              </div>
            </div>

            <div className="w-full h-3 bg-bg-main rounded-full overflow-hidden shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-accent rounded-full shadow-[0_0_12px_rgba(245,166,35,0.4)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-bg-main rounded-[24px] border border-gray-50">
                <p className="text-[10px] font-black text-text-soft uppercase tracking-[0.2em] mb-2">Saved</p>
                <p className="text-xl font-black text-primary">₹{(goal.current || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="p-6 bg-bg-main rounded-[24px] border border-gray-50">
                <p className="text-[10px] font-black text-text-soft uppercase tracking-[0.2em] mb-2">Left</p>
                <p className="text-xl font-black text-accent">₹{(goal.target - goal.current || 0).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Funding Plan Section for Lifestyle Mini-goals */}
        {(goal.category.toLowerCase().includes('lifestyle') || goal.category.toLowerCase().includes('electronics') || goal.category.toLowerCase().includes('fashion') || goal.category.toLowerCase().includes('home')) && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-accent" />
                <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em]">Funding Plan</h3>
              </div>
              <span className={cn(
                "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                horizon === 'near term' ? "bg-orange-100 text-orange-600" : 
                horizon === 'short term' ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
              )}>
                {horizon}
              </span>
            </div>

            <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-primary/5 border border-gray-50 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-text-soft uppercase tracking-widest">Monthly Needed</p>
                  <p className="text-xl font-black text-primary">₹{Math.round(monthlyRequired).toLocaleString('en-IN')}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-black text-text-soft uppercase tracking-widest">Months Left</p>
                  <p className="text-xl font-black text-primary">{monthsLeft}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-text-soft uppercase tracking-widest">Current Surplus</p>
                  <p className="text-xl font-black text-success">₹{monthlySurplus.toLocaleString('en-IN')}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-black text-text-soft uppercase tracking-widest">Discretionary Cut</p>
                  <p className="text-xl font-black text-error">₹{Math.round(requiredDiscretionaryChange).toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-50 space-y-4">
                <p className="text-[10px] font-black text-text-soft uppercase tracking-widest mb-4">Suggested Funding Patterns</p>
                <div className="space-y-4">
                  {fundingPatterns.map((pattern) => (
                    <div key={pattern.id} className="p-6 bg-bg-main rounded-3xl border border-gray-50 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                            {pattern.icon}
                          </div>
                          <div>
                            <h5 className="text-sm font-black text-primary">{pattern.name}</h5>
                            <div className="flex gap-2 mt-1">
                              <span className="text-[8px] font-black uppercase tracking-widest text-text-soft">Risk: {pattern.risk}</span>
                              <span className="text-[8px] font-black uppercase tracking-widest text-text-soft">Liquidity: {pattern.liquidity}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-text-soft font-medium leading-relaxed">{pattern.description}</p>
                      <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
                        <p className="text-[9px] font-black text-primary uppercase tracking-widest">Products: <span className="text-text-soft">{pattern.products}</span></p>
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            pattern.status.includes('Need') ? "bg-error" : "bg-success"
                          )} />
                          <p className="text-[10px] font-black text-primary">{pattern.status}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleRefresh}
          disabled={loading}
          className="w-full py-6 bg-white border-2 border-accent/20 rounded-[32px] flex items-center justify-center gap-3 text-accent font-black text-xs tracking-[0.2em] hover:bg-accent/5 transition-all shadow-xl shadow-accent/5"
        >
          {loading ? (
            <div className="w-5 h-5 border-3 border-accent/30 border-t-accent rounded-full animate-spin" />
          ) : (
            <>
              <Sparkles size={18} />
              <span>REFRESH AI PRICE & TIPS</span>
            </>
          )}
        </motion.button>

        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingBag size={16} className="text-primary" />
            <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em]">Price Comparison</h3>
          </div>
          <div className="space-y-4">
            {(goal.comparisons || []).map((c, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-6 rounded-[24px] flex justify-between items-center shadow-lg shadow-primary/5 border border-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary">
                    <Store size={20} />
                  </div>
                  <span className="text-sm font-black text-primary uppercase tracking-widest">{c.store}</span>
                </div>
                <p className="text-lg font-black text-primary">₹{(c.price || 0).toLocaleString('en-IN')}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={16} className="text-accent" />
            <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em]">Smart Savings Tips</h3>
          </div>
          <div className="space-y-4">
            {(goal.tips || []).map((tip, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex gap-5 p-6 bg-white rounded-[24px] border border-gray-50 shadow-xl shadow-primary/5"
              >
                <div className="w-10 h-10 bg-accent/10 text-accent rounded-xl flex-shrink-0 flex items-center justify-center">
                  <Zap size={18} />
                </div>
                <p className="text-sm text-primary/80 leading-relaxed font-bold">{tip}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <GoalFundingTracker goal={goal} user={user} onUpdateInstruments={onUpdateInstruments} />
      </div>

      {/* Sticky Footer for Edit/Delete */}
      <div className="sticky bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 p-6 flex gap-4 z-30">
        <button 
          onClick={() => onNavigate('smart-mini-goal-questions', goal.id)}
          className="flex-1 bg-bg-soft text-primary py-6 rounded-3xl font-black text-xs uppercase tracking-widest border border-gray-100 flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
        >
          <Edit3 size={18} />
          <span>Edit Goal</span>
        </button>
        <button 
          onClick={() => setShowDeleteModal(true)}
          className="flex-1 bg-error/5 text-error py-6 rounded-3xl font-black text-xs uppercase tracking-widest border border-error/10 flex items-center justify-center gap-2 hover:bg-error/10 transition-colors"
        >
          <Trash2 size={18} />
          <span>Delete Goal</span>
        </button>
      </div>

      <DeleteMiniGoalModal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        onConfirm={(reason, note) => {
          onDeleteMiniGoal(goal.id, reason, note);
          setShowDeleteModal(false);
          onBack();
        }} 
      />
    </div>
  );
};

const UniversalGoalReportScreen = ({ user, onBack }: { user: UserProfile, onBack: () => void }) => {
  const metrics = calculateMetrics(user.profilingData || {});
  const totalTarget = (Array.isArray(user.goals) ? user.goals : []).reduce((acc, g) => acc + g.target, 0);
  const totalSaved = (Array.isArray(user.goals) ? user.goals : []).reduce((acc, g) => acc + g.current, 0);
  const progress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  const actions = getSmartActions(user.persona || 'Wealth Protector', metrics);

  return (
    <div className="flex-1 flex flex-col bg-bg-main overflow-y-auto pb-24">
      <Header title="Financial Health Report" showBack onBack={onBack} />
      
      <div className="p-6 space-y-12">
        {/* Hero Section */}
        <div className="text-center py-8">
          <div className="relative w-56 h-56 mx-auto mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={[{ value: user.financialHealthScore || 78 }, { value: 100 - (user.financialHealthScore || 78) }]}
                  innerRadius={80}
                  outerRadius={105}
                  startAngle={90}
                  endAngle={450}
                  dataKey="value"
                  stroke="none"
                >
                  <ReCell fill="#0d9488" />
                  <ReCell fill="#1a3a5c10" />
                </Pie>
              </RePieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-5xl font-black text-primary">{user.financialHealthScore || 78}</p>
              <p className="text-[10px] font-bold text-text-soft uppercase tracking-widest">Wealth Score</p>
            </div>
          </div>
          <h2 className="text-3xl font-black text-primary mb-2">{user.persona}</h2>
          <p className="text-sm text-text-soft max-w-[280px] mx-auto">Your financial profile is strong, but there are key areas for optimization.</p>
        </div>

        {/* Core Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-6 bg-white border border-gray-100">
            <p className="label-caps text-text-soft mb-1">Net Worth</p>
            <h4 className="text-xl font-black text-primary">₹{(metrics.netWorth || 0).toLocaleString('en-IN')}</h4>
          </div>
          <div className="card p-6 bg-white border border-gray-100">
            <p className="label-caps text-text-soft mb-1">Monthly Surplus</p>
            <h4 className="text-xl font-black text-success">₹{(metrics.surplus || 0).toLocaleString('en-IN')}</h4>
          </div>
          <div className="card p-6 bg-white border border-gray-100">
            <p className="label-caps text-text-soft mb-1">Savings Rate</p>
            <h4 className="text-xl font-black text-primary">{Math.round(metrics.savingsRatio)}%</h4>
          </div>
          <div className="card p-6 bg-white border border-gray-100">
            <p className="label-caps text-text-soft mb-1">EMI Burden</p>
            <h4 className="text-xl font-black text-danger">{Math.round(metrics.emiBurden)}%</h4>
          </div>
        </div>

        {/* Detailed Breakdown Sections */}
        <div className="space-y-10">
          {/* Income & Expenses */}
          <section className="space-y-6">
            <h3 className="heading-section">CASH FLOW ANALYSIS</h3>
            <div className="card p-8 space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-text-soft uppercase tracking-widest">Monthly Income</span>
                <span className="text-sm font-black text-primary">₹{(metrics.totalIncome || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-text-soft uppercase tracking-widest">Monthly Expenses</span>
                <span className="text-sm font-black text-danger">₹{(metrics.totalExpenses || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="text-xs font-bold text-primary uppercase tracking-widest">Investible Surplus</span>
                <span className="text-sm font-black text-success">₹{(metrics.surplus || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </section>

          {/* Assets & Liabilities */}
          <section className="space-y-6">
            <h3 className="heading-section">ASSETS & LIABILITIES</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="card p-8 bg-success/5 border-success/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-success text-white flex items-center justify-center">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <p className="label-caps text-success">Total Assets</p>
                    <h4 className="text-xl font-black text-primary">₹{(metrics.totalAssets || 0).toLocaleString('en-IN')}</h4>
                  </div>
                </div>
                <div className="space-y-2">
                  {Object.entries(user.profilingData?.capturedAssets || {}).map(([key, val]: [string, any]) => {
                    const opt = PROFILING_QUESTIONS.find(q => q.id === 'asset-capture')?.options?.find(o => o.value === key);
                    if (!val.amount) return null;
                    return (
                      <div key={key} className="flex justify-between text-[10px] font-bold text-text-soft uppercase tracking-wider">
                        <span>{opt?.label}</span>
                        <span>₹{(val.amount || 0).toLocaleString('en-IN')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card p-8 bg-danger/5 border-danger/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-danger text-white flex items-center justify-center">
                    <TrendingDown size={20} />
                  </div>
                  <div>
                    <p className="label-caps text-danger">Total Liabilities</p>
                    <h4 className="text-xl font-black text-primary">₹{(metrics.totalLiabilities || 0).toLocaleString('en-IN')}</h4>
                  </div>
                </div>
                <div className="space-y-2">
                  {Object.entries(user.profilingData?.capturedLiabilities || {}).map(([key, val]: [string, any]) => {
                    const opt = PROFILING_QUESTIONS.find(q => q.id === 'liability-capture')?.options?.find(o => o.value === key);
                    if (!val.amount) return null;
                    return (
                      <div key={key} className="flex justify-between text-[10px] font-bold text-text-soft uppercase tracking-wider">
                        <span>{opt?.label}</span>
                        <span>₹{(val.amount || 0).toLocaleString('en-IN')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Risk & Protection */}
          <section className="space-y-6">
            <h3 className="heading-section">RISK & PROTECTION</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="card p-6 text-center">
                <p className="label-caps text-text-soft mb-2">Risk Willingness</p>
                <p className="text-2xl font-black text-primary">{Math.round(metrics.riskWillingnessScore)}%</p>
              </div>
              <div className="card p-6 text-center">
                <p className="label-caps text-text-soft mb-2">Risk Capacity</p>
                <p className="text-2xl font-black text-primary">{Math.round(metrics.riskCapacityScore)}%</p>
              </div>
              <div className="card p-6 text-center">
                <p className="label-caps text-text-soft mb-2">Insurance</p>
                <p className="text-2xl font-black text-primary">{Object.keys(user.profilingData?.capturedInsurance || {}).length}/5</p>
              </div>
              <div className="card p-6 text-center">
                <p className="label-caps text-text-soft mb-2">Money IQ</p>
                <p className="text-2xl font-black text-primary">{metrics.knowledgeScore}%</p>
              </div>
            </div>
          </section>

          {/* Next Best Actions */}
          <section className="space-y-6">
            <h3 className="heading-section">NEXT BEST ACTIONS</h3>
            <div className="space-y-4">
              {actions.map((action, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="card p-6 flex items-start gap-4 border-l-4 border-l-accent"
                >
                  <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center flex-shrink-0">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-primary mb-1">{action.title}</h4>
                    <p className="text-xs text-text-soft leading-relaxed">{action.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer Disclaimer */}
        <div className="pt-12 pb-8 text-center space-y-4">
          <p className="text-[10px] text-text-soft font-bold uppercase tracking-widest leading-relaxed px-8">
            This report is for educational purposes only. We do not guarantee returns or provide specific investment advice. Please consult a SEBI registered advisor for financial planning.
          </p>
          <div className="flex justify-center gap-4">
            <button className="p-3 bg-white border border-gray-100 rounded-xl text-primary hover:bg-gray-50 transition-all">
              <Share2 size={18} />
            </button>
            <button className="p-3 bg-white border border-gray-100 rounded-xl text-primary hover:bg-gray-50 transition-all">
              <Download size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DeleteMiniGoalModal = ({ isOpen, onClose, onConfirm }: { isOpen: boolean, onClose: () => void, onConfirm: (reason: string, note: string) => void }) => {
  const [reason, setReason] = useState('no longer relevant');
  const [note, setNote] = useState('');

  const reasons = [
    'no longer relevant',
    'bought already',
    'postponed',
    'too expensive now',
    'merged with another goal',
    'just exploring',
    'other'
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-primary/80 backdrop-blur-md z-[100] flex items-center justify-center p-6"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white w-full max-w-md rounded-[40px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
          >
            <div className="p-10 pb-4 text-center space-y-4">
              <div className="w-20 h-20 bg-error/10 text-error rounded-[32px] flex items-center justify-center mx-auto mb-6">
                <Trash2 size={40} />
              </div>
              <h3 className="text-3xl font-black text-primary tracking-tight">Delete Mini Goal?</h3>
              <p className="text-sm text-text-soft font-medium leading-relaxed">We'll move this to your archive. You can restore it anytime.</p>
            </div>

            <div className="flex-1 overflow-y-auto px-10 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-soft uppercase tracking-widest ml-2">Reason for deleting</label>
                <select 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-bg-main border-2 border-gray-100 rounded-2xl p-4 text-sm font-black text-primary outline-none focus:border-accent"
                >
                  {reasons.map(r => (
                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
              </div>

              {reason === 'other' && (
                <div className="space-y-2 pb-6">
                  <label className="text-[10px] font-black text-text-soft uppercase tracking-widest ml-2">Additional Note (Optional)</label>
                  <textarea 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Tell us more..."
                    className="w-full bg-bg-main border-2 border-gray-100 rounded-2xl p-4 text-sm font-medium text-primary outline-none focus:border-accent h-24 resize-none"
                  />
                </div>
              )}
            </div>

            <div className="p-10 pt-4 bg-white border-t border-gray-50 flex gap-4 mt-auto pb-safe sticky bottom-0 z-10">
              <button 
                onClick={onClose}
                className="flex-[1] py-5 rounded-2xl font-black text-sm uppercase tracking-widest text-text-soft hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => onConfirm(reason, note)}
                className="flex-[2] py-5 rounded-2xl font-black text-sm uppercase tracking-widest bg-error text-white shadow-xl shadow-error/20"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const GoalsScreen = ({ user, onAddGoal, onUpdateGoal, onNavigate, setInitialSmartGoalName, setInitialGoalCategory, onUpdateMiniGoal, onDeleteMiniGoal }: { user: UserProfile, onAddGoal: (goal: Goal) => void, onUpdateGoal: (goal: Goal) => void, onNavigate: (tab: Tab, id?: string) => void, setInitialSmartGoalName: (name: string) => void, setInitialGoalCategory: (cat: string) => void, onUpdateMiniGoal: (goal: MiniGoal) => void, onDeleteMiniGoal: (id: string, reason: string, note: string) => void }) => {
  const [activeMiniGoalMenu, setActiveMiniGoalMenu] = useState<string | null>(null);
  const [showDeleteMiniGoalModal, setShowDeleteMiniGoalModal] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    name: 'Emergency Fund',
    target: 0,
    current: 0,
    timeline: 1
  });

  const allGoals = Array.isArray(user.goals) ? user.goals : [];
  const activeGoals = allGoals.filter(g => g.status !== 'DELETED' && g.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const deletedGoals = allGoals.filter(g => g.status === 'DELETED');
  
  const smartGoalSuggestions = suggestionEngine(user, null, searchQuery).slice(0, 3);

  const handleAddGoal = () => {
    if (newGoal.name && newGoal.target) {
      onAddGoal({
        id: Math.random().toString(36).substr(2, 9),
        name: newGoal.name,
        category: 'other',
        target: Number(newGoal.target),
        current: 0,
        timeline: Number(newGoal.timeline),
        priority: 'MEDIUM',
        color: '#f5a623',
        status: 'ACTIVE'
      } as Goal);
      setShowModal(false);
      setNewGoal({ name: 'Emergency Fund', target: 0, current: 0, timeline: 1 });
    }
  };
  
  const totalSaved = activeGoals.reduce((acc, g) => acc + g.current, 0);
  const totalTarget = activeGoals.reduce((acc, g) => acc + g.target, 0);
  const overallReadiness = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const lowerQuery = query.toLowerCase();
    let matchedCategory = null;
    let matchedTitle = '';
    for (const [key, cat] of Object.entries(searchIntentMap)) {
      if (lowerQuery.includes(key)) {
        matchedCategory = cat;
        matchedTitle = key.charAt(0).toUpperCase() + key.slice(1);
        break;
      }
    }
    if (matchedCategory) {
      setInitialSmartGoalName(matchedTitle);
      setInitialGoalCategory(matchedCategory);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 bg-bg-main">
      <Header title="Goal Planner" />
      
      <div className="p-6">
        {/* Overall Readiness Score */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary rounded-[32px] p-8 text-white shadow-2xl mb-10 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Overall Goal Readiness</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-5xl font-black">{overallReadiness}%</h3>
                  <span className="text-accent text-xs font-bold bg-accent/20 px-2 py-1 rounded-full">
                    {overallReadiness > 80 ? 'Expert' : overallReadiness > 50 ? 'Advanced' : overallReadiness > 20 ? 'Intermediate' : 'Beginner'}
                  </span>
                </div>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                <Award size={32} className="text-accent" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Total Saved</p>
                <p className="text-xl font-bold">₹{(totalSaved || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="text-right">
                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Target Corpus</p>
                <p className="text-xl font-bold">₹{(totalTarget || 0).toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${overallReadiness}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full shadow-[0_0_20px_rgba(245,166,35,0.5)]" 
              />
            </div>
          </div>
        </motion.div>

        {/* Goal Discovery Engine */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-accent" />
            <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em]">Goal Discovery Engine</h3>
          </div>
          
          <div className="relative group">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-accent transition-colors">
              <Search size={20} />
            </div>
            <input 
              type="text"
              placeholder="What are you dreaming of? (e.g. Tesla, PhD, Bali)"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-white border-2 border-gray-100 rounded-[32px] pl-16 pr-6 py-6 text-base font-bold text-primary focus:border-accent outline-none transition-all shadow-xl shadow-primary/5 placeholder:text-gray-300"
            />
          </div>
          
          {smartGoalSuggestions.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-3"
            >
              <div className="flex justify-between items-center px-2">
                <p className="text-[10px] font-black text-accent uppercase tracking-widest">AI Recommendations</p>
                <button onClick={() => onNavigate('smart-discovery')} className="text-[10px] font-black text-primary/40 uppercase tracking-widest hover:text-primary transition-colors">View All</button>
              </div>
              {smartGoalSuggestions.map((s, i) => (
                <motion.button 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => {
                    setInitialSmartGoalName(s.title);
                    setInitialGoalCategory(s.category);
                    onNavigate('goal-interview');
                  }}
                  className="w-full card p-5 flex items-center justify-between hover:border-accent/50 hover:shadow-lg transition-all text-left group"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      {s.icon}
                    </div>
                    <div>
                      <p className="text-sm font-black text-primary">{s.title}</p>
                      <p className="text-[10px] font-bold text-text-soft uppercase tracking-wider">{(s as any).reason}</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-bg-main flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors">
                    <ArrowUpRight size={16} />
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}

          <div className="mt-10">
            <p className="text-[10px] font-black text-primary/30 uppercase tracking-[0.2em] mb-6 px-2">Explore by Category</p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: 'travel', name: 'Travel', icon: <Plane size={20} />, color: 'bg-blue-50 text-blue-600' },
                { id: 'education', name: 'Education', icon: <GraduationCap size={20} />, color: 'bg-purple-50 text-purple-600' },
                { id: 'family', name: 'Family', icon: <Users size={20} />, color: 'bg-orange-50 text-orange-600' },
                { id: 'luxury', name: 'Luxury', icon: <Gem size={20} />, color: 'bg-red-50 text-red-600' },
                { id: 'wealth', name: 'Wealth', icon: <TrendingUp size={20} />, color: 'bg-green-50 text-green-600' },
                { id: 'lifestyle', name: 'Lifestyle', icon: <ShoppingBag size={20} />, color: 'bg-orange-50 text-orange-600' },
                { id: 'custom', name: 'Custom', icon: <Plus size={20} />, color: 'bg-gray-50 text-gray-600' },
              ].map(cat => (
                <motion.button
                  key={cat.id}
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setInitialGoalCategory(cat.id);
                    setInitialSmartGoalName(cat.id === 'custom' ? 'My Financial Goal' : '');
                    onNavigate('goal-interview');
                  }}
                  className="flex flex-col items-center gap-3 p-5 bg-white rounded-[28px] border border-gray-50 shadow-sm hover:border-accent hover:shadow-md transition-all group"
                >
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", cat.color)}>
                    {cat.icon}
                  </div>
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">{cat.name}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center mb-2 px-2">
            <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em]">Active Financial Goals ({activeGoals.length})</h3>
            <div className="flex items-center gap-4">
              <button onClick={() => onNavigate('universal-report')} className="text-[10px] font-black text-accent uppercase tracking-widest hover:underline">Analysis</button>
              <button onClick={() => setShowModal(true)} className="text-accent hover:text-accent-dark transition-colors">
                <PlusCircle size={24} />
              </button>
            </div>
          </div>
          
          {activeGoals.length === 0 ? (
            <div className="text-center py-12 px-8 bg-white rounded-[32px] border-2 border-dashed border-gray-100">
              <div className="w-16 h-16 bg-bg-main rounded-full flex items-center justify-center mx-auto mb-4">
                <Target size={32} className="text-gray-300" />
              </div>
              <p className="text-sm font-bold text-text-soft">No goals found. Start your first journey today!</p>
            </div>
          ) : (
            activeGoals.map((goal, i) => {
              const enrichedGoal = goalCardBuilder(goal);
              const { progress, readiness, milestones } = enrichedGoal;
              const monthlySavings = goal.selectedInvestment?.monthlyAmount || Math.ceil((goal.target - goal.current) / (goal.timeline * 12));
              const remaining = goal.target - goal.current;
              
              return (
                <motion.div 
                  key={goal.id} 
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => onNavigate('goal-detail', goal.id)}
                  className="bg-white rounded-[32px] p-6 shadow-xl shadow-primary/5 border border-gray-50 group cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden"
                >
                  {/* Readiness Badge */}
                  <div className="absolute top-0 right-0 px-4 py-2 bg-accent text-white text-[10px] font-black uppercase tracking-widest rounded-bl-2xl">
                    {readiness}% Ready
                  </div>

                  <div className="flex gap-5 items-start mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-bg-main flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
                      {getGoalIcon(goal.name)}
                    </div>
                    <div className="flex-1 pt-1">
                      <h4 className="text-lg font-black text-primary mb-1">{goal.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-text-soft uppercase tracking-widest">{goal.timeline} Years</span>
                        <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                        <span className="text-[10px] font-black text-accent uppercase tracking-widest">{goal.category}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] font-black text-text-soft uppercase tracking-widest mb-1">Current Savings</p>
                        <p className="text-xl font-black text-primary">₹{(goal.current || 0).toLocaleString('en-IN')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-text-soft uppercase tracking-widest mb-1">Target</p>
                        <p className="text-xl font-black text-primary">₹{(goal.target || 0).toLocaleString('en-IN')}</p>
                      </div>
                    </div>

                    <div className="relative pt-4">
                      <div className="w-full h-3 bg-bg-main rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="h-full bg-accent rounded-full shadow-[0_0_10px_rgba(245,166,35,0.3)]" 
                        />
                      </div>
                      
                      {/* Milestone Markers */}
                      <div className="absolute top-0 left-0 w-full flex justify-between px-1">
                        {[0, 25, 50, 75, 100].map(m => (
                          <div key={m} className={cn("w-1.5 h-1.5 rounded-full", progress >= m ? "bg-accent" : "bg-gray-200")} />
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <Clock size={12} className="text-text-soft" />
                        <span className="text-[10px] font-bold text-text-soft uppercase tracking-wider">₹{(remaining || 0).toLocaleString('en-IN')} to go</span>
                      </div>
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest">{Math.round(progress)}% Achieved</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-bg-main rounded-2xl border border-gray-50 group-hover:border-accent/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center">
                        <TrendingUp size={16} className="text-accent" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-text-soft uppercase tracking-widest">Recommended SIP</p>
                        <p className="text-sm font-black text-primary">₹{(monthlySavings || 0).toLocaleString('en-IN')} / mo</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 group-hover:text-accent transition-colors" />
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Archived Goals Section */}
        {deletedGoals.length > 0 && (
          <div className="mt-16 space-y-6">
            <div className="flex items-center gap-2 px-2">
              <Archive size={16} className="text-text-soft" />
              <h3 className="text-xs font-black text-text-soft uppercase tracking-[0.2em]">Archived Goals</h3>
            </div>
            <div className="space-y-4">
              {deletedGoals.map((goal) => (
                <div 
                  key={goal.id}
                  className="bg-white/50 border border-dashed border-gray-200 p-6 rounded-[32px] flex items-center justify-between opacity-60 hover:opacity-100 transition-opacity"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 grayscale">
                      {getGoalIcon(goal.name)}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-primary">{goal.name}</h4>
                      <p className="text-[9px] font-bold text-text-soft uppercase tracking-widest">
                        Deleted: {goal.deleteReason || 'No reason'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onUpdateGoal({ ...goal, status: 'ACTIVE', deletedAt: undefined })}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/5 hover:bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    <RefreshCw size={14} />
                    <span>Restore</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-16">
          <div className="flex justify-between items-center mb-8 px-2">
            <div className="flex items-center gap-2">
              <ShoppingBag size={16} className="text-accent" />
              <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em]">Lifestyle Mini Goals</h3>
            </div>
            <button 
              onClick={() => onNavigate('smart-mini-goal-questions')}
              className="flex items-center gap-2 text-accent font-black text-[10px] uppercase tracking-widest bg-accent/5 px-4 py-2 rounded-xl border border-accent/10 hover:bg-accent/10 transition-all"
            >
              <Sparkles size={12} />
              <span>AI Engine</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {(Array.isArray(user.miniGoals) ? user.miniGoals : []).filter(g => g.status !== 'DELETED').length === 0 ? (
              <div className="text-center py-8 bg-bg-main rounded-[32px] border-2 border-dashed border-gray-100">
                <p className="text-[10px] font-bold text-text-soft uppercase tracking-widest">No mini goals yet</p>
              </div>
            ) : (
              (Array.isArray(user.miniGoals) ? user.miniGoals : []).filter(g => g.status !== 'DELETED').map((goal, i) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white rounded-[28px] p-3 shadow-lg shadow-primary/5 border border-gray-50 group cursor-pointer overflow-hidden relative"
                >
                  <div className="flex gap-4" onClick={() => onNavigate('mini-goal-detail', goal.id)}>
                    <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-inner">
                      <img src={goal.image} alt={goal.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 py-2 pr-2 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-black text-primary">{goal.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-accent">₹{(goal.target || 0).toLocaleString('en-IN')}</span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMiniGoalMenu(activeMiniGoalMenu === goal.id ? null : goal.id);
                              }}
                              className="p-1 hover:bg-gray-100 rounded-full text-text-soft"
                            >
                              <MoreVertical size={14} />
                            </button>
                          </div>
                        </div>
                        <p className="text-[9px] font-bold text-text-soft uppercase tracking-widest mb-3">{goal.category}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="w-full h-2 bg-bg-main rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(goal.current / goal.target) * 100}%` }}
                            className="h-full bg-accent rounded-full" 
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] font-black text-text-soft uppercase tracking-widest">₹{(goal.target - goal.current || 0).toLocaleString('en-IN')} Left</span>
                          <span className="text-[8px] font-black text-primary uppercase tracking-widest">{Math.round((goal.current / goal.target) * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {activeMiniGoalMenu === goal.id && (
                    <div className="absolute top-10 right-4 bg-white shadow-2xl rounded-2xl border border-gray-100 py-2 z-20 min-w-[120px]">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMiniGoalMenu(null);
                          onNavigate('smart-mini-goal-questions', goal.id);
                        }}
                        className="w-full px-4 py-2 text-left text-[10px] font-black uppercase tracking-widest text-primary hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Edit3 size={12} className="text-accent" />
                        Edit
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMiniGoalMenu(null);
                          onUpdateMiniGoal({ ...goal, status: goal.status === 'PAUSED' ? 'ACTIVE' : 'PAUSED' });
                        }}
                        className="w-full px-4 py-2 text-left text-[10px] font-black uppercase tracking-widest text-primary hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Archive size={12} className="text-blue-500" />
                        {goal.status === 'PAUSED' ? 'Resume' : 'Pause'}
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMiniGoalMenu(null);
                          setShowDeleteMiniGoalModal(goal.id);
                        }}
                        className="w-full px-4 py-2 text-left text-[10px] font-black uppercase tracking-widest text-error hover:bg-error/5 flex items-center gap-2"
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>

          <DeleteMiniGoalModal 
            isOpen={!!showDeleteMiniGoalModal}
            onClose={() => setShowDeleteMiniGoalModal(null)}
            onConfirm={(reason, note) => {
              if (showDeleteMiniGoalModal) {
                onDeleteMiniGoal(showDeleteMiniGoalModal, reason, note);
              }
              setShowDeleteMiniGoalModal(null);
            }}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 mt-12">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('smart-discovery')}
            className="w-full bg-primary text-white py-10 rounded-[40px] font-black flex flex-col items-center justify-center gap-4 shadow-2xl shadow-primary/30 relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform">
              <Sparkles size={32} className="text-accent" />
            </div>
            <div className="text-center">
              <span className="text-xs uppercase tracking-[0.3em] block mb-1">Start AI Smart</span>
              <span className="text-xl uppercase tracking-widest block">Goal Discovery</span>
            </div>
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowModal(true)}
            className="w-full border-2 border-dashed border-gray-200 text-text-soft py-10 rounded-[40px] font-bold flex flex-col items-center justify-center gap-4 hover:border-accent hover:text-accent transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-bg-main flex items-center justify-center group-hover:bg-accent/10 transition-colors">
              <Plus size={28} />
            </div>
            <span className="text-xs uppercase tracking-[0.2em]">Add Custom Financial Goal</span>
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-primary">Add New Goal</h3>
                <button onClick={() => setShowModal(false)} className="p-2 bg-bg-soft rounded-full"><X size={20} /></button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Goal Name</label>
                  <select 
                    value={newGoal.name}
                    onChange={(e) => setNewGoal({...newGoal, name: e.target.value})}
                    className="w-full bg-bg-soft border-none rounded-2xl px-4 py-3 text-sm"
                  >
                    <option>Emergency Fund</option>
                    <option>Buy Home</option>
                    <option>Child Education</option>
                    <option>Retirement</option>
                    <option>Vacation</option>
                    <option>Vehicle</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Target Amount (Rs)</label>
                  <input 
                    type="number"
                    value={newGoal.target || ''}
                    onChange={(e) => setNewGoal({...newGoal, target: parseInt(e.target.value)})}
                    placeholder="e.g. 500000"
                    className="w-full bg-bg-soft border-none rounded-2xl px-4 py-3 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Timeline (Years)</label>
                  <input 
                    type="number"
                    value={newGoal.timeline || ''}
                    onChange={(e) => setNewGoal({...newGoal, timeline: parseInt(e.target.value)})}
                    placeholder="e.g. 5"
                    className="w-full bg-bg-soft border-none rounded-2xl px-4 py-3 text-sm"
                  />
                </div>
                <button 
                  onClick={handleAddGoal}
                  className="w-full btn-accent py-4 rounded-2xl font-bold text-lg mt-4"
                >
                  Save Goal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const RecurringBillsSection = ({ user, onUpdateExpenses }: { user: UserProfile, onUpdateExpenses: (expenses: RecurringExpense[]) => void }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBill, setNewBill] = useState<Partial<RecurringExpense>>({
    name: '',
    amount: 0,
    category: 'Subscription',
    dueDate: 1,
    isAutoDeduct: false,
    hasReminder: true
  });

  const handleAddBill = () => {
    if (newBill.name && newBill.amount) {
      const bill: RecurringExpense = {
        id: Math.random().toString(36).substr(2, 9),
        name: newBill.name,
        amount: Number(newBill.amount),
        category: (newBill.category as any) || 'Other',
        dueDate: Number(newBill.dueDate),
        isAutoDeduct: !!newBill.isAutoDeduct,
        hasReminder: !!newBill.hasReminder
      };
      onUpdateExpenses([...(user.recurringExpenses || []), bill]);
      setShowAddModal(false);
      setNewBill({ name: '', amount: 0, category: 'Subscription', dueDate: 1, isAutoDeduct: false, hasReminder: true });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Rent': return <Home size={18} />;
      case 'Subscription': return <Tv size={18} />;
      case 'EMI': return <CreditCard size={18} />;
      case 'Utility': return <Zap size={18} />;
      default: return <Receipt size={18} />;
    }
  };

  return (
    <div className="card mb-8">
      <div className="flex justify-between items-center mb-6">
        <h4 className="heading-section">RECURRING EXPENSES</h4>
        <button 
          onClick={() => setShowAddModal(true)}
          className="text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-1"
        >
          <Plus size={14} /> Add New
        </button>
      </div>

      <div className="space-y-4">
        {(user.recurringExpenses || []).length > 0 ? (
          (user.recurringExpenses || []).map((bill) => (
            <div key={bill.id} className="flex items-center justify-between p-4 bg-bg-main rounded-2xl border border-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm border border-gray-100">
                  {getCategoryIcon(bill.category)}
                </div>
                <div>
                  <p className="text-sm font-bold text-primary">{bill.name}</p>
                  <p className="text-[10px] text-text-soft font-bold uppercase tracking-wider">Due on {bill.dueDate}{bill.dueDate === 1 ? 'st' : bill.dueDate === 2 ? 'nd' : bill.dueDate === 3 ? 'rd' : 'th'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-primary">₹{(bill.amount || 0).toLocaleString('en-IN')}</p>
                {bill.isAutoDeduct && (
                  <span className="text-[8px] font-bold text-success uppercase tracking-widest bg-success/10 px-1.5 py-0.5 rounded">Auto</span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 bg-bg-main rounded-2xl border border-dashed border-gray-200">
            <AlertCircle size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-text-soft font-bold uppercase tracking-widest">No recurring bills</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-primary/40 backdrop-blur-sm p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-md rounded-t-[40px] p-8 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
              <h3 className="text-xl font-bold text-primary mb-8 text-center">Add Recurring Bill</h3>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="label-caps">Bill Name</label>
                  <input 
                    type="text" 
                    className="input-field"
                    placeholder="e.g. Netflix, Rent, Home Loan"
                    value={newBill.name}
                    onChange={e => setNewBill({...newBill, name: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="label-caps">Amount (₹)</label>
                    <input 
                      type="number" 
                      className="input-field"
                      placeholder="0"
                      value={newBill.amount || ''}
                      onChange={e => setNewBill({...newBill, amount: Number(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="label-caps">Due Date (1-31)</label>
                    <input 
                      type="number" 
                      className="input-field"
                      placeholder="1"
                      min="1"
                      max="31"
                      value={newBill.dueDate || ''}
                      onChange={e => setNewBill({...newBill, dueDate: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="label-caps">Category</label>
                  <select 
                    className="input-field"
                    value={newBill.category}
                    onChange={e => setNewBill({...newBill, category: e.target.value as any})}
                  >
                    <option value="Rent">Rent</option>
                    <option value="Subscription">Subscription</option>
                    <option value="EMI">EMI</option>
                    <option value="Utility">Utility</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="flex gap-4 pt-4">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="autoDeduct"
                      className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                      checked={newBill.isAutoDeduct}
                      onChange={e => setNewBill({...newBill, isAutoDeduct: e.target.checked})}
                    />
                    <label htmlFor="autoDeduct" className="text-xs font-bold text-primary uppercase tracking-wider">Auto-Deduct</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="reminder"
                      className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                      checked={newBill.hasReminder}
                      onChange={e => setNewBill({...newBill, hasReminder: e.target.checked})}
                    />
                    <label htmlFor="reminder" className="text-xs font-bold text-primary uppercase tracking-wider">Reminder</label>
                  </div>
                </div>

                <button 
                  onClick={handleAddBill}
                  className="btn-accent w-full py-4 mt-4"
                >
                  ADD BILL
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CreditHealthReportModal = ({ isOpen, onClose, score }: { isOpen: boolean, onClose: () => void, score: number }) => {
  if (!isOpen) return null;

  const factors = [
    { name: 'Payment History', weight: '35%', status: 'Excellent', color: 'bg-success' },
    { name: 'Credit Utilization', weight: '30%', status: 'Good', color: 'bg-accent' },
    { name: 'Credit Age', weight: '15%', status: 'Average', color: 'bg-primary' },
    { name: 'Credit Mix', weight: '10%', status: 'Good', color: 'bg-accent' },
    { name: 'New Credit', weight: '10%', status: 'Excellent', color: 'bg-success' }
  ];

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-0 bg-bg-main z-[100] flex flex-col"
      >
        <div className="p-6 flex items-center justify-between bg-white border-b border-gray-100">
          <h2 className="text-xl font-bold text-primary">Credit Health Report</h2>
          <button onClick={onClose} className="p-2 bg-bg-soft rounded-full"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="card bg-primary text-white p-8 text-center mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20" />
            <p className="label-caps text-white/60 mb-4">Your Credit Score</p>
            <div className="text-6xl font-black mb-2">{score}</div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-success/20 text-success rounded-full border border-success/30">
              <ShieldCheck size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Excellent Health</span>
            </div>
            <p className="mt-6 text-xs text-white/40 italic">Last updated: 28 March 2026 via Experian</p>
          </div>

          <div className="card mb-8">
            <h4 className="heading-section mb-6">SCORE BREAKDOWN</h4>
            <div className="space-y-6">
              {factors.map((f, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary">{f.name}</span>
                      <span className="text-[8px] font-bold text-text-soft uppercase tracking-tighter">Weight: {f.weight}</span>
                    </div>
                    <span className={cn("text-[10px] font-bold uppercase", f.status === 'Excellent' ? 'text-success' : f.status === 'Good' ? 'text-accent' : 'text-primary')}>
                      {f.status}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", f.color)} style={{ width: f.status === 'Excellent' ? '95%' : f.status === 'Good' ? '75%' : '50%' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card bg-accent/5 border-accent/20 mb-8">
            <h4 className="heading-section text-accent mb-4">RECOMMENDATIONS</h4>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center flex-shrink-0 text-[10px] font-bold">1</div>
                <p className="text-xs text-primary leading-relaxed">Your credit utilization is at 28%. Reducing it below 20% could boost your score by ~15 points.</p>
              </li>
              <li className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center flex-shrink-0 text-[10px] font-bold">2</div>
                <p className="text-xs text-primary leading-relaxed">You have 3 active credit cards. Avoid applying for new credit for the next 6 months.</p>
              </li>
            </ul>
          </div>

          <div className="card">
            <h4 className="heading-section mb-4">NEXT PAYMENT DUE</h4>
            <div className="flex items-center justify-between p-4 bg-bg-soft rounded-2xl">
              <div>
                <p className="text-xs font-bold text-primary">HDFC Home Loan EMI</p>
                <p className="text-[10px] text-text-soft font-bold uppercase">Due in 4 Days</p>
              </div>
              <p className="text-base font-bold text-alert">₹42,500</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border-t border-gray-100">
          <button onClick={onClose} className="btn-primary w-full py-4 shadow-xl shadow-primary/20">
            GOT IT, THANKS
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const ReportScreen = ({ user, onUpdateBudgets, onUpdateExpenses, onNavigate }: { user: UserProfile, onUpdateBudgets: (budgets: any[]) => void, onUpdateExpenses: (expenses: RecurringExpense[]) => void, onNavigate: (tab: Tab) => void }) => {
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleSendEmailReport = async () => {
    setIsSendingEmail(true);
    setEmailStatus('sending');
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: user.email,
          subject: 'Your FinPath Financial Health Report',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #0d9488;">FinPath Financial Health Report</h2>
              <p>Hello ${user.name},</p>
              <p>Here is a summary of your financial health as of ${new Date().toLocaleDateString()}:</p>
              
              <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Wealth Score: ${user.financialHealthScore || 78}</h3>
                <p><strong>Net Worth:</strong> ₹${(metrics.netWorth || 0).toLocaleString('en-IN')}</p>
                <p><strong>Monthly Surplus:</strong> ₹${(metrics.surplus || 0).toLocaleString('en-IN')}</p>
                <p><strong>Savings Rate:</strong> ${Math.round(metrics.savingsRatio)}%</p>
              </div>

              <h4>Money Persona: ${user.persona}</h4>
              <p>Keep building your wealth with FinPath!</p>
              
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #64748b;">This is an automated report from your FinPath app.</p>
            </div>
          `
        }),
      });

      if (response.ok) {
        setEmailStatus('success');
      } else {
        setEmailStatus('error');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setEmailStatus('error');
    } finally {
      setIsSendingEmail(false);
      setTimeout(() => setEmailStatus('idle'), 3000);
    }
  };

  const metrics = calculateMetrics(user.profilingData || {});
  
  const surplus = metrics.surplus;
  const savingsRate = Math.round(metrics.savingsRatio);
  const debtRate = Math.round(metrics.emiBurden);
  const expenseRate = 100 - savingsRate - debtRate;

  const cashFlowData = [
    { name: 'Savings', value: Math.max(0, surplus), color: '#0d9488' },
    { name: 'Debt', value: metrics.mandatoryExpenses, color: '#f5a623' },
    { name: 'Expenses', value: metrics.totalExpenses - metrics.mandatoryExpenses, color: '#ef4444' }
  ];

  const assetData = Object.entries(user.profilingData?.capturedAssets || {}).map(([key, val]: [string, any]) => {
    const question = PROFILING_QUESTIONS.find(q => q.id === 'asset-capture');
    const opt = question?.options?.find(o => o.value === key);
    return { name: opt?.label || key, value: val.amount || 0 };
  }).filter(a => a.value > 0);

  const liabilityData = Object.entries(user.profilingData?.capturedLiabilities || {}).map(([key, val]: [string, any]) => {
    const question = PROFILING_QUESTIONS.find(q => q.id === 'liability-capture');
    const opt = question?.options?.find(o => o.value === key);
    return { name: opt?.label || key, value: val.amount || 0 };
  }).filter(l => l.value > 0);

  return (
    <div className="flex-1 overflow-y-auto pb-24 bg-bg-main">
      <Header title="Financial Health" />
      
      <div className="p-6">
        <div className="flex justify-end mb-4">
          <button 
            onClick={handleSendEmailReport}
            disabled={isSendingEmail}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              emailStatus === 'success' ? "bg-success text-white" : 
              emailStatus === 'error' ? "bg-error text-white" :
              "bg-white border border-gray-100 text-primary hover:bg-gray-50"
            )}
          >
            {emailStatus === 'sending' ? (
              <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            ) : emailStatus === 'success' ? (
              <Check size={14} />
            ) : emailStatus === 'error' ? (
              <AlertCircle size={14} />
            ) : (
              <Mail size={14} />
            )}
            {emailStatus === 'sending' ? 'Sending...' : 
             emailStatus === 'success' ? 'Sent!' : 
             emailStatus === 'error' ? 'Failed' : 
             'Email Report'}
          </button>
        </div>

        {user.persona && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card bg-accent/5 border-accent/20 p-6 mb-8 flex items-center gap-5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Award size={64} className="text-accent" />
            </div>
            <div className="w-16 h-16 bg-accent text-white rounded-[24px] flex items-center justify-center shadow-lg shadow-accent/20 flex-shrink-0 border-4 border-white">
              <Zap size={32} strokeWidth={3} />
            </div>
            <div className="relative z-10">
              <p className="label-caps text-accent mb-1">Your Money Persona</p>
              <h3 className="text-xl font-black text-primary leading-tight">{user.persona}</h3>
              <p className="text-[10px] font-bold text-text-soft uppercase tracking-widest mt-1">Based on your behavior & goals</p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 gap-6 mb-8">
          <div className="card bg-primary text-white p-8 relative overflow-hidden shadow-2xl shadow-primary/30 rounded-[40px]">
            <div className="absolute -top-6 -right-6 p-6 opacity-10 rotate-12">
              <PieChart size={120} />
            </div>
            <div className="relative z-10">
              <p className="label-caps text-white/60 mb-2">Wealth Score</p>
              <h3 className="text-5xl font-black mb-4">{user.financialHealthScore || 78}</h3>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/10 p-3 rounded-xl inline-flex backdrop-blur-md border border-white/10">
                <TrendingUp size={14} />
                <span>Top 15% of your peers</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="card p-5 bg-white border border-gray-100">
              <p className="label-caps text-text-soft mb-1">Net Worth</p>
              <h4 className="text-lg font-black text-primary">₹{(metrics.netWorth || 0).toLocaleString('en-IN')}</h4>
            </div>
            <div className="card p-5 bg-white border border-gray-100">
              <p className="label-caps text-text-soft mb-1">Monthly Surplus</p>
              <h4 className="text-lg font-black text-success">₹{(metrics.surplus || 0).toLocaleString('en-IN')}</h4>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Cash Flow Section */}
          <div className="card">
            <h4 className="heading-section mb-6">CASH FLOW HEALTH</h4>
            <div className="flex flex-col items-center">
              <div className="w-48 h-48 relative mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={cashFlowData}
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {cashFlowData.map((entry, index) => (
                        <ReCell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </RePieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-primary">{savingsRate}%</span>
                  <span className="text-[8px] text-text-soft uppercase font-bold tracking-widest">Savings Rate</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 w-full">
                {cashFlowData.map((item, i) => (
                  <div key={i} className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[8px] font-bold text-text-soft uppercase tracking-widest">{item.name}</span>
                    </div>
                    <p className="text-xs font-bold text-primary">₹{(item.value / 1000).toFixed(1)}k</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Assets Section */}
          <div className="card">
            <h4 className="heading-section mb-6">ASSET ALLOCATION</h4>
            {assetData.length > 0 ? (
              <div className="space-y-4">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={assetData} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#0d9488" radius={[0, 10, 10, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="p-4 bg-bg-main rounded-2xl border border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-text-soft uppercase tracking-widest">Total Assets</span>
                    <span className="text-sm font-black text-primary">₹{(metrics.totalAssets || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-bg-main rounded-[32px] border-2 border-dashed border-gray-100">
                <p className="text-xs font-bold text-text-soft uppercase tracking-widest">No assets recorded</p>
              </div>
            )}
          </div>

          {/* Risk Profile */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-4">
                <Zap size={24} />
              </div>
              <p className="label-caps text-text-soft mb-1">Risk Willingness</p>
              <h4 className="text-xl font-black text-primary">{Math.round(metrics.riskWillingnessScore)}%</h4>
              <p className="text-[8px] font-bold text-accent uppercase tracking-widest mt-1">
                {metrics.riskWillingnessScore > 70 ? 'Aggressive' : metrics.riskWillingnessScore > 40 ? 'Moderate' : 'Conservative'}
              </p>
            </div>
            <div className="card p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Shield size={24} />
              </div>
              <p className="label-caps text-text-soft mb-1">Risk Capacity</p>
              <h4 className="text-xl font-black text-primary">{Math.round(metrics.riskCapacityScore)}%</h4>
              <p className="text-[8px] font-bold text-primary uppercase tracking-widest mt-1">
                {metrics.riskCapacityScore > 70 ? 'High' : metrics.riskCapacityScore > 40 ? 'Medium' : 'Low'}
              </p>
            </div>
          </div>

          {/* Protection & Knowledge */}
          <div className="card">
            <div className="grid grid-cols-2 gap-8">
              <div className="text-center">
                <p className="label-caps text-text-soft mb-3">Protection</p>
                <div className="relative w-24 h-24 mx-auto">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path className="text-gray-100" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                    <path className="text-success" strokeDasharray={`${Object.keys(user.profilingData?.capturedInsurance || {}).length * 20}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-black text-primary">{Object.keys(user.profilingData?.capturedInsurance || {}).length}/5</span>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className="label-caps text-text-soft mb-3">Money IQ</p>
                <div className="relative w-24 h-24 mx-auto">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path className="text-gray-100" strokeDasharray="100, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                    <path className="text-accent" strokeDasharray={`${metrics.knowledgeScore}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-black text-primary">{metrics.knowledgeScore}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Readiness */}
          <div className="card p-8 bg-gradient-to-br from-primary to-primary-dark text-white text-center">
            <p className="label-caps text-white/60 mb-2">Emergency Readiness</p>
            <h3 className="text-4xl font-black mb-2">{user.profilingData?.emergencyReserve || 0} Months</h3>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">of essential expenses covered</p>
            <div className="mt-6 h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent transition-all duration-1000" 
                style={{ width: `${Math.min(100, (user.profilingData?.emergencyReserve || 0) / 6 * 100)}%` }} 
              />
            </div>
          </div>
        </div>

        <div className="mt-12 space-y-4">
          <button 
            onClick={() => onNavigate('universal-report')}
            className="w-full bg-white border border-gray-100 text-primary py-6 rounded-[32px] font-black text-xs tracking-widest shadow-sm flex items-center justify-center gap-3 hover:bg-gray-50 transition-all"
          >
            <FileText size={18} className="text-accent" />
            VIEW FULL PDF REPORT
          </button>
          
          <button 
            onClick={() => onNavigate('goals')}
            className="w-full bg-primary text-white py-6 rounded-[32px] font-black text-xs tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
          >
            <TrendingUp size={18} className="text-accent" />
            START BUILDING GOALS
          </button>
        </div>
      </div>
    </div>
  );
};

const FinancialQuiz = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const questions = [
    {
      question: "What is the maximum tax-saving limit under Section 80C of the Income Tax Act?",
      options: ["₹1,00,000", "₹1,50,000", "₹2,00,000", "₹2,50,000"],
      answer: 1,
      explanation: "Section 80C allows a maximum deduction of ₹1.5 Lakhs per year from your taxable income."
    },
    {
      question: "Which of these investment options is fully tax-free on maturity (EEE status)?",
      options: ["Fixed Deposit", "Public Provident Fund (PPF)", "National Savings Certificate", "Equity Mutual Funds"],
      answer: 1,
      explanation: "PPF follows the Exempt-Exempt-Exempt (EEE) model, meaning the investment, interest, and maturity amount are all tax-free."
    },
    {
      question: "What is the recommended size for an Emergency Fund?",
      options: ["1 month of expenses", "2 months of expenses", "3-6 months of expenses", "1 year of expenses"],
      answer: 2,
      explanation: "Financial experts recommend keeping 3 to 6 months of essential expenses in a highly liquid account for emergencies."
    },
    {
      question: "What does SIP stand for in the context of Mutual Funds?",
      options: ["Safe Investment Plan", "Systematic Investment Plan", "Secure Income Program", "Stock Investment Portfolio"],
      answer: 1,
      explanation: "SIP stands for Systematic Investment Plan, which allows you to invest a fixed amount regularly in mutual funds."
    },
    {
      question: "Which type of insurance is mandatory for all vehicle owners in India?",
      options: ["Comprehensive Insurance", "Personal Accident Cover", "Third-party Insurance", "Zero Depreciation Cover"],
      answer: 2,
      explanation: "Third-party insurance is legally mandatory for all vehicles plying on Indian roads under the Motor Vehicles Act."
    }
  ];

  const handleAnswerClick = (index: number) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(index);
    const correct = index === questions[currentQuestion].answer;
    setIsCorrect(correct);
    if (correct) setScore(score + 1);

    setTimeout(() => {
      if (currentQuestion + 1 < questions.length) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setIsCorrect(null);
      } else {
        setShowScore(true);
      }
    }, 2500);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setShowScore(false);
    setSelectedAnswer(null);
    setIsCorrect(null);
  };

  if (showScore) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card text-center p-10 bg-white shadow-2xl shadow-primary/10 rounded-[40px]"
      >
        <div className="w-24 h-24 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto mb-6">
          <Award size={48} />
        </div>
        <h3 className="text-3xl font-black text-primary mb-2">Quiz Complete!</h3>
        <p className="text-text-soft mb-8 font-bold uppercase tracking-widest text-xs">Your Score: {score} / {questions.length}</p>
        
        <div className="bg-bg-main p-6 rounded-3xl mb-8">
          <p className="text-sm text-primary leading-relaxed">
            {score === questions.length ? "Perfect! You're a financial wizard! 🧙‍♂️" : 
             score >= 3 ? "Great job! You have a solid understanding of basics. 👍" : 
             "Good start! Keep learning with our articles and videos. 📚"}
          </p>
        </div>

        <button 
          onClick={resetQuiz}
          className="w-full btn-accent py-5 shadow-2xl shadow-accent/30 text-sm font-black tracking-widest"
        >
          RETAKE QUIZ
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-2">
        <span className="label-caps text-text-soft">Question {currentQuestion + 1} of {questions.length}</span>
        <span className="text-xs font-black text-accent">{Math.round(((currentQuestion) / questions.length) * 100)}% Complete</span>
      </div>
      
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-8">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          className="h-full bg-accent transition-all duration-500"
        />
      </div>

      <div className="card bg-white p-8 shadow-xl border border-gray-100 min-h-[200px] flex flex-col justify-center">
        <h3 className="text-xl font-black text-primary leading-tight">{questions[currentQuestion].question}</h3>
      </div>

      <div className="space-y-4">
        {(questions[currentQuestion]?.options || []).map((option, index) => (
          <button
            key={index}
            disabled={selectedAnswer !== null}
            onClick={() => handleAnswerClick(index)}
            className={cn(
              "w-full p-6 rounded-3xl border-2 transition-all text-left flex items-center justify-between font-bold",
              selectedAnswer === null 
                ? "border-white bg-white text-primary shadow-primary/5 hover:border-accent/30" 
                : index === questions[currentQuestion].answer
                  ? "border-success bg-success/5 text-success shadow-success/10"
                  : selectedAnswer === index
                    ? "border-alert bg-alert/5 text-alert shadow-alert/10"
                    : "border-white bg-white text-text-soft opacity-50"
            )}
          >
            <span className="text-sm">{option}</span>
            {selectedAnswer !== null && index === questions[currentQuestion].answer && <Check size={20} />}
            {selectedAnswer === index && index !== questions[currentQuestion].answer && <X size={20} />}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {selectedAnswer !== null && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "p-6 rounded-3xl border-2 shadow-lg",
              isCorrect ? "bg-success/5 border-success/20 text-success" : "bg-alert/5 border-alert/20 text-alert"
            )}
          >
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-black uppercase tracking-widest mb-1">{isCorrect ? 'Correct!' : 'Not quite right'}</p>
                <p className="text-xs leading-relaxed opacity-90">{questions[currentQuestion].explanation}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LearnScreen = ({ onNavigate }: { onNavigate: (tab: Tab) => void }) => {
  const [activeSubTab, setActiveSubTab] = useState<'articles' | 'videos' | 'quiz'>('articles');

  const articles = [
    { title: 'Understanding the Rule of 72', cat: 'Investing', color: '#1a3a5c', img: 'https://picsum.photos/seed/finance1/400/200' },
    { title: 'How to Save ₹10k Extra', cat: 'Budgeting', color: '#0d9488', img: 'https://picsum.photos/seed/finance2/400/200' },
    { title: 'EPF vs VPF: Which is better?', cat: 'Tax', color: '#f5a623', img: 'https://picsum.photos/seed/finance3/400/200' },
    { title: 'Buying your first Home in Chennai', cat: 'Goals', color: '#ef4444', img: 'https://picsum.photos/seed/finance4/400/200' },
    { title: 'Debt Trap: How to escape', cat: 'Debt', color: '#1a3a5c', img: 'https://picsum.photos/seed/finance5/400/200' }
  ];

  const videos = [
    { title: 'FinPath Masterclass: Your First ₹10 Lakh', badge: 'BEGINNER', time: '12:45' },
    { title: 'Mutual Funds for Busy Professionals', badge: 'INTERMEDIATE', time: '08:20' },
    { title: 'Tax Saving Hacks 2026', badge: 'QUICK TIP', time: '04:15' },
    { title: 'The Power of SIP', badge: 'BEGINNER', time: '10:30' },
    { title: 'Retirement Planning Simplified', badge: 'INTERMEDIATE', time: '15:00' }
  ];

  return (
    <div className="flex-1 flex flex-col bg-bg-main overflow-y-auto pb-24">
      <Header title="Wealth Knowledge" rightElement={
        <button 
          onClick={() => onNavigate('advisor')} 
          className="bg-accent text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-accent/20"
        >
          Talk to Expert
        </button>
      } />
      
      <div className="p-6">
        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm mb-8 border border-gray-100">
          <button 
            onClick={() => setActiveSubTab('articles')}
            className={cn(
              "flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
              activeSubTab === 'articles' ? "bg-primary text-white shadow-xl shadow-primary/20" : "text-text-soft"
            )}
          >
            Articles
          </button>
          <button 
            onClick={() => setActiveSubTab('videos')}
            className={cn(
              "flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
              activeSubTab === 'videos' ? "bg-primary text-white shadow-xl shadow-primary/20" : "text-text-soft"
            )}
          >
            Videos
          </button>
          <button 
            onClick={() => setActiveSubTab('quiz')}
            className={cn(
              "flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
              activeSubTab === 'quiz' ? "bg-primary text-white shadow-xl shadow-primary/20" : "text-text-soft"
            )}
          >
            Quiz
          </button>
        </div>

        {activeSubTab === 'articles' ? (
          <div className="space-y-8">
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
              {['All', 'Investing', 'Budgeting', 'Tax', 'Goals', 'Debt'].map((cat) => (
                <button key={cat} className="flex-shrink-0 px-5 py-2 bg-white border border-gray-100 rounded-full text-[10px] font-black text-text-soft hover:border-accent hover:text-accent transition-all uppercase tracking-widest">
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative rounded-[32px] overflow-hidden shadow-2xl shadow-primary/10 group aspect-[16/9]">
              <img src={articles[0].img} alt="Featured" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent p-8 flex flex-col justify-end">
                <span className="bg-accent text-white text-[10px] font-black px-3 py-1 rounded-full w-fit mb-3 uppercase tracking-widest shadow-lg">FEATURED</span>
                <h4 className="text-white font-black text-xl leading-tight">{articles[0]?.title}</h4>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="label-caps mb-4">Recent Reads</h4>
              {articles.slice(1).map((art, i) => (
                <div key={i} className="card flex gap-5 items-center p-4 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <img src={art.img} alt="Thumb" className="w-20 h-20 rounded-2xl object-cover shadow-sm" />
                  <div className="flex-1">
                    <span className="text-[9px] font-black px-2.5 py-1 rounded-lg mb-2 inline-block uppercase tracking-widest" style={{ backgroundColor: `${art.color}10`, color: art.color }}>
                      {art.cat}
                    </span>
                    <h5 className="font-black text-sm text-primary leading-tight">{art.title}</h5>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-bg-soft flex items-center justify-center text-primary/30">
                    <ChevronRight size={16} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeSubTab === 'videos' ? (
          <div className="space-y-8">
            <div className="relative rounded-[32px] overflow-hidden shadow-2xl shadow-primary/10 group aspect-[16/9]">
              <div className="absolute inset-0 bg-primary/40 flex items-center justify-center z-10 backdrop-blur-[2px]">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-2xl">
                  <PlayCircle size={48} className="text-white" />
                </div>
              </div>
              <img src="https://picsum.photos/seed/video1/400/200" alt="Featured Video" className="w-full h-full object-cover" />
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-primary/90 to-transparent">
                <h4 className="text-white font-black text-xl leading-tight">{videos[0]?.title}</h4>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="label-caps mb-4">Video Library</h4>
              {videos.slice(1).map((vid, i) => (
                <div key={i} className="card flex gap-5 items-center p-4 bg-white border border-gray-100 shadow-sm">
                  <div className="relative w-28 h-20 rounded-2xl overflow-hidden bg-bg-soft flex-shrink-0 shadow-sm">
                    <img src={`https://picsum.photos/seed/vid${i}/200/100`} alt="Thumb" className="w-full h-full object-cover opacity-90" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                      <PlayCircle size={28} className="text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[9px] font-black bg-bg-soft text-primary px-2 py-1 rounded-lg uppercase tracking-widest">
                        {vid.badge}
                      </span>
                      <div className="flex items-center gap-1.5 text-[9px] text-text-soft font-black uppercase tracking-widest">
                        <Clock size={12} />
                        {vid.time}
                      </div>
                    </div>
                    <h5 className="font-black text-sm text-primary leading-tight">{vid.title}</h5>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <FinancialQuiz />
        )}
      </div>
    </div>
  );
};

const AdvisorScreen = ({ onBack }: { onBack: () => void }) => {
  const chartData = [
    { year: '2021', return: 12.5 },
    { year: '2022', return: 14.8 },
    { year: '2023', return: 18.2 },
    { year: '2024', return: 15.2 },
    { year: '2025', return: 16.5 }
  ];

  return (
    <div className="flex-1 overflow-y-auto pb-24">
      <Header title="Your Human Advisor" showBack onBack={onBack} />
      <div className="p-6">
        <div className="card mb-6 flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-primary rounded-full mb-4 overflow-hidden border-4 border-bg-soft shadow-lg">
            <img src="https://i.pravatar.cc/150?u=rajesh" alt="Advisor" className="w-full h-full object-cover" />
          </div>
          <h3 className="text-xl font-bold text-primary">Rajesh Menon, CFP</h3>
          <p className="text-sm text-gray-500 mb-4">Certified Financial Planner</p>
          
          <div className="grid grid-cols-3 gap-4 w-full border-t border-gray-100 pt-4">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold">Exp</p>
              <p className="text-sm font-bold text-primary">12 Yrs</p>
            </div>
            <div className="border-x border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase font-bold">Clients</p>
              <p className="text-sm font-bold text-primary">87</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold">Avg Return</p>
              <p className="text-sm font-bold text-success">15.2%</p>
            </div>
          </div>
        </div>

        <div className="card mb-6">
          <h4 className="font-bold text-primary mb-4">Portfolio Track Record</h4>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="year" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="return" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <ReCell key={`cell-${index}`} fill={index === 4 ? '#E8A020' : '#1B4F72'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <button className="w-full btn-primary py-4 flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
            <Calendar size={20} />
            Book a Free Call
          </button>
          <button className="w-full border-2 border-primary text-primary py-4 rounded-xl font-bold flex items-center justify-center gap-2">
            <MessageSquare size={20} />
            Send Message
          </button>
        </div>
      </div>
    </div>
  );
};

const SIPCalculatorScreen = ({ onBack }: { onBack: () => void }) => {
  const [monthlyInvestment, setMonthlyInvestment] = useState(5000);
  const [annualReturn, setAnnualReturn] = useState(12);
  const [tenure, setTenure] = useState(10);

  const calculateFV = () => {
    const P = monthlyInvestment;
    const i = annualReturn / 12 / 100;
    const n = tenure * 12;
    
    if (i === 0) return P * n;
    
    // FV = P * [((1 + i)^n - 1) / i] * (1 + i)
    const fv = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    return Math.round(fv);
  };

  const totalInvestment = monthlyInvestment * tenure * 12;
  const futureValue = calculateFV();
  const estimatedReturns = futureValue - totalInvestment;

  return (
    <div className="flex-1 flex flex-col bg-bg-main overflow-y-auto pb-24">
      <Header title="SIP Calculator" showBack onBack={onBack} />

      <div className="p-6 space-y-8">
        <div className="card p-8 space-y-8 bg-white shadow-xl shadow-primary/5 border border-gray-100">
          <div>
            <div className="flex justify-between mb-4">
              <label className="label-caps text-text-soft">Monthly Investment</label>
              <span className="text-lg font-black text-primary">₹{(monthlyInvestment || 0).toLocaleString('en-IN')}</span>
            </div>
            <input 
              type="range" 
              min="500" 
              max="100000" 
              step="500"
              value={monthlyInvestment}
              onChange={(e) => setMonthlyInvestment(Number(e.target.value))}
              className="w-full h-2 bg-bg-soft rounded-lg appearance-none cursor-pointer accent-accent"
            />
          </div>

          <div>
            <div className="flex justify-between mb-4">
              <label className="label-caps text-text-soft">Expected Return (p.a)</label>
              <span className="text-lg font-black text-primary">{annualReturn}%</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="30" 
              step="0.5"
              value={annualReturn}
              onChange={(e) => setAnnualReturn(Number(e.target.value))}
              className="w-full h-2 bg-bg-soft rounded-lg appearance-none cursor-pointer accent-accent"
            />
          </div>

          <div>
            <div className="flex justify-between mb-4">
              <label className="label-caps text-text-soft">Tenure (Years)</label>
              <span className="text-lg font-black text-primary">{tenure} Years</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="40" 
              step="1"
              value={tenure}
              onChange={(e) => setTenure(Number(e.target.value))}
              className="w-full h-2 bg-bg-soft rounded-lg appearance-none cursor-pointer accent-accent"
            />
          </div>
        </div>

        <div className="card bg-primary text-white p-8 shadow-2xl shadow-primary/30 relative overflow-hidden">
          <div className="absolute -top-4 -right-4 p-4 opacity-10 rotate-12">
            <TrendingUp size={120} />
          </div>
          <p className="label-caps text-white/60 mb-2">Estimated Future Value</p>
          <h3 className="text-4xl font-black mb-8">₹{(futureValue || 0).toLocaleString('en-IN')}</h3>
          
          <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/10">
            <div>
              <p className="label-caps text-white/40 mb-1">Total Invested</p>
              <p className="text-lg font-black">₹{(totalInvestment || 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="text-right">
              <p className="label-caps text-white/40 mb-1">Total Returns</p>
              <p className="text-lg font-black text-accent">₹{(estimatedReturns || 0).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>

        <div className="bg-success/5 border-2 border-success/20 p-6 rounded-3xl flex items-start gap-4">
          <div className="w-10 h-10 bg-success/10 text-success rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingUp size={20} />
          </div>
          <p className="text-xs text-text-soft leading-relaxed">
            <span className="font-black text-primary">Pro Tip:</span> Increasing your SIP by just 10% every year can double your wealth in half the time.
          </p>
        </div>

      </div>
    </div>
  );
};

const SplitSaveHomeScreen = ({ user, onNavigate, onUpdateUser }: { user: UserProfile, onNavigate: (tab: Tab, id?: string) => void, onUpdateUser: (user: UserProfile) => void }) => {
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupMembers, setNewGroupMembers] = useState<{ name: string, email: string }[]>([{ name: '', email: '' }]);

  const groups = user.splitGroups || [];
  const currentUserId = user.id || 'me';

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    
    const members: SplitMember[] = [
      { id: currentUserId, name: user.name || 'You', isCurrentUser: true, avatar: `https://picsum.photos/seed/you/100/100`, email: user.email, inviteStatus: 'owner' },
      ...newGroupMembers.filter(m => m.name.trim()).map((m, i) => ({
        id: `m-${Date.now()}-${i}`,
        name: m.name.trim(),
        email: m.email.trim(),
        avatar: `https://picsum.photos/seed/${m.name}/100/100`,
        inviteStatus: m.email.trim() ? 'invited' : 'active' as any
      }))
    ];

    const newGroup: SplitGroup = {
      id: `g-${Date.now()}`,
      name: newGroupName,
      createdAt: new Date().toISOString(),
      members,
      expenses: [],
      settlements: [],
      activityLogs: [
        {
          id: `a-${Date.now()}`,
          groupId: '',
          type: 'group_created',
          message: `Group "${newGroupName}" created`,
          createdAt: new Date().toISOString()
        }
      ]
    };

    if (user.id) {
      try {
        const createdGroup = await databaseService.createSplitGroup(user.id, newGroup);
        newGroup.id = createdGroup.id;
        newGroup.activityLogs![0].groupId = createdGroup.id;
      } catch (error) {
        console.error('Error creating split group:', error);
      }
    }

    onUpdateUser({
      ...user,
      splitGroups: [...groups, newGroup]
    });
    
    setShowNewGroup(false);
    setNewGroupName('');
    setNewGroupMembers([{ name: '', email: '' }]);
  };

  const allSettlements = groups.flatMap(g => 
    g.settlements.map(s => ({ ...s, groupName: g.name }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="flex-1 overflow-y-auto pb-24 bg-bg-main">
      <div className="p-6 flex justify-between items-center sticky top-0 bg-bg-main/80 backdrop-blur-md z-30">
        <h2 className="text-2xl font-bold text-primary">Split & Save</h2>
        <button 
          onClick={() => setShowNewGroup(true)}
          className="bg-accent text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-accent/20 flex items-center gap-2"
        >
          <Plus size={16} />
          New Group
        </button>
      </div>
      
      <div className="px-6 space-y-8">
        {/* Total Balance Card */}
        {groups.length > 0 && (
          <div className="card bg-primary p-6 text-white shadow-xl shadow-primary/20">
            <div className="flex justify-between items-center mb-6">
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Total Balance</p>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <IndianRupee size={16} className="text-accent" />
              </div>
            </div>
            <div className="flex items-end gap-3 mb-4">
              <h3 className="text-4xl font-black">
                {formatCurrency(Math.abs(groups.reduce((acc, g) => acc + getUserNetPosition(g, currentUserId), 0)))}
              </h3>
              <p className="text-sm font-bold text-white/60 mb-1.5 uppercase tracking-widest">
                {groups.reduce((acc, g) => acc + getUserNetPosition(g, currentUserId), 0) >= 0 ? 'Owed to you' : 'You owe'}
              </p>
            </div>
            <div className="flex gap-4 pt-4 border-t border-white/10">
              <div className="flex-1">
                <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-1">You are owed</p>
                <p className="text-sm font-bold text-success">
                  {formatCurrency(groups.reduce((acc, g) => {
                    const pos = getUserNetPosition(g, currentUserId);
                    return pos > 0 ? acc + pos : acc;
                  }, 0))}
                </p>
              </div>
              <div className="flex-1">
                <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-1">You owe</p>
                <p className="text-sm font-bold text-alert">
                  {formatCurrency(Math.abs(groups.reduce((acc, g) => {
                    const pos = getUserNetPosition(g, currentUserId);
                    return pos < 0 ? acc + pos : acc;
                  }, 0)))}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-xs font-bold text-text-soft uppercase tracking-widest">Your Groups</h3>
          {groups.length === 0 ? (
            <div className="card p-10 text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-bg-soft rounded-full flex items-center justify-center text-text-soft">
                <Users size={32} />
              </div>
              <p className="text-sm text-text-soft font-medium">No groups yet. Create one to start splitting!</p>
            </div>
          ) : (
            groups.map((group) => {
              const netPosition = getUserNetPosition(group, currentUserId);
              const totalSpend = group.expenses.reduce((acc, exp) => acc + exp.amount, 0);
              
              return (
                <motion.div 
                  key={group.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onNavigate('split-detail', group.id)}
                  className="card p-5 cursor-pointer hover:border-accent transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-primary">{group.name}</h4>
                      <p className="text-[10px] text-text-soft font-bold uppercase tracking-wider">{group.members.length} Members</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{formatCurrency(totalSpend)}</p>
                      <p className="text-[10px] text-text-soft font-bold uppercase tracking-wider">Total Spend</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex -space-x-2">
                      {group.members.slice(0, 4).map((m, i) => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden shadow-sm">
                          <img src={m.avatar || `https://picsum.photos/seed/${m.name}/100/100`} alt={m.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        </div>
                      ))}
                      {group.members.length > 4 && (
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400 shadow-sm">
                          +{group.members.length - 4}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={cn("text-sm font-bold", netPosition > 0.01 ? "text-success" : netPosition < -0.01 ? "text-alert" : "text-text-soft")}>
                        {netPosition > 0.01 ? `You are owed ${formatCurrency(netPosition)}` : 
                         netPosition < -0.01 ? `You owe ${formatCurrency(Math.abs(netPosition))}` : 
                         'All settled up'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-bold text-text-soft uppercase tracking-widest">Recent Settlements</h3>
          {allSettlements.length === 0 ? (
            <div className="card p-6 text-center text-sm text-text-soft italic">
              No recent settlements
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              {allSettlements.slice(0, 5).map((s, i) => {
                const isPayer = s.payerId === currentUserId;
                const otherMemberId = isPayer ? s.receiverId : s.payerId;
                const group = groups.find(g => g.id === s.groupId);
                const otherMember = group?.members.find(m => m.id === otherMemberId);
                
                return (
                  <div key={i} className="flex items-center justify-between p-4 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-success">
                        <Check size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-primary">
                          {isPayer ? `Paid ${otherMember?.name || 'Someone'}` : `Received from ${otherMember?.name || 'Someone'}`}
                        </p>
                        <p className="text-[10px] text-text-soft font-bold uppercase tracking-wider">
                          {s.groupName} • {getRelativeTime(s.date)}
                        </p>
                      </div>
                    </div>
                    <p className={cn("text-sm font-bold", isPayer ? "text-alert" : "text-success")}>
                      {isPayer ? '-' : '+'}{formatCurrency(s.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* New Group Modal */}
      <AnimatePresence>
        {showNewGroup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] flex items-end justify-center p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-md rounded-t-[40px] p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-primary">New Group</h3>
                <button onClick={() => setShowNewGroup(false)} className="p-2 bg-bg-soft rounded-full"><X size={20} /></button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-text-soft uppercase tracking-widest mb-2 block">Group Name</label>
                  <input 
                    type="text" 
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g. Goa Trip 2026" 
                    className="w-full bg-bg-soft border-none rounded-2xl px-5 py-4 text-sm font-bold text-primary" 
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-text-soft uppercase tracking-widest mb-2 block">Members</label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-4 bg-bg-soft rounded-2xl opacity-60">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-white">Y</div>
                      <span className="text-sm font-bold text-primary">You (Myself)</span>
                    </div>
                    {newGroupMembers.map((m, i) => (
                      <div key={i} className="space-y-2 p-4 bg-bg-soft rounded-2xl">
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={m.name}
                            onChange={(e) => {
                              const updated = [...newGroupMembers];
                              updated[i].name = e.target.value;
                              setNewGroupMembers(updated);
                            }}
                            placeholder="Member Name" 
                            className="flex-1 bg-white border-none rounded-xl px-4 py-3 text-sm font-bold text-primary" 
                          />
                          {newGroupMembers.length > 1 && (
                            <button 
                              onClick={() => setNewGroupMembers(prev => prev.filter((_, idx) => idx !== i))}
                              className="p-2 text-alert"
                            >
                              <Trash2 size={20} />
                            </button>
                          )}
                        </div>
                        <input 
                          type="email" 
                          value={m.email}
                          onChange={(e) => {
                            const updated = [...newGroupMembers];
                            updated[i].email = e.target.value;
                            setNewGroupMembers(updated);
                          }}
                          placeholder="Email (optional to invite)" 
                          className="w-full bg-white border-none rounded-xl px-4 py-3 text-xs font-medium text-primary" 
                        />
                      </div>
                    ))}
                    <button 
                      onClick={() => setNewGroupMembers(prev => [...prev, { name: '', email: '' }])}
                      className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-xs font-bold text-text-soft flex items-center justify-center gap-2"
                    >
                      <Plus size={16} />
                      Add Another Member
                    </button>
                  </div>
                </div>

                <button 
                  onClick={handleCreateGroup}
                  disabled={!newGroupName.trim() || newGroupMembers.every(m => !m.trim())}
                  className="w-full btn-accent py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-accent/20 mt-4 disabled:opacity-50"
                >
                  Create Group
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const GroupDetailScreen = ({ group, user, onBack, onUpdateUser }: { group: SplitGroup, user: UserProfile, onBack: () => void, onUpdateUser: (user: UserProfile) => void }) => {
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'settle' | 'activity'>('expenses');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  
  // Add Expense State
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expPaidBy, setExpPaidBy] = useState(group.members[0].id);
  const [expSplitType, setExpSplitType] = useState<'EQUAL' | 'PERCENT' | 'AMOUNT' | 'SHARES'>('EQUAL');
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [participants, setParticipants] = useState<string[]>(group.members.map(m => m.id));

  // Settle State
  const [settlePayer, setSettlePayer] = useState('');
  const [settleReceiver, setSettleReceiver] = useState('');
  const [settleAmount, setSettleAmount] = useState('');
  const [settleNote, setSettleNote] = useState('');

  // Add Member State
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');

  const currentUserId = user.id || 'me';
  const balances = calculateGroupBalances(group);
  const netPosition = balances[currentUserId] || 0;
  const totalSpend = group.expenses.reduce((acc, exp) => acc + exp.amount, 0);
  const yourShare = group.expenses.reduce((acc, exp) => {
    const userSplit = exp.splits.find(s => s.memberId === currentUserId);
    return acc + (userSplit?.amount || 0);
  }, 0);

  const handleAddExpense = async () => {
    const amount = parseFloat(expAmount);
    if (!expDesc || isNaN(amount) || amount <= 0 || participants.length === 0) return;

    let splits: { memberId: string; amount: number; percent?: number; shares?: number }[] = [];
    const selectedMembers = group.members.filter(m => participants.includes(m.id));

    if (expSplitType === 'EQUAL') {
      const perPerson = amount / selectedMembers.length;
      splits = selectedMembers.map(m => ({ memberId: m.id, amount: perPerson }));
    } else if (expSplitType === 'AMOUNT') {
      splits = selectedMembers.map(m => ({ memberId: m.id, amount: parseFloat(customSplits[m.id] || '0') }));
      const sum = splits.reduce((acc, s) => acc + s.amount, 0);
      if (Math.abs(sum - amount) > 0.01) {
        alert(`Total splits (${sum}) must equal expense amount (${amount})`);
        return;
      }
    } else if (expSplitType === 'PERCENT') {
      splits = selectedMembers.map(m => {
        const percent = parseFloat(customSplits[m.id] || '0');
        return { memberId: m.id, amount: (amount * percent) / 100, percent };
      });
      const sumPercent = splits.reduce((acc, s) => acc + (s.percent || 0), 0);
      if (Math.abs(sumPercent - 100) > 0.01) {
        alert(`Total percentages must equal 100% (current: ${sumPercent}%)`);
        return;
      }
    } else if (expSplitType === 'SHARES') {
      const totalShares = selectedMembers.reduce((acc, m) => acc + parseFloat(customSplits[m.id] || '1'), 0);
      splits = selectedMembers.map(m => {
        const shares = parseFloat(customSplits[m.id] || '1');
        return { memberId: m.id, amount: (amount * shares) / totalShares, shares };
      });
    }

    const newExpense: SplitExpense = {
      id: `e-${Date.now()}`,
      description: expDesc,
      amount,
      date: new Date().toISOString().split('T')[0],
      paidByMemberId: expPaidBy,
      splitType: expSplitType as any,
      splits
    };

    if (user.id) {
      try {
        const createdExpense = await databaseService.addExpenseToGroup(group.id, newExpense);
        newExpense.id = createdExpense.id;
      } catch (error) {
        console.error('Error adding expense to group:', error);
      }
    }

    const payerName = group.members.find(m => m.id === expPaidBy)?.name || 'Someone';
    const newLog: ActivityLog = {
      id: `a-${Date.now()}`,
      groupId: group.id,
      type: 'expense_added',
      message: `${payerName} added "${expDesc}"`,
      createdAt: new Date().toISOString()
    };

    const updatedGroups = user.splitGroups?.map(g => 
      g.id === group.id ? { 
        ...g, 
        expenses: [newExpense, ...g.expenses],
        activityLogs: [newLog, ...(g.activityLogs || [])]
      } : g
    );

    onUpdateUser({ ...user, splitGroups: updatedGroups });
    setShowAddExpense(false);
    setExpDesc('');
    setExpAmount('');
    setCustomSplits({});
    setParticipants(group.members.map(m => m.id));
  };

  const handleDeleteExpense = (expenseId: string) => {
    const expense = group.expenses.find(e => e.id === expenseId);
    if (!expense) return;

    const newLog: ActivityLog = {
      id: `a-${Date.now()}-d`,
      groupId: group.id,
      type: 'expense_deleted',
      message: `Expense "${expense.description}" was deleted`,
      createdAt: new Date().toISOString()
    };

    const updatedGroups = user.splitGroups?.map(g => 
      g.id === group.id ? { 
        ...g, 
        expenses: g.expenses.filter(e => e.id !== expenseId),
        activityLogs: [newLog, ...(g.activityLogs || [])]
      } : g
    );

    onUpdateUser({ ...user, splitGroups: updatedGroups });
  };

  const handleRecordSettlement = async () => {
    const amount = parseFloat(settleAmount);
    if (!settlePayer || !settleReceiver || isNaN(amount) || amount <= 0) return;

    const newSettlement: SplitSettlement = {
      id: `s-${Date.now()}`,
      groupId: group.id,
      payerId: settlePayer,
      receiverId: settleReceiver,
      amount,
      date: new Date().toISOString(),
      note: settleNote || 'Settled up'
    };

    if (user.id) {
      try {
        const createdSettlement = await databaseService.addSettlementToGroup(group.id, {
          fromMemberId: settlePayer,
          toMemberId: settleReceiver,
          amount,
          date: newSettlement.date,
          note: newSettlement.note
        });
        newSettlement.id = createdSettlement.id;
      } catch (error) {
        console.error('Error adding settlement to group:', error);
      }
    }

    const payerName = group.members.find(m => m.id === settlePayer)?.name || 'Someone';
    const receiverName = group.members.find(m => m.id === settleReceiver)?.name || 'Someone';
    const newLog: ActivityLog = {
      id: `a-${Date.now()}-s`,
      groupId: group.id,
      type: 'settlement_recorded',
      message: `${payerName} paid ${receiverName} ${formatCurrency(amount)}`,
      createdAt: new Date().toISOString()
    };

    const updatedGroups = user.splitGroups?.map(g => 
      g.id === group.id ? { 
        ...g, 
        settlements: [newSettlement, ...g.settlements],
        activityLogs: [newLog, ...(g.activityLogs || [])]
      } : g
    );

    onUpdateUser({ ...user, splitGroups: updatedGroups });
    setShowSettleModal(false);
    setSettleAmount('');
    setSettleNote('');
  };

  const handleAddMember = async () => {
    if (!newMemberName.trim()) return;

    const newMember: SplitMember = {
      id: `u-${Date.now()}`,
      name: newMemberName,
      email: newMemberEmail,
      inviteStatus: newMemberEmail ? 'invited' : 'active' as any
    };

    if (user.id) {
      try {
        const createdMember = await databaseService.addMemberToGroup(group.id, {
          name: newMember.name,
          email: newMember.email,
          isUser: false
        });
        newMember.id = createdMember.id;
      } catch (error) {
        console.error('Error adding member to group:', error);
      }
    }

    const newLog: ActivityLog = {
      id: `a-${Date.now()}-m`,
      groupId: group.id,
      type: 'member_invited',
      message: `${newMemberName} was added to the group`,
      createdAt: new Date().toISOString()
    };

    const updatedGroups = user.splitGroups?.map(g => 
      g.id === group.id ? { 
        ...g, 
        members: [...g.members, newMember],
        activityLogs: [newLog, ...(g.activityLogs || [])]
      } : g
    );

    onUpdateUser({ ...user, splitGroups: updatedGroups });
    setShowAddMember(false);
    setNewMemberName('');
    setNewMemberEmail('');
  };

  const handleQuickSettle = (payerId: string, receiverId: string, amount: number) => {
    setSettlePayer(payerId);
    setSettleReceiver(receiverId);
    setSettleAmount(amount.toString());
    setShowSettleModal(true);
  };

  const whoOwesWhom = getWhoOwesWhom(balances, group.members);

  return (
    <div className="flex-1 overflow-y-auto pb-24 bg-bg-main">
      <div className="bg-primary text-white p-6 rounded-b-[40px] shadow-lg sticky top-0 z-30">
        <div className="flex justify-between items-center mb-8">
          <button onClick={onBack} className="p-2 bg-white/10 rounded-full"><ChevronLeft size={20} /></button>
          <h2 className="text-lg font-bold">{group.name}</h2>
          <div className="w-10" />
        </div>

        <div className="card bg-white/10 border-white/20 p-6 text-center mb-6 backdrop-blur-sm">
          <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-2">Your Balance</p>
          <h3 className="text-3xl font-black text-white mb-2">
            {netPosition > 0.01 ? `You are owed ${formatCurrency(netPosition)}` : 
             netPosition < -0.01 ? `You owe ${formatCurrency(Math.abs(netPosition))}` : 
             'All settled up'}
          </h3>
          <p className="text-[10px] font-bold text-accent uppercase tracking-widest">
            {netPosition > 0 ? 'Settling up will add this to your savings' : 'Pay back your friends to stay on track'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Total Group Spend</p>
            <p className="text-lg font-bold text-white">{formatCurrency(totalSpend)}</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Your Total Share</p>
            <p className="text-lg font-bold text-white">{formatCurrency(yourShare)}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex bg-bg-soft p-1 rounded-2xl border border-gray-100">
          {(['expenses', 'balances', 'settle', 'activity'] as const).map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-3 rounded-xl text-[10px] font-bold transition-all uppercase tracking-widest",
                activeTab === tab ? "bg-white text-primary shadow-sm" : "text-text-soft"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'expenses' && (
          <div className="space-y-4">
            <button 
              onClick={() => setShowAddExpense(true)}
              className="w-full bg-accent text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-accent/20 flex items-center justify-center gap-3"
            >
              <Plus size={24} />
              Add Expense
            </button>
            
            <div className="space-y-3">
              {group.expenses.length === 0 ? (
                <div className="card p-10 text-center text-sm text-text-soft italic">No expenses yet</div>
              ) : (
                group.expenses.map((exp) => (
                  <div key={exp.id} className="card p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-bg-main flex items-center justify-center text-primary">
                        {exp.description.toLowerCase().includes('food') || exp.description.toLowerCase().includes('lunch') ? <ShoppingBag size={20} /> : <Receipt size={20} />}
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-primary">{exp.description}</h5>
                        <p className="text-[10px] text-text-soft font-bold uppercase tracking-wider">
                          Paid by {group.members.find(m => m.id === exp.paidByMemberId)?.name} • {exp.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-sm font-bold text-primary">{formatCurrency(exp.amount)}</p>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteExpense(exp.id);
                        }}
                        className="p-2 text-text-soft hover:text-alert transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'balances' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-bold text-text-soft uppercase tracking-widest">Individual Balances</h4>
                <button 
                  onClick={() => setShowAddMember(true)}
                  className="text-accent text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"
                >
                  <Plus size={12} /> Add Member
                </button>
              </div>
              {group.members.map(member => {
                const bal = balances[member.id] || 0;
                return (
                  <div key={member.id} className="card p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden">
                        <img src={member.avatar || `https://picsum.photos/seed/${member.name}/100/100`} alt={member.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-sm font-bold text-primary">
                        {member.name} {member.isCurrentUser && '(You)'}
                        {member.inviteStatus === 'invited' && (
                          <span className="ml-2 px-1.5 py-0.5 bg-bg-soft text-[8px] text-text-soft rounded-md border border-gray-100">Invited</span>
                        )}
                      </span>
                    </div>
                    <p className={cn("text-sm font-bold", bal > 0.01 ? "text-success" : bal < -0.01 ? "text-alert" : "text-text-soft")}>
                      {bal > 0.01 ? `owed ${formatCurrency(bal)}` : bal < -0.01 ? `owes ${formatCurrency(Math.abs(bal))}` : 'settled'}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-text-soft uppercase tracking-widest">Suggested Settlements</h4>
              {whoOwesWhom.length === 0 ? (
                <div className="card p-6 text-center text-sm text-text-soft italic">Everyone is settled!</div>
              ) : (
                whoOwesWhom.map((tx, i) => {
                  const from = group.members.find(m => m.id === tx.from);
                  const to = group.members.find(m => m.id === tx.to);
                  return (
                    <div key={i} className="card p-4 flex items-center justify-between bg-bg-soft border-none">
                      <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        <span className="font-bold">{from?.name}</span>
                        <ArrowRight size={14} className="text-text-soft" />
                        <span className="font-bold">{to?.name}</span>
                      </div>
                      <p className="text-sm font-bold text-primary">{formatCurrency(tx.amount)}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'settle' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-[10px] font-bold text-text-soft uppercase tracking-widest">Record a Payment</h4>
              <button 
                onClick={() => {
                  setSettlePayer(group.members[0].id);
                  setSettleReceiver(group.members[1]?.id || group.members[0].id);
                  setSettleAmount('');
                  setShowSettleModal(true);
                }}
                className="text-accent text-[10px] font-bold uppercase tracking-widest"
              >
                Custom Settlement
              </button>
            </div>
            {whoOwesWhom.length === 0 ? (
              <div className="card p-10 text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center text-success">
                  <Check size={32} />
                </div>
                <p className="text-sm text-text-soft font-medium">All debts are settled in this group!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {whoOwesWhom.map((tx, i) => {
                  const from = group.members.find(m => m.id === tx.from);
                  const to = group.members.find(m => m.id === tx.to);
                  return (
                    <button 
                      key={i}
                      onClick={() => handleQuickSettle(tx.from, tx.to, tx.amount)}
                      className="card w-full p-4 flex items-center justify-between hover:border-success transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-success">
                          <IndianRupee size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-primary">{from?.name} paid {to?.name}</p>
                          <p className="text-[10px] text-text-soft font-bold uppercase tracking-wider">Tap to record settlement</p>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-success">{formatCurrency(tx.amount)}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-text-soft uppercase tracking-widest">Activity Feed</h4>
            {(group.activityLogs || []).length === 0 ? (
              <div className="card p-10 text-center text-sm text-text-soft italic">No activity yet</div>
            ) : (
              <div className="space-y-4">
                {(group.activityLogs || []).map((log) => (
                  <div key={log.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-white",
                        log.type === 'group_created' ? "bg-primary" :
                        log.type === 'expense_added' ? "bg-accent" :
                        log.type === 'settlement_recorded' ? "bg-success" : "bg-gray-400"
                      )}>
                        {log.type === 'group_created' ? <Users size={14} /> :
                         log.type === 'expense_added' ? <Receipt size={14} /> :
                         log.type === 'settlement_recorded' ? <Check size={14} /> : <Info size={14} />}
                      </div>
                      <div className="w-0.5 flex-1 bg-gray-100 my-1"></div>
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium text-primary leading-tight">{log.message}</p>
                      <p className="text-[10px] text-text-soft font-bold uppercase tracking-wider mt-1">{getRelativeTime(log.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showAddExpense && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] flex items-end justify-center p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-md rounded-t-[40px] p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-primary">Add Expense</h3>
                <button onClick={() => setShowAddExpense(false)} className="p-2 bg-bg-soft rounded-full"><X size={20} /></button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-text-soft uppercase tracking-widest mb-2 block">Description</label>
                  <input 
                    type="text" 
                    value={expDesc}
                    onChange={(e) => setExpDesc(e.target.value)}
                    placeholder="What was it for?" 
                    className="w-full bg-bg-soft border-none rounded-2xl px-5 py-4 text-sm font-bold text-primary" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-soft uppercase tracking-widest mb-2 block">Amount</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg font-bold text-text-soft">₹</span>
                    <input 
                      type="number" 
                      value={expAmount}
                      onChange={(e) => setExpAmount(e.target.value)}
                      placeholder="0.00" 
                      className="w-full bg-bg-soft border-none rounded-2xl pl-10 pr-5 py-4 text-xl font-bold text-primary" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-text-soft uppercase tracking-widest mb-2 block">Paid By</label>
                    <select 
                      value={expPaidBy}
                      onChange={(e) => setExpPaidBy(e.target.value)}
                      className="w-full bg-bg-soft border-none rounded-2xl px-5 py-4 text-sm font-bold text-primary appearance-none"
                    >
                      {group.members.map(m => (
                        <option key={m.id} value={m.id}>{m.name} {m.isCurrentUser && '(You)'}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-soft uppercase tracking-widest mb-2 block">Split Type</label>
                    <select 
                      value={expSplitType}
                      onChange={(e) => setExpSplitType(e.target.value as any)}
                      className="w-full bg-bg-soft border-none rounded-2xl px-5 py-4 text-sm font-bold text-primary appearance-none"
                    >
                      <option value="EQUAL">Equally</option>
                      <option value="AMOUNT">Custom Amount</option>
                      <option value="PERCENT">Percentage</option>
                      <option value="SHARES">Shares</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-text-soft uppercase tracking-widest mb-2 block">Participants</label>
                  <div className="flex flex-wrap gap-2">
                    {group.members.map(m => (
                      <button
                        key={m.id}
                        onClick={() => {
                          if (participants.includes(m.id)) {
                            setParticipants(prev => prev.filter(id => id !== m.id));
                          } else {
                            setParticipants(prev => [...prev, m.id]);
                          }
                        }}
                        className={cn(
                          "px-3 py-2 rounded-xl text-[10px] font-bold transition-all border",
                          participants.includes(m.id) 
                            ? "bg-primary text-white border-primary" 
                            : "bg-bg-soft text-text-soft border-transparent"
                        )}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                </div>

                {expSplitType !== 'EQUAL' && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-text-soft uppercase tracking-widest mb-2 block">
                      {expSplitType === 'AMOUNT' ? 'Custom Amounts (₹)' : 
                       expSplitType === 'PERCENT' ? 'Custom Percentages (%)' : 'Shares'}
                    </label>
                    {group.members.filter(m => participants.includes(m.id)).map(m => (
                      <div key={m.id} className="flex items-center justify-between gap-4">
                        <span className="text-sm font-medium text-primary">{m.name}</span>
                        <input 
                          type="number"
                          value={customSplits[m.id] || (expSplitType === 'SHARES' ? '1' : '')}
                          onChange={(e) => setCustomSplits(prev => ({ ...prev, [m.id]: e.target.value }))}
                          placeholder={expSplitType === 'SHARES' ? '1' : '0'}
                          className="w-24 bg-bg-soft border-none rounded-xl px-4 py-2 text-right text-sm font-bold text-primary"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <button 
                  onClick={handleAddExpense}
                  className="w-full btn-accent py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-accent/20 mt-4"
                >
                  Save Expense
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Settle Up Modal */}
      <AnimatePresence>
        {showSettleModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] flex items-end justify-center p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-md rounded-t-[40px] p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-primary">Record Payment</h3>
                <button onClick={() => setShowSettleModal(false)} className="p-2 bg-bg-soft rounded-full"><X size={20} /></button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-text-soft uppercase tracking-widest mb-2 block">Payer</label>
                    <select 
                      value={settlePayer}
                      onChange={(e) => setSettlePayer(e.target.value)}
                      className="w-full bg-bg-soft border-none rounded-2xl px-5 py-4 text-sm font-bold text-primary appearance-none"
                    >
                      {group.members.map(m => (
                        <option key={m.id} value={m.id}>{m.name} {m.isCurrentUser && '(You)'}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-soft uppercase tracking-widest mb-2 block">Receiver</label>
                    <select 
                      value={settleReceiver}
                      onChange={(e) => setSettleReceiver(e.target.value)}
                      className="w-full bg-bg-soft border-none rounded-2xl px-5 py-4 text-sm font-bold text-primary appearance-none"
                    >
                      {group.members.map(m => (
                        <option key={m.id} value={m.id}>{m.name} {m.isCurrentUser && '(You)'}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-text-soft uppercase tracking-widest mb-2 block">Amount</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg font-bold text-text-soft">₹</span>
                    <input 
                      type="number" 
                      value={settleAmount}
                      onChange={(e) => setSettleAmount(e.target.value)}
                      placeholder="0.00" 
                      className="w-full bg-bg-soft border-none rounded-2xl pl-10 pr-5 py-4 text-xl font-bold text-primary" 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-text-soft uppercase tracking-widest mb-2 block">Note (Optional)</label>
                  <input 
                    type="text" 
                    value={settleNote}
                    onChange={(e) => setSettleNote(e.target.value)}
                    placeholder="e.g. Cash payment" 
                    className="w-full bg-bg-soft border-none rounded-2xl px-5 py-4 text-sm font-bold text-primary" 
                  />
                </div>

                <button 
                  onClick={handleRecordSettlement}
                  className="w-full bg-success text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-success/20 mt-4"
                >
                  Record Settlement
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddMember && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] flex items-end justify-center p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-md rounded-t-[40px] p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-primary">Add New Member</h3>
                <button onClick={() => setShowAddMember(false)} className="p-2 bg-bg-soft rounded-full"><X size={20} /></button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-text-soft uppercase tracking-widest mb-2 block">Name</label>
                  <input 
                    type="text" 
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="Friend's name" 
                    className="w-full bg-bg-soft border-none rounded-2xl px-5 py-4 text-sm font-bold text-primary" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-soft uppercase tracking-widest mb-2 block">Email (Optional)</label>
                  <input 
                    type="email" 
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="friend@example.com" 
                    className="w-full bg-bg-soft border-none rounded-2xl px-5 py-4 text-sm font-bold text-primary" 
                  />
                </div>

                <button 
                  onClick={handleAddMember}
                  className="w-full bg-primary text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 mt-4"
                >
                  Add to Group
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const InviteFriendsScreen = ({ user, onBack }: { user: UserProfile, onBack: () => void }) => {
  const referralCode = (user.name?.substring(0, 5).toUpperCase() || "ARTH") + "500";
  const referrals = user.referrals || [];
  const earnedAmount = referrals.filter(r => r.status === 'Joined').reduce((acc, r) => acc + r.amount, 0);
  
  return (
    <div className="flex-1 overflow-y-auto pb-24 bg-bg-main">
      <div className="bg-primary text-white p-8 rounded-b-[40px] text-center shadow-lg relative">
        <button onClick={onBack} className="absolute left-6 top-8 p-2 bg-white/10 rounded-full"><ChevronLeft size={20} /></button>
        <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white/10">
          <Users size={40} className="text-accent" />
        </div>
        <h2 className="text-2xl font-black mb-2">Invite Friends & Earn</h2>
        <p className="text-sm text-white/70 leading-relaxed">Invite a friend, both get ₹500 FinPath credits</p>
      </div>

      <div className="p-6 space-y-8">
        <div className="card p-8 text-center border-2 border-dashed border-accent/30 bg-accent/5">
          <p className="text-[10px] font-bold text-text-soft uppercase tracking-widest mb-4">Your Referral Code</p>
          <div className="flex items-center justify-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-2xl font-black text-primary tracking-widest">{referralCode}</span>
            <button 
              onClick={() => navigator.clipboard.writeText(referralCode)}
              className="p-2 bg-bg-soft rounded-xl text-primary hover:bg-primary hover:text-white transition-all"
            >
              <Copy size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <button className="flex flex-col items-center gap-2 p-4 card bg-success/5 border-success/10">
            <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center text-white"><MessageSquare size={20} /></div>
            <span className="text-[10px] font-bold text-success uppercase">WhatsApp</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 card bg-primary/5 border-primary/10">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white"><Send size={20} /></div>
            <span className="text-[10px] font-bold text-primary uppercase">SMS</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 card bg-accent/5 border-accent/10">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white"><Share2 size={20} /></div>
            <span className="text-[10px] font-bold text-accent uppercase">More</span>
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-text-soft uppercase tracking-widest">Referral Rewards</h3>
            <span className="text-xs font-bold text-success">₹{earnedAmount.toLocaleString('en-IN')} Earned</span>
          </div>
          <div className="card p-6 bg-primary text-white flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Friends Joined</p>
              <p className="text-2xl font-black">{referrals.filter(r => r.status === 'Joined').length} Friends</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Total Credits</p>
              <p className="text-2xl font-black text-accent">₹{earnedAmount.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-bold text-text-soft uppercase tracking-widest">Friends Invited</h3>
          <div className="flex gap-4 mb-6">
            <button 
              onClick={() => {
                const newReferral: Referral = {
                  id: Math.random().toString(36).substr(2, 9),
                  name: ['Rahul', 'Sneha', 'Amit', 'Priya', 'Vikram'][Math.floor(Math.random() * 5)] + ' ' + ['Sharma', 'Kapoor', 'Verma', 'Singh', 'Das'][Math.floor(Math.random() * 5)],
                  status: Math.random() > 0.5 ? 'Joined' : 'Pending',
                  amount: 0,
                  date: new Date().toISOString()
                };
                if (newReferral.status === 'Joined') newReferral.amount = 500;
                
                const updatedUser = { ...user, referrals: [...(user.referrals || []), newReferral] };
                localStorage.setItem('finpath_user', JSON.stringify(updatedUser));
                window.location.reload(); // Simple way to refresh for this demo environment
              }}
              className="w-full bg-accent/10 text-accent py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-accent/20 flex items-center justify-center gap-2"
            >
              <Plus size={14} />
              <span>Simulate Invite</span>
            </button>
          </div>
          {referrals.length === 0 ? (
            <div className="card p-10 text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-bg-soft rounded-full flex items-center justify-center text-text-soft">
                <Users size={32} />
              </div>
              <p className="text-sm text-text-soft font-medium">No friends invited yet. Start sharing!</p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              {referrals.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-4 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-bg-main flex items-center justify-center text-primary font-bold">{f.name[0]}</div>
                    <div>
                      <p className="text-sm font-bold text-primary">{f.name}</p>
                      <p className={cn("text-[10px] font-bold uppercase tracking-wider", f.status === 'Joined' ? "text-success" : "text-gray-400")}>{f.status}</p>
                    </div>
                  </div>
                  {f.amount > 0 && <p className="text-sm font-bold text-success">+₹{f.amount}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ProfileScreen = ({ user, onLogout, navigate }: { user: UserProfile, onLogout: () => void, navigate: (tab: Tab) => void }) => {
  const [showVerificationModal, setShowVerificationModal] = useState<any>(null);
  const verifiedCount = user.verifications?.filter(v => v.status === 'VERIFIED').length || 0;
  const totalVerifications = user.verifications?.length || 0;

  return (
    <div className="flex-1 overflow-y-auto pb-24 bg-bg-main">
      <Header title="Profile" />
      <div className="p-6">
        <div className="card p-6 flex flex-col items-center text-center mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -mr-16 -mt-16" />
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4 border-4 border-white shadow-lg">
            <User size={48} />
          </div>
          <h3 className="text-2xl font-bold text-primary mb-1">{user.name}</h3>
          <p className="text-sm font-bold text-text-soft uppercase tracking-widest mb-4">{user.city}, India</p>
          
          <div className="flex flex-wrap justify-center gap-2">
            {user.persona && (
              <span className="px-4 py-1.5 bg-accent/10 text-accent text-[10px] font-black rounded-full border border-accent/20 uppercase tracking-widest shadow-lg shadow-accent/5">
                {user.persona}
              </span>
            )}
            <span className="px-4 py-1.5 bg-success/10 text-success text-[10px] font-bold rounded-full border border-success/20 uppercase tracking-wider">
              Verified User
            </span>
            <span className="px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full border border-primary/20 uppercase tracking-wider">
              Pro Member
            </span>
          </div>
        </div>

        <div className="card mb-8 p-6 bg-accent/5 border-accent/20 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all mb-8" onClick={() => navigate('invite-friends')}>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users2 size={80} className="text-accent" />
          </div>
          <div className="flex justify-between items-center">
            <div className="relative z-10">
              <h4 className="text-lg font-bold text-primary mb-1">Invite Friends & Earn</h4>
              <p className="text-xs text-text-soft font-bold uppercase tracking-widest">Get ₹500 for every referral</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center shadow-lg shadow-accent/20">
              <ChevronRight size={20} />
            </div>
          </div>
        </div>

        <div className="card mb-8">
          <h4 className="heading-section mb-6 flex items-center gap-3">
            <Award size={20} className="text-accent" />
            ACHIEVEMENTS
          </h4>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {(user.achievements || []).map((achievement) => (
              <div key={achievement.id} className={cn("flex-shrink-0 w-24 text-center transition-all", !achievement.unlocked && "opacity-40 grayscale")}>
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 border-2 shadow-inner",
                  achievement.unlocked ? "bg-accent/10 border-accent/20" : "bg-gray-100 border-gray-200"
                )}>
                  {achievement.icon === 'Target' && <Target size={24} className={achievement.unlocked ? "text-accent" : "text-gray-400"} />}
                  {achievement.icon === 'TrendingUp' && <TrendingUp size={24} className={achievement.unlocked ? "text-accent" : "text-gray-400"} />}
                  {achievement.icon === 'ShieldCheck' && <ShieldCheck size={24} className={achievement.unlocked ? "text-accent" : "text-gray-400"} />}
                  {achievement.icon === 'Users' && <Users size={24} className={achievement.unlocked ? "text-accent" : "text-gray-400"} />}
                </div>
                <p className="text-[10px] font-bold text-primary uppercase leading-tight">{achievement.title.split(' ').join('\n')}</p>
              </div>
            ))}
            {!(user.achievements || []).some(a => !a.unlocked) && (
              <div className="relative pl-8">
                <div className="absolute left-0 top-1 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center shadow-sm z-10">
                  <Award size={12} className="text-gray-400" />
                </div>
                <p className="text-xs font-bold text-gray-400 italic">More Milestones Coming Soon</p>
              </div>
            )}
          </div>
        </div>

        <div className="card mb-8 p-6 bg-white border border-gray-100 shadow-sm">
          <h4 className="font-bold text-primary mb-4 flex items-center gap-2">
            <Users size={18} className="text-accent" />
            Family Financial Profiler
          </h4>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Household Type</p>
              <p className="text-sm font-bold text-primary">{user.familyProfile?.householdType || 'Not Set'}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Dependents</p>
              <p className="text-sm font-bold text-primary">{user.familyProfile?.dependentsCount || 0}</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('family-profiler')}
            className="w-full py-3 bg-bg-soft text-primary rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors"
          >
            Update Family Profile
          </button>
        </div>

        <div className="card mb-6">
          <h4 className="font-bold text-primary mb-4 flex items-center gap-2">
            <ShieldCheck size={18} className="text-success" />
            Verify & Trust Hub
          </h4>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Trust Score Progress</span>
              <span className="text-xs font-bold text-primary">{verifiedCount}/{totalVerifications} Verified</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-success transition-all duration-500" 
                style={{ width: `${(verifiedCount / totalVerifications) * 100}%` }} 
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {user.verifications?.map((v) => (
              v.id === 'cibil' && v.demoData ? (
                <div key={v.id} className="p-5 bg-primary/5 rounded-3xl border-2 border-primary/10 mb-3 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <ShieldCheck size={80} className="text-primary" />
                  </div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h5 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">{v?.title}</h5>
                      <p className="text-[10px] text-gray-500 max-w-[180px]">{v?.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-primary leading-none">{v.demoData.score}</div>
                      <div className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Score / {v.demoData.max}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-success rounded-full" 
                          style={{ width: `${((v.demoData.score - 300) / 600) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-success uppercase">{v.demoData.rating}</span>
                    </div>
                    <button 
                      onClick={() => setShowVerificationModal(v)}
                      className="px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-bold shadow-lg shadow-primary/20"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ) : (
                <div key={v.id} className="flex items-center gap-3 p-3 bg-bg-soft rounded-2xl border border-gray-100">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    {v.id === 'cibil' && <ShieldCheck size={20} className="text-primary" />}
                    {v.id === 'income' && <IndianRupee size={20} className="text-success" />}
                    {v.id === 'loans' && <TrendingUp size={20} className="text-accent" />}
                    {v.id === 'bank' && <Home size={20} className="text-primary" />}
                    {v.id === 'pan' && <User size={20} className="text-accent" />}
                    {v.id === 'gst' && <Award size={20} className="text-success" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-0.5">
                      <h5 className="text-[10px] font-bold text-primary uppercase">{v?.title}</h5>
                      <span className={cn(
                        "text-[8px] font-bold px-1.5 py-0.5 rounded",
                        v.status === 'VERIFIED' ? "bg-success/10 text-success" : "bg-gray-200 text-gray-500"
                      )}>
                        {v.status}
                      </span>
                    </div>
                    <p className="text-[9px] text-gray-400 leading-tight">{v?.description}</p>
                  </div>
                  <button 
                    onClick={() => setShowVerificationModal(v)}
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[9px] font-bold text-primary hover:bg-primary hover:text-white transition-colors"
                  >
                    {v.status === 'VERIFIED' ? 'View' : 'Connect'}
                  </button>
                </div>
              )
            ))}
          </div>
          <p className="mt-4 text-[9px] text-gray-400 italic text-center">
            Verified users get priority access to FinPath advisors and pre-approved loan offers.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="card p-4 text-center cursor-pointer active:scale-95 transition-transform" onClick={() => navigate('active-goals-summary')}>
            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Active Goals</p>
            <p className="text-xl font-bold text-primary">{(user.goals || []).filter(g => g.status === 'ACTIVE' && g.target > 0).length}</p>
          </div>
          <div className="card p-4 text-center cursor-pointer active:scale-95 transition-transform" onClick={() => navigate('active-loans-summary')}>
            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Active Loans</p>
            <p className="text-xl font-bold text-alert">{user.loans.length}</p>
          </div>
        </div>

        <div className="space-y-3">
          <button 
            onClick={() => navigate('invite-friends')}
            className="w-full flex justify-between items-center p-5 bg-accent/5 rounded-3xl border border-accent/20 font-black text-accent shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center text-white shadow-lg shadow-accent/20">
                <Users size={20} />
              </div>
              <div className="text-left">
                <p className="text-sm uppercase tracking-widest">Invite Friends & Earn</p>
                <p className="text-[10px] font-bold opacity-60">Get ₹500 for every referral</p>
              </div>
            </div>
            <ChevronRight size={18} />
          </button>
          
          <button 
            onClick={() => navigate('dos-donts')}
            className="w-full flex justify-between items-center p-4 bg-white rounded-2xl border border-gray-100 font-bold text-primary"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-success/10 text-success flex items-center justify-center">
                <CheckCircle size={16} />
              </div>
              <span>Do's & Don'ts</span>
            </div>
            <ChevronRight size={18} />
          </button>

          <button 
            onClick={() => navigate('learn')}
            className="w-full flex justify-between items-center p-4 bg-white rounded-2xl border border-gray-100 font-bold text-primary"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                <BookOpen size={16} />
              </div>
              <span>Learn Hub</span>
            </div>
            <ChevronRight size={18} />
          </button>

          <button 
            onClick={() => navigate('policies')}
            className="w-full flex justify-between items-center p-4 bg-white rounded-2xl border border-gray-100 font-bold text-primary"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Shield size={16} />
              </div>
              <span>Policies</span>
            </div>
            <ChevronRight size={18} />
          </button>

          <button 
            onClick={() => navigate('help-support')}
            className="w-full flex justify-between items-center p-4 bg-white rounded-2xl border border-gray-100 font-bold text-primary"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
                <HelpCircle size={16} />
              </div>
              <span>Help & Support</span>
            </div>
            <ChevronRight size={18} />
          </button>

          <button className="w-full flex justify-between items-center p-4 bg-white rounded-2xl border border-gray-100 font-bold text-primary">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-400 flex items-center justify-center">
                <Settings size={16} />
              </div>
              <span>Settings</span>
            </div>
            <ChevronRight size={18} />
          </button>

          <button 
            onClick={onLogout}
            className="w-full p-4 bg-alert/10 text-alert rounded-2xl font-bold mt-4"
          >
            Logout
          </button>
          <button 
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            className="w-full p-4 bg-gray-100 text-gray-400 rounded-2xl font-bold text-xs"
          >
            Reset App Data (Dev Only)
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showVerificationModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-6 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-lg font-bold text-primary">{showVerificationModal?.title}</h4>
                <button onClick={() => setShowVerificationModal(null)} className="p-2 bg-bg-soft rounded-full"><X size={18} /></button>
              </div>

              <div className="space-y-6">
                <p className="text-sm text-gray-600 leading-relaxed">
                  {showVerificationModal.id === 'cibil' && 'In production, this connects to TransUnion CIBIL API. Requires PAN card + consent. Score range 300-900. Above 750 is excellent.'}
                  {showVerificationModal.id === 'income' && 'Upload last 3 months salary slip OR connect net banking. Partners: Perfios, Finbox, Setu API.'}
                  {showVerificationModal.id === 'loans' && 'Connects to CIBIL, Experian, or Account Aggregator (AA) framework. Lists all active EMIs, credit cards, and outstanding amounts.'}
                  {showVerificationModal.id === 'bank' && 'Uses RBI Account Aggregator framework. Partners: Finvu, OneMoney, Anumati. Zero data stored. Read-only access.'}
                  {showVerificationModal.id === 'pan' && 'Enter PAN number, DOB. Connects to Income Tax Department API via partners like Quicko, Karza, IDfy.'}
                  {showVerificationModal.id === 'gst' && 'Enter GSTIN. Connects to GST portal API. Shows annual turnover, filing history. Partners: Karza Technologies, IDfy.'}
                </p>

                {showVerificationModal.demoData && (
                  <div className="bg-bg-soft p-5 rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-3">Demo Data Preview</p>
                    {showVerificationModal.id === 'cibil' && (
                      <div className="flex flex-col items-center py-4">
                        <div className="relative w-40 h-40 flex items-center justify-center">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                            <circle
                              cx="80" cy="80" r="70"
                              fill="transparent"
                              stroke="currentColor"
                              strokeWidth="12"
                              className="text-gray-100"
                            />
                            <circle
                              cx="80" cy="80" r="70"
                              fill="transparent"
                              stroke="currentColor"
                              strokeWidth="12"
                              strokeDasharray={440}
                              strokeDashoffset={440 - (440 * (showVerificationModal.demoData.score - 300)) / 600}
                              strokeLinecap="round"
                              className="text-success transition-all duration-1000 ease-out"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-black text-primary">{showVerificationModal.demoData.score}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">CIBIL Score</span>
                          </div>
                        </div>
                        <div className="mt-6 px-6 py-2 bg-success/10 rounded-full">
                          <span className="text-xs font-bold text-success uppercase tracking-widest">{showVerificationModal.demoData.rating} HEALTH</span>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-4 w-full">
                          <div className="text-center">
                            <p className="text-[8px] font-bold text-gray-400 uppercase">Range</p>
                            <p className="text-[10px] font-bold text-primary">300-900</p>
                          </div>
                          <div className="text-center border-x border-gray-100">
                            <p className="text-[8px] font-bold text-gray-400 uppercase">Percentile</p>
                            <p className="text-[10px] font-bold text-primary">Top 15%</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[8px] font-bold text-gray-400 uppercase">Trend</p>
                            <p className="text-[10px] font-bold text-success">+12 pts</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {showVerificationModal.id === 'income' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Name</span>
                          <span className="font-bold">{showVerificationModal.demoData.name}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Monthly</span>
                          <span className="font-bold text-success">Rs {(showVerificationModal.demoData.amount || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Verified via</span>
                          <span className="font-bold">{showVerificationModal.demoData.method}</span>
                        </div>
                      </div>
                    )}
                    {showVerificationModal.id === 'loans' && (
                      <div className="space-y-3">
                        {(showVerificationModal?.demoData?.activeLoans || []).map((l: any, i: number) => (
                          <div key={i} className="flex justify-between text-sm border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                            <div>
                              <p className="font-bold text-primary">{l.bank} {l.type}</p>
                              <p className="text-[10px] text-gray-400">Outstanding</p>
                            </div>
                            <p className="font-bold text-alert">Rs {(l.outstanding || 0).toLocaleString('en-IN')}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <button 
                  onClick={() => setShowVerificationModal(null)}
                  className="w-full btn-primary py-4 rounded-2xl font-bold"
                >
                  {showVerificationModal?.status === 'VERIFIED' ? 'Close' : `Verify ${showVerificationModal?.title?.split(' ')[0]}`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


// --- Main App ---

const SmartMiniGoalQuestionsScreen = ({ onBack, onComplete, editingGoal }: { onBack: () => void, onComplete: (data: any) => void, editingGoal?: MiniGoal }) => {
  const [itemName, setItemName] = useState(editingGoal?.name || '');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!itemName) return;
    setLoading(true);
    try {
      const report = await generateMiniGoalReport(itemName);
      onComplete({ ...report, editingGoal });
    } catch (error) {
      console.error("Error generating mini goal report:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-bg-main overflow-y-auto pb-24">
      <Header title="AI Mini Goal Engine" showBack onBack={onBack} />
      <div className="p-8 flex-1 flex flex-col">
        <div className="mb-10">
          <h2 className="text-3xl font-black text-primary mb-2 leading-tight">What are you buying?</h2>
          <p className="text-sm text-text-soft">Tell us the item name (e.g., iPhone 15 Pro, Nike Air Max, Sony PS5) and we'll find the best deals and tips for you.</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="label-caps text-text-soft">Item Name</label>
            <input 
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. MacBook Air M2"
              className="w-full bg-white border-2 border-primary/5 rounded-3xl p-6 text-lg font-bold focus:border-accent outline-none transition-all shadow-xl shadow-primary/5"
            />
          </div>

          <button 
            onClick={handleGenerate}
            disabled={loading || !itemName}
            className={cn(
              "w-full py-6 rounded-3xl font-black text-sm tracking-widest flex items-center justify-center gap-3 transition-all shadow-2xl shadow-accent/30",
              loading || !itemName ? "bg-gray-200 text-gray-400" : "bg-accent text-white hover:scale-[1.02]"
            )}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles size={20} />
                <span>GENERATE SMART REPORT</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-12 p-6 bg-accent/5 rounded-3xl border border-accent/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-accent text-white rounded-xl flex items-center justify-center">
              <Zap size={20} />
            </div>
            <h4 className="text-sm font-black text-primary uppercase tracking-widest">How it works</h4>
          </div>
          <ul className="space-y-3">
            {[
              'Real-time price comparison across top stores',
              'Smart timing advice (Wait vs Buy)',
              'Hidden credit card & exchange offers',
              'Inflation & depreciation analysis'
            ].map((text, i) => (
              <li key={i} className="flex items-center gap-3 text-xs font-bold text-text-soft">
                <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const FamilyProfilerScreen = ({ user, onBack, onUpdateUser }: { user: UserProfile, onBack: () => void, onUpdateUser: (u: UserProfile) => void }) => {
  const [formData, setFormData] = useState<FamilyProfile>(user.familyProfile || {
    householdType: 'Nuclear Family',
    spouseStatus: 'Working',
    dependentsCount: 0,
    earningMembersCount: 1,
    householdMonthlyIncome: user.income,
    householdMonthlyExpenses: user.expenses,
    majorAssets: [],
    majorLiabilities: [],
    emergencyFundMonths: user.survivalMonths || 0,
    keyFamilyGoals: []
  });

  const handleSave = async () => {
    if (user.id) {
      try {
        await databaseService.upsertFamilyProfile(user.id, formData);
      } catch (error) {
        console.error('Error saving family profile:', error);
      }
    }
    onUpdateUser({
      ...user,
      familyProfile: formData
    });
    onBack();
  };

  const toggleItem = (list: string[], item: string, field: keyof FamilyProfile) => {
    const newList = list.includes(item) 
      ? list.filter(i => i !== item)
      : [...list, item];
    setFormData(prev => ({ ...prev, [field]: newList }));
  };

  return (
    <div className="flex-1 flex flex-col bg-bg-main overflow-y-auto pb-24">
      <Header title="Family Profiler" showBack onBack={onBack} />
      
      <div className="p-6 space-y-8">
        <div className="card p-6">
          <h4 className="label-caps text-text-soft mb-4">Household Structure</h4>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Family Type</label>
              <div className="flex flex-wrap gap-2">
                {['Single', 'Nuclear Family', 'Joint Family'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFormData(prev => ({ ...prev, householdType: type as any }))}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                      formData.householdType === type ? "bg-primary text-white" : "bg-bg-soft text-text-soft"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Spouse Status</label>
              <div className="flex flex-wrap gap-2">
                {['Working', 'Home Maker', 'Not Applicable'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFormData(prev => ({ ...prev, spouseStatus: status as any }))}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                      formData.spouseStatus === status ? "bg-primary text-white" : "bg-bg-soft text-text-soft"
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Dependents</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setFormData(prev => ({ ...prev, dependentsCount: Math.max(0, prev.dependentsCount - 1) }))} className="w-8 h-8 rounded-full bg-bg-soft flex items-center justify-center font-bold">-</button>
                  <span className="font-bold">{formData.dependentsCount}</span>
                  <button onClick={() => setFormData(prev => ({ ...prev, dependentsCount: prev.dependentsCount + 1 }))} className="w-8 h-8 rounded-full bg-bg-soft flex items-center justify-center font-bold">+</button>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Earning Members</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setFormData(prev => ({ ...prev, earningMembersCount: Math.max(1, prev.earningMembersCount - 1) }))} className="w-8 h-8 rounded-full bg-bg-soft flex items-center justify-center font-bold">-</button>
                  <span className="font-bold">{formData.earningMembersCount}</span>
                  <button onClick={() => setFormData(prev => ({ ...prev, earningMembersCount: prev.earningMembersCount + 1 }))} className="w-8 h-8 rounded-full bg-bg-soft flex items-center justify-center font-bold">+</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h4 className="label-caps text-text-soft mb-4">Household Cashflow</h4>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Monthly Income (₹)</label>
              <input 
                type="number"
                value={formData.householdMonthlyIncome}
                onChange={(e) => setFormData(prev => ({ ...prev, householdMonthlyIncome: Number(e.target.value) }))}
                className="w-full bg-bg-soft border-none rounded-xl p-4 font-bold text-primary"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Monthly Expenses (₹)</label>
              <input 
                type="number"
                value={formData.householdMonthlyExpenses}
                onChange={(e) => setFormData(prev => ({ ...prev, householdMonthlyExpenses: Number(e.target.value) }))}
                className="w-full bg-bg-soft border-none rounded-xl p-4 font-bold text-primary"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Emergency Fund (Months)</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setFormData(prev => ({ ...prev, emergencyFundMonths: Math.max(0, prev.emergencyFundMonths - 1) }))} className="w-8 h-8 rounded-full bg-bg-soft flex items-center justify-center font-bold">-</button>
                <span className="font-bold">{formData.emergencyFundMonths}</span>
                <button onClick={() => setFormData(prev => ({ ...prev, emergencyFundMonths: prev.emergencyFundMonths + 1 }))} className="w-8 h-8 rounded-full bg-bg-soft flex items-center justify-center font-bold">+</button>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h4 className="label-caps text-text-soft mb-4">Assets & Liabilities</h4>
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Major Assets</label>
              <div className="flex flex-wrap gap-2">
                {['Home', 'Car', 'Gold', 'Land', 'Business', 'Stocks'].map((asset) => (
                  <button
                    key={asset}
                    onClick={() => toggleItem(formData.majorAssets, asset, 'majorAssets')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                      formData.majorAssets.includes(asset) ? "bg-success text-white" : "bg-bg-soft text-text-soft"
                    )}
                  >
                    {asset}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Major Liabilities</label>
              <div className="flex flex-wrap gap-2">
                {['Home Loan', 'Car Loan', 'Personal Loan', 'Education Loan', 'Business Loan'].map((loan) => (
                  <button
                    key={loan}
                    onClick={() => toggleItem(formData.majorLiabilities, loan, 'majorLiabilities')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                      formData.majorLiabilities.includes(loan) ? "bg-alert text-white" : "bg-bg-soft text-text-soft"
                    )}
                  >
                    {loan}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h4 className="label-caps text-text-soft mb-4">Key Family Goals</h4>
          <div className="flex flex-wrap gap-2">
            {['Education', 'Marriage', 'Retirement', 'Travel', 'Health', 'Legacy'].map((goal) => (
              <button
                key={goal}
                onClick={() => toggleItem(formData.keyFamilyGoals, goal, 'keyFamilyGoals')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                  formData.keyFamilyGoals.includes(goal) ? "bg-accent text-white" : "bg-bg-soft text-text-soft"
                )}
              >
                {goal}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button onClick={onBack} className="flex-1 py-4 bg-bg-soft text-text-soft rounded-2xl font-bold">Cancel</button>
          <button onClick={handleSave} className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20">Save Profile</button>
        </div>
      </div>
    </div>
  );
};

const HelpSupportScreen = ({ user, onBack, onUpdateUser }: { user: UserProfile, onBack: () => void, onUpdateUser: (u: UserProfile) => void }) => {
  const [activeTab, setActiveTab] = useState<'faq' | 'raise' | 'requests'>('faq');
  const [formData, setFormData] = useState({
    category: 'General',
    title: '',
    description: '',
    email: user.email || ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const faqs = [
    { q: "How do I link my bank account?", a: "Go to Profile > Verify & Trust Hub > Bank Account Link and follow the RBI Account Aggregator flow." },
    { q: "Is my data safe?", a: "Yes, we use 256-bit encryption and never store your bank credentials. We only have read-only access via AA framework." },
    { q: "How are goal feasibility scores calculated?", a: "We analyze your surplus, timeline, and inflation-adjusted future cost to determine if your goal is achievable." },
    { q: "Can I share my goals with my spouse?", a: "Yes, you can use the 'Save Together' feature in the Split tab to collaborate on goals." }
  ];

  const handleSubmit = async () => {
    if (!formData.title || !formData.description) return;

    const newTicket: SupportTicket = {
      id: Math.random().toString(36).substr(2, 9),
      category: formData.category,
      title: formData.title,
      description: formData.description,
      email: formData.email,
      status: 'Submitted',
      createdAt: new Date().toISOString()
    };

    if (user.id) {
      try {
        await databaseService.createSupportTicket(user.id, newTicket);
      } catch (error) {
        console.error('Error creating support ticket:', error);
      }
    }

    onUpdateUser({
      ...user,
      supportTickets: [...(user.supportTickets || []), newTicket]
    });

    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setActiveTab('requests');
      setFormData({ category: 'General', title: '', description: '', email: user.email || '' });
    }, 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-bg-main overflow-y-auto pb-24">
      <Header title="Help & Support" showBack onBack={onBack} />
      
      <div className="p-6">
        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm mb-8 border border-gray-100">
          <button 
            onClick={() => setActiveTab('faq')}
            className={cn(
              "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'faq' ? "bg-primary text-white" : "text-text-soft"
            )}
          >
            FAQ
          </button>
          <button 
            onClick={() => setActiveTab('raise')}
            className={cn(
              "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'raise' ? "bg-primary text-white" : "text-text-soft"
            )}
          >
            Raise Issue
          </button>
          <button 
            onClick={() => setActiveTab('requests')}
            className={cn(
              "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'requests' ? "bg-primary text-white" : "text-text-soft"
            )}
          >
            My Requests
          </button>
        </div>

        {activeTab === 'faq' && (
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="card p-5">
                <h5 className="font-bold text-primary mb-2">{faq.q}</h5>
                <p className="text-xs text-text-soft leading-relaxed">{faq.a}</p>
              </div>
            ))}
            <div className="p-6 bg-accent/5 rounded-3xl border border-accent/10 text-center mt-8">
              <p className="text-sm font-bold text-primary mb-4">Still need help?</p>
              <button onClick={() => setActiveTab('raise')} className="btn-accent px-8 py-3 text-xs">Contact Support</button>
            </div>
          </div>
        )}

        {activeTab === 'raise' && (
          <div className="card p-6 space-y-6">
            {isSubmitted ? (
              <div className="py-12 text-center">
                <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check size={40} />
                </div>
                <h4 className="text-xl font-bold text-primary mb-2">Ticket Submitted!</h4>
                <p className="text-sm text-text-soft">We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="label-caps text-text-soft mb-2 block">Category</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-bg-soft border-none rounded-xl p-4 font-bold text-primary appearance-none"
                  >
                    <option>General</option>
                    <option>Bug Report</option>
                    <option>Goal Planning</option>
                    <option>Investment Advice</option>
                    <option>Split & Save</option>
                    <option>Account/KYC</option>
                  </select>
                </div>
                <div>
                  <label className="label-caps text-text-soft mb-2 block">Subject</label>
                  <input 
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Short title of the issue"
                    className="w-full bg-bg-soft border-none rounded-xl p-4 font-bold text-primary"
                  />
                </div>
                <div>
                  <label className="label-caps text-text-soft mb-2 block">Description</label>
                  <textarea 
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your issue in detail..."
                    className="w-full bg-bg-soft border-none rounded-xl p-4 font-bold text-primary resize-none"
                  />
                </div>
                <div>
                  <label className="label-caps text-text-soft mb-2 block">Contact Email</label>
                  <input 
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-bg-soft border-none rounded-xl p-4 font-bold text-primary"
                  />
                </div>
                <div className="p-4 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400">
                  <Camera size={24} />
                  <span className="text-[10px] font-bold uppercase">Attach Screenshot (Optional)</span>
                </div>
                <button onClick={handleSubmit} className="w-full btn-primary py-4 shadow-lg shadow-primary/20">Submit Request</button>
              </>
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-4">
            {(!user.supportTickets || user.supportTickets.length === 0) ? (
              <div className="py-20 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                  <History size={32} />
                </div>
                <p className="text-sm font-bold text-gray-400">No requests found</p>
              </div>
            ) : (
              user.supportTickets.map((ticket) => (
                <div key={ticket.id} className="card p-5">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black text-accent uppercase tracking-widest">{ticket.category}</span>
                    <span className={cn(
                      "text-[8px] font-bold px-2 py-0.5 rounded-full",
                      ticket.status === 'Submitted' ? "bg-primary/10 text-primary" : "bg-success/10 text-success"
                    )}>
                      {ticket.status}
                    </span>
                  </div>
                  <h5 className="font-bold text-primary mb-1">{ticket.title}</h5>
                  <p className="text-xs text-text-soft line-clamp-2 mb-3">{ticket.description}</p>
                  <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold">
                    <span>ID: #{ticket.id}</span>
                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const PoliciesScreen = ({ onBack }: { onBack: () => void }) => {
  const policies = [
    {
      title: 'Privacy Policy',
      content: 'We value your privacy. Your financial data is encrypted and never shared with third parties without explicit consent. We use bank-grade security to protect your information.'
    },
    {
      title: 'Terms of Use',
      content: 'By using FinPath, you agree to provide accurate information. The app is a tool for financial planning and does not constitute legal or tax advice.'
    },
    {
      title: 'Data Usage',
      content: 'We use your data to provide personalized financial insights, goal tracking, and recommendations. You can request data deletion at any time from settings.'
    },
    {
      title: 'Disclaimer',
      content: 'FinPath provides planning support and profiling. It does not guarantee investment returns. All projections are based on historical data and user inputs.'
    },
    {
      title: 'Risk Disclosure',
      content: 'Investments are subject to market risks. Please read all scheme-related documents carefully. Recommendations depend on suitability and complete data review.'
    }
  ];

  return (
    <div className="flex-1 flex flex-col bg-bg-main overflow-y-auto pb-24">
      <Header title="Policies" showBack onBack={onBack} />
      <div className="p-6 space-y-6">
        {policies.map((p, i) => (
          <div key={i} className="card p-6">
            <h4 className="text-sm font-black text-primary uppercase tracking-widest mb-3">{p.title}</h4>
            <p className="text-xs text-text-soft leading-relaxed">{p.content}</p>
          </div>
        ))}
        <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10">
          <p className="text-[10px] text-primary font-bold leading-relaxed text-center italic">
            "Financial planning is a journey. We are here to provide the map, but you are the driver. Always review your data before taking major decisions."
          </p>
        </div>
      </div>
    </div>
  );
};

const DosDontsScreen = ({ onBack }: { onBack: () => void }) => {
  const dos = [
    "Review your goals regularly",
    "Maintain emergency funds (6 months)",
    "Track expenses and liabilities",
    "Invest based on goals and risk capacity",
    "Use registered advisers for advice",
    "Keep account and contact details updated"
  ];

  const donts = [
    "Invest based on tips or pressure",
    "Borrow recklessly for investments",
    "Ignore liabilities and credit dues",
    "Assume returns are guaranteed",
    "Share passwords, OTPs, or credentials",
    "Make decisions without checking suitability"
  ];

  return (
    <div className="flex-1 flex flex-col bg-bg-main overflow-y-auto pb-24">
      <Header title="Do's & Don'ts" showBack onBack={onBack} />
      <div className="p-6 space-y-8">
        <div className="card p-6 border-l-4 border-l-success">
          <h4 className="text-sm font-black text-success uppercase tracking-widest mb-6 flex items-center gap-2">
            <Check size={18} />
            The Good Stuff (DO)
          </h4>
          <div className="space-y-4">
            {dos.map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-success/10 text-success flex items-center justify-center flex-shrink-0">
                  <Check size={12} />
                </div>
                <p className="text-xs font-bold text-primary">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6 border-l-4 border-l-alert">
          <h4 className="text-sm font-black text-alert uppercase tracking-widest mb-6 flex items-center gap-2">
            <X size={18} />
            The Red Flags (DON'T)
          </h4>
          <div className="space-y-4">
            {donts.map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-alert/10 text-alert flex items-center justify-center flex-shrink-0">
                  <X size={12} />
                </div>
                <p className="text-xs font-bold text-primary">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ActiveGoalsSummaryScreen = ({ user, onBack }: { user: UserProfile, onBack: () => void }) => {
  const activeGoals = (user.goals || []).filter(g => g.status === 'ACTIVE' && g.target > 0);

  return (
    <div className="flex-1 flex flex-col bg-bg-main overflow-y-auto pb-24">
      <Header title="Active Goals" showBack onBack={onBack} />
      <div className="p-6">
        {activeGoals.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
              <Target size={40} />
            </div>
            <h4 className="text-lg font-bold text-primary mb-2">No active goals</h4>
            <p className="text-sm text-text-soft mb-8">Start your wealth journey by adding your first goal.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeGoals.map((goal) => {
              const progress = (goal.current / goal.target) * 100;
              const status = progress > 50 ? 'On Track' : progress > 20 ? 'Behind' : 'Not Started';
              
              return (
                <div key={goal.id} className="card p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: goal.color }}>
                        <Target size={20} />
                      </div>
                      <div>
                        <h5 className="font-bold text-primary">{goal.name}</h5>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{goal.category}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "text-[8px] font-bold px-2 py-1 rounded-full uppercase tracking-widest",
                      status === 'On Track' ? "bg-success/10 text-success" : status === 'Behind' ? "bg-accent/10 text-accent" : "bg-gray-100 text-gray-400"
                    )}>
                      {status}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-text-soft uppercase">
                      <span>Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full transition-all duration-1000" style={{ width: `${progress}%`, backgroundColor: goal.color }} />
                    </div>
                    <div className="flex justify-between items-end pt-2">
                      <div>
                        <p className="text-[8px] text-gray-400 font-bold uppercase">Target</p>
                        <p className="text-sm font-black text-primary">₹{(goal.target / 100000).toFixed(1)}L</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] text-gray-400 font-bold uppercase">Timeline</p>
                        <p className="text-sm font-black text-primary">{goal.timeline} Yrs</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const ActiveLoansSummaryScreen = ({ user, onBack }: { user: UserProfile, onBack: () => void }) => {
  const activeLoans = user.loans || [];

  return (
    <div className="flex-1 flex flex-col bg-bg-main overflow-y-auto pb-24">
      <Header title="Active Loans" showBack onBack={onBack} />
      <div className="p-6">
        {activeLoans.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
              <CreditCard size={40} />
            </div>
            <h4 className="text-lg font-bold text-primary mb-2">No active loans</h4>
            <p className="text-sm text-text-soft mb-8">You haven't added any liabilities yet. This is great for your net worth!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeLoans.map((loan) => {
              const burden = loan.emi > (user.income * 0.15) ? 'High' : loan.emi > (user.income * 0.05) ? 'Moderate' : 'Low';
              
              return (
                <div key={loan.id} className="card p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-alert/10 text-alert flex items-center justify-center">
                        <CreditCard size={20} />
                      </div>
                      <div>
                        <h5 className="font-bold text-primary">{loan.type}</h5>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Active Liability</p>
                      </div>
                    </div>
                    <span className={cn(
                      "text-[8px] font-bold px-2 py-1 rounded-full uppercase tracking-widest",
                      burden === 'Low' ? "bg-success/10 text-success" : burden === 'Moderate' ? "bg-accent/10 text-accent" : "bg-alert/10 text-alert"
                    )}>
                      {burden} Burden
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 p-4 bg-bg-soft rounded-2xl">
                    <div>
                      <p className="text-[8px] text-gray-400 font-bold uppercase mb-1">Outstanding</p>
                      <p className="text-lg font-black text-primary">₹{(loan.amount || 0).toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-gray-400 font-bold uppercase mb-1">Monthly EMI</p>
                      <p className="text-lg font-black text-alert">₹{(loan.emi || 0).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-text-soft">
                    <Clock size={12} />
                    <span>Next due in 12 days</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const GoalDiscoveryJourney = ({
  user,
  onBack,
  onComplete,
  initialGoalName = '',
  initialGoalCategory = 'travel'
}: {
  user: UserProfile,
  onBack: () => void,
  onComplete: (goal: Goal) => void,
  initialGoalName?: string,
  initialGoalCategory?: string
}) => {
  const [activeStep, setActiveStep] = useState<'goal' | 'details' | 'estimate' | 'funding' | 'review'>(initialGoalName ? 'details' : 'goal');
  const [goalName, setGoalName] = useState(initialGoalName);
  const [category, setCategory] = useState(initialGoalCategory);
  const [interviewStep, setInterviewStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = { goalName: initialGoalName };
    if (initialGoalCategory === 'debt') {
      const totalDebt = (user.loans || []).reduce((sum, l) => sum + (l.amount || 0), 0);
      if (totalDebt > 0) {
        initial.target_amount = totalDebt;
        initial.debt_type = (user.loans || []).length > 1 ? 'Multiple Debts' : (user.loans?.[0]?.type || 'Personal Loan');
      }
      initial.timeframe = '2 Years';
      initial.interest_rate = 12; // Default
    }
    return initial;
  });

  // Sync goalName to answers
  useEffect(() => {
    setAnswers(prev => ({ ...prev, goalName }));
  }, [goalName]);

  // Reset interview when category changes to prevent question leakage
  useEffect(() => {
    setInterviewStep(0);
    setAnswers(prev => ({ goalName: prev.goalName }));
    setSelectedPlanId('balanced');
  }, [category]);

  const [recalculating, setRecalculating] = useState(false);

  const allQuestions = goalQuestionEngine(category, answers);
  const questions = allQuestions.filter(q => !(q as any).condition || (q as any).condition(answers));
  
  const answersArray: GoalInterviewAnswer[] = Object.entries(answers).map(([id, val]) => ({
    questionId: id,
    answer: val
  }));

  const estimates = goalEstimator(category, answersArray);
  
  const [loanScenario, setLoanScenario] = useState(70);
  const [loanTenure, setLoanTenure] = useState(category === 'home' ? 20 : 5);

  const calculateLoanMetrics = (lp: number, tenure: number) => {
    const loanAmt = (estimates.futureCost * lp) / 100;
    const dp = estimates.futureCost - loanAmt;
    const rate = category === 'home' ? 0.09 : 0.12;
    const monthlyRate = rate / 12;
    const n = tenure * 12;
    const emi = loanAmt > 0 ? (loanAmt * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1) : 0;
    const totalInt = (emi * n) - loanAmt;
    const emiRatio = (emi / (user.income / 12)) * 100;
    return { loanAmt, dp, emi, totalInt, emiRatio, rate };
  };

  const loanMetrics = calculateLoanMetrics(loanScenario, loanTenure);

  const isLoanGoal = category === 'home' || (category === 'luxury' && answers.sub_type === 'dream car/ bike');
  const targetToSave = isLoanGoal ? loanMetrics.dp : estimates.futureCost;

  const feasibility = feasibilityAnalyzer(user, targetToSave, estimates.years, category);
  const plans = planGenerator(targetToSave, estimates.years, user, category);

  const [selectedPlanId, setSelectedPlanId] = useState<string>(category === 'debt' ? 'snowball' : 'balanced');
  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[1];

  const steps = [
    { id: 'goal', label: 'Goal', icon: Target },
    { id: 'details', label: 'Details', icon: MessageSquare },
    { id: 'estimate', label: 'Estimate', icon: TrendingUp },
    { id: 'funding', label: 'Funding Plan', icon: Zap },
    { id: 'review', label: 'Review', icon: Check }
  ];

  const [showMFDrillDown, setShowMFDrillDown] = useState(false);
  const mfSubOptions = getMutualFundSubOptions();

  const handleAnswerChange = (id: string, value: any) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
    setRecalculating(true);
    setTimeout(() => setRecalculating(false), 800);
  };

  const currentQuestion = questions[interviewStep];

  const canGoToStep = (stepId: string) => {
    if (stepId === 'goal') return true;
    if (stepId === 'details') return !!goalName;
    if (stepId === 'estimate') return interviewStep >= questions.length - 1 || Object.keys(answers).length >= questions.length / 2;
    if (stepId === 'funding') return !!estimates.futureCost;
    if (stepId === 'review') return !!selectedPlan;
    return false;
  };

  const renderInterviewInput = () => {
    if (!currentQuestion) return null;

    switch (currentQuestion.type) {
      case 'select':
        return (
          <div className="grid grid-cols-1 gap-4">
            {/* @ts-ignore */}
            {currentQuestion.options?.map((opt, i) => {
              const label = typeof opt === 'object' ? opt.label : opt;
              const value = typeof opt === 'object' ? opt.value : opt;
              const isSelected = answers[currentQuestion.id] === value;

              return (
                <motion.button
                  key={value}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => {
                    handleAnswerChange(currentQuestion.id, value);
                    if (interviewStep < questions.length - 1) setInterviewStep(interviewStep + 1);
                    else setActiveStep('estimate');
                  }}
                  className={cn(
                    "w-full p-6 rounded-[28px] border-2 text-left font-black transition-all flex justify-between items-center group relative overflow-hidden",
                    isSelected 
                      ? "border-accent bg-accent/5 text-primary shadow-xl shadow-accent/5" 
                      : "border-white bg-white text-text-soft hover:border-gray-200"
                  )}
                >
                  <span className="relative z-10">{label}</span>
                  {isSelected ? (
                    <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center shadow-lg">
                      <Check size={18} />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-bg-main flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                      <ChevronRight size={18} className="text-gray-300" />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        );

      case 'month-year-picker':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <select 
                className="bg-white border-2 border-gray-100 rounded-[24px] p-6 text-lg font-black text-primary outline-none focus:border-accent"
                value={answers[currentQuestion.id]?.split(' ')[0] || 'Dec'}
                onChange={(e) => {
                  const year = answers[currentQuestion.id]?.split(' ')[1] || '2026';
                  handleAnswerChange(currentQuestion.id, `${e.target.value} ${year}`);
                }}
              >
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <select 
                className="bg-white border-2 border-gray-100 rounded-[24px] p-6 text-lg font-black text-primary outline-none focus:border-accent"
                value={answers[currentQuestion.id]?.split(' ')[1] || '2026'}
                onChange={(e) => {
                  const month = answers[currentQuestion.id]?.split(' ')[0] || 'Dec';
                  handleAnswerChange(currentQuestion.id, `${month} ${e.target.value}`);
                }}
              >
                {[2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={() => {
                if (interviewStep < questions.length - 1) setInterviewStep(interviewStep + 1);
                else setActiveStep('estimate');
              }}
              className="w-full bg-primary text-white py-6 rounded-[28px] font-black text-lg shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
            >
              <span>Continue</span>
              <ArrowRight size={20} />
            </button>
          </div>
        );

      case 'stepper':
        const val = parseInt(answers[currentQuestion.id]) || 1;
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-center gap-8 bg-white p-8 rounded-[40px] border-2 border-gray-50 shadow-xl">
              <button 
                onClick={() => handleAnswerChange(currentQuestion.id, Math.max(1, val - 1))}
                className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-primary hover:bg-gray-100 transition-colors"
              >
                <X size={24} className="rotate-45" />
              </button>
              <span className="text-5xl font-black text-primary min-w-[80px] text-center">{val}</span>
              <button 
                onClick={() => handleAnswerChange(currentQuestion.id, val + 1)}
                className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors"
              >
                <Plus size={24} />
              </button>
            </div>
            <button 
              onClick={() => {
                if (interviewStep < questions.length - 1) setInterviewStep(interviewStep + 1);
                else setActiveStep('estimate');
              }}
              className="w-full bg-primary text-white py-6 rounded-[28px] font-black text-lg shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
            >
              <span>Continue</span>
              <ArrowRight size={20} />
            </button>
          </div>
        );

      case 'slider':
        const sVal = parseInt(answers[currentQuestion.id]) || 50;
        return (
          <div className="space-y-8">
            <div className="bg-white p-10 rounded-[40px] border-2 border-gray-50 shadow-xl space-y-8">
              <div className="text-center">
                <span className="text-5xl font-black text-primary">{sVal}</span>
                <span className="text-sm font-bold text-text-soft ml-2 uppercase tracking-widest">Guests</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="1000" 
                step="10"
                value={sVal}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                className="w-full h-3 bg-gray-100 rounded-full appearance-none cursor-pointer accent-accent"
              />
              <div className="flex justify-between text-[10px] font-black text-text-soft uppercase tracking-widest">
                <span>10</span>
                <span>500</span>
                <span>1000</span>
              </div>
            </div>
            <button 
              onClick={() => {
                if (interviewStep < questions.length - 1) setInterviewStep(interviewStep + 1);
                else setActiveStep('estimate');
              }}
              className="w-full bg-primary text-white py-6 rounded-[28px] font-black text-lg shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
            >
              <span>Continue</span>
              <ArrowRight size={20} />
            </button>
          </div>
        );

      case 'multiselect':
        const selected = Array.isArray(answers[currentQuestion.id]) ? answers[currentQuestion.id] : [];
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-3">
              {/* @ts-ignore */}
              {currentQuestion.options?.map(opt => {
                const label = typeof opt === 'object' ? opt.label : opt;
                const value = typeof opt === 'object' ? opt.value : opt;
                const isSelected = selected.includes(value);

                return (
                  <button
                    key={value}
                    onClick={() => {
                      const newSel = isSelected 
                        ? selected.filter((s: string) => s !== value)
                        : [...selected, value];
                      handleAnswerChange(currentQuestion.id, newSel);
                    }}
                    className={cn(
                      "p-4 rounded-2xl border-2 font-bold text-xs transition-all",
                      isSelected 
                        ? "border-accent bg-accent/5 text-primary" 
                        : "border-white bg-white text-text-soft"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <button 
              onClick={() => {
                if (interviewStep < questions.length - 1) setInterviewStep(interviewStep + 1);
                else setActiveStep('estimate');
              }}
              className="w-full bg-primary text-white py-6 rounded-[28px] font-black text-lg shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
            >
              <span>Continue</span>
              <ArrowRight size={20} />
            </button>
          </div>
        );

      case 'selectable-cards':
        return (
          <div className="grid grid-cols-2 gap-4">
            {/* @ts-ignore */}
            {currentQuestion.options?.map((opt, i) => {
              const label = typeof opt === 'object' ? opt.label : opt;
              const value = typeof opt === 'object' ? opt.value : opt;
              const icon = typeof opt === 'object' ? opt.icon : null;
              const description = typeof opt === 'object' ? opt.description : null;
              const isSelected = answers[currentQuestion.id] === value;

              return (
                <motion.button
                  key={value}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => {
                    handleAnswerChange(currentQuestion.id, value);
                    if (interviewStep < questions.length - 1) setInterviewStep(interviewStep + 1);
                    else setActiveStep('estimate');
                  }}
                  className={cn(
                    "p-6 rounded-[28px] border-2 text-center font-black transition-all flex flex-col items-center justify-center gap-3",
                    isSelected 
                      ? "border-accent bg-accent/5 text-primary shadow-xl" 
                      : "border-white bg-white text-text-soft hover:border-gray-200"
                  )}
                >
                  {icon && <span className="text-3xl">{icon}</span>}
                  <span className="text-sm">{label}</span>
                  {description && <p className="text-[10px] font-medium text-text-soft leading-tight">{description}</p>}
                </motion.button>
              );
            })}
          </div>
        );

      case 'segmented-chips':
        return (
          <div className="space-y-8">
            <div className="flex flex-wrap gap-3 justify-center">
              {/* @ts-ignore */}
              {currentQuestion.options?.map((opt, i) => {
                const label = typeof opt === 'object' ? opt.label : opt;
                const value = typeof opt === 'object' ? opt.value : opt;
                const isSelected = answers[currentQuestion.id] === value;

                return (
                  <motion.button
                    key={value}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => handleAnswerChange(currentQuestion.id, value)}
                    className={cn(
                      "min-w-[60px] h-14 rounded-2xl border-2 font-black transition-all flex items-center justify-center",
                      isSelected 
                        ? "border-accent bg-accent text-white shadow-lg shadow-accent/20" 
                        : "border-white bg-white text-text-soft hover:border-gray-200"
                    )}
                  >
                    {label}
                  </motion.button>
                );
              })}
            </div>
            <button 
              onClick={() => {
                if (interviewStep < questions.length - 1) setInterviewStep(interviewStep + 1);
                else setActiveStep('estimate');
              }}
              disabled={!answers[currentQuestion.id]}
              className="w-full bg-primary text-white py-6 rounded-[28px] font-black text-lg shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <span>Continue</span>
              <ArrowRight size={20} />
            </button>
          </div>
        );

      default:
        return (
          <div className="space-y-8">
            <div className="relative">
              <input 
                type={currentQuestion.type === 'number' ? 'number' : 'text'}
                autoFocus
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                placeholder={(currentQuestion as any).placeholder}
                className="w-full bg-white border-2 border-gray-100 rounded-[32px] px-8 py-8 text-2xl font-black text-primary focus:border-accent outline-none transition-all shadow-xl shadow-primary/5 placeholder:text-gray-200"
              />
              {currentQuestion.type === 'number' && (
                <div className="absolute right-8 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-200">
                  ₹
                </div>
              )}
            </div>

            {/* Chips for text input if options are provided */}
            {currentQuestion.type === 'text' && (currentQuestion as any).options && (
              <div className="flex flex-wrap gap-2">
                {(currentQuestion as any).options.map((opt: string) => (
                  <button
                    key={opt}
                    onClick={() => handleAnswerChange(currentQuestion.id, opt)}
                    className={cn(
                      "px-4 py-2 rounded-full text-xs font-bold transition-all",
                      answers[currentQuestion.id] === opt
                        ? "bg-accent text-white shadow-lg shadow-accent/20"
                        : "bg-white text-text-soft border border-gray-100 hover:border-accent/30"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            <button 
              onClick={() => {
                if (interviewStep < questions.length - 1) setInterviewStep(interviewStep + 1);
                else setActiveStep('estimate');
              }}
              className="w-full bg-primary text-white py-8 rounded-[32px] font-black text-lg shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 group"
            >
              <span>Continue</span>
              <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-bg-main overflow-hidden h-full">
      {/* Stepper Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-sm z-20">
        <button onClick={onBack} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
          <ChevronLeft size={24} className="text-primary" />
        </button>
        <div className="flex gap-1">
          {steps.map((s, i) => {
            const isCompleted = steps.findIndex(st => st.id === activeStep) > i;
            const isActive = s.id === activeStep;
            const isClickable = canGoToStep(s.id);

            return (
              <button
                key={s.id}
                disabled={!isClickable}
                onClick={() => setActiveStep(s.id as any)}
                className={cn(
                  "flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl transition-all",
                  isActive ? "bg-primary/5" : "hover:bg-gray-50",
                  !isClickable && "opacity-30 cursor-not-allowed"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                  isActive ? "bg-primary text-white shadow-lg shadow-primary/20" : 
                  isCompleted ? "bg-success/10 text-success" : "bg-gray-100 text-gray-400"
                )}>
                  {isCompleted ? <Check size={16} /> : <s.icon size={16} />}
                </div>
                <span className={cn(
                  "text-[8px] font-black uppercase tracking-widest",
                  isActive ? "text-primary" : "text-gray-400"
                )}>{s.label}</span>
              </button>
            );
          })}
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        <AnimatePresence mode="wait">
          {activeStep === 'goal' && (
            <motion.div 
              key="goal"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8 space-y-10"
            >
              <div className="space-y-4">
                <h2 className="text-3xl font-black text-primary leading-tight tracking-tight">What's the goal?</h2>
                <p className="text-base text-text-soft font-medium">Give your dream a name and category.</p>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-soft uppercase tracking-widest ml-2">Goal Name</label>
                  <input 
                    type="text"
                    value={goalName}
                    onChange={(e) => setGoalName(e.target.value)}
                    placeholder="e.g. My Dream Wedding"
                    className="w-full bg-white border-2 border-gray-100 rounded-[28px] p-6 text-xl font-black text-primary outline-none focus:border-accent shadow-lg shadow-primary/5"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'travel', label: 'Travel', icon: Plane },
                    { id: 'education', label: 'Higher Education', icon: GraduationCap },
                    { id: 'home', label: 'Home', icon: Home },
                    { id: 'luxury', label: 'Luxury Upgrade', icon: Sparkles },
                    { id: 'family', label: 'Family Milestone', icon: Heart },
                    { id: 'wealth', label: 'Wealth Corpus', icon: TrendingUp }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={cn(
                        "p-6 rounded-[28px] border-2 flex flex-col items-center gap-3 transition-all",
                        category === cat.id ? "border-accent bg-accent/5 text-primary shadow-xl" : "border-white bg-white text-text-soft"
                      )}
                    >
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", category === cat.id ? "bg-accent text-white" : "bg-gray-50 text-gray-400")}>
                        <cat.icon size={24} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-center">{cat.label}</span>
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setActiveStep('details')}
                  disabled={!goalName}
                  className="w-full bg-primary text-white py-8 rounded-[32px] font-black text-lg shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <span>Start Discovery</span>
                  <ArrowRight size={20} />
                </button>
              </div>
            </motion.div>
          )}

          {activeStep === 'details' && (
            <motion.div 
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8 space-y-10"
            >
              <div className="flex items-center gap-4 mb-10">
                <button 
                  onClick={() => {
                    if (interviewStep > 0) setInterviewStep(interviewStep - 1);
                    else setActiveStep('goal');
                  }}
                  className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-primary shadow-sm hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${((interviewStep + 1) / questions.length) * 100}%` }}
                    className="h-full bg-accent"
                  />
                </div>
                <span className="text-[10px] font-black text-text-soft uppercase tracking-widest">{interviewStep + 1}/{questions.length}</span>
              </div>

              <div className="space-y-4">
                <div className="w-16 h-16 bg-accent/10 text-accent rounded-3xl flex items-center justify-center text-3xl shadow-inner">
                  {getGoalIcon(category)}
                </div>
                <h2 className="text-3xl font-black text-primary leading-tight tracking-tight">{currentQuestion?.text}</h2>
                <p className="text-sm text-text-soft font-medium">Step {interviewStep + 1} of {questions.length} • {category.charAt(0).toUpperCase() + category.slice(1)} Goal</p>
              </div>

              <div className="flex-1">
                {renderInterviewInput()}
              </div>
            </motion.div>
          )}

          {activeStep === 'estimate' && (
            <motion.div 
              key="estimate"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8 space-y-10"
            >
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-accent/10 text-accent rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <TrendingUp size={40} />
                </div>
                <h2 className="text-3xl font-black text-primary tracking-tight">Future Cost Analysis</h2>
                <p className="text-base text-text-soft font-medium leading-relaxed">We've projected the future cost based on your answers and inflation.</p>
              </div>

              {category === 'custom' ? (
                <div className="bg-gradient-to-br from-primary to-primary-dark rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl shadow-primary/20">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                  <div className="relative z-10 space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-3xl">
                        ✨
                      </div>
                      <div>
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Your Custom Goal</p>
                        <h3 className="text-2xl font-black tracking-tight">{answers.goalName}</h3>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/10">
                      <div>
                        <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-2">Suggested Target</p>
                        <p className="text-2xl font-black">₹{Math.round(estimates.futureCost).toLocaleString('en-IN')}</p>
                        <p className="text-[10px] text-white/60 font-bold mt-1">Adjusted for inflation</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-2">Timeline</p>
                        <p className="text-2xl font-black">{estimates.years} Years</p>
                        <p className="text-[10px] text-white/60 font-bold mt-1">Target: {answers.timeframe}</p>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                          {category === 'debt' ? 'Monthly Repayment' : 'Monthly Contribution'}
                        </span>
                        <span className="text-xl font-black text-accent">₹{Math.round(selectedPlan.monthlySIP).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          feasibility.status === 'High' ? "bg-success" :
                          feasibility.status === 'Moderate' ? "bg-accent" : "bg-error"
                        )} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Feasibility: {feasibility.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-primary rounded-[40px] p-10 text-white text-center relative overflow-hidden shadow-2xl shadow-primary/20">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl" />
                  <div className="relative z-10">
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                      {category === 'debt' ? 'Total Repayment' : 'Target Estimate'}
                    </p>
                    <h3 className="text-5xl font-black mb-6 tracking-tight">₹{Math.round(estimates.futureCost).toLocaleString('en-IN')}</h3>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                      <Zap size={14} className="text-accent" />
                      <span>
                        {category === 'debt' 
                          ? `${Math.round((estimates.futureCost / estimates.todayCost - 1) * 100)}% Interest Load`
                          : `${Math.round(estimates.inflationRate * 100)}% Annual Inflation`
                        }
                      </span>
                    </div>
                    <div className="mt-12 pt-10 border-t border-white/10 grid grid-cols-2 gap-8">
                      <div className="text-left">
                        <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-2">Today's Cost</p>
                        <p className="text-xl font-black">₹{Math.round(estimates.todayCost).toLocaleString('en-IN')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-2">Timeline</p>
                        <p className="text-xl font-black">{estimates.years} Years</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Smart Insights Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 px-2">
                  <Lightbulb size={18} className="text-accent" />
                  <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em]">Smart Insights</h4>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {feasibility.recommendations.map((rec, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white p-5 rounded-3xl border border-gray-100 flex gap-4 items-start shadow-sm"
                    >
                      <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0 mt-0.5">
                        <Zap size={14} />
                      </div>
                      <p className="text-xs font-bold text-text-soft leading-relaxed">{rec}</p>
                    </motion.div>
                  ))}
                  {estimates.years < 3 && (
                    <div className="bg-orange-50 p-5 rounded-3xl border border-orange-100 flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
                        <AlertCircle size={14} />
                      </div>
                      <p className="text-xs font-bold text-orange-800 leading-relaxed">Short timeline detected. We recommend low-risk debt instruments to protect your capital.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Feasibility Score Card */}
              <div className="bg-primary/5 p-8 rounded-[40px] border-2 border-primary/10 space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-primary uppercase tracking-widest">Feasibility Score</span>
                  <span className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm",
                    feasibility.status === 'High' ? "bg-success text-white" :
                    feasibility.status === 'Moderate' ? "bg-accent text-white" : "bg-error text-white"
                  )}>
                    {feasibility.status}
                  </span>
                </div>
                <div className="h-4 bg-white rounded-full overflow-hidden border border-primary/5 shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${feasibility.readinessScore}%` }}
                    className={cn(
                      "h-full rounded-full transition-all duration-1000",
                      feasibility.status === 'High' ? "bg-success" :
                      feasibility.status === 'Moderate' ? "bg-accent" : "bg-error"
                    )}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-black text-text-soft uppercase tracking-widest">
                  <span>Stretched</span>
                  <span>Optimal</span>
                </div>
                <p className="text-[10px] font-bold text-text-soft text-center italic leading-relaxed">
                  Based on your monthly surplus of ₹{Math.round(feasibility.monthlySurplus).toLocaleString('en-IN')}
                </p>
              </div>

              {/* Calculation Transparency Breakdown */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 px-2">
                  <PieChart size={16} className="text-accent" />
                  <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em]">How we calculated this</h4>
                </div>
                <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl overflow-hidden">
                  <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <span className="text-xs font-black text-primary uppercase tracking-widest">
                      {category === 'debt' ? 'Principal Amount' : 'Base Benchmark'}
                    </span>
                    <span className="text-sm font-black text-primary">₹{Math.round(estimates.breakdown.base).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="p-6 space-y-4">
                    {estimates.breakdown.adjustments.map((adj: any, i: number) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-xs font-bold text-text-soft">{adj.label}</span>
                        <span className={cn("text-xs font-black", adj.amount > 0 ? "text-error" : "text-success")}>
                          {adj.amount > 0 ? '+' : ''}₹{Math.round(adj.amount).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                      <span className="text-xs font-bold text-text-soft">
                        {category === 'debt' ? 'Estimated Interest' : `Inflation Adjustment (${Math.round(estimates.inflationRate * 100)}%)`}
                      </span>
                      <span className="text-xs font-black text-error">+₹{Math.round(estimates.breakdown.inflation).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <div className="p-6 bg-primary text-white flex justify-between items-center">
                    <span className="text-sm font-black uppercase tracking-widest">
                      {category === 'debt' ? 'Total to Pay' : 'Final Target'}
                    </span>
                    <span className="text-xl font-black">₹{Math.round(estimates.breakdown.total).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setActiveStep('funding')}
                className="w-full bg-accent text-white py-8 rounded-[32px] font-black text-lg shadow-2xl shadow-accent/30 flex items-center justify-center gap-3 group"
              >
                <span>View Funding Plan</span>
                <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
              </button>
            </motion.div>
          )}

          {activeStep === 'funding' && (
            <motion.div 
              key="funding"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8 space-y-10"
            >
              <div className="text-center space-y-4">
                <div className={cn(
                  "inline-flex items-center gap-3 px-8 py-4 rounded-full border-2 font-black uppercase tracking-[0.2em] text-xs mb-8 shadow-xl",
                  feasibility.status === 'High' ? 'text-success bg-success/10 border-success/20' : 'text-accent bg-accent/10 border-accent/20'
                )}>
                  <ShieldCheck size={20} />
                  {feasibility.status} Feasibility
                </div>
                <h2 className="text-3xl font-black text-primary tracking-tight">Your Funding Plan</h2>
                <p className="text-base text-text-soft font-medium leading-relaxed">We've analyzed your Money Profile to build this plan.</p>
              </div>

              {/* Funding Gap Breakdown */}
              <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl overflow-hidden p-8 space-y-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                    <Activity size={20} />
                  </div>
                  <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em]">Funding Gap Analysis</h4>
                </div>
                
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-text-soft uppercase tracking-widest">Target Estimate</span>
                    <span className="text-lg font-black text-primary">₹{Math.round(estimates.futureCost).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-text-soft uppercase tracking-widest">Allocable Assets (50%)</span>
                    <span className="text-lg font-black text-success">-₹{Math.round(feasibility.allocableAssets).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="h-px bg-gray-100" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-black text-primary uppercase tracking-widest">Funding Gap</span>
                    <span className="text-2xl font-black text-accent">₹{Math.round(feasibility.fundingGap).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="p-4 bg-bg-main rounded-2xl border border-gray-50">
                    <p className="text-[10px] font-black text-text-soft uppercase tracking-widest mb-1">Monthly Surplus</p>
                    <p className="text-lg font-black text-primary">₹{Math.round(feasibility.monthlySurplus).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="p-4 bg-bg-main rounded-2xl border border-gray-50">
                    <p className="text-[10px] font-black text-text-soft uppercase tracking-widest mb-1">Months Left</p>
                    <p className="text-lg font-black text-primary">{estimates.years * 12}</p>
                  </div>
                </div>
              </div>

              {/* Strategy Simulator for Home/Car */}
              {(category === 'home' || (category === 'luxury' && answers.sub_type === 'dream car/ bike')) && (
                <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl p-8 space-y-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/5 flex items-center justify-center text-accent">
                      <TrendingUp size={20} />
                    </div>
                    <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em]">Strategy Simulator</h4>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-text-soft uppercase tracking-widest">Loan Percentage: {loanScenario}%</label>
                      <input 
                        type="range" 
                        min="0" max="100" step="10"
                        value={loanScenario}
                        onChange={(e) => setLoanScenario(parseInt(e.target.value))}
                        className="w-full accent-accent"
                      />
                      <div className="flex justify-between text-[8px] font-black text-text-soft uppercase tracking-widest">
                        <span>Save First</span>
                        <span>Full Loan</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-bg-main rounded-2xl">
                        <p className="text-[9px] font-black text-text-soft uppercase tracking-widest mb-1">Downpayment</p>
                        <p className="text-sm font-black text-primary">₹{Math.round(loanMetrics.dp).toLocaleString('en-IN')}</p>
                      </div>
                      <div className="p-4 bg-bg-main rounded-2xl">
                        <p className="text-[9px] font-black text-text-soft uppercase tracking-widest mb-1">Monthly EMI</p>
                        <p className="text-sm font-black text-accent">₹{Math.round(loanMetrics.emi).toLocaleString('en-IN')}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-primary/5 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-text-soft uppercase tracking-widest">EMI-to-Income Ratio</span>
                        <span className={cn(
                          "text-xs font-black",
                          loanMetrics.emiRatio > 40 ? "text-error" : loanMetrics.emiRatio > 30 ? "text-accent" : "text-success"
                        )}>
                          {Math.round(loanMetrics.emiRatio)}%
                        </span>
                      </div>
                      {loanMetrics.emiRatio > 40 && (
                        <div className="flex gap-2 items-start text-[9px] text-error font-bold leading-tight">
                          <AlertCircle size={12} className="shrink-0" />
                          <p>Warning: EMI exceeds 40% of your income. This is considered high leverage.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Strategy Selection */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 px-2">
                  <Zap size={16} className="text-accent" />
                  <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em]">Select Strategy</h4>
                </div>
                <div className="space-y-6">
                  {plans.map((plan) => (
                    <div key={plan.id} className="space-y-4">
                      <button
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={cn(
                          "w-full p-8 rounded-[40px] border-2 text-left transition-all relative overflow-hidden group",
                          selectedPlanId === plan.id 
                            ? "border-primary bg-primary text-white shadow-2xl shadow-primary/20" 
                            : "border-white bg-white text-primary hover:border-gray-100"
                        )}
                      >
                        {plan.isBestFit && (
                          <div className="absolute top-4 right-4 bg-accent text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg z-10">
                            Recommended
                          </div>
                        )}
                        
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", selectedPlanId === plan.id ? "text-white/60" : "text-text-soft")}>{plan.type}</p>
                            <h3 className="text-xl font-black leading-tight">{plan.name}</h3>
                          </div>
                          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", selectedPlanId === plan.id ? "bg-white/10" : "bg-gray-50")}>
                            <span className="text-lg">{plan.riskLabel === 'Low Risk' ? '🛡️' : plan.riskLabel === 'High Risk' ? '🚀' : '⚖️'}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-8">
                          <div>
                            <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", selectedPlanId === plan.id ? "text-white/60" : "text-text-soft")}>Monthly SIP</p>
                            <p className="text-2xl font-black">₹{Math.round(plan.monthlySIP).toLocaleString('en-IN')}</p>
                          </div>
                          <div className="text-right">
                            <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", selectedPlanId === plan.id ? "text-white/60" : "text-text-soft")}>Expected Return</p>
                            <p className="text-2xl font-black">{plan.expectedReturn}%</p>
                          </div>
                        </div>

                        <div className={cn("p-4 rounded-2xl text-[10px] font-bold leading-relaxed", selectedPlanId === plan.id ? "bg-white/10 text-white/80" : "bg-bg-main text-text-soft")}>
                          <p className="mb-2"><span className="opacity-60 uppercase tracking-widest mr-2">Why it fits:</span> {plan.whyMatches}</p>
                          <p><span className="opacity-60 uppercase tracking-widest mr-2">Watch out:</span> {plan.whyNotSuit}</p>
                        </div>
                      </button>

                      {/* Detailed Investment Breakdown for selected plan */}
                      {selectedPlanId === plan.id && plan.investments && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-xl space-y-6"
                        >
                          <div className="flex items-center gap-2">
                            <PieChart size={14} className="text-accent" />
                            <h5 className="text-[10px] font-black text-primary uppercase tracking-widest">Investment Breakdown</h5>
                          </div>
                          <div className="space-y-4">
                            {plan.investments.map((inv: any, idx: number) => (
                              <div key={idx} className="p-4 bg-bg-main rounded-2xl space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-black text-primary">{inv.name}</span>
                                  <span className="text-[8px] font-black uppercase tracking-widest text-accent bg-accent/5 px-2 py-0.5 rounded-full">{inv.risk} Risk</span>
                                </div>
                                <p className="text-[10px] text-text-soft font-medium leading-relaxed">{inv.purpose}</p>
                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100/50">
                                  <div className="text-[9px]">
                                    <span className="text-text-soft uppercase tracking-widest opacity-60">Returns:</span> <span className="font-black text-primary">{inv.returns}</span>
                                  </div>
                                  <div className="text-[9px] text-right">
                                    <span className="text-text-soft uppercase tracking-widest opacity-60">Horizon:</span> <span className="font-black text-primary">{inv.horizon}</span>
                                  </div>
                                </div>
                                <div className="text-[9px] bg-white/50 p-2 rounded-lg">
                                  <span className="text-text-soft font-bold italic">"{inv.suitability}"</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Alternatives Section */}
                <div className="pt-10 space-y-6">
                  <div className="flex items-center gap-2 px-2">
                    <Archive size={16} className="text-text-soft" />
                    <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em]">Alternative Assets</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {selectedPlan.alternatives?.map((alt: any, idx: number) => (
                      <div key={idx} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-black text-primary">{alt.name}</span>
                          <span className="text-[10px] font-black text-text-soft uppercase tracking-widest">{alt.returns} Returns</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-bg-main p-3 rounded-xl">
                            <p className="text-[8px] font-black text-text-soft uppercase tracking-widest mb-1">Risk</p>
                            <p className="text-xs font-black text-primary">{alt.risk}</p>
                          </div>
                          <div className="bg-bg-main p-3 rounded-xl">
                            <p className="text-[8px] font-black text-text-soft uppercase tracking-widest mb-1">Liquidity</p>
                            <p className="text-xs font-black text-primary">{alt.liquidity}</p>
                          </div>
                        </div>
                        <p className="text-[10px] text-text-soft font-medium leading-relaxed italic">"{alt.caution}"</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* What's Next Section */}
                <div className="pt-10 space-y-6">
                  <div className="flex items-center gap-2 px-2">
                    <Sparkles size={16} className="text-accent" />
                    <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em]">What's Next?</h4>
                  </div>
                  <div className="bg-primary/5 rounded-[40px] p-8 border-2 border-primary/10 space-y-6">
                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                        <PlusCircle size={20} />
                      </div>
                      <div>
                        <h5 className="text-sm font-black text-primary">Automate your Savings</h5>
                        <p className="text-xs font-medium text-text-soft mt-1 leading-relaxed">Set up a monthly auto-debit for ₹{Math.round(selectedPlan.monthlySIP).toLocaleString('en-IN')} to stay on track.</p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-2xl bg-accent text-white flex items-center justify-center shrink-0 shadow-lg shadow-accent/20">
                        <RefreshCw size={20} />
                      </div>
                      <div>
                        <h5 className="text-sm font-black text-primary">Quarterly Review</h5>
                        <p className="text-xs font-medium text-text-soft mt-1 leading-relaxed">We'll remind you every 3 months to review your progress and adjust for any lifestyle changes.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setActiveStep('review')}
                  className="w-full bg-primary text-white py-8 rounded-[32px] font-black text-lg shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 group"
                >
                  <span>Review & Finalize</span>
                  <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}

          {activeStep === 'review' && (
            <motion.div 
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8 space-y-10"
            >
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-success/10 text-success rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <Check size={40} />
                </div>
                <h2 className="text-3xl font-black text-primary tracking-tight">Ready to Start?</h2>
                <p className="text-base text-text-soft font-medium leading-relaxed">Review your goal and plan before we set it in motion.</p>
              </div>

              <div className="bg-white rounded-[40px] p-8 shadow-xl border border-gray-50 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-accent/10 text-accent rounded-2xl flex items-center justify-center text-3xl">
                    {getGoalIcon(category)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-primary">{goalName}</h3>
                    <p className="text-xs font-black text-text-soft uppercase tracking-widest">{category} Goal</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-text-soft uppercase tracking-widest">Target Value</p>
                    <p className="text-xl font-black text-primary">₹{Math.round(estimates.futureCost).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-black text-text-soft uppercase tracking-widest">Target Date</p>
                    <p className="text-xl font-black text-primary">{answers.target_date || answers.target_year || '2026'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-text-soft uppercase tracking-widest">Monthly SIP</p>
                    <p className="text-xl font-black text-accent">₹{Math.round(selectedPlan.monthlySIP).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-black text-text-soft uppercase tracking-widest">Strategy</p>
                    <p className="text-xl font-black text-primary">{selectedPlan.type}</p>
                  </div>
                </div>

                <div className="p-6 bg-bg-main rounded-3xl border border-gray-50">
                  <p className="text-xs text-text-soft font-bold leading-relaxed italic">
                    {isLoanGoal ? (
                      `"By taking a ₹${Math.round(loanMetrics.loanAmt).toLocaleString('en-IN')} loan, allocating ₹${Math.round(feasibility.allocableAssets).toLocaleString('en-IN')} from your current assets, and starting a ₹${Math.round(selectedPlan.monthlySIP).toLocaleString('en-IN')} SIP for the downpayment, you'll reach your goal in ${estimates.years} years."`
                    ) : (
                      `"By allocating ₹${Math.round(feasibility.allocableAssets).toLocaleString('en-IN')} from your current assets and starting a ₹${Math.round(selectedPlan.monthlySIP).toLocaleString('en-IN')} SIP, you'll reach your goal in ${estimates.years} years."`
                    )}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => {
                  const finalGoal = goalCardBuilder({
                    id: Math.random().toString(36).substr(2, 9),
                    name: goalName,
                    category: category,
                    answers: answersArray,
                    target: estimates.futureCost,
                    current: feasibility.allocableAssets,
                    timeline: estimates.years,
                    priority: 'HIGH',
                    color: 'bg-accent',
                    selectedPlan: selectedPlan
                  } as Goal);
                  onComplete(finalGoal as Goal);
                }}
                className="w-full bg-success text-white py-8 rounded-[32px] font-black text-lg shadow-2xl shadow-success/30 flex items-center justify-center gap-3 group"
              >
                <span>Set Goal Live</span>
                <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {recalculating && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl z-50"
        >
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-widest">Recalculating Plan...</span>
        </motion.div>
      )}

      {/* Mutual Fund Drill-down Modal */}
      <AnimatePresence>
        {showMFDrillDown && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-primary/80 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-bg-main w-full max-w-lg rounded-[40px] overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                    <Search size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-primary">Mutual Fund Styles</h3>
                    <p className="text-[10px] font-black text-text-soft uppercase tracking-widest">Educational Guide</p>
                  </div>
                </div>
                <button onClick={() => setShowMFDrillDown(false)} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                  <X size={24} className="text-primary" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {mfSubOptions.map((opt) => (
                  <div key={opt.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-black text-primary">{opt.name}</h4>
                      <div className="px-3 py-1 rounded-full bg-primary/5 text-[8px] font-black uppercase tracking-widest text-primary">
                        {opt.risk} Risk
                      </div>
                    </div>
                    <p className="text-sm text-text-soft font-medium leading-relaxed">{opt.description}</p>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0">
                          <Check size={14} />
                        </div>
                        <div className="text-[11px]">
                          <span className="font-black text-primary uppercase tracking-widest block mb-0.5">Suitable for</span>
                          <span className="text-text-soft font-medium">{opt.suitable}</span>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-lg bg-error/10 text-error flex items-center justify-center shrink-0">
                          <X size={14} />
                        </div>
                        <div className="text-[11px]">
                          <span className="font-black text-primary uppercase tracking-widest block mb-0.5">Not suitable for</span>
                          <span className="text-text-soft font-medium">{opt.notSuitable}</span>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                          <Zap size={14} />
                        </div>
                        <div className="text-[11px]">
                          <span className="font-black text-primary uppercase tracking-widest block mb-0.5">Why this goal?</span>
                          <span className="text-text-soft font-medium">{opt.whyFit}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-50 flex items-center gap-2">
                      <Clock size={14} className="text-gray-300" />
                      <span className="text-[10px] font-black text-text-soft uppercase tracking-widest">Liquidity: {opt.liquidity}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-white border-t border-gray-100">
                <button 
                  onClick={() => setShowMFDrillDown(false)}
                  className="w-full bg-primary text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


const GoalEstimationScreen = ({ 
  estimates, 
  onBack, 
  onNext 
}: { 
  estimates: any, 
  onBack: () => void, 
  onNext: (selected: any) => void 
}) => {
  const [selectedScenario, setSelectedScenario] = useState('balanced');
  const current = estimates[selectedScenario];

  return (
    <div className="flex-1 flex flex-col bg-bg-main overflow-y-auto pb-24">
      <Header title="Smart Estimation" showBack onBack={onBack} />
      <div className="p-8 space-y-10">
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-accent/10 text-accent rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-inner"
          >
            <TrendingUp size={40} />
          </motion.div>
          <h2 className="text-3xl font-black text-primary tracking-tight">Future Cost Analysis</h2>
          <p className="text-base text-text-soft font-medium leading-relaxed px-4">We've projected the future cost of your goal based on market benchmarks and inflation.</p>
        </div>

        <div className="grid grid-cols-3 gap-3 p-2 bg-white rounded-[28px] border border-gray-100 shadow-sm">
          {['conservative', 'balanced', 'premium'].map(s => (
            <button
              key={s}
              onClick={() => setSelectedScenario(s)}
              className={cn(
                "py-4 rounded-[22px] text-[10px] font-black uppercase tracking-widest transition-all",
                selectedScenario === s ? "bg-primary text-white shadow-lg" : "text-text-soft hover:bg-gray-50"
              )}
            >
              {s}
            </button>
          ))}
        </div>

        <motion.div 
          key={selectedScenario}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary rounded-[40px] p-10 text-white text-center relative overflow-hidden shadow-2xl shadow-primary/20"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/10 rounded-full -ml-16 -mb-16 blur-2xl" />
          
          <div className="relative z-10">
            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Estimated Future Cost</p>
            <h3 className="text-5xl font-black mb-6 tracking-tight">₹{(current?.futureCost || 0).toLocaleString('en-IN')}</h3>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
              <Zap size={14} className="text-accent" />
              <span>{current?.inflationRate || 0}% Annual Inflation</span>
            </div>
            
            <div className="mt-12 pt-10 border-t border-white/10 grid grid-cols-2 gap-8">
              <div className="text-left">
                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-2">Today's Cost</p>
                <p className="text-xl font-black">₹{(current?.todayCost || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-2">Timeline</p>
                <p className="text-xl font-black">{current?.years || 0} Years</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="space-y-6">
          <div className="flex items-center gap-2 px-2">
            <PieChart size={16} className="text-accent" />
            <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em]">Cost Breakdown</h4>
          </div>
          <div className="space-y-4">
            {Object.entries(current?.breakdown || {}).map(([key, val]: [string, any], i) => (
              <motion.div 
                key={key} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex justify-between items-center p-6 bg-white rounded-[28px] border border-gray-50 shadow-sm group hover:border-accent/30 transition-all"
              >
                <span className="text-sm font-black text-primary capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                <span className="text-sm font-black text-accent">₹{(val || 0).toLocaleString('en-IN')}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNext(current)} 
          className="w-full bg-accent text-white py-8 rounded-[32px] font-black text-lg shadow-2xl shadow-accent/30 flex items-center justify-center gap-3 group"
        >
          <span>Analyze Feasibility</span>
          <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
        </motion.button>
      </div>
    </div>
  );
};

const GoalFeasibilityScreen = ({ 
  feasibility, 
  user,
  onBack, 
  onNext 
}: { 
  feasibility: any, 
  user: UserProfile,
  onBack: () => void, 
  onNext: () => void 
}) => {
  const statusColors = {
    'High': 'text-success bg-success/10 border-success/20 shadow-success/10',
    'Moderate': 'text-accent bg-accent/10 border-accent/20 shadow-accent/10',
    'Low': 'text-warning bg-warning/10 border-warning/20 shadow-warning/10',
    'Stretched': 'text-error bg-error/10 border-error/20 shadow-error/10'
  };

  return (
    <div className="flex-1 flex flex-col bg-bg-main overflow-y-auto pb-24">
      <Header title="Feasibility Analysis" showBack onBack={onBack} />
      <div className="p-8 space-y-10">
        <div className="text-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              "inline-flex items-center gap-3 px-8 py-4 rounded-full border-2 font-black uppercase tracking-[0.2em] text-xs mb-8 shadow-xl",
              statusColors[feasibility.status as keyof typeof statusColors]
            )}
          >
            <ShieldCheck size={20} />
            {feasibility.status} Feasibility
          </motion.div>
          <h2 className="text-3xl font-black text-primary mb-6 tracking-tight">Can you achieve this?</h2>
          <p className="text-base text-text-soft font-medium leading-relaxed px-2">{feasibility.analysis}</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[32px] p-8 shadow-xl shadow-primary/5 border border-gray-50 space-y-6"
          >
            <div className="flex items-center gap-2 mb-2">
              <Activity size={16} className="text-accent" />
              <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em]">Key Metrics</h4>
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-text-soft uppercase tracking-widest">Monthly Surplus</span>
                <span className="text-lg font-black text-primary">₹{(feasibility?.monthlySurplus || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="w-full h-px bg-gray-50" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-text-soft uppercase tracking-widest">Monthly Needed</span>
                <span className="text-lg font-black text-accent">₹{Math.round(feasibility?.monthlyNeeded || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </motion.div>

          {feasibility?.status !== 'High' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-warning/5 border-2 border-dashed border-warning/20 rounded-[32px] p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center text-warning">
                  <TrendingDown size={20} />
                </div>
                <h4 className="text-xs font-black text-warning uppercase tracking-[0.2em]">Expense Diagnosis</h4>
              </div>
              <p className="text-sm text-primary font-black mb-6 leading-relaxed">We found potential leaks in your spending that could fund this goal:</p>
              <div className="space-y-4">
                {expenseCutAnalyzer(user).map((cut, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex justify-between items-center p-5 bg-white rounded-2xl border border-gray-50 shadow-sm"
                  >
                    <div>
                      <p className="text-xs font-black text-primary uppercase tracking-widest mb-1">{cut.name}</p>
                      <p className="text-[10px] text-text-soft font-bold uppercase tracking-tighter">{cut.suggestions[0]}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-success">+₹{Math.round((cut.amount || 0) * 0.2).toLocaleString('en-IN')}</p>
                      <p className="text-[9px] text-text-soft font-black uppercase tracking-tighter">Potential</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-accent/5 border border-accent/10 rounded-[32px] p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                <Zap size={20} />
              </div>
              <h4 className="text-xs font-black text-accent uppercase tracking-[0.2em]">Advisory Notes</h4>
            </div>
            <ul className="space-y-4">
              {(feasibility?.recommendations || []).map((rec: string, i: number) => (
                <li key={i} className="flex gap-4 text-sm font-bold text-primary leading-relaxed">
                  <div className="w-2 h-2 bg-accent rounded-full mt-2 shrink-0 shadow-[0_0_8px_rgba(245,166,35,0.5)]" />
                  {rec}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-primary rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-primary/20"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
              <Lightbulb size={24} className="text-accent" />
            </div>
            <h4 className="text-sm font-black uppercase tracking-[0.2em]">Smart Tip</h4>
          </div>
          <p className="text-sm text-white/70 leading-relaxed italic font-medium">
            "At 12% returns, your money doubles every 6 years. Starting now could save you ₹{Math.round((feasibility?.monthlySurplus || 0) * 12).toLocaleString('en-IN')} in future effort."
          </p>
        </motion.div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNext} 
          className="w-full bg-accent text-white py-8 rounded-[32px] font-black text-lg shadow-2xl shadow-accent/30 flex items-center justify-center gap-3 group"
        >
          <span>View Funding Plans</span>
          <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
        </motion.button>
      </div>
    </div>
  );
};

const GoalPlansScreen = ({ 
  plans, 
  onBack, 
  onSelect 
}: { 
  plans: GoalPlan[], 
  onBack: () => void, 
  onSelect: (plan: GoalPlan) => void 
}) => {
  return (
    <div className="flex-1 flex flex-col bg-bg-main overflow-y-auto pb-24">
      <Header title="Funding Plans" showBack onBack={onBack} />
      <div className="p-8 space-y-10">
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-accent/10 text-accent rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-inner"
          >
            <Zap size={40} />
          </motion.div>
          <h2 className="text-3xl font-black text-primary tracking-tight">Choose Your Strategy</h2>
          <p className="text-base text-text-soft font-medium leading-relaxed px-4">We've generated multiple paths to your goal. Select the one that fits your comfort level.</p>
        </div>

        <div className="space-y-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.type}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              onClick={() => onSelect(plan)}
              className={cn(
                "bg-white rounded-[32px] p-8 shadow-xl shadow-primary/5 border-2 cursor-pointer transition-all relative overflow-hidden group active:scale-[0.98]",
                plan.type === 'Fast-track' ? "border-accent/20 hover:border-accent" : "border-gray-50 hover:border-primary/20"
              )}
            >
              {plan.type === 'Fast-track' && (
                <div className="absolute top-0 right-0 px-5 py-2 bg-accent text-white text-[10px] font-black uppercase tracking-widest rounded-bl-2xl shadow-lg">
                  Recommended
                </div>
              )}

              <div className="flex justify-between items-start mb-8">
                <div>
                  <h4 className="text-xl font-black text-primary mb-1">{plan.type} Strategy</h4>
                  <p className="text-[10px] font-black text-text-soft uppercase tracking-widest">{plan.riskNote}</p>
                </div>
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                  plan.type === 'Fast-track' ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
                )}>
                  {plan.type === 'Fast-track' ? <Zap size={24} /> : <Shield size={24} />}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-[10px] font-black text-text-soft uppercase tracking-widest mb-2">Monthly SIP</p>
                  <p className="text-2xl font-black text-primary">₹{(plan.monthlySIP || 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-text-soft uppercase tracking-widest mb-2">One-time</p>
                  <p className="text-2xl font-black text-accent">₹{(plan.oneTimeAmount || 0).toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div className="p-5 bg-bg-main rounded-2xl border border-gray-50 mb-8">
                <p className="text-[10px] font-black text-primary/30 uppercase tracking-[0.2em] mb-3">Strategy Summary</p>
                <p className="text-xs text-primary leading-relaxed font-medium">{plan.milestoneSummary}</p>
              </div>

              <div className="flex items-center justify-between p-5 bg-bg-main rounded-2xl border border-gray-50 group-hover:border-accent/20 transition-colors">
                <span className="text-xs font-black text-primary uppercase tracking-widest">Select This Plan</span>
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:bg-accent group-hover:text-white transition-all">
                  <ChevronRight size={18} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const SmartMiniGoalReportScreen = ({ report, onBack, onAdd, onUpdate }: { report: any, onBack: () => void, onAdd: (goal: MiniGoal) => void, onUpdate: (goal: MiniGoal) => void }) => {
  const editingGoal = report.editingGoal as MiniGoal | undefined;
  const [timeline, setTimeline] = useState(editingGoal?.timelineMonths || 6);
  const [importance, setImportance] = useState<'ESSENTIAL' | 'IMPORTANT' | 'NICE_TO_HAVE'>(editingGoal?.importance || 'IMPORTANT');
  const [fundingPlan, setFundingPlan] = useState(editingGoal?.fundingPlanChoice || 'cash-flow');
  const [name, setName] = useState(editingGoal?.name || report.name);
  const [target, setTarget] = useState(editingGoal?.target || report.targetPrice);

  if (!report) return null;

  const handleSave = () => {
    if (editingGoal) {
      onUpdate({
        ...editingGoal,
        name,
        target,
        timelineMonths: timeline,
        importance,
        fundingPlanChoice: fundingPlan,
        category: report.category || editingGoal.category,
        tips: report.tips || editingGoal.tips,
        comparisons: report.comparisons || editingGoal.comparisons
      });
    } else {
      const newMiniGoal: MiniGoal = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        target,
        current: 0,
        image: `https://picsum.photos/seed/${name}/400/400`,
        category: report.category || 'Lifestyle',
        tips: report.tips || [],
        comparisons: report.comparisons || [],
        timelineMonths: timeline,
        importance,
        fundingPlanChoice: fundingPlan,
        status: 'ACTIVE'
      };
      onAdd(newMiniGoal);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-bg-main overflow-y-auto pb-24">
      <Header title={editingGoal ? "Edit Mini Goal" : "AI Smart Analysis"} showBack onBack={onBack} />
      
      <div className="p-8 space-y-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles size={40} />
          </div>
          <div className="space-y-4">
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-3xl font-black text-primary text-center bg-transparent border-b-2 border-primary/10 focus:border-accent outline-none w-full"
            />
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs font-black text-text-soft uppercase tracking-widest">Target: ₹</span>
              <input 
                type="number"
                value={target}
                onChange={(e) => setTarget(parseInt(e.target.value))}
                className="text-xl font-black text-success bg-transparent border-b-2 border-success/10 focus:border-success outline-none w-32 text-center"
              />
            </div>
          </div>
        </div>

        {/* Timeline Selection */}
        <div className="card p-8 bg-white border-2 border-primary/5 space-y-6">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
              <Clock size={14} className="text-accent" />
              When do you want this?
            </h4>
            <span className="text-xl font-black text-primary">{timeline} Months</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="60" 
            value={timeline} 
            onChange={(e) => setTimeline(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-100 rounded-full appearance-none cursor-pointer accent-accent"
          />
          <div className="flex justify-between text-[10px] font-black text-text-soft uppercase tracking-widest">
            <span>1 Month</span>
            <span>5 Years</span>
          </div>
        </div>

        {/* Importance Selection */}
        <div className="card p-8 bg-white border-2 border-primary/5 space-y-6">
          <h4 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
            <AlertCircle size={14} className="text-accent" />
            How important is this?
          </h4>
          <div className="grid grid-cols-3 gap-3">
            {(['ESSENTIAL', 'IMPORTANT', 'NICE_TO_HAVE'] as const).map((imp) => (
              <button
                key={imp}
                onClick={() => setImportance(imp)}
                className={cn(
                  "py-4 rounded-2xl text-[8px] font-black uppercase tracking-widest transition-all border-2",
                  importance === imp ? "bg-primary text-white border-primary" : "bg-bg-main text-text-soft border-gray-50"
                )}
              >
                {imp.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Funding Plan Choice */}
        <div className="card p-8 bg-white border-2 border-primary/5 space-y-6">
          <h4 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
            <Zap size={14} className="text-accent" />
            Choose Funding Plan
          </h4>
          <div className="space-y-3">
            {[
              { id: 'cash-flow', name: 'Cash-flow-only', desc: 'Pay from monthly surplus' },
              { id: 'parking', name: 'Short-term parking', desc: 'Safe, liquid investments' },
              { id: 'step-up', name: 'Step-up plan', desc: 'Gradually increase savings' }
            ].map((plan) => (
              <button
                key={plan.id}
                onClick={() => setFundingPlan(plan.id)}
                className={cn(
                  "w-full p-4 rounded-2xl border-2 text-left transition-all",
                  fundingPlan === plan.id ? "border-accent bg-accent/5" : "border-gray-50 bg-bg-main"
                )}
              >
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">{plan.name}</p>
                <p className="text-[8px] text-text-soft font-bold mt-1">{plan.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="card p-6 bg-white border-2 border-primary/5">
            <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
              <TrendingDown size={14} className="text-accent" />
              Price Analysis
            </h4>
            <p className="text-sm text-text-soft leading-relaxed">{report.analysis}</p>
          </div>

          <div className="card p-6 bg-white border-2 border-primary/5">
            <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
              <ShoppingBag size={14} className="text-accent" />
              Best Deals Found
            </h4>
            <div className="space-y-3">
              {(report.comparisons || []).map((c: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-3 bg-bg-main rounded-xl">
                  <span className="text-xs font-bold text-primary">{c.store}</span>
                  <span className="text-xs font-black text-accent">₹{(c.price || 0).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6 bg-white border-2 border-primary/5">
            <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
              <Lightbulb size={14} className="text-accent" />
              Smart Tips
            </h4>
            <ul className="space-y-3">
              {(report.tips || []).map((tip: string, i: number) => (
                <li key={i} className="flex gap-3 text-xs font-bold text-text-soft leading-relaxed">
                  <div className="w-1.5 h-1.5 bg-accent rounded-full mt-1.5 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          className="w-full bg-accent text-white py-6 rounded-3xl font-black text-sm tracking-widest shadow-2xl shadow-accent/30 flex items-center justify-center gap-3"
        >
          {editingGoal ? "SAVE CHANGES" : "ADD TO MY GOALS"}
        </motion.button>
      </div>
    </div>
  );
};

const SmartGoalReportSummaryScreen = ({ report, onBack, onNavigate, onAddGoal }: { report: any, onBack: () => void, onNavigate: (tab: Tab) => void, onAddGoal: (goal: Goal) => void }) => {
  if (!report) return null;

  return (
    <div className="flex-1 flex flex-col bg-bg-main overflow-y-auto pb-24">
      <Header title="Smart Goal Report" showBack onBack={onBack} />
      
      <div className="p-8 space-y-10">
        <div className="text-center">
          <motion.div 
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            className="w-28 h-28 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-success/10 border-4 border-white"
          >
            <Check size={56} strokeWidth={4} />
          </motion.div>
          <h2 className="text-4xl font-black text-primary leading-tight mb-2">Plan Ready!</h2>
          <p className="text-sm text-text-soft leading-relaxed">Your {report.tripSummary?.destination || 'Trip'} is now a Smart Goal with a clear path to success.</p>
        </div>

        <div className="card bg-primary text-white p-10 relative overflow-hidden shadow-2xl shadow-primary/30 rounded-[40px]">
          <div className="absolute -top-6 -right-6 p-6 opacity-10 rotate-12">
            <PieChart size={160} />
          </div>
          <div className="relative z-10">
            <p className="label-caps text-white/60 mb-3">Total Estimated Cost</p>
            <h3 className="text-5xl font-black mb-8">₹{(report.costFuture?.maxInr || 0).toLocaleString('en-IN')}</h3>
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest bg-white/10 p-4 rounded-2xl inline-flex backdrop-blur-md border border-white/10">
              <TrendingUp size={16} />
              <span>{report.costFuture?.assumptions || 'Estimated with inflation'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="card p-8 bg-white shadow-xl shadow-primary/5 border border-gray-100">
            <p className="label-caps text-text-soft mb-2">Monthly Savings</p>
            <p className="text-2xl font-black text-primary">₹{(report.savingPlan?.requiredPerMonthInr || 0).toLocaleString('en-IN')}</p>
          </div>
          <div className="card p-8 bg-white shadow-xl shadow-primary/5 border border-gray-100 text-right">
            <p className="label-caps text-text-soft mb-2">Timeline</p>
            <p className="text-2xl font-black text-primary">{report.savingPlan?.monthsToSave || 0} Months</p>
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="label-caps text-text-soft mb-2">Plan Breakdown</h4>
          {[
            { label: 'Flights', value: report.costToday?.breakdown?.flights || 0, icon: <Plane size={22} />, color: '#1a3a5c' },
            { label: 'Accommodation', value: report.costToday?.breakdown?.stay || 0, icon: <Home size={22} />, color: '#f5a623' },
            { label: 'Food & Dining', value: report.costToday?.breakdown?.food || 0, icon: <ShoppingBag size={22} />, color: '#0d9488' }
          ].map((item, i) => (
            <div key={i} className="flex justify-between items-center p-6 bg-white rounded-3xl border border-gray-100 shadow-xl shadow-primary/5 group hover:border-primary/10 transition-all">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: item.color, boxShadow: `0 8px 16px ${item.color}20` }}>
                  {item.icon}
                </div>
                <span className="text-sm font-black text-primary">{item.label}</span>
              </div>
              <span className="text-sm font-black text-primary">₹{(item.value || 0).toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 pt-4">
          <button 
            onClick={() => {
              onAddGoal({
                id: Math.random().toString(36).substr(2, 9),
                name: `${report.tripSummary?.destination || 'Trip'} Trip`,
                category: 'travel',
                target: report.costFuture?.maxInr || 0,
                current: 0,
                timeline: Math.ceil((report.savingPlan?.monthsToSave || 12) / 12),
                priority: 'HIGH',
                color: '#f5a623',
                todayPrice: report.costToday?.maxInr || 0,
                futureCost: report.costFuture?.maxInr || 0,
                inflationRate: 0.08
              } as Goal);
              onNavigate('goals');
            }}
            className="w-full btn-accent py-5 shadow-2xl shadow-accent/30 text-sm font-black tracking-widest"
          >
            ADD TO MY GOALS
          </button>
          <button 
            onClick={() => onNavigate('expense-breakdown')}
            className="w-full py-5 text-sm font-black text-primary uppercase tracking-widest border-2 border-primary/5 rounded-3xl"
          >
            VIEW DETAILED ANALYSIS
          </button>
          <button 
            onClick={onBack}
            className="w-full py-5 text-sm font-black text-text-soft uppercase tracking-widest"
          >
            RE-CALCULATE
          </button>
        </div>
      </div>
    </div>
  );
};

const ExpenseBreakdownScreen = ({ report, onBack, onNavigate }: { report: any, onBack: () => void, onNavigate: (tab: Tab) => void }) => {
  if (!report) return null;

  const expenses = [
    { category: 'Flights', amount: report.costToday?.breakdown?.flights || 0, color: '#1a3a5c', icon: Plane },
    { category: 'Accommodation', amount: report.costToday?.breakdown?.stay || 0, color: '#f5a623', icon: Home },
    { category: 'Food & Dining', amount: report.costToday?.breakdown?.food || 0, color: '#0d9488', icon: ShoppingBag },
    { category: 'Transport', amount: report.costToday?.breakdown?.transport || 0, color: '#ef4444', icon: Car },
    { category: 'Activities', amount: report.costToday?.breakdown?.activities || 0, color: '#8b5cf6', icon: Camera },
    { category: 'Buffer', amount: report.costToday?.breakdown?.buffer || 0, color: '#64748b', icon: ShieldCheck }
  ];

  const total = expenses.reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="flex-1 flex flex-col bg-bg-main overflow-y-auto pb-24">
      <Header title="Expense Analysis" showBack onBack={onBack} />
      
      <div className="p-6 space-y-8">
        <div className="card p-8 bg-white shadow-xl shadow-primary/5 border border-gray-100">
          <div className="h-72 relative flex items-center justify-center mb-12">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={expenses}
                  innerRadius={80}
                  outerRadius={105}
                  paddingAngle={8}
                  dataKey="amount"
                  stroke="none"
                >
                  {expenses.map((entry, index) => (
                    <ReCell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 15px 35px rgba(0,0,0,0.15)' }}
                  formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']} 
                />
              </RePieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center">
              <p className="label-caps text-text-soft mb-1">Total Goal Cost</p>
              <p className="text-3xl font-black text-primary">₹{(total/100000).toFixed(2)}L</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="label-caps text-text-soft mb-6">Category Breakdown</h4>
            {expenses.map((exp, i) => (
              <div key={i} className="flex items-center gap-5 p-5 bg-bg-soft rounded-3xl border border-transparent hover:border-primary/10 transition-all group">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform" style={{ backgroundColor: exp.color, boxShadow: `0 10px 20px ${exp.color}30` }}>
                  <exp.icon size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-sm font-black text-primary">{exp.category}</p>
                    <p className="text-sm font-black text-primary">₹{(exp.amount || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 bg-white rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(exp.amount/total)*100}%` }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        className="h-full rounded-full" 
                        style={{ backgroundColor: exp.color }} 
                      />
                    </div>
                    <span className="text-[10px] font-black text-text-soft min-w-[30px]">{Math.round((exp.amount/total)*100)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <motion.div 
          whileHover={{ y: -5 }}
          onClick={() => onNavigate('save-together')}
          className="card bg-accent text-white p-8 shadow-2xl shadow-accent/30 cursor-pointer relative overflow-hidden group"
        >
          <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <Users size={140} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Users size={24} />
              </div>
              <span className="label-caps text-white/80">Collaborative Goal</span>
            </div>
            <h3 className="text-2xl font-black mb-2">Save Together?</h3>
            <p className="text-sm text-white/80 leading-relaxed mb-8">
              Invite your partner or family to track shared expenses and reach this goal 2x faster.
            </p>
            <div className="flex items-center gap-2 text-sm font-black">
              <span>INVITE PARTNERS</span>
              <ChevronRight size={18} />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const SaveTogetherScreen = ({ onBack }: { onBack: () => void }) => {
  const [invited, setInvited] = useState(false);

  return (
    <div className="flex-1 flex flex-col bg-bg-main overflow-y-auto pb-24">
      <Header title="Save Together" showBack onBack={onBack} />
      
      <div className="p-8 flex-1 flex flex-col items-center justify-center text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-10 shadow-2xl border-4 border-primary/5 relative"
        >
          <div className="absolute inset-0 bg-accent/10 rounded-full animate-ping opacity-20" />
          <Users2 size={64} className="text-primary relative z-10" />
        </motion.div>

        <h2 className="text-3xl font-black text-primary mb-3 leading-tight">Europe Trip 2028</h2>
        <p className="text-sm text-text-soft mb-12 max-w-[280px] leading-relaxed">Invite your travel partners to start a joint goal and track progress together.</p>

        {!invited ? (
          <div className="w-full space-y-8">
            <div className="bg-white p-6 rounded-3xl shadow-xl shadow-primary/5 border-2 border-gray-100 flex items-center gap-4 focus-within:border-accent transition-all group">
              <div className="w-12 h-12 bg-bg-soft rounded-2xl flex items-center justify-center text-text-soft group-focus-within:bg-accent/10 group-focus-within:text-accent transition-colors">
                <Plus size={24} />
              </div>
              <input 
                type="text" 
                placeholder="Enter phone or email" 
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-black text-primary placeholder:text-gray-300"
              />
            </div>

            <div className="space-y-4">
              <button 
                onClick={() => setInvited(true)}
                className="w-full btn-accent py-5 shadow-2xl shadow-accent/30 text-sm font-black tracking-widest"
              >
                SEND INVITATION
              </button>
              
              <div className="flex items-center gap-4 py-4">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="label-caps text-gray-400">or share via</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <div className="flex justify-center gap-6">
                <button className="w-14 h-14 bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center text-success hover:scale-110 transition-transform">
                  <Share2 size={24} />
                </button>
                <button className="w-14 h-14 bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center text-primary hover:scale-110 transition-transform">
                  <Copy size={24} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-success/5 border-2 border-success/20 p-10 rounded-[40px] w-full"
          >
            <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={40} />
            </div>
            <h3 className="text-xl font-black text-primary mb-2">Invite Sent!</h3>
            <p className="text-sm text-text-soft leading-relaxed">We've sent a magic link to your partner. You'll be notified once they join.</p>
            <button 
              onClick={onBack}
              className="mt-8 text-sm font-black text-primary underline underline-offset-8 decoration-accent decoration-2"
            >
              Back to Analysis
            </button>
          </motion.div>
        )}

        <div className="mt-12 w-full">
          <h4 className="label-caps text-gray-400 mb-6 text-left">Goal Partners</h4>
          <div className="flex -space-x-4">
            <div className="w-14 h-14 rounded-full border-4 border-white bg-primary flex items-center justify-center text-white font-black text-lg shadow-lg">Y</div>
            <div className="w-14 h-14 rounded-full border-4 border-white bg-bg-soft flex items-center justify-center text-gray-300 italic text-sm shadow-lg">?</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DeleteGoalModal = ({ 
  isOpen, 
  onClose, 
  onConfirm 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onConfirm: (reason: string, note: string) => void 
}) => {
  const [reason, setReason] = useState('goal postponed');
  const [note, setNote] = useState('');

  const reasons = [
    'goal postponed',
    'no longer relevant',
    'wrong details entered',
    'budget not feasible now',
    'merged into another goal',
    'already achieved',
    'just exploring',
    'other'
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-primary/80 backdrop-blur-md z-[100] flex items-center justify-center p-6"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white w-full max-w-md rounded-[40px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
          >
            <div className="p-10 pb-4 text-center space-y-4">
              <div className="w-20 h-20 bg-error/10 text-error rounded-[32px] flex items-center justify-center mx-auto mb-6">
                <Trash2 size={40} />
              </div>
              <h3 className="text-3xl font-black text-primary tracking-tight">Delete Goal?</h3>
              <p className="text-sm text-text-soft font-medium leading-relaxed">We'll move this to your archive. You can restore it anytime.</p>
            </div>

            <div className="flex-1 overflow-y-auto px-10 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-soft uppercase tracking-widest ml-2">Reason for deleting</label>
                <select 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-bg-main border-2 border-gray-100 rounded-2xl p-4 text-sm font-black text-primary outline-none focus:border-accent"
                >
                  {reasons.map(r => (
                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
              </div>

              {reason === 'other' && (
                <div className="space-y-2 pb-6">
                  <label className="text-[10px] font-black text-text-soft uppercase tracking-widest ml-2">Additional Note (Optional)</label>
                  <textarea 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Tell us more..."
                    className="w-full bg-bg-main border-2 border-gray-100 rounded-2xl p-4 text-sm font-medium text-primary outline-none focus:border-accent h-24 resize-none"
                  />
                </div>
              )}
            </div>

            <div className="p-10 pt-4 bg-white border-t border-gray-50 flex gap-4 mt-auto pb-safe sticky bottom-0 z-10">
              <button 
                onClick={onClose}
                className="flex-[1] py-5 rounded-2xl font-black text-sm uppercase tracking-widest text-text-soft hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => onConfirm(reason, note)}
                className="flex-[2] py-5 rounded-2xl font-black text-sm uppercase tracking-widest bg-error text-white shadow-xl shadow-error/20"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const MultiGoalRoadmap = ({ goals, user, onBack }: { goals: Goal[], user: UserProfile, onBack: () => void }) => {
  const metrics = calculateMetrics(user.profilingData || {});
  const activeGoals = goals.filter(g => g.status !== 'DELETED');
  const sortedGoals = [...activeGoals].sort((a, b) => a.timeline - b.timeline);
  
  const totalMonthlyNeeded = activeGoals.reduce((acc, g) => {
    const f = feasibilityAnalyzer(user, g.target, g.timeline);
    return acc + f.monthlyNeeded;
  }, 0);

  return (
    <div className="flex-1 flex flex-col bg-bg-main overflow-y-auto pb-24">
      <Header title="Goal Roadmap" showBack onBack={onBack} />
      <div className="p-8 space-y-10">
        {/* Summary Card */}
        <div className="bg-primary p-8 rounded-[40px] text-white space-y-6 shadow-2xl shadow-primary/20">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Monthly Required</p>
              <h3 className="text-3xl font-black">₹{Math.round(totalMonthlyNeeded).toLocaleString('en-IN')}</h3>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Current Surplus</p>
              <h3 className="text-xl font-black text-success">₹{Math.round(metrics.surplus).toLocaleString('en-IN')}</h3>
            </div>
          </div>
          
          <div className="p-4 bg-white/10 rounded-2xl flex items-center gap-3">
            <div className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              metrics.surplus >= totalMonthlyNeeded ? "bg-success" : "bg-error"
            )} />
            <p className="text-[10px] font-bold">
              {metrics.surplus >= totalMonthlyNeeded 
                ? "Your surplus covers all goals! You're in a great position." 
                : `You have a ₹${Math.round(totalMonthlyNeeded - metrics.surplus).toLocaleString('en-IN')} monthly gap to fund all goals.`}
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-8 relative">
          <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gray-100" />
          
          {sortedGoals.length > 0 ? sortedGoals.map((goal, idx) => {
            const f = feasibilityAnalyzer(user, goal.target, goal.timeline);
            return (
              <motion.div 
                key={goal.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="relative pl-16"
              >
                <div className="absolute left-4 top-2 w-4 h-4 rounded-full bg-white border-4 border-accent z-10" />
                <div className="bg-white p-6 rounded-[32px] border border-gray-50 shadow-xl space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[8px] font-black uppercase tracking-widest text-text-soft">{goal.timeline} Years</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                          goal.priority === 'HIGH' ? "bg-error/10 text-error" : "bg-primary/5 text-primary"
                        )}>
                          {goal.priority} Priority
                        </span>
                      </div>
                      <h4 className="text-lg font-black text-primary">{goal.name}</h4>
                    </div>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                      f.status === 'High' ? "bg-success/10 text-success" : "bg-accent/10 text-accent"
                    )}>
                      {f.status}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-[10px] font-bold text-text-soft">
                    <span>Target: ₹{goal.target.toLocaleString('en-IN')}</span>
                    <span>SIP: ₹{Math.round(f.monthlyNeeded).toLocaleString('en-IN')}/mo</span>
                  </div>
                </div>
              </motion.div>
            );
          }) : (
            <div className="text-center py-20">
              <p className="text-sm font-bold text-text-soft">No active goals found. Start discovering!</p>
            </div>
          )}
        </div>

        {/* What to do this month */}
        <div className="space-y-6">
          <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] px-2">What to do this month</h3>
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-[32px] border border-gray-50 shadow-lg flex items-center gap-4">
              <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center shrink-0">
                <Zap size={24} />
              </div>
              <p className="text-xs font-bold text-primary leading-relaxed">Automate your SIPs for the top 2 priority goals to ensure consistency.</p>
            </div>
            <div className="bg-white p-6 rounded-[32px] border border-gray-50 shadow-lg flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/5 text-primary rounded-2xl flex items-center justify-center shrink-0">
                <ShieldCheck size={24} />
              </div>
              <p className="text-xs font-bold text-primary leading-relaxed">Review your emergency fund; ensure it covers 6 months of total EMIs.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RestoreToast = ({ onRestore, onClose }: { onRestore: () => void, onClose: () => void }) => (
  <motion.div 
    initial={{ y: 100, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    exit={{ y: 100, opacity: 0 }}
    className="fixed bottom-28 left-6 right-6 bg-primary text-white p-6 rounded-[32px] shadow-2xl z-[60] flex items-center justify-between"
  >
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
        <RefreshCw size={20} className="text-accent" />
      </div>
      <div>
        <p className="text-xs font-black uppercase tracking-widest">Goal Deleted</p>
        <p className="text-[10px] opacity-60 font-bold">You can restore it now</p>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <button onClick={onRestore} className="text-xs font-black text-accent uppercase tracking-widest">Restore</button>
      <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X size={16} /></button>
    </div>
  </motion.div>
);

const GoalFundingTracker = ({ 
  goal, 
  user, 
  onUpdateInstruments 
}: { 
  goal: Goal | MiniGoal, 
  user: UserProfile, 
  onUpdateInstruments: (instruments: InvestmentInstrument[]) => void 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [editingInstrument, setEditingInstrument] = useState<InvestmentInstrument | null>(null);
  
  const instruments = user.instruments || [];
  const funding = calculateGoalFunding(goal, instruments);

  const handleAddInstrument = (inst: Partial<InvestmentInstrument>) => {
    const newInst: InvestmentInstrument = {
      id: Math.random().toString(36).substr(2, 9),
      type: inst.type || 'Mutual Fund',
      name: inst.name || 'New Investment',
      startDate: inst.startDate || new Date().toISOString().split('T')[0],
      contributionType: inst.contributionType || 'SIP',
      monthlyContribution: inst.monthlyContribution || 0,
      investedAmount: inst.investedAmount || 0,
      currentValue: inst.currentValue || 0,
      note: inst.note,
      linkedGoals: [{ goalId: goal.id, allocationPercent: 100 }]
    };
    onUpdateInstruments([...instruments, newInst]);
    setIsAdding(false);
  };

  const handleUpdateInstrument = (inst: InvestmentInstrument) => {
    onUpdateInstruments(instruments.map(i => i.id === inst.id ? inst : i));
    setEditingInstrument(null);
  };

  const handleLinkExisting = (instId: string) => {
    const inst = instruments.find(i => i.id === instId);
    if (inst) {
      const alreadyLinked = inst.linkedGoals.some(lg => lg.goalId === goal.id);
      if (!alreadyLinked) {
        const totalAllocated = inst.linkedGoals.reduce((sum, lg) => sum + lg.allocationPercent, 0);
        const remaining = 100 - totalAllocated;
        if (remaining > 0) {
          const updatedInst = {
            ...inst,
            linkedGoals: [...inst.linkedGoals, { goalId: goal.id, allocationPercent: remaining }]
          };
          onUpdateInstruments(instruments.map(i => i.id === instId ? updatedInst : i));
        }
      }
    }
    setIsLinking(false);
  };

  const getSuggestion = (inst: InvestmentInstrument, goal: Goal | MiniGoal) => {
    const isLongTerm = (goal as Goal).timeline ? (goal as Goal).timeline > 5 : false;
    const isEquity = ['Mutual Fund', 'Direct Stock', 'Index Fund', 'SIP'].includes(inst.type);
    const isDebt = ['FD', 'RD', 'PPF', 'EPF / VPF', 'Debt Fund', 'Bond'].includes(inst.type);
    
    if (isLongTerm && isEquity) return { text: "Best fit allocation", color: "text-success" };
    if (!isLongTerm && isEquity) return { text: "Too risky for this goal", color: "text-error" };
    if (isLongTerm && isDebt) return { text: "Better for near-term goals", color: "text-accent" };
    if (!isLongTerm && isDebt) return { text: "Best fit for stability", color: "text-success" };
    
    return { text: "Consider increasing allocation", color: "text-primary" };
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center px-2">
        <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em]">Goal Funding Tracker</h3>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsLinking(true)}
            className="px-4 py-2 bg-primary/5 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 transition-colors"
          >
            Link Existing
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-accent/20 hover:scale-105 transition-transform"
          >
            + New Instrument
          </button>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="bg-white p-8 rounded-[40px] border border-gray-50 shadow-xl space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] font-black text-text-soft uppercase tracking-widest mb-2">Total Linked Value</p>
            <p className="text-3xl font-black text-primary">₹{Math.round(funding.totalLinkedValue).toLocaleString('en-IN')}</p>
          </div>
          <div className={cn(
            "px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest",
            funding.status === 'ON-TRACK' ? "bg-success/10 text-success" : "bg-error/10 text-error"
          )}>
            {funding.status}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-[10px] font-black text-text-soft uppercase tracking-widest mb-1">Monthly Inflow</p>
            <p className="text-lg font-black text-primary">₹{Math.round(funding.totalMonthlyInflow).toLocaleString('en-IN')}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-text-soft uppercase tracking-widest mb-1">Remaining Gap</p>
            <p className="text-lg font-black text-error">₹{Math.round(funding.remainingGap).toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-text-soft uppercase tracking-widest">Funding Progress</span>
            <span className="text-[10px] font-black text-primary tracking-widest">{Math.round(funding.progressPercent)}%</span>
          </div>
          <div className="w-full h-3 bg-bg-main rounded-full overflow-hidden border border-gray-50 shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, funding.progressPercent)}%` }}
              className="h-full bg-success rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Linked Instruments List */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-black text-text-soft uppercase tracking-widest px-2">Linked Instruments</h4>
        {funding.linkedInstruments.length === 0 ? (
          <div className="bg-white p-10 rounded-[40px] border border-dashed border-gray-200 text-center">
            <p className="text-xs font-bold text-text-soft">No instruments linked yet. Start by adding where you invest for this goal.</p>
          </div>
        ) : (
          funding.linkedInstruments.map(inst => {
            const link = inst.linkedGoals.find(lg => lg.goalId === goal.id)!;
            const suggestion = getSuggestion(inst, goal);
            return (
              <motion.div 
                key={inst.id}
                layoutId={inst.id}
                className="bg-white p-6 rounded-[32px] border border-gray-50 shadow-lg group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/5 text-primary rounded-2xl flex items-center justify-center">
                      <IndianRupee size={24} />
                    </div>
                    <div>
                      <h5 className="text-sm font-black text-primary">{inst.name}</h5>
                      <p className="text-[9px] font-bold text-text-soft uppercase tracking-widest">{inst.type} • {inst.contributionType}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setEditingInstrument(inst)}
                    className="p-2 hover:bg-gray-50 rounded-full text-text-soft opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit3 size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div>
                    <p className="text-[8px] font-black text-text-soft uppercase tracking-widest mb-1">Allocation</p>
                    <p className="text-xs font-black text-primary">{link.allocationPercent}%</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-text-soft uppercase tracking-widest mb-1">Value Linked</p>
                    <p className="text-xs font-black text-primary">₹{Math.round((inst.currentValue * link.allocationPercent) / 100).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-text-soft uppercase tracking-widest mb-1">Inflow</p>
                    <p className="text-xs font-black text-success">₹{Math.round((inst.monthlyContribution * link.allocationPercent) / 100).toLocaleString('en-IN')}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-bg-main rounded-2xl border border-gray-50">
                  <div className="flex items-center gap-2">
                    <Sparkles size={12} className={suggestion.color} />
                    <span className={cn("text-[9px] font-black uppercase tracking-widest", suggestion.color)}>
                      {suggestion.text}
                    </span>
                  </div>
                  <span className="text-[8px] font-bold text-text-soft uppercase tracking-widest">Used in {inst.linkedGoals.length} goals</span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {(isAdding || editingInstrument) && (
          <InstrumentModal 
            instrument={editingInstrument || undefined}
            onClose={() => { setIsAdding(false); setEditingInstrument(null); }}
            onSave={editingInstrument ? handleUpdateInstrument : handleAddInstrument}
            userGoals={[...(user.goals || []), ...(user.miniGoals || [])]}
          />
        )}
        {isLinking && (
          <LinkInstrumentModal 
            instruments={instruments.filter(i => !i.linkedGoals.some(lg => lg.goalId === goal.id))}
            onClose={() => setIsLinking(false)}
            onSelect={handleLinkExisting}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const calculateGoalFunding = (goal: Goal | MiniGoal, instruments: InvestmentInstrument[]) => {
  const linkedInstruments = instruments.filter(inst => 
    inst.linkedGoals.some(lg => lg.goalId === goal.id)
  );

  let totalLinkedValue = 0;
  let totalMonthlyInflow = 0;

  linkedInstruments.forEach(inst => {
    const link = inst.linkedGoals.find(lg => lg.goalId === goal.id);
    if (link) {
      totalLinkedValue += (inst.currentValue * link.allocationPercent) / 100;
      totalMonthlyInflow += (inst.monthlyContribution * link.allocationPercent) / 100;
    }
  });

  const progressPercent = (totalLinkedValue / goal.target) * 100;
  const remainingGap = Math.max(0, goal.target - totalLinkedValue);
  
  const monthsLeft = (goal as Goal).timeline ? (goal as Goal).timeline * 12 : (goal as MiniGoal).timelineMonths || 12;
  const projectedValue = totalLinkedValue + (totalMonthlyInflow * monthsLeft);
  const status = projectedValue >= goal.target ? 'ON-TRACK' : 'BEHIND';

  return {
    totalLinkedValue,
    totalMonthlyInflow,
    progressPercent,
    remainingGap,
    status,
    linkedInstruments
  };
};

const InstrumentModal = ({ 
  instrument, 
  onClose, 
  onSave,
  userGoals
}: { 
  instrument?: InvestmentInstrument, 
  onClose: () => void, 
  onSave: (inst: any) => void,
  userGoals: (Goal | MiniGoal)[]
}) => {
  const [formData, setFormData] = useState<Partial<InvestmentInstrument>>(instrument || {
    type: 'Mutual Fund',
    contributionType: 'SIP',
    linkedGoals: []
  });

  const instrumentTypes = [
    'SIP', 'Mutual Fund', 'Direct Stock', 'Index Fund', 'Debt Fund', 'FD', 'RD', 'PPF', 'EPF / VPF', 'NPS', 'Gold', 'Bond', 'Post Office Scheme', 'Chit Fund', 'Property Saving Fund', 'Loan-linked saving', 'Custom'
  ];

  const handleGoalAllocationChange = (goalId: string, percent: number) => {
    const currentLinked = formData.linkedGoals || [];
    const existing = currentLinked.find(lg => lg.goalId === goalId);
    
    let updated;
    if (existing) {
      updated = currentLinked.map(lg => lg.goalId === goalId ? { ...lg, allocationPercent: percent } : lg);
    } else {
      updated = [...currentLinked, { goalId, allocationPercent: percent }];
    }
    
    // Ensure total <= 100
    const total = updated.reduce((sum, lg) => sum + lg.allocationPercent, 0);
    if (total <= 100) {
      setFormData({ ...formData, linkedGoals: updated });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-primary/80 backdrop-blur-md z-[100] flex items-center justify-center p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        <div className="p-10 pb-4 flex justify-between items-center">
          <h3 className="text-2xl font-black text-primary tracking-tight">{instrument ? 'Edit Instrument' : 'Add Instrument'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-10 py-6 space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-soft uppercase tracking-widest ml-2">Type</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full bg-bg-main border-2 border-gray-100 rounded-2xl p-4 text-sm font-black text-primary outline-none focus:border-accent"
              >
                {instrumentTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-soft uppercase tracking-widest ml-2">Name / Nickname</label>
              <input 
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. HDFC Bluechip"
                className="w-full bg-bg-main border-2 border-gray-100 rounded-2xl p-4 text-sm font-black text-primary outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-soft uppercase tracking-widest ml-2">Contribution Type</label>
              <select 
                value={formData.contributionType}
                onChange={(e) => setFormData({ ...formData, contributionType: e.target.value as any })}
                className="w-full bg-bg-main border-2 border-gray-100 rounded-2xl p-4 text-sm font-black text-primary outline-none focus:border-accent"
              >
                <option value="SIP">SIP</option>
                <option value="Lumpsum">Lumpsum</option>
                <option value="Recurring">Recurring</option>
                <option value="Irregular">Irregular</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-soft uppercase tracking-widest ml-2">Monthly Amount</label>
              <input 
                type="number"
                value={formData.monthlyContribution}
                onChange={(e) => setFormData({ ...formData, monthlyContribution: parseInt(e.target.value) || 0 })}
                className="w-full bg-bg-main border-2 border-gray-100 rounded-2xl p-4 text-sm font-black text-primary outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-soft uppercase tracking-widest ml-2">Invested So Far</label>
              <input 
                type="number"
                value={formData.investedAmount}
                onChange={(e) => setFormData({ ...formData, investedAmount: parseInt(e.target.value) || 0 })}
                className="w-full bg-bg-main border-2 border-gray-100 rounded-2xl p-4 text-sm font-black text-primary outline-none focus:border-accent"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-soft uppercase tracking-widest ml-2">Current Value</label>
              <input 
                type="number"
                value={formData.currentValue}
                onChange={(e) => setFormData({ ...formData, currentValue: parseInt(e.target.value) || 0 })}
                className="w-full bg-bg-main border-2 border-gray-100 rounded-2xl p-4 text-sm font-black text-primary outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-text-soft uppercase tracking-widest ml-2">Goal Allocation Split</label>
              <span className="text-[10px] font-black text-accent uppercase tracking-widest">
                Total: {formData.linkedGoals?.reduce((sum, lg) => sum + lg.allocationPercent, 0)}% / 100%
              </span>
            </div>
            <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
              {userGoals.map(goal => {
                const link = formData.linkedGoals?.find(lg => lg.goalId === goal.id);
                return (
                  <div key={goal.id} className="flex items-center gap-4 p-4 bg-bg-main rounded-2xl border border-gray-50">
                    <div className="flex-1">
                      <p className="text-xs font-black text-primary">{goal.name}</p>
                      <p className="text-[8px] font-bold text-text-soft uppercase tracking-widest">{goal.category}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number"
                        min="0"
                        max="100"
                        value={link?.allocationPercent || 0}
                        onChange={(e) => handleGoalAllocationChange(goal.id, parseInt(e.target.value) || 0)}
                        className="w-16 bg-white border border-gray-200 rounded-xl p-2 text-xs font-black text-center outline-none focus:border-accent"
                      />
                      <span className="text-xs font-black text-text-soft">%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-10 pt-4 bg-white border-t border-gray-50 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-5 rounded-2xl font-black text-sm uppercase tracking-widest text-text-soft hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => onSave(formData)}
            className="flex-1 py-5 rounded-2xl font-black text-sm uppercase tracking-widest bg-accent text-white shadow-xl shadow-accent/20"
          >
            Save Instrument
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const LinkInstrumentModal = ({ 
  instruments, 
  onClose, 
  onSelect 
}: { 
  instruments: InvestmentInstrument[], 
  onClose: () => void, 
  onSelect: (id: string) => void 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-primary/80 backdrop-blur-md z-[100] flex items-center justify-center p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white w-full max-w-md rounded-[40px] shadow-2xl flex flex-col max-h-[80vh] overflow-hidden"
      >
        <div className="p-10 pb-4 flex justify-between items-center">
          <h3 className="text-2xl font-black text-primary tracking-tight">Link Instrument</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-10 py-6 space-y-4">
          {instruments.length === 0 ? (
            <p className="text-center text-xs font-bold text-text-soft py-10">No available instruments to link.</p>
          ) : (
            instruments.map(inst => (
              <button 
                key={inst.id}
                onClick={() => onSelect(inst.id)}
                className="w-full p-6 bg-bg-main rounded-[32px] border border-gray-50 text-left hover:border-accent transition-all group"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-black text-primary group-hover:text-accent transition-colors">{inst.name}</p>
                    <p className="text-[9px] font-bold text-text-soft uppercase tracking-widest">{inst.type}</p>
                  </div>
                  <ChevronRight size={20} className="text-text-soft group-hover:text-accent group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const GoalDetailScreen = ({ goal, onBack, onUpdateGoal, onNavigate, expenses, onDeleteGoal, user, onUpdateInstruments }: { goal: Goal, onBack: () => void, onUpdateGoal: (g: Goal) => void, onNavigate: (t: Tab, id?: string) => void, expenses: number, onDeleteGoal: (id: string, reason: string, note: string) => void, user: UserProfile, onUpdateInstruments: (insts: InvestmentInstrument[]) => void }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const years = goal.timeline;
  const todayPrice = goal.todayPrice || goal.target;
  const inflationRate = goal.inflationRate || 0.06;
  const futureCost = Math.round(todayPrice * Math.pow(1 + inflationRate, years));
  const progress = (goal.current / goal.target) * 100;
  
  const calculateSIP = (fv: number, annualRate: number, years: number) => {
    const r = annualRate / 100 / 12;
    const n = years * 12;
    if (r === 0) return fv / n;
    return Math.round((fv * r) / (Math.pow(1 + r, n) - 1));
  };

  const isVacation = goal.name.toLowerCase().includes('trip') || 
                    goal.name.toLowerCase().includes('vacation') || 
                    goal.name.toLowerCase().includes('europe') ||
                    goal.name.toLowerCase().includes('holiday') ||
                    goal.name.toLowerCase().includes('travel') ||
                    goal.name.toLowerCase().includes('tour');

  const investmentOptions: InvestmentOption[] = [
    { method: 'Mutual Funds (Equity)', expectedReturn: 12, riskLevel: 'HIGH' as const, bestFor: 'Long-term growth' },
    { method: 'Fixed Deposits', expectedReturn: 7, riskLevel: 'LOW' as const, bestFor: 'Safety & Stability' },
    { method: 'Gold / SGB', expectedReturn: 9, riskLevel: 'MEDIUM' as const, bestFor: 'Hedge against inflation' },
    { method: 'Index Funds', expectedReturn: 11, riskLevel: 'MEDIUM-HIGH' as const, bestFor: 'Market-linked returns' },
  ].map(opt => ({
    ...opt,
    monthlyAmount: calculateSIP(futureCost - goal.current, opt.expectedReturn, years)
  }));

  return (
    <div className="flex-1 flex flex-col bg-bg-main overflow-y-auto pb-24">
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-20">
        <button onClick={onBack} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
          <ChevronLeft size={24} className="text-primary" />
        </button>
        <h1 className="text-sm font-black uppercase tracking-widest text-primary">{goal.name}</h1>
        <button 
          onClick={() => setShowDeleteModal(true)}
          className="p-2 hover:bg-error/10 rounded-full transition-colors text-error"
        >
          <Trash2 size={20} />
        </button>
      </div>
      
      <div className="p-8 space-y-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-6 p-8 bg-white rounded-[40px] shadow-2xl shadow-primary/5 border border-gray-50"
        >
          <div className="w-24 h-24 rounded-[32px] bg-primary/5 flex items-center justify-center text-primary shadow-inner">
            {getGoalIcon(goal.name)}
          </div>
          <div>
            <h3 className="text-3xl font-black text-primary tracking-tight mb-1">{goal.name}</h3>
            <p className="text-[10px] text-text-soft font-black uppercase tracking-[0.2em]">{goal.timeline} Years Remaining</p>
            <div className="flex items-center gap-2 mt-4">
              <div className="px-4 py-1.5 bg-accent/10 rounded-full text-[9px] font-black text-accent uppercase tracking-[0.2em] shadow-sm">
                {goal.priority} Priority
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-8 rounded-[32px] shadow-xl shadow-primary/5 border border-gray-50"
          >
            <p className="text-[10px] font-black text-text-soft uppercase tracking-[0.2em] mb-2">Current Savings</p>
            <p className="text-2xl font-black text-primary">₹{(goal.current || 0).toLocaleString('en-IN')}</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-8 rounded-[32px] shadow-xl shadow-primary/5 border border-gray-50"
          >
            <p className="text-[10px] font-black text-text-soft uppercase tracking-[0.2em] mb-2">Target Amount</p>
            <p className="text-2xl font-black text-primary">₹{(goal.target || 0).toLocaleString('en-IN')}</p>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl shadow-primary/30"
        >
          <div className="absolute -right-10 -bottom-10 opacity-10 blur-xl">
            <TrendingUp size={200} />
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-8">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Overall Progress</span>
              <span className="text-3xl font-black text-accent">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden mb-10 border border-white/5 shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-accent rounded-full shadow-[0_0_20px_rgba(245,166,35,0.5)]" 
              />
            </div>
            <div className="flex justify-between items-center p-6 bg-white/5 rounded-[32px] backdrop-blur-xl border border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-accent/20 rounded-2xl flex items-center justify-center text-accent">
                  <TrendingUp size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-1">Future Cost (6% Inf.)</p>
                  <p className="text-xl font-black">₹{(futureCost || 0).toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {isVacation && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('smart-goal-questions')}
            className="w-full bg-white border-2 border-primary/10 text-primary py-8 rounded-[32px] font-black flex items-center justify-center gap-4 shadow-xl shadow-primary/5 group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
              <Sparkles size={24} />
            </div>
            <span className="text-xs uppercase tracking-[0.2em]">Generate AI Trip Itinerary & Report</span>
          </motion.button>
        )}

        <div className="space-y-8">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-primary" />
            <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em]">Recommended Investment Strategy</h4>
          </div>
          <div className="space-y-6">
            {investmentOptions.map((opt, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => {
                  onUpdateGoal({ ...goal, selectedInvestment: opt });
                  onBack();
                }}
                className={cn(
                  "p-8 rounded-[32px] border-2 transition-all cursor-pointer flex justify-between items-center group active:scale-[0.98]",
                  goal.selectedInvestment?.method === opt.method 
                    ? 'border-accent bg-accent/5 shadow-2xl shadow-accent/10' 
                    : 'border-gray-50 bg-white shadow-xl shadow-primary/5 hover:border-primary/10'
                )}
              >
                <div className="flex items-center gap-5">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors shadow-sm",
                    goal.selectedInvestment?.method === opt.method ? 'bg-accent text-white' : 'bg-bg-main text-primary'
                  )}>
                    <PieChart size={24} />
                  </div>
                  <div>
                    <p className="text-base font-black text-primary mb-1">{opt.method}</p>
                    <p className="text-[10px] font-black text-text-soft uppercase tracking-[0.2em]">Exp. {opt.expectedReturn}% p.a.</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-primary mb-1">₹{(opt.monthlyAmount || 0).toLocaleString('en-IN')}</p>
                  <p className="text-[10px] font-black text-text-soft uppercase tracking-[0.2em]">Monthly SIP</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('goal-strategy')}
          className="w-full bg-primary text-white py-8 rounded-[32px] font-black shadow-2xl shadow-primary/30 flex items-center justify-center gap-4 mt-12"
        >
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <FileText size={24} className="text-accent" />
          </div>
          <span className="text-xs uppercase tracking-[0.2em]">View Full Strategy Report</span>
        </motion.button>

        <div className="pt-12">
          <GoalFundingTracker goal={goal} user={user} onUpdateInstruments={onUpdateInstruments} />
        </div>
      </div>

      {/* Sticky Footer for Edit/Delete */}
      <div className="sticky bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 p-6 flex gap-4 z-30">
        <button 
          onClick={() => onNavigate('smart-goal-questions')}
          className="flex-1 bg-bg-soft text-primary py-6 rounded-3xl font-black text-xs uppercase tracking-widest border border-gray-100 flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
        >
          <Edit3 size={18} />
          <span>Edit Goal</span>
        </button>
        <button 
          onClick={() => setShowDeleteModal(true)}
          className="flex-1 bg-error/5 text-error py-6 rounded-3xl font-black text-xs uppercase tracking-widest border border-error/10 flex items-center justify-center gap-2 hover:bg-error/10 transition-colors"
        >
          <Trash2 size={18} />
          <span>Delete Goal</span>
        </button>
      </div>

      <DeleteGoalModal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        onConfirm={(reason, note) => {
          onDeleteGoal(goal.id, reason, note);
          setShowDeleteModal(false);
        }} 
      />
    </div>
  );
};

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showPasswordUpdate, setShowPasswordUpdate] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordUpdateMessage, setPasswordUpdateMessage] = useState('');

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        loadUserData(session.user.id, session.user.email);
      } else {
        setIsAuthLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') {
        setShowPasswordUpdate(true);
      }
      if (session) {
        loadUserData(session.user.id, session.user.email);
      } else {
        setUser(DEFAULT_USER);
        setIsAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId: string, email?: string) => {
    setIsAuthLoading(true);
    try {
      const profile = await databaseService.getProfile(userId);
      const familyProfile = await databaseService.getFamilyProfile(userId);
      const goals = await databaseService.getGoals(userId);
      const liabilities = await databaseService.getLiabilities(userId);
      const splitGroups = await databaseService.getSplitGroups(userId);
      const supportTickets = await databaseService.getSupportTickets(userId);

      const miniGoals = await databaseService.getMiniGoals(userId);
      const instruments = await databaseService.getInstruments(userId);
      const recurringExpenses = await databaseService.getRecurringExpenses(userId);
      const referrals = await databaseService.getReferrals(userId);
      const achievements = await databaseService.getAchievements(userId);
      
      if (profile) {
        setUser({
          ...DEFAULT_USER,
          id: userId,
          name: profile.full_name || 'User',
          email: profile.email,
          city: profile.city || 'Chennai',
          onboarded: profile.onboarding_completed,
          isLoggedIn: true,
          persona: profile.persona,
          financialHealthScore: profile.financial_health_score,
          emergencyScore: profile.emergency_score,
          income: profile.total_income,
          expenses: profile.total_expenses,
          netWorth: profile.net_worth,
          savingsRatio: profile.savings_ratio,
          emiBurden: profile.emi_burden,
          familyProfile: familyProfile ? {
            householdType: familyProfile.family_type,
            spouseStatus: familyProfile.spouse_status,
            dependentsCount: familyProfile.dependents_count,
            earningMembersCount: familyProfile.earning_members_count,
            householdMonthlyIncome: familyProfile.monthly_household_income,
            householdMonthlyExpenses: familyProfile.monthly_household_expenses,
            emergencyFundMonths: familyProfile.emergency_fund_months,
            keyFamilyGoals: familyProfile.key_notes ? familyProfile.key_notes.split(', ') : [],
            majorAssets: [],
            majorLiabilities: []
          } : undefined,
          goals: goals.map((g: any) => ({
            id: g.id,
            name: g.name,
            category: g.category,
            target: g.target_amount,
            current: g.current_amount,
            timeline: g.target_year - new Date().getFullYear(),
            priority: g.priority,
            color: 'accent',
            status: g.status.toUpperCase()
          })),
          miniGoals: miniGoals.map((mg: any) => ({
            id: mg.id,
            name: mg.name,
            targetAmount: mg.target_amount,
            currentAmount: mg.current_amount,
            timelineMonths: mg.timeline_months,
            category: mg.category,
            status: mg.status.toUpperCase(),
            isArchived: mg.is_archived
          })),
          loans: liabilities.map((l: any) => ({
            id: l.id,
            type: l.liability_type,
            amount: l.outstanding_amount,
            emi: l.emi_amount
          })),
          instruments: instruments.map((i: any) => ({
            id: i.id,
            name: i.name,
            type: i.instrument_type,
            startDate: i.start_date,
            contributionType: i.contribution_type,
            monthlyContribution: i.monthly_contribution,
            investedAmount: i.invested_amount,
            currentValue: i.current_value,
            note: i.note,
            linkedGoals: i.linked_goals ? JSON.parse(i.linked_goals) : []
          })),
          recurringExpenses: recurringExpenses.map((re: any) => ({
            id: re.id,
            name: re.name,
            amount: re.amount,
            category: re.category,
            dueDate: re.due_date,
            isAutoDeduct: re.is_auto_deduct,
            hasReminder: re.has_reminder
          })),
          referrals: referrals.map((r: any) => ({
            id: r.id,
            name: r.name,
            status: r.status,
            amount: r.amount,
            date: r.date
          })),
          achievements: achievements.length > 0 ? achievements.map((a: any) => ({
            id: a.achievement_id,
            title: a.title,
            description: a.description,
            icon: a.icon,
            unlocked: a.unlocked
          })) : DEFAULT_USER.achievements,
          splitGroups: splitGroups || [],
          supportTickets: supportTickets || [],
          isLoggedIn: true
        });
      } else {
        // If profile doesn't exist, it means it's a new user
        setUser({
          ...DEFAULT_USER,
          id: userId,
          email: email,
          isLoggedIn: true,
          onboarded: false
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedMiniGoalId, setSelectedMiniGoalId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [lastDeletedMiniGoalId, setLastDeletedMiniGoalId] = useState<string | null>(null);
  const [showRestoreMiniGoalToast, setShowRestoreMiniGoalToast] = useState(false);
  const [initialMiniGoalName, setInitialMiniGoalName] = useState('');
  const [initialSmartGoalName, setInitialSmartGoalName] = useState('');
  const [initialGoalCategory, setInitialGoalCategory] = useState('travel');
  const [smartGoalReport, setSmartGoalReport] = useState<any>(null);
  const [currentBuildingGoal, setCurrentBuildingGoal] = useState<Partial<Goal>>({});
  const [goalEstimates, setGoalEstimates] = useState<any>(null);
  const [goalFeasibility, setGoalFeasibility] = useState<any>(null);
  const [goalPlans, setGoalPlans] = useState<GoalPlan[]>([]);
  const [loading, setLoading] = useState(false);

  const [lastDeletedGoal, setLastDeletedGoal] = useState<Goal | null>(null);
  const [showRestoreToast, setShowRestoreToast] = useState(false);

  const handleDeleteGoal = (goalId: string, reason: string, note: string) => {
    const goalToDelete = (Array.isArray(user.goals) ? user.goals : []).find(g => g.id === goalId);
    if (goalToDelete) {
      setLastDeletedGoal(goalToDelete);
      setShowRestoreToast(true);
      setTimeout(() => setShowRestoreToast(false), 5000);
      
      setUser(prev => ({
        ...prev,
        goals: (Array.isArray(prev.goals) ? prev.goals : []).map(g => g.id === goalId ? { ...g, status: 'DELETED', deleteReason: reason, deleteNote: note, deletedAt: new Date().toISOString() } : g)
      }));
      navigate('goals');
    }
  };

  const handleRestoreGoal = () => {
    if (lastDeletedGoal) {
      setUser(prev => ({
        ...prev,
        goals: (Array.isArray(prev.goals) ? prev.goals : []).map(g => g.id === lastDeletedGoal.id ? { ...g, status: 'ACTIVE' } : g)
      }));
      setLastDeletedGoal(null);
      setShowRestoreToast(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('finpath_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    if (!user.isLoggedIn) return;

    const newAchievements = [...(user.achievements || [])];
    let changed = false;

    // 1. Goal Starter
    const goalStarter = newAchievements.find(a => a.id === 'goal_starter');
    if (goalStarter && !goalStarter.unlocked && (user.goals || []).filter(g => g.status !== 'DELETED').length > 0) {
      goalStarter.unlocked = true;
      changed = true;
    }

    // 2. Wealth Builder
    const wealthBuilder = newAchievements.find(a => a.id === 'wealth_builder');
    const metrics = calculateHomepageMetrics(user);
    if (wealthBuilder && !wealthBuilder.unlocked && metrics.netWorth >= 1000000) {
      wealthBuilder.unlocked = true;
      changed = true;
    }

    // 3. Credit Master
    const creditMaster = newAchievements.find(a => a.id === 'credit_master');
    const cibilVerification = user.verifications?.find(v => v.id === 'cibil');
    if (creditMaster && !creditMaster.unlocked && cibilVerification?.demoData?.score >= 750) {
      creditMaster.unlocked = true;
      changed = true;
    }

    // 4. Split Saver
    const splitSaver = newAchievements.find(a => a.id === 'split_saver');
    if (splitSaver && !splitSaver.unlocked && user.splitGroups && user.splitGroups.length > 0) {
      splitSaver.unlocked = true;
      changed = true;
    }

    if (changed) {
      if (user.id) {
        databaseService.upsertAchievements(user.id, newAchievements).catch(err => console.error('Error saving achievements:', err));
      }
      setUser(prev => ({ ...prev, achievements: newAchievements }));
    }
  }, [user.goals, user.splitGroups, user.verifications, user.isLoggedIn]);

  const navigate = (tab: Tab, id?: string) => {
    if (tab === 'goal-detail' && id) setSelectedGoalId(id);
    if (tab === 'mini-goal-detail' && id) setSelectedMiniGoalId(id);
    if (tab === 'split-detail' && id) setSelectedGroupId(id);
    setActiveTab(tab);
  };

  const handleAddGoal = async (goal: Goal) => {
    if (user.id) {
      try {
        const newGoal = await databaseService.createGoal(user.id, goal);
        setUser(prev => ({
          ...prev,
          goals: [...(Array.isArray(prev.goals) ? prev.goals : []), { ...goal, id: newGoal.id }]
        }));
      } catch (error) {
        console.error('Error adding goal:', error);
      }
    }
  };

  const handleUpdateGoal = async (updatedGoal: Goal) => {
    try {
      await databaseService.updateGoal(updatedGoal.id, updatedGoal);
      setUser(prev => ({
        ...prev,
        goals: (Array.isArray(prev.goals) ? prev.goals : []).map(g => g.id === updatedGoal.id ? updatedGoal : g)
      }));
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const handleUpdateMiniGoal = async (updatedGoal: MiniGoal) => {
    try {
      await databaseService.updateMiniGoal(updatedGoal.id, updatedGoal);
      setUser(prev => ({
        ...prev,
        miniGoals: (Array.isArray(prev.miniGoals) ? prev.miniGoals : []).map(g => g.id === updatedGoal.id ? updatedGoal : g)
      }));
    } catch (error) {
      console.error('Error updating mini goal:', error);
    }
  };

  const handleAddMiniGoal = async (goal: MiniGoal) => {
    if (user.id) {
      try {
        const createdGoal = await databaseService.createMiniGoal(user.id, goal);
        setUser(prev => ({
          ...prev,
          miniGoals: [...(Array.isArray(prev.miniGoals) ? prev.miniGoals : []), { ...goal, id: createdGoal.id }]
        }));
      } catch (error) {
        console.error('Error adding mini goal:', error);
      }
    }
  };

  const handleUpdateBudgets = (budgets: any[]) => {
    setUser(prev => ({
      ...prev,
      budgets
    }));
  };

  const handleUpdateExpenses = async (recurringExpenses: RecurringExpense[]) => {
    if (user.id) {
      try {
        await databaseService.upsertRecurringExpenses(user.id, recurringExpenses);
      } catch (error) {
        console.error('Error updating recurring expenses:', error);
      }
    }
    setUser(prev => ({
      ...prev,
      recurringExpenses
    }));
  };

  const handleDeleteMiniGoal = async (goalId: string, reason: string, note: string) => {
    try {
      await databaseService.deleteMiniGoal(goalId, reason, note);
      setUser(prev => ({
        ...prev,
        miniGoals: (Array.isArray(prev.miniGoals) ? prev.miniGoals : []).map(g => g.id === goalId ? { ...g, status: 'DELETED', deleteReason: reason, deleteNote: note, deletedAt: new Date().toISOString() } : g)
      }));
      setLastDeletedMiniGoalId(goalId);
      setShowRestoreMiniGoalToast(true);
      setTimeout(() => setShowRestoreMiniGoalToast(false), 5000);
    } catch (error) {
      console.error('Error deleting mini goal:', error);
    }
  };

  const handleRestoreMiniGoal = async () => {
    if (!lastDeletedMiniGoalId) return;
    try {
      await databaseService.updateMiniGoal(lastDeletedMiniGoalId, { isArchived: false, status: 'ACTIVE' });
      setUser(prev => ({
        ...prev,
        miniGoals: (Array.isArray(prev.miniGoals) ? prev.miniGoals : []).map(g => g.id === lastDeletedMiniGoalId ? { ...g, status: 'ACTIVE', deleteReason: undefined, deleteNote: undefined, deletedAt: undefined } : g)
      }));
      setLastDeletedMiniGoalId(null);
      setShowRestoreMiniGoalToast(false);
    } catch (error) {
      console.error('Error restoring mini goal:', error);
    }
  };

  const handleUpdateInstruments = async (instruments: InvestmentInstrument[]) => {
    if (user.id) {
      try {
        await databaseService.upsertInstruments(user.id, instruments);
      } catch (error) {
        console.error('Error updating instruments:', error);
      }
    }
    setUser(prev => ({ ...prev, instruments }));
  };

  const handleLogin = () => {
    // This is now handled by the Auth component and session listener
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(DEFAULT_USER);
    setActiveTab('home');
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    setUser(updatedUser);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingPassword(true);
    setPasswordUpdateMessage('');
    
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    if (error) {
      setPasswordUpdateMessage(`Error: ${error.message}`);
    } else {
      setPasswordUpdateMessage('Password updated successfully!');
      setTimeout(() => {
        setShowPasswordUpdate(false);
        setNewPassword('');
        setPasswordUpdateMessage('');
      }, 2000);
    }
    setIsUpdatingPassword(false);
  };

  const renderScreen = () => {
    if (isAuthLoading) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin mb-4" />
          <p className="text-text-soft font-bold uppercase tracking-widest text-[10px]">Loading Session...</p>
        </div>
      );
    }

    if (!session) {
      return <Auth onAuthSuccess={() => {}} />;
    }

    if (!user.onboarded && !showOnboarding) {
      return <WelcomeScreen onStart={() => setShowOnboarding(true)} />;
    }

    if (showOnboarding) {
      return <EnhancedOnboarding 
        onComplete={async (data) => {
          if (user.id) {
            try {
              // 1. Update Profile
              await databaseService.updateProfile(user.id, {
                name: data.name,
                city: data.city,
                onboarded: true,
                persona: data.persona,
                financialHealthScore: data.financialHealthScore,
                emergencyScore: data.emergencyScore,
                income: data.income,
                expenses: data.expenses,
                netWorth: data.netWorth,
                savingsRatio: data.savingsRatio,
                emiBurden: data.emiBurden,
                email: user.email
              });

              // 2. Save Goals
              if (data.goals && data.goals.length > 0) {
                for (const goal of data.goals) {
                  await databaseService.createGoal(user.id, goal);
                }
              }

              // 3. Save Liabilities
              if (data.loans && data.loans.length > 0) {
                for (const loan of data.loans) {
                  await databaseService.createLiability(user.id, loan);
                }
              }

              // 4. Save Family Profile if exists
              if (data.familyProfile) {
                await databaseService.upsertFamilyProfile(user.id, data.familyProfile);
              }

              // Refresh user data from Supabase to ensure everything is in sync
              await loadUserData(user.id);
            } catch (error) {
              console.error('Error saving onboarding data:', error);
            }
            // Ensure local state reflects onboarding completion regardless of DB sync
            setUser(prev => ({ ...prev, onboarded: true }));
          } else {
            setUser(prev => ({ ...prev, ...data, onboarded: true }));
          }
          setShowOnboarding(false);
          setActiveTab('home');
        }} 
        onSmartMiniGoal={(name) => {
          setInitialMiniGoalName(name);
          navigate('smart-mini-goal-questions');
        }}
      />;
    }

    switch (activeTab) {
      case 'home': return <HomeScreen user={user} onNavigate={navigate} />;
      case 'roadmap': return <MultiGoalRoadmap goals={user.goals} user={user} onBack={() => navigate('home')} />;
      case 'goals': return <GoalsScreen user={user} onAddGoal={handleAddGoal} onUpdateGoal={handleUpdateGoal} setInitialSmartGoalName={setInitialSmartGoalName} setInitialGoalCategory={setInitialGoalCategory} onUpdateMiniGoal={handleUpdateMiniGoal} onDeleteMiniGoal={handleDeleteMiniGoal} onNavigate={(tab, id) => {
        if (tab === 'goal-detail' && id) {
          setSelectedGoalId(id);
        }
        if (tab === 'mini-goal-detail' && id) {
          setSelectedMiniGoalId(id);
        }
        if (tab === 'smart-mini-goal-questions' && id) {
          setSelectedMiniGoalId(id);
        }
        navigate(tab);
      }} />;
      case 'goal-detail': {
        const goal = (Array.isArray(user.goals) ? user.goals : []).find(g => g.id === selectedGoalId);
        if (!goal) return <GoalsScreen user={user} onAddGoal={handleAddGoal} onUpdateGoal={handleUpdateGoal} setInitialSmartGoalName={setInitialSmartGoalName} setInitialGoalCategory={setInitialGoalCategory} onNavigate={navigate} onUpdateMiniGoal={handleUpdateMiniGoal} onDeleteMiniGoal={handleDeleteMiniGoal} />;
        return <GoalDetailScreen goal={goal} onBack={() => navigate('goals')} onUpdateGoal={handleUpdateGoal} onNavigate={navigate} expenses={user.expenses} onDeleteGoal={handleDeleteGoal} user={user} onUpdateInstruments={handleUpdateInstruments} />;
      }
      case 'mini-goal-detail': {
        const goal = (Array.isArray(user.miniGoals) ? user.miniGoals : []).find(g => g.id === selectedMiniGoalId);
        if (!goal) return <GoalsScreen user={user} onAddGoal={handleAddGoal} onUpdateGoal={handleUpdateGoal} setInitialSmartGoalName={setInitialSmartGoalName} setInitialGoalCategory={setInitialGoalCategory} onNavigate={navigate} onUpdateMiniGoal={handleUpdateMiniGoal} onDeleteMiniGoal={handleDeleteMiniGoal} />;
        return <MiniGoalDetailScreen goal={goal} onBack={() => navigate('goals')} onUpdateGoal={handleUpdateMiniGoal} user={user} onUpdateInstruments={handleUpdateInstruments} onDeleteMiniGoal={handleDeleteMiniGoal} onNavigate={navigate} />;
      }
      case 'smart-discovery': return <SmartGoalDiscoveryScreen user={user} onBack={() => navigate('goals')} onNavigate={navigate} setInitialSmartGoalName={setInitialSmartGoalName} setInitialGoalCategory={setInitialGoalCategory} />;
      case 'goal-strategy': {
        const goal = (Array.isArray(user.goals) ? user.goals : []).find(g => g.id === selectedGoalId);
        if (!goal) return <GoalsScreen user={user} onAddGoal={handleAddGoal} onUpdateGoal={handleUpdateGoal} setInitialSmartGoalName={setInitialSmartGoalName} setInitialGoalCategory={setInitialGoalCategory} onNavigate={navigate} onUpdateMiniGoal={handleUpdateMiniGoal} onDeleteMiniGoal={handleDeleteMiniGoal} />;
        return <GoalStrategyReportScreen goal={goal} onBack={() => navigate('goal-detail')} />;
      }
      case 'universal-report': return <UniversalGoalReportScreen user={user} onBack={() => navigate('report')} />;
      case 'report': return <ReportScreen user={user} onUpdateBudgets={handleUpdateBudgets} onUpdateExpenses={handleUpdateExpenses} onNavigate={navigate} />;
      case 'learn': return <LearnScreen onNavigate={navigate} />;
      case 'profile': return <ProfileScreen user={user} onLogout={handleLogout} navigate={navigate} />;
      case 'split': return <SplitSaveHomeScreen user={user} onNavigate={navigate} onUpdateUser={setUser} />;
      case 'split-detail': {
        const group = (Array.isArray(user.splitGroups) ? user.splitGroups : []).find(g => g.id === selectedGroupId);
        if (!group) return <SplitSaveHomeScreen user={user} onNavigate={navigate} onUpdateUser={setUser} />;
        return <GroupDetailScreen group={group} user={user} onBack={() => navigate('split')} onUpdateUser={setUser} />;
      }
      case 'invite-friends': return <InviteFriendsScreen user={user} onBack={() => navigate('profile')} />;
      case 'family-profiler': return <FamilyProfilerScreen user={user} onBack={() => navigate('profile')} onUpdateUser={setUser} />;
      case 'help-support': return <HelpSupportScreen user={user} onBack={() => navigate('profile')} onUpdateUser={setUser} />;
      case 'policies': return <PoliciesScreen onBack={() => navigate('profile')} />;
      case 'dos-donts': return <DosDontsScreen onBack={() => navigate('profile')} />;
      case 'active-goals-summary': return <ActiveGoalsSummaryScreen user={user} onBack={() => navigate('profile')} />;
      case 'active-loans-summary': return <ActiveLoansSummaryScreen user={user} onBack={() => navigate('profile')} />;
      case 'chat': return <ChatScreen user={user} onBack={() => navigate('home')} />;
      case 'networth': return <NetWorthScreen user={user} onBack={() => navigate('home')} />;
      case 'advisor': return <AdvisorScreen onBack={() => navigate('learn')} />;
      case 'sip-calculator': return <SIPCalculatorScreen onBack={() => navigate('home')} />;
      case 'goal-interview': return (
        <GoalDiscoveryJourney 
          user={user}
          onBack={() => navigate('goals')}
          initialGoalName={initialSmartGoalName}
          initialGoalCategory={initialGoalCategory}
          onComplete={(finalGoal) => {
            handleAddGoal(finalGoal);
            setSelectedGoalId(finalGoal.id);
            navigate('goal-detail');
          }}
        />
      );
      case 'goal-estimation': return (
        <GoalDiscoveryJourney 
          user={user}
          onBack={() => navigate('goals')}
          initialGoalName={initialSmartGoalName}
          initialGoalCategory={initialGoalCategory}
          onComplete={(finalGoal) => {
            handleAddGoal(finalGoal);
            setSelectedGoalId(finalGoal.id);
            navigate('goal-detail');
          }}
        />
      );
      case 'goal-feasibility': return (
        <GoalDiscoveryJourney 
          user={user}
          onBack={() => navigate('goals')}
          initialGoalName={initialSmartGoalName}
          initialGoalCategory={initialGoalCategory}
          onComplete={(finalGoal) => {
            handleAddGoal(finalGoal);
            setSelectedGoalId(finalGoal.id);
            navigate('goal-detail');
          }}
        />
      );
      case 'goal-plans': return (
        <GoalDiscoveryJourney 
          user={user}
          onBack={() => navigate('goals')}
          initialGoalName={initialSmartGoalName}
          initialGoalCategory={initialGoalCategory}
          onComplete={(finalGoal) => {
            handleAddGoal(finalGoal);
            setSelectedGoalId(finalGoal.id);
            navigate('goal-detail');
          }}
        />
      );
      case 'smart-goal-questions': return (
        <GoalDiscoveryJourney 
          user={user}
          onBack={() => navigate('goals')}
          initialGoalName={initialSmartGoalName}
          initialGoalCategory={initialGoalCategory}
          onComplete={(finalGoal) => {
            handleAddGoal(finalGoal);
            setSelectedGoalId(finalGoal.id);
            navigate('goal-detail');
          }}
        />
      );
      case 'smart-mini-goal-questions': {
        const editingGoal = selectedMiniGoalId ? (Array.isArray(user.miniGoals) ? user.miniGoals : []).find(g => g.id === selectedMiniGoalId) : undefined;
        return (
          <SmartMiniGoalQuestionsScreen 
            onBack={() => {
              setSelectedMiniGoalId(null);
              navigate('goals');
            }}
            editingGoal={editingGoal}
            onComplete={(report) => {
              setSmartGoalReport(report);
              setInitialMiniGoalName('');
              navigate('smart-mini-goal-report');
            }} 
          />
        );
      }
      case 'smart-mini-goal-report': return (
        <SmartMiniGoalReportScreen 
          report={smartGoalReport}
          onBack={() => navigate('smart-mini-goal-questions')}
          onUpdate={(goal) => {
            handleUpdateMiniGoal(goal);
            setSelectedMiniGoalId(null);
            navigate('goals');
          }}
          onAdd={(goal) => {
            handleAddMiniGoal(goal);
            setSelectedMiniGoalId(goal.id);
            navigate('mini-goal-detail');
          }}
        />
      );
      case 'smart-goal-summary': return (
        <SmartGoalReportSummaryScreen 
          report={smartGoalReport}
          onBack={() => navigate('smart-goal-questions')} 
          onNavigate={navigate} 
          onAddGoal={handleAddGoal}
        />
      );
      case 'expense-breakdown': return (
        <ExpenseBreakdownScreen 
          report={smartGoalReport}
          onBack={() => navigate('smart-goal-summary')} 
          onNavigate={navigate} 
        />
      );
      case 'save-together': return <SaveTogetherScreen onBack={() => navigate('expense-breakdown')} />;
      default: return <HomeScreen user={user} onNavigate={navigate} />;
    }
  };

  const isMainTab = ['home', 'goals', 'roadmap', 'report', 'learn', 'profile', 'split'].includes(activeTab);
  const showNav = !!session && user.onboarded && !showOnboarding && isMainTab;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="mobile-container overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + (showOnboarding ? 'ob' : '') + (user.onboarded ? 'on' : 'off') + (user.isLoggedIn ? 'li' : 'lo')}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col h-full"
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
        
        {showNav && <BottomNav activeTab={activeTab} onTabChange={navigate} />}

        <AnimatePresence>
          {showRestoreToast && (
            <RestoreToast 
              onRestore={handleRestoreGoal} 
              onClose={() => setShowRestoreToast(false)} 
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-primary/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="relative w-32 h-32 mb-10">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-4 border-accent/20 rounded-full"
                />
                <motion.div 
                  animate={{ rotate: -360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-2 border-4 border-white/20 rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles size={40} className="text-accent animate-pulse" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-white mb-4">FinPath AI is Planning...</h3>
              <p className="text-white/60 text-sm max-w-[280px] leading-relaxed">
                We're analyzing global travel trends, inflation, and local costs to build your perfect wealth roadmap.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showRestoreMiniGoalToast && (
            <RestoreToast 
              onRestore={handleRestoreMiniGoal}
              onClose={() => setShowRestoreMiniGoalToast(false)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showPasswordUpdate && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-3xl p-6 w-full max-w-[340px] shadow-2xl"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-primary">Update Password</h3>
                  <button onClick={() => setShowPasswordUpdate(false)} className="p-2 bg-gray-100 rounded-full text-text-soft">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-soft" size={20} />
                    <input 
                      type="password"
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-bg-main border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/20"
                      required
                      minLength={6}
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                  {passwordUpdateMessage && (
                    <p className={cn("text-xs font-bold text-center mt-4", passwordUpdateMessage.includes('Error') ? "text-error" : "text-success")}>
                      {passwordUpdateMessage}
                    </p>
                  )}
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
