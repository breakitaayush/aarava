# Aayush & Durva — Wedding Invite

A royal Rajasthani web invite: palace doors open with soft music, events with themes & dress codes, our love story, a quiz, venue map and family contacts. Double-tap anywhere for a shower of petals.

Plain HTML/CSS/JS — no build step.

## Edit content
Everything lives in **`js/content.js`**: names, events (date/time, theme, dress code, colour swatches), love story, quiz, venue and contacts. Placeholder text is marked "Lorem ipsum".

- **Music:** put your track at `assets/music/music.mp3` (the music button hides if the file is missing). Music starts when guests tap the doors — browsers don't allow sound before a tap.
- **Photos:** add images to `assets/photos/` and set `photo: "assets/photos/1.jpg"` on a story chapter.

## After changing css/js
Bump the `?v=` number on the stylesheet and script links in `index.html` so phones load the new files instead of a saved copy. Fonts are self-hosted in `assets/fonts/` (see `css/fonts.css`).

## Preview locally
```
python3 -m http.server 8000
```
then open http://localhost:8000

## Publish (free)
GitHub → repo **Settings → Pages** → deploy from branch → root. Or drag the folder into Netlify Drop.
