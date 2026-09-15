import { NextRequest, NextResponse } from 'next/server';
import { detectEscalation, buildEscalation } from '@/lib/mentor/escalation';
import type { MentorContext, MentorReply } from '@/lib/mentor/types';

/**
 * POST /api/mentor
 *
 * SAFETY CONTRACT (binding):
 *  - Run crisis keyword detection FIRST.
 *  - If escalation triggers, return escalation payload WITHOUT calling the model.
 *  - Model is never the only safety layer.
 *
 * This stub returns a controlled echo response. Real model integration is
 * Phase 2 work and must include: provider selection, Burmese prompt template,
 * content moderation, audit log.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.message !== 'string') {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  // 1. Escalation check — always first.
  const crisis = detectEscalation(body.message);
  if (crisis) {
    const reply: MentorReply = {
      kind: 'escalate',
      escalation: buildEscalation(crisis),
    };
    return NextResponse.json(reply);
  }

  // 2. Stub reply — replace with model call in Phase 2.
  const context: MentorContext = body.context ?? {};
  const reply: MentorReply = {
    kind: 'reply',
    content: {
      my: 'ကြားပါသည်။ ထပ်ပြောပြပါ။',
      en: 'I heard you. Say more.',
    },
  };

  return NextResponse.json(reply);
}