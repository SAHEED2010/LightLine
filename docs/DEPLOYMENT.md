# Deployment status

LightLine's Vercel project is `yusuf-saheeds-projects/lightline`, connected to `SAHEED2010/LightLine` under Yusuf Saheed's account. The feature implementation is on `feat/lightline-v0.1` and [draft pull request #2](https://github.com/SAHEED2010/LightLine/pull/2). Commit `c0556fa` passed both GitHub Actions quality checks and Vercel deployment checks on 4 October 2026. Its deployed optional-field behavior was verified through BimpeAI Playground. The pull request has not been merged.

## Preview

- Stable branch URL: <https://lightline-git-feat-lightline-v01-yusuf-saheeds-projects.vercel.app>
- Latest verified deployment ID: `dpl_43qPcqMkyK2jwq7fzi27tUVU4C5V`
- State: ready; the Next.js build and TypeScript check passed on Vercel.
- Protection: Vercel Authentication is enabled on the stable branch URL. The saved BimpeAI action sends a static `x-vercel-protection-bypass` header. Vercel function logs confirmed that its test request, identified as `Bimpe-AI-Agent/1.0`, passed deployment protection and reached the Next.js complaint handler.
- Secrets: `DATABASE_URL`, `LIGHTLINE_TOOL_API_KEY`, and `OPERATOR_ACCESS_SECRET` are stored as hidden Vercel **Preview** secrets. The database URL points to LightLine's dedicated Neon development branch. A fresh dedicated tool key was saved write-only in both BimpeAI and Vercel Preview after the first BimpeAI test returned HTTP `401`; an incorrect staged bearer token was identified, though the exact reason for the response is not independently confirmed. The Preview was redeployed with the new key before the successful static test. Secret values are absent from Git.
- Verification: the landing page rendered in an authenticated browser session. A Vercel CLI request through deployment protection created fictional `DEMO` complaint `LL-0016` after Neon persistence. A BimpeAI Custom API Test request with a temporary static fictional payload created Neon development ticket `LL-0017` with HTTP `201`; same-key replay returned HTTP `200` and a Neon query confirmed one row. The dynamic templates were restored. Agent-driven Playground calls then persisted `LL-0019` through `LL-0024`. The initial no-meter call failed safely with HTTP `400`; after optional-field normalization, `LL-0023` persisted with all optional fields null, and `LL-0024` persisted a supplied account and phone. These two latest calls used distinct 32-character hexadecimal idempotency keys. Provider retry stability and a real inbound phone call remain unverified. Local validation for `c0556fa`: 29 tests, typecheck, and targeted formatting passed; both GitHub quality checks and Vercel passed.

## Production

The Vercel import first attempted to build `main`, which currently contains repository governance files rather than the v0.1 app. That initial build failed because `main` has no Next.js dependency. No production deployment is serving traffic. The Neon production branch is empty and has not received the migration or demo records. Do not interpret the failed initial build as a failure of the feature branch; its preview build completed.

## Remaining gates

1. Verify provider retry stability: the revised workflow instructs a fresh 32-character hexadecimal key per complaint and exact reuse on retry, and the latest calls used distinct keys. Confirm an unavailable API cannot cause a false success announcement; the observed validation failure was handled safely, but an outage was not exercised.
2. Obtain the hackathon Temlio SIP-trunk allocation through BimpeAI, link its number to the LightLine agent, and complete a real voice-to-ticket test. The public event materials promise this route, but the Yusuf account currently shows no number or SIP credentials. A request for this route was submitted to the event host through Luma. Its ordinary Nigerian local number purchase option is quoted at ₦4,000 per month with free setup. The owner directed us not to purchase any paid resource without prior approval; no purchase was made.
3. Resolve the earlier workflow assignment to `Yusuf Saheed's Agent` through a supported BimpeAI action or provider guidance.
4. Address any actionable findings from the independent full-diff QA review, then complete owner manual acceptance testing. The standards pass found no AGENTS.md violation and one nonblocking repeated operator-fetch error path; the spec pass identified the live integration gates above and corrected documentation drift.
5. Configure a production database and production secrets, then deploy the reviewed app when release gates permit.

## Reference

- [Vercel protection bypass for automation](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation) — documented header for server-to-server access to protected deployments.
