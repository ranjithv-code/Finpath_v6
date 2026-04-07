import { UserProfile, Goal } from '../types';
import { calculateMetrics } from './profilingLogic';

export const searchIntentMap: Record<string, string> = {
  'mba': 'education',
  'college': 'education',
  'school': 'education',
  'degree': 'education',
  'phd': 'education',
  'higher studies': 'education',
  'education': 'education',
  'career switch': 'education',
  'certification': 'education',
  'wedding': 'family',
  'marriage': 'family',
  'child': 'family',
  'baby': 'family',
  'parents': 'family',
  'house': 'home',
  'home': 'home',
  'flat': 'home',
  'apartment': 'home',
  'renovation': 'home',
  'interiors': 'home',
  'europe': 'travel',
  'trip': 'travel',
  'vacation': 'travel',
  'holiday': 'travel',
  'world tour': 'travel',
  'travel': 'travel',
  'honeymoon': 'travel',
  'rolex': 'luxury',
  'watch': 'luxury',
  'car': 'luxury',
  'bmw': 'luxury',
  'audi': 'luxury',
  'mercedes': 'luxury',
  'luxury': 'luxury',
  'lifestyle': 'luxury',
  'gadget': 'luxury',
  'iphone': 'luxury',
  'macbook': 'luxury',
  'fashion': 'luxury',
  'retirement': 'wealth',
  'fire': 'wealth',
  'invest': 'wealth',
  'wealth': 'wealth',
  'savings': 'wealth',
  'debt': 'debt',
  'loan': 'debt',
  'emi': 'debt',
  'credit card': 'debt'
};

export const goalTemplates = [
  { id: 'higher_edu', title: 'Higher Education', category: 'education', baseCost: 4500000, timeline: 2, icon: '🎓', difficulty: 'Hard' },
  { id: 'child_edu', title: 'Child Education Fund', category: 'education', baseCost: 6000000, timeline: 15, icon: '🎒', difficulty: 'Moderate' },
  { id: 'relaxing_getaway', title: 'Relaxing Getaway', category: 'travel', baseCost: 150000, timeline: 1, icon: '🏖️', difficulty: 'Easy' },
  { id: 'adventure_trip', title: 'Adventure Trip', category: 'travel', baseCost: 250000, timeline: 1, icon: '🧗', difficulty: 'Moderate' },
  { id: 'wedding', title: 'Dream Wedding', category: 'family', baseCost: 3000000, timeline: 3, icon: '💍', difficulty: 'Hard' },
  { id: 'luxury_watch', title: 'Luxury Rolex Watch', category: 'luxury', baseCost: 800000, timeline: 1, icon: '⌚', difficulty: 'Moderate' },
  { id: 'luxury_car', title: 'Premium Luxury Car', category: 'luxury', baseCost: 4500000, timeline: 3, icon: '🏎️', difficulty: 'Hard' },
  { id: 'gadget_stack', title: 'High-End Gadget Stack', category: 'luxury', baseCost: 300000, timeline: 1, icon: '💻', difficulty: 'Easy' },
  { id: 'designer_wardrobe', title: 'Designer Wardrobe', category: 'luxury', baseCost: 500000, timeline: 1, icon: '👗', difficulty: 'Moderate' },
  { id: 'retirement', title: 'Early Retirement (FIRE)', category: 'wealth', baseCost: 60000000, timeline: 20, icon: '🌅', difficulty: 'Extreme' },
  { id: 'new_home', title: 'Buy a New Home', category: 'home', baseCost: 5000000, timeline: 5, icon: '🏠', difficulty: 'Hard' },
  { id: 'home_renovation', title: 'Renovate Existing Home', category: 'home', baseCost: 1000000, timeline: 2, icon: '🛠️', difficulty: 'Moderate' },
  { id: 'emergency', title: '6-Month Emergency Fund', category: 'wealth', baseCost: 600000, timeline: 1, icon: '🛡️', difficulty: 'Easy' },
  { id: 'debt_free', title: 'Become Debt-Free', category: 'debt', baseCost: 0, timeline: 2, icon: '📉', difficulty: 'Hard' }
];

