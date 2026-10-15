// 공개 API 에 없지만 플러그인이 읽는 Obsidian 내부 값과, 플러그인이 요소·보기에 붙여 두는 상태(lg 로 시작)의 타입.
// 내부 값은 읽기만 한다(가로채거나 바꾸지 않는다). Obsidian 이 바꾸면 여기와 쓰는 곳을 같이 고친다
import type { Menu, TFile, View, WorkspaceLeaf } from "obsidian";
import type { RefractLook } from "./refract";

// 웹 뷰어 안의 Electron <webview> 요소에서 쓰는 것
export interface WebviewTag extends HTMLElement {
  executeJavaScript(code: string, userGesture?: boolean): Promise<unknown>;
  isLoading(): boolean;
  getWebContentsId(): number;
  reload(): void;
}

// Electron remote 에서 쓰는 것 (웹 화면 주 프레임에 스크립트 넣기, webEarly)
export interface ElectronRemote {
  nativeTheme?: { themeSource: "system" | "light" | "dark" };
  getCurrentWindow?(): { getBackgroundColor(): string; setBackgroundColor(color: string): void; setBackgroundMaterial?(material: "auto" | "none" | "mica" | "acrylic" | "tabbed"): void; setVibrancy?(type: string | null): void };
  webContents: { fromId(id: number): { mainFrame?: { executeJavaScript(code: string): Promise<unknown> } } | null };
}

// 화면 위 상자 (모핑 애니메이션의 시작·끝)
export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
  radius?: number;
}

// 마지막으로 누른 곳 (메뉴가 어디서 열렸는지 setupMenu 가 본다)
export interface PressInfo {
  x: number;
  y: number;
  t: number;
  target: EventTarget | null;
}

// 플러그인이 요소·보기에 붙여 두는 상태
export interface LgState {
  // 탭 줄
  lgBalanceObs?: ResizeObserver | null;
  lgBalanceAt?: number;
  lgBandObs?: MutationObserver;
  lgMiniHold?: number;
  lgMiniLeaf?: WorkspaceLeaf;
  lgMiniReset?: boolean;
  lgView?: View | null;
  lgSlabView?: View | null;
  lgWebTab?: { leaf: WorkspaceLeaf; view: View; moved: { node: HTMLElement; parent: HTMLElement | null; next: Node | null; holder: HTMLElement }[]; hostEl: HTMLElement; pathHostEl: HTMLElement | null; off: () => void } | null;
  lgWebUrl?: { label: HTMLElement; set: () => void; off: () => void } | null;
  lgMoved?: { node: HTMLElement; parent: HTMLElement | null; next: Node | null; holder: HTMLElement }[] | null;
  // 탭 줄 축소 (편집창 스크롤 칸, 웹 뷰어 보기)
  lgMiniY?: number;
  lgMiniDir?: number;
  lgMiniFrom?: number;
  lgMiniBusy?: boolean;
  lgMiniSkip?: boolean;
  lgMini?: boolean;
  // 웹 뷰어 보기
  lgInset?: number | null;
  lgInjectTimer?: number;
  lgInjectTries?: number;
  lgTint?: string | null;
  lgTintBusy?: boolean;
  // 패널 머리 줄 (넓게 모드)
  lgSrc?: HTMLElement;
  lgIcon?: string;
  lgClickAt?: number;
  lgWasOpen?: boolean;
  lgMeasured?: boolean;
  lgHide?: Animation | null;
  lgSearchIn?: { p: HTMLElement; sc: HTMLElement; head: HTMLElement | null; mo: MutationObserver } | null;
  lgCollapseEnd?: (() => void) | null;
  lgFoldSeen?: boolean;
  lgFoldTimer?: number;
  lgNavObs?: MutationObserver | null;
  lgNavRoot?: HTMLElement;
  lgNavTimer?: number;
  lgNavKey?: string;
  lgNavLeaf?: WorkspaceLeaf;
  lgNavSnap?: boolean;
  lgNoneTimer?: number;
  lgPillAnim?: Animation | null;
  lgPillEnter?: boolean;
  lgUnpinTimer?: number;
  lgIdx?: number;
  // 메뉴
  lgBorn?: number;
  lgKey?: HTMLElement;
  lgMoveFrom?: DOMRect;
  lgOrigin?: { x: number; y: number };
  lgParent?: HTMLElement;
  lgReady?: boolean;
  lgReplaced?: boolean;
  lgRow?: HTMLElement;
  lgSnap?: boolean;
  lgPickIdx?: number;
  lgSkipClick?: boolean;
  // 누름 효과·굴절
  lgFade?: Animation[];
  lgGlassAnim?: Animation | null;
  lgLens?: { place: () => void; off?: () => void } | null;
  lgPress?: { t: number; k: number; opt: { duration: number; easing: string } };
  lgRefract?: { strength: number; chroma: boolean; w?: number; h?: number; outward: boolean; look?: RefractLook };
  lgRfTimer?: number;
  // 굴절을 멈춘 동안 크기가 바뀌어 풀 때 다시 재야 함 (Refractor.setPaused)
  lgRfStale?: boolean;
  lgTaskAnims?: Animation[] | null;
  lgTaskDone?: boolean;
  lgWcSizes?: { W: number; H: number; w: number; h: number };
  // 아이콘 버튼 호버 유리 요소 두 개 (번갈아 쓴다, hoverGlassInto)
  lgHoverPool?: HTMLElement[];
  // 칸반
  lgKbForm?: boolean;
  lgMorph?: { ux: number; uy: number; dot: Box; src?: HTMLElement; anchor?: "left" | "right" } | null;
  // 스크롤 중 표시
  lgScrollAt?: number;
  lgScrollTimer?: number | null;
  // 폴더 줄무늬
  lgStripeLoop?: number;
  lgStripeStep?: number;
  lgStripeUntil?: number;
}

