import { Swar } from '@/types/music';
import { Phrase, RagaCandidate, RagaDefinition } from '@/types/raga';
import { RAGA_DB } from './ragaDatabase';
import { SWAR_LIST } from '@/lib/noteMapper';

export interface IdentificationInput {
  swarUsage: Map<number, number>;
  totalNotes: number;
  completedPhrases: Phrase[];
  recentPhrases: Phrase[];
}

function matchPakad(
  phraseSwaras: Swar[],
  pakadSwaras: Swar[],
  matchRatio: number = 0.7
): boolean {
  let matched = 0;
  let pi = 0;
  for (let i = 0; i < phraseSwaras.length && pi < pakadSwaras.length; i++) {
    if (phraseSwaras[i] === pakadSwaras[pi]) {
      matched++;
      pi++;
    }
  }
  return matched / pakadSwaras.length >= matchRatio;
}

function scoreRaga(raga: RagaDefinition, input: IdentificationInput): RagaCandidate {
  const reasons: string[] = [];
  const { swarUsage, totalNotes, completedPhrases, recentPhrases } = input;

  // 1. Swar inclusion score (0.3)
  let includedCount = 0;
  for (const [swarIdx, count] of swarUsage) {
    if (raga.allowedSwar.has(swarIdx)) {
      includedCount += count;
    }
  }
  const swarInclusionScore = totalNotes > 0 ? includedCount / totalNotes : 0;

  if (swarInclusionScore === 1) {
    reasons.push(`All notes within ${raga.name}'s swar set`);
  } else if (swarInclusionScore > 0.9) {
    reasons.push(`${Math.round(swarInclusionScore * 100)}% of notes are in ${raga.name}'s swar set`);
  }

  // 2. Swar exclusion penalty (0.3)
  let forbiddenTypes = 0;
  let forbiddenTotal = 0;
  const distinctPlayed = swarUsage.size;
  const forbiddenNames: string[] = [];

  for (const [swarIdx, count] of swarUsage) {
    if (raga.varjitSwar.has(swarIdx)) {
      forbiddenTypes++;
      forbiddenTotal += count;
      forbiddenNames.push(`${SWAR_LIST[swarIdx]}(${count}x)`);
    }
  }

  let swarExclusionPenalty = distinctPlayed > 0 ? forbiddenTypes / distinctPlayed : 0;
  // Strong penalty if any forbidden swar played > 2 times
  if (forbiddenTotal > 2) {
    swarExclusionPenalty = Math.max(swarExclusionPenalty, 0.6);
  }
  // Even stronger if 3+ distinct forbidden swaras
  if (forbiddenTypes >= 3) {
    swarExclusionPenalty = Math.max(swarExclusionPenalty, 0.8);
  }

  if (forbiddenNames.length > 0) {
    reasons.push(`Warning: forbidden swaras played — ${forbiddenNames.join(', ')}`);
  } else {
    reasons.push('No forbidden swaras detected');
  }

  // 3. Vadi/samvadi emphasis score (0.2)
  const vadiIdx = SWAR_LIST.indexOf(raga.vadi);
  const samvadiIdx = SWAR_LIST.indexOf(raga.samvadi);

  // Rank swaras by usage
  const sortedSwaras = [...swarUsage.entries()].sort((a, b) => b[1] - a[1]);
  const vadiRank = sortedSwaras.findIndex(([idx]) => idx === vadiIdx);
  const samvadiRank = sortedSwaras.findIndex(([idx]) => idx === samvadiIdx);

  let vadiScore: number;
  if (vadiRank === 0) vadiScore = 1.0;
  else if (vadiRank === 1) vadiScore = 0.7;
  else if (vadiRank === 2) vadiScore = 0.4;
  else vadiScore = 0.1;

  let samvadiScore: number;
  if (samvadiRank === 0) samvadiScore = 1.0;
  else if (samvadiRank === 1) samvadiScore = 0.7;
  else if (samvadiRank === 2) samvadiScore = 0.4;
  else samvadiScore = 0.1;

  const vadiEmphasisScore = vadiScore * 0.67 + samvadiScore * 0.33;

  if (vadiRank === 0) {
    reasons.push(`${raga.vadi} is the most frequently played swar (vadi match)`);
  } else if (vadiRank >= 0 && vadiRank <= 2) {
    reasons.push(`${raga.vadi} (vadi) is the #${vadiRank + 1} most played swar`);
  }

  // Check if vadi appears as emphasis/landing in recent phrases
  const phrasesForEmphasis = recentPhrases.length > 0 ? recentPhrases : completedPhrases.slice(-5);
  const vadiAsEmphasis = phrasesForEmphasis.filter((p) => p.emphasis === raga.vadi).length;
  const vadiAsLanding = phrasesForEmphasis.filter((p) => p.landingNote === raga.vadi).length;
  if (vadiAsEmphasis > 0) {
    reasons.push(`${raga.vadi} appears as phrase emphasis ${vadiAsEmphasis} time(s)`);
  }
  if (vadiAsLanding > 0) {
    reasons.push(`${raga.vadi} appears as landing note ${vadiAsLanding} time(s)`);
  }

  // 4. Pakad matching score (0.2)
  let matchedPakadCount = 0;
  const matchedPakads: string[] = [];

  for (const pakad of raga.pakad) {
    for (const phrase of completedPhrases) {
      const phraseSwaras = phrase.notes.map((n) => n.swar);
      if (matchPakad(phraseSwaras, pakad)) {
        matchedPakadCount++;
        matchedPakads.push(pakad.join(' '));
        break; // Count each pakad only once
      }
    }
  }

  const pakadMatchScore = raga.pakad.length > 0 ? matchedPakadCount / raga.pakad.length : 0;

  if (matchedPakads.length > 0) {
    reasons.push(`Detected pakad: ${matchedPakads.join('; ')}`);
  }

  // Combine
  const confidence =
    swarInclusionScore * 0.3 +
    (1 - swarExclusionPenalty) * 0.3 +
    vadiEmphasisScore * 0.2 +
    pakadMatchScore * 0.2;

  return {
    name: raga.name,
    confidence: Math.max(0, Math.min(1, confidence)),
    reasons,
  };
}

export function identifyRaga(input: IdentificationInput): RagaCandidate[] {
  return RAGA_DB.map((raga) => scoreRaga(raga, input))
    .filter((c) => c.confidence >= 0.4)
    .sort((a, b) => b.confidence - a.confidence);
}
