import { getMarketNews } from '../../services/newsService';
import { analyzeMood } from '../../services/llmService';

export async function analyze(symbol) {
  const logs = [];
  const log = (msg) => {
      console.log(msg);
      logs.push(`[SENTIMENT] ${msg}`);
  };

  log(`--- Sentiment Agent Analysis for ${symbol} ---`);

  const newsItems = await getMarketNews(symbol);
  
  if (!newsItems || newsItems.length === 0) {
    console.warn(`No news found for ${symbol}. Returning neutral.`);
    log('WARNING: No news articles found.');
    return {
      agent: 'sentiment',
      symbol,
      action: 'HOLD',
      decisions: ['HOLD', 'HOLD'],
      confidence: 0.3, 
      reason: 'No news data available.',
      reasoning: ['No articles found to analyze sentiment.'],
      data: { newsCount: 0 },
      logs
    };
  }

  log(`Found ${newsItems.length} news articles.`);

  let weightedSentimentSum = 0;
  let totalRelevance = 0;
  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;

  newsItems.sort((a, b) => b.time_published.localeCompare(a.time_published));

  const headlines = newsItems.map(n => n.title);

  newsItems.forEach((item, index) => {
    let relevance = item.relevance_score || 0.5; 
    
    if (index === 0 && newsItems.length > 1) {
        relevance *= 2; 
        log(`Boosting weight for latest article: "${item.title.substring(0, 50)}..."`);
    }

    weightedSentimentSum += (item.overall_sentiment_score * relevance);
    totalRelevance += relevance;

    if (item.overall_sentiment_score > 0.15) positiveCount++;
    else if (item.overall_sentiment_score < -0.15) negativeCount++;
    else neutralCount++;
  });

  const avgSentiment = totalRelevance > 0 ? (weightedSentimentSum / totalRelevance) : 0;
  const posNegRatio = negativeCount > 0 ? positiveCount / negativeCount : positiveCount;
  
  log(`Sentiment Metrics: Avg=${avgSentiment.toFixed(4)}, Pos/Neg=${positiveCount}/${negativeCount}`);

  const volumeIntensity = newsItems.length >= 5 ? 'HIGH' : (newsItems.length < 3 ? 'LOW' : 'NORMAL');

  const topHeadlines = headlines.slice(0, 5);
  const moodAnalysis = await analyzeMood(topHeadlines); 
  
  log(`LLM Psychology Analysis: ${moodAnalysis.mood}`);

  let overallMood = 'MIXED';
  
  if (moodAnalysis.mood === 'FOMO' && avgSentiment > 0.2) {
      overallMood = 'HYPE/FOMO';
  } else if (moodAnalysis.mood === 'FEAR' && avgSentiment < -0.2) {
      overallMood = 'FEARFUL';
  } else if (avgSentiment > 0.35) {
      overallMood = 'BULLISH';
  } else if (avgSentiment < -0.35) {
      overallMood = 'BEARISH';
  } else {
      overallMood = 'MIXED'; 
  }

  log(`Derived Market Mood: ${overallMood}`);

  let primaryDecision = 'HOLD';
  let secondaryDecision = 'HOLD';
  let baseConfidence = 0.5;
  let reasoningLog = [];

  reasoningLog.push(`Analyzed ${newsItems.length} articles.`);
  reasoningLog.push(`Avg Weighted Sentiment: ${avgSentiment.toFixed(4)}.`);
  reasoningLog.push(`Pos/Neg Ratio: ${posNegRatio.toFixed(2)}.`);
  reasoningLog.push(`Volume Intensity: ${volumeIntensity}.`);
  reasoningLog.push(`Crowd Psychology: ${moodAnalysis.mood} (${moodAnalysis.reasoning}).`);
  reasoningLog.push(`Overall Mood State: ${overallMood}.`);

  if (overallMood === 'HYPE/FOMO') {
      if (volumeIntensity === 'HIGH') {
          if (avgSentiment > 0.6) {
             primaryDecision = 'HOLD'; 
             secondaryDecision = 'REDUCE'; 
             baseConfidence += 0.2;
             reasoningLog.push('Extreme FOMO detected with high volume. Contrarian signal: Hold or Reduce.');
             log('Decision: Extreme FOMO + High Vol -> CONTRARIAN HOLD/REDUCE');
          } else {
             primaryDecision = 'BUY_MORE';
             secondaryDecision = 'HOLD';
             baseConfidence += 0.3;
             reasoningLog.push('Strong momentum driven by FOMO. Riding the trend.');
             log('Decision: FOMO Momentum -> BUY');
          }
      } else {
          primaryDecision = 'HOLD';
          secondaryDecision = 'BUY_MORE';
          baseConfidence += 0.1;
          reasoningLog.push('FOMO signals present but volume is not confirming high intensity.');
          log('Decision: FOMO w/o Volume -> CAUTIOUS HOLD');
      }
  } else if (overallMood === 'FEARFUL') {
      if (volumeIntensity === 'HIGH') {
           primaryDecision = 'EXIT';
           secondaryDecision = 'REDUCE';
           baseConfidence += 0.3;
           reasoningLog.push('High volume panic selling detected. Defensive action required.');
           log('Decision: Panic Selling -> EXIT');
      } else {
           primaryDecision = 'REDUCE';
           secondaryDecision = 'HOLD';
           baseConfidence += 0.1;
           reasoningLog.push('Fear signals present, reducing exposure.');
           log('Decision: Fear -> REDUCE');
      }
  } else if (overallMood === 'BULLISH') {
      primaryDecision = 'BUY_MORE';
      secondaryDecision = 'HOLD';
      baseConfidence += 0.2;
      reasoningLog.push('Solid bullish sentiment supported by data.');
      log('Decision: Bullish Sentiment -> BUY');
  } else if (overallMood === 'BEARISH') {
      primaryDecision = 'REDUCE';
      secondaryDecision = 'EXIT';
      baseConfidence += 0.2;
      reasoningLog.push('Consistent bearish sentiment detected.');
      log('Decision: Bearish Sentiment -> SELL/REDUCE');
  } else { 
      primaryDecision = 'HOLD';
      secondaryDecision = 'REALLOCATE';
      baseConfidence -= 0.1; 
      reasoningLog.push('Signals are mixed. Best to hold or reallocate to clearer opportunities.');
      log('Decision: Mixed Signals -> HOLD');
  }

  if (volumeIntensity === 'LOW') baseConfidence -= 0.1;
  if (volumeIntensity === 'HIGH') baseConfidence += 0.1;

  const finalConfidence = Math.max(0.3, Math.min(0.9, baseConfidence));

  log(`Final Confidence: ${finalConfidence.toFixed(2)}`);
  log('-------------------------------------------');

  return {
    agent: 'sentiment',
    symbol,
    action: primaryDecision, 
    decisions: [primaryDecision, secondaryDecision],
    confidence: finalConfidence,
    reason: reasoningLog.join(' '), 
    reasoning: reasoningLog, 
    data: {
        newsCount: newsItems.length,
        avgSentiment,
        mood: overallMood,
        volumeIntensity,
        psychology: moodAnalysis.mood
    },
    logs
  };
}
