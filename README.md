# LightLine

LightLine turns a caller’s electricity complaint into a validated ticket that an operator can review and update. The v0.1 app includes a public explainer, an operator complaint register, and a server-side complaint API backed by PostgreSQL.

## Run locally

Requirements: Node.js 24 and npm. Install dependencies and create `.env.local` from the placeholder file:

```sh
npm ci
cp .env.example .env.local
```

Set a development Neon PostgreSQL `DATABASE_URL` and two different random secrets (at least 32 printable characters): `LIGHTLINE_TOOL_API_KEY` and `OPERATOR_ACCESS_SECRET`. Keep real values in `.env.local` or a secret store; it is ignored by Git. The app validates secrets when the corresponding server operation runs, so do not add `NEXT_PUBLIC_` versions.

Apply the checked-in migrations, then start the app:

```sh
npm run db:migrate
npm run dev
```

Open `http://localhost:3000`. Sign in at `/operator/login` using the operator secret; the complaint register is at `/dashboard`. Migration generation and deployment instructions are in [Architecture](docs/ARCHITECTURE.md).

## Useful commands

```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

CI runs lint, typecheck, unit/integration tests, build, and Playwright on Node 24. Check the current workflow status before treating those gates as passed.

The current Vercel preview and remaining release gates are recorded in [Deployment status](docs/DEPLOYMENT.md).

## API and operations

- `POST /api/complaints` accepts a tool-authenticated complaint and required `Idempotency-Key`; successful persistence returns a ticket reference.
- `GET /api/complaints` returns the authenticated operator’s paginated register and overview counts.
- `GET /api/complaints/{ticketId}` returns one complaint.
- `PATCH /api/complaints/{ticketId}` updates its status for an authenticated same-origin operator session.

See [Architecture](docs/ARCHITECTURE.md) for exact schemas, bounds, error behavior, and ticket/idempotency design. See [Acceptance plan](docs/ACCEPTANCE.md) for a manual end-to-end checklist.

## Voice provider status

BimpeAI is the voice/workflow layer. Yusuf's Development agent has a selected YarnGPT voice and a saved Custom API complaint action. A static action test created one Neon development ticket and same-key replay returned HTTP 200 without a duplicate. Agent-driven Playground tests then created tickets with required fields, a confirmed meter number, a confirmed account and phone, and absent optional fields. The latest no-identifier test persisted `LL-0023` with null optional fields; the account/phone test persisted `LL-0024`. The agent supplied distinct 32-character hexadecimal keys in these tests, but provider retry behavior remains unverified. The event host has been asked to allocate the hackathon Temlio route; no phone number, SIP credentials, or inbound channel are available yet. No paid number was purchased. KrosAI and Spitch are unused.

See [BimpeAI setup and limits](docs/BIMPEAI_SETUP.md) and [provider findings with first-party references](docs/PROVIDERS.md) before configuring or describing external voice service behavior.

## Contributing

Make focused changes on a feature branch and open a pull request to `main`. Include behavior, verification, schema/config changes, and limitations. Do not commit credentials. The repository’s [AGENTS.md](AGENTS.md) records scope and engineering constraints.

No license has been selected yet.
