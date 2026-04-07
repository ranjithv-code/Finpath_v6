import { Goal, GoalPlan, GoalInterviewAnswer, UserProfile } from '../types';
import { calculateMetrics } from './profilingLogic';

// 1. Goal-specific interview engine
export const goalQuestionEngine = (category: string, answers: any = {}) => {
  switch (category) {
    case 'education':
      return [
        { id: 'goalName', text: 'What are we planning for?', type: 'text', placeholder: 'e.g. Higher Studies, Schooling' },
        { id: 'student', text: 'Who is this education for?', type: 'select', options: ['Self', 'Child', 'Spouse'] },
        { id: 'sub_type', text: 'Education Type', type: 'select', options: ['India', 'Abroad', 'Executive education', 'Career switch', 'Certification'] },
        { id: 'child_age', text: 'Current age of student', type: 'stepper', min: 0, max: 25, unit: 'years' },
        { id: 'level', text: 'Level of education', type: 'select', options: ['Schooling', 'Undergraduate', 'Postgraduate / MBA', 'PhD'] },
        { id: 'target_year', text: 'Target year for admission', type: 'month-year-picker', placeholder: 'Select Year' },
        { id: 'preference', text: 'Institute Type', type: 'select', options: ['Public / Government', 'Private / Standard', 'Premium / Ivy League'] },
        { id: 'support_level', text: 'Funding Support', type: 'select', options: ['Full Support (100%)', 'Partial Support (50%)', 'Tuition Only'] }
      ];
    case 'travel':
      return [
        { id: 'region', text: 'Where are you thinking of going?', type: 'selectable-cards', options: [
          { label: 'Domestic', value: 'Domestic', icon: '🇮🇳', description: 'Explore the beauty within India.' },
          { label: 'International', value: 'International', icon: '🌏', description: 'Global destinations.' },
          { label: 'Undecided', value: 'Undecided', icon: '❓', description: 'We will help you decide.' }
        ]},
        { id: 'travel_group', text: 'Who are you travelling with?', type: 'select', options: ['Solo', 'Couple', 'Family', 'Friends', 'Work + Leisure'] },
        { id: 'destination', text: 'Any specific destination in mind?', type: 'text', placeholder: 'e.g. Switzerland, Bali, Ladakh' },
        { id: 'accommodation', text: 'Where would you like to stay?', type: 'selectable-cards', options: [
          { label: 'Hostels/Homestays', value: 'Hostels/Homestays', icon: '🎒', description: 'Budget friendly & social.' },
          { label: 'Standard Hotels', value: 'Standard Hotels', icon: '🏨', description: 'Comfortable 3-4 star stays.' },
          { label: 'Boutique Resorts', value: 'Boutique Resorts', icon: '🏡', description: 'Unique & charming experiences.' },
          { label: 'Ultra-Luxury Villas', value: 'Ultra-Luxury Villas', icon: '🏰', description: 'Premium 5-star luxury.' }
        ]},
        { id: 'style', text: 'What kind of trip style?', type: 'select', options: ['relaxing getaway', 'adventure trip', 'family holiday', 'nature break', 'culture + food trip', 'celebration trip', 'quick recharge trip', 'premium leisure trip'] },
        { id: 'duration', text: 'Trip duration', type: 'selectable-cards', options: [
          { label: 'Weekend', value: 'Weekend', icon: '🗓️', description: '2-3 days' },
          { label: '4–6 days', value: '4–6 days', icon: '📅', description: 'Short break' },
          { label: '7–10 days', value: '7–10 days', icon: '🏖️', description: 'Standard holiday' },
          { label: '10–14 days', value: '10–14 days', icon: '✈️', description: 'Extended trip' },
          { label: '2+ weeks', value: '2+ weeks', icon: '🌍', description: 'Long exploration' }
        ]},
        { id: 'adults', text: 'Number of adults', type: 'stepper', min: 1, max: 10, condition: (ans: any) => ans.travel_group === 'Family' || ans.travel_group === 'Friends' || ans.travel_group === 'Work + Leisure' },
        { id: 'kids', text: 'Number of kids', type: 'stepper', min: 0, max: 10, condition: (ans: any) => ans.travel_group === 'Family' },
        { id: 'travellers', text: 'Total travellers', type: 'stepper', min: 1, max: 10, condition: (ans: any) => ans.travel_group !== 'Family' && ans.travel_group !== 'Couple' && ans.travel_group !== 'Solo' },
        { id: 'target_date', text: 'Target month and year', type: 'month-year-picker' },
        { id: 'inclusions', text: 'What should be included?', type: 'multiselect', options: ['travel tickets', 'stay', 'food', 'local transport', 'sightseeing', 'activities', 'shopping buffer', 'visa', 'insurance', 'celebration add-on', 'emergency buffer'] }
      ];
    case 'home':
      return [
        { id: 'sub_type', text: 'Type of home goal', type: 'select', options: ['Buy a new home', 'Build a home', 'Renovate existing home', 'Upgrade interiors', 'Second home / holiday home'] },
        { id: 'city', text: 'Which city?', type: 'text', placeholder: 'e.g. Mumbai, Bangalore' },
        { id: 'target_date', text: 'Target month and year', type: 'month-year-picker' },
        { id: 'budget_range', text: 'Estimated Budget (Today\'s Value)', type: 'number', unit: '₹' },
        { id: 'funding_source', text: 'Funding Source', type: 'select', options: ['Self Funding', 'Home Loan + Savings', 'Family Support'] }
      ];
    case 'luxury':
      const luxuryIdeas = [
        'premium vacation',
        'high-end gadget stack',
        'designer wardrobe',
        'dream car/ bike',
        'luxury watch or jewellery',
        'dream hobby setup',
        'fine-dining/experience pack',
        'home ambience upgrade'
      ];
      
      const subType = answers.sub_type;
      let brandOptions = ['Premium', 'Luxury', 'Ultra-Luxury'];
      if (subType === 'dream car/ bike') {
        brandOptions = ['Premium (Toyota, Honda)', 'Luxury (BMW, Mercedes)', 'Ultra-Luxury (Ferrari, Porsche)'];
      } else if (subType === 'luxury watch or jewellery') {
        brandOptions = ['Premium (Seiko, Tissot)', 'Luxury (Rolex, Omega)', 'Ultra-Luxury (Patek, AP)'];
      } else if (subType === 'high-end gadget stack') {
        brandOptions = ['Premium (Apple, Sony)', 'Luxury (Leica, Bang & Olufsen)'];
      } else if (subType === 'designer wardrobe') {
        brandOptions = ['Premium (Ralph Lauren, Lacoste)', 'Luxury (Gucci, LV)', 'Ultra-Luxury (Hermes, Chanel)'];
      }

      return [
        { id: 'sub_type', text: 'Which luxury upgrade is closest to your heart?', type: 'select', options: luxuryIdeas },
        { id: 'brand_level', text: 'What tier are we looking at?', type: 'select', options: brandOptions },
        { id: 'importance', text: 'How important is this to you?', type: 'select', options: ['Essential Reward', 'Planned Milestone', 'Flexible Want'] },
        { id: 'target_date', text: 'When do you want to achieve this?', type: 'month-year-picker' }
      ];
    case 'family':
      return [
        { id: 'goalName', text: 'What is the family milestone?', type: 'text', placeholder: 'e.g. Dream Wedding' },
        { id: 'sub_type', text: 'Milestone Type', type: 'select', options: ['Wedding', 'Anniversary', 'New Baby', 'Other'] },
        { id: 'target_date', text: 'Target month and year', type: 'month-year-picker' },
        { id: 'scale', text: 'Scale of event', type: 'select', options: ['Intimate', 'Standard', 'Grand'] }
      ];
    case 'wealth':
      return [
        { id: 'goalName', text: 'Wealth Goal Name', type: 'text', placeholder: 'e.g. Retirement Fund, FIRE Corpus' },
        { id: 'objective', text: 'Primary Objective', type: 'select', options: ['Retirement', 'Financial Independence (FIRE)', 'Legacy / Inheritance', 'General Wealth'] },
        { id: 'target_corpus', text: 'Target Corpus (Today\'s Value)', type: 'number', unit: '₹' },
        { id: 'target_year', text: 'Years to target', type: 'stepper', min: 1, max: 40 },
        { id: 'risk_appetite', text: 'Risk Appetite for this goal', type: 'select', options: ['Conservative', 'Moderate', 'Aggressive'] }
      ];
    case 'custom':
      return [
        { 
          id: 'goalName', 
          text: 'What are you dreaming of?', 
          type: 'text', 
          placeholder: 'e.g. Start a side business, Sabbatical',
          options: ['side business', 'sabbatical', 'parent health fund', 'skill upgrade', 'big event', 'other']
        },
        { 
          id: 'timeframe', 
          text: 'Roughly when do you want this?', 
          type: 'select', 
          options: ['within 1 year', '1–3 years', '3–7 years', '7+ years'] 
        },
        { 
          id: 'importance', 
          text: 'How important is this vs other goals?', 
          type: 'select', 
          options: ['essential', 'important', 'nice-to-have'] 
        }
      ];
    case 'debt':
      return [
        { id: 'goalName', text: 'Debt-Free Goal Name', type: 'text', placeholder: 'e.g. Clear Credit Card, Pay off Personal Loan' },
        { id: 'sub_type', text: 'Debt Type', type: 'select', options: ['Credit Card', 'Personal Loan', 'Home Loan', 'Multiple Debts'] },
        { id: 'target_amount', text: 'Total Outstanding Amount', type: 'number', unit: '₹' },
        { id: 'target_year', text: 'Target timeline to be debt-free', type: 'stepper', min: 1, max: 10, unit: 'years' },
        { id: 'interest_rate', text: 'Average Interest Rate (%)', type: 'number', unit: '%' }
      ];
    default:
      return [
        { id: 'goalName', text: 'Goal Name', type: 'text' },
        { id: 'target_amount', text: 'Target amount (Today\'s Value)', type: 'number', unit: '₹' },
        { id: 'target_year', text: 'Target year', type: 'month-year-picker' }
      ];
  }
};

