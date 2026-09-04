export const STUDENT_CATEGORIES = [
  // Education
  { id: 'tuition', name: 'Tuition', group: 'Education', icon: 'GraduationCap', color: '#3b82f6' },
  { id: 'course_fees', name: 'Course fees', group: 'Education', icon: 'BookOpen', color: '#2563eb' },
  { id: 'books', name: 'Books', group: 'Education', icon: 'Book', color: '#1d4ed8' },
  { id: 'stationery', name: 'Stationery', group: 'Education', icon: 'PenTool', color: '#60a5fa' },
  { id: 'printing', name: 'Printing', group: 'Education', icon: 'Printer', color: '#93c5fd' },
  { id: 'software', name: 'Software', group: 'Education', icon: 'Code', color: '#38bdf8' },
  { id: 'online_courses', name: 'Online courses', group: 'Education', icon: 'Laptop', color: '#0284c7' },
  { id: 'certifications', name: 'Certifications', group: 'Education', icon: 'Award', color: '#0369a1' },

  // Daily Life
  { id: 'food', name: 'Food & Dining', group: 'Daily Life', icon: 'Utensils', color: '#f59e0b' },
  { id: 'transport', name: 'Transport', group: 'Daily Life', icon: 'Bus', color: '#10b981' },
  { id: 'mobile', name: 'Mobile', group: 'Daily Life', icon: 'Smartphone', color: '#8b5cf6' },
  { id: 'internet', name: 'Internet', group: 'Daily Life', icon: 'Wifi', color: '#6366f1' },
  { id: 'personal_care', name: 'Personal care', group: 'Daily Life', icon: 'Heart', color: '#ec4899' },
  { id: 'shopping', name: 'Shopping', group: 'Daily Life', icon: 'ShoppingBag', color: '#f43f5e' },

  // University
  { id: 'campus_expenses', name: 'Campus expenses', group: 'University', icon: 'Building', color: '#14b8a6' },
  { id: 'projects', name: 'Projects', group: 'University', icon: 'FolderKanban', color: '#06b6d4' },
  { id: 'events', name: 'Events', group: 'University', icon: 'Calendar', color: '#a855f7' },
  { id: 'clubs', name: 'Clubs & Societies', group: 'University', icon: 'Users', color: '#d946ef' },

  // Entertainment
  { id: 'movies', name: 'Movies', group: 'Entertainment', icon: 'Film', color: '#e11d48' },
  { id: 'gaming', name: 'Gaming', group: 'Entertainment', icon: 'Gamepad2', color: '#8257e5' },
  { id: 'streaming', name: 'Streaming', group: 'Entertainment', icon: 'Tv', color: '#e11d48' },
  { id: 'music', name: 'Music', group: 'Entertainment', icon: 'Music', color: '#10b981' },
  { id: 'social', name: 'Social activities', group: 'Entertainment', icon: 'Coffee', color: '#f97316' },

  // Other
  { id: 'medical', name: 'Medical', group: 'Other', icon: 'Activity', color: '#ef4444' },
  { id: 'travel', name: 'Travel', group: 'Other', icon: 'Plane', color: '#0ea5e9' },
  { id: 'gifts', name: 'Gifts', group: 'Other', icon: 'Gift', color: '#f472b6' },
  { id: 'emergency', name: 'Emergency', group: 'Other', icon: 'ShieldAlert', color: '#dc2626' },
  { id: 'miscellaneous', name: 'Miscellaneous', group: 'Other', icon: 'MoreHorizontal', color: '#64748b' },
];

export const DEFAULT_ACCOUNTS = [
  { id: 'cash_1', name: 'Cash Wallet', type: 'Cash', balance: 4500, currency: 'Rs.' },
  { id: 'bank_1', name: 'Commercial Bank', type: 'Bank account', balance: 28500, currency: 'Rs.' },
  { id: 'savings_1', name: 'High-Yield Savings', type: 'Savings account', balance: 42000, currency: 'Rs.' },
  { id: 'wallet_1', name: 'Digital Wallet (ePay)', type: 'Digital wallet', balance: 3200, currency: 'Rs.' }
];

