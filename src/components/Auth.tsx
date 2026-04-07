import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  ChevronLeft, 
  AlertCircle, 
  CheckCircle,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { cn } from '../lib/utils';

interface AuthProps {
  onAuthSuccess: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [view, setView] = useState<'welcome' | 'signin' | 'signup' | 'forgot'>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      onAuthSuccess();
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });

    if (error) {
      if (error.message.toLowerCase().includes('email') || error.message.toLowerCase().includes('confirmation')) {
        setError(`Email Error: ${error.message}. Tip: You can disable "Confirm email" in your Supabase Dashboard (Authentication -> Settings) for easier testing.`);
      } else {
        setError(error.message);
      }
      setLoading(false);
    } else {
      setMessage('Check your email for the confirmation link!');
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Password reset link sent! (Note: If the link is broken, you must add this app\'s URL to your Supabase Redirect URLs in the dashboard)');
    }
    setLoading(false);
  };

  const renderWelcome = () => (
    <div className="flex-1 flex flex-col p-8 justify-center items-center text-center">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-24 h-24 bg-accent rounded-[32px] flex items-center justify-center mb-8 shadow-2xl shadow-accent/20"
      >
        <Sparkles size={48} className="text-white" />
      </motion.div>
      
      <h1 className="text-4xl font-black text-primary mb-4 tracking-tight">FinPath</h1>
      <p className="text-text-soft font-medium mb-12 max-w-[280px]">Your AI-powered path to financial clarity and wealth.</p>
      
      <div className="w-full space-y-4">
        <button 
          onClick={() => setView('signup')}
          className="w-full bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 active:scale-95 transition-all"
        >
          Create Account
        </button>
        <button 
          onClick={() => setView('signin')}
          className="w-full bg-white text-primary border-2 border-primary/10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs active:scale-95 transition-all"
        >
          Sign In
        </button>
      </div>
      
      <div className="mt-12 flex items-center gap-3 text-text-soft/40">
        <ShieldCheck size={16} />
        <span className="text-[10px] font-bold uppercase tracking-widest">Secure & Encrypted</span>
      </div>
    </div>
  );

  const renderForm = () => (
    <div className="flex-1 flex flex-col p-8">
      <button 
        onClick={() => setView('welcome')}
        className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center mb-8 text-primary active:scale-95 transition-all"
      >
        <ChevronLeft size={24} />
      </button>
      
      <h2 className="text-3xl font-black text-primary mb-2 tracking-tight">
        {view === 'signin' ? 'Welcome Back' : view === 'signup' ? 'Get Started' : 'Reset Password'}
      </h2>
      <p className="text-text-soft font-medium mb-8">
        {view === 'signin' ? 'Sign in to continue your journey.' : view === 'signup' ? 'Create an account to start planning.' : 'Enter your email to reset your password.'}
      </p>
      
      <form onSubmit={view === 'signin' ? handleSignIn : view === 'signup' ? handleSignUp : handleForgotPassword} className="space-y-4">
        {view === 'signup' && (
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-soft" size={20} />
            <input 
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-bg-main border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>
        )}
        
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-soft" size={20} />
          <input 
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-bg-main border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/20"
            required
          />
        </div>
        
        {view !== 'forgot' && (
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-soft" size={20} />
            <input 
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-bg-main border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>
        )}
        
        {view === 'signin' && (
          <button 
            type="button"
            onClick={() => setView('forgot')}
            className="text-xs font-bold text-accent uppercase tracking-widest float-right"
          >
            Forgot Password?
          </button>
        )}
        
        <div className="clear-both pt-4">
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {view === 'signin' ? 'Sign In' : view === 'signup' ? 'Create Account' : 'Send Reset Link'}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </form>
      
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-error/5 border border-error/10 rounded-2xl flex items-center gap-3 text-error"
          >
            <AlertCircle size={20} />
            <p className="text-xs font-bold">{error}</p>
          </motion.div>
        )}
        
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-success/5 border border-success/10 rounded-2xl flex items-center gap-3 text-success"
          >
            <CheckCircle size={20} />
            <p className="text-xs font-bold">{message}</p>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="mt-auto pt-8 text-center">
        <p className="text-xs text-text-soft font-medium">
          {view === 'signin' ? "Don't have an account?" : "Already have an account?"}
          <button 
            onClick={() => setView(view === 'signin' ? 'signup' : 'signin')}
            className="ml-2 font-black text-primary uppercase tracking-widest"
          >
            {view === 'signin' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col bg-white h-full">
      {view === 'welcome' ? renderWelcome() : renderForm()}
    </div>
  );
};
