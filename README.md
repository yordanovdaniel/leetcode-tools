# LeetCode Tools

A small toolkit for focused LeetCode practice.

This workspace contains:

1. **leetcode-cleaner**: a Chrome extension that auto-resets code on LeetCode problem pages so you start from a clean editor.
2. **leetcode-tracker**: a browser-based spaced-repetition scheduler for LeetCode problems using an FSRS-style review model.

## Repository Structure

```text
leetcode-tools/
  README.md
  LICENSE
  .gitignore
  leetcode-cleaner/
    content.js
    manifest.json
    popup.html
    popup.js
    icons/
  leetcode-tracker/
    index.html
```

## 1) leetcode-cleaner (Chrome Extension)

Automatically clicks LeetCode editor reset on new problem pages, confirms reset when prompted, and attempts to start the built-in timer.

### Features

- Runs on `https://leetcode.com/problems/*`.
- Toggle on/off from extension popup.
- Watches LeetCode SPA navigation and only resets once per problem slug.
- Uses fallback button detection if primary selector changes.

### Install (Developer Mode)

1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the `leetcode-cleaner` folder.

### Usage

1. Open any LeetCode problem page.
2. Ensure extension status is **Active** in popup.
3. Wait for editor to load; extension will auto-reset code for that problem once.

### Files

- `manifest.json`: extension metadata, permissions, content script wiring.
- `content.js`: reset/timer automation logic.
- `popup.html` + `popup.js`: UI and persisted enabled/disabled state.

## 2) leetcode-tracker (FSRS Scheduler)

Single-page app for review scheduling and progress tracking. [URL](https://yordanovdaniel.github.io/leetcode-tools/)

### Features

- Add problems by number or LeetCode URL slug.
- Mark attempt as solved/failed with solve time.
- FSRS-based interval updates using stability and difficulty.
- Separate **Today** and **Upcoming** queues.
- Stats: due today, total, mastered, best streak.
- Export to JSON.
- Import from JSON (replace or merge).
- Optional auto-save to a user-selected file via File System Access API.

### Run

No build step required.

1. Open [URL](https://yordanovdaniel.github.io/leetcode-tools/) in a Chromium browser.
2. Start adding and updating problems.

For full auto-save/reconnect support, use Chrome or Edge (File System Access API required).

### Data Format

Exported JSON shape:

```json
{
  "version": 1,
  "savedAt": "2026-04-10T13:11:58.562Z",
  "app": "LeetCode SRS",
  "problemCount": 2,
  "problems": [
    {
      "id": "...",
      "problemNum": null,
      "slug": "decode-the-slanted-ciphertext",
      "stability": 17.17,
      "difficulty": 6.09,
      "lapses": 2,
      "reps": 4,
      "streak": 1,
      "lastReview": "...",
      "nextReview": "...",
      "lastGrade": 4,
      "lastTime": 120,
      "createdAt": "..."
    }
  ]
}
```

## License

MIT — see [LICENSE](LICENSE).
