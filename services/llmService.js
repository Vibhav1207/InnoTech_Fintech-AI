export async function analyzeMood(headlines) {
  await new Promise(resolve => setTimeout(resolve, 500));

  const text = headlines.join(' ').toLowerCase();

  const fomoKeywords = ['surge', 'soar', 'record', 'breakout', 'frenzy', 'buy', 'skyrocket', 'jump', 'rally', 'bull run'];
  const fearKeywords = ['crash', 'plummet', 'panic', 'sell-off', 'plunge', 'crisis', 'collapse', 'bear', 'warning', 'risk'];
  
  let fomoScore = 0;
  let fearScore = 0;

  fomoKeywords.forEach(word => {
    if (text.includes(word)) fomoScore++;
  });

  fearKeywords.forEach(word => {
    if (text.includes(word)) fearScore++;
  });

  let mood = 'NEUTRAL';
  if (fomoScore > fearScore && fomoScore > 0) {
      mood = 'FOMO'; 
  } else if (fearScore > fomoScore && fearScore > 0) {
      mood = 'FEAR'; 
  } else if (fomoScore > 0 && fearScore > 0) {
      mood = 'MIXED'; 
  }

  return {
    mood,
    confidence: 0.6 + (Math.min(fomoScore + fearScore, 5) * 0.05), 
    reasoning: `Detected ${fomoScore} FOMO signals and ${fearScore} FEAR signals in top headlines.`
  };
}

export async function analyzeSentiment(text) {
    const moodResult = await analyzeMood([text]);
    return {
        sentiment: moodResult.mood === 'FOMO' ? 'positive' : (moodResult.mood === 'FEAR' ? 'negative' : 'neutral'),
        confidence: moodResult.confidence
    };
}
