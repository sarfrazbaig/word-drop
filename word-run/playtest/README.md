# Playtest logs

One NDJSON file per session. Each line is a single event, in exactly the row shape the
Supabase table stores - same fields, same ids, same board snapshots - so a local run can be
read and analysed identically to a live one.

Nothing here is uploaded. Local play never reaches the collector: `Tele.isLocal()` routes
the batch to `localStorage.hush_playlog` instead of the network, so the live table only ever
holds real, non-local sessions.

Written by the export step at the end of each stretch.