// 2. Smart target estimation
export const goalEstimator = (category: string, answers: GoalInterviewAnswer[]) => {
  const getAnswer = (id: string) => answers.find(a => a.questionId === id)?.answer;
  
  let baseCost = 0;
  let inflationRate = 0.06; 
  let timeline = 5;
  let reason = "Estimated based on industry benchmarks and your preferences.";
  let adjustments: { label: string; amount: number }[] = [];

  switch (category) {
    case 'education':
      const level = getAnswer('level');
      const subType = getAnswer('sub_type');
      const preference = getAnswer('preference');
      
      if (subType === 'Abroad') {
        baseCost = level === 'Postgraduate / MBA' ? 6000000 : 8000000;
        inflationRate = 0.08;
      } else {
        baseCost = level === 'Postgraduate / MBA' ? 2500000 : 1500000;
        inflationRate = 0.10;
      }
      
      if (preference === 'Premium / Ivy League') {
        const adj = baseCost * 0.8;
        baseCost += adj;
        adjustments.push({ label: 'Premium Institute Premium', amount: adj });
      }
      reason = `${subType} ${level} planning.`;
      break;
      
    case 'travel':
      const region = getAnswer('region');
      const travelGroup = getAnswer('travel_group');
      const style = getAnswer('style');
      const durationStr = getAnswer('duration');
      const adults = parseInt(getAnswer('adults')) || (travelGroup === 'Couple' ? 2 : 1);
      const kids = parseInt(getAnswer('kids')) || 0;
      const travellers = travelGroup === 'Family' ? (adults + kids) : (parseInt(getAnswer('travellers')) || adults);
      
      let duration = 5;
      if (durationStr === 'Weekend') duration = 2;
      else if (durationStr === '4–6 days') duration = 5;
      else if (durationStr === '7–10 days') duration = 8;
      else if (durationStr === '10–14 days') duration = 12;
      else if (durationStr === '2+ weeks') duration = 16;

      const perDayPerPerson = region === 'International' ? 18000 : 7000;
      const accommodation = getAnswer('accommodation');
      let multiplier = 1.0;
      if (accommodation === 'Hostels/Homestays') multiplier = 0.6;
      else if (accommodation === 'Standard Hotels') multiplier = 1.2;
      else if (accommodation === 'Boutique Resorts') multiplier = 1.8;
      else if (accommodation === 'Ultra-Luxury Villas') multiplier = 3.5;

      const inclusions = (getAnswer('inclusions') as string[]) || [];
      const inclusionMultiplier = 1 + (inclusions.length * 0.05);

      baseCost = perDayPerPerson * travellers * duration * multiplier * inclusionMultiplier;
      
      // Add flight estimates
      const flightCost = region === 'International' ? 60000 : 10000;
      baseCost += flightCost * travellers;

      if (style?.includes('premium') || style?.includes('celebration')) {
        const adj = baseCost * 0.5;
        baseCost += adj;
        adjustments.push({ label: 'Premium/Celebration Style', amount: adj });
      }
      inflationRate = 0.05;
      reason = `${region} trip for ${travellers} people, ${duration} days.`;
      break;

    case 'home':
      baseCost = parseInt(getAnswer('budget_range')) || 5000000;
      const homeType = getAnswer('sub_type');
      if (homeType?.includes('Renovate') || homeType?.includes('interiors')) {
        baseCost = parseInt(getAnswer('budget_range')) || 1500000;
      }
      inflationRate = 0.07;
      reason = `${homeType} planning.`;
      break;

    case 'luxury':
      const item = getAnswer('sub_type');
      const tier = getAnswer('brand_level');
      
      if (item === 'dream car/ bike') baseCost = 4000000;
      else if (item === 'luxury watch or jewellery') baseCost = 800000;
      else if (item === 'high-end gadget stack') baseCost = 150000;
      else if (item === 'designer wardrobe') baseCost = 300000;
      else if (item === 'premium vacation') baseCost = 500000;
      else if (item === 'dream hobby setup') baseCost = 200000;
      else if (item === 'fine-dining/experience pack') baseCost = 100000;
      else if (item === 'home ambience upgrade') baseCost = 400000;
      else baseCost = 300000;

      if (tier?.includes('Ultra-Luxury')) baseCost *= 3;
      if (tier?.includes('Premium')) baseCost *= 0.5;
      inflationRate = 0.04;
      reason = `${tier} ${item} upgrade.`;
      break;

    case 'family':
      baseCost = 2000000;
      const scale = getAnswer('scale');
      if (scale === 'Grand') baseCost *= 2;
      if (scale === 'Intimate') baseCost *= 0.5;
      inflationRate = 0.07;
      reason = `${scale} family milestone.`;
      break;

    case 'wealth':
      baseCost = parseInt(getAnswer('target_corpus')) || 50000000;
      inflationRate = 0.06;
      reason = `Wealth creation for ${getAnswer('objective')}.`;
      break;

    case 'custom':
      const customType = getAnswer('goalName');
      const timeframe = getAnswer('timeframe');
      
      // Suggest base cost based on type
      if (customType === 'side business') baseCost = 500000;
      else if (customType === 'sabbatical') baseCost = 1000000;
      else if (customType === 'parent health fund') baseCost = 2000000;
      else if (customType === 'skill upgrade') baseCost = 200000;
      else if (customType === 'big event') baseCost = 500000;
      else baseCost = 500000;

      // Suggest timeline based on timeframe
      if (timeframe === 'within 1 year') timeline = 1;
      else if (timeframe === '1–3 years') timeline = 2;
      else if (timeframe === '3–7 years') timeline = 5;
      else if (timeframe === '7+ years') timeline = 10;
      else timeline = 3;

      inflationRate = 0.06;
      reason = `Custom goal: ${customType}. Estimated timeline: ${timeframe}.`;
      break;

    case 'debt':
      baseCost = parseInt(getAnswer('target_amount')) || 0;
      timeline = parseInt(getAnswer('target_year')) || 2;
      inflationRate = 0; 
      const avgRate = (parseInt(getAnswer('interest_rate')) || 15) / 100;
      const estimatedTotal = baseCost * (1 + (avgRate * timeline / 2)); 
      baseCost = estimatedTotal;
      reason = `Debt-free planning for ${getAnswer('sub_type')}.`;
      break;

    default:
      baseCost = parseInt(getAnswer('target_amount')) || 100000;
      break;
  }

  const targetDateStr = getAnswer('target_date') || getAnswer('target_year');
  if (targetDateStr && category !== 'custom') {
    const currentYear = new Date().getFullYear();
    const yearMatch = targetDateStr.toString().match(/\d{4}/);
    if (yearMatch) {
      const targetYear = parseInt(yearMatch[0]);
      timeline = targetYear - currentYear;
    } else {
      timeline = parseInt(targetDateStr) || 5;
    }
  }
  
  if (timeline <= 0) timeline = 1;

  const futureCost = baseCost * Math.pow(1 + inflationRate, timeline);
  const inflationAdjustment = futureCost - baseCost;

  return {
    conservative: futureCost * 0.9,
    balanced: futureCost,
    premium: futureCost * 1.2,
    inflationRate,
    reason,
    todayCost: baseCost,
    futureCost,
    years: timeline,
    breakdown: {
      base: baseCost,
      adjustments,
      inflation: inflationAdjustment,
      total: futureCost
    }
  };
};

