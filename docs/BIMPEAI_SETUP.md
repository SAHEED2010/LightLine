# BimpeAI setup

This guide records verified BimpeAI account configuration for LightLine v0.1 and the remaining integration blockers.

## Current status

- **BimpeAI account:** inspected while authenticated as Yusuf Saheed. A dedicated `LightLine Complaint Intake` workflow and `LightLine Complaint Intake Agent` were created in Development. The workflow prompt is saved and the LightLine agent has `Mary YarnGPT [Female] English (NG)` selected in Settings → Voice. No voice ID is exposed in the dashboard UI.
- **Existing agent side effect:** `Yusuf Saheed's Agent` was selected when the workflow was initially saved. BimpeAI states that two agents use this shared workflow and edits affect all of them. The existing agent is therefore also assigned the LightLine workflow. Workflow ID: `cmus5pyvr02sipy87kqncsgbu`. Its dashboard has no visible workflow unassign action; current BimpeAI documentation describes `workflow_id` on agent update but does not document `null`/detachment semantics. Do not delete the shared workflow or send an undocumented null update. The owner has been told this needs manual correction or provider confirmation.
- **Bimpe integration:** `LightLine Preview` is saved as a Custom API integration with bearer authentication. Its enabled `Create LightLine complaint` action uses `POST /api/complaints`. The action requires `category`, `description`, `location`, and `idempotencyKey`; its JSON body template sends the first three, while its headers send a dynamic `Idempotency-Key` and a static Vercel protection bypass value. The action has not yet created a confirmed ticket.
- **Bimpe API keys:** none existed at inspection. The Generate API key modal has only an optional name field and no scope selector, so no account-wide key was created for read-only investigation.
- **Bimpe channels:** no phone numbers are assigned to the LightLine agent or available elsewhere on the team. No channel is connected or deployed. The agent remains in Development. The Telephony setup is an add-on that offers Nigerian local numbers with free setup and a quoted recurring price of ₦4,000 per month. No number was purchased; the owner specifically asked to use the hackathon Temlio route and not to create paid resources without approval.
- **Hackathon entitlement:** the public builder resource hub says Temlio numbers are available through BimpeAI. BimpeAI's event announcement specifies phone-number credits through a SIP trunk. The Yusuf account's `LAGOSHACKNIGHT` offer code was already redeemed on 2 October for a 30-day Starter trial and ₦5,000 wallet credit. This does not itself assign a Temlio number or SIP credentials. The account shows no number.
- **LightLine deployment URL:** the saved integration uses the stable branch Preview URL `https://lightline-git-feat-lightline-v01-yusuf-saheeds-projects.vercel.app`; its complaint endpoint is `/api/complaints`. Vercel Authentication protects this URL. The BimpeAI Test button sent a `POST`, and Vercel logs confirmed `Bimpe-AI-Agent/1.0` reached the Next.js function via the protection bypass. The handler returned HTTP `401`; an incorrect staged bearer token was identified and replaced with a fresh dedicated tool key, saved write-only in BimpeAI and Vercel Preview. Vercel requires redeployment for the changed environment value; no retest has occurred and no complaint was persisted through BimpeAI.
- **Custom API feature:** the saved action confirms that BimpeAI accepts a dynamic `{{idempotencyKey}}` header placeholder and a static bypass header in its configuration. Runtime substitution, generation of a stable key per logical complaint, provider retry behavior, and agent invocation still need successful live tests.
- **Phone/channel setup:** BimpeAI documentation says channel connections are managed on the Console Deploy screen. Its API can list channels but cannot create or remove a channel connection.
- **Temlio phone path:** the event materials establish Temlio through BimpeAI's SIP trunk, but the account has no provisioned Temlio number or SIP credentials. BimpeAI offers `Any SIP` import for a number already owned, requiring E.164 number, SIP host/port, username, and password, plus provider-side inbound forwarding to BimpeAI. There is no Temlio-specific dashboard option. See [PROVIDERS.md](PROVIDERS.md).

## LightLine complaint tool contract

The saved complaint action is configured as follows. Successful authorization and ticket creation remain unverified:

