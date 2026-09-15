import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SAMPLE_SCENARIOS } from '@/lib/quest/scenarios';
import { scoreQuest } from '@/lib/quest/scoring';

const SubmissionSchema = z.object({
  questId: z.string(),
  questVersion: z.number(),
  selectionPath: z.array(z.string()),
  startedAt: z.string(),
  completedAt: z.string(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const quest = SAMPLE_SCENARIOS.find((q) => q.id === params.id);
  if (!quest) {
    return NextResponse.json({ error: 'quest_not_found' }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = SubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_submission', detail: parsed.error }, { status: 400 });
  }

  const result = scoreQuest(quest, parsed.data);
  return NextResponse.json(result);
}