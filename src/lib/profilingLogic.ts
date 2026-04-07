import { UserProfile, Goal, Loan } from '../types';

export interface Question {
  id: string;
  type: 'demographics' | 'choice' | 'number' | 'slider' | 'scenario' | 'multi-choice' | 'income-sources' | 'expense-buckets' | 'asset-capture' | 'insurance-capture' | 'liability-capture' | 'goal-capture' | 'knowledge-quiz' | 'risk-willingness';
  title: string;
  description: string;
  options?: { label: string; value: any; icon?: string; score?: number; category?: string }[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  field: string;
  insight?: (value: any, data: any) => string;
}

export const PROFILING_QUESTIONS: Question[] = [
  {
    id: 'demographics',
    type: 'demographics',
    title: "Let's get to know you",
    description: "A few quick details to personalize your experience.",
    field: 'demographics'
  },
  {
    id: 'life-stage',
    type: 'choice',
    title: "Where are you in life's journey?",
    description: "This helps us tailor your wealth strategy.",
    field: 'lifeStage',
    options: [
      { label: 'Early Career', value: 'early', icon: '🚀' },
      { label: 'First Job', value: 'first_job', icon: '💼' },
      { label: 'Young Couple', value: 'young_couple', icon: '👩‍❤️‍👨' },
      { label: 'Growing Family', value: 'family', icon: '🏡' },
      { label: 'Business Owner', value: 'business', icon: '📈' },
      { label: 'Mid-Career Builder', value: 'mid', icon: '🏗️' },
      { label: 'Pre-Retirement', value: 'freedom', icon: '🌅' },
      { label: 'Retired', value: 'retired', icon: '🌴' }
    ]
  },
  {
    id: 'income-style',
    type: 'multi-choice',
    title: "How do you earn?",
    description: "Select all that apply. This helps us understand your cash flow stability.",
    field: 'incomeStyles',
    options: [
      { label: 'Fixed Salary', value: 'fixed', icon: '📅' },
      { label: 'Variable Salary', value: 'variable', icon: '🌊' },
      { label: 'Business Income', value: 'business', icon: '🏢' },
      { label: 'Freelance', value: 'freelance', icon: '🎨' },
      { label: 'Professional Practice', value: 'practice', icon: '⚖️' },
      { label: 'Rental Income', value: 'rental', icon: '🔑' },
      { label: 'Investment Income', value: 'investment', icon: '💰' },
      { label: 'Pension', value: 'pension', icon: '👵' },
      { label: 'Family Supported', value: 'family', icon: '👪' },
      { label: 'Multiple Sources', value: 'multiple', icon: '📚' }
    ]
  },
  {
    id: 'income-details',
    type: 'income-sources',
    title: "Your Income Sources",
    description: "Add your monthly income details for each source.",
    field: 'incomeSources'
  },
  {
    id: 'earning-structure',
    type: 'choice',
    title: "Who earns in this household?",
    description: "Understanding the earning structure helps in risk planning.",
    field: 'earnerStructure',
    options: [
      { label: 'Only me', value: 'me', icon: '👤' },
      { label: 'Me and spouse', value: 'spouse', icon: '👫' },
      { label: 'Multiple members', value: 'multiple', icon: '👨‍👩‍👧‍👦' }
    ]
  },
  {
    id: 'income-arrival',
    type: 'choice',
    title: "How does income usually arrive?",
    description: "Predictability is key for budgeting.",
    field: 'incomeArrival',
    options: [
      { label: 'Same date every month', value: 'fixed', icon: '📅' },
      { label: 'Different dates', value: 'variable', icon: '🔄' },
      { label: 'Irregular cash flow', value: 'irregular', icon: '🌊' },
      { label: 'Seasonal spikes', value: 'seasonal', icon: '📈' }
    ]
  },
  {
    id: 'expense-capture',
    type: 'expense-buckets',
    title: "Where does your money go?",
    description: "Tap categories to add your monthly outflow.",
    field: 'expenses',
    options: [
      // Mandatory / Debt
      { label: 'Rent / Housing', value: 'rent', category: 'mandatory', icon: '🏠' },
      { label: 'Home EMI', value: 'home_emi', category: 'mandatory', icon: '🏦' },
      { label: 'Car EMI', value: 'car_emi', category: 'mandatory', icon: '🚗' },
      { label: 'Other EMI / Debt', value: 'other_emi', category: 'mandatory', icon: '💳' },
      { label: 'Credit Card Payment', value: 'cc_payment', category: 'mandatory', icon: '💳' },
      { label: 'Insurance Premium', value: 'insurance', category: 'mandatory', icon: '🛡️' },
      { label: 'School / Child Expenses', value: 'school', category: 'mandatory', icon: '🎓' },
      { label: 'Tax Provision', value: 'tax', category: 'mandatory', icon: '📜' },
      // Essential
      { label: 'Groceries', value: 'groceries', category: 'essential', icon: '🍎' },
      { label: 'Utilities', value: 'utilities', category: 'essential', icon: '💡' },
      { label: 'Mobile / Internet', value: 'internet', category: 'essential', icon: '🌐' },
      { label: 'Transport / Fuel / Cab', value: 'transport', category: 'essential', icon: '⛽' },
      { label: 'Medicines / Medical', value: 'medicines', category: 'essential', icon: '💊' },
      { label: 'Domestic Help', value: 'help', category: 'essential', icon: '🧹' },
      { label: 'Parent / Family Support', value: 'family_support', category: 'essential', icon: '👨‍👩‍👧‍👦' },
      // Lifestyle / Discretionary
      { label: 'Eating Out', value: 'dining', category: 'lifestyle', icon: '🍕' },
      { label: 'Shopping / Lifestyle', value: 'shopping', category: 'lifestyle', icon: '🛍️' },
      { label: 'OTT / Subscriptions', value: 'subs', category: 'lifestyle', icon: '📺' },
      { label: 'Travel', value: 'travel', category: 'lifestyle', icon: '✈️' },
      { label: 'Fitness', value: 'fitness', category: 'lifestyle', icon: '💪' },
      { label: 'Entertainment', value: 'fun', category: 'lifestyle', icon: '🎬' },
      { label: 'Religious / Festival / Social', value: 'social', category: 'lifestyle', icon: '🎉' },
      { label: 'Pets', value: 'pets', category: 'lifestyle', icon: '🐾' },
      { label: 'SIP / Recurring Savings', value: 'sip', category: 'lifestyle', icon: '📈' },
      { label: 'Miscellaneous', value: 'misc', category: 'lifestyle', icon: '📦' }
    ]
  },
  {
    id: 'dependents',
    type: 'choice',
    title: "Who depends on your income?",
    description: "This helps us calculate your risk capacity.",
    field: 'dependents',
    options: [
      { label: 'No one', value: 0, icon: '👤' },
      { label: '1-2 people', value: 2, icon: '👫' },
      { label: '3+ people', value: 4, icon: '👨‍👩‍👧‍👦' }
    ]
  },
  {
    id: 'asset-capture',
    type: 'asset-capture',
    title: "What do you already own?",
    description: "Tap to add your current investments and assets.",
    field: 'capturedAssets',
    options: [
      { label: 'None', value: 'none', icon: '🤷' },
      { label: 'Savings Account', value: 'savings', icon: '🏦' },
      { label: 'Fixed / Recurring Deposit', value: 'fd', icon: '📜' },
      { label: 'Mutual Funds', value: 'mf', icon: '📊' },
      { label: 'Stocks', value: 'stocks', icon: '📈' },
      { label: 'Bonds', value: 'bonds', icon: '📄' },
      { label: 'PPF / EPF / VPF / NPS', value: 'epf', icon: '🏢' },
      { label: 'LIC / Insurance Savings', value: 'lic', icon: '🛡️' },
      { label: 'ULIP', value: 'ulip', icon: '📈' },
      { label: 'Gold ETF / SGB', value: 'gold_etf', icon: '🟡' },
      { label: 'Physical Gold', value: 'gold', icon: '🪙' },
      { label: 'Chit Fund', value: 'chit', icon: '👥' },
      { label: 'Committee / Local Savings', value: 'committee', icon: '🤝' },
      { label: 'Post Office Schemes', value: 'post_office', icon: '📮' },
      { label: 'Land / Plot / Real Estate', value: 'property', icon: '🏠' },
      { label: 'Business Investment', value: 'business', icon: '💼' },
      { label: 'Cash at Home', value: 'cash', icon: '💵' }
    ]
  },
  {
    id: 'insurance-capture',
    type: 'insurance-capture',
    title: "Are you protected?",
    description: "Select the insurance covers you currently have.",
    field: 'capturedInsurance',
    options: [
      { label: 'Term Life', value: 'term', icon: '🛡️' },
      { label: 'Health', value: 'health', icon: '🏥' },
      { label: 'Personal Accident', value: 'accident', icon: '🩹' },
      { label: 'Motor', value: 'motor', icon: '🚗' },
      { label: 'Property', value: 'property_ins', icon: '🏠' }
    ]
  },
  {
    id: 'liability-capture',
    type: 'liability-capture',
    title: "Any active loans?",
    description: "Understanding your debt helps in better planning.",
    field: 'capturedLiabilities',
    options: [
      { label: 'Home Loan', value: 'home', icon: '🏠' },
      { label: 'Car Loan', value: 'car', icon: '🚗' },
      { label: 'Personal Loan', value: 'personal', icon: '👤' },
      { label: 'Education Loan', value: 'edu', icon: '🎓' },
      { label: 'Credit Card', value: 'cc', icon: '💳' },
      { label: 'Borrowed from Friends/Family', value: 'friends_family', icon: '🤝' },
      { label: 'Gold Loan / Jewellery Pledged', value: 'gold_loan', icon: '🪙' },
      { label: 'Loan Against Property', value: 'lap', icon: '🏢' },
      { label: 'Loan Against FD/Securities', value: 'las', icon: '📜' }
    ]
  },
  {
    id: 'emergency-resilience',
    type: 'choice',
    title: "Your money cushion",
    description: "If your income stops today, how long can you manage without borrowing?",
    field: 'survivalMonths',
    options: [
      { label: 'Less than 1 month', value: 0.5, icon: '⚠️', score: 10 },
      { label: '1–2 months', value: 1.5, icon: '😟', score: 30 },
      { label: '3–4 months', value: 3.5, icon: '😐', score: 60 },
      { label: '5–6 months', value: 5.5, icon: '🙂', score: 85 },
      { label: 'More than 6 months', value: 7, icon: '🛡️', score: 100 }
    ]
  },
  {
    id: 'goal-capture',
    type: 'choice',
    title: "Pick your #1 money goal",
    description: "Choose the one goal that matters most right now. We’ll build your money profile around it.",
    field: 'primaryGoal',
    options: [
      { label: 'Emergency fund', value: 'emergency', icon: '🛡️' },
      { label: 'Become debt-free', value: 'debt_free', icon: '📉' },
      { label: 'Buy a house', value: 'house', icon: '🏠' },
      { label: 'Child education', value: 'child_edu', icon: '🎓' },
      { label: 'Retirement', value: 'retirement', icon: '🌅' },
      { label: 'Wealth creation', value: 'wealth', icon: '💰' },
      { label: 'Family security', value: 'security', icon: '👨‍👩‍👧‍👦' },
      { label: 'Business fund', value: 'business', icon: '📈' }
    ]
  },
  {
    id: 'knowledge-quiz',
    type: 'knowledge-quiz',
    title: "Quick Money IQ Check",
    description: "Let's see how much you know about money concepts.",
    field: 'knowledgeScore',
    options: [
      { label: 'Inflation', value: 'inflation', icon: '🎈' },
      { label: 'Compounding', value: 'compounding', icon: '🌱' },
      { label: 'Diversification', value: 'diversification', icon: '🌈' },
      { label: 'Liquidity', value: 'liquidity', icon: '💧' }
    ]
  },
  {
    id: 'risk-willingness',
    type: 'risk-willingness',
    title: "Your Risk Willingness",
    description: "How comfortable are you with taking financial risks?",
    field: 'riskWillingness',
    options: [
      { label: 'Very Low', value: 'very_low', icon: '🛡️', score: 10 },
      { label: 'Low', value: 'low', icon: '🐢', score: 30 },
      { label: 'Moderate', value: 'moderate', icon: '⚖️', score: 50 },
      { label: 'High', value: 'high', icon: '🚀', score: 80 },
      { label: 'Very High', value: 'very_high', icon: '🔥', score: 100 }
    ]
  },
  {
    id: 'risk-bonus',
    type: 'scenario',
    title: "A surprise bonus arrives! What's first?",
    description: "Your immediate reaction reveals your money mindset.",
    field: 'bonusBehavior',
    options: [
      { label: 'Pay off debt', value: 'debt', icon: '📉', score: 20 },
      { label: 'Invest for growth', value: 'invest', icon: '📈', score: 80 },
      { label: 'Treat myself/family', value: 'spend', icon: '🎁', score: 10 },
      { label: 'Add to savings', value: 'save', icon: '💰', score: 50 }
    ]
  },
  {
    id: 'loss-reaction',
    type: 'scenario',
    title: "Market drops 20% in a month. You...",
    description: "How do you react to sudden market drops?",
    field: 'lossReaction',
    options: [
      { label: 'Sell everything', value: 'sell', icon: '😨', score: 10 },
      { label: 'Wait and watch', value: 'wait', icon: '😟', score: 40 },
      { label: 'Stick to the plan', value: 'hold', icon: '😐', score: 70 },
      { label: 'Buy more!', value: 'buy', icon: '🤑', score: 100 }
    ]
  },
  {
    id: 'risk-vibe',
    type: 'scenario',
    title: "Which sounds more like you?",
    description: "Choose the path that feels most comfortable.",
    field: 'riskVibe',
    options: [
      { label: 'Safety First', value: 'safety', icon: '🛡️', score: 10 },
      { label: 'Balanced Growth', value: 'balance', icon: '⚖️', score: 50 },
      { label: 'Aggressive Wealth', value: 'growth', icon: '🚀', score: 100 }
    ]
  }
];

export const calculateMetrics = (data: any) => {
  const totalIncome = (Array.isArray(data.incomeSources) ? data.incomeSources : []).reduce((acc: number, s: any) => acc + (s.amount || 0), 0);
  
  let totalExpenses = 0;
  let mandatoryExpenses = 0;
  let essentialExpenses = 0;
  let lifestyleExpenses = 0;
  let familySupportOutflow = 0;
  let debtServicingBurden = 0;

  if (data.demographics?.supportParents === 'yes' && data.demographics?.familySupportOutflow) {
    const outflow = parseInt(data.demographics.familySupportOutflow) || 0;
    familySupportOutflow += outflow;
    totalExpenses += outflow;
    essentialExpenses += outflow;
  }

  if (data.expenses) {
    Object.keys(data.expenses).forEach(key => {
      const exp = data.expenses[key];
      const val = exp.amount || 0;
      const freq = exp.frequency || 'monthly';
      let monthlyVal = val;
      if (freq === 'quarterly') monthlyVal = val / 3;
      if (freq === 'annual') monthlyVal = val / 12;
      if (freq === 'occasional') monthlyVal = val / 12;

      totalExpenses += monthlyVal;
      
      const question = PROFILING_QUESTIONS.find(q => q.id === 'expense-capture');
      const option = question?.options?.find(o => o.value === key);
      const cat = exp.tag || option?.category || 'lifestyle';
      
      if (cat === 'mandatory') mandatoryExpenses += monthlyVal;
      if (cat === 'essential') essentialExpenses += monthlyVal;
      if (cat === 'lifestyle') lifestyleExpenses += monthlyVal;

      if (key === 'family_support' || exp.tag === 'family_support') familySupportOutflow += monthlyVal;
      if (['home_emi', 'car_emi', 'other_emi', 'cc_payment'].includes(key) || exp.tag === 'debt') debtServicingBurden += monthlyVal;
    });
  }

  let liabilitiesEmi = 0;
  if (data.capturedLiabilities) {
    Object.keys(data.capturedLiabilities).forEach(key => {
      liabilitiesEmi += (data.capturedLiabilities[key].emi || 0);
    });
  }

  if (liabilitiesEmi > 0) {
    totalExpenses -= debtServicingBurden;
    debtServicingBurden = liabilitiesEmi;
    totalExpenses += debtServicingBurden;
  }

  const operatingSurplus = totalIncome - (totalExpenses - debtServicingBurden);
  const trueSurplus = totalIncome - totalExpenses;
  const surplus = trueSurplus; // Use true surplus for downstream calculations
  const monthlySurplus = trueSurplus;
  
  const savingsRatio = totalIncome > 0 ? (surplus / totalIncome) * 100 : 0;
  const emiBurden = totalIncome > 0 ? (debtServicingBurden / totalIncome) * 100 : 0;
  const totalAssets = (Object.values(data.capturedAssets || {}) as any[]).reduce((acc: number, a: any) => acc + (a.amount || 0), 0) as number;
  const totalLiabilities = (Object.values(data.capturedLiabilities || {}) as any[]).reduce((acc: number, l: any) => acc + (l.amount || 0), 0) as number;
  const netWorth = totalAssets - totalLiabilities;

  const liquidAssets = (Object.entries(data.capturedAssets || {}) as [string, any][])
    .filter(([key]) => ['savings', 'fd', 'mf', 'cash'].includes(key))
    .reduce((acc, [_, a]) => acc + (a.amount || 0), 0);
  
  const liquidityRatio = totalExpenses > 0 ? liquidAssets / totalExpenses : 0;
  const leverageRatio = totalAssets > 0 ? totalLiabilities / totalAssets : 0;

  // Risk Willingness Score (0-100)
  const riskQuestions = ['riskBehavior', 'bonusBehavior', 'riskVibe', 'lossReaction'];
  let riskWillingnessScore = 0;
  let answeredRiskQuestions = 0;
  riskQuestions.forEach(q => {
    if (data[q]) {
      const question = PROFILING_QUESTIONS.find(que => que.field === q);
      const option = question?.options?.find(o => o.value === data[q]);
      riskWillingnessScore += (option?.score || 0);
      answeredRiskQuestions++;
    }
  });
  riskWillingnessScore = answeredRiskQuestions > 0 ? riskWillingnessScore / answeredRiskQuestions : 50;

  // Risk Capacity Score (0-100)
  let riskCapacityScore = 50; // Base
  if (data.dependents === 0) riskCapacityScore += 20;
  if (data.dependents > 2) riskCapacityScore -= 20;
  if (data.survivalMonths >= 4.5) riskCapacityScore += 20;
  if (emiBurden > 40) riskCapacityScore -= 20;
  if (savingsRatio > 30) riskCapacityScore += 10;
  riskCapacityScore = Math.max(0, Math.min(100, riskCapacityScore));

  // Knowledge Score
  const knowledgeScore = (Array.isArray(data.knowledgeScore) ? data.knowledgeScore : []).length * 25;

  // Emergency Readiness Score (0-100)
  const emergencyOption = PROFILING_QUESTIONS.find(q => q.id === 'emergency-resilience')?.options?.find(o => o.value === data.survivalMonths);
  const emergencyReadinessScore = emergencyOption?.score || Math.min(100, (liquidityRatio / 6) * 100);

  // Financial Health Score (0-100)
  let financialHealthScore = 50;
  if (savingsRatio >= 20) financialHealthScore += 10;
  if (savingsRatio >= 40) financialHealthScore += 10;
  if (emiBurden <= 30) financialHealthScore += 10;
  if (emiBurden > 50) financialHealthScore -= 20;
  if (liquidityRatio >= 6 || data.survivalMonths >= 6) financialHealthScore += 10;
  if (liquidityRatio < 2 && data.survivalMonths < 2) financialHealthScore -= 10;
  if (leverageRatio < 0.5) financialHealthScore += 10;
  if (leverageRatio > 0.8) financialHealthScore -= 20;
  financialHealthScore = Math.max(0, Math.min(100, financialHealthScore));

  return {
    totalIncome,
    totalExpenses,
    mandatoryExpenses,
    essentialExpenses,
    lifestyleExpenses,
    surplus,
    monthlySurplus,
    operatingSurplus,
    trueSurplus,
    familySupportOutflow,
    debtServicingBurden,
    savingsRatio,
    emiBurden,
    totalAssets,
    totalLiabilities,
    netWorth,
    liquidAssets,
    liquidityRatio,
    leverageRatio,
    riskWillingnessScore,
    riskCapacityScore,
    knowledgeScore,
    emergencyReadinessScore,
    financialHealthScore
  };
};

export const mapPersona = (data: any, metrics: any): string => {
  const survivalMonths = data.survivalMonths || metrics.liquidityRatio || 0;
  const isExpensesHigh = metrics.lifestyleExpenses > (metrics.totalIncome * 0.35) || metrics.emiBurden > 35;
  const isSavingsConsistent = metrics.savingsRatio > 25;

  if (survivalMonths < 2 && isExpensesHigh) return 'EMI Warrior';
  if (survivalMonths < 3 && metrics.lifestyleExpenses > (metrics.totalIncome * 0.4)) return 'Cashflow Juggler';
  if (survivalMonths >= 5 && isSavingsConsistent && metrics.riskWillingnessScore < 40) return 'Wealth Protector';
  if (survivalMonths >= 3 && isSavingsConsistent && metrics.riskWillingnessScore < 60) return 'Cautious Builder';
  if (survivalMonths >= 4 && isSavingsConsistent && metrics.riskWillingnessScore >= 60) return 'Balanced Planner';
  if (metrics.savingsRatio > 30 && metrics.riskWillingnessScore > 70) return 'Confident Explorer';
  
  if (metrics.emiBurden > 40) return 'EMI Stretched';
  if (metrics.riskWillingnessScore < 30) return 'Safe Saver';
  if (metrics.riskCapacityScore < 30) return 'Protection Gapper';
  if (metrics.savingsRatio > 40) return 'Goal Builder';
  if (metrics.riskWillingnessScore > 70) return 'Growth Explorer';
  return 'Balanced Planner';
};

export const getSmartActions = (persona: string, metrics: any) => {
  const actions: { title: string; description: string }[] = [];
  if (metrics.emiBurden > 30) actions.push({ 
    title: "Reduce EMI Burden", 
    description: "Consolidate high-interest loans to reduce your monthly EMI outflow." 
  });
  if (metrics.savingsRatio < 20) actions.push({ 
    title: "Automate Savings", 
    description: "Automate a 'Pay Yourself First' SIP of at least 10% of your income." 
  });
  if (persona === 'Wealth Protector') actions.push({ 
    title: "Build Liquidity", 
    description: "Focus on debt-free living and maintaining liquid emergency funds." 
  });
  if (persona === 'Growth Explorer') actions.push({ 
    title: "Equity Exposure", 
    description: "Explore equity-heavy diversified portfolios for long-term wealth creation." 
  });
  
  // Default actions
  if (actions.length < 3) actions.push({ 
    title: "Review Protection", 
    description: "Review your insurance coverage for life and health to ensure adequate protection." 
  });
  if (actions.length < 3) actions.push({ 
    title: "Goal Planning", 
    description: "Start a dedicated goal for your next big purchase with inflation adjustment." 
  });
  
  return actions.slice(0, 3);
};
