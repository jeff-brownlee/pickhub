import fs from 'fs';
import path from 'path';

import { Persona } from '../types';

function readJson<T = any>(p: string): T {
  return JSON.parse(fs.readFileSync(p, 'utf8')) as T;
}

function buildPrompt(persona: Persona, week: number, season: number) {
  const header = `Persona: ${persona.name} (${persona.id})\nWeek ${week}, Season ${season}`;

  const personaProfile = [
    `- Persona: ${persona.persona || ''}`,
    `- Tagline: ${persona.tagline || ''}`,
    `- Bias: ${persona.bias || ''}`,
    `- Voice Style: ${persona.voiceStyle || ''}`,
  ].join('\n');

  const instructions = `You will be given an attached JSON file containing this legacy envelope: { "analystId", "week", "season", "generatedAt", "picks": [ ... ], "weekSummary" }.

Task:
- For EACH item in picks[], generate a concise, personality-driven narrative for selection.rationale that aligns to the analyst's bias and voice.
- Use selection.rationaleCues (if present) to incorporate at least 2–3 concrete numeric details (e.g., stat margin, public split %, line movement, coaching experience delta). Do not just list them; weave them naturally.
- Keep rationales ~2 sentences (max 3), natural tone; avoid generic filler.

Strict requirements:
- DO NOT change the JSON shape or any fields other than selection.rationale.
- Preserve selection.line, selection.odds, result fields, and all team/marketData as-is.
- Return the FULL JSON content with only selection.rationale updated for each pick.
- Output formatting: Return the JSON inside a single fenced code block. Set the fence language to json. Use ONLY standard ASCII quotes (\"), NOT “smart quotes”. No commentary outside the code block.

Notes:
- If any pick seems low-confidence, keep rationale neutral but consistent with bias.
- Do not invent stats not implied by cues; prefer general but plausible references.`;

  const attach = `Attached file: picks JSON for ${persona.name}.`;

  return [
    header,
    '',
    'Analyst Profile:',
    personaProfile,
    '',
    instructions,
    '',
    attach,
  ].join('\n');
}

async function main() {
  const week = process.argv[2] ? parseInt(process.argv[2], 10) : 1;
  const season = 2025;
  const weekStr = `week-${week.toString().padStart(2, '0')}`;

  const personasPath = path.join(process.cwd(), 'public', 'data', 'personas.json');
  const picksDir = path.join(process.cwd(), 'public', 'data', 'nfl', `season-${season}`, weekStr, 'picks');
  const outDir = path.join(process.cwd(), '..', 'data', 'nfl', `season-${season}`, weekStr, 'prompts');

  if (!fs.existsSync(personasPath)) {
    console.error(`personas.json not found at ${personasPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(picksDir)) {
    console.error(`picks directory not found at ${picksDir}`);
    process.exit(1);
  }
  fs.mkdirSync(outDir, { recursive: true });

  const personas = readJson<Persona[]>(personasPath);

  let generated = 0;
  for (const persona of personas) {
    const picksFile = path.join(picksDir, `${persona.id}.json`);
    if (!fs.existsSync(picksFile)) {
      console.warn(`Skipping ${persona.id}: picks file not found at ${picksFile}`);
      continue;
    }

    const prompt = buildPrompt(persona, week, season);
    const outPath = path.join(outDir, `${persona.id}.txt`);
    fs.writeFileSync(outPath, prompt, 'utf8');
    generated += 1;
  }

  console.log(`📝 Generated ${generated} prompt file(s) → ${outDir}`);
  console.log('Usage: In ChatGPT, start a conversation, paste the prompt text, and attach the corresponding picks JSON file.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


