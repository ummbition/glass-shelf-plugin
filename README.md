# Glass Shelf (Plugin)

**English** · [한국어](README.ko.md)

Companion plugin for the [Glass Shelf theme](https://github.com/ummbition/glass-shelf-theme). It adds button layout, motion and refraction on top of the glass surfaces drawn by the theme.

> **Requires the Glass Shelf theme.** This plugin only runs while Glass Shelf is the active theme. With any other theme it changes nothing.

<p align="center">
  <img src="images/light-main.png" width="49%" alt="Light mode">
  <img src="images/dark-main.png" width="49%" alt="Dark mode">
</p>

## Features

### Layout
- Sidebar more-options menus, back/forward and reading-mode buttons in the tab bar, and in-tab menu buttons, rearranged into pills
- Shows the current note's "folder / file" path above the tab bar
- Collapses the tab bar to the note title when you scroll down (Safari style)
- Lens effect when switching panel tabs, wide tab bar, tab names
- Shrinks the Windows and Linux window controls into small dots

![Panel tab lens switching](images/tab-switch.gif)

### Glass
- Glass opacity in 11 steps (0–10)
- Tint: none, accent color, Obsidian purple, or a custom color, with 10 strength steps
- Refraction that bends the background along glass edges
- Popups that match menu translucency, or opaque popups
- Morphing animation where a button grows into its menu, plus press effects

### Details
- Task checkbox style and color
- Folder icon color in the file explorer and a per-folder color palette
- Striped rows in the file explorer, line under headings
- iOS-style colors for toggles and sliders

<p align="center">
  <img src="images/file-explorer.png" width="32%" alt="Folder colors">
  <img src="images/file-explorer-striped.png" width="32%" alt="Folder colors with striped rows">
  <img src="images/graph-view-slider.gif" width="30%" alt="iOS-style toggles and sliders">
</p>

### Plugin integration
- Kanban: restyled to match Glass Shelf

## What moves where

With the plugin on, a few buttons move. They work the same; only their place changes.

![Compact layout with panel tab names turned off](images/compact-layout.png)

### Ribbon menu

- The vertical ribbon on the left is hidden, and its buttons are gathered into **the grid button (Ribbon menu) at the far left of the editor tab bar**, just left of back/forward.
- The buttons shown and their order follow **Settings → Appearance → Ribbon menu**.
- When the left sidebar is closed, the button that opens it also appears at the far left of the tab bar.
- On tablets, the vault, help and settings buttons are added to the end of the ribbon menu. Phones are unchanged.

### Sidebar panels

- Panel buttons such as New note, Sort and Collapse all in the file explorer move into **the more-options (···) button in the panel tab bar**.
- With the wide tab bar setting on, those buttons are laid out in a row instead of the ··· button.

### Editor tab bar

- **Back / forward**: left side of the tab bar
- **Reading / editing toggle**: right side of the tab bar, left of the tab list button
- **More options (≡)**: inside each tab. With the path display on, it moves into the path pill above the tab bar.

### Tab settings

Change them in **Settings → Community plugins → Glass Shelf**.

| Setting | What it does |
|---|---|
| Tab switch effect | A lens that slides between tabs, or a plain accent-colored pill |
| Wide tab bar | Stretches the panel tab pill from edge to edge |
| Show tab names | Puts the name next to each panel tab icon |
| Show path | "Folder / file" path above the editor tab bar |
| Collapse tab bar on scroll | Folds the tab bar when you scroll down |

## Installation

1. Install and enable the **Glass Shelf** theme in **Settings → Appearance → Themes**.
2. Install and enable the **Glass Shelf** plugin in **Settings → Community plugins**.

## Supported platforms

- **Built mainly for desktop (Windows) and Android.**
- On iPhone and iPad, refraction does not work, so only blur is applied.
- macOS has not been tested thoroughly, so some details may look off.

## Privacy

This plugin makes no network requests and only changes the Obsidian interface. It does not read or send your notes.

## Support

If you enjoy Glass Shelf, you can support it with a coffee.

[![Support me on Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/ummbition)

## License

[MIT](LICENSE)