// 3. Inflation adjuster
export const inflationAdjuster = (amount: number, years: number, rate: number) => {
  return amount * Math.pow(1 + rate, years);
};

// 4. Feasibility analysis
export const feasibilityAnalyzer = (profile: UserProfile, goalAmount: number, years: number, category?: string) => {
  const metrics = calculateMetrics(profile.profilingData || {
    incomeSources: [{ amount: profile.income }],
    expenses: { lifestyle: { amount: profile.expenses } }
  });
  
  const monthlySurplus = metrics.surplus;
  const liquidAssets = metrics.liquidAssets;
  
  // Option to allocate up to 50% of liquid assets to this goal
  const allocableAssets = liquidAssets * 0.5;
  const fundingGap = Math.max(0, goalAmount - allocableAssets);
  const monthlyNeeded = fundingGap / (years * 12);
  
  const emergencyFundHealthy = metrics.emergencyReadinessScore >= 80;
  const debtBurdenHigh = metrics.emiBurden > 40;
  
  let status: 'High' | 'Moderate' | 'Low' | 'Stretched' = 'Moderate';
  let recommendations: string[] = [];
  let difficulty: 'Easy' | 'Moderate' | 'Hard' | 'Extreme' = 'Moderate';

  const ratio = monthlyNeeded / (monthlySurplus || 1);

  if (category === 'luxury') {
    if (ratio > 1.0) {
      status = 'Stretched';
      difficulty = 'Extreme';
      recommendations.push('This luxury upgrade is currently unrealistic given your surplus. Consider a longer timeline or a lower tier.');
    } else if (ratio > 0.5) {
      status = 'Low';
      difficulty = 'Hard';
      recommendations.push('This is a stretch goal. It will require significant discipline.');
    } else if (ratio < 0.2) {
      status = 'High';
      difficulty = 'Easy';
      recommendations.push('Easily fundable! This fits comfortably within your money profile.');
    } else {
      status = 'Moderate';
      difficulty = 'Moderate';
      recommendations.push('Achievable luxury upgrade with consistent saving.');
    }
  } else {
    if (ratio > 1.2) {
      status = 'Stretched';
      difficulty = 'Extreme';
      recommendations.push('Monthly savings needed exceeds your current surplus. Consider extending the timeline.');
    } else if (ratio > 0.8) {
      status = 'Low';
      difficulty = 'Hard';
      recommendations.push('This goal will consume almost all of your monthly surplus.');
    } else if (ratio < 0.4) {
      status = 'High';
      difficulty = 'Easy';
      recommendations.push('Highly achievable with your current financial profile.');
    } else {
      status = 'Moderate';
      difficulty = 'Moderate';
      recommendations.push('Achievable with disciplined savings.');
    }
  }

  if (!emergencyFundHealthy) {
    recommendations.push('Priority: Build your 6-month emergency cushion first.');
  }
  if (debtBurdenHigh) {
    recommendations.push('Warning: Your debt burden is high. Consider debt consolidation.');
  }

  return { 
    status, 
    difficulty,
    recommendations, 
    monthlyNeeded, 
    monthlySurplus,
    allocableAssets,
    fundingGap,
    readinessScore: Math.max(0, Math.min(100, (1 - ratio) * 100)),
    metrics: {
      surplus: monthlySurplus,
      needed: monthlyNeeded,
      gap: Math.max(0, monthlyNeeded - monthlySurplus),
      liquidAssets,
      allocableAssets
    }
  };
};