| Setting                 | Value                                                                  |
| ----------------------- | ---------------------------------------------------------------------- |
| Integration name        | `LightLine Preview`                                                    |
| Base URL                | Stable branch Preview URL above                                        |
| Tool name               | `Create LightLine complaint`                                           |
| Method                  | `POST`                                                                 |
| Path                    | `/api/complaints`                                                      |
| Authentication          | Bearer token containing the server-side `LIGHTLINE_TOOL_API_KEY` value |
| Required request header | Dynamic `Idempotency-Key` from the required `idempotencyKey` input     |
| Protection header       | Static `x-vercel-protection-bypass` in the saved action                |
| Request body            | `category`, `description`, and `location` only at present              |

The BimpeAI documentation demonstrates bearer authentication on a custom API integration (`auth_type: "bearer"` and `auth_config.token`). A dedicated Preview tool key is saved in the BimpeAI bearer configuration and Vercel Preview environment settings. Never put its value in a tool argument, prompt, repository, or client-side variable. The new Vercel environment value requires redeployment before the authentication test can be repeated.

The bearer secret must differ from `OPERATOR_ACCESS_SECRET`; LightLine rejects identical tool and operator secrets. Vercel's separate Preview protection bypass uses `x-vercel-protection-bypass` on every protected request. The saved action has this header and its first test reached the function. The bypass is distinct from the LightLine bearer token.

### Request JSON

```json
{
  "category": "METER",
  "description": "Prepaid meter stopped accepting tokens since yesterday",
  "location": "Yaba"
}
```

The saved action sends the three required body fields: `category`, `description`, and `location`. The API also supports optional `callerPhone`, `customerAccount`, `meterNumber`, `providerCallId`, `source`, and `priority`, but they are not mapped in this action yet. `source` defaults to `VOICE`; `priority` defaults to `NORMAL`. The API assigns status `OPEN`; do not send a status. The category must be one of `METER`, `BILLING`, `SERVICE_INTERRUPTION`, `DISCONNECTION`, `VOLTAGE`, `DELAY`, or `OTHER`.

The `Idempotency-Key` header is required and must match `^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$` (8–128 characters total). Generate a stable value per logical complaint creation and reuse it for provider retries. Do not generate a new key when retrying the same complaint.

### Success and failure

For a newly persisted complaint, LightLine returns HTTP `201`:

```json
{
  "success": true,
  "complaint": {
    "ticketId": "LL-0193",
    "status": "OPEN"
  },
  "replayed": false
}
```

For an idempotent retry of a previously persisted complaint, LightLine returns HTTP `200` with the original ticket and `"replayed": true`. Treat both success responses as confirmation only after the tool receives them. Tell the caller the returned `ticketId` only then.

