import type { View } from "obsidian";

// 웹 뷰어(코어 플러그인) 보기인지
export const isWebView = (v: View | null | undefined): v is View => !!v && typeof v.getViewType === "function" && v.getViewType() === "webviewer";
// 경로 알약 안 입력칸에서 눌러도 위로 올려 보내는 키: 주소 제안 목록(Obsidian 키 범위)이 받아야 한다
export const WEB_KEYS_PASS = new Set(["Enter", "Escape", "ArrowUp", "ArrowDown", "Tab"]);
// 주소 카드 폭 (편집창 탭 기본 폭 대비)
export const WEB_CARD_K = 2;

// 웹 뷰어 페이지 안에서 도는 스크립트 (webInject). 위 여백(__LG_INSET__)을 html 에 넣고, 화면 위쪽에 붙는 고정·스티키 요소를
// 그만큼 내린다. 같은 페이지에 다시 넣으면 여백만 새로 맞춘다. 페이지 배경색은 WEB_COLOR_SCRIPT 로 따로 읽는다
export const WEB_PAGE_SCRIPT = `(() => {
  const prevX = window.__lgInset;
  window.__lgInset = __LG_INSET__;
  // 고정 요소가 새 자리로 움직이는 시간(ms). 탭 줄을 접고 펼 때 띠와 같이 움직이게 한다. 이번에 맞출 때만 쓴다
  window.__lgAnim = __LG_ANIM__;
  // 플러그인이 보낸 시각. 페이지에 닿기까지 걸린 시간만큼 움직임을 앞당겨 띠와 맞춘다: 그만큼 막대가 띠보다 늦게 출발했다 (사용자 지적)
  window.__lgLate = Math.max(0, Date.now() - __LG_SENT__);
  // 다시 넣을 때(탭 줄 축소로 띠 높이가 바뀜) 위 여백이 바뀐 만큼 스크롤을 옮겨, 읽던 내용이 제자리에 있게 한다
  if (window.__lgGS) { window.__lgGS(); window.__lgAnim = 0; if (prevX != null && scrollY > 0) scrollBy(0, window.__lgInset - prevX); return; }
  const root = document.documentElement;
  // 화면 위쪽에 붙는 고정·스티키 요소를 여백만큼 내린다. 고정 요소는 탭 줄 아래 FIX_BAND(px)까지 찾는다: 맨 위 띠만 보면
  // 유튜브처럼 상단 바 밑에 붙는 고정 요소(왼쪽 메뉴·칩 줄)가 제자리에 남아 내려온 상단 바와 겹쳤다 (사용자 지적).
  // 페이지 스크립트가 직접 자리를 정하는 요소(인라인 top, 툴팁·팝업)는 건드리지 않는다. 스티키는 화면 맨 위에 붙은 것만
  const FIX_BAND = 300;
  // 요소 e 의 top 을 v 로 옮긴다. 띠와 같이 움직일 때(__lgAnim)는 잠깐 top 전환을 건다(원래 인라인 전환은 끝나면 되돌린다).
  // 페이지 틀(lgPage)은 스크롤 보정과 함께 바로 옮긴다: 천천히 옮기면 보정으로 한 번, 틀이 움직여 또 한 번 내용이 덜컹거렸다 (유튜브).
  // 처음 옮길 때(fresh)도 사이트가 top 에 걸어 둔 전환을 잠깐 꺼 바로 옮긴다: 새 페이지마다 막대가 맨 위에서 미끄러져 내려왔다 (obsidian.md)
  const put = (e, v, fresh) => {
    const ms = window.__lgAnim || 0;
    const page = e.dataset.lgPage !== undefined;
    if (ms && !page) {
      if (e.dataset.lgTr === undefined) {
        e.dataset.lgTr = e.style.getPropertyValue("transition");
        e.style.setProperty("transition", "top " + ms + "ms cubic-bezier(0.2, 0.8, 0.2, 1) -" + (window.__lgLate || 0) + "ms", "important");
        setTimeout(() => {
          if (e.dataset.lgTr === undefined) return;
          if (e.dataset.lgTr) e.style.setProperty("transition", e.dataset.lgTr); else e.style.removeProperty("transition");
          delete e.dataset.lgTr;
        }, ms + 50);
      }
      e.style.setProperty("top", v, "important");
    } else if (fresh || page) {
      const tr = e.style.getPropertyValue("transition");
      const pr = e.style.getPropertyPriority("transition");
      e.style.setProperty("transition", "none", "important");
      e.style.setProperty("top", v, "important");
      void e.offsetTop;
      if (tr) e.style.setProperty("transition", tr, pr); else e.style.removeProperty("transition");
    } else e.style.setProperty("top", v, "important");
  };
  const pageCB = () => getComputedStyle(document.body).position === "static" && getComputedStyle(root).position === "static";
  // quick: 이미 옮긴 요소만 맞춘다 (문서가 바뀐 그 자리에서 부른다)
  const fixTop = (reset, quick) => {
    const X = window.__lgInset || 0;
    if (reset) {
      document.querySelectorAll("[data-lg-top]").forEach((e) => { e.style.removeProperty("top"); delete e.dataset.lgTop; delete e.dataset.lgPage; });
      return;
    }
    if (!X) return;
    const seen = new Set();
    // 이미 옮긴 요소는 지금 자리와 상관없이 새 여백으로 옮긴다. 찍어 찾기만 하면 여백이 커질 때(탭 줄을 펼 때) 낮은 상단 바가
    // 찍는 자리 위에 있어 걸리지 않았다 (유튜브, 사용자 지적)
    for (const e of document.querySelectorAll("[data-lg-top]")) {
      seen.add(e);
      // 스크롤에 따라 고정과 일반 배치를 오가는 요소(유튜브 분류 칩 줄)는 고정일 때만 내린다. 일반 배치로 돌아왔을 때 top 이 남아 있으면
      // 이미 내려간 페이지 틀 안에서 한 번 더 내려갔다 (사용자 지적)
      const pos = getComputedStyle(e).position;
      if (e.dataset.lgPage !== undefined ? pos !== "absolute" : pos !== "fixed" && pos !== "sticky") {
        if (e.style.getPropertyValue("top")) e.style.removeProperty("top");
        continue;
      }
      const v = (parseFloat(e.dataset.lgTop) + X) + "px";
      if (e.style.getPropertyValue("top") === v && e.style.getPropertyPriority("top") === "important") continue;
      put(e, v, false);
    }
    if (quick) return;
    const w = window.innerWidth;
    const ys = [1, Math.max(1, X - 1)];
    for (let y = X + 4; y < X + FIX_BAND && y < window.innerHeight; y += 24) ys.push(y);
    for (const fx of [0.02, 0.15, 0.3, 0.5, 0.7, 0.85, 0.98]) {
      for (const y of ys) {
        for (const el of document.elementsFromPoint(w * fx, y)) {
          for (let e = el; e && e !== root && e !== document.body; e = e.parentElement) {
            if (seen.has(e)) break;
            seen.add(e);
            const cs = getComputedStyle(e);
            const fixed = cs.position === "fixed";
            // 문서 기준 절대 위치 틀(body 바로 아래, 위치 잡힌 조상 없음)은 html 위 여백을 따르지 않아 내용이 탭 줄 뒤에 남았다
            // (유튜브 ytd-app, 사용자 지적). 고정 요소처럼 top 에 여백을 더한다
            const page = cs.position === "absolute" && e.parentElement === document.body && pageCB();
            if (!fixed && !page && cs.position !== "sticky") continue;
            let fresh = false;
            if (e.dataset.lgTop === undefined) {
              if (e.style.top) continue;
              if (!fixed && !page && y > X) continue;
              const t = parseFloat(cs.top);
              if (!isFinite(t)) continue;
              e.dataset.lgTop = String(t);
              if (page) e.dataset.lgPage = "";
              fresh = true;
            }
            const v = (parseFloat(e.dataset.lgTop) + X) + "px";
            // 같은 값이면 다시 쓰지 않는다 (쓰면 문서 변화 감시가 다시 불려 끝없이 돈다)
            if (e.style.getPropertyValue("top") !== v || e.style.getPropertyPriority("top") !== "important") {
              put(e, v, fresh);
            }
          }
        }
      }
    }
  };
  let raf = 0;
  let timer = 0;
  const tick = () => { raf = 0; fixTop(false); };
  const soon = () => { if (!raf) raf = requestAnimationFrame(tick); };
  const later = () => { clearTimeout(timer); timer = setTimeout(tick, 250); };
  addEventListener("scroll", soon, { passive: true, capture: true });
  addEventListener("resize", soon);
  // 페이지를 그리는 중(webEarly 로 일찍 넣었을 때)에는 다음 화면 전에 바로 맞춘다: 미루면 고정 막대가 맨 위에 그려졌다가 내려왔다
  // 이미 옮긴 요소는 문서가 바뀐 그 자리(다음 화면 전)에서 바로 맞춘다: 사이트가 고정을 풀거나 다시 걸면 한 화면 동안 엉뚱한 자리에 그려졌다 (유튜브 분류 칩 줄).
  // 고정을 바꾸는 속성은 사이트마다 달라(class, style 외 사용자 정의 속성) 모든 속성 변화를 본다
  new MutationObserver(() => { if (window.__lgInset) fixTop(false, true); if (document.readyState === "loading") soon(); else later(); }).observe(root, { childList: true, subtree: true, attributes: true });
  // 페이지 스크롤바가 탭 줄 뒤까지 올라가지 않게 위 끝을 여백만큼 내린다 (사용자 지적). 스크롤바 위치는 기본 스크롤바에선 못 바꿔,
  // 사이트가 따로 꾸미지 않았으면 얇은 반투명 스크롤바로 바꾼다(:where 라 사이트 꾸밈이 이긴다)
  const sheet = () => {
    let st = document.getElementById("lg-gs-style");
    if (!st) { st = document.createElement("style"); st.id = "lg-gs-style"; (document.head || root).appendChild(st); }
    const X = window.__lgInset || 0;
    st.textContent = X ? ":where(html)::-webkit-scrollbar{width:12px;height:12px;background:transparent}" +
      ":where(html)::-webkit-scrollbar-thumb{background-color:rgba(128,128,128,.45);border:3px solid transparent;background-clip:padding-box;border-radius:8px}" +
      ":where(html)::-webkit-scrollbar-thumb:hover{background-color:rgba(128,128,128,.7)}" +
      ":where(html)::-webkit-scrollbar-track,:where(html)::-webkit-scrollbar-corner{background:transparent}" +
      "html::-webkit-scrollbar-track{margin-top:" + X + "px !important}" : "";
  };
  window.__lgGS = (reset) => {
    const X = window.__lgInset || 0;
    if (X) {
      root.style.setProperty("padding-top", X + "px", "important");
      root.style.setProperty("scroll-padding-top", X + "px", "important");
    } else {
      root.style.removeProperty("padding-top");
      root.style.removeProperty("scroll-padding-top");
    }
    sheet();
    // 여백이 남아 있으면 처음 기억한 원래 top 에 새 여백만 더한다. 지우고 다시 읽으면 사이트가 top 에 전환을 걸어 둔 경우
    // 아직 내려가 있는 값을 원래 값으로 읽어, 탭 줄을 접고 펼 때마다 고정 막대가 점점 내려갔다 (사용자 지적)
    if (!X || reset) fixTop(true);
    if (!reset) tick();
  };
  window.__lgGS();
  window.__lgAnim = 0;
})();`;
// 웹 뷰어 페이지 안에서 마우스 옆 버튼(뒤로·앞으로)을 받는다 (webMouseWire, 사용자 요청). 웹 화면 안의 누름은 페이지(별도 프로세스)로
// 가 Obsidian 이 받지 못한다. 페이지는 요청(__lgNavReq)만 남기고, 플러그인이 주기적으로 읽어(webPollTick) Obsidian 의 뒤로·앞으로를 누른다.
// 페이지가 직접 history 를 옮기면 Obsidian 탭 기록에 남지 않아 탭 줄의 앞으로 버튼이 생기지 않았다 (사용자 지적). 같은 페이지에 다시 넣어도 한 번만 단다
export const WEB_MOUSE_SCRIPT = `(() => {
  if (window.__lgMouse) return;
  window.__lgMouse = true;
  addEventListener("mouseup", (e) => {
    if (e.button === 3) { e.preventDefault(); window.__lgNavReq = "back"; }
    else if (e.button === 4) { e.preventDefault(); window.__lgNavReq = "forward"; }
  }, true);
})();`;
// 웹 뷰어 페이지의 스크롤 위치 (webMiniTick). 페이지는 별도 프로세스라 스크롤 이벤트가 오지 않아 WEB_MINI_POLL_MS 마다 묻는다.
// 콘솔 메시지로 알리게 하지 않는다: 아무 사이트나 같은 글자를 찍어 플러그인을 움직일 수 있었다 (WEB_COLOR_SCRIPT 와 같은 이유)
export const WEB_SCROLL_SCRIPT = "(() => { const n = window.__lgNavReq || ''; window.__lgNavReq = ''; return [(document.scrollingElement || document.documentElement).scrollTop, n]; })()";
export const WEB_MINI_POLL_MS = 120;
// 웹 뷰어 페이지 배경색을 읽어 돌려주는 스크립트 (webReadTint). 예전엔 페이지 안 스크립트가 콘솔에 색을 찍고 플러그인이 콘솔을 엿들어,
// 아무 사이트(광고 틀 포함)나 같은 글자를 찍으면 탭 줄 색을 바꿀 수 있었고 페이지 콘솔도 지저분해졌다 (검토 지적). 이제 플러그인이 직접 묻는다.
// 페이지 전역 값에 기대지 않고 매번 새로 계산한다
export const WEB_COLOR_SCRIPT = `(() => {
  const root = document.documentElement;
  // 반투명 배경은 건너뛴다: 그 색을 쓰면 탭 줄 버튼·글자 색까지 반투명해져 맨 위로 올렸을 때 사라졌다 (사용자 지적)
  const alpha = (c) => {
    const m = /\\/\\s*([\\d.]+)(%?)\\s*\\)$/.exec(c) || /^rgba\\([^)]*,\\s*([\\d.]+)(%?)\\s*\\)$/.exec(c);
    return m ? parseFloat(m[1]) / (m[2] ? 100 : 1) : 1;
  };
  const clear = (bg) => !bg || bg === "transparent" || alpha(bg) < 0.95;
  // 페이지 배경색: html, 없으면 body 배경 (사용자 요청: 대표 색(theme-color)보다 자연스럽다).
  // 둘 다 투명이면 브라우저 기본 바탕(라이트 흰색, 다크 색 체계면 Chromium 기본 #121212)
  for (const el of [root, document.body]) {
    const bg = el && getComputedStyle(el).backgroundColor;
    if (!clear(bg)) return bg;
  }
  const dark = /dark/.test(getComputedStyle(root).colorScheme) && matchMedia("(prefers-color-scheme: dark)").matches;
  return dark ? "#121212" : "#ffffff";
})()`;
// 보이는 웹 페이지의 배경색을 다시 읽는 간격(ms): 사이트가 다크 모드 전환 등으로 배경을 바꿔도 따라간다
export const WEB_TINT_POLL_MS = 1000;
// 탭에 보일 도메인 (www. 는 뺀다)
// 주소가 없거나 웹 주소가 아니면(빈 탭의 about:blank 등) 도메인 대신 웹 뷰어 탭 이름을 보인다 (사용자 지적: 비거나 about:blank 가 보였다)
export const webHost = (view: View) => {
  const url = view && view.url;
  try {
    const u = new URL(url);
    if (/^https?:$/.test(u.protocol) && u.hostname) return u.hostname.replace(/^www\./, "");
  } catch {
    /* 주소가 아니다 */
  }
  return (view && typeof view.getDisplayText === "function" && view.getDisplayText()) || "";
};

// 다크 모드에서 웹 페이지 배경색에 섞는 검정 비율 (사용자 요청: 흰 페이지여도 탭 줄이 눈부시지 않게).
// 밝은 색에만 섞는다 (사용자 요청): OKLab 명도 WEB_DARK_DIM_FROM 부터 섞기 시작해 흰색(1)에서 WEB_DARK_DIM 까지 늘린다.
// 기준에서 한꺼번에 섞으면 기준 바로 위 색이 바로 아래 색보다 어두워져 순서가 뒤집힌다
export const WEB_DARK_DIM = 0.5;
export const WEB_DARK_DIM_FROM = 0.6;
