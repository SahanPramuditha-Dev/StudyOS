/**
 * SuperMemo SM-2 Spaced Repetition Algorithm Implementation
 *
 * Ratings:
 * 1 = Again (complete blackout, reset repetitions)
 * 2 = Hard (correct response with significant difficulty)
 * 3 = Good (correct response after a hesitation)
 * 4 = Easy (perfect response)
 */

export const SM2_GRADES = {
  AGAIN: 1,
  HARD: 2,
  GOOD: 3,
  EASY: 4,
};

export const calculateSM2 = (card, grade) => {
  let repetitions = card.repetitions || 0;
  let interval = card.interval || 0;
  let easeFactor = card.easeFactor || 2.5;

  const q = grade === SM2_GRADES.AGAIN ? 2 : grade === SM2_GRADES.HARD ? 3 : grade === SM2_GRADES.GOOD ? 4 : 5;

  if (q >= 3) {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  } else {
    repetitions = 0;
    interval = 1;
  }

  easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  const now = new Date();
  const nextDueDate = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);
  nextDueDate.setHours(23, 59, 59, 999);

  return {
    ...card,
    repetitions,
    interval,
    easeFactor: Number(easeFactor.toFixed(2)),
    dueDate: nextDueDate.toISOString(),
    lastReviewed: now.toISOString(),
    totalReviews: (card.totalReviews || 0) + 1,
    successReviews: q >= 3 ? (card.successReviews || 0) + 1 : (card.successReviews || 0)
  };
};

export const isCardDue = (card) => {
  if (!card.dueDate) return true;
  const dueDate = new Date(card.dueDate);
  const now = new Date();
  return dueDate <= now;
};

export const getDeckStats = (decks = []) => {
  let totalCards = 0;
  let dueTodayCount = 0;
  let masteredCount = 0;
  let totalReviews = 0;
  let totalSuccess = 0;

  decks.forEach(deck => {
    (deck.cards || []).forEach(card => {
      totalCards += 1;
      if (isCardDue(card)) {
        dueTodayCount += 1;
      }
      if ((card.interval || 0) >= 21) {
        masteredCount += 1;
      }
      totalReviews += (card.totalReviews || 0);
      totalSuccess += (card.successReviews || 0);
    });
  });

  const retentionRate = totalReviews > 0 ? Math.round((totalSuccess / totalReviews) * 100) : 100;
  const masteryRate = totalCards > 0 ? Math.round((masteredCount / totalCards) * 100) : 0;

  return {
    totalDecks: decks.length,
    totalCards,
    dueTodayCount,
    masteredCount,
    retentionRate,
    masteryRate
  };
};
