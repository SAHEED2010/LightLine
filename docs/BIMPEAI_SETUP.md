# BimpeAI setup

This guide records verified BimpeAI account configuration for LightLine v0.1 and the remaining integration blockers.

## Current status

- **BimpeAI account:** inspected while authenticated as Yusuf Saheed. A dedicated `LightLine Complaint Intake` workflow and `LightLine Complaint Intake Agent` were created in Development. The workflow prompt is saved and the LightLine agent has `Mary YarnGPT [Female] English (NG)` selected in Settings → Voice. No voice ID is exposed in the dashboard UI.
- **Existing agent side effect:** `Yusuf Saheed's Agent` was selected when the workflow was initially saved. BimpeAI states that two agents use this shared workflow and edits affect all of them. The existing agent is therefore also assigned the LightLine workflow. Workflow ID: `cmus5pyvr02sipy87kqncsgbu`. Its dashboard has no visible workflow unassign action; current BimpeAI documentation describes `workflow_id` on agent update but does not document `null`/detachment semantics. Do not delete the shared workflow or send an undocumented null update. The owner has been told this needs manual correction or provider confirmation.
- **Bimpe integration:** `LightLine Preview` is saved as a Custom API integration with bearer authentication. Its enabled `Create LightLine complaint` action uses `POST /api/complaints`. The action requires `category`, `description`, `location`, and `idempotencyKey`; its body template also maps optional `meterNumber`, `customerAccount`, and `callerPhone`. Its headers send a dynamic `Idempotency-Key` and a static Vercel protection bypass value. A static fictional test created `LL-0017` in Neon. Agent-driven Playground calls later created `LL-0019` through `LL-0024`, and a manual retry after success created duplicate `LL-0040`.
- **Bimpe API keys:** none existed at inspection. The Generate API key modal has only an optional name field and no scope selector, so no account-wide key was created for read-only investigation.
- **Bimpe channels:** no phone numbers are assigned to the LightLine agent or available elsewhere on the team. No channel is connected or deployed. The agent remains in Development. The Telephony setup is an add-on that offers Nigerian local numbers with free setup and a quoted recurring price of ₦4,000 per month. No number was purchased; the owner specifically asked to use the hackathon Temlio route and not to create paid resources without approval.
- **Hackathon entitlement:** the public builder resource hub says Temlio numbers are available through BimpeAI. BimpeAI's event announcement specifies phone-number credits through a SIP trunk. The Yusuf account's `LAGOSHACKNIGHT` offer code was already redeemed on 2 October for a 30-day Starter trial and ₦5,000 wallet credit. This does not itself assign a Temlio number or SIP credentials. A request for the hackathon Temlio/BimpeAI route was submitted to the event host through Luma. No allocation has appeared in the account.
- **LightLine deployment URL:** the saved integration uses the stable branch Preview URL `https://lightline-git-feat-lightline-v01-yusuf-saheeds-projects.vercel.app`; its complaint endpoint is `/api/complaints`. Vercel Authentication protects this URL. The BimpeAI Test button sent a `POST`, and Vercel logs confirmed `Bimpe-AI-Agent/1.0` reached the Next.js function via the protection bypass. An initial test returned HTTP `401`; an incorrect staged bearer token was identified and replaced with a fresh dedicated tool key, saved write-only in BimpeAI and Vercel Preview. After redeployment, a temporary static fictional request returned HTTP `201` and persisted `LL-0017` in Neon. Repeating it with the same key returned HTTP `200`; a Neon query found exactly one row for that key.
- **Custom API feature:** Playground calls confirmed substitution of required fields, supplied meter/account/phone values, and `idempotencyKey`. BimpeAI may send empty strings or unresolved `{{field}}` markers for omitted optional fields. The API now normalizes those exact absent-field representations. Conversational retries created duplicates after a confirmed success (`LL-0040`) and after a persisted complaint's response timed out (`LL-0042`); both used new keys. Controlled HTTP `404`, HTTP `503`, and nonpersisting timeout tests returned no ticket reference and created no matching Neon row. The action URL and original timeout were restored. Stable provider retry identity remains a release blocker.
- **Phone/channel setup:** BimpeAI documentation says channel connections are managed on the Console Deploy screen. Its API can list channels but cannot create or remove a channel connection.
- **Temlio phone path:** the event materials establish Temlio through BimpeAI's SIP trunk, but the account has no provisioned Temlio number or SIP credentials. BimpeAI offers `Any SIP` import for a number already owned, requiring E.164 number, SIP host/port, username, and password, plus provider-side inbound forwarding to BimpeAI. There is no Temlio-specific dashboard option. See [PROVIDERS.md](PROVIDERS.md).

