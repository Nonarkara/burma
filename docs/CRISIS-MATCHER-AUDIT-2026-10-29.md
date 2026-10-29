# Crisis matcher: bounded false-positive correction

The previous substring `rape` matched grape juice, scraped news and drapes, while bare Burmese `ကုန်ကူး` matched ordinary commerce. Executable negative fixtures failed against the original code. The fix limits the English term to whole words and common inflections, and requires the human-trafficking prefix `လူ` for the Burmese term.

Terminology evidence: [Safe Child Thailand Burmese trafficking report](https://www.safechildthailand.org/wp-content/uploads/2019/10/BURMESE_Child-Trafficking-in-the-Mekong-Sub-Region-Safe-Child-Thailand.pdf), whose COMMIT glossary uses `လူကုန်ကူးမှု`; [IOM safe-migration booklet](https://myanmar.iom.int/sites/g/files/tmzbdl1111/files/documents/SMP%2520booklet%2520F.pdf) corroborates the term. Public terminology checks are not validation of a crisis classifier. No Myanmar-state source was adopted.

The existing broad self-pronoun fallback is retained temporarily: removing it before native-reviewed replacement vocabulary could reduce an already incomplete safety net. This remains an explicit critical gap, not a completed Burmese safety review. No hotline numbers, clinical guidance, logging or message transmission were added.

`tests/crisis.test.mjs` exercises five benign examples and fourteen harm-related examples. The negative test and rapist case failed before the fix; both tests pass after. Native reviewers still need to assess dialect, spacing, negation and actual community language.

Uncommitted dashboard and station-test changes existed at start and are excluded from the release snapshot.

## Release evidence

Source fix `953d65f`, content stamp `c63733b`; Pages deployment `534b5501.burma-a3k.pages.dev`. The clean release snapshot passes 72 tests (the working tree has one additional unrelated uncommitted media test). Canonical `/dashboard` references `survival.js?v=53d434d9f1`; the fetched asset matches committed source bytes and all seven live-asset positive/negative checks pass. No public crisis message was posted. Pre-existing `web/dashboard.js` and `tests/stations.test.mjs` changes remain untouched and unshipped in this release.