export const journeyMap: Record<string, any> = {
  'education': {
    title: 'Education Planning',
    questions: [
      { id: 'q1', text: 'Who is this education for?', type: 'select', options: ['Self', 'Child', 'Spouse'] },
      { id: 'q2', text: 'Where do you plan to study?', type: 'select', options: ['India', 'Abroad'] },
      { id: 'q3', text: 'When do the funds need to be ready?', type: 'text', placeholder: 'Years' }
    ]
  },
  'family': {
    title: 'Family Goal Planning',
    questions: [
      { id: 'q1', text: 'What type of family goal is this?', type: 'select', options: ['Wedding', 'House', 'New Baby', 'Other'] },
      { id: 'q2', text: 'Will you be sharing this cost with someone?', type: 'select', options: ['Yes, 50-50', 'Yes, partially', 'No, I am funding it'] },
      { id: 'q3', text: 'Estimated timeline?', type: 'text', placeholder: 'Years' }
    ]
  },
  'travel': {
    title: 'Travel Fund Planning',
    questions: [
      { id: 'q1', text: 'What kind of trip is this?', type: 'select', options: ['Solo Backpacking', 'Couple Getaway', 'Family Vacation', 'Luxury Tour'] },
      { id: 'q2', text: 'Which region?', type: 'select', options: ['Asia', 'Europe', 'Americas', 'Domestic'] },
      { id: 'q3', text: 'When are you planning to go?', type: 'text', placeholder: 'Months' }
    ]
  },
  'luxury': {
    title: 'Luxury Purchase',
    questions: [
      { id: 'q1', text: 'What are you planning to buy?', type: 'select', options: ['Watch', 'Car', 'Designer Item', 'Other'] },
      { id: 'q2', text: 'Is this a milestone reward?', type: 'select', options: ['Yes', 'Just because'] },
      { id: 'q3', text: 'Target timeline?', type: 'text', placeholder: 'Months' }
    ]
  },
  'wealth': {
    title: 'Wealth Creation',
    questions: [
      { id: 'q1', text: 'What is the primary objective?', type: 'select', options: ['Retirement', 'Financial Independence', 'Legacy'] },
      { id: 'q2', text: 'What is your target corpus?', type: 'text', placeholder: '₹' },
      { id: 'q3', text: 'Years to target?', type: 'text', placeholder: 'Years' }
    ]
  },
  'debt': {
    title: 'Debt-Free Journey',
    questions: [
      { id: 'q1', text: 'What type of debt are you tackling?', type: 'select', options: ['Credit Card', 'Personal Loan', 'Home Loan', 'Multiple Debts'] },
      { id: 'q2', text: 'Total outstanding amount?', type: 'text', placeholder: '₹' },
      { id: 'q3', text: 'Target timeline to be debt-free?', type: 'text', placeholder: 'Years' }
    ]
  },
  'default': {
    title: 'Goal Planning',
    questions: [
      { id: 'q1', text: 'What is your target amount?', type: 'text', placeholder: '₹' },
      { id: 'q2', text: 'When do you need it?', type: 'text', placeholder: 'Years' }
    ]
  }
};

export const suggestionEngine = (profile: UserProfile, category: string | null, query: string | null) => {
  let results = [...goalTemplates];
  const metrics = calculateHomepageMetrics(profile);
  
  // 1. Filter by category or search query
  if (query) {
    const lowerQuery = query.toLowerCase();
    
    // Check intent map
    let matchedCategory = null;
    for (const [key, cat] of Object.entries(searchIntentMap)) {
      if (lowerQuery.includes(key)) {
        matchedCategory = cat;
        break;
      }
    }
    
    results = results.filter(g => 
      g.title.toLowerCase().includes(lowerQuery) || 
      g.category === matchedCategory ||
      g.category.toLowerCase().includes(lowerQuery)
    ).map(g => ({
      ...g,
      rank: 'Nice to plan',
      reason: matchedCategory === g.category 
        ? `Matches your interest in ${g.category}.`
        : `Based on your search for "${query}".`
    }));
  } else if (category) {
    results = results.filter(g => g.category === category).map(g => ({
      ...g,
      rank: 'Should start soon',
      reason: `Top pick in the ${category} category.`
    }));
  } else {
    // Default profile-aware suggestions if no category or query
    results = results.map(g => {
      let reason = "Suggested for your life stage.";
      let rank: 'Must do now' | 'Should start soon' | 'Nice to plan' = 'Nice to plan';

      if (g.id === 'emergency' && metrics.emergencyMonths < 6) {
        reason = "Critical: Your emergency fund is below the recommended 6 months.";
        rank = 'Must do now';
      } else if (g.id === 'child_edu' && profile.familyProfile?.dependentsCount && profile.familyProfile.dependentsCount > 0) {
        reason = "Essential for your family's future security.";
        rank = 'Should start soon';
      } else if (g.id === 'retirement' && (profile.profilingData?.age > 30 || true)) {
        reason = "The best time to start for retirement is today.";
        rank = 'Should start soon';
      } else if (g.id === 'debt_free' && metrics.emiBurden > 30) {
        reason = "Critical: Your debt burden is high. Focus on becoming debt-free.";
        rank = 'Must do now';
      } else if (g.id === 'house' && profile.familyProfile?.householdType !== 'Single') {
        reason = "A popular goal for families in your income bracket.";
        rank = 'Nice to plan';
      }

      if (g.id === 'debt_free') {
        const totalDebt = (profile.loans || []).reduce((sum, l) => sum + (l.amount || 0), 0);
        return { ...g, baseCost: totalDebt, reason, rank };
      }
      
      return { ...g, reason, rank };
    });

    // Sort by rank priority
    const rankOrder = { 'Must do now': 0, 'Should start soon': 1, 'Nice to plan': 2 };
    results.sort((a: any, b: any) => rankOrder[a.rank as keyof typeof rankOrder] - rankOrder[b.rank as keyof typeof rankOrder]);
  }

  return results;
};

