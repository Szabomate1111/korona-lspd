import config from '../config';
import { PasteEvent, PasteMeta } from '../types';

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity ratio between two strings (0-1)
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;

  const distance = levenshteinDistance(str1, str2);
  const maxLen = Math.max(str1.length, str2.length);

  if (maxLen === 0) return 1;

  return 1 - distance / maxLen;
}

/**
 * Simple hash function for initial snapshot
 */
export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

/**
 * Analyze paste events and calculate suspicion metrics
 */
export function analyzePasteData(
  pasteEvents: PasteEvent[],
  finalAnswers: Record<string, string>,
  submissionTime: number
): {
  pasteMeta: Record<string, PasteMeta>;
  suspicionScore: number;
} {
  const pasteMeta: Record<string, PasteMeta> = {};
  const fieldScores: number[] = [];

  // Group paste events by field
  const pastesByField = pasteEvents.reduce((acc, event) => {
    if (!acc[event.field]) {
      acc[event.field] = [];
    }
    acc[event.field].push(event);
    return acc;
  }, {} as Record<string, PasteEvent[]>);

  // Analyze each field with paste events
  for (const [fieldKey, events] of Object.entries(pastesByField)) {
    const finalValue = finalAnswers[fieldKey] || '';
    const firstPaste = events[0];
    const pasteCount = events.length;

    // Reconstruct initial value from hash (we can't, so we use similarity heuristic)
    // In production, you might store the actual initial value temporarily
    const initialLength = firstPaste.initialLength;
    const finalLength = finalValue.length;

    // Calculate time to edit (seconds)
    const timeToEdit = Math.max(0, (submissionTime - firstPaste.pasteAt) / 1000);

    // Calculate length change ratio
    const lengthChangeRatio = initialLength > 0
      ? Math.abs(finalLength - initialLength) / initialLength
      : 0;

    // For similarity, we use a heuristic based on length change
    // (In a real scenario, you'd compare with stored initial snapshot)
    let similarity = 0;
    if (lengthChangeRatio < 0.1) {
      similarity = 0.95; // Very little change
    } else if (lengthChangeRatio < 0.3) {
      similarity = 0.75;
    } else if (lengthChangeRatio < 0.5) {
      similarity = 0.5;
    } else {
      similarity = 0.3;
    }

    // Calculate field suspicion score
    let fieldScore = 0;

    // Paste event count weight
    fieldScore += Math.min(pasteCount, 3) * config.pasteEventWeight;

    // Similarity weight (if above threshold)
    if (similarity >= config.similarityThreshold) {
      fieldScore += config.similarityWeight;
    }

    // Time to edit weight (if too quick)
    if (timeToEdit < config.minTimeToEdit) {
      fieldScore += config.timeToEditWeight;
    }

    pasteMeta[fieldKey] = {
      pasted: true,
      similarity,
      pasteCount,
      timeToEdit,
      lengthChangeRatio,
      initialHash: firstPaste.initialHash,
    };

    fieldScores.push(fieldScore);
  }

  // Calculate overall suspicion score
  let suspicionScore = 0;

  if (fieldScores.length > 0) {
    // Average of field scores
    suspicionScore = fieldScores.reduce((a, b) => a + b, 0) / fieldScores.length;

    // Add bonus for multiple fields pasted
    if (fieldScores.length > 2) {
      suspicionScore += config.multiFieldBonus;
    }
  }

  // Cap at 100
  suspicionScore = Math.min(Math.round(suspicionScore), 100);

  return { pasteMeta, suspicionScore };
}
