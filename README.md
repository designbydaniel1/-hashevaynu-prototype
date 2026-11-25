# Hashevaynu app preview

A clickable preview of the Hashevaynu iOS app design. It runs in any browser, with no sign-in and no app install.

**Live preview:** https://designbydaniel1.github.io/-hashevaynu-prototype/

## What you can try
- **Shiurim:** today's daf, continue listening, playlists and the latest shiurim. Tap any shiur to play it. Audio streams from the Hashevaynu SoundCloud feed.
- **Daf:** today's daf, the 12-day streak, follow and reminder switches, and masechta progress.
- **Daf map:** progress on every daf, in any order. Tap a daf to play it or mark it learned. Chullin shows the siyum celebration.
- **Series, Saved, Search and More**, including notification settings and an Appearance switch for light and dark mode.

On iPhone, open the link in Safari, tap **Share → Add to Home Screen**, and it opens full-screen like an app.

## Notes
- `data.js` is a snapshot of the latest 60 shiurim from the feed. Listening history, the streak and masechta progress are sample data.
- Saved shiurim, listening positions and settings are kept in this browser only.
- Plain HTML, CSS and JavaScript, with no build step. `render-icons.js` regenerates the PNG icons from `icon.svg`.
- The Series tab loads all SoundCloud playlists live from `data/playlists.json` in the [hashevaynu-ios](https://github.com/designbydaniel1/hashevaynu-ios) repo, which a GitHub Action refreshes every 6 hours. Without a connection it falls back to the built-in snapshot.
