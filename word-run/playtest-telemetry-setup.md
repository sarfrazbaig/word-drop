# Hushwood — Playtest Telemetry Setup

The game already records everything each tester does. It just needs **one URL** to send it to.
Until you paste a URL, nothing leaves anyone's device (it's safe to ship as-is).

Pick **one** collector below, set it up (~5 min), then send me the URL and I'll wire it in and redeploy.

---

## What gets recorded (per tester, anonymously)

- **Every tap** — what it hit (button/tile/card), the label, x/y, and whether it hit *nothing*
  (a **dead tap** = "I tapped and nothing happened"), plus the game context: which screen,
  which card was open, the level, moves left, whether a lesson was running.
- **Rage taps** — 3+ quick taps in the same spot ("why isn't this working?!").
- **What the game showed** — every card/overlay, every toast, every tutorial note.
- **The funnel** — level start / win / fail, creatures woken, shop opens, purchases, ad watches.
- **Errors** — any JS error or crash, and the watchdog firing.
- **Session** — device/OS (user-agent), screen size, language, time in session, where they stopped.

Each tester gets a random **anonymous id** (persisted on their device) so you can follow one
person's whole session. No names, no accounts, no personal data.

---

## Option A — Google Sheet (recommended: no new account, you own the data)

1. Create a new **Google Sheet**. Note its tab name (default `Sheet1`).
2. **Extensions → Apps Script**. Delete the sample and paste:

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
  const body = JSON.parse(e.postData.contents);
  const rows = (body.events || []).map(ev => [
    new Date(ev.t),           // time
    ev.who || body.who || '', // WHO — the name the playtester typed
    body.pid,                 // player id (stable per device)
    body.sid,                 // session
    ev.q,                     // sequence #
    ev.n,                     // event name  (tap, dead_tap, rage_tap, card_shown, level_start…)
    ev.k,                     // kind (funnel/…)
    JSON.stringify(ev.c),     // context {sc:screen, ov:openCard, lv:level, mv:moves, g:lesson, goal}
    JSON.stringify(ev.p)      // details {sel,label,x,y,dead,…}
  ]);
  if (rows.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 9).setValues(rows);
  }
  return ContentService.createTextOutput('ok');
}
```

> **Already deployed the earlier 8-column version?** Replace it with the one above (it adds the
> `who` column), then **Deploy → Manage deployments → edit → Version: New version → Deploy.**
> Same URL, no need to re-send it. Testers are asked for a name on first open; it's optional,
> so `who` is blank for anyone who skips it — `player` still tells them apart.

3. **Deploy → New deployment → Web app.**
   - *Execute as:* **Me**
   - *Who has access:* **Anyone**
   - Deploy, authorize, and **copy the Web app URL** (ends in `/exec`).
4. (Nice to have) Put a header row in the Sheet:
   `time | who | player | session | seq | event | kind | context | details`
5. Send me that `/exec` URL. Done.

> Note: the game POSTs as `text/plain` with `no-cors` on purpose — that's what lets a static
> page talk to Apps Script without CORS errors. You won't see a reply in the browser; the rows
> just appear in the Sheet.

---

## Option B — Supabase (nicer for querying with SQL / filtering)

1. Create a free project at supabase.com. In **Table editor**, new table `events` with columns:
   `id` (int8, identity, PK), `created_at` (timestamptz, default now()), `pid` (text),
   `sid` (text), `seq` (int4), `name` (text), `kind` (text), `ctx` (jsonb), `props` (jsonb).
2. **Authentication → Policies** (or SQL): allow anonymous INSERT on `events` only
   (no select/update/delete for anon — write-only drop box).
3. From **Project Settings → API**, copy the **Project URL** and the **anon public key**.
4. Send me both. I'll point the collector at `POST {url}/rest/v1/events` with that key.

You then analyze in the Supabase SQL editor, e.g.:
```sql
-- where testers rage-tapped, and on which screen
select props->>'sel' as tapped, ctx->>'sc' as screen, count(*)
from events where name='rage_tap' group by 1,2 order by 3 desc;
```

---

## How to read the data (what to look for)

- **`dead_tap` / `rage_tap`** grouped by `context.sc` (screen) and `props.sel` → the exact
  buttons/areas where people expected something to happen and it didn't. This is your #1 signal.
- **Last event before `session_end`** per `pid` → where each tester gave up (the drop-off point).
- **`level_fail` counts by level** → difficulty spikes.
- **`js_error`** rows → real bugs, with the device (`session_start.ua`) that hit them.
- **Time between `level_start` and the first `tap`** → confusion at level open.
- **`card_shown` with no following tap for a long time** → a card people stared at, unsure.

---

## To confirm it's working before you share

Open the game, tap the **LV chip 7 times** to open the keeper's toolbox, tap **📡 telemetry** —
it shows whether the endpoint is live and how many events have flowed. With the URL wired,
play for a minute and watch rows land in your Sheet.
