import type { WorkspaceLeaf } from "obsidian";
import { Component, ItemView, Notice, Platform, getIcon } from "obsidian";
import { WEB_MINI_POLL_MS } from "./web-page";
import { INJECTED, strs, THEME_NAME, tr } from "./util";
import { DEFAULTS, OLD_DEVICE_KEYS, OBSIDIAN_PURPLE, migrateGlassLevel } from "./settings";
import type { RawSettings } from "./settings";
import { MINI_HOLD } from "./constants";
import { REFRACT_TARGETS, REFRACT_TARGETS_MOBILE, Refractor } from "./refract";
import { GlassShelfSettingTab } from "./settings-tab";
import type { GlassShelfPlugin } from "./host";

// 플러그인 본체: 테마 켜짐 확인, 시작·정리, 설정 적용, 화면 새로 맞추기
export const coreMethods = {
  // 지금 테마가 Glass Shelf 인가 (Obsidian 이 고른 테마 이름)
  themeOn(this: GlassShelfPlugin) {
    const cc = this.app.customCss;
    return !!cc && cc.theme === THEME_NAME;
  },

  // 테마 상태에 맞춰 자식을 붙이거나 뗀다. 테마를 빠르게 여러 번 바꿔도 차례로 한다
  syncCore(this: GlassShelfPlugin) {
    this.coreQueue = (this.coreQueue ?? Promise.resolve())
      .then(() => this.applyCore())
      .catch((err) => console.error("[glass-shelf] theme switch", err));
    return this.coreQueue;
  },

  async applyCore(this: GlassShelfPlugin) {
    const on = this.themeOn();
    if (on === !!this.core) return;
    if (this.core) {
      // 떼면 등록해 둔 정리와 teardown(자식의 onunload)이 돈다. 그다음 붙인 뒤 생긴 플러그인 상태를 모두 지워,
      // 다시 붙일 때 새로 켠 것과 같게 한다 (지우지 않으면 "이미 연결됨" 표시가 남아 다시 붙지 않는다)
      const core = this.core;
      this.removeChild(core);
      const self = this as unknown as Record<string, unknown>;
      for (const k of Object.keys(self)) if (!this.coreKeys.has(k)) delete self[k];
      this.core = null;
      this.unloaded = true;
      return;
    }
    delete this.unloaded;
    this.coreKeys = new Set(Object.keys(this));
    this.coreKeys.add("coreKeys");
    const core = new Component();
    core.onunload = () => this.teardown();
    this.core = core;
    this.addChild(core);
    await this.startCore();
  },

  // 테마가 켜졌을 때의 준비 (예전 onload 의 본문)
  async startCore(this: GlassShelfPlugin) {
    // 공유 설정: 플러그인 폴더의 data.json (동기화되어 모든 기기가 같이 쓴다)
    const raw = ((await this.loadData()) || {}) as RawSettings;
    migrateGlassLevel(raw);
    delete raw.frost; // 예전 0~100 값은 버린다
    delete raw.hoverSize; // 예전 0~10 단계 값은 버린다
    delete raw.activeTabColor; // 없어진 선택 탭 색 설정은 버린다
    delete raw.activeTabColorCustom;
    this.shared = Object.assign({}, DEFAULTS, raw);
    this.settings = this.shared;
    try {
      if (typeof this.app.saveLocalStorage === "function") for (const k of OLD_DEVICE_KEYS) this.app.saveLocalStorage(k, null);
    } catch {
      // 지우지 못해도 쓰지 않으므로 상관없다
    }
    this.addSettingTab(new GlassShelfSettingTab(this.app, this));

    this.segWatched = new WeakSet();
    this.tabsWatched = new WeakSet();
    this.observers = [];
    // 칸반 보드에서 이미 지켜보는 요소들. 요소에 표시를 남기면 플러그인을 껐다 켰을 때 표시만 남고 감시는 끊겨 다시 붙지 않으므로 여기 둔다
    this.kbWatched = new WeakSet();
    this.docs = new Set();
    this.refractor = new Refractor();
    // 모바일: 지난번에 구운 굴절 지도를 화면이 준비된 뒤 쉬는 틈에 미리 굽는다 (Refractor.warmUp, 서랍을 처음 열 때 끊김)
    if (Platform.isMobile && typeof this.app.loadLocalStorage === "function") {
      this.refractor.warmIO = {
        load: () => this.app.loadLocalStorage("lg-rf-warm"),
        save: (v: string[]) => this.app.saveLocalStorage("lg-rf-warm", v),
      };
      this.app.workspace.onLayoutReady(() => window.setTimeout(() => !this.unloaded && this.refractor.warmUp(), 1500));
    }
    this.attachDoc(document);
    // 이미 열려 있는 별도 창(팝아웃)에도 붙인다: 앱을 켤 때 되살아난 창이나, 테마를 다시 켰을 때 열려 있던 창은 window-open 이 다시 오지 않는다
    this.app.workspace.iterateAllLeaves((leaf) => {
      const d = leaf.view && leaf.view.containerEl && leaf.view.containerEl.ownerDocument;
      if (d && d !== document) this.attachDoc(d);
    });
    this.applySettings();
    // 리본 여닫기 애니메이션: 왼쪽 패널이 실제로 열리고 닫힐 때만 잠깐 켠다 (CSS: body.lg-rib-anim). 모바일은 리본이 서랍 안이라 없다
    if (!Platform.isMobile) {
      const wsEl = this.app.workspace.containerEl;
      let open = wsEl.hasClass("is-left-sidedock-open");
      let timer = 0;
      // 오른쪽 패널이 열려 있음을 body 에 알린다 (CSS: body.lg-right-open, 창 제어 알약 색).
      // 테마가 body:has(.workspace.is-right-sidedock-open) 로 직접 보던 것. body 의 :has 는 문서 전체 요소에 표시를 남겨,
      // 파일 탐색기에서 끌 때마다 다시 판정하느라 렉이 걸렸다(추정). 표시는 남아 테마를 꺼도 재시작 전까지 느렸다
      const syncRight = () => document.body.toggleClass("lg-right-open", wsEl.hasClass("is-right-sidedock-open"));
      syncRight();
      const obs = new MutationObserver(() => {
        syncRight();
        const now = wsEl.hasClass("is-left-sidedock-open");
        if (now === open) return;
        open = now;
        document.body.removeClass("lg-rib-anim");
        void document.body.offsetWidth;
        document.body.addClass("lg-rib-anim");
        window.clearTimeout(timer);
        timer = window.setTimeout(() => document.body.removeClass("lg-rib-anim"), 520);
      });
      obs.observe(wsEl, { attributes: true, attributeFilter: ["class"] });
      this.register(() => {
        obs.disconnect();
        document.body.removeClass("lg-rib-anim");
        document.body.removeClass("lg-right-open");
      });
      // 편집창에 포커스가 있음을 body 에 알린다 (CSS: body.lg-editing, 패널 목록 글자 흐리게). 위와 같은 이유로 :has 대신
      const rootEl = () => this.app.workspace.rootSplit && this.app.workspace.rootSplit.containerEl;
      const syncFocus = () => {
        const r = rootEl();
        const a = document.activeElement;
        document.body.toggleClass("lg-editing", !!(r && a && r.contains(a)));
      };
      this.registerDomEvent(document, "focusin", syncFocus);
      this.registerDomEvent(document, "focusout", () => window.setTimeout(syncFocus, 0));
      this.register(() => document.body.removeClass("lg-editing"));
    }

    void this.setupFolderColors(raw);

    const refresh = () => this.requestRefresh();
    // 웹 뷰어 탭 줄 축소: 페이지 스크롤 위치를 주기적으로 묻는다 (몰입형 웹 보기와 상관없이, 끌 때 registerInterval 이 멈춘다)
    if (!Platform.isPhone) this.registerInterval(window.setInterval(() => this.webMiniTick(), WEB_MINI_POLL_MS));
    this.app.workspace.onLayoutReady(refresh);
    this.registerEvent(this.app.workspace.on("layout-change", refresh));
    this.registerEvent(this.app.workspace.on("layout-change", () => {
      for (const doc of this.docs) this.snapTabBars(doc);
    }));
    this.registerEvent(this.app.workspace.on("active-leaf-change", refresh));
    this.registerEvent(this.app.workspace.on("file-open", refresh));
    this.registerEvent(this.app.workspace.on("css-change", refresh));
    this.registerEvent(this.app.workspace.on("css-change", () => {
      for (const doc of this.docs) this.applyFolderColor(doc);
    }));
    // 탭 줄 축소: 파일을 열거나 탭을 바꾸면 그 탭 묶음의 탭 줄을 다시 편다
    const unMini = (leaf: WorkspaceLeaf) => {
      const tabs = leaf && leaf.parent && leaf.parent.containerEl;
      if (!tabs || !tabs.classList) return;
      tabs.lgMiniHold = performance.now() + MINI_HOLD;
      this.setMini(tabs, false);
    };
    this.registerEvent(this.app.workspace.on("active-leaf-change", (leaf) => {
      const tabs = leaf && leaf.parent && leaf.parent.containerEl;
      if (tabs && tabs.lgMiniLeaf !== leaf) {
        tabs.lgMiniLeaf = leaf;
        unMini(leaf);
      }
    }));
    this.registerEvent(this.app.workspace.on("file-open", () => unMini(this.app.workspace.getMostRecentLeaf())));
    this.register(() => document.querySelectorAll<HTMLElement>(".workspace-tabs.lg-mini").forEach((t) => t.classList.remove("lg-mini")));
    // Bases 설정(그룹 등)을 바꾸면 .base 파일이 저장된다: 그룹 버튼 표시를 다시 본다
    this.registerEvent(this.app.vault.on("modify", (f) => {
      if (f.path.endsWith(".base")) this.app.workspace.getLeavesOfType("bases").forEach((l) => l.view instanceof ItemView && this.basesGroupMark(l.view));
    }));
    this.registerEvent(this.app.workspace.on("window-open", (win) => win && win.doc && this.attachDoc(win.doc)));

    // 설정 창은 별도 창(다른 document)으로 뜰 수 있다. 열려 있으면 그 창에도 같은 동작을 붙인다.
    // Obsidian 은 설정 창이 열릴 때 알려 주지 않아 예전엔 0.5초마다 찾았다. 별도 창이 뜨면 메인 창이 포커스를 잃으므로
    // 그때(창이 준비되는 동안 몇 번) 찾는다: 버튼·단축키·명령 팔레트 등 여는 방법과 상관없다 (사용자 요청: 상시 감시 없애기).
    // 앱 안에 뜨는 설정 창은 메인 창 문서라 이미 붙어 있고, 검색창 굴절은 창이 붙을 때(modal-container) 건다
    const findSettings = () => {
      const st = this.app.setting;
      const cands = [
        st && st.popout && st.popout.win && st.popout.win.document,
        st && st.containerEl && st.containerEl.isConnected && st.containerEl.ownerDocument,
      ];
      for (const d of cands) if (d && d.body) this.attachDoc(d);
      for (const d of this.docs) this.modalRefract(d);
      // 닫힌 창은 목록에서 뺀다
      for (const d of this.docs) if (d !== document && (!d.defaultView || d.defaultView.closed)) this.docs.delete(d);
    };
    findSettings();
    // 별도 창(데스크톱)으로 뜬 설정 창을 찾는 용도라 모바일에선 달지 않는다 (검토 지적: 앱을 내릴 때마다 타이머 3개가 돌았다)
    if (!Platform.isMobile) this.registerDomEvent(window, "blur", () => {
      for (const t of [60, 300, 1000]) window.setTimeout(() => !this.unloaded && findSettings(), t);
    });
  },

  // body 에 플러그인 상태(클래스·뿌연 정도)를 반영
  // 화면 한 픽셀의 CSS 길이(--lg-dpx). 배율이 125% 면 0.8px. 테마가 가는 선 두께를 이 배수로 맞춰, 선이 놓인 높이에 따라
  // 1픽셀·2픽셀로 번갈아 그려지지 않게 한다 (사용자 지적: 제목 가로줄마다 두께가 달라 보였다)
  applyDevicePx(this: GlassShelfPlugin, doc: Document) {
    const win = doc.defaultView;
    if (!doc.body || !win) return;
    const v = `${+(1 / (win.devicePixelRatio || 1)).toFixed(4)}px`;
    if (doc.body.style.getPropertyValue("--lg-dpx") !== v) doc.body.style.setProperty("--lg-dpx", v);
    this.snapTabBars(doc);
  },

  // 좌우 패널 탭 줄 알약을 화면 픽셀 경계에 맞춘다(--lg-snap-y 만큼 세로로 옮김). 소수 픽셀에 있으면 누름 효과(scale 애니메이션)
  // 동안 따로 그려지는 층이 픽셀에 맞춰지며 글자가 내려갔다 올라왔다 (capturePage 측정: 0.47 → 0.1 화면 픽셀, 사용자 녹화)
  snapTabBars(this: GlassShelfPlugin, doc: Document) {
    const win = doc.defaultView;
    if (!win || Platform.isMobile) return;
    const dpr = win.devicePixelRatio || 1;
    doc.querySelectorAll<HTMLElement>(".workspace-split.mod-sidedock .workspace-tab-header-container-inner").forEach((el) => {
      if (!el.offsetHeight || el.getAnimations().length) return;
      const cur = parseFloat(el.style.getPropertyValue("--lg-snap-y")) || 0;
      // 옮기기 전 자리는 레이아웃 단위(1/64px)로 맞춰 계산한다. 소수 오차로 67.5 같은 반 픽셀이 67.4999·67.5001로 번갈아
      // 나와 위·아래로 번갈아 옮겨지며, 파일을 열 때마다(layout-change) 탭 줄이 흔들렸다 (사용자 지적)
      const top = (Math.round((el.getBoundingClientRect().top - cur) * 64) / 64) * dpr;
      const off = +((Math.round(top) - top) / dpr).toFixed(4);
      if (Math.abs(off - cur) > 1e-3) el.setCssProps({ "--lg-snap-y": `${off}px` });
    });
  },

  // 좌우 패널 아크릴 (Windows 11 22H2 이상, 사용자 요청): 창 바탕을 투명하게 하고 시스템 아크릴 재질을 깐다(Electron 공개 API).
  // 테마는 body.lg-acrylic 에서 body 바탕을 비우고 좌우 패널 바탕만 반투명하게 둔다(편집창은 불투명 그대로).
  // 끌 때(allow 가 false 이거나 설정 꺼짐) 원래 창 바탕색으로 되돌린다. 재질을 못 거는 환경이면 클래스도 붙이지 않는다.
  // 맥은 따로 켜는 설정 없이 Obsidian 의 반투명 창(body.is-translucent)을 따른다 (사용자 결정). Obsidian 이 창을 투명하게 하고
  // 사이드바 재질(setVibrancy("sidebar"))을 깐다. 맥은 패널 바탕을 칠하지 않고(테마 0%) 패널 색을 그 재질에 맡긴다: 반투명 바탕은
  // 유리(뒤 필터)를 다시 그리는 프레임에 macOS 가 지우지 않고 덧칠해 패널이 불투명하게 깜빡였다(측정). 그래서 구멍도 쓰지 않는다
  applyAcrylic(this: GlassShelfPlugin, allow: boolean) {
    const mac = Platform.isMacOS && Platform.isDesktopApp;
    if (mac) this.watchTranslucent(allow);
    const want = allow && Platform.isDesktopApp && (mac ? document.body.classList.contains("is-translucent") : !!this.settings.sideAcrylic && Platform.isWin);
    if (want === (this.acrylicPrev != null)) return;
    const remote = window.require ? window.require("electron").remote : undefined;
    const w = remote && remote.getCurrentWindow ? remote.getCurrentWindow() : null;
    if (!w) return;
    if (mac) {
      if (typeof w.setVibrancy !== "function") return;
      if (want) w.setVibrancy("sidebar");
      this.acrylicPrev = want ? "vibrancy" : null;
    } else {
      if (typeof w.setBackgroundMaterial !== "function") return;
      if (want) {
        this.acrylicPrev = w.getBackgroundColor();
        w.setBackgroundColor("#00000000");
        w.setBackgroundMaterial("acrylic");
      } else {
        w.setBackgroundMaterial("none");
        w.setBackgroundColor(this.acrylicPrev || "#000000");
        this.acrylicPrev = null;
      }
    }
    document.body.classList.toggle("lg-acrylic", want);
    document.body.classList.toggle("lg-tab-plain", this.tabPlain());
    this.acrylicTheme(want);
    this.acrylicHoles(want && !mac);
    if (mac && want) this.vibNudge();
  },

  // 맥: 재질을 바꾸거나 창 라이트·다크가 바뀐 뒤 패널이 예전 화면으로 남았다(측정: 그동안 Chromium 화면은 투명). 화면을 한 번 새로
  // 그리면 풀렸다(측정). 조금 뒤 두 프레임 동안 앱 화면 층을 바꿔 다시 그리게 한다(테마 body.lg-vib-nudge)
  // 패널 탭이 심플(렌즈 없이 선택한 탭을 강조색으로) 방식인지. 좌우 패널 투명이 켜져 있으면 렌즈를 쓰지 않는다 (사용자 결정):
  // 렌즈가 떠 오는 화면에 패널 바탕이 없어 원래 탭 줄 테두리와 렌즈 안 테두리가 두 줄로 보였고, 맥은 렌즈가 매 프레임 다시 그려져
  // 반투명 덧칠 깜빡임이 늘었다(측정: 목록이 렌즈보다 4~10배 적다). 목록 방식 패널은 그대로 목록이다
  tabPlain(this: GlassShelfPlugin) {
    return this.settings.tabAnim === "none" || document.body.classList.contains("lg-acrylic");
  },

  // 좌우 패널 투명을 켤 때 알린다: 렌즈를 쓰던 패널 탭이 심플로 보인다 (사용자 요청). 렌즈를 쓰는 패널이 없으면(심플, 양쪽 목록) 알리지 않는다
  noticeSimpleTabs(this: GlassShelfPlugin) {
    const s = this.settings;
    if (s.tabAnim === "none" || (s.tabAnim === "list" && (s.tabListSides || "both") === "both")) return;
    new Notice(tr("좌우 패널 투명이 켜져 있으면 탭 전환 효과는 렌즈 대신 심플로 보입니다.", "With see-through side panels on, the tab switch effect is shown as Simple instead of Lens."));
  },

  vibNudge(this: GlassShelfPlugin) {
    window.setTimeout(() => {
      if (this.unloaded) return;
      document.body.classList.add("lg-vib-nudge");
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => document.body.classList.remove("lg-vib-nudge")));
    }, 300);
  },

  // 맥: Obsidian 반투명 창을 켜고 끄면(body.is-translucent, 재시작 없이 바뀐다) 따라간다
  watchTranslucent(this: GlassShelfPlugin, on: boolean) {
    if (!on) {
      if (this.translucentObs) this.translucentObs.disconnect();
      this.translucentObs = null;
      return;
    }
    if (this.translucentObs) return;
    let was = document.body.classList.contains("is-translucent");
    this.translucentObs = new MutationObserver(() => {
      const now = document.body.classList.contains("is-translucent");
      if (now === was) return;
      was = now;
      if (this.unloaded) return;
      this.applyAcrylic(true);
      if (now) this.noticeSimpleTabs();
    });
    this.translucentObs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  },

  // 아크릴 색 맞추기 (사용자 요청): Windows 는 창의 라이트·다크에 따라 아크릴 위에 밝은 막·어두운 막을 덮는다.
  // 창은 Windows 설정을 따라 Obsidian 이 라이트여도 다크 아크릴이 깔려, 패널 바탕을 옅게 한 알약 자리만 시커멓게 보였다.
  // 켜 있는 동안 창 테마(nativeTheme.themeSource, Electron 공개 API)를 Obsidian 의 지금 라이트·다크에 맞추고, 바뀌면(body.theme-dark) 따라간다.
  // 끄면 원래 값으로 되돌린다. Obsidian 테마와 같은 쪽으로만 맞추므로 '시스템 따라가기'여도 서로 뒤집지 않는다
  acrylicTheme(this: GlassShelfPlugin, on: boolean) {
    if (this.acrylicThemeOff) {
      this.acrylicThemeOff();
      this.acrylicThemeOff = null;
    }
    if (!on) return;
    const remote = window.require ? window.require("electron").remote : undefined;
    const nt = remote && remote.nativeTheme;
    if (!nt) return;
    const prev = nt.themeSource;
    const sync = () => {
      const v = document.body.classList.contains("theme-dark") ? "dark" : "light";
      if (nt.themeSource === v) return;
      nt.themeSource = v;
      if (Platform.isMacOS) this.vibNudge();
    };
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    this.acrylicThemeOff = () => {
      mo.disconnect();
      nt.themeSource = prev;
    };
  },

  // Obsidian 의 닫힌 폴더 기호를 마스크용 그림 주소로 (한 번만 만든다)
  folderLineUrl(this: GlassShelfPlugin) {
    if (this.folderLine) return this.folderLine;
    const svg = getIcon("folder-closed");
    if (!svg) return "";
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("stroke", "#000");
    svg.removeAttribute("class");
    this.folderLine = `url("data:image/svg+xml,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}")`;
    return this.folderLine;
  },

  applyBodyState(this: GlassShelfPlugin, doc: Document) {
    const b = doc.body;
    if (!b) return;
    b.classList.add("lg-ui");
    b.classList.toggle("lg-tg-accent", this.settings.toggleColor === "accent");
    // 유리 투명도: 1~5 는 바래는 비율(--lg-fade), 6~10 은 뿌연 채움(--lg-frost, 예전 뿌연 정도 1~5 와 같은 값)
    const g = this.settings.glassLevel;
    // 1단계 0.45 에서 5단계 0.8 까지 고르게 (사용자 요청). 0단계는 0
    const f = g <= 0 ? 0 : 0.45 + ((Math.min(g, 5) - 1) * 0.35) / 4;
    b.style.setProperty("--lg-fade", String(+f.toFixed(4)));
    b.style.setProperty("--lg-frost", String((Math.max(0, g - 5) / 10) * 0.3));
    b.style.setProperty("--lg-hover-k", this.settings.hoverLarge ? "1" : "0");
    b.classList.toggle("lg-show-path", !!this.settings.showPath);
    b.classList.toggle("lg-web-under", !!this.settings.webTint && !Platform.isPhone);
    b.classList.toggle("lg-mini-bar", !!this.settings.miniBar);
    b.classList.toggle("lg-pop-opaque", !!this.settings.popupOpaque);
    b.classList.toggle("lg-wc-compact", !!this.settings.compactWindowControls);
    this.applyDevicePx(doc);
    // 틴트: 유리 위에 색을 옅게 한 겹 (CSS: body.lg-tinted)
    const s = this.settings;
    const color = s.tint === "accent" ? "var(--interactive-accent)" : s.tint === "obsidian" ? OBSIDIAN_PURPLE : s.tintColor;
    b.classList.toggle("lg-tinted", s.tint !== "none");
    b.style.setProperty("--lg-tint-color", color);
    b.style.setProperty("--lg-tint-p", `${s.tintLevel * 4}%`);
    // 흰 글자 토글 (CSS: body.lg-tint-ink-light, 라이트 모드에서만 효과)
    b.classList.toggle("lg-tint-ink-light", s.tint !== "none" && !!s.tintWhiteInk);
    // 선택된 패널 탭 색 설정은 없앴다 (사용자 요청). 테마 기본(강조색)을 쓴다. 예전 값이 남아 있지 않게 지운다
    b.style.removeProperty("--lg-active-tab-color");
    // 패널 탭 설정 (CSS: body.lg-tab-plain / lg-tab-wide / lg-tab-names)
    b.classList.toggle("lg-tab-plain", this.tabPlain());
    b.classList.toggle("lg-tab-wide", !!s.tabWide);
    b.classList.toggle("lg-tab-names", !!s.tabNames);
    // 파일 탐색기 기호 (CSS: body.lg-ficon-none / lg-ficon-line). Obsidian 기호는 Obsidian 의 닫힌 폴더 기호(folder-closed)를
    // 그대로 떠서 마스크(--lg-folder-line)로 쓰고 폴더 색으로 칠한다
    b.classList.toggle("lg-ficon-none", s.fileIcons === "none");
    b.classList.toggle("lg-ficon-line", s.fileIcons === "line");
    const line = s.fileIcons === "line" ? this.folderLineUrl() : "";
    if (line) b.style.setProperty("--lg-folder-line", line);
    else b.style.removeProperty("--lg-folder-line");
    // 파일 탐색기 들여쓰기 세로줄 끄기 (CSS: body.lg-no-guides)
    b.classList.toggle("lg-no-guides", s.fileGuides === false);
    // 헤더 밑 가로줄 (CSS: body.lg-hrule)
    b.classList.toggle("lg-hrule", !!s.headingRule);
    // 모바일 파일 탐색기 줄 간격 (CSS: body.lg-nav-compact, 모바일에서만 효과)
    b.classList.toggle("lg-nav-compact", !!s.navCompact);
    // 효과 없음 모드의 글자색은 테마가 강조색에서 바로 계산한다 (예전 값이 남아 있지 않게 지운다)
    b.style.removeProperty("--lg-tab-on-ink");
    // 할 일 체크박스 (CSS: body.lg-task-ring, --lg-task-color). 노랑은 테마 값(라이트·다크 각각)을 쓴다
    b.classList.toggle("lg-task-ring", s.taskStyle === "ring");
    if (s.taskColor === "yellow") b.style.removeProperty("--lg-task-color");
    else b.style.setProperty("--lg-task-color", s.taskColor === "accent" ? "var(--interactive-accent)" : s.taskColorCustom);
    this.applyFolderColor(doc);
  },

  // 테마가 꺼지거나 플러그인을 끌 때의 정리 (자식 Component 의 onunload. 등록해 둔 정리가 끝난 뒤에 돈다, 예전 플러그인 onunload 와 같은 순서)
  teardown(this: GlassShelfPlugin) {
    this.applyAcrylic(false);
    // 끈 뒤에 늦게 도는 프레임·타이머가 화면을 다시 만들지 않게 표시해 둔다 (refresh·attachDoc 등이 보고 돌아간다, 검토 지적)
    this.unloaded = true;
    if (this.saveTimer) {
      window.clearTimeout(this.saveTimer);
      this.saveTimer = 0;
      void this.saveData(this.settings);
    }
    if (this.frame) window.cancelAnimationFrame(this.frame);
    if (this.fcFrame) window.cancelAnimationFrame(this.fcFrame);
    this.frame = this.fcFrame = 0;
    if (this.pendingRelease) this.pendingRelease.forEach((f) => f());
    this.observers.forEach((o) => o.disconnect());
    this.refractor.destroy();
    for (const doc of this.docs) {
      if (!doc.body) continue;
      doc.querySelectorAll<HTMLElement>(".workspace-tab-header-container-inner").forEach((el) => el.style.removeProperty("--lg-snap-y"));
      doc.querySelectorAll<HTMLElement>(".lg-kb-group").forEach((g) => {
        while (g.firstChild) g.parentElement.insertBefore(g.firstChild, g);
      });
      doc.querySelectorAll<HTMLElement>(".lg-kb-searching").forEach((el: HTMLElement) => el.classList.remove("lg-kb-searching"));
      doc.querySelectorAll<HTMLElement>(".lg-kb-search-btn").forEach((el: HTMLElement) => el.classList.remove("lg-kb-search-btn"));
      doc.querySelectorAll<HTMLElement>(".lg-dashed").forEach((el: HTMLElement) => el.classList.remove("lg-dashed"));
      doc.querySelectorAll<HTMLElement>(".bases-toolbar .lg-on").forEach((el: HTMLElement) => el.classList.remove("lg-on"));
      doc.querySelectorAll<HTMLElement>(".lg-tab-tools").forEach((g) => {
        while (g.firstChild) g.parentElement.insertBefore(g.firstChild, g);
      });
    }
    if (this.webCard) this.closeWebCard(true);
    this.webUninject();
    for (const doc of this.docs) if (doc.body) doc.querySelectorAll<HTMLElement>(".workspace-tabs").forEach((t) => this.navSearchOut(t));
    for (const doc of this.docs) if (doc.body) doc.querySelectorAll<HTMLElement>(".lg-path-text").forEach((el: HTMLElement) => this.returnTitle(el));
    for (const doc of this.docs) {
      if (!doc.body) continue;
      doc.querySelectorAll<HTMLElement>(".workspace-tabs").forEach((t) => {
        if (t.lgWebTab) this.webTab(t, null, false);
      });
      doc.querySelectorAll<HTMLElement>(".lg-web-head").forEach((h) => h.classList.add("view-header-always-show"));
    }
    for (const doc of this.docs) {
      if (!doc.body) continue;
      doc.querySelectorAll<HTMLElement>("." + INJECTED).forEach((el: HTMLElement) => el.remove());
      // 플러그인이 Obsidian 요소(body 포함)에 붙인 lg- 클래스와 --lg- 변수를 모두 걷어 낸다.
      // 목록을 따로 두면 새 설정·상태를 더할 때 빠뜨리기 쉬워 접두사로 찾는다
      doc.querySelectorAll<HTMLElement>('[class*="lg-"]').forEach((el: HTMLElement) => {
        const cls = strs(el.classList).filter((c) => c.startsWith("lg-"));
        if (cls.length) el.classList.remove(...cls);
      });
      doc.querySelectorAll<HTMLElement>('[style*="--lg-"]').forEach((el: HTMLElement) => {
        const props: string[] = [];
        for (let i = 0; i < el.style.length; i++) if (el.style[i].startsWith("--lg-")) props.push(el.style[i]);
        props.forEach((p) => el.style.removeProperty(p));
      });
      // 요소·문서에 붙여 둔 lg 표시(lgBandObs, lgNavRoot, lgLens 등)를 걷어 낸다: 남으면 다시 켰을 때 "이미 연결됨"으로 보고 건너뛴다 (검토 지적).
      // 걸어 둔 애니메이션은 취소하고(버튼이 숨은 채 남지 않게), 감시는 끊고, 타이머·프레임은 멈춘다
      const win = doc.defaultView || window;
      const scrub = (target: object) => {
        const o = target as Record<string, unknown>;
        for (const k of Object.keys(o)) {
          if (!/^lg[A-Z]/.test(k)) continue;
          const v = o[k] as { cancel?: unknown; disconnect?: unknown } | number | null;
          try {
            if (v && typeof v === "object" && typeof v.cancel === "function") (v as Animation).cancel();
            else if (v && typeof v === "object" && typeof v.disconnect === "function") (v as MutationObserver).disconnect();
            else if (typeof v === "number" && /Timer/.test(k)) win.clearTimeout(v);
            else if (typeof v === "number" && /Loop|Frame|Raf/.test(k)) win.cancelAnimationFrame(v);
          } catch {
            /* 이미 끝난 것 */
          }
          delete o[k];
        }
      };
      scrub(doc);
      doc.querySelectorAll<HTMLElement>("*").forEach(scrub);
    }
    this.app.workspace.iterateAllLeaves((leaf) => leaf.view && (() => { const v = leaf.view as unknown as Record<string, unknown>; for (const k of Object.keys(v)) if (/^lg[A-Z]/.test(k)) delete v[k]; })());
  },

  applySettings(this: GlassShelfPlugin) {
    for (const doc of this.docs) this.applyBodyState(doc);
    this.applyAcrylic(true);
    this.refractor.setEnabled(this.refractOn());
    this.requestRefresh();
  },

  // 설정은 바로 반영하고, 파일 저장은 0.4초 모아서 한 번 한다 (검토 지적: 색 고르기·글자 칸은 입력할 때마다 data.json 을 썼다). 끌 때 남은 저장은 바로 한다
  async saveSettings(this: GlassShelfPlugin) {
    this.applySettings();
    if (this.saveTimer) window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => {
      this.saveTimer = 0;
      void this.saveData(this.settings);
    }, 400);
  },

  // 이벤트가 몰려 와도 한 프레임에 한 번만 갱신
  requestRefresh(this: GlassShelfPlugin) {
    if (this.unloaded) return;
    if (this.frame) return;
    this.frame = window.requestAnimationFrame(() => {
      this.frame = null;
      this.refresh();
    });
  },

  refresh(this: GlassShelfPlugin) {
    if (this.unloaded) return;
    const ws = this.app.workspace;
    // 폴더 색·줄무늬는 목록마다 단 감시가 이후 변화를 맡는다. 여기서는 아직 감시를 달지 않은 파일 탐색기 목록이 있을 때만 부른다
    // (검토 지적: 레이아웃이 바뀔 때마다 모든 목록을 다시 칠하고 줄무늬를 다시 쟀다)
    if (this.shared && this.shared.folderColorsByName && this.hasNewExplorer()) this.requestFolderColors();
    // 모바일 사이드바는 서랍(탭 줄 없음)이라 ··· · 닫기 버튼을 달지 않는다.
    // 대신 테마가 펼쳐 둔 보기 전환 줄에 선택 렌즈를 붙인다
    if (!Platform.isMobile) {
      this.setupSidebar(ws.leftSplit, "left");
      this.setupSidebar(ws.rightSplit, "right");
    } else {
      this.markTabList(ws.leftSplit, "left");
      this.markTabList(ws.rightSplit, "right");
      this.watchDrawerTabs(ws.leftSplit);
      this.watchDrawerTabs(ws.rightSplit);
      this.setupDrawerMore(ws.leftSplit);
      this.setupDrawerMore(ws.rightSplit);
    }
    this.markBareHeads(ws.leftSplit);
    this.markBareHeads(ws.rightSplit);
    // 왼쪽 패널 토글 버튼에 표시를 붙인다(패널이 닫히면 탭 줄, 열리면 리본 맨 위로 옮겨지는 같은 요소라 어디 있든 붙인다) (styles.css 리본 여닫기 애니메이션이 이것으로 고른다. 흔한 .clickable-icon 으로 고르면
    // 패널을 여닫을 때마다 모든 아이콘 버튼 스타일을 다시 계산했다). 리본을 다시 그리면 사라지므로 매번 확인한다
    if (!Platform.isMobile) {
      const tgl = ws.containerEl.querySelector<HTMLElement>(".sidebar-toggle-button.mod-left > .clickable-icon");
      if (tgl && !tgl.classList.contains("lg-rib-tgl")) tgl.classList.add("lg-rib-tgl");
    }
    // 휴대폰은 편집창 탭 줄이 없고 뷰 헤더가 그 버튼들을 가진다. 탭 줄 배치를 하면 뷰 헤더의 ⋮ · 읽기 모드 버튼까지 숨는다
    if (!Platform.isPhone) {
      ws.rootSplit.containerEl
        .querySelectorAll<HTMLElement>(".workspace-tabs")
        .forEach((tabsEl) => this.setupRootTabs(tabsEl));
      // 별도 창(팝아웃)의 편집창 탭 줄도 같게 꾸민다 (예전엔 메인 창만 봐서 별도 창 탭 줄은 도구 없이 남았다, 검토 지적)
      for (const doc of this.docs) {
        if (doc === document || !doc.body) continue;
        doc.querySelectorAll<HTMLElement>(".workspace-split.mod-root .workspace-tabs").forEach((tabsEl: HTMLElement) => this.setupRootTabs(tabsEl));
      }
    }
    if (!Platform.isPhone) ws.getLeavesOfType("kanban").forEach((l) => l.view instanceof ItemView && this.setupKanban(l.view));
    if (!Platform.isPhone) ws.getLeavesOfType("bases").forEach((l) => l.view instanceof ItemView && this.setupBases(l.view));
    this.refractor.prune();
    if (this.refractOn()) {
      for (const [sel, strength] of Platform.isMobile ? REFRACT_TARGETS.concat(REFRACT_TARGETS_MOBILE) : REFRACT_TARGETS) {
        document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
          if (el.matches(".titlebar-button-container.mod-right")) return; // 창 제어 알약은 wcRefract 가 맡는다
          this.refractor.attach(el, strength, false);
        });
      }
      this.wcRefract(document, document.body.classList.contains("lg-wc-hover"));
    }
    this.markStructure();
  },

  // 테마가 구조로 판정하던 것(:has, 스토어 린트 권고)을 플러그인이 표시로 알린다. 요소가 바뀌면 그 자리에서(그리기 전) 다시 판정한다.
  // - .lg-solo: 버튼 묶음에 버튼이 하나만 남음(앞으로가 숨은 뒤로·앞으로, 실행 버튼 하나, 칸반 버튼·탭 줄 오른쪽 묶음 하나) → 원 모양
  // - .lg-tab-single: 편집창 탭 줄에 (닫히는 복제본을 빼고) 탭이 하나뿐 → 트랙 없이 선택 알약만
  // - .lg-split-multi: 편집창이 나뉨(창 둘 이상 또는 다시 나뉜 묶음) → 분할 구분선 모서리를 그린다
  markStructure(this: GlassShelfPlugin) {
    for (const doc of this.docs) {
      if (!doc.body) continue;
      doc.querySelectorAll<HTMLElement>(".lg-tab-nav").forEach((el: HTMLElement) => this.watchMark(el, "lg-solo", () => !!el.querySelector<HTMLElement>(":scope > .lg-tab-forward.lg-nav-hide"), true));
      doc.querySelectorAll<HTMLElement>(".lg-nav-run").forEach((el: HTMLElement) => this.watchMark(el, "lg-solo", () => el.childElementCount === 1 && el.firstElementChild.classList.contains("clickable-icon")));
      doc.querySelectorAll<HTMLElement>(".view-actions > .lg-kb-group, .workspace-tab-header-container > .lg-tab-tools").forEach((el: HTMLElement) => this.watchMark(el, "lg-solo", () => el.childElementCount === 1));
      doc.querySelectorAll<HTMLElement>(".mod-root .workspace-tab-header-container-inner").forEach((el: HTMLElement) =>
        this.watchMark(el, "lg-tab-single", () => el.querySelectorAll<HTMLElement>(":scope > .workspace-tab-header:not(.lg-tab-leaving)").length < 2, true)
      );
      doc.querySelectorAll<HTMLElement>(".workspace-split.mod-root").forEach((el: HTMLElement) =>
        this.watchMark(el, "lg-split-multi", () => el.querySelectorAll<HTMLElement>(":scope > .workspace-tabs").length > 1 || !!el.querySelector<HTMLElement>(":scope > .workspace-split"))
      );
    }
  },

  // el 에 cls 를 test() 결과대로 붙이고, 자식이 바뀌면(attrs: 자식들의 클래스가 바뀌어도) 다시 판정한다. 요소마다 감시는 하나
  watchMark(this: GlassShelfPlugin, el: HTMLElement, cls: string, test: () => boolean, attrs?: boolean) {
    if (!this.markWatched) this.markWatched = new WeakMap();
    const sync = () => el.classList.toggle(cls, !!test());
    sync();
    if (this.markWatched.has(el)) return;
    const win = el.ownerDocument.defaultView || window;
    const obs = new win.MutationObserver(sync);
    obs.observe(el, attrs ? { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] } : { childList: true });
    this.markWatched.set(el, obs);
    this.observers.push(obs);
  },
};
