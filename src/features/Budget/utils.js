/**
 * Currency rounding helper to prevent JavaScript floating-point artifacts.
 * e.g., 0.1 + 0.2 -> 0.3 instead of 0.30000000000000004
 */
export const roundCurrency = (amount) => {
  const val = Number(amount) || 0;
  return Math.round((val + Number.EPSILON) * 100) / 100;
};

/**
 * Format currency with locale options
 */
export const formatCurrency = (amount, symbol = 'Rs.') => {
  const rounded = roundCurrency(amount);
  return `${symbol} ${rounded.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const suggestCategory = (title, availableCategories = []) => {
  const lowerTitle = (title || '').toLowerCase();
  
  const rules = {
    'Food & Dining': ['uber eats', 'doordash', 'pizza', 'burger', 'coffee', 'starbucks', 'mcdonalds', 'restaurant', 'grocery', 'walmart', 'target', 'kroger', 'trader joe', 'food', 'dining', 'lunch', 'dinner', 'breakfast', 'snack', 'canteen'],
    'Transport': ['uber', 'lyft', 'gas', 'shell', 'chevron', 'bp', 'mobil', 'parking', 'transit', 'subway', 'bus', 'train', 'flight', 'ticket', 'toll', 'commute'],
    'Entertainment': ['netflix', 'spotify', 'hulu', 'movie', 'cinema', 'game', 'steam', 'xbox', 'playstation', 'concert', 'ticket', 'club', 'bar', 'party'],
    'Bills': ['rent', 'electricity', 'water', 'internet', 'comcast', 'xfinity', 'at&t', 'verizon', 't-mobile', 'phone', 'utility', 'insurance'],
    'Shopping': ['amazon', 'clothes', 'shoes', 'apple', 'best buy', 'mall', 'store', 'gift'],
    'Education': ['book', 'textbook', 'tuition', 'course', 'class', 'udemy', 'coursera', 'supplies', 'pen', 'notebook', 'stationery', 'printing']
  };

  for (const [category, keywords] of Object.entries(rules)) {
    if (keywords.some(keyword => lowerTitle.includes(keyword))) {
      const matched = availableCategories.find(c => (typeof c === 'string' ? c : c.name).toLowerCase() === category.toLowerCase());
      if (matched) return typeof matched === 'string' ? matched : matched.name;
    }
  }

  return null;
};
