# BimpeAI setup

This guide records verified BimpeAI account configuration for LightLine v0.1 and the remaining integration blockers.

## Current status

- **BimpeAI account:** inspected while authenticated as Yusuf Saheed. A dedicated `LightLine Complaint Intake` workflow and `LightLine Complaint Intake Agent` were created in Development. The workflow prompt is saved and the LightLine agent has `Mary YarnGPT [Female] English (NG)` selected in Settings → Voice. No voice ID is exposed in the dashboard UI.
- **Existing agent side effect:** `Yusuf Saheed's Agent` was selected when the workflow was initially saved. BimpeAI states that two agents use this shared workflow and edits affect all of them. The existing agent is therefore also assigned the LightLine workflow. Workflow ID: `cmus5pyvr02sipy87kqncsgbu`. Its dashboard has no visible workflow unassign action; current BimpeAI documentation describes `workflow_id` on agent update but does not document `null`/detachment semantics. Do not delete the shared workflow or send an undocumented null update. The owner has been told this needs manual correction or provider confirmation.
- **Bimpe integrations:** the Custom API integrations list was empty. Its Add Integration form exposes name, description, base URL, auth type/token, and optional test endpoint. No integration or action/tool was configured. The separate first-party Custom API tool schema documents declared body parameters, a body template, and an HTTP `headers_template` with `{{parameter}}` placeholders.
- **Bimpe API keys:** none existed at inspection. The Generate API key modal has only an optional name field and no scope selector, so no account-wide key was created for read-only investigation.
- **Bimpe channels:** no phone numbers are assigned to the LightLine agent or available elsewhere on the team. No channel is connected or deployed. The agent remains in Development. The Telephony setup is an add-on that offers Nigerian local numbers with free setup and a quoted recurring price of ₦4,000 per month. No number was purchased; the owner specifically asked to use the hackathon Temlio route and not to create paid resources without approval.
- **Hackathon entitlement:** the public builder resource hub says Temlio numbers are available through BimpeAI. BimpeAI's event announcement specifies phone-number credits through a SIP trunk. The Yusuf account's `LAGOSHACKNIGHT` offer code was already redeemed on 2 October for a 30-day Starter trial and ₦5,000 wallet credit. This does not itself assign a Temlio number or SIP credentials. The account shows no number.
- **LightLine deployment URL:** a protected Vercel Preview is ready at `https://lightline-dlftcjcto-yusuf-saheeds-projects.vercel.app`. Its complaint endpoint is `/api/complaints`. Vercel Authentication currently blocks BimpeAI server requests to that preview; do not enter it as a working BimpeAI base URL until a supported access route is configured.
- **Custom API feature:** confirmed in current BimpeAI documentation. A custom HTTP API integration can be configured for an agent, then one or more HTTP tools can be registered under it. The full tool schema documents body parameters, a body template, and an HTTP header template with dynamic placeholders. The exact agent input mapping and retry behavior still need a live tool test.
- **Phone/channel setup:** BimpeAI documentation says channel connections are managed on the Console Deploy screen. Its API can list channels but cannot create or remove a channel connection.
- **Temlio phone path:** the event materials establish Temlio through BimpeAI's SIP trunk, but the account has no provisioned Temlio number or SIP credentials. BimpeAI offers `Any SIP` import for a number already owned, requiring E.164 number, SIP host/port, username, and password, plus provider-side inbound forwarding to BimpeAI. There is no Temlio-specific dashboard option. See [PROVIDERS.md](PROVIDERS.md).

## LightLine complaint tool contract

Configure one tool for complaint creation after the LightLine HTTPS deployment exists:

| Setting                 | Value                                                                  |
| ----------------------- | ---------------------------------------------------------------------- |
| Integration name        | `LightLine`                                                            |
| Base URL                | `https://<deployment-host>`                                            |
| Tool name               | `Create LightLine complaint`                                           |
| Method                  | `POST`                                                                 |
| Path                    | `/api/complaints`                                                      |
| Authentication          | Bearer token containing the server-side `LIGHTLINE_TOOL_API_KEY` value |
| Required request header | `Idempotency-Key`                                                      |
| Request body            | JSON below                                                             |

The BimpeAI documentation demonstrates bearer authentication on a custom API integration (`auth_type: "bearer"` and `auth_config.token`). Put the actual key only in BimpeAI's secure integration settings and the LightLine runtime secret store. Never put it in a tool argument, prompt, repository, or client-side variable.

### Request JSON

```json
{
  "category": "METER",
  "description": "Prepaid meter stopped accepting tokens since yesterday",
  "location": "Yaba",
  "callerPhone": "+2348000000000",
  "meterNumber": "45001234",
  "providerCallId": "provider-call-id-if-available",
  "source": "VOICE",
  "priority": "NORMAL"
}
```

