export const suggestCategory = (title, availableCategories) => {
  const lowerTitle = title.toLowerCase();
  
  const rules = {
    'Food': ['uber eats', 'doordash', 'pizza', 'burger', 'coffee', 'starbucks', 'mcdonalds', 'restaurant', 'grocery', 'walmart', 'target', 'kroger', 'trader joe', 'food', 'dining', 'lunch', 'dinner', 'breakfast', 'snack'],
    'Transport': ['uber', 'lyft', 'gas', 'shell', 'chevron', 'bp', 'mobil', 'parking', 'transit', 'subway', 'bus', 'train', 'flight', 'ticket', 'toll'],
    'Entertainment': ['netflix', 'spotify', 'hulu', 'movie', 'cinema', 'game', 'steam', 'xbox', 'playstation', 'concert', 'ticket', 'club', 'bar', 'party'],
    'Bills': ['rent', 'electricity', 'water', 'internet', 'comcast', 'xfinity', 'at&t', 'verizon', 't-mobile', 'phone', 'utility', 'insurance'],
    'Shopping': ['amazon', 'clothes', 'shoes', 'apple', 'best buy', 'mall', 'store', 'gift'],
    'Education': ['book', 'textbook', 'tuition', 'course', 'class', 'udemy', 'coursera', 'supplies', 'pen', 'notebook']
  };

  for (const [category, keywords] of Object.entries(rules)) {
    if (keywords.some(keyword => lowerTitle.includes(keyword))) {
      // Return the category if it exists in the user's available categories, 
      // or if not, just check if we can do a case-insensitive match
      const matched = availableCategories.find(c => c.toLowerCase() === category.toLowerCase());
      if (matched) return matched;
    }
  }

  return null;
};
