# LightLine v0.1 acceptance plan

Use a development deployment and a clearly identified LightLine development database. Do not use real caller data. Set the operator and tool credentials in the server environment; keep them out of URLs, source files, shell history, screenshots, and logs.

## Local prerequisites

1. Install Node.js 24 and run `npm ci`.
2. Copy `.env.example` to `.env.local`; set a development `DATABASE_URL` and two different random secrets of at least 32 printable characters.
3. Run `npm run db:migrate`, then `npm run dev`.
4. Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. Install Chromium with `npx playwright install chromium`, then run `npm run test:e2e`. The default browser suite uses a fictional UI fixture and does not need a live database. Record the actual result; CI workflow presence alone does not mean checks passed.
5. To opt into the live Neon E2E, set `LIGHTLINE_E2E_DATABASE=1` in the shell and run `npm run test:e2e`. This uses `DATABASE_URL` from `.env.local`, creates fictional `DEMO` complaints, and leaves those verification records in the database. Only use a dedicated LightLine development database; unset the flag afterward.

## Operator and dashboard

1. Open `/` and confirm the explainer describes phone complaint intake without promising a utility resolution.
2. Open `/dashboard` while signed out. Confirm it redirects to operator login.
3. Sign in at `/operator/login` with `OPERATOR_ACCESS_SECRET`. Confirm the complaint register loads; sign out and confirm dashboard access is blocked again.
4. Confirm the empty register state is understandable. After creating test complaints below, confirm the reference, category, location, status, received time, filters, refresh, and pagination are usable.
5. Open a ticket detail page. Check description, supplied contact/account/meter fields, timestamps, priority, source, and status. Change status and confirm the saved value remains after refresh.
6. Try an unknown ticket reference and an invalid status update; confirm a safe 404/validation message and no data change.

## Complaint API

Create a disposable test request from a trusted local shell or API client. Use the configured development tool key and a new idempotency key. Example using `curl` with the environment variable already set by your shell:

```sh
curl -i http://localhost:3000/api/complaints \
  -H "Authorization: Bearer $LIGHTLINE_TOOL_API_KEY" \
  -H "Idempotency-Key: acceptance-call-0001" \
  -H "Content-Type: application/json" \
  --data '{"category":"METER","description":"Test meter stopped accepting tokens","location":"Yaba","meterNumber":"TEST-45001234"}'
```

Confirm HTTP 201 and a ticket reference only after insertion. Find the record in the operator register and detail page. Resend the exact body with the same key: expect HTTP 200, `replayed: true`, and the same ticket. Reuse the key with a changed location: expect HTTP 409 and no second record.

Try a missing required field, unsupported category, extra property, missing/malformed key, invalid bearer, non-JSON body, and oversized body. Confirm each fails with a structured safe response and no ticket. Stop or disconnect from the development database and confirm persistence failure does not return a success ticket. Restore the database afterward.

## Voice-provider acceptance

Provider dashboard setup is a separate external gate. Read [BIMPEAI_SETUP.md](BIMPEAI_SETUP.md) and [PROVIDERS.md](PROVIDERS.md) first. The current account has a Development agent/workflow and a selected YarnGPT voice, but the Custom API action, request-specific idempotency header, and phone channel remain unconfigured or unresolved. Do not treat a mock/API test as a phone-call acceptance test.

Configure a dynamic `Idempotency-Key` header using BimpeAI's documented `headers_template` support, and verify that a fresh stable value is used for each logical complaint and reused on retries. Configure the bearer credential in the provider’s secure integration settings and the server secret store. Then test with a test agent/channel and a disposable payload:

1. Speak: “My prepaid meter has stopped accepting tokens since yesterday. My meter number is 45001234 and I’m in Yaba.”
2. Confirm the agent collects only missing useful details, confirms the supplied identifier, and maps the report to a supported category.
3. Confirm a persisted ticket appears in the operator register and the caller hears only the returned ticket reference.
4. Cause a validation failure, timeout, or unavailable API. Confirm the agent does not claim a ticket was created and does not invent a reference.
5. Repeat a retried tool request with the same key and payload. Confirm the original reference is returned without a duplicate.
6. Complete and record one real inbound phone call before marking the phone path accepted.

## Current limits to record

- A protected Vercel preview deployment has been built and its API-to-development-database path verified with a fictional complaint. No inbound phone call or owner acceptance test has been completed; see [Deployment status](DEPLOYMENT.md).
- BimpeAI's tool schema documents dynamic HTTP header templates, but agent input mapping and retry stability have not been verified in a live tool call; see the provider setup guide.
- Temlio’s relationship to the inspected BimpeAI telephony account is unconfirmed. YarnGPT was available and selected within BimpeAI; no direct YarnGPT API is used. KrosAI and Spitch are not used for v0.1.
- Do not interpret absence of seeded records as a service error. Demo records, if added later, must be clearly identified and never automatically seeded in production.
