# LightLine interface direction

## Subject and audience

LightLine is a voice-first electricity complaint intake service in Nigeria. Callers should understand how their words become an identifiable ticket; operators need a quiet, dependable place to move those tickets forward.

## Design tokens

- **Switchboard navy — `#10243A`:** navigation, headings, and primary actions.
- **Signal blue — `#22598A`:** readable links, active controls, and voice-to-record emphasis.
- **Slate ink — `#526579`:** secondary text, labels, and metadata with accessible contrast on Paper and White.
- **Paper — `#F5F8FB`:** the cool, low-glare application canvas.
- **White — `#FFFFFF`:** focused working surfaces.
- **Current mint — `#D8F3E8`:** confirmed/resolved states and completion cues.
- **Amber and rose — `#F3B64A` / `#A8443B`:** reviewing attention and escalations that need a human.

Display typography uses Manrope with compact, assertive headings. Public Sans carries body copy and controls. Ticket IDs use a tabular utility treatment so references scan like operational identifiers.

## Layout

The public landing page opens on the trace from caller to ticket: a waveform-like voice capture line crosses into a structured ticket slip. Copy explains exactly what the caller can expect, with a clear path to operator access. The operator area uses a narrow navy rail and a broad, paper-colored work surface. Complaint rows prioritize reference, place, category, and state; detail pages keep caller information, description, and status action in one readable record.

```text
Public: [LightLine] [How it works] [Operator access]
        Complaint in your words  ── signal trace ──>  Ticket LL-XXXX
        What happens on the call / privacy reassurance / operator sign-in

Operations: [nav rail] [desk title + refresh]
                        [status count strip]
                        [filters + complaint register]
Detail:    [back to register] [ticket reference + state]
                        [complaint record] [status action]
```

## Signature

The **voice-to-ticket trace**: a thin, measured signal line that resolves into a small ticket reference slip. It belongs to LightLine’s real call-to-record workflow and anchors the landing page without suggesting a fake live call or live service metric.

The layout stays calm around that signature. Status colors are semantic, focus states are visible, motion is limited to short transitions and respects reduced-motion settings, and mobile layouts preserve readable controls and ticket information.

## Component and layout rules

- **Grid and spacing:** public content is capped at 1,220px with 38px desktop gutters. The landing hero uses a 1.1:0.9 text-to-illustration split and 56px gap; the three process steps align in an equal three-column row. The operator shell uses a 246px rail and a flexible work area, with 37px desktop content gutters. Register summary uses four equal status cells plus a wider received-today cell. Detail uses a 1.6:0.8 record-to-status panel split. Spacing follows a 4px base, with 8, 12, 16, 24, 32, and 48px working intervals.
- **Surfaces:** use white for active records and controls, Paper for the work canvas, and Switchboard navy for the persistent operator rail and primary action. Card surfaces use a 1px cool gray border and 6–9px radius; inputs and buttons use 4–5px. Avoid heavy shadows except the public voice-to-ticket illustration and login panel, where elevation clarifies focus.
- **Table:** one row represents one complaint. Keep the ticket reference as the strongest text; show a short complaint description, location, category, semantic status, Lagos-local received time, and a direct detail link. Header labels are compact and muted. At narrow widths, allow the table to scroll horizontally rather than hide ticket fields. Pagination remains visible below the register.
- **Forms and controls:** filters use native selects; status change uses one labeled native select and an explicit “Save status” button. Login uses a password input with `current-password` autocomplete. Every action uses a specific verb, disables while saving, reports success only after the server confirms it, and leaves the selected value intact on failure.
- **Navigation and buttons:** public header links are intentionally quiet; operator navigation is fixed to the navy rail on desktop and collapses to a compact top strip on mobile. Primary buttons are navy with white text; secondary actions use a white surface and outlined border. Hover feedback is a subtle color or 1px lift; visible focus is never removed.
- **Loading, empty, and error states:** loading uses a small blue rotating ring and a plain-language status. Empty states explain whether the register itself is empty or filters returned no records. Errors name the unavailable action and offer a retry. A 401/403 moves the operator to sign-in with a session-ended message; status success appears only after persistence.
- **Responsive behavior:** at 900px the landing hero and process intro become single column. At 720px the operator rail becomes a compact header; the register stats use two columns, table keeps horizontal overflow, and detail becomes a single column. At 620px public gutters reduce to 21px and process steps stack; at 400px detail fields and register filters stack further. Preserve readable touch targets and content order.
- **Type and icons:** Manrope is reserved for headings, ticket IDs, and prominent counts; Public Sans handles body text, navigation, metadata, and controls. Keep interface copy at 11px or larger except compact illustration metadata where space is constrained. Use Lucide icons at 14–18px as supporting cues, always paired with a visible label or accessible name. Color alone never communicates complaint status.
- **Motion:** use only short transitions for hover and focus-adjacent feedback plus the loading indicator. Global reduced-motion rules disable animation and smooth scrolling when requested.
