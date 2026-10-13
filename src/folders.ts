import type { Palette, RawSettings } from "./settings";
import { Notice, TFolder, Platform } from "obsidian";
import { tr, INJECTED, els } from "./util";
import { resolveRgb, folderIconUrl, FOLDER_PALETTE, hexToRgb, fileIconUrl } from "./color";
import { FolderColorModal } from "./folder-modal";
import { STRIPE_FOLLOW_MS } from "./constants";
import type { GlassShelfPlugin } from "./host";

export const foldersMethods = {
  // 폴더 기호 색 (CSS: --lg-folder-icon). 파랑은 테마의 기호를 그대로 쓴다.
  // 그 밖의 색은 테마 파랑 폴더와 같은 짜임으로 다시 그린다: 앞판 아래 = 고른 색, 앞판 위 = 흰색 22%, 뒤판 = 검정 15%, 빛 선 = 흰색 55%
  applyFolderColor(this: GlassShelfPlugin, doc: Document) {
    const b = doc.body;
    if (!b) return;
    const s = this.settings;
    // Obsidian 기호(선 하나)는 그림 대신 색만 쓴다 (CSS: --lg-folder-tint)
    if (s.folderColor === "accent" || s.folderColor === "custom") b.setCssProps({ "--lg-folder-tint": s.folderColor === "accent" ? "var(--interactive-accent)" : s.folderColorCustom });
    else b.style.removeProperty("--lg-folder-tint");
    if (s.folderColor !== "accent" && s.folderColor !== "custom") return b.style.removeProperty("--lg-folder-icon");
    const rgb = resolveRgb(doc, s.folderColor === "accent" ? "var(--interactive-accent)" : s.folderColorCustom);
    if (!rgb) return b.style.removeProperty("--lg-folder-icon");
    b.style.setProperty("--lg-folder-icon", folderIconUrl(rgb));
  },

  // ---------- 폴더 색 ----------
  // 색은 폴더 이름 기준: 공유 설정(data.json)의 folderColorsByName { 폴더 이름: "#hex" }. 이름이 같은 폴더는 어디에 있든
  // (최상위 포함) 같은 색이고, 같은 이름으로 새로 만든 폴더도 바로 그 색이 된다 (사용자 요청. PARA 범주마다 같은 분야 폴더가 생긴다).
  // 예전 경로 기준(folderColors)은 한 번 이름 기준으로 옮긴다.
  // 파일 탐색기의 색 지정 폴더(.nav-folder)에 lg-fc 클래스와 변수(--lg-fc 색, --lg-folder-icon 그 색 기호)를 붙이면
  // 하위 폴더는 변수를 물려받아 같은 색이 된다 (하위에 따로 지정한 색이 있으면 그 색). 글자·화살표·세로줄은 CSS(styles.css)가 칠한다.
  // :has() 로 경로를 찾지 않으려고 플러그인이 요소에 직접 붙인다 (넓은 범위 :has 는 끌기 렉)
  async setupFolderColors(this: GlassShelfPlugin, raw: RawSettings) {
    if (!raw.folderColorsByName || typeof raw.folderColorsByName !== "object") {
      const byPath: Record<string, string> | null = raw.folderColors && typeof raw.folderColors === "object" ? raw.folderColors : null;
      const byName: Record<string, string> = {};
      for (const [path, hex] of Object.entries(byPath || {})) if (hexToRgb(hex)) byName[path.split("/").pop() || path] = hex;
      this.shared.folderColorsByName = byName;
      delete this.shared.folderColors;
      await this.saveData(this.shared);
    }

    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (!(file instanceof TFolder) || file.isRoot()) return;
        menu.addItem((item) => item.setTitle(tr("폴더 색", "Folder color")).setIcon("palette").onClick(() => this.pickFolderColor(file)));
      })
    );
    // 폴더 이름을 바꾸면: 옛 이름을 쓰는 폴더가 더는 없으면 색을 새 이름으로 옮긴다 (새 이름에 이미 색이 있으면 그 색을 둔다).
    // 같은 이름 폴더가 남아 있으면 옛 이름의 색은 그대로 두고, 바뀐 폴더는 새 이름의 색(없으면 기본)을 따른다.
    // 옮기기만 하면(이름 그대로) 할 일이 없다. 지운 폴더의 이름은 같은 이름이 하나도 안 남았을 때 색을 지운다
    const nameUsed = (name: string) => this.app.vault.getAllFolders().some((f) => f.name === name);
    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => {
        if (!(file instanceof TFolder)) return;
        const map = this.shared.folderColorsByName;
        const oldName = oldPath.split("/").pop();
        if (oldName === file.name || !map[oldName] || nameUsed(oldName)) return;
        if (!map[file.name]) map[file.name] = map[oldName];
        delete map[oldName];
        void this.saveFolderColors();
      })
    );
    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        if (!(file instanceof TFolder)) return;
        const map = this.shared.folderColorsByName;
        if (!map[file.name] || nameUsed(file.name)) return;
        delete map[file.name];
        void this.saveFolderColors();
      })
    );
    this.app.workspace.onLayoutReady(() => this.requestFolderColors());
  },

  async saveFolderColors(this: GlassShelfPlugin) {
    await this.saveData(this.shared);
    this.requestFolderColors(true);
  },

  // 색 고르기: 그 이름에 색을 정한다 (같은 이름 폴더 모두)
  pickFolderColor(this: GlassShelfPlugin, folder: TFolder) {
    const map = this.shared.folderColorsByName;
    new FolderColorModal(this.app, folder, map[folder.name], (hex) => {
      if (hex) map[folder.name] = hex;
      else delete map[folder.name];
      const n = this.app.vault.getAllFolders().filter((f) => f.name === folder.name).length;
      if (n > 1) new Notice(tr(`'${folder.name}' 이름의 폴더 ${n}개에 ${hex ? "색을 적용했습니다." : "지정한 색을 지웠습니다."}`, `${hex ? "Applied the color to" : "Cleared the color of"} ${n} folders named '${folder.name}'.`));
      void this.saveFolderColors();
    }, this.folderPalette()).open();
  },

  // 색 고르기 창의 팔레트: 설정에서 고친 것(공유 data.json 의 folderPalette [[이름, "#hex"], …]), 없으면 기본(FOLDER_PALETTE)
  folderPalette(this: GlassShelfPlugin): Palette {
    const p = this.shared && this.shared.folderPalette;
    return Array.isArray(p) ? p : FOLDER_PALETTE;
  },

  // 아직 폴더 색·줄무늬 감시를 달지 않은 파일 탐색기 목록이 있는지
  hasNewExplorer(this: GlassShelfPlugin) {
    if (!this.fcWatched) return true;
    for (const doc of this.docs) {
      for (const list of doc.querySelectorAll<HTMLElement>('.workspace-leaf-content[data-type="file-explorer"] .nav-files-container')) if (!this.fcWatched.has(list)) return true;
    }
    return false;
  },

  // 이 이름을 쓰는 폴더 수
  folderCount(this: GlassShelfPlugin, name: string) {
    return this.app.vault.getAllFolders().filter((f) => f.name === name).length;
  },

  // 폴더가 새로 그려질 때(펼치기·새 폴더) 다시 칠한다. 파일 탐색기 목록마다 한 번 감시를 단다
  requestFolderColors(this: GlassShelfPlugin, all?: boolean) {
    if (this.unloaded) return;
    if (all) this.fcAll = true;
    if (this.fcFrame) return;
    this.fcFrame = window.requestAnimationFrame(() => {
      this.fcFrame = 0;
      const full = !!this.fcAll;
      this.fcAll = false;
      this.applyFolderColors(full);
    });
  },

  applyFolderColors(this: GlassShelfPlugin, full: boolean) {
    const map = (this.shared && this.shared.folderColorsByName) || {};
    if (!this.fcWatched) {
      this.fcWatched = new WeakSet();
      this.register(() => {
        for (const doc of this.docs) doc.querySelectorAll<HTMLElement>(".nav-folder.lg-fc").forEach((f) => delete f.dataset.lgFc);
      });
    }
    for (const doc of this.docs) {
      for (const list of doc.querySelectorAll<HTMLElement>('.workspace-leaf-content[data-type="file-explorer"] .nav-files-container')) {
        if (!this.fcWatched.has(list)) {
          this.fcWatched.add(list);
          const win = doc.defaultView || window;
          const obs = new win.MutationObserver((records) => {
            for (const r of records) {
              // 줄무늬 층 안의 변화(막대 더하기·빼기)는 무시한다
              if ((r.target as Element).closest && (r.target as Element).closest<HTMLElement>(".lg-stripes")) continue;
              if (r.type === "childList") {
                if (els(r.addedNodes).concat(els(r.removedNodes)).every((nd) => nd.classList && nd.classList.contains("lg-stripes"))) continue;
                this.followStripes(list);
                return this.requestFolderColors();
              }
              // 줄의 선택·끌기 상태가 바뀌면 그 줄의 줄무늬 막대를 숨기거나 보인다
              if ((r.target as HTMLElement).classList.contains("tree-item-self")) this.stripeUnder(list);
              const now = (r.target as HTMLElement).classList.contains("is-collapsed");
              const was = (r.oldValue || "").split(/\s+/).includes("is-collapsed");
              if (now !== was) {
                this.followStripes(list);
                return this.requestFolderColors();
              }
            }
          });
          obs.observe(list, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"], attributeOldValue: true });
          // 호버는 클래스가 바뀌지 않아 커서가 줄을 오갈 때 다시 본다
          const hover = () => this.stripeUnder(list);
          list.addEventListener("pointerover", hover, { passive: true });
          list.addEventListener("pointerleave", hover, { passive: true });
          this.register(() => {
            list.removeEventListener("pointerover", hover);
            list.removeEventListener("pointerleave", hover);
          });
          this.observers.push(obs);
          // 패널 폭이 바뀌면 줄무늬 막대 폭도 다시 맞춘다
          const ro = new win.ResizeObserver(() => this.requestFolderColors());
          ro.observe(list);
          this.observers.push(ro);
        }
        for (const title of list.querySelectorAll<HTMLElement>(".nav-folder-title[data-path]")) {
          const f = title.parentElement;
          if (!f) continue;
          const hex = map[title.dataset.path.split("/").pop()];
          const was = f.dataset.lgFc || "";
          if ((hex || "") === was && !full) continue;
          if (hex) {
            const rgb = hexToRgb(hex);
            f.dataset.lgFc = hex;
            f.classList.add("lg-fc");
            f.style.setProperty("--lg-fc", hex);
            if (rgb) {
              f.style.setProperty("--lg-folder-icon", folderIconUrl(rgb));
              f.style.setProperty("--lg-file-icon", fileIconUrl(rgb));
            }
          } else if (was) {
            delete f.dataset.lgFc;
            f.classList.remove("lg-fc");
            f.style.removeProperty("--lg-fc");
            f.style.removeProperty("--lg-folder-icon");
            f.style.removeProperty("--lg-file-icon");
          }
        }
        this.applyStripes(list);
      }
    }
  },

  // 파일 탐색기 줄무늬 (사용자 요청, macOS Finder 목록 보기 참고): 한 줄 건너 한 줄에 흰 줄 (CSS: .lg-stripes, 줄 곡률 그대로).
  // 줄 자체 배경으로 칠하면 들여쓰기 세로선을 덮어서, 목록 맨 뒤 층(.lg-stripes, z-index -1)에 막대를 따로 그린다.
  // 몇째 줄인지는 Finder 처럼 보이는 줄의 순서로 센다: 처음 그려진 줄의 번호만 위치(목록 위 여백을 뺀 거리 / 줄 높이)로 정하고
  // (Obsidian 은 보이는 부분만 그린다), 그다음은 DOM 순서대로 하나씩 더한다. 예전엔 줄마다 위치로 셌는데, 열고 닫는
  // 애니메이션 중에 움직이는 줄은 위치가 줄 높이의 배수가 아니라 줄무늬가 켜졌다 꺼졌다 깜빡였다(사용자 지적).
  // 막대는 줄마다 하나씩 붙여 두고(stripeBars) 그 줄을 따라 움직인다. 열리고 닫히는 폴더 안쪽 줄은 그 폴더의 보이는 영역으로 자른다.
  // 폭은 목록 안쪽 폭에서 맨 위 단계 줄의 좌우 여백을 뺀 값 (스크롤바가 생겨도 무늬 폭이 줄 폭을 따라 들쭉날쭉하지 않게).
  // 설정에서 끄면(fileStripes) 층을 비운다
  applyStripes(this: GlassShelfPlugin, list: HTMLElement) {
    // 줄 자리는 rowExtent 가 잰 것을 그대로 쓴다 (줄마다 두 번 재던 것을 한 번으로. 스크롤 중 보이는 줄이 바뀔 때마다 돈다)
    const m = this.rowExtent(list);
    let layer = list.querySelector<HTMLElement>(":scope > .lg-stripes");
    // 모바일에서는 줄무늬를 쓰지 않는다 (사용자 요청, 설정에서도 숨긴다)
    if (!this.settings.fileStripes || Platform.isMobile) {
      if (layer) layer.remove();
      list.classList.remove("lg-has-stripes");
      return;
    }
    if (!layer) {
      layer = createDiv({ cls: ["lg-stripes", INJECTED] });
      list.appendChild(layer); // 맨 끝에 둔다: Obsidian 가상 스크롤이 쓰는 첫 자식을 건드리지 않게
    }
    list.classList.add("lg-has-stripes");
    if (!this.stripeBars) this.stripeBars = new WeakMap();
    const rows = m.rows, rects = m.rects, lr = m.lr;
    const top = (rc: DOMRect) => rc.top - lr.top + list.scrollTop;
    let step = list.lgStripeStep || 0;
    if (!step) {
      step = Infinity;
      for (let i = 1; i < rects.length; i++) {
        const d = rects[i].top - rects[i - 1].top;
        if (d > 4 && d < step) step = d;
      }
      if (!isFinite(step)) step = (rows[0] && rows[0].offsetHeight) || 28;
      else list.lgStripeStep = step;
    }
    const pad = parseFloat(getComputedStyle(list).paddingTop) || 0;
    const k0 = rows.length ? Math.round((top(rects[0]) - pad) / step) : 0;
    // 폭: 왼쪽은 목록 왼쪽 끝에서 알약 간격(--lg-gap)만큼 띄운 자리(줄 하이라이트와 같은 자리), 오른쪽은 목록 안쪽 끝(스크롤바 칸 왼쪽 끝)까지.
    // 막대와의 거리가 막대 둘레 테두리(창 가장자리와의 거리와 같다)가 된다 (사용자 요청)
    // 왼쪽 끝은 줄마다 같다: 반복문 밖에서 한 번만 읽는다 (막대를 쓰는 사이에 스타일을 읽으면 줄마다 다시 계산했다, 검토 지적)
    const bl = m.gl;
    const keep = new Set();
    rows.forEach((r, i) => {
      if ((k0 + i) % 2 !== 1) return;
      const rc = rects[i];
      // 열리고 닫히는 폴더 안쪽: 감싼 하위 목록들의 보이는 아래 끝으로 자른다
      let bottom = rc.bottom;
      for (let c = r.parentElement && r.parentElement.closest<HTMLElement>(".tree-item-children"); c && list.contains(c); c = c.parentElement && c.parentElement.closest<HTMLElement>(".tree-item-children")) {
        bottom = Math.min(bottom, c.getBoundingClientRect().bottom);
      }
      const h = bottom - rc.top;
      if (h <= 0.5) return;
      let bar = this.stripeBars.get(r);
      if (!bar || bar.parentElement !== layer) {
        bar = layer.createDiv("lg-stripe-bar");
        this.stripeBars.set(r, bar);
      }
      keep.add(bar);
      bar.style.top = `${top(rc)}px`;
      // 왼쪽은 목록 왼쪽 끝에서 알약 간격(--lg-gap)만큼 (줄 하이라이트와 같은 자리, 사용자 요청)
      bar.style.left = `${bl + list.scrollLeft}px`;
      bar.style.width = `${list.clientWidth - bl}px`;
      bar.style.height = `${h}px`;
    });
    for (const bar of els(layer.children)) if (!keep.has(bar)) bar.remove();
    this.stripeUnder(list);
  },

  // 하이라이트(호버·선택·끌기)가 깔린 줄의 줄무늬 막대를 숨긴다 (CSS: .lg-stripe-bar.lg-stripe-hide, 사용자 요청).
  // 하이라이트가 반투명이라 줄무늬 위에서만 옅어 보였다
  stripeUnder(this: GlassShelfPlugin, list: HTMLElement) {
    if (!this.stripeBars) return;
    for (const r of list.querySelectorAll<HTMLElement>(".tree-item-self")) {
      const bar = this.stripeBars.get(r);
      if (!bar || !bar.isConnected) continue;
      const on = r.matches(".is-active, .is-selected, .is-being-dragged-over, .is-being-dragged, .is-clickable:hover");
      if (bar.classList.contains("lg-stripe-hide") !== on) bar.classList.toggle("lg-stripe-hide", on);
    }
  },

  // 줄 하이라이트(CSS: 파일 탐색기 .tree-item-self::before)를 줄무늬와 같은 폭으로: 왼쪽은 목록 왼쪽 끝에서 알약 간격(--lg-gap),
  // 오른쪽은 목록 안쪽 끝(스크롤바 칸 왼쪽 끝)까지. 맨 위 단계 줄(가장 넓은 줄)로 잰다 (사용자 요청)
  // 보이는 줄과 그 자리를 돌려준다 (applyStripes 가 같은 측정을 쓴다)
  rowExtent(this: GlassShelfPlugin, list: HTMLElement): { rows: HTMLElement[]; rects: DOMRect[]; lr: DOMRect; gl: number } {
    const lr = list.getBoundingClientRect();
    const gl = this.rowGapLeft(list);
    // 줄마다 왼쪽 끝이 1px 씩 다를 수 있어, 왼쪽 늘림은 줄마다 정한다 (보이는 줄만. 새로 그려지는 줄은 감시가 다시 부른다)
    let wide: DOMRect | null = null;
    const rows: HTMLElement[] = [];
    const rects: DOMRect[] = [];
    // 읽기(자리)를 먼저 모두 하고 쓰기(--lg-row-ext-l)는 그다음에: 번갈아 하면 줄마다 스타일을 다시 계산한다
    for (const r of list.querySelectorAll<HTMLElement>(".tree-item-self")) {
      const rc = r.getBoundingClientRect();
      if (!rc.width) continue;
      rows.push(r);
      rects.push(rc);
      if (!wide || rc.width > wide.width) wide = rc;
    }
    rows.forEach((r, i) => {
      const l = `${Math.round((rects[i].left - lr.left - gl) * 10) / 10}px`;
      if (r.style.getPropertyValue("--lg-row-ext-l") !== l) r.style.setProperty("--lg-row-ext-l", l);
    });
    const out = { rows, rects, lr, gl };
    if (!wide) return out;
    // 모바일은 스크롤바가 자리를 차지하지 않아 목록 안쪽 끝이 패널 끝이다. 왼쪽처럼 알약 간격만큼 띄운다 (사용자 요청, 태블릿)
    const right = Math.max(0, lr.left + list.clientLeft + list.clientWidth - wide.right - (Platform.isMobile ? gl : 0));
    const rr = `${Math.round(right * 10) / 10}px`;
    if (list.style.getPropertyValue("--lg-row-ext-r") !== rr) list.style.setProperty("--lg-row-ext-r", rr);
    return out;
  },

  // 줄무늬·줄 하이라이트의 왼쪽 끝: 목록 왼쪽 끝에서 알약 간격(--lg-gap) (사용자 요청)
  rowGapLeft(this: GlassShelfPlugin, list: HTMLElement) {
    return parseFloat(getComputedStyle(list).getPropertyValue("--lg-gap")) || 10;
  },

  // 폴더를 열고 닫으면 Obsidian 애니메이션(약 0.2초) 동안 줄이 움직이므로, 그동안 매 프레임 막대를 줄 위치에 다시 맞춘다
  followStripes(this: GlassShelfPlugin, list: HTMLElement) {
    // 줄무늬를 그리지 않으면(모바일·설정에서 끔) 따라갈 막대가 없다. 매 프레임 줄마다 위치를 재던 것을 건너뛴다
    // (휴대폰에서 서랍을 열 때마다 목록이 다시 그려져 0.2초 동안 돌았다, 프로파일로 확인). 줄 하이라이트 폭은 폴더 색 갱신이 한 번 맞춘다
    if (!this.settings.fileStripes || Platform.isMobile) return;
    const win = list.ownerDocument.defaultView || window;
    list.lgStripeUntil = win.performance.now() + STRIPE_FOLLOW_MS;
    if (list.lgStripeLoop) return;
    const step = () => {
      if (!list.isConnected) return (list.lgStripeLoop = 0);
      this.applyStripes(list);
      if (win.performance.now() < list.lgStripeUntil) list.lgStripeLoop = win.requestAnimationFrame(step);
      else list.lgStripeLoop = 0;
    };
    list.lgStripeLoop = win.requestAnimationFrame(step);
  },

  // 파일 탐색기 줄 높이를 다시 재게 한다: 탐색기는 보이는 줄만 그리고 나머지는 처음 잰 줄 높이로 자리를 잡는데,
  // 줄 간격을 바꿔도 예전 높이를 그대로 써서 스크롤할 때 화면과 스크롤바가 한쪽으로 튀었다 (사용자 지적, 앱을 다시 켜면 괜찮았다).
  // 탐색기가 폭이 바뀔 때 스스로 부르는 다시 재기(invalidateAll)를 부른다. 새 간격이 그려진 뒤에 한다
  remeasureExplorers(this: GlassShelfPlugin) {
    window.requestAnimationFrame(() => {
      this.app.workspace.getLeavesOfType("file-explorer").forEach((leaf) => {
        const scroll = leaf.view && leaf.view.tree && leaf.view.tree.infinityScroll;
        if (scroll && typeof scroll.invalidateAll === "function") scroll.invalidateAll();
      });
    });
  },
};