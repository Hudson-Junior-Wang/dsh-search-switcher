# Changelog

## 0.3.0 — 2026-09-02

- Error diagnostics: bridge failures now surface the real message/code from `dsh-free-search` (`settings-not-exposed`, etc.) instead of the generic "switch failed".
- Detects the unexposed `free-search` namespace (the `dsh-free-search` 0.4.22 + old-runtime incompatibility) on load and shows an actionable hint in the menu; the hint clears after a successful switch.
- README: compatibility matrix and fix options for the `dsh-free-search` 0.4.22 / `@deepseek-ai/dsh-settings <= 0.1.2-alpha.1` mismatch.

## 0.2.0 — 2026-09-01

- Keyboard navigation: Arrow keys open the engine menu from the trigger and move between engines, Home/End jump to the first/last entry, Enter/Space activate, Escape dismisses and returns focus to the trigger.
- Focus moves to the current engine's option when the menu opens.
- Added a bundle smoke test (`npm test`) and a GitHub Actions workflow that runs it on every push and pull request.
- Added marketplace screenshots (`screenshots.json` + `assets/`).

## 0.1.0 — 2026-08-19

- Initial release: one-click web search-engine switcher beside the DeepSeek Harness model picker, backed by the `dsh-free-search` settings bridge.