## LightLine complaint tool contract

The saved complaint action is configured as follows. Static and agent-driven Playground tests reached the API and persisted tickets:

| Setting                 | Value                                                                                               |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| Integration name        | `LightLine Preview`                                                                                 |
| Base URL                | Stable branch Preview URL above                                                                     |
| Tool name               | `Create LightLine complaint`                                                                        |
| Method                  | `POST`                                                                                              |
| Path                    | `/api/complaints`                                                                                   |
| Authentication          | Bearer token containing the server-side `LIGHTLINE_TOOL_API_KEY` value                              |
| Required request header | Dynamic `Idempotency-Key` from the required `idempotencyKey` input                                  |
| Protection header       | Static `x-vercel-protection-bypass` in the saved action                                             |
| Request body            | `category`, `description`, `location`, and optional `meterNumber`, `customerAccount`, `callerPhone` |

The BimpeAI documentation demonstrates bearer authentication on a custom API integration (`auth_type: "bearer"` and `auth_config.token`). A dedicated Preview tool key is saved in the BimpeAI bearer configuration and Vercel Preview environment settings. Never put its value in a tool argument, prompt, repository, or client-side variable. The Preview was redeployed with this key before the successful static test.

The bearer secret must differ from `OPERATOR_ACCESS_SECRET`; LightLine rejects identical tool and operator secrets. Vercel's separate Preview protection bypass uses `x-vercel-protection-bypass` on every protected request. The saved action has this header and its first test reached the function. The bypass is distinct from the LightLine bearer token.

### Request JSON

```json
{
  "category": "METER",
  "description": "Prepaid meter stopped accepting tokens since yesterday",
  "location": "Yaba"
}
```

The saved action sends the three required body fields and maps optional `meterNumber`, `customerAccount`, and `callerPhone`. The API also supports `providerCallId`, `source`, and `priority`, but those are not mapped in this action. A read-only query of the LightLine development database found 9 `VOICE` records and zero populated `provider_call_id` values. `source` defaults to `VOICE`; `priority` defaults to `NORMAL`. The API assigns status `OPEN`; do not send a status. The category must be one of `METER`, `BILLING`, `SERVICE_INTERRUPTION`, `DISCONNECTION`, `VOLTAGE`, `DELAY`, or `OTHER`.

When an optional value is absent, BimpeAI may send an empty string or leave its literal `{{field}}` marker in the body. The initial no-meter Playground call returned HTTP `400`; the agent correctly said it could not confirm a ticket. Commits `5e3043c` and `c0556fa` normalize blank values and exact unresolved optional-field markers to absence. A deployed Playground test then persisted `LL-0023` with all three optional fields `null`; the agent announced the returned reference.

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

On any non-success response, timeout, or malformed response, do not say that a ticket was created and do not invent a ticket number. Ask the caller to clarify rejected details where appropriate, or explain that creation could not be confirmed and needs human review. No live transfer action is configured for this agent; do not claim a transfer or callback. Do not claim that a retry created a new ticket.

## Idempotency header capability: supported template, runtime behavior to verify

The first-party API reference for **Custom API — add tool** documents `body_params`, `body_template`, and `headers_template`; both templates accept `{{parameter}}` placeholders. The saved action declares `idempotencyKey` as a required input and uses `{{idempotencyKey}}` in the header template. Playground tickets `LL-0023` and `LL-0024` used distinct 32-character hexadecimal keys. The provider does not document automatic outbound key generation or whether platform-level retries reuse the same tool arguments. The static replay test proves LightLine's server-side same-key behavior through BimpeAI. It does not prove the agent preserves the key across conversational retries.