export const calculateHomepageMetrics = (profile: UserProfile) => {
  if (profile.profilingData) {
    const metrics = calculateMetrics(profile.profilingData);
    return {
      totalIncome: metrics.totalIncome,
      totalExpenses: metrics.totalExpenses,
      surplus: metrics.surplus,
      savingsRatio: metrics.savingsRatio,
      totalAssets: metrics.totalAssets,
      totalLiabilities: metrics.totalLiabilities,
      netWorth: metrics.netWorth,
      emiBurden: metrics.emiBurden,
      emergencyMonths: profile.profilingData.survivalMonths || (metrics.totalExpenses > 0 ? metrics.liquidAssets / metrics.totalExpenses : 0),
      creditUtilization: 0
    };
  }

  return {
    totalIncome: profile.income || 0,
    totalExpenses: profile.expenses || 0,
    surplus: (profile.income || 0) - (profile.expenses || 0),
    savingsRatio: profile.savingsRatio || 0,
    totalAssets: profile.netWorth || 0, // Approximation
    totalLiabilities: profile.loans?.reduce((acc, l) => acc + (l.amount || 0), 0) || 0,
    netWorth: profile.netWorth || 0,
    emiBurden: profile.emiBurden || 0,
    emergencyMonths: profile.survivalMonths || 0,
    creditUtilization: 0
  };
};

export const generateAlertsAndActions = (profile: UserProfile) => {
  const metrics = calculateHomepageMetrics(profile);
  const alerts = [];
  const actions = [];

  if (metrics.emergencyMonths < 3) {
    alerts.push({ type: 'warning', text: 'Emergency fund is critically low (under 3 months).' });
    actions.push({ title: 'Build Emergency Fund', description: 'Set up a liquid SIP of ₹5,000/mo', type: 'action' });
  } else if (metrics.emergencyMonths < 6) {
    alerts.push({ type: 'info', text: 'Emergency fund is adequate but could be optimized.' });
  } else {
    alerts.push({ type: 'success', text: 'Emergency fund is healthy (6+ months).' });
  }

  if (metrics.emiBurden > 40) {
    alerts.push({ type: 'warning', text: 'High EMI burden detected (>40% of income).' });
    actions.push({ title: 'Debt Consolidation', description: 'Review high-interest loans to reduce EMI burden.', type: 'action' });
  }

  if (metrics.savingsRatio < 20) {
    alerts.push({ type: 'info', text: 'Savings ratio is below the recommended 20%.' });
    actions.push({ title: 'Optimize Expenses', description: 'Review lifestyle expenses to boost savings.', type: 'action' });
  } else {
    alerts.push({ type: 'success', text: 'Great savings habit! You are saving >20% of your income.' });
  }

  if (actions.length === 0) {
    actions.push({ title: 'Review Portfolio', description: 'Your finances are healthy. Time to optimize for better returns.', type: 'action' });
  }

  return { alerts, actions };
};