Required body fields are `category`, `description`, and `location`. Optional fields are `callerPhone`, `customerAccount`, `meterNumber`, `providerCallId`, `source`, and `priority`. `source` defaults to `VOICE`; `priority` defaults to `NORMAL`. The API assigns status `OPEN`; do not send a status. The category must be one of `METER`, `BILLING`, `SERVICE_INTERRUPTION`, `DISCONNECTION`, `VOLTAGE`, `DELAY`, or `OTHER`.

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

The first-party API reference for **Custom API — add tool** documents `body_params`, `body_template`, and `headers_template`; both templates accept `{{parameter}}` placeholders. This supports a per-invocation header template in principle. It does not document automatic idempotency-key generation or whether platform-level retries reuse the exact same tool arguments. The `ParameterDefinitionDto` structure and caller/model-facing field mapping still need confirmation in the tool editor or SDK schema. Configure the header as a dynamic placeholder, never a static fixed key; test a retry with the same key before relying on replay safety.

The dashboard integration form is integration-level only; the tool schema is documented separately in the API reference. The live dashboard was inspected; no endpoint or secret was entered.

## Agent behavior

Use these instructions in the LightLine BimpeAI agent/workflow:

> You collect and classify electricity complaints for LightLine. Ask only for missing required details: complaint category, a clear description, and location. Confirm meter or account identifiers when supplied. Never request a PIN, password, or OTP. Call `Create LightLine complaint` only after the caller confirms the details. Speak a ticket reference only when the tool returns `success: true` with a ticket ID. If the tool fails, times out, or returns an invalid response, do not claim creation or make up a reference; explain that creation could not be confirmed and follow the configured escalation path. Do not diagnose electrical faults, assert outage/customer-record facts, or promise resolution times.

## Phone and channel setup

According to BimpeAI's current deployment guide, an operator connects channels from **Deploy**. For inbound telephony, the documented flow is to set up the Telephony card, provision or link a phone number under **Team settings → Phone numbers**, choose the voice profile and greeting under **Settings → Voice**, and test by dialing the number. The console also documents **Playground → Voice** for a pre-deployment voice check. These are documented platform steps; LightLine has not verified that the current account has telephony enabled, a number, a selected phone provider, or an inbound route.

The hackathon resource hub and BimpeAI announcement identify a Temlio SIP-trunk route through BimpeAI. The account's **Bring your own SIP** tab supports generic SIP import, including `Any SIP`, and says imported numbers have no Bimpe monthly number fee (usage still applies). It requires a number and SIP REGISTER credentials; the provider must forward inbound calls to BimpeAI's SIP URI. No such number or credentials are visible in this account, and the ordinary BimpeAI purchase path quotes a recurring charge. Do not buy a number or add a direct Temlio integration while the hackathon allocation remains unresolved.

## Verification checklist

1. Deploy LightLine and replace the endpoint placeholder with its HTTPS URL.
2. Store the same dedicated tool bearer secret in the LightLine server environment and the BimpeAI integration's secure bearer configuration.
3. Verify the tool can set or produce the required `Idempotency-Key` header; then inspect the saved method, URL, auth mode, request fields, and tool description in the BimpeAI console.
4. Use a test agent/channel and a disposable complaint to verify input validation, persistence, the returned ticket reference, and retry replay behavior.
5. Verify a rejected request and an unavailable API never lead the agent to announce a ticket.
6. Complete an inbound phone acceptance test with an owner/human tester before treating phone intake as live.

The current dashboard is a real Yusuf Saheed account. No BimpeAI Custom API action, phone number purchase, real customer call, or complaint-tool test was performed. A protected LightLine Vercel Preview and a fictional direct API test exist; these do not verify BimpeAI access or telephony. No telephony channel is enabled for this agent.

## Sources

- [BimpeAI: Configuring integrations via the API](https://docs.bimpe.ai/docs/use-cases/configuring-integrations/) — Custom API integration registration, bearer auth example, and channel/API distinction.
- [BimpeAI: Custom API — add tool](https://docs.bimpe.ai/docs/api/agents/createTool/) — tool parameters, `body_template`, and dynamic `headers_template` placeholders.
- [BimpeAI: Deploying and testing channels](https://docs.bimpe.ai/docs/use-cases/deploying-and-testing-channels/) — dashboard channel setup, telephony number and voice profile steps, test flow.
- [BimpeAI: The Console dashboard](https://docs.bimpe.ai/docs/getting-started/dashboard/) — console sections and API key location.
- [BimpeAI: Python SDK resources](https://docs.bimpe.ai/docs/sdk/python/resources/) — documents `workflow_id` as an agent update field and the workflow-create/agent-bind pattern; does not document workflow detachment with a null workflow ID.
- [Lagos Agentic AI Hack Night builder resource hub](https://app.notion.com/p/samadekunle/04-Tools-Credits-Partner-Stack-3ec6a555a57681faa0cbee1703a448c1) — states that Temlio numbers are available through BimpeAI.
- [BimpeAI event announcement](https://uk.linkedin.com/company/bimpeai) — states that Temlio phone-number credits are provided through a SIP trunk inside BimpeAI.
