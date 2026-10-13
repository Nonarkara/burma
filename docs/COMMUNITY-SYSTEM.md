# Pirchchat: community before features

13 October 2026. Product direction from Dr Non: connect people from Myanmar in Thailand so they can understand, appreciate and support one another, share opportunities, and participate openly and respectfully.

## System to build

Keep the existing public rooms as the first meeting place. Make joining and contributing understandable in Burmese, with an English option. People should be able to read without creating a profile and contribute through a nickname without publishing legal identity. A nickname is not proof of identity, safety, or trustworthiness.

The useful community loop is: arrive → understand the room → offer or ask → receive a response → acknowledge help → correct or update information. Technology should make each step easier without turning people's generosity into a popularity contest.

### This round: implemented

- A visible community guide explains inclusion, consent, respectful disagreement, corrections, and the public/saved nature of rooms.
- A contribution form prepares four kinds of draft: offer a skill/time/resource; ask for help/learning; share an opportunity; express appreciation.
- Opportunity drafts require an HTTPS source and explicitly identify themselves as member-shared and unverified. A link is evidence to inspect, not a verification badge.
- Preparing a draft preserves existing composer text and never sends it. Members review it before the existing Send action.
- The contribution entry is outside the horizontally scrolling room navigation so it remains discoverable on a small phone.
- Illustrative news records are preserved through the explicit `demo=1` API mode; they no longer mix into the live feed or replace headlines during an outage.
- A dashboard startup error caused by an out-of-scope research-button variable was repaired, restoring downstream TV/news and connection-status initialization.

These are aids to real conversation, not a new database of people's needs. There is no automated matching, credential collection, ranking of members, private messaging, or staffed reporting service represented by this increment. Burmese copy remains a draft pending native review.

## Next increments, in order

1. **Human community operation:** name responsible hosts, their languages, hours and escalation contact. Agree on conduct rules, confidential report handling, response expectations and appeal/correction procedure. Only then connect a report form to an authenticated private queue. Never display the reporter's identity or create an apparently staffed button with no recipient. Do not give anonymous users moderation privileges.
2. **Opportunity stewardship:** let a designated editor maintain eligibility, provider, funding/costs, source date, deadline, status and corrections. Separate announcements, open calls and expired calls. Member submissions enter review; they do not gain “verified” status through likes or an AI summary.
3. **Find useful conversations:** add source-backed room descriptions and topic navigation; preserve room history and existing map tools. Introduce reply-to-message links before adding complex matching. Make unanswered requests visible without publicly scoring the people asking for help.
4. **Community-controlled participation:** ask members which languages, local areas and activities are useful. Offer opt-in reminders later, without tracking location or collecting immigration documents. Validate accessibility and poor-network behaviour with actual participants.
5. **Assisted understanding:** consider translation and summarisation only after Burmese review and per-claim provenance work. Preserve originals, indicate translation status, and provide correction tools. Human referrals remain mandatory for crisis-related mentoring.

## Open and transparent does not mean exposed

Publish how moderation works, which claims were checked, who maintains a listing in an organisational role, and why a correction was made. Protect personal documents, exact homes, private reports and sensitive stories. A public explanation of rules can coexist with confidential case handling. Public rooms are not encrypted private support spaces; do not market them as such.

Avoid paid-placement pressure, follower counts and automated reputation labels in the first pilot. Whether members want appreciation reactions, mutual-aid circles, audio or events is a research question, not an assumed cultural trait. Sharing another person's name or photograph needs consent.

## Research basis and limits

The [Burmese-in-Thailand knowledge base](knowledge-base/README.md) documents work, learning, service access, languages and legal-category differences. This community direction is our product inference from that evidence and Dr Non's stated purpose, not a claim of completed fieldwork.

[UNICEF's migrant-community outreach example](https://www.unicef.org/thailand/stories/reaching-out-migrant-communities) illustrates own-language communication through community organisations. It is historical pandemic work, not proof of a current Pirchchat partnership. [Discourse's flagging guidance](https://meta.discourse.org/t/flagging-a-post-for-moderator-attention/32783) provides prior art for directing concerns to moderators without derailing discussion. Borrow that workflow only when someone actually operates it; no platform migration is proposed here.

## Validation

26 automated regression checks cover preserved drafts, no automatic send, invalid opportunity sources, unverified labels, illustrative-news isolation, chat isolation and existing backend security controls. Browser walkthroughs cover small-screen discoverability and source-linked draft preparation. Local integration covers two-client delivery, durable history, room isolation and upload/CDN behaviour. No public test post is needed for this release.

Before expanding the pilot: native Burmese wording review; physical iOS Safari, Android Chrome and low-end Android checks; real participant walkthroughs; confirmed community hosts; private report process; current referral arrangements; and retention/consent review. Measure whether people can contribute and find a useful response, not simply whether they spend longer in the app.