declare global {
  interface EventTarget extends LgState {
    // 비어 있으면 상위 타입과 같다는 린트 경고를 피한다 (쓰지 않는다)
    lgNever?: never;
  }
  interface Window {
    // Obsidian 데스크톱이 창에 두는 require (모바일에는 없다)
    require?: (id: "electron") => { remote?: ElectronRemote };
  }
}

declare module "obsidian" {
  interface App {
    setting: { open(): void; close(): void; openTabById(id: string): void; containerEl?: HTMLElement; popout?: { win?: Window } | null };
    customCss: { theme: string; enabledSnippets: Set<string> };
    isMobile: boolean;
    saveLocalStorage(key: string, value: unknown): void;
    loadLocalStorage(key: string): unknown;
  }
  interface View extends LgState {
    // 웹 뷰어 (코어 플러그인)
    webview?: WebviewTag;
    webviewMounted?: boolean;
    mode?: string;
    url?: string;
    addressBar?: { addrInputEl: HTMLInputElement };
    reloadButtonEl?: HTMLElement;
    toggleReaderMode?: () => void;
    modeButtonEl?: HTMLElement;
    headerEl?: HTMLElement;
    // 보기 머리 줄 (제목·더 보기 메뉴)
    titleEl?: HTMLElement;
    titleParentEl?: HTMLElement;
    titleContainerEl?: HTMLElement;
    moreOptionsButtonEl?: HTMLElement;
    onMoreOptions?: (e: { preventDefault(): void; target: HTMLElement }) => void;
    backButtonEl?: HTMLElement;
    forwardButtonEl?: HTMLElement;
    // 파일 탐색기 등
    tree?: { infinityScroll?: { invalidateAll?: () => void } };
    file?: TFile | null;
  }
  interface MarkdownView {
    onSwitchView?: (...args: unknown[]) => unknown;
  }
  interface WorkspaceLeaf {
    tabHeaderEl?: HTMLElement;
    history?: { back(): void; forward(): void; backHistory?: unknown[]; forwardHistory?: unknown[] };
    containerEl: HTMLElement;
    parent: WorkspaceTabs | WorkspaceMobileDrawer | null;
  }
  interface WorkspaceItem {
    containerEl: HTMLElement;
  }
  interface WorkspaceTabs {
    tabsInnerEl?: HTMLElement;
    tabHeaderEls?: HTMLElement[];
    children: WorkspaceLeaf[];
  }
  interface WorkspaceMobileDrawer {
    tabsInnerEl?: HTMLElement;
  }
  interface MenuItem {
    setSubmenu(): Menu;
  }
  interface WorkspaceRibbon {
    items?: { id: string; icon: string; title: string; hidden?: boolean; callback: () => unknown; buttonEl?: HTMLElement }[];
  }
}
