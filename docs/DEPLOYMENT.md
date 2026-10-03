# Deployment status

LightLine's Vercel project is `yusuf-saheeds-projects/lightline`, connected to `SAHEED2010/LightLine` under Yusuf Saheed's account. The feature implementation is on `feat/lightline-v0.1` and [draft pull request #2](https://github.com/SAHEED2010/LightLine/pull/2). The pull request has two passing GitHub Actions checks as of 3 October 2026. It has not been merged.

## Preview

- Deployment ID: `dpl_3eVSTEJyNcMVUX1Komc8RjcN578D`
- URL: <https://lightline-dlftcjcto-yusuf-saheeds-projects.vercel.app>
- State: ready; the Next.js build and TypeScript check passed on Vercel.
- Protection: Vercel Authentication is enabled. A BimpeAI server-to-server request cannot use this preview URL until a supported authentication/bypass route is configured or an appropriately reviewed public deployment is made.
- Secrets: `DATABASE_URL`, `LIGHTLINE_TOOL_API_KEY`, and `OPERATOR_ACCESS_SECRET` are stored as hidden Vercel **Preview** secrets. The database URL points to LightLine's dedicated Neon development branch. Their values are absent from Git.
- Verification: the landing page rendered in an authenticated browser session. A Vercel CLI request through the deployment protection created the fictional `DEMO` complaint `LL-0016` and returned HTTP success only after Neon persistence. This record remains in the development database.

## Production

The Vercel import first attempted to build `main`, which currently contains repository governance files rather than the v0.1 app. That initial build failed because `main` has no Next.js dependency. No production deployment is serving traffic. The Neon production branch is empty and has not received the migration or demo records. Do not interpret the failed initial build as a failure of the feature branch; its preview build completed.

## Remaining gates

1. Finish BimpeAI Custom API configuration and test a request-specific `Idempotency-Key` with safe retry behavior. The protected preview needs a supported way for BimpeAI to reach it.
2. Obtain the hackathon Temlio SIP-trunk allocation through BimpeAI, link its number to the LightLine agent, and complete a real voice-to-ticket test. The public event materials promise this route, but the Yusuf account currently shows no number or SIP credentials. Its ordinary Nigerian local number purchase option is quoted at ₦4,000 per month with free setup. The owner directed us not to purchase any paid resource without prior approval; no purchase was made.
3. Resolve the earlier workflow assignment to `Yusuf Saheed's Agent` through a supported BimpeAI action or provider guidance.
4. Address any actionable findings from the independent full-diff QA review, then complete owner manual acceptance testing. The standards pass found no AGENTS.md violation and one nonblocking repeated operator-fetch error path; the spec pass identified the live integration gates above and corrected documentation drift.
5. Configure a production database and production secrets, then deploy the reviewed app when release gates permit.