On 4 October 2026, asking the agent to retry the already successful fictional billing complaint `LL-0024` created `LL-0040`. A Neon query showed identical category, description, location, account, and phone, with different 32-character keys. The API correctly treated these as two submissions because the agent changed the key. Both development records remain as evidence; neither is a real customer complaint. The workflow prompt now says that a confirmed ticket must never be resubmitted: the agent should repeat the existing reference. For an unconfirmed submission, it may retry only with the exact original key and unchanged details; if that key is unavailable, it must fail closed and offer human follow-up. A subsequent Playground request to retry successful `LL-0040` was refused, and the development database still contained exactly those two matching records. This is a prompt-level mitigation, not proof that automatic platform retries preserve tool arguments. The SDK's documented idempotency for calls to BimpeAI's own API does not establish behavior for outbound Custom API actions.

The saved Custom API action description was also aligned with that rule: it now tells the agent never to call the tool again for an already successful complaint, and to retry an uncertain submission only with its original key and unchanged details. A further Playground request to submit confirmed `LL-0040` again was refused; Neon still showed only `LL-0024` and `LL-0040` for those fictional details. The saved action card still showed `/api/complaints`. These conversational checks do not prove behavior when BimpeAI itself automatically retries an outbound HTTP request.

A controlled lost-response test then used a temporary protected Preview route that performed the normal authenticated validation and database insert, but delayed its HTTP success response for five seconds. With the BimpeAI action timeout temporarily set to one second, a newly confirmed fictional `VOLTAGE` complaint at `9 Test Close, Yaba, Lagos` persisted as `LL-0041` in the development database while the agent reported a timeout and withheld a ticket reference. On an immediate request to retry, the agent said it could not recover the original key and made no second submission. After the action description was tightened, a later request for a **fresh ticket for that same issue** led the agent to reconfirm the same details and create `LL-0042`. A Neon query found two rows, two distinct idempotency keys, and one identical canonical request hash. The workflow prompt was made more explicit, but another request for a fresh ticket after an uncertain HTTP `503` response still reached reconfirmation. A new active workflow rule then refused a follow-up for that HTTP `503` issue; Neon still had no matching row. This is one guardrail check, not a reliable duplicate guarantee. The action was restored to `/api/complaints` with its original 30-second timeout, and the temporary route was removed from the branch.

**Release blocker:** the current agent can turn an uncertain prior submission into a new key and a duplicate ticket when the caller describes it as a fresh ticket. Prompt wording and a model-steered workflow rule reduce some cases but have not proven consistent protection. The backend correctly deduplicates requests only when the same key is reused. The current first-party Custom API tool schema documents declared URL/body parameters and `{{parameter}}` interpolation in URL, body, and header templates. It does not document implicit tool-invocation, action-execution, request-execution, conversation, or call IDs as template values. BimpeAI exposes conversation and call IDs through separate Console API resources, but its docs do not say those values are passed into outbound Custom API actions. The currently saved action does not send `providerCallId`, and all 9 existing `VOICE` records have it null. The signed-in action editor's variable picker and a live phone invocation have not been verified in this pass. Do not implement a `providerCallId`-based duplicate safeguard until the provider action is configured to send a verified stable identifier and a live request confirms it is populated. Do not implement broad payload-based deduplication: two different callers may report identical faults at the same location.

On 4 October 2026, the opt-in live Neon E2E forwarded a fictional request through a local proxy, confirmed the API had persisted it, and dropped the HTTP response before the test caller received it. Retrying with the same idempotency key returned the original ticket. A Neon aggregate query showed seven rows with seven distinct keys and ticket IDs for that exact payload: one initial request plus six later requests with fresh keys. This verifies LightLine's API and database behavior when a retry reuses its key, and that identical wording is not globally deduplicated. It does not verify BimpeAI's outbound retry behavior or protect against a new key after an uncertain response.

The agent also claimed it had successfully transferred the caller to a human, although the agent's Actions tab showed only `Create LightLine complaint` and no handoff action was observed. The workflow prompt and a second active rule now forbid claiming a transfer, callback, or escalation without explicit configured-action success. When challenged in a later Playground turn, the agent corrected the claim and said no live handoff was available. That correction does not prove every future response will be grounded. The shared workflow still applies to two account agents.

