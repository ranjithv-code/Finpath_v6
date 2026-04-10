import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  ChevronLeft, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Award, 
  Home, 
  ShoppingBag, 
  X, 
  Check, 
  Plus, 
  Info,
  DollarSign,
  PieChart,
  Target,
  Users,
  Briefcase,
  Activity,
  Heart,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { UserProfile, Goal, Loan, DEFAULT_USER } from '../types';
import { cn } from '../lib/utils';
import { 
  PROFILING_QUESTIONS, 
  calculateMetrics, 
  mapPersona, 
  getSmartActions,
  Question 
} from '../lib/profilingLogic';

interface EnhancedOnboardingProps {
  onComplete: (data: UserProfile) => void;
  onSmartMiniGoal?: (name: string) => void;
}

const EnhancedOnboarding: React.FC<EnhancedOnboardingProps> = ({ onComplete, onSmartMiniGoal }) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<any>({
    ...DEFAULT_USER,
    lifeStage: '',
    incomeStyles: [],
    incomeSources: [],
    earnerStructure: 'me',
    incomeArrival: 'fixed',
    expenses: {},
    emergencyReserve: 0,
    riskBehavior: '',
    loans: [],
    goals: [],
    capturedAssets: {},
    capturedInsurance: {},
    capturedLiabilities: {},
    primaryGoal: '',
    survivalMonths: 0
  });

  const [showInsight, setShowInsight] = useState<string | null>(null);
  const [isPersonaRevealed, setIsPersonaRevealed] = useState(false);

  const currentQuestion = PROFILING_QUESTIONS[step];
  const progress = ((step + 1) / PROFILING_QUESTIONS.length) * 100;

  const metrics = useMemo(() => calculateMetrics(data), [data]);
  const persona = useMemo(() => mapPersona(data, metrics), [data, metrics]);
  const actions = useMemo(() => getSmartActions(persona, metrics), [persona, metrics]);

  const handleNext = () => {
    if (step < PROFILING_QUESTIONS.length - 1) {
      setStep(prev => prev + 1);
      setShowInsight(null);
    } else {
      setIsPersonaRevealed(true);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(prev => prev - 1);
      setShowInsight(null);
    }
  };

  const updateData = (field: string, value: any) => {
    const newData = { ...data, [field]: value };
    setData(newData);
    
    // Check for insight
    const question = PROFILING_QUESTIONS.find(q => q.field === field);
    if (question?.insight) {
      setShowInsight(question.insight(value, newData));
    }
  };

  const renderInput = (question: Question) => {
    switch (question.type) {
      case 'risk-willingness':
        return (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3">
              {question.options?.map((opt) => (
                <motion.button
                  key={opt.value}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    updateData(question.field, opt.value);
                    setTimeout(handleNext, 600);
                  }}
                  className={cn(
                    "px-5 py-3 rounded-2xl border-2 text-sm font-bold transition-all flex items-center gap-2",
                    data[question.field] === opt.value 
                      ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                      : "bg-white border-gray-100 text-primary hover:border-primary/30"
                  )}
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        );
      case 'choice':
      case 'scenario':
        return (
          <div className="grid grid-cols-1 gap-4">
            {question.options?.map((opt) => (
              <motion.button
                key={opt.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  updateData(question.field, opt.value);
                  setTimeout(handleNext, 600);
                }}
                className={cn(
                  "p-6 rounded-[32px] border-2 text-left transition-all flex items-center gap-5 group",
                  data[question.field] === opt.value 
                    ? "bg-primary border-primary text-white shadow-2xl shadow-primary/20" 
                    : "bg-white border-gray-100 text-primary hover:border-primary/30"
                )}
              >
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all",
                  data[question.field] === opt.value ? "bg-white/20" : "bg-bg-soft group-hover:bg-primary/5"
                )}>
                  {opt.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-black text-lg leading-tight mb-1">{opt.label}</h4>
                  {question.id === 'goal-capture' && data[question.field] === opt.value && (
                    <motion.p 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[10px] font-bold text-white/70 mt-1"
                    >
                      “Got it — this will be your current money priority.”
                    </motion.p>
                  )}
                  {question.type === 'scenario' && (
                    <p className={cn(
                      "text-xs font-bold opacity-70",
                      data[question.field] === opt.value ? "text-white" : "text-text-soft"
                    )}>
                      {opt.value === 'panic' ? 'Safety first, always.' : opt.value === 'wait' ? 'Patience is a virtue.' : 'Opportunity seeker!'}
                    </p>
                  )}
                </div>
                {data[question.field] === opt.value && <Check size={24} className="text-white" />}
              </motion.button>
            ))}
          </div>
        );
      case 'multi-choice':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-3">
              {question.options?.map((opt) => {
                const isActive = data[question.field]?.includes(opt.value);
                return (
                  <motion.button
                    key={opt.value}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const current = Array.isArray(data[question.field]) ? data[question.field] : [];
                      const next = isActive 
                        ? current.filter((v: any) => v !== opt.value)
                        : [...current, opt.value];
                      updateData(question.field, next);
                    }}
                    className={cn(
                      "p-4 rounded-2xl border-2 text-center transition-all flex flex-col items-center gap-2",
                      isActive 
                        ? "bg-primary border-primary text-white" 
                        : "bg-white border-gray-100 text-primary hover:border-primary/30"
                    )}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <span className="text-[10px] font-black uppercase tracking-wider">{opt.label}</span>
                  </motion.button>
                );
              })}
            </div>
            {(Array.isArray(data[question.field]) ? data[question.field] : []).length > 0 && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleNext}
                className="w-full btn-accent py-6 rounded-[32px] font-black text-sm tracking-widest shadow-2xl shadow-accent/30"
              >
                CONTINUE <ArrowRight className="inline ml-2" size={18} />
              </motion.button>
            )}
          </div>
        );
      case 'income-sources':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              {(Array.isArray(data.incomeSources) ? data.incomeSources : []).map((source: any, idx: number) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-6 bg-white rounded-[32px] border-2 border-gray-100 space-y-4 relative group"
                >
                  <button 
                    onClick={() => {
                      const next = (Array.isArray(data.incomeSources) ? data.incomeSources : []).filter((_: any, i: number) => i !== idx);
                      updateData('incomeSources', next);
                    }}
                    className="absolute top-4 right-4 text-danger opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X size={18} />
                  </button>
                  <input 
                    type="text"
                    placeholder="Source Name (e.g. Primary Job)"
                    value={source.name || ''}
                    onChange={(e) => {
                      const next = [...data.incomeSources];
                      next[idx].name = e.target.value;
                      updateData('incomeSources', next);
                    }}
                    className="w-full bg-transparent border-b border-gray-100 py-2 font-bold text-primary outline-none focus:border-accent"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-text-soft uppercase">Monthly Amount</p>
                      <div className="relative">
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 font-bold text-primary/30">₹</span>
                        <input 
                          type="number"
                          value={source.amount || ''}
                          onChange={(e) => {
                            const next = [...data.incomeSources];
                            next[idx].amount = parseInt(e.target.value) || 0;
                            updateData('incomeSources', next);
                          }}
                          className="w-full bg-transparent pl-4 py-1 font-black text-primary outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-text-soft uppercase mb-1">Stability</p>
                      <div className="flex bg-gray-50 rounded-lg p-1">
                        {[
                          { label: 'Stable', value: 'stable' },
                          { label: 'Var', value: 'variable' },
                          { label: 'Volatile', value: 'volatile' }
                        ].map(opt => (
                          <button 
                            key={opt.value}
                            onClick={() => {
                              const next = [...data.incomeSources];
                              next[idx].stability = opt.value;
                              updateData('incomeSources', next);
                            }}
                            className={cn(
                              "flex-1 text-[10px] font-bold rounded-md py-1", 
                              source.stability === opt.value ? "bg-white shadow-sm text-primary" : "text-text-soft"
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <button 
              onClick={() => {
                const next = [...(data.incomeSources || []), { name: '', amount: 0, stability: 'stable' }];
                updateData('incomeSources', next);
              }}
              className="w-full py-4 border-2 border-dashed border-primary/20 rounded-[32px] text-primary font-black text-xs tracking-widest hover:bg-primary/5 transition-all"
            >
              + ADD INCOME SOURCE
            </button>
            {data.incomeSources?.length > 0 && data.incomeSources.every((s: any) => s.amount > 0) && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleNext}
                className="w-full btn-accent py-6 rounded-[32px] font-black text-sm tracking-widest shadow-2xl shadow-accent/30"
              >
                CONTINUE <ArrowRight className="inline ml-2" size={18} />
              </motion.button>
            )}
          </div>
        );
      case 'demographics':
        return (
          <div className="space-y-4">
            <input type="text" placeholder="Full Name" className="w-full p-4 rounded-2xl border-2 border-gray-100" value={data.demographics?.name || ''} onChange={e => updateData('demographics', {...data.demographics, name: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Current City" className="w-full p-4 rounded-2xl border-2 border-gray-100" value={data.demographics?.currentCity || ''} onChange={e => updateData('demographics', {...data.demographics, currentCity: e.target.value})} />
              <input type="text" placeholder="Permanent City" className="w-full p-4 rounded-2xl border-2 border-gray-100" value={data.demographics?.permanentCity || ''} onChange={e => updateData('demographics', {...data.demographics, permanentCity: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input type="number" placeholder="Age" className="w-full p-4 rounded-2xl border-2 border-gray-100" value={data.demographics?.age || ''} onChange={e => updateData('demographics', {...data.demographics, age: e.target.value})} />
              <input type="number" placeholder="Total years of work experience" className="w-full p-4 rounded-2xl border-2 border-gray-100" value={data.demographics?.experience || ''} onChange={e => updateData('demographics', {...data.demographics, experience: e.target.value})} />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-text-soft uppercase tracking-widest ml-2">Marital Status</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Single', value: 'single' },
                  { label: 'Married', value: 'married' },
                  { label: 'Divorced', value: 'divorced' },
                  { label: 'Widowed', value: 'widowed' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => updateData('demographics', {...data.demographics, maritalStatus: opt.value})}
                    className={cn(
                      "px-4 py-2 rounded-xl border-2 text-xs font-bold transition-all",
                      data.demographics?.maritalStatus === opt.value 
                        ? "bg-primary border-primary text-white" 
                        : "bg-white border-gray-100 text-primary hover:border-primary/30"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-text-soft uppercase tracking-widest ml-2">Family Structure</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Nuclear Family', value: 'nuclear' },
                  { label: 'Joint Family', value: 'joint' },
                  { label: 'Extended Family', value: 'extended' },
                  { label: 'Living Alone', value: 'alone' },
                  { label: 'Shared / Roommates', value: 'shared' },
                  { label: 'Other', value: 'other' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => updateData('demographics', {...data.demographics, familyStructure: opt.value})}
                    className={cn(
                      "px-4 py-2 rounded-xl border-2 text-xs font-bold transition-all",
                      data.demographics?.familyStructure === opt.value 
                        ? "bg-primary border-primary text-white" 
                        : "bg-white border-gray-100 text-primary hover:border-primary/30"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            
            {['nuclear', 'joint', 'extended'].includes(data.demographics?.familyStructure) && (
              <div className="grid grid-cols-1 gap-4">
                <input type="number" placeholder="Number of dependents" className="w-full p-4 rounded-2xl border-2 border-gray-100" value={data.demographics?.dependents || ''} onChange={e => updateData('demographics', {...data.demographics, dependents: e.target.value})} />
              </div>
            )}

            <div className="p-4 rounded-2xl border-2 border-gray-100 space-y-4">
              <p className="text-sm font-bold text-primary">Do you support parents / family in another city?</p>
              <div className="flex gap-4">
                <button className={cn("flex-1 py-2 rounded-xl border-2 font-bold", data.demographics?.supportParents === 'yes' ? "bg-primary border-primary text-white" : "border-gray-100")} onClick={() => updateData('demographics', {...data.demographics, supportParents: 'yes'})}>Yes</button>
                <button className={cn("flex-1 py-2 rounded-xl border-2 font-bold", data.demographics?.supportParents === 'no' ? "bg-primary border-primary text-white" : "border-gray-100")} onClick={() => updateData('demographics', {...data.demographics, supportParents: 'no'})}>No</button>
              </div>
              {data.demographics?.supportParents === 'yes' && (
                <div className="space-y-4 pt-4">
                  <input type="number" placeholder="Separate family support outflow (₹)" className="w-full p-4 rounded-2xl border-2 border-gray-100" value={data.demographics?.familySupportOutflow || ''} onChange={e => updateData('demographics', {...data.demographics, familySupportOutflow: e.target.value})} />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4">
              <input type="text" placeholder="Profession / Occupation" className="w-full p-4 rounded-2xl border-2 border-gray-100" value={data.demographics?.profession || ''} onChange={e => updateData('demographics', {...data.demographics, profession: e.target.value})} />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold text-text-soft uppercase tracking-widest ml-2">Employment Type</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Salaried', value: 'salaried' },
                  { label: 'Self-employed', value: 'self_employed' },
                  { label: 'Business', value: 'business' },
                  { label: 'Freelance', value: 'freelance' },
                  { label: 'Not working', value: 'not_working' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => updateData('demographics', {...data.demographics, employmentType: opt.value})}
                    className={cn(
                      "px-4 py-2 rounded-xl border-2 text-xs font-bold transition-all",
                      data.demographics?.employmentType === opt.value 
                        ? "bg-primary border-primary text-white" 
                        : "bg-white border-gray-100 text-primary hover:border-primary/30"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleNext}
              className="w-full btn-accent py-6 rounded-[32px] font-black text-sm tracking-widest shadow-2xl shadow-accent/30 mt-4"
            >
              CONTINUE <ArrowRight className="inline ml-2" size={18} />
            </motion.button>
          </div>
        );
      case 'expense-buckets':
      case 'asset-capture':
      case 'insurance-capture':
      case 'liability-capture':
      case 'goal-capture':
      case 'knowledge-quiz': {
        const isKnowledge = question.type === 'knowledge-quiz';
        const isExpense = question.type === 'expense-buckets';
        
        const suggestions = isExpense ? (() => {
          const s = [];
          if (data.lifeStage === 'first_job') s.push('rent', 'transport', 'subs', 'dining');
          if (data.lifeStage === 'family') s.push('home_emi', 'school', 'groceries', 'insurance');
          if (data.incomeStyles?.includes('business')) s.push('tax', 'travel');
          if (data.incomeStyles?.includes('freelance')) s.push('tax', 'internet', 'insurance');
          if (data.earnerStructure === 'spouse') s.push('travel', 'dining', 'help');
          return s;
        })() : [];

        const categories = isExpense ? ['mandatory', 'essential', 'lifestyle'] : [];

        return (
          <div className="space-y-8">
            {isExpense && suggestions.length > 0 && (
              <div className="p-6 bg-accent/5 border border-accent/20 rounded-[32px] space-y-3">
                <div className="flex items-center gap-2 text-accent">
                  <Zap size={16} />
                  <p className="text-[10px] font-black uppercase tracking-widest">Suggested for your profile</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map(s => {
                    const opt = question.options?.find(o => o.value === s);
                    const isActive = !!data.expenses[s];
                    if (!opt || isActive) return null;
                    return (
                      <button
                        key={s}
                        onClick={() => {
                          const next = { ...data.expenses, [s]: { amount: 0 } };
                          updateData('expenses', next);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white border border-accent/30 text-[10px] font-bold text-accent hover:bg-accent hover:text-white transition-all"
                      >
                        + {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {isExpense ? (
              categories.map(cat => (
                <div key={cat} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      cat === 'mandatory' ? "bg-danger" : cat === 'essential' ? "bg-primary" : "bg-success"
                    )} />
                    <h4 className="text-[10px] font-black text-text-soft uppercase tracking-widest">{cat}</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {question.options?.filter(o => o.category === cat).map(opt => {
                      const isActive = !!data[question.field]?.[opt.value];
                      return (
                        <button
                          key={opt.value}
                          onClick={() => {
                            const next = { ...data[question.field] };
                            if (isActive) delete next[opt.value];
                            else next[opt.value] = { amount: 0 };
                            updateData(question.field, next);
                          }}
                          className={cn(
                            "px-4 py-2 rounded-xl border-2 text-xs font-bold transition-all flex items-center gap-2",
                            isActive 
                              ? "bg-primary border-primary text-white" 
                              : "bg-white border-gray-100 text-primary hover:border-primary/30"
                          )}
                        >
                          <span>{opt.icon}</span>
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-wrap gap-2">
                {question.options?.map(opt => {
                  const isActive = isKnowledge 
                    ? data[question.field]?.includes(opt.value)
                    : !!data[question.field]?.[opt.value];
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        if (isKnowledge) {
                          const current = data[question.field] || [];
                          const nextArr = current.includes(opt.value)
                            ? current.filter((v: any) => v !== opt.value)
                            : [...current, opt.value];
                          updateData(question.field, nextArr);
                        } else {
                          const next = { ...data[question.field] };
                          if (isActive) delete next[opt.value];
                          else next[opt.value] = { amount: 0 };
                          updateData(question.field, next);
                        }
                      }}
                      className={cn(
                        "px-4 py-2 rounded-xl border-2 text-xs font-bold transition-all flex items-center gap-2",
                        isActive 
                          ? "bg-primary border-primary text-white" 
                          : "bg-white border-gray-100 text-primary hover:border-primary/30"
                      )}
                    >
                      <span>{opt.icon}</span>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}

            {!isKnowledge && Object.keys(data[question.field] || {}).length > 0 && (
              <div className="space-y-4 pt-4 border-t border-gray-100">
                {Object.keys(data[question.field]).map(key => {
                  const opt = question.options?.find(o => o.value === key);
                  const isAsset = question.type === 'asset-capture';
                  const isLiability = question.type === 'liability-capture';
                  const itemData = data[question.field][key];

                  return (
                    <motion.div 
                      key={key}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex flex-col gap-4 p-4 bg-white rounded-2xl border border-gray-100"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-xl">{opt?.icon || '➕'}</span>
                        {key.startsWith('custom_') ? (
                          <input 
                            type="text" 
                            value={itemData.label || ''} 
                            onChange={(e) => {
                              const next = { ...data[question.field] };
                              next[key].label = e.target.value;
                              updateData(question.field, next);
                            }}
                            placeholder="Name"
                            className="flex-1 text-sm font-bold text-primary bg-transparent outline-none border-b border-gray-200"
                          />
                        ) : (
                          <div className="flex-1 flex flex-col">
                            <span className="text-sm font-bold text-primary">
                              {isLiability && itemData.lender ? `${itemData.lender} ` : ''}
                              {isAsset && itemData.provider ? `${itemData.provider} ` : ''}
                              {opt?.label}
                            </span>
                          </div>
                        )}
                        <button onClick={() => {
                          const next = { ...data[question.field] };
                          delete next[key];
                          updateData(question.field, next);
                        }} className="text-danger"><X size={16}/></button>
                      </div>

                      {isExpense && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-primary/30 font-bold text-xs">₹</span>
                            <input 
                              type="number"
                              value={itemData.amount || ''}
                              onChange={(e) => {
                                const next = { ...data[question.field] };
                                next[key].amount = parseInt(e.target.value) || 0;
                                updateData(question.field, next);
                              }}
                              placeholder="Amount"
                              className="w-full bg-gray-50 rounded-lg pl-6 py-2 font-bold text-primary text-sm outline-none"
                            />
                          </div>
                          <div className="flex bg-gray-50 rounded-lg p-1">
                            {[
                              { label: 'M', value: 'monthly' },
                              { label: 'Q', value: 'quarterly' },
                              { label: 'Y', value: 'annual' },
                              { label: 'O', value: 'occasional' }
                            ].map(opt => (
                              <button 
                                key={opt.value}
                                onClick={() => {
                                  const next = { ...data[question.field] };
                                  next[key].frequency = opt.value;
                                  updateData(question.field, next);
                                }}
                                className={cn(
                                  "flex-1 text-[10px] font-bold rounded-md py-1", 
                                  (itemData.frequency || 'monthly') === opt.value ? "bg-white shadow-sm text-primary" : "text-text-soft"
                                )}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {isAsset && opt?.value !== 'none' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-primary/30 font-bold text-xs">₹</span>
                              <input type="number" placeholder="Current Value" value={itemData.amount || ''} onChange={e => { const next = {...data[question.field]}; next[key].amount = parseInt(e.target.value) || 0; updateData(question.field, next); }} className="w-full bg-gray-50 rounded-lg pl-6 py-2 font-bold text-primary text-sm outline-none" />
                            </div>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-primary/30 font-bold text-xs">₹</span>
                              <input type="number" placeholder="Monthly SIP/Contrib" value={itemData.contribution || ''} onChange={e => { const next = {...data[question.field]}; next[key].contribution = parseInt(e.target.value) || 0; updateData(question.field, next); }} className="w-full bg-gray-50 rounded-lg pl-6 py-2 font-bold text-primary text-sm outline-none" />
                            </div>
                          </div>
                          
                          <details className="group">
                            <summary className="text-xs font-bold text-accent cursor-pointer list-none flex items-center gap-1">
                              <span className="group-open:hidden">▼ More details</span>
                              <span className="hidden group-open:inline">▲ Less details</span>
                            </summary>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <input type="text" placeholder="Provider / Bank" value={itemData.provider || ''} onChange={e => { const next = {...data[question.field]}; next[key].provider = e.target.value; updateData(question.field, next); }} className="w-full bg-gray-50 rounded-lg px-3 py-2 font-bold text-primary text-sm outline-none" />
                              <div className="flex bg-gray-50 rounded-lg p-1">
                                <button onClick={() => { const next = {...data[question.field]}; next[key].ownership = 'self'; updateData(question.field, next); }} className={cn("flex-1 text-xs font-bold rounded-md py-1", itemData.ownership !== 'joint' ? "bg-white shadow-sm text-primary" : "text-text-soft")}>Self</button>
                                <button onClick={() => { const next = {...data[question.field]}; next[key].ownership = 'joint'; updateData(question.field, next); }} className={cn("flex-1 text-xs font-bold rounded-md py-1", itemData.ownership === 'joint' ? "bg-white shadow-sm text-primary" : "text-text-soft")}>Joint</button>
                              </div>
                            </div>
                          </details>
                        </div>
                      )}

                      {isLiability && opt?.value === 'cc' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-primary/30 font-bold text-xs">₹</span>
                              <input type="number" placeholder="Outstanding Today" value={itemData.amount || ''} onChange={e => { const next = {...data[question.field]}; next[key].amount = parseInt(e.target.value) || 0; updateData(question.field, next); }} className="w-full bg-gray-50 rounded-lg pl-6 py-2 font-bold text-primary text-sm outline-none" />
                            </div>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-primary/30 font-bold text-xs">₹</span>
                              <input type="number" placeholder="Credit Limit" value={itemData.creditLimit || ''} onChange={e => { const next = {...data[question.field]}; next[key].creditLimit = parseInt(e.target.value) || 0; updateData(question.field, next); }} className="w-full bg-gray-50 rounded-lg pl-6 py-2 font-bold text-primary text-sm outline-none" />
                            </div>
                          </div>

                          <details className="group">
                            <summary className="text-xs font-bold text-accent cursor-pointer list-none flex items-center gap-1">
                              <span className="group-open:hidden">▼ More details</span>
                              <span className="hidden group-open:inline">▲ Less details</span>
                            </summary>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-primary/30 font-bold text-xs">₹</span>
                                <input type="number" placeholder="Minimum Due" value={itemData.minimumDue || ''} onChange={e => { const next = {...data[question.field]}; next[key].minimumDue = parseInt(e.target.value) || 0; updateData(question.field, next); }} className="w-full bg-gray-50 rounded-lg pl-6 py-2 font-bold text-primary text-sm outline-none" />
                              </div>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-primary/30 font-bold text-xs">₹</span>
                                <input type="number" placeholder="Usual Payment" value={itemData.emi || ''} onChange={e => { const next = {...data[question.field]}; next[key].emi = parseInt(e.target.value) || 0; updateData(question.field, next); }} className="w-full bg-gray-50 rounded-lg pl-6 py-2 font-bold text-primary text-sm outline-none" />
                              </div>
                              <input type="text" placeholder="Bank / Issuer Name" value={itemData.lender || ''} onChange={e => { const next = {...data[question.field]}; next[key].lender = e.target.value; updateData(question.field, next); }} className="w-full bg-gray-50 rounded-lg px-3 py-2 font-bold text-primary text-sm outline-none col-span-2" />
                              <div className="flex bg-gray-50 rounded-lg p-1 col-span-2 items-center justify-between px-2">
                                <span className="text-xs font-bold text-text-soft">Revolving Balance?</span>
                                <div className="flex gap-1">
                                  <button onClick={() => { const next = {...data[question.field]}; next[key].revolving = true; updateData(question.field, next); }} className={cn("px-3 text-xs font-bold rounded-md py-1", itemData.revolving === true ? "bg-white shadow-sm text-primary" : "text-text-soft")}>Yes</button>
                                  <button onClick={() => { const next = {...data[question.field]}; next[key].revolving = false; updateData(question.field, next); }} className={cn("px-3 text-xs font-bold rounded-md py-1", itemData.revolving !== true ? "bg-white shadow-sm text-primary" : "text-text-soft")}>No</button>
                                </div>
                              </div>
                            </div>
                          </details>
                        </div>
                      )}

                      {isLiability && opt?.value !== 'cc' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-primary/30 font-bold text-xs">₹</span>
                              <input type="number" placeholder="Outstanding" value={itemData.amount || ''} onChange={e => { const next = {...data[question.field]}; next[key].amount = parseInt(e.target.value) || 0; updateData(question.field, next); }} className="w-full bg-gray-50 rounded-lg pl-6 py-2 font-bold text-primary text-sm outline-none" />
                            </div>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-primary/30 font-bold text-xs">₹</span>
                              <input type="number" placeholder="Monthly EMI" value={itemData.emi || ''} onChange={e => { const next = {...data[question.field]}; next[key].emi = parseInt(e.target.value) || 0; updateData(question.field, next); }} className="w-full bg-gray-50 rounded-lg pl-6 py-2 font-bold text-primary text-sm outline-none" />
                            </div>
                          </div>

                          <details className="group">
                            <summary className="text-xs font-bold text-accent cursor-pointer list-none flex items-center gap-1">
                              <span className="group-open:hidden">▼ More details</span>
                              <span className="hidden group-open:inline">▲ Less details</span>
                            </summary>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-primary/30 font-bold text-xs">₹</span>
                                <input type="number" placeholder="Principal" value={itemData.principal || ''} onChange={e => { const next = {...data[question.field]}; next[key].principal = parseInt(e.target.value) || 0; updateData(question.field, next); }} className="w-full bg-gray-50 rounded-lg pl-6 py-2 font-bold text-primary text-sm outline-none" />
                              </div>
                              <input type="text" placeholder="Lender / Bank" value={itemData.lender || ''} onChange={e => { const next = {...data[question.field]}; next[key].lender = e.target.value; updateData(question.field, next); }} className="w-full bg-gray-50 rounded-lg px-3 py-2 font-bold text-primary text-sm outline-none" />
                              <div className="relative">
                                <input type="number" placeholder="Interest Rate" value={itemData.interestRate || ''} onChange={e => { const next = {...data[question.field]}; next[key].interestRate = parseFloat(e.target.value) || 0; updateData(question.field, next); }} className="w-full bg-gray-50 rounded-lg px-3 py-2 font-bold text-primary text-sm outline-none pr-6" />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-primary/30 font-bold text-xs">%</span>
                              </div>
                              <input type="text" placeholder="Purpose" value={itemData.purpose || ''} onChange={e => { const next = {...data[question.field]}; next[key].purpose = e.target.value; updateData(question.field, next); }} className="w-full bg-gray-50 rounded-lg px-3 py-2 font-bold text-primary text-sm outline-none" />
                              <input type="text" placeholder="Start Year" value={itemData.startYear || ''} onChange={e => { const next = {...data[question.field]}; next[key].startYear = e.target.value; updateData(question.field, next); }} className="w-full bg-gray-50 rounded-lg px-3 py-2 font-bold text-primary text-sm outline-none" />
                              <input type="text" placeholder="End Year" value={itemData.endYear || ''} onChange={e => { const next = {...data[question.field]}; next[key].endYear = e.target.value; updateData(question.field, next); }} className="w-full bg-gray-50 rounded-lg px-3 py-2 font-bold text-primary text-sm outline-none" />
                              <div className="flex bg-gray-50 rounded-lg p-1 col-span-2">
                                <button onClick={() => { const next = {...data[question.field]}; next[key].secured = true; updateData(question.field, next); }} className={cn("flex-1 text-xs font-bold rounded-md py-1", itemData.secured !== false ? "bg-white shadow-sm text-primary" : "text-text-soft")}>Secured</button>
                                <button onClick={() => { const next = {...data[question.field]}; next[key].secured = false; updateData(question.field, next); }} className={cn("flex-1 text-xs font-bold rounded-md py-1", itemData.secured === false ? "bg-white shadow-sm text-primary" : "text-text-soft")}>Unsecured</button>
                              </div>
                            </div>
                          </details>
                        </div>
                      )}

                      {isExpense && opt?.category === 'lifestyle' && onSmartMiniGoal && (
                        <button 
                          onClick={() => onSmartMiniGoal(opt.label)}
                          className="self-end p-2 bg-accent/10 text-accent rounded-xl hover:bg-accent hover:text-white transition-all"
                          title="Convert to Smart Goal"
                        >
                          <Sparkles size={14} />
                        </button>
                      )}
                    </motion.div>
                  );
                })}
                
                {(isExpense || question.type === 'asset-capture' || question.type === 'liability-capture') && (
                  <button 
                    onClick={() => {
                      const next = { ...data[question.field], [`custom_${Date.now()}`]: { amount: 0, label: '', frequency: 'monthly' } };
                      updateData(question.field, next);
                    }}
                    className="w-full py-4 border-2 border-dashed border-primary/20 rounded-[32px] text-primary font-black text-xs tracking-widest hover:bg-primary/5 transition-all mt-4"
                  >
                    + ADD ANOTHER {isExpense ? 'EXPENSE' : question.type === 'asset-capture' ? 'INVESTMENT' : 'LIABILITY'}
                  </button>
                )}
              </div>
            )}

            {(isKnowledge ? data[question.field]?.length > 0 : Object.keys(data[question.field] || {}).length > 0) && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleNext}
                className="w-full btn-accent py-6 rounded-[32px] font-black text-sm tracking-widest shadow-2xl shadow-accent/30"
              >
                CONTINUE <ArrowRight className="inline ml-2" size={18} />
              </motion.button>
            )}
          </div>
        );
      }
      case 'number':
        return (
          <div className="space-y-6">
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-primary/30">{question.unit}</span>
              <input 
                type="number"
                value={data[question.field] || ''}
                onChange={(e) => updateData(question.field, parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-full bg-white border-2 border-gray-100 rounded-[32px] pl-12 pr-6 py-8 text-4xl font-black text-primary focus:border-accent outline-none transition-all shadow-xl shadow-primary/5"
              />
            </div>
            {data[question.field] > 0 && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleNext}
                className="w-full btn-accent py-6 rounded-[32px] font-black text-sm tracking-widest shadow-2xl shadow-accent/30"
              >
                CONTINUE <ArrowRight className="inline ml-2" size={18} />
              </motion.button>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  if (isPersonaRevealed) {
    return (
      <div className="flex-1 flex flex-col bg-bg-main overflow-y-auto pb-24">
        <div className="p-8 space-y-10">
          <div className="text-center space-y-4">
            <motion.div 
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              className="w-32 h-32 bg-accent text-white rounded-[40px] flex items-center justify-center mx-auto shadow-2xl shadow-accent/30 border-4 border-white"
            >
              <Award size={64} strokeWidth={3} />
            </motion.div>
            <div>
              <p className="label-caps text-accent mb-2">YOUR MONEY PERSONA</p>
              <h2 className="text-5xl font-black text-primary leading-tight">{persona}</h2>
              {data.primaryGoal && (
                <p className="text-sm font-bold text-text-soft mt-2">
                  Building your strategy for: <span className="text-primary">{PROFILING_QUESTIONS.find(q => q.id === 'goal-capture')?.options?.find(o => o.value === data.primaryGoal)?.label}</span>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="card p-6 bg-white border border-gray-100 shadow-xl shadow-primary/5 col-span-2">
              <p className="label-caps text-text-soft mb-2">True Monthly Surplus</p>
              <p className="text-3xl font-black text-primary">₹{metrics.trueSurplus.toLocaleString('en-IN')}</p>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-text-soft font-bold">Operating Surplus</p>
                  <p className="font-black">₹{metrics.operatingSurplus.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-text-soft font-bold">Debt Servicing</p>
                  <p className="font-black text-danger">₹{metrics.debtServicingBurden.toLocaleString('en-IN')}</p>
                </div>
                {metrics.familySupportOutflow > 0 && (
                  <div className="col-span-2">
                    <p className="text-text-soft font-bold">Family Support Outflow</p>
                    <p className="font-black text-accent">₹{metrics.familySupportOutflow.toLocaleString('en-IN')}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="card p-6 bg-white border border-gray-100 shadow-xl shadow-primary/5">
              <p className="label-caps text-text-soft mb-2">Savings Ratio</p>
              <p className="text-2xl font-black text-primary">{metrics.savingsRatio.toFixed(0)}%</p>
              <div className="mt-2 h-1.5 w-full bg-bg-soft rounded-full overflow-hidden">
                <div className="h-full bg-success" style={{ width: `${metrics.savingsRatio}%` }} />
              </div>
            </div>
            <div className="card p-6 bg-white border border-gray-100 shadow-xl shadow-primary/5">
              <p className="label-caps text-text-soft mb-2">Money Cushion</p>
              <p className="text-2xl font-black text-primary">{data.survivalMonths} Months</p>
              <div className="mt-2 h-1.5 w-full bg-bg-soft rounded-full overflow-hidden">
                <div className="h-full bg-accent" style={{ width: `${metrics.emergencyReadinessScore}%` }} />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="heading-section">SMART NEXT STEPS</h3>
            <div className="space-y-4">
              {actions.map((action, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-5 p-6 bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-primary/5 group hover:border-accent/30 transition-all"
                >
                  <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex-shrink-0 flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all">
                    <Zap size={24} />
                  </div>
                  <p className="text-sm font-bold text-primary leading-relaxed">{action.title}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="p-6 bg-bg-soft rounded-[32px] border border-gray-100">
            <div className="flex items-center gap-3 mb-3 text-text-soft">
              <Info size={16} />
              <p className="text-[10px] font-black uppercase tracking-widest">Compliance Note</p>
            </div>
            <p className="text-[10px] text-text-soft leading-relaxed font-medium">
              This profile is based on self-reported data for suitability preparation. Recommendations depend on a full suitability assessment. No guaranteed returns are implied.
            </p>
          </div>

          <button 
            onClick={() => {
              const finalGoals: Goal[] = [];
              if (data.primaryGoal) {
                const opt = PROFILING_QUESTIONS.find(q => q.id === 'goal-capture')?.options?.find(o => o.value === data.primaryGoal);
                let category = 'wealth';
                let target = 0;
                let timeline = 5;

                if (data.primaryGoal === 'debt_free') {
                  category = 'debt';
                  // Calculate total debt from captured liabilities
                  target = (Object.values(data.capturedLiabilities || {}) as any[]).reduce((acc: number, l: any) => acc + (l.amount || 0), 0);
                  timeline = 2; // Default 2 years for debt-free
                } else if (data.primaryGoal === 'emergency') {
                  category = 'emergency';
                  const totalMonthlyExpenses = (Object.values(data.expenses || {}) as any[]).reduce((acc: number, e: any) => acc + (e.amount || 0), 0) as number;
                  target = (totalMonthlyExpenses || 50000) * 6;
                  timeline = 1;
                } else if (data.primaryGoal === 'house') {
                  category = 'home';
                  target = 5000000;
                  timeline = 10;
                } else if (data.primaryGoal === 'child_edu') {
                  category = 'education';
                  target = 3000000;
                  timeline = 15;
                } else if (data.primaryGoal === 'retirement') {
                  category = 'retirement';
                  target = 50000000;
                  timeline = 25;
                } else if (data.primaryGoal === 'wealth') {
                  category = 'wealth';
                  target = 10000000;
                  timeline = 10;
                } else if (data.primaryGoal === 'travel') {
                  category = 'travel';
                  target = 500000;
                  timeline = 3;
                } else if (data.primaryGoal === 'business') {
                  category = 'wealth';
                  target = 2000000;
                  timeline = 5;
                } else if (data.primaryGoal === 'security') {
                  category = 'family';
                  target = 5000000;
                  timeline = 10;
                } else {
                  category = 'custom';
                  target = 1000000;
                  timeline = 3;
                }

                finalGoals.push({
                  id: `g-${data.primaryGoal}-${Date.now()}`,
                  name: opt?.label || data.primaryGoal,
                  category: category,
                  target: target,
                  current: 0,
                  timeline: timeline,
                  priority: 'HIGH',
                  color: '#f5a623'
                } as Goal);
              }
              
              const finalLoans: Loan[] = Object.entries(data.capturedLiabilities || {}).map(([key, val]: [string, any]) => {
                const opt = PROFILING_QUESTIONS.find(q => q.id === 'liability-capture')?.options?.find(o => o.value === key);
                return {
                  id: `l-${key}-${Date.now()}`,
                  type: val.label || opt?.label || key,
                  amount: val.amount || 0,
                  emi: val.emi || 0
                };
              });

              onComplete({ 
                ...data, 
                goals: finalGoals,
                loans: finalLoans,
                profilingData: data,
                onboarded: true, 
                persona, 
                financialHealthScore: 85,
                emergencyScore: metrics.emergencyReadinessScore,
                income: metrics.totalIncome,
                expenses: metrics.totalExpenses,
                netWorth: metrics.netWorth,
                savingsRatio: metrics.savingsRatio,
                emiBurden: metrics.emiBurden
              } as UserProfile);
            }}
            className="w-full btn-primary py-6 rounded-[32px] font-black text-sm tracking-widest shadow-2xl shadow-primary/30"
          >
            ENTER FINPATH <ArrowRight className="inline ml-2" size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-bg-main overflow-hidden">
      {/* Progress Header */}
      <div className="px-8 pt-12 pb-6 space-y-6">
        <div className="flex justify-between items-center">
          <button 
            onClick={handleBack}
            disabled={step === 0}
            className={cn(
              "p-3 rounded-2xl transition-all",
              step === 0 ? "opacity-0 pointer-events-none" : "bg-white text-primary shadow-lg shadow-primary/5 border border-gray-100"
            )}
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex flex-col items-center">
            <p className="text-[10px] font-black text-text-soft uppercase tracking-[0.2em] mb-1">
              {['risk-willingness', 'risk-bonus', 'loss-reaction', 'risk-vibe'].includes(currentQuestion?.id) ? 'Risk Willingness' : 'Money Profile'}
            </p>
            <p className="text-xs font-black text-primary">{step + 1} / {PROFILING_QUESTIONS.length}</p>
          </div>
          <div className="w-12" /> {/* Spacer */}
        </div>
        <div className="h-2 w-full bg-bg-soft rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-accent shadow-[0_0_15px_rgba(245,166,35,0.5)]"
          />
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-[10px] font-black text-primary/40 uppercase tracking-widest">Profile Completeness</span>
          <span className="text-[10px] font-black text-accent">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Question Content */}
      <div className="flex-1 overflow-y-auto px-8 pb-40">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-10"
          >
            <div className="space-y-3">
              <h2 className="text-4xl font-black text-primary leading-tight tracking-tight">
                {currentQuestion?.title}
              </h2>
              <p className="text-lg font-bold text-text-soft leading-relaxed">
                {currentQuestion?.description}
              </p>
              {currentQuestion?.type === 'asset-capture' && Object.keys(data[currentQuestion.field] || {}).length > 0 && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-success/10 text-success rounded-full text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  {Object.keys(data[currentQuestion.field]).length} investments mapped
                </div>
              )}
              {currentQuestion?.type === 'liability-capture' && Object.keys(data[currentQuestion.field] || {}).length > 0 && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-danger/10 text-danger rounded-full text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
                  {Object.keys(data[currentQuestion.field]).length} loans added
                </div>
              )}
            </div>

            {renderInput(currentQuestion)}

            {showInsight && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-success/5 border border-success/20 rounded-[32px] flex gap-4 items-start"
              >
                <div className="w-10 h-10 bg-success text-white rounded-2xl flex-shrink-0 flex items-center justify-center">
                  <TrendingUp size={20} />
                </div>
                <p className="text-sm font-bold text-success leading-relaxed">
                  {showInsight}
                </p>
              </motion.div>
            )}

            {['risk-willingness', 'risk-bonus', 'loss-reaction', 'risk-vibe'].includes(currentQuestion?.id) && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-6 bg-primary/5 rounded-[32px] border-2 border-primary/10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center">
                    <Activity size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-text-soft uppercase tracking-widest">Live Analysis</p>
                    <p className="text-sm font-bold text-primary">Risk Profile Builder</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-text-soft">Conservative</span>
                    <span className="text-primary">Aggressive</span>
                  </div>
                  <div className="h-2 w-full bg-white rounded-full overflow-hidden border border-gray-100">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-success via-accent to-danger"
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${
                          ((data.riskWillingness === 'very_high' ? 100 : data.riskWillingness === 'high' ? 80 : data.riskWillingness === 'moderate' ? 50 : data.riskWillingness === 'low' ? 30 : data.riskWillingness === 'very_low' ? 10 : 0) +
                          (data.bonusBehavior === 'invest' ? 100 : data.bonusBehavior === 'save' ? 50 : data.bonusBehavior === 'debt' ? 20 : data.bonusBehavior === 'spend' ? 10 : 0) +
                          (data.lossReaction === 'buy' ? 100 : data.lossReaction === 'hold' ? 70 : data.lossReaction === 'wait' ? 40 : data.lossReaction === 'sell' ? 10 : 0) +
                          (data.riskVibe === 'growth' ? 100 : data.riskVibe === 'balance' ? 50 : data.riskVibe === 'safety' ? 10 : 0)) / 
                          ([data.riskWillingness, data.bonusBehavior, data.lossReaction, data.riskVibe].filter(Boolean).length || 1)
                        }%` 
                      }}
                    />
                  </div>
                  <p className="text-xs font-medium text-text-soft text-center mt-2">
                    Your answers are shaping your investment strategy.
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Live Metrics Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-50">
        <div className="flex justify-between items-center max-w-lg mx-auto">
          <div className="flex gap-8">
            <div>
              <p className="text-[10px] font-black text-text-soft uppercase mb-1">Income</p>
              <p className="text-lg font-black text-primary">₹{metrics.totalIncome.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-text-soft uppercase mb-1">Outflow</p>
              <p className="text-lg font-black text-danger">₹{metrics.totalExpenses.toLocaleString('en-IN')}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-text-soft uppercase mb-1">Surplus</p>
            <p className={cn(
              "text-lg font-black",
              metrics.surplus > 0 ? "text-success" : "text-danger"
            )}>₹{metrics.surplus.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedOnboarding;