Errors use a safe response envelope:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Complaint input is invalid."
  }
}
```

On any non-success response, timeout, or malformed response, do not say that a ticket was created and do not invent a ticket number. Ask the caller to clarify rejected details where appropriate, or explain that creation could not be confirmed and offer the configured human escalation path. Do not claim that a retry created a new ticket.

## Idempotency header capability: supported template, runtime behavior to verify

The first-party API reference for **Custom API — add tool** documents `body_params`, `body_template`, and `headers_template`; both templates accept `{{parameter}}` placeholders. The saved action declares `idempotencyKey` as a required input and uses `{{idempotencyKey}}` in the header template. It does not document automatic key generation or whether platform-level retries reuse the exact same tool arguments. Runtime substitution, caller/model input mapping, and retry behavior still need a successful live test. Keep the idempotency header dynamic; test a retry with the same key before relying on replay safety.

The dashboard integration form is integration-level; the action configuration is separate. The integration and action are saved, and the dedicated bearer key was submitted through the provider configuration. The first action test returned HTTP `401` before that key was replaced; the exact reason for that response is not independently confirmed. It cannot establish complaint persistence or ticket handling.

## Agent behavior

Use these instructions in the LightLine BimpeAI agent/workflow:

> You collect and classify electricity complaints for LightLine. Ask only for missing required details: complaint category, a clear description, and location. Confirm meter or account identifiers when supplied. Never request a PIN, password, or OTP. Call `Create LightLine complaint` only after the caller confirms the details. Speak a ticket reference only when the tool returns `success: true` with a ticket ID. If the tool fails, times out, or returns an invalid response, do not claim creation or make up a reference; explain that creation could not be confirmed and follow the configured escalation path. Do not diagnose electrical faults, assert outage/customer-record facts, or promise resolution times.

## Phone and channel setup

According to BimpeAI's current deployment guide, an operator connects channels from **Deploy**. For inbound telephony, the documented flow is to set up the Telephony card, provision or link a phone number under **Team settings → Phone numbers**, choose the voice profile and greeting under **Settings → Voice**, and test by dialing the number. The console also documents **Playground → Voice** for a pre-deployment voice check. These are documented platform steps; LightLine has not verified that the current account has telephony enabled, a number, a selected phone provider, or an inbound route.

The hackathon resource hub and BimpeAI announcement identify a Temlio SIP-trunk route through BimpeAI. The account's **Bring your own SIP** tab supports generic SIP import, including `Any SIP`, and says imported numbers have no Bimpe monthly number fee (usage still applies). It requires a number and SIP REGISTER credentials; the provider must forward inbound calls to BimpeAI's SIP URI. No such number or credentials are visible in this account, and the ordinary BimpeAI purchase path quotes a recurring charge. Do not buy a number or add a direct Temlio integration while the hackathon allocation remains unresolved.

## Verification checklist

1. Redeploy the stable Preview so Vercel applies the new tool key, then retest the saved BimpeAI action with a disposable complaint. Confirm authorization, Neon persistence, and the returned ticket reference.
2. Verify the saved action and Vercel Preview use the same dedicated bearer secret and that the bypass header continues to reach the function.
3. Verify runtime substitution of the required `idempotencyKey` input into the `Idempotency-Key` header. Confirm a fresh stable value is used per logical complaint and reused on retries.
4. Use a test agent/channel and a disposable complaint to verify input validation, persistence, the returned ticket reference, and retry replay behavior.
5. Verify a rejected request and an unavailable API never lead the agent to announce a ticket.
6. Complete an inbound phone acceptance test with an owner/human tester before treating phone intake as live.

The current dashboard is a real Yusuf Saheed account. The saved BimpeAI action reached the protected LightLine function on its first test, but its incorrect staged bearer token produced HTTP `401`. A new dedicated key is saved in both providers, pending Vercel redeployment and retest. No BimpeAI complaint was persisted and no ticket was returned. No phone number purchase or real customer call occurred. No Temlio number, SIP credentials, or telephony channel are available for this agent. The application tests (25), lint, typecheck, formatting, and build passed for `e54f390`, but they do not replace a live voice-to-ticket test.

## Sources

- [BimpeAI: Configuring integrations via the API](https://docs.bimpe.ai/docs/use-cases/configuring-integrations/) — Custom API integration registration, bearer auth example, and channel/API distinction.
- [BimpeAI: Custom API — add tool](https://docs.bimpe.ai/docs/api/agents/createTool/) — tool parameters, `body_template`, and dynamic `headers_template` placeholders.
- [BimpeAI: Deploying and testing channels](https://docs.bimpe.ai/docs/use-cases/deploying-and-testing-channels/) — dashboard channel setup, telephony number and voice profile steps, test flow.
- [BimpeAI: The Console dashboard](https://docs.bimpe.ai/docs/getting-started/dashboard/) — console sections and API key location.
- [BimpeAI: Python SDK resources](https://docs.bimpe.ai/docs/sdk/python/resources/) — documents `workflow_id` as an agent update field and the workflow-create/agent-bind pattern; does not document workflow detachment with a null workflow ID.
- [Lagos Agentic AI Hack Night builder resource hub](https://app.notion.com/p/samadekunle/04-Tools-Credits-Partner-Stack-3ec6a555a57681faa0cbee1703a448c1) — states that Temlio numbers are available through BimpeAI.
- [BimpeAI event announcement](https://uk.linkedin.com/company/bimpeai) — states that Temlio phone-number credits are provided through a SIP trunk inside BimpeAI.
- [Vercel protection bypass for automation](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation) — documents the request header for reaching protected Preview deployments.