// 5. Expense cut analyzer
export const expenseCutAnalyzer = (profile: UserProfile) => {
  const categories = [
    { name: 'Mandatory', amount: profile.expenses * 0.45, type: 'mandatory', icon: '🛡️', suggestions: ['Refinance high-interest loans', 'Check insurance premiums'] },
    { name: 'Essential', amount: profile.expenses * 0.30, type: 'essential', icon: '🏠', suggestions: ['Optimize utility bills', 'Switch to bulk grocery shopping'] },
    { name: 'Flexible', amount: profile.expenses * 0.15, type: 'flexible', icon: '🍿', suggestions: ['Reduce dining out by 20%', 'Audit unused subscriptions'] },
    { name: 'Leaks', amount: profile.expenses * 0.10, type: 'leaks', icon: '💧', suggestions: ['Avoid impulse digital purchases', 'Track small daily cash spends'] }
  ];

  return categories;
};

// 6. Plan generator
export const planGenerator = (targetAmount: number, years: number, profile: UserProfile, category?: string): any[] => {
  const calculateSIP = (target: number, y: number, rate: number) => {
    const r = rate / 12 / 100;
    const n = y * 12;
    if (r === 0) return target / n;
    return (target * r) / (Math.pow(1 + r, n) - 1);
  };

  const riskProfile = profile.riskProfile || 'MEDIUM';

  if (category === 'debt') {
    return [
      {
        id: 'snowball',
        type: 'Snowball Strategy',
        name: 'Small Wins Path',
        riskLabel: 'Psychological Win',
        goalFit: 'High Motivation',
        expectedUseCase: 'Multiple small debts.',
        whyMatches: 'Paying off smallest debts first gives you the momentum to tackle larger ones.',
        whyNotSuit: 'May cost slightly more in interest over time.',
        targetAmount,
        years,
        monthlySIP: targetAmount / (years * 12),
        oneTimeAmount: 0,
        assetAllocation: '100% Debt Repayment',
        riskNote: 'Focus on behavior over math.',
        milestoneSummary: 'Clear small debts first for quick wins.',
        feasibilityStatus: 'High',
        expectedReturn: 0,
        investments: [
          { name: 'Smallest Debt First', purpose: 'Momentum', role: 'Repay', risk: 'None', liquidity: 'N/A', returns: 'N/A', horizon: 'Immediate', suitability: 'Best for motivation.', caution: 'Ignore interest rates for now.' },
          { name: 'Minimum Payments', purpose: 'Stay Current', role: 'Maintain', risk: 'None', liquidity: 'N/A', returns: 'N/A', horizon: 'Ongoing', suitability: 'Essential for all other debts.', caution: 'Avoid late fees.' }
        ]
      },
      {
        id: 'avalanche',
        type: 'Avalanche Strategy',
        name: 'Interest-Saving Path',
        riskLabel: 'Mathematical Win',
        goalFit: 'Maximum Efficiency',
        expectedUseCase: 'High-interest credit card debt.',
        whyMatches: 'Paying off highest interest rates first saves you the most money in the long run.',
        whyNotSuit: 'May take longer to see the first debt disappear.',
        targetAmount,
        years,
        monthlySIP: targetAmount / (years * 12),
        oneTimeAmount: 0,
        assetAllocation: '100% Debt Repayment',
        riskNote: 'Focus on math over behavior.',
        milestoneSummary: 'Save the most on interest.',
        feasibilityStatus: 'Moderate',
        expectedReturn: 0,
        investments: [
          { name: 'Highest Interest First', purpose: 'Save Money', role: 'Repay', risk: 'None', liquidity: 'N/A', returns: 'N/A', horizon: 'Immediate', suitability: 'Best for efficiency.', caution: 'Requires discipline.' },
          { name: 'Minimum Payments', purpose: 'Stay Current', role: 'Maintain', risk: 'None', liquidity: 'N/A', returns: 'N/A', horizon: 'Ongoing', suitability: 'Essential for all other debts.', caution: 'Avoid late fees.' }
        ]
      }
    ];
  }

  const strategies = [
    {
      id: 'safe',
      type: 'Safer Strategy',
      name: 'Conservative Goal-Protection Path',
      riskLabel: 'Low Risk',
      goalFit: 'High Certainty',
      expectedUseCase: 'Short-term goals or capital preservation.',
      whyMatches: 'Prioritizes safety over high returns, ensuring your goal is met regardless of market swings.',
      whyNotSuit: 'May not beat inflation significantly in the long run.',
      targetAmount,
      years,
      monthlySIP: calculateSIP(targetAmount, years, 7.5),
      oneTimeAmount: 0,
      assetAllocation: '70% Debt / FDs, 20% Index Funds, 10% Gold',
      riskNote: 'Low volatility. Capital protection is priority.',
      milestoneSummary: 'Slow, steady, and guaranteed path.',
      feasibilityStatus: 'High',
      expectedReturn: 7.5,
      investments: [
        { name: 'Savings Account', purpose: 'Immediate liquidity', role: 'Preserve', risk: 'Very Low', liquidity: 'Instant', returns: '3-4%', horizon: '0-1 year', suitability: 'Ideal for emergency funds.', caution: 'Inflation will eat into value.' },
        { name: 'Liquid Mutual Funds', purpose: 'Better than savings a/c', role: 'Preserve', risk: 'Low', liquidity: 'High (T+1)', returns: '6-7%', horizon: '1-6 months', suitability: 'For very short term goals.', caution: 'Not guaranteed like FDs.' },
        { name: 'Short-term FD (6-12m)', purpose: 'Guaranteed returns', role: 'Preserve', risk: 'Low', liquidity: 'Moderate', returns: '7-7.5%', horizon: '6-12 months', suitability: 'Safe for fixed timelines.', caution: 'Premature withdrawal penalty.' },
        { name: 'Corporate Bonds (AAA)', purpose: 'Higher yield debt', role: 'Income', risk: 'Low-Moderate', liquidity: 'Moderate', returns: '8-9%', horizon: '1-3 years', suitability: 'For slightly better returns than FDs.', caution: 'Credit risk of the issuer.' }
      ]
    },
    {
      id: 'balanced',
      type: 'Balanced Strategy',
      name: 'Hybrid Growth Path',
      riskLabel: 'Moderate Risk',
      goalFit: 'Optimal Efficiency',
      expectedUseCase: 'Medium to long-term goals like education or home.',
      whyMatches: 'Balances growth and stability by diversifying across equity and debt.',
      whyNotSuit: 'Can experience moderate short-term fluctuations.',
      targetAmount,
      years,
      monthlySIP: calculateSIP(targetAmount, years, 11.5),
      oneTimeAmount: 0,
      assetAllocation: '50% Equity, 30% Debt, 15% Gold, 5% REITs',
      riskNote: 'Moderate risk. Optimized for inflation-beating growth.',
      milestoneSummary: 'The most efficient path for long-term goals.',
      feasibilityStatus: 'Moderate',
      expectedReturn: 11.5,
      investments: [
        { name: 'Aggressive Hybrid Funds', purpose: 'Equity growth + Debt cushion', role: 'Growth', risk: 'Moderate-High', liquidity: 'High', returns: '12-14%', horizon: '3-5 years', suitability: 'Perfect for medium-term goals.', caution: 'Market linked volatility.' },
        { name: 'Dynamic Bond Funds', purpose: 'Interest rate play', role: 'Income', risk: 'Moderate', liquidity: 'High', returns: '8-10%', horizon: '3+ years', suitability: 'Managed debt exposure.', caution: 'Requires long holding period.' },
        { name: 'Sovereign Gold Bonds', purpose: 'Gold + 2.5% Interest', role: 'Hedge', risk: 'Low (Govt)', liquidity: 'Low (8y lock-in)', returns: '10-12% (incl. price)', horizon: '8 years', suitability: 'Best way to own gold.', caution: 'Long lock-in period.' },
        { name: 'REITs (Real Estate)', purpose: 'Rental income + Appreciation', role: 'Income/Growth', risk: 'Moderate-High', liquidity: 'Moderate', returns: '9-12%', horizon: '5+ years', suitability: 'Exposure to commercial property.', caution: 'Real estate market cycles.' }
      ]
    },
    {
      id: 'fast',
      type: 'Fastest Strategy',
      name: 'Flexi-Cap Growth Path',
      riskLabel: 'High Risk',
      goalFit: 'Maximum Velocity',
      expectedUseCase: 'Long-term wealth creation or early retirement.',
      whyMatches: 'Aggressive allocation to reach your target with a lower monthly commitment.',
      whyNotSuit: 'High volatility; not suitable if you need the money in 1-2 years.',
      targetAmount,
      years,
      monthlySIP: calculateSIP(targetAmount, years, 15),
      oneTimeAmount: 0,
      assetAllocation: '70% Mid/Small Cap, 20% International, 10% Crypto/Alts',
      riskNote: 'High growth potential with high short-term volatility.',
      milestoneSummary: 'Aggressive strategy to reach target with lower SIP.',
      feasibilityStatus: 'Low',
      expectedReturn: 15,
      investments: [
        { name: 'Small Cap Mutual Funds', purpose: 'High alpha generation', role: 'Growth', risk: 'Very High', liquidity: 'High', returns: '15-18%', horizon: '7-10+ years', suitability: 'Wealth compounding.', caution: 'Can drop 40-50% in a crash.' },
        { name: 'US Tech Index Funds', purpose: 'Global innovation play', role: 'Growth', risk: 'High', liquidity: 'High', returns: '13-15%', horizon: '5+ years', suitability: 'USD hedge + global growth.', caution: 'Currency & regulatory risks.' },
        { name: 'Crypto (BTC/ETH)', purpose: 'Asymmetric returns', role: 'Speculative', risk: 'Extreme', liquidity: 'Instant', returns: 'Highly Volatile', horizon: '5+ years', suitability: 'Small allocation for moonshot.', caution: 'Can go to zero. High regulation risk.' },
        { name: 'Venture Debt / P2P', purpose: 'Alternative fixed income', role: 'Income', risk: 'High', liquidity: 'Low', returns: '12-14%', horizon: '1-3 years', suitability: 'Diversifying debt portfolio.', caution: 'High default risk.' }
      ]
    }
  ];

  // Add alternative/cautionary options for comparison
  const alternatives = [
    { name: 'Physical Real Estate', purpose: 'Tangible asset', role: 'Growth', risk: 'Moderate-High', liquidity: 'Very Low', returns: '8-10%', horizon: '10+ years', suitability: 'For large corpus goals.', caution: 'High entry cost, illiquid.' },
    { name: 'Direct Equity (Stocks)', purpose: 'Customized growth', role: 'Growth', risk: 'High', liquidity: 'High', returns: 'Varies', horizon: '5+ years', suitability: 'For active investors.', caution: 'Requires time and expertise.' },
    { name: 'Futures & Options', purpose: 'Speculation', role: 'Speculative', risk: 'Extreme', liquidity: 'Instant', returns: 'Unpredictable', horizon: 'Short', suitability: 'NOT for goals.', caution: '90% of retail traders lose money.' }
  ];

  // Determine "Best Fit" based on risk profile and years
  let bestFitId = 'balanced';
  if (years < 3) bestFitId = 'safe';
  else if (years > 7 && riskProfile === 'HIGH') bestFitId = 'fast';
  else if (riskProfile === 'LOW') bestFitId = 'safe';

  return strategies.map(s => ({
    ...s,
    isBestFit: s.id === bestFitId,
    alternatives: alternatives // Provide alternatives for comparison
  }));
};