The dashboard integration form is integration-level; the action configuration is separate. The integration and action are saved, and the dedicated bearer key was submitted through the provider configuration. The first action test returned HTTP `401` before that key was replaced; the exact reason for that response is not independently confirmed. After redeployment, a temporary static request and same-key replay returned HTTP `201` and `200` in Vercel function logs, with one confirmed Neon row (`LL-0017`). The dynamic templates were restored afterward. Playground calls demonstrated agent invocation and persistence for supplied and absent optional fields. The earlier no-meter HTTP `400` provided a safe failure-behavior observation; the validation issue was fixed and retested.

## Playground test evidence

These tests used fictional complaint details in the LightLine development database after the caller confirmed the details:

| Ticket    | Category               | Observed result                                                                                                                                                     |
| --------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LL-0019` | `METER`                | Agent-generated action persisted the required complaint fields correctly.                                                                                           |
| `LL-0020` | `BILLING`              | Embedded quotation marks in the description persisted correctly.                                                                                                    |
| `LL-0021` | `SERVICE_INTERRUPTION` | The confirmed meter number `45001234` was persisted in `meterNumber`.                                                                                               |
| `LL-0022` | `VOLTAGE`              | A previously failed complaint persisted after blank optional-field normalization; account and phone placeholders were then found in this row before the marker fix. |
| `LL-0023` | `DELAY`                | After the marker fix, meter, account, and phone all persisted as `null`; the agent announced the returned ticket.                                                   |
| `LL-0024` | `BILLING`              | Confirmed `customerAccount` and `callerPhone` values persisted correctly.                                                                                           |
| `LL-0040` | `BILLING`              | Manual retry of the already successful `LL-0024` used a new key and created a duplicate; this revealed an agent retry defect.                                       |
| `LL-0041` | `VOLTAGE`              | Controlled lost-response test persisted before BimpeAI timed out; the agent initially withheld the reference.                                                       |
| `LL-0042` | `VOLTAGE`              | Later fresh-ticket request for the same uncertain `LL-0041` issue used a new key and created a duplicate with the same request hash.                                |

These were Playground interactions, not inbound phone calls. The first no-meter request returned HTTP `400` and did not create a ticket; the agent reported that creation could not be confirmed. The deployed normalization fixes were then verified by `LL-0023` and `LL-0024`. A conversational retry after success created duplicate `LL-0040`; a later fresh-ticket request after an uncertain outcome created duplicate `LL-0042`. Automatic provider retry behavior remains unverified.

For a separate failure check, the Development action URL was temporarily changed to `/api/lightline-test-unavailable`. A confirmed fictional `SERVICE_INTERRUPTION` complaint at `3 Demo Lane, Oshodi, Lagos` received HTTP `404` from the unavailable path. The agent said creation could not be confirmed and gave no ticket reference. Neon contained zero matching rows. The action URL was then restored, and the saved action card again showed `/api/complaints`. This tests one non-success HTTP response; it does not simulate a network timeout or database outage.

For a further controlled failure check, a temporary POST route on the protected feature Preview returned HTTP `503` without touching the database. A confirmed fictional `METER` complaint at `5 Test Crescent, Mushin, Lagos` received that response. The agent said creation could not be confirmed and did not announce a ticket. After its first confirmation, the agent asked for the already supplied category, description, and location again; repeating the same fictional details led to the HTTP `503` tool call. This unnecessary repeat remains a conversational reliability issue. In a separate `BILLING` scenario at `7 Test Avenue, Ilupeju, Lagos`, the same temporary route delayed five seconds while the BimpeAI action timeout was temporarily set to one second. The agent reported a timeout and gave no ticket reference. A query of the `lightline` development database found zero rows matching either fictional description. The action was restored to `/api/complaints` with its original 30-second timeout, and the temporary test route was removed from the branch. These tests verify two controlled failure responses; they do not verify behavior when a database insert succeeds but its response is lost.

## Agent behavior

Use these instructions in the LightLine BimpeAI agent/workflow:

> You collect and classify electricity complaints for LightLine. Ask only for missing required details: complaint category, a clear description, and location. Confirm meter or account identifiers when supplied. Never request a PIN, password, or OTP. Call `Create LightLine complaint` only after the caller confirms the details. Speak a ticket reference only when the tool returns `success: true` with a ticket ID. Never resubmit an already successful complaint; repeat its confirmed ticket ID instead. Treat a request to start over or create a fresh ticket for the same attempted complaint as a retry. Retry an unconfirmed submission only with its exact original idempotency key and unchanged details, or fail closed if the key is unavailable. If the tool fails, times out, or returns an invalid response, do not claim creation or make up a reference. Say a human review is needed, but do not offer or claim a live transfer or callback without a configured action confirming it. Do not diagnose electrical faults, assert outage/customer-record facts, or promise resolution times.

## Phone and channel setup

According to BimpeAI's current deployment guide, an operator connects channels from **Deploy**. For inbound telephony, the documented flow is to set up the Telephony card, provision or link a phone number under **Team settings → Phone numbers**, choose the voice profile and greeting under **Settings → Voice**, and test by dialing the number. The console also documents **Playground → Voice** for a pre-deployment voice check. These are documented platform steps; LightLine has not verified that the current account has telephony enabled, a number, a selected phone provider, or an inbound route.

The hackathon resource hub and BimpeAI announcement identify a Temlio SIP-trunk route through BimpeAI. The account's **Bring your own SIP** tab supports generic SIP import, including `Any SIP`, and says imported numbers have no Bimpe monthly number fee (usage still applies). It requires a number and SIP REGISTER credentials; the provider must forward inbound calls to BimpeAI's SIP URI. No such number or credentials are visible in this account, and the ordinary BimpeAI purchase path quotes a recurring charge. Do not buy a number or add a direct Temlio integration while the hackathon allocation remains unresolved.

## Verification checklist

1. Resolve duplicate creation after an uncertain result. The immediate lost-response retry failed closed, but a later fresh-ticket request created `LL-0042` for the same `LL-0041` payload with a new key. The new workflow rule passed one different uncertain-error check. Verify a stable logical complaint identifier or another provider-supported mechanism across all retry wording and automatic outbound retries before release.
2. Recheck failure handling in a real voice session when the phone path is available. Playground validation, HTTP `404`, HTTP `503`, and a controlled timeout all withheld ticket references. The agent unnecessarily requested already confirmed details once during the HTTP `503` run.
3. Obtain the hackathon Temlio allocation, connect an inbound phone channel, and complete an owner/human acceptance call before treating phone intake as live.

The current dashboard is a real Yusuf Saheed account. A static fictional BimpeAI test persisted `LL-0017` and verified same-key replay. Agent-driven Playground tests persisted `LL-0019` through `LL-0024`; later retry probes created duplicates `LL-0040` and `LL-0042` as described above. No phone number purchase or real customer call occurred. The owner has contacted the event host about the Temlio route and will notify us when they reply; phone allocation work is paused. No Temlio number, SIP credentials, or telephony channel are available for this agent. A live voice-to-ticket acceptance call remains outstanding.

## Sources

- [BimpeAI: Configuring integrations via the API](https://docs.bimpe.ai/docs/use-cases/configuring-integrations/) — Custom API integration registration, bearer auth example, and channel/API distinction.
- [BimpeAI: Custom API — add tool](https://docs.bimpe.ai/docs/api/agents/createTool/) — tool parameters, `body_template`, and dynamic `headers_template` placeholders.
- [BimpeAI: Deploying and testing channels](https://docs.bimpe.ai/docs/use-cases/deploying-and-testing-channels/) — dashboard channel setup, telephony number and voice profile steps, test flow.
- [BimpeAI: The Console dashboard](https://docs.bimpe.ai/docs/getting-started/dashboard/) — console sections and API key location.
- [BimpeAI: Python SDK resources](https://docs.bimpe.ai/docs/sdk/python/resources/) — documents `workflow_id` as an agent update field and the workflow-create/agent-bind pattern; does not document workflow detachment with a null workflow ID.
- [Lagos Agentic AI Hack Night builder resource hub](https://app.notion.com/p/samadekunle/04-Tools-Credits-Partner-Stack-3ec6a555a57681faa0cbee1703a448c1) — states that Temlio numbers are available through BimpeAI.
- [BimpeAI event announcement](https://uk.linkedin.com/company/bimpeai) — states that Temlio phone-number credits are provided through a SIP trunk inside BimpeAI.
- [Vercel protection bypass for automation](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation) — documents the request header for reaching protected Preview deployments.
