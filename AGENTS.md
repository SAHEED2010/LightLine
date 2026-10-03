# LightLine repository instructions

## Product and architecture

LightLine is a voice-first electricity complaint intake system for Nigeria. The core path is: caller speaks naturally -> voice agent collects and classifies the complaint -> approved complaint-creation tool calls the API -> server validates and stores it -> dashboard shows it -> caller receives a human-readable ticket reference. The outcome is an unstructured complaint becoming a structured ticket and visible operational action. For the hackathon, the application database may stand in for the utility's internal ticketing system.

- Build the smallest end-to-end workflow in one Next.js App Router project: strict TypeScript, Tailwind CSS, shadcn/ui when useful, Route Handlers, Zod, Supabase/PostgreSQL, and Vercel. Use Supabase Realtime only where it improves dashboard updates.
- BimpeAI is the primary voice-agent/workflow platform, with Temlio phone infrastructure and YarnGPT voice through BimpeAI. Add KrosAI only for an actual outbound-calling need and Spitch only for a needed direct speech/language integration. Verify provider behavior from current documentation or a working integration before relying on it.
- Keep the voice tool surface small. Introduce separate services, queues, event buses, state-management libraries, external services, or multi-agent orchestration only when a concrete requirement justifies them; explain significant architectural expansion first.
- Keep the initial MVP focused on complaint intake and visibility. Defer payments, token purchasing, smart-meter and undocumented DisCo CRM integrations, large analytics, maps, customer mobile apps, complicated authentication, blockchain, and broad multilingual claims until explicitly requested and validated.

## Complaint data and API

- The initial complaint model is expected to cover `id`, `ticket_id`, `caller_phone`, `customer_account`, `meter_number`, `category`, `description`, `location`, `priority`, `status`, `created_at`, and `updated_at`. Confirm fields and business rules before changing the schema.
- Centralize strongly typed categories (`METER`, `BILLING`, `SERVICE_INTERRUPTION`, `DISCONNECTION`, `VOLTAGE`, `DELAY`, `OTHER`) and initial statuses (`OPEN`, `REVIEWING`, `RESOLVED`, `ESCALATED`). Share domain types where appropriate; avoid `any` and incompatible complaint representations.
- The creation API accepts structured JSON, validates it server-side with Zod or equivalent, rejects invalid categories/statuses, generates a unique human-readable reference such as `LL-0193`, persists the complaint, and returns a predictable response. Report success and a ticket reference only after persistence succeeds; do not expose raw UUIDs to callers unless necessary.
- Validate model-generated tool arguments and external webhook/form input at system boundaries. Surface validation, database, provider, and tool failures; make caller-facing failures safe.

## Voice and dashboard behavior

- The voice agent may understand and classify a complaint, collect missing required information, confirm important identifiers, create a complaint through an approved tool, retrieve status when that feature exists, and return approved process information.
- Ground replies in confirmed data. Do not diagnose electrical faults, invent outages, customer records, ticket status, regulatory information, utility action, or unsupported resolution times. Speak a ticket number only after the backend confirms successful creation.
- Make the workflow visible through recent complaints, ticket reference, category, location, status, creation time, and a complaint detail view. Complete the call-to-ticket path before expanding into a large admin portal.
- If realtime is used, connect database inserts to Supabase Realtime dashboard updates, with a normal fetch path when events are delayed.

## Security

- Keep secrets and credential-containing `.env` files out of Git. Add only placeholders to `.env.example` when environment variables are introduced. Keep Supabase service-role, BimpeAI, telephony, and API credentials server-side.
- Never request a caller's PIN, password, or OTP for the LightLine MVP.

## Working in this repository

- Inspect relevant code before editing. Make the smallest coherent change, preserve established conventions, avoid unrelated rewrites, and keep PRs focused. Do not invent credentials, provider capabilities, external API behavior, database fields, or business rules; isolate uncertain integrations behind clear interfaces or mocks.
- Add dependencies only for a specific problem after checking whether the existing stack solves it; prefer maintained libraries without overlapping roles.
- Treat `main` as the protected integration branch. Start focused branches from the latest `main` (for example `feat/complaint-api`, `feat/dashboard`, `feat/voice-agent`, `fix/ticket-generation`, `docs/architecture`, or `chore/repository-governance`). Make normal development changes through a PR to `main`; address review feedback and merge after required checks and reviews pass. Prefer squash merging for normal feature PRs. Never force-push or delete `main`.
- PR descriptions should state what changed, why, how it was tested, database/schema and environment/config changes, and known limitations.
- Use repository-defined scripts when they exist. Run relevant formatting, lint, typecheck, tests, and build checks. For complaint-workflow changes, verify input -> validation -> creation -> database record -> returned ticket reference when practical. For voice-tool changes, verify failures cannot announce nonexistent tickets.
- Consider work done when requested behavior works, types and runtime validation agree, relevant checks pass, failures are handled safely, secrets remain private, relevant docs are current, and the change fits LightLine's scope.
