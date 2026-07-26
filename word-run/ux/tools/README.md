# Rebuilding the handbook

`../hushwood-handbook.html` is generated, not written by hand. Every table in it comes out of
the game's own data and every screen is a real capture, which is the only reason it can claim
not to drift from what ships. Regenerate it whenever the game changes in a way the document
describes.

## What you need

- Chrome installed at the usual Windows path (the scripts point at it directly)
- the dev server running on port 8123, serving this repo: use the `word-run` preview config
- `node build.js` run at least once, so `word-drop.html` is current

## The order

```bash
node ux/tools/mkshot.js    # writes _shot.html: the game plus a driver that poses it
node ux/tools/cap.js       # photographs 16 screens into ux/.work/shots
node ux/tools/dump.js      # reads the game's tables into ux/.work/data.json
node ux/tools/mkdoc.js     # assembles the single HTML file
rm _shot.html              # it is a throwaway, do not commit it
```

## Why it is built this way

Chrome's `--screenshot` flag needs `--virtual-time-budget` before it will wait for anything,
and the virtual clock races any chain that is gated on an animation, which meant the level
intro card never got answered and every board shot came back showing the card instead. So
`cap.js` drives Chrome over the DevTools protocol on a real clock instead, and simply waits
for the page to say it has finished posing itself.

Two traps worth knowing if you edit these:

- The built `word-drop.html` has no `<html>`, `<head>` or `<body>` tags at all. It is meta
  tags, a style block, markup, then one `<script>`. `mkshot.js` anchors on that script tag.
- The pause bubble that `06-grace` captures only exists between a word forming and that word
  blooming, and it is what makes the board busy. Test for the bubble **before** testing for
  busy, or you will never see it.

`.work/` holds the intermediate captures and data dump. It is regenerated every run and is
not committed.
