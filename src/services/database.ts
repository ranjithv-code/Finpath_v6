import { supabase } from '../lib/supabase';
import { 
  UserProfile, 
  Goal, 
  Loan, 
  FamilyProfile, 
  SupportTicket, 
  SplitGroup, 
  SplitMember, 
  SplitExpense, 
  SplitSettlement,
  MiniGoal,
  InvestmentInstrument,
  RecurringExpense,
  Achievement,
  Referral
} from '../types';

export const databaseService = {
  // Profiles
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async updateProfile(userId: string, profile: Partial<UserProfile>) {
    const updateData: any = { user_id: userId };
    if (profile.name) updateData.full_name = profile.name;
    if (profile.email) updateData.email = profile.email;
    if (profile.city) updateData.city = profile.city;
    if (profile.onboarded !== undefined) updateData.onboarding_completed = profile.onboarded;
    if (profile.persona) updateData.persona = profile.persona;
    if (profile.financialHealthScore !== undefined) updateData.financial_health_score = profile.financialHealthScore;
    if (profile.emergencyScore !== undefined) updateData.emergency_score = profile.emergencyScore;
    if (profile.income !== undefined) updateData.total_income = profile.income;
    if (profile.expenses !== undefined) updateData.total_expenses = profile.expenses;
    if (profile.netWorth !== undefined) updateData.net_worth = profile.netWorth;
    if (profile.savingsRatio !== undefined) updateData.savings_ratio = profile.savingsRatio;
    if (profile.emiBurden !== undefined) updateData.emi_burden = profile.emiBurden;

    if (profile.profilingData) {
      const pd = profile.profilingData;
      if (pd.demographics) {
        if (pd.demographics.currentCity) updateData.current_city = pd.demographics.currentCity;
        if (pd.demographics.permanentCity) updateData.permanent_city = pd.demographics.permanentCity;
        if (pd.demographics.age) updateData.age = parseInt(pd.demographics.age);
        if (pd.demographics.experience) updateData.work_experience = parseInt(pd.demographics.experience);
        if (pd.demographics.maritalStatus) updateData.marital_status = pd.demographics.maritalStatus;
        if (pd.demographics.familyStructure) updateData.family_structure = pd.demographics.familyStructure;
        if (pd.demographics.supportsParents) updateData.supports_parents = pd.demographics.supportsParents;
        if (pd.demographics.profession) updateData.profession = pd.demographics.profession;
        if (pd.demographics.employmentType) updateData.employment_type = pd.demographics.employmentType;
      }
      if (pd.incomeSources) updateData.income_sources = pd.incomeSources;
      if (pd.expenses) updateData.expenses_breakdown = pd.expenses;
      if (pd.capturedAssets) updateData.assets_breakdown = pd.capturedAssets;
      if (pd.capturedLiabilities) updateData.liabilities_breakdown = pd.capturedLiabilities;
      if (pd.capturedInsurance) updateData.insurance_breakdown = pd.capturedInsurance;
      
      updateData.profiling_data = pd;
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert(updateData, { onConflict: 'user_id' });
    
    if (error) throw error;
    return data;
  },

  // Family Profiles
  async getFamilyProfile(userId: string) {
    const { data, error } = await supabase
      .from('family_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async upsertFamilyProfile(userId: string, familyProfile: FamilyProfile) {
    const { data, error } = await supabase
      .from('family_profiles')
      .upsert({
        user_id: userId,
        family_type: familyProfile.householdType,
        spouse_status: familyProfile.spouseStatus,
        dependents_count: familyProfile.dependentsCount,
        earning_members_count: familyProfile.earningMembersCount,
        monthly_household_income: familyProfile.householdMonthlyIncome,
        monthly_household_expenses: familyProfile.householdMonthlyExpenses,
        emergency_fund_months: familyProfile.emergencyFundMonths,
        key_notes: familyProfile.keyFamilyGoals.join(', '),
      });
    
    if (error) throw error;
    return data;
  },

  // Goals
  async getGoals(userId: string) {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false);
    
    if (error) throw error;
    return data;
  },

  async createGoal(userId: string, goal: Goal) {
    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id: userId,
        name: goal.name,
        category: goal.category,
        target_amount: goal.target,
        current_amount: goal.current,
        target_year: new Date().getFullYear() + goal.timeline,
        priority: goal.priority,
        status: goal.status?.toLowerCase() || 'active',
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateGoal(goalId: string, goal: Partial<Goal>) {
    const updateData: any = {};
    if (goal.name) updateData.name = goal.name;
    if (goal.target !== undefined) updateData.target_amount = goal.target;
    if (goal.current !== undefined) updateData.current_amount = goal.current;
    if (goal.status) updateData.status = goal.status.toLowerCase();
    
    const { data, error } = await supabase
      .from('goals')
      .update(updateData)
      .eq('id', goalId);
    
    if (error) throw error;
    return data;
  },

  // Liabilities / Loans
  async getLiabilities(userId: string) {
    const { data, error } = await supabase
      .from('liabilities')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data;
  },

  async createLiability(userId: string, loan: Loan) {
    const { data, error } = await supabase
      .from('liabilities')
      .insert({
        user_id: userId,
        liability_type: loan.type,
        outstanding_amount: loan.amount,
        emi_amount: loan.emi,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Cashflow
  async getCashflowEntries(userId: string) {
    const { data, error } = await supabase
      .from('cashflow_entries')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data;
  },

  // Split Groups
  async getSplitGroups(userId: string) {
    const { data, error } = await supabase
      .from('split_groups')
      .select(`
        *,
        members:split_group_members(*),
        expenses:split_expenses(*),
        settlements:split_settlements(*)
      `)
      .eq('user_id', userId);
    
    if (error) throw error;
    return data;
  },

  async createSplitGroup(userId: string, group: Partial<SplitGroup>) {
    const { data, error } = await supabase
      .from('split_groups')
      .insert({
        user_id: userId,
        name: group.name,
        category: group.category,
        total_balance: group.totalBalance || 0,
      })
      .select()
      .single();
    
    if (error) throw error;

    // Add initial members if any
    if (group.members && group.members.length > 0) {
      const membersToInsert = group.members.map(m => ({
        group_id: data.id,
        name: m.name,
        email: m.email,
        is_user: m.isUser || false,
      }));
      await supabase.from('split_group_members').insert(membersToInsert);
    }

    return data;
  },

  async addMemberToGroup(groupId: string, member: Partial<SplitMember>) {
    const { data, error } = await supabase
      .from('split_group_members')
      .insert({
        group_id: groupId,
        name: member.name,
        email: member.email,
        is_user: member.isUser || false,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async addExpenseToGroup(groupId: string, expense: Partial<SplitExpense>) {
    const { data, error } = await supabase
      .from('split_expenses')
      .insert({
        group_id: groupId,
        description: expense.description,
        amount: expense.amount,
        paid_by_id: expense.paidById,
        split_type: expense.splitType?.toLowerCase() || 'equal',
        date: expense.date || new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) throw error;

    // Add shares
    if (expense.splits && expense.splits.length > 0) {
      const sharesToInsert = expense.splits.map(s => ({
        expense_id: data.id,
        member_id: s.memberId,
        share_amount: s.amount,
      }));
      await supabase.from('split_expense_shares').insert(sharesToInsert);
    }

    return data;
  },

  async addSettlementToGroup(groupId: string, settlement: Partial<SplitSettlement>) {
    const { data, error } = await supabase
      .from('split_settlements')
      .insert({
        group_id: groupId,
        from_member_id: settlement.fromMemberId,
        to_member_id: settlement.toMemberId,
        amount: settlement.amount,
        date: settlement.date || new Date().toISOString(),
        note: settlement.note,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Investment Instruments
  async getInstruments(userId: string) {
    const { data, error } = await supabase
      .from('investment_instruments')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data;
  },

  async upsertInstruments(userId: string, instruments: InvestmentInstrument[]) {
    // For simplicity, we'll delete and re-insert for now, or use upsert if IDs are stable
    // Better approach: upsert with user_id and instrument_id
    const instrumentsToInsert = instruments.map(inst => ({
      user_id: userId,
      name: inst.name,
      instrument_type: inst.type,
      start_date: inst.startDate,
      contribution_type: inst.contributionType,
      monthly_contribution: inst.monthlyContribution,
      invested_amount: inst.investedAmount,
      current_value: inst.currentValue,
      note: inst.note,
      linked_goals: JSON.stringify(inst.linkedGoals),
    }));

    const { data, error } = await supabase
      .from('investment_instruments')
      .upsert(instrumentsToInsert, { onConflict: 'id' }); // Assuming 'id' is the PK and stable
    
    if (error) throw error;
    return data;
  },

  // Recurring Expenses
  async getRecurringExpenses(userId: string) {
    const { data, error } = await supabase
      .from('recurring_expenses')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data;
  },

  async upsertRecurringExpenses(userId: string, expenses: RecurringExpense[]) {
    const expensesToInsert = expenses.map(exp => ({
      user_id: userId,
      name: exp.name,
      amount: exp.amount,
      category: exp.category,
      due_date: exp.dueDate,
      is_auto_deduct: exp.isAutoDeduct,
      has_reminder: exp.hasReminder,
    }));

    const { data, error } = await supabase
      .from('recurring_expenses')
      .upsert(expensesToInsert, { onConflict: 'id' });
    
    if (error) throw error;
    return data;
  },

  // Referrals
  async getReferrals(userId: string) {
    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data;
  },

  // Achievements
  async getAchievements(userId: string) {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data;
  },

  async upsertAchievements(userId: string, achievements: Achievement[]) {
    const achievementsToInsert = achievements.map(ach => ({
      user_id: userId,
      achievement_id: ach.id,
      title: ach.title,
      description: ach.description,
      icon: ach.icon,
      unlocked: ach.unlocked,
    }));

    const { data, error } = await supabase
      .from('achievements')
      .upsert(achievementsToInsert, { onConflict: 'user_id, achievement_id' });
    
    if (error) throw error;
    return data;
  },

  // Support
  async createSupportTicket(userId: string, ticket: Partial<SupportTicket>) {
    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: userId,
        category: ticket.category,
        title: ticket.title,
        description: ticket.description,
        contact_email: ticket.email,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getSupportTickets(userId: string) {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data;
  },

  // Mini Goals
  async getMiniGoals(userId: string) {
    const { data, error } = await supabase
      .from('mini_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false);
    
    if (error) throw error;
    return data;
  },

  async createMiniGoal(userId: string, goal: MiniGoal) {
    const { data, error } = await supabase
      .from('mini_goals')
      .insert({
        user_id: userId,
        name: goal.name,
        target_amount: goal.targetAmount,
        current_amount: goal.currentAmount || 0,
        timeline_months: goal.timelineMonths,
        category: goal.category,
        status: goal.status?.toLowerCase() || 'active',
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateMiniGoal(goalId: string, goal: Partial<MiniGoal>) {
    const updateData: any = {};
    if (goal.name) updateData.name = goal.name;
    if (goal.targetAmount !== undefined) updateData.target_amount = goal.targetAmount;
    if (goal.currentAmount !== undefined) updateData.current_amount = goal.currentAmount;
    if (goal.status) updateData.status = goal.status.toLowerCase();
    if (goal.isArchived !== undefined) updateData.is_archived = goal.isArchived;
    
    const { data, error } = await supabase
      .from('mini_goals')
      .update(updateData)
      .eq('id', goalId);
    
    if (error) throw error;
    return data;
  },

  async deleteMiniGoal(goalId: string, reason: string, note: string) {
    const { data, error } = await supabase
      .from('mini_goals')
      .update({
        is_archived: true,
        delete_reason: reason,
        delete_note: note,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', goalId);
    
    if (error) throw error;
    return data;
  },
  async getLearnTopics() {
    const { data, error } = await supabase
      .from('learn_topics')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async updateLearnProgress(userId: string, topicId: string, status: string) {
    const { data, error } = await supabase
      .from('learn_progress')
      .upsert({
        user_id: userId,
        topic_id: topicId,
        status: status,
        completed_at: status === 'completed' ? new Date().toISOString() : null,
      });
    
    if (error) throw error;
    return data;
  }
};