// 7. Mutual Fund Drill-down Data
export const getMutualFundSubOptions = () => {
  return [
    {
      id: 'liquid',
      name: 'Liquid Style',
      description: 'Invests in very short-term debt instruments.',
      suitable: 'Parking surplus cash for a few days to months.',
      notSuitable: 'Long-term wealth creation.',
      whyFit: 'Provides instant liquidity for immediate goal needs.',
      risk: 'Very Low',
      liquidity: 'Instant (T+1)'
    },
    {
      id: 'short',
      name: 'Short Duration Style',
      description: 'Invests in debt with 1-3 year maturity.',
      suitable: 'Goals 1-3 years away.',
      notSuitable: 'Very long-term goals where equity beats it.',
      whyFit: 'Better returns than savings/FDs with low risk.',
      risk: 'Low',
      liquidity: 'High (T+2)'
    },
    {
      id: 'target',
      name: 'Target Maturity Style',
      description: 'Passive debt funds with a fixed maturity date.',
      suitable: 'Matching goal timeline exactly.',
      notSuitable: 'If you need money before the maturity date.',
      whyFit: 'Locks in current yields for your specific goal date.',
      risk: 'Low-Moderate',
      liquidity: 'Moderate'
    },
    {
      id: 'hybrid',
      name: 'Hybrid Style',
      description: 'Mix of equity and debt in one fund.',
      suitable: 'Medium-term goals (3-5 years).',
      notSuitable: 'Very aggressive or very conservative investors.',
      whyFit: 'Automatic rebalancing between growth and safety.',
      risk: 'Moderate',
      liquidity: 'High'
    },
    {
      id: 'index',
      name: 'Index Style',
      description: 'Tracks a market index like Nifty 50.',
      suitable: 'Long-term goals with low cost.',
      notSuitable: 'Seeking to outperform the market.',
      whyFit: 'Captures broad market growth at minimal cost.',
      risk: 'High',
      liquidity: 'High'
    },
    {
      id: 'flexi',
      name: 'Flexi-Cap Style',
      description: 'Invests across large, mid, and small-cap stocks.',
      suitable: 'Long-term goals (7+ years).',
      notSuitable: 'Short-term goals (less than 5 years).',
      whyFit: 'Dynamic allocation to the best-performing sectors.',
      risk: 'Very High',
      liquidity: 'High'
    },
    {
      id: 'international',
      name: 'International Style',
      description: 'Invests in foreign stocks (e.g., US Tech).',
      suitable: 'Diversification and currency hedging.',
      notSuitable: 'Conservative investors or short-term needs.',
      whyFit: 'Exposure to global giants and USD appreciation.',
      risk: 'Very High',
      liquidity: 'Moderate'
    }
  ];
};

// 7. Rule of 72 helper
export const rule72Helper = () => {
  return [
    { rate: 6, years: 12, asset: 'Savings A/C' },
    { rate: 8, years: 9, asset: 'Fixed Deposits' },
    { rate: 10, years: 7.2, asset: 'Balanced Funds' },
    { rate: 12, years: 6, asset: 'Equity Funds' }
  ];
};

// 8. Goal card builder
export const goalCardBuilder = (goal: Goal) => {
  const target = goal.target || 1; // Prevent division by zero
  const progress = (goal.current / target) * 100;
  return {
    ...goal,
    progress,
    status: goal.current >= goal.target ? 'COMPLETED' : 'ACTIVE',
    readiness: Math.min(100, Math.round(progress * 1.2)), // Gamified readiness
    milestones: [
      { name: 'Started', completed: true },
      { name: '10% Reached', completed: progress >= 10 },
      { name: 'Halfway', completed: progress >= 50 },
      { name: 'Final Stretch', completed: progress >= 90 },
      { name: 'Goal Achieved', completed: progress >= 100 }
    ]
  };
};
