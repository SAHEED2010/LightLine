# Deployment status

LightLine's Vercel project is `yusuf-saheeds-projects/lightline`, connected to `SAHEED2010/LightLine` under Yusuf Saheed's account. The feature implementation is on `feat/lightline-v0.1` and [draft pull request #2](https://github.com/SAHEED2010/LightLine/pull/2). GitHub Actions quality checks and the Vercel deployment check passed for commit `b434585`; verify the final commit's checks before release. Its optional-field behavior and controlled provider failures were tested through BimpeAI Playground. The pull request has not been merged.

## Preview

- Stable branch URL: <https://lightline-git-feat-lightline-v01-yusuf-saheeds-projects.vercel.app>
- State: the feature Preview deployed successfully for `b434585`; verify the final commit's deployment check before release.
- Protection: Vercel Authentication is enabled on the stable branch URL. The saved BimpeAI action sends a static `x-vercel-protection-bypass` header. Vercel function logs confirmed that its test request, identified as `Bimpe-AI-Agent/1.0`, passed deployment protection and reached the Next.js complaint handler.
- Secrets: `DATABASE_URL`, `LIGHTLINE_TOOL_API_KEY`, and `OPERATOR_ACCESS_SECRET` are stored as hidden Vercel **Preview** secrets. The database URL points to LightLine's dedicated Neon development branch. A fresh dedicated tool key was saved write-only in both BimpeAI and Vercel Preview after the first BimpeAI test returned HTTP `401`; an incorrect staged bearer token was identified, though the exact reason for the response is not independently confirmed. The Preview was redeployed with the new key before the successful static test. Secret values are absent from Git.
- Verification: the landing page rendered in an authenticated browser session. A Vercel CLI request through deployment protection created fictional `DEMO` complaint `LL-0016` after Neon persistence. A BimpeAI Custom API Test request with a temporary static fictional payload created Neon development ticket `LL-0017` with HTTP `201`; same-key replay returned HTTP `200` and a Neon query confirmed one row. The dynamic templates were restored. Agent-driven Playground calls then persisted `LL-0019` through `LL-0024`. The initial no-meter call failed safely with HTTP `400`; after optional-field normalization, `LL-0023` persisted with all optional fields null, and `LL-0024` persisted a supplied account and phone. These two latest calls used distinct 32-character hexadecimal idempotency keys. Provider retry stability and a real inbound phone call remain unverified. On 4 October 2026, local validation on the current working tree passed: `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm run build`, and `npm test` (29 tests). `LIGHTLINE_E2E_DATABASE=1 npm run test:e2e` passed all five browser tests, including the live Neon case. That case replayed a persisted request with the same key, confirmed the original ticket was returned, then created six distinct tickets for the same fictional complaint payload with six fresh keys. It verifies the API contract for a caller that reuses its original key and that later identical complaints remain possible; it does not verify BimpeAI's retry identity or a real lost HTTP response from the provider.

## Neon development database

- Project: `LightLine` (`damp-salad-87040370`), created under Yusuf Saheed's account after checking for an existing LightLine project.
- Database: `lightline` on development branch `br-wispy-lab-b1hs8e01`. The production branch has not received the migration or demo data.
- Region: AWS `eu-central-1` (Frankfurt, Germany). Neon offered no Nigeria region during setup; Frankfurt was the closest appropriate available option for Lagos. The configured development connection hostname also identifies `eu-central-1`.
- Credentials: the connection URL remains in ignored local configuration and hidden Vercel Preview environment settings; its value is not recorded here.

## Production

The Vercel import first attempted to build `main`, which currently contains repository governance files rather than the v0.1 app. That initial build failed because `main` has no Next.js dependency. No production deployment is serving traffic. The Neon production branch is empty and has not received the migration or demo records. Do not interpret the failed initial build as a failure of the feature branch; its preview build completed.

## Remaining gates

1. **Resolve duplicate creation before release.** A manual retry after successful `LL-0024` created duplicate `LL-0040` with a new key. In a controlled lost-response case, `LL-0041` persisted before BimpeAI timed out. An immediate retry failed closed, but a later request for a fresh ticket for that same issue created `LL-0042`; Neon showed two keys and one identical request hash. Prompt and workflow rules are model-steered and passed only narrow follow-up checks. A stable provider-supported complaint identity or equivalent verified retry mechanism is needed. Automatic outbound retry behavior remains unverified. Controlled HTTP `404`, HTTP `503`, and nonpersisting timeout failures withheld ticket references. The normal action URL and timeout were restored, and temporary test routes removed.
2. When the owner receives the event host's reply, obtain the hackathon Temlio SIP-trunk allocation through BimpeAI, link its number to the LightLine agent, and complete a real voice-to-ticket test. The Yusuf account currently shows no number or SIP credentials. The owner asked us to leave phone allocation pending and will notify us after the host replies. No paid number was purchased.
3. Resolve the earlier workflow assignment to `Yusuf Saheed's Agent` through a supported BimpeAI action or provider guidance.
4. Complete owner manual acceptance testing, including no unsupported human-handoff claim. The agent once claimed a successful human transfer despite having only the complaint action enabled; the new workflow rule corrected that claim when challenged, but needs real-session verification. The independent standards pass found no AGENTS.md violation. The repeated operator-fetch error path was consolidated, and a browser test verifies a malformed gateway response shows a safe retry message.
5. Configure a production database and production secrets, then deploy the reviewed app when release gates permit.

## Reference

- [Vercel protection bypass for automation](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation) — documented header for server-to-server access to protected deployments.
