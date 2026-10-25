# A useful news community for Burmese people in Thailand

Research and implementation: 25 October 2026. Scope: public publisher feeds and Thai-side community information. [Transport probe evidence](data/NEWS-SOURCE-PROBES-2026-10-25.json). This is desk research, not a declaration of partnerships or a comprehensive account of conditions inside Myanmar.

## What C2's comment changes

C2 relayed a contact's view that conditions are improving and projects may grow in 2027. Treat that as a valuable community lead, with room for constructive reporting, rather than a verified national forecast. Ask for a project name, public announcement, organiser, location, timeline and who can participate. An announced project is not automatically a job, scholarship, safe travel route or funded placement.

There is evidence of some improvement, with substantial limits. The [World Bank's June 2026 monitor](https://www.worldbank.org/en/news/press-release/2026/06/16/myanmar-s-economy-shows-tentative-stabilization-but-fuel-shock-intensifies-pressures) described modest stabilization alongside weak activity and persistent pressures; its FY2026/27 growth projection was conditional, not an assurance of recovery. We should cover genuine opportunities and community achievements alongside rights and safety information, without deciding in advance that the story must be optimistic or pessimistic.

The product inference is three information lanes: **publisher reporting**, **provider announcements**, and **member leads**. Give each its own provenance. Reading a provider page is not independent verification, a referral agreement or a guarantee of eligibility.

## Source areas and actual access findings

| Area / source | Why it belongs | What was checked | Decision |
| --- | --- | --- | --- |
| [HRDF news](https://hrdfoundation.org/?lang=en&page_id=7725) | Labour rights, migrant-led training, legal developments and organisational vacancies | Homepage advertises an RSS URL; correctly decoded English feed returned XML, 10 records, newest 7 October 2026 | **Connected**, headline/link only. Civil-society primary information; a past vacancy is not automatically open. |
| [Prachatai English](https://prachataienglish.com/) | Thai-side reporting on migrants, refugees, learning and civil society | Advertised `rss.xml`: first transport attempt failed; same endpoint succeeded on retry, 10 records, newest 22 October 2026 | **Connected**, headline/link only, filtered for Myanmar/migrant/learning relevance. Its diaspora category denotes editorial audience, not a precise location. |
| [DVB English](https://english.dvb.no/feed), [Irrawaddy English](https://irrawaddy.com/feed), [Irrawaddy Burmese](https://burma.irrawaddy.com/feed) | Independent reporting; Burmese originals remain essential | Existing working integrations retained | **Retained**. These are publishers, not official eligibility decisions. |
| [MAP Foundation](https://www.mapfoundationcm.org/en/) | Migrant-language rights, health, radio and community organisation | Both advertised RSS and Atom endpoints returned valid-looking XML but **zero entries** | **Not connected as live news**. Seek a maintained organisational feed or permission for a narrow announcements adapter. Do not count empty XML as working news. |
| [Mae Tao Clinic](https://maetaoclinic.org/about-us/) | Health, education, community training in Mae Sot | Automated robots/home probes received 403 | **No automated ingestion**. Use a public reference link; ask the organisation for a feed or approved publication route. No bypass. |
| [Migrant Working Group](https://mwgthailand.org/en) | Worker policy, community recommendations and fisheries concerns | Public page works; no advertised feed found | **Next page-monitor candidate**, only after defining the permitted title/date/link extraction and checking terms. Do not crawl case narratives or contact lists. |
| [Thai Ministry of Labour](https://www.mol.go.th/en/news_group/news), [Department of Employment](https://www.doe.go.th/) and [Thailand PRD](https://thailand.prd.go.th/) | Original Thai-side policy announcements | MOL news page works; the tested `/en/feed` response is not usable RSS. PRD provides dated public announcements | **Official link-outs / editorial checks now**; a narrow public-notice adapter is future work. Preserve the affected cohort and link to current procedures. No Myanmar-government data integration. |
| [ASEAN Foundation calls](https://aseanfoundation.org/call-for-applications/) | Youth exchanges, skills and civil-society calls | Public pages are readable; its advertised WordPress API route returned 403 | **Manual source checks now**. Do not route around the API refusal or declare all programme announcements open. |
| [Child's Dream](https://childsdream.org/engage/apply-for-scholarships/), [Prospect Burma](https://www.prospectburma.org/higher-education-scholarships), [Mahidol scholarships](https://graduate.mahidol.ac.th/CMB-Mahidol-Postgraduate-Scholarship/) | Education pathways into Thailand | First-party programme pages found; exact intake deadlines differ or remain unconfirmed | **Education watchlist**. A portal or a recurring programme is not proof that the 2027 intake is open. |
| [Cetana](https://cetana.org/) | A concrete 2027/28 teaching-related study lead | Provider page names a new cycle but contains contradictory deadline/notification years | **Needs provider confirmation**. Retain the mandatory post-study community-service condition. |
| [UNESCO project 567THA1001](https://core.unesco.org/en/project/567THA1001) | A documented education project for Myanmar migrant learners in Tak extending into 2027 | Q2 2026 project record gives start 10 February 2026 and end 31 March 2027 | **Project reference added**, not an open admission or job call. An ongoing project record is different from a recruitment opportunity. |
| [Sabai Job community projects](https://sabaijob.com/our-projects) | Burmese-language worker learning, community circles and practical media | Provider describes programmes; project relationship with Pirchchat remains unclarified | **Partnership/feed discussion candidate**. Link to public provider information; do not scrape worker profiles, private groups or claim a partnership. |
| [ThaiNGO vacancies](https://thaingo.org/jobs), [MIMU vacancies](https://www.themimu.info/jobs-for-myanmar-nationals) | Public development-sector roles, including some Thailand-based work | Public listings found; employer eligibility and current closing dates require checking per role | **Discovery/link-out candidates**. Filter Thailand/remote scope and confirm with the original employer before presenting a vacancy as suitable. No applicant records or CV collection. |
| [Burma News International](https://www.bnionline.net/en) | Regional and ethnic-community reporting beyond large national outlets | Homepage reachable; no advertised feed discovered in this pass | **Source-development candidate**, not an enabled connector. Establish an original-publisher route before adding volume. |
| [SHAN English](https://english.shannews.org/) | Shan and northern-border community context | Homepage returned 403 to the identified probe | **Not automated**. Request an approved feed; no agent/UA rotation around the refusal. |

Robots access, terms and copyright are different checks. The new integrations index published RSS headlines and canonical links, not full articles, photos, individual social posts or comments. No open-content licence is asserted. Seek publisher permission before broader republication or translation. The source manifest records transport results; it is not a licence register or an uptime promise.

## Concrete provider checks added

The new records are editorial references, separate from RSS. They expose the source-check date, status and caveats, with Burmese draft copy pending native review:

- [AFMAM EAS 2026](https://aseanfoundation.org/call-for-application/asean-foundation-model-east-asia-summit-2026-marking-50-years-of-the-treaty-of-amity-and-cooperation/): provider deadline 30 October 2026, 23:59 GMT+7; eligible diploma/undergraduate students aged 18–26 with English proficiency. Travel support is described from the home country; Thai-resident Myanmar applicants must clarify their situation with the organiser. The card becomes closed after the deadline.
- [UNESCO's Tak education project](https://core.unesco.org/en/project/567THA1001): a concrete Thai-side programme with a published end date in March 2027. The record is as of Q2 2026 and does not establish an open intake or vacancy.
- [Cetana 2027/28](https://cetana.org/): a Myanmar-national teaching-related master's pathway in Thailand, with degree/English and post-study service conditions. The source says December 2026 for applications but February 2026 for notification. We do not silently repair that inconsistency or label it open.
- [Child's Dream bachelor's pathway](https://childsdream.org/engage/apply-for-scholarships/university-scholarships-international-bachelors/): a first-party learning route for Myanmar/Cambodian students. Its December–January window is not a verified 2027 closing date.
- [PRD registered-worker announcement](https://thailand.prd.go.th/en/content/category/detail/id/52/iid/524032): the July 2026 extension concerns specified already-registered workers, not new registration. It is an announcement reference; individual procedures must be confirmed with the Thai authority.

These references are not a comprehensive list of available aid. Applications and personal documents go to the provider, never the public room. No synthetic announcement date is invented to push a checked reference to the top of the news feed.

## What should be monitored next

1. **Work and documents:** Thai official notices, worker-rights organisations and employer programme announcements. Record whether something is a proposal, cabinet decision, published procedure, actual vacancy or closed call. Never convert “more projects” into an invented hiring promise.
2. **Study and skills:** university international offices, scholarship foundations, recognised training providers, migrant learning centres. Track intake year, eligibility, cost coverage, language, credential status and real closing time. Prioritise first-party calls over scholarship aggregators.
3. **Community life:** consenting organisation calendars, public cultural events, language exchanges, arts and volunteer activities. Collect event information, not attendee identities, personal profiles or exact private homes.
4. **Health and practical support:** public provider service announcements and migrant-language information. Do not infer available appointments, interpretation or free care from a clinic's existence.
5. **Enterprise and civil-society projects:** original calls from funders and implementing organisations, plus named public project announcements. Separate individual applications, organisation grants, tenders and general economic forecasts.
6. **Local community reporting:** accept public-source links through the existing contribution draft flow. Label member reports as unverified, invite corrections, and obtain consent before naming or photographing another person. Do not scrape private Facebook/LINE groups or Telegram member lists.

Success should mean that a member finds something relevant, understands whether it applies, can check its origin, and can discuss or correct it—not that the dashboard has the largest headline count.

## Implementation contract

- Five fixed RSS connectors: three existing publishers plus HRDF and Prachatai. No user-supplied fetch target is added.
- One-megabyte streamed feed limit; HTTP failures, HTML and empty/non-RSS responses are not healthy connectors. Per-source status and newest publication date are returned by the API. Upstream caching is requested for 15 minutes; cache availability depends on the edge/runtime and publisher responses.
- New sources are headline/link only. No comment ingestion, full article storage, copied images or inference of personal details.
- Missing publication dates stay unknown. Missing locations stay null; an unrelated or unlocated story no longer becomes a fabricated Myanmar map pin. Cross-border place names do not silently become Thai checkpoints.
- Place inference uses headline names rather than incidental addresses in article bodies. It remains a mentioned-place approximation, not a navigation instruction. HRDF's malformed fragment links use its own validated same-origin article GUID; double-escaped entities are decoded with a bounded parser.
- Work, rights and learning classification powers the existing Jobs/Visa view in both API and browser. Geographic markers and fit controls use the same filter.
- Provider checks remain separate from live headlines. Their status distinguishes checked source, announcement, programme reference, confirmation needed and deadline passed.
- The daily digest retains its existing 06:00 ICT schedule and deduplication. Its source count now comes from the API rather than a hard-coded three-feed denominator. This does not add an AI synthesis pipeline.

## Remaining work

No new HTML crawler or social-listening collector is claimed as shipped. For a future permitted page adapter: store a bounded raw institutional-announcement snapshot before parsing, use conditional requests, run slowly, and stop on blocks or markup failures. Retain source date, fetch date, parser version and correction history. Avoid personal case records and retain only what is needed for the public announcement index.

Native Burmese review, physical iOS/Android checks, partner confirmation, permissions for broader reuse, and community editorial operation remain necessary. Automated status means source reachability, never “the claim is true.”

## Release verification

Deployed 25 October 2026: Pages `56d6d994.burma-a3k.pages.dev`; chat Worker version `32450078-de84-4683-83a7-687b937a4540`. Canonical `/dashboard`, `/dashboard.js` and `/dashboard.css` bytes match the committed files. Canonical `/api/news` returned `live`, five available sources, 47 headlines and five separate provider references. Browser inspection confirmed the HRDF canonical URLs and Burmese provider-reference cards. All 51 automated tests pass. Independent source/layout review was completed; native Burmese copy review and physical iOS/Android/low-end device checks remain pending. No public test messages were posted for this release.