export const INITIAL_STUDENT_FINANCE_DATA = {
  isSetupComplete: true,
  currency: 'Rs.',
  monthlyIncome: 70000,
  allowance: {
    monthly: 30000,
    weeklySplit: 7500,
    parentProvided: 20000,
    scholarship: 10000,
    partTime: 0
  },
  accounts: DEFAULT_ACCOUNTS,
  categories: STUDENT_CATEGORIES,
  budget: {
    total: 60000,
    categories: {
      'Food & Dining': { budget: 15000, spent: 11200 },
      'Transport': { budget: 10000, spent: 7400 },
      'Education': { budget: 8000, spent: 5000 },
      'Entertainment': { budget: 5000, spent: 4800 },
      'Other': { budget: 7000, spent: 3200 }
    }
  },
  expenses: [
    { id: '1', title: 'University Canteen Lunch', amount: 520, category: 'Food & Dining', date: new Date().toISOString(), accountId: 'cash_1', merchant: 'Campus Canteen', paymentMethod: 'Cash', tags: ['daily', 'food'] },
    { id: '2', title: 'Bus Pass Monthly', amount: 1500, category: 'Transport', date: new Date(Date.now() - 86400000 * 2).toISOString(), accountId: 'bank_1', merchant: 'Transit Authority', paymentMethod: 'Bank account', tags: ['commute'] },
    { id: '3', title: 'Algorithms Textbook', amount: 3500, category: 'Books', date: new Date(Date.now() - 86400000 * 4).toISOString(), accountId: 'bank_1', merchant: 'Campus Bookstore', paymentMethod: 'Debit card', tags: ['academics'] },
    { id: '4', title: 'Dialog Axiata Mobile Recharge', amount: 1200, category: 'Mobile', date: new Date(Date.now() - 86400000 * 5).toISOString(), accountId: 'wallet_1', merchant: 'Dialog', paymentMethod: 'Digital wallet', tags: ['utility'] },
    { id: '5', title: 'Spotify Premium Student', amount: 450, category: 'Music', date: new Date(Date.now() - 86400000 * 8).toISOString(), accountId: 'bank_1', merchant: 'Spotify', paymentMethod: 'Debit card', tags: ['subscription'] }
  ],
  incomes: [
    { id: 'inc_1', title: 'Monthly Allowance from Parents', amount: 30000, category: 'Allowance', date: new Date(Date.now() - 86400000 * 12).toISOString(), accountId: 'bank_1' },
    { id: 'inc_2', title: 'Merit Scholarship Stipend', amount: 15000, category: 'Scholarship', date: new Date(Date.now() - 86400000 * 14).toISOString(), accountId: 'bank_1' },
    { id: 'inc_3', title: 'Freelance UI Design Project', amount: 25000, category: 'Freelance', date: new Date(Date.now() - 86400000 * 3).toISOString(), accountId: 'bank_1' }
  ],
  bills: [
    { id: 'bill_1', title: 'Dialog Axiata Mobile', amount: 1200, dueDate: new Date(Date.now() + 86400000 * 2).toISOString(), category: 'Mobile', status: 'upcoming', autoPay: false },
    { id: 'bill_2', title: 'Hostel Rent', amount: 18000, dueDate: new Date(Date.now() + 86400000 * 10).toISOString(), category: 'Rent', status: 'upcoming', autoPay: true },
    { id: 'bill_3', title: 'Fibre Broadband', amount: 2800, dueDate: new Date(Date.now() + 86400000 * 14).toISOString(), category: 'Internet', status: 'upcoming', autoPay: true }
  ],
  subscriptions: [
    { id: 'sub_1', name: 'ChatGPT Plus', amount: 6200, billingCycle: 'Monthly', merchant: 'OpenAI', active: true },
    { id: 'sub_2', name: 'Spotify Student', amount: 450, billingCycle: 'Monthly', merchant: 'Spotify', active: true },
    { id: 'sub_3', name: 'GitHub Pro Student', amount: 0, billingCycle: 'Monthly', merchant: 'GitHub', active: true },
    { id: 'sub_4', name: 'Canva Pro', amount: 1800, billingCycle: 'Monthly', merchant: 'Canva', active: true }
  ],
  savingsGoals: [
    { id: 'goal_1', name: 'Gaming Laptop', currentAmount: 120000, targetAmount: 250000, targetDate: '2026-12-31', monthlyRequired: 26000, category: 'Tech' },
    { id: 'goal_2', name: 'Emergency Fund', currentAmount: 25000, targetAmount: 100000, targetDate: '2027-03-31', monthlyRequired: 12500, category: 'Safety' }
  ],
  debts: [
    { id: 'debt_1', title: 'Student Laptop Loan', totalAmount: 145000, remainingAmount: 95000, monthlyPayment: 15000, debtFreeDate: 'May 2027' }
  ],
  peerMoney: {
    youOwe: [
      { id: 'po_1', name: 'Nimal', amount: 2000, reason: 'Group Dinner', dueDate: '2026-08-20', paid: false },
      { id: 'po_2', name: 'Kasun', amount: 1500, reason: 'Lab Printing', dueDate: '2026-08-25', paid: false }
    ],
    othersOweYou: [
      { id: 'po_3', name: 'Amal', amount: 3500, reason: 'Book Purchase', dueDate: '2026-08-18', paid: false },
      { id: 'po_4', name: 'Dinuka', amount: 1200, reason: 'Canteen Treat', dueDate: '2026-08-22', paid: false }
    ]
  },
  semesterFinance: {
    academicYear: '2026',
    semesterName: 'Semester 1',
    estimatedCost: 185000,
    breakdown: {
      education: 25000,
      transport: 40000,
      food: 75000,
      projects: 15000,
      personal: 30000
    }
  },
  projectBudgets: [
    { id: 'proj_b1', title: 'Final Year Project', budget: 30000, spent: 14200, items: [
      { title: 'Cloud Hosting', amount: 5000, date: '2026-08-01' },
      { title: 'Domain Registration', amount: 3500, date: '2026-08-02' },
      { title: 'Hardware Sensors', amount: 5700, date: '2026-08-10' }
    ]}
  ],
  financialDiary: [
    { id: 'diary_1', date: '2026-08-14', note: 'Spent Rs. 2,500 going out with friends.', tag: 'Social' }
  ],
  challenges: [
    { id: 'ch_1', title: 'No-Spend Weekend', description: 'Do not spend on unnecessary things this weekend.', targetSavings: 5000, progress: 80, streak: 3, completed: false },
    { id: 'ch_2', title: 'Cook-at-Home Challenge', description: 'Prepare lunch at home 4 days in a row.', targetSavings: 4000, progress: 100, streak: 4, completed: true }
  ]
};
