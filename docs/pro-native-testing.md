# TableRec Pro: testing inside the iPhone app

This branch now integrates Pro into the native TableRec bundle. The standalone browser prototype is an earlier reference, not the intended phone test route.

## What changed
- A TableRec Pro card appears in Profile and Settings for signed-in users of the dedicated tester build.
- Pro opens inside TableRec as full-screen screens, with a Back control.
- The existing TableRec wordmark is used, with orange/cream styling and dark-theme context.
- Feature navigation: Overview, Dining needs, Happy hours, Recipe Wheel, Trip planner, Dining journal.
- Closing/reopening Pro retains the same in-memory session while signed in. Switching accounts or signing out destroys that session.
- The Pro frame is sandboxed without same-origin privileges. It receives only the public display name and appearance, not account tokens or dietary data from the parent.
- Run It remains free/unlimited. No reservations or payment prompts are added.

## Create the TestFlight tester build
1. In GitHub Actions, open **TableRec iOS Release**.
2. Click **Run workflow**.
3. Choose branch **pro/dining-needs-spec** (not main).
4. Enable **signed_release** and **upload_to_apple** using the existing signing/upload setup.
5. Run the workflow and wait for its success and Apple processing.
6. In App Store Connect, find the new TestFlight build and assign it to the intended testing group. Complete any required Apple testing review steps.
7. Update through TestFlight. Sign in and open **Profile > TableRec Pro**.
8. Confirm the installed build number is the newly generated tester build.

Pro is enabled automatically only when the native workflow runs from refs/heads/pro/dining-needs-spec. The same workflow on main leaves it disabled. No merge is needed to test this branch. Do not replace the public-release submission with this prototype build.

## Android option
Run **TableRec Native Builds** on the same branch. Enable build_play_bundle only when a signed Google Play bundle is needed. Install the generated test app or upload the signed bundle to the intended closed-test track through the existing process.

## Phone acceptance checks
- Pro card appears only after sign-in in the explicit preview build.
- Back returns to TableRec. Close/reopen retains the test session.
- Switching accounts and sign-out remove the prior Pro session.
- Appearance matches light/dark context.
- Forms, dialogs, keyboard scrolling, safe areas, and Recipe Wheel work on device.
- Profiles combine all selected requirements; no source is treated as a safety guarantee.
- Deals/recipes/trip edits/journal actions work without presenting a reservation.
- Standard build does not expose Pro.

## Data and functionality boundaries
This is an in-app prototype, not a completed commercial Pro service. Restaurant/evidence/deal records are fictional and explicitly labeled. Medical placeholders remain manual-review-only. The derivative dictionary is not clinically validated.
Recipes and deals are not allergy-filtered. Dietary/profile/journal edits are in memory only, with no cloud persistence or payment entitlement.
A prototype with finished presentation cannot make fictional data real. Real source collection, qualified review, private storage and billing remain separate work.

## Validation
Combined prototype scripts and loader parse. Twelve sample-data logic checks and additional state/render checks passed in the available JavaScript evaluator. Native packaging simulation confirmed preview assets/entry are included with TR_PRO_PREVIEW=true and absent from the standard entry when false.
GitHub Actions runs real Node/jsdom smoke checks and native packaging checks; consult its latest result before building. Native archive/upload, on-phone layout, gestures and end-to-end behavior remain unverified until the new build is run and installed.
