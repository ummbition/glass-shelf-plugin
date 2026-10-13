import type { Component, Plugin } from "obsidian";
import type { Settings } from "./settings";
import type { Refractor } from "./refract";
import type { WebCard } from "./web";
import type { coreMethods } from "./core";
import type { eventsMethods } from "./events";
import type { pressMethods } from "./press";
import type { kanbanMethods } from "./kanban";
import type { menusMethods } from "./menus";
import type { morphMethods } from "./morph";
import type { foldersMethods } from "./folders";
import type { sidebarMethods } from "./sidebar";
import type { tabsMethods } from "./tabs";
import type { webMethods } from "./web";

// 플러그인 인스턴스의 모양: Obsidian 플러그인 + 기능별 메서드 묶음 + 상태.
// 메서드는 각 파일의 묶음 객체에 있고 main.ts 가 prototype 에 붙인다 (메서드의 this 가 이 모양이다)
type CoreMethods = typeof coreMethods;
type EventsMethods = typeof eventsMethods;
type PressMethods = typeof pressMethods;
type KanbanMethods = typeof kanbanMethods;
type MenusMethods = typeof menusMethods;
type MorphMethods = typeof morphMethods;
type FoldersMethods = typeof foldersMethods;
type SidebarMethods = typeof sidebarMethods;
type TabsMethods = typeof tabsMethods;
type WebMethods = typeof webMethods;

export interface GlassShelfPlugin
  extends Plugin,
    CoreMethods,
    EventsMethods,
    PressMethods,
    KanbanMethods,
    MenusMethods,
    MorphMethods,
    FoldersMethods,
    SidebarMethods,
    TabsMethods,
    WebMethods {
  settings: Settings;
  acrylicPrev: string | null;
  acrylicThemeOff: (() => void) | null;
  translucentObs: MutationObserver | null;
  holesOff: (() => void) | null;
  folderLine: string;
  addrWired: WeakSet<HTMLElement>;
  bareWatched: WeakSet<HTMLElement>;
  core: Component | null;
  coreKeys: Set<string>;
  coreQueue: Promise<void>;
  ddWatched: WeakSet<HTMLElement>;
  docs: Set<Document>;
  fcAll: boolean;
  fcFrame: number;
  fcWatched: WeakSet<HTMLElement>;
  foldWatched: WeakSet<HTMLElement>;
  frame: number;
  kbWatched: WeakSet<HTMLElement>;
  lastShut: { key: HTMLElement; rect: DOMRect; t: number; ghost: HTMLElement } | null;
  markWatched: WeakMap<HTMLElement, MutationObserver>;
  menuButtons: Set<string>;
  miniWired: WeakSet<HTMLElement>;
  observers: (MutationObserver | ResizeObserver)[];
  pendingRelease: Set<() => void>;
  refractor: Refractor;
  saveTimer: number;
  segWatched: WeakSet<HTMLElement>;
  shared: Settings;
  stripeBars: WeakMap<HTMLElement, HTMLElement>;
  tabsWatched: WeakSet<HTMLElement>;
  titleWatched: WeakSet<HTMLElement>;
  toggleLabels: Set<string>;
  unloaded: boolean;
  webCard: WebCard | null;
  webTintPoll: number;
  wvMouse: WeakSet<HTMLElement>;
  wvNavWired: WeakSet<HTMLElement>;
  wvWired: WeakSet<HTMLElement>;
}
