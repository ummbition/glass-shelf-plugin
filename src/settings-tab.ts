import type { App, ColorComponent, Setting, SettingDefinition, SettingDefinitionItem, TextComponent } from "obsidian";
import { PluginSettingTab, Platform, setIcon, setTooltip, getLanguage, MarkdownRenderer, Component } from "obsidian";
import type { GlassShelfPlugin } from "./host";
import type { Palette, Settings } from "./settings";
import { tr } from "./util";
import { FOLDER_PALETTE } from "./color";
import { ConfirmModal } from "./folder-modal";
import { DEFAULTS } from "./settings";

// Obsidian 은 다시 그릴 때 설정 줄 요소를 자리대로 다시 쓴다. 직접 그리는 줄은 그리기 전에 우리가 붙인 클래스와 요소를 걷어 낸다
// (안 걷으면 팔레트 줄을 하나 지운 뒤 아래 줄에 팔레트 줄 표시·손잡이가 남았다)
const OUR_CLS = ["lg-settings-sub", "lg-fc-row", "lg-fc-pal-row", "lg-fc-add-row", "lg-fc-dragging", "lg-pick-row", "lg-gdemo-row", "lg-mdemo-row"];
const fresh = (s: Setting): Setting => {
  s.settingEl.removeClass(...OUR_CLS);
  s.settingEl.querySelectorAll(".lg-fc-grip, .lg-fc-count, .lg-pick, .lg-gdemo, .lg-mdemo").forEach((el) => el.remove());
  return s;
};

// 그림으로 고르는 설정 줄의 미리 보기 그림 (사용자 요청: iPadOS Safari 설정의 "개별 탭 막대 / 압축 탭 막대"처럼).
// 창 테두리 안 맨 위에 탭 줄을 단순한 알약으로 그린다. 색은 currentColor(고른 것은 강조색, 아닌 것은 회색, CSS)
const SVG_NS = "http://www.w3.org/2000/svg";
const svgEl = (parent: Element, tag: string, attrs: Record<string, string | number>) => {
  const el = parent.ownerDocument.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  parent.appendChild(el);
  return el;
};
const pill = (g: Element, x: number, y: number, w: number, h: number, op: number) => svgEl(g, "rect", { x, y, width: w, height: h, rx: h / 2, fill: "currentColor", "fill-opacity": op });
// 경로 표시: 첫 줄 = 왼쪽 버튼 · 가운데 경로 알약 · 오른쪽 버튼, 둘째 줄 = 좌우 끝까지 탭 트랙(선택 탭 + 탭 사이 세로줄).
// 한 줄: 왼쪽 버튼 · 가운데 탭 트랙 · 오른쪽 버튼. 탭 줄이 낮아진 만큼 본문(글자 줄)이 위에서 시작한다 (사용자 요청: 두 그림이 너무 같았다)
const drawTabBar = (svg: Element, twoRows: boolean) => {
  svgEl(svg, "rect", { x: 1.5, y: 1.5, width: 109, height: 77, rx: 10, fill: "currentColor", "fill-opacity": 0.06, stroke: "currentColor", "stroke-width": 3 });
  const sep = (x: number, y: number, h: number) => svgEl(svg, "rect", { x, y, width: 1.4, height: h, rx: 0.7, fill: "currentColor", "fill-opacity": 0.5 });
  let body: number;
  if (twoRows) {
    pill(svg, 9, 8, 9, 9, 0.45);
    pill(svg, 22, 8, 18, 9, 0.45);
    pill(svg, 44, 8, 38, 9, 0.3);
    pill(svg, 86, 8, 17, 9, 0.45);
    pill(svg, 9, 21, 94, 9, 0.3);
    svgEl(svg, "rect", { x: 10.5, y: 22.5, width: 30, height: 6, rx: 3, fill: "#fff" });
    sep(71.5, 23, 5);
    body = 38;
  } else {
    pill(svg, 9, 8, 9, 9, 0.45);
    pill(svg, 22, 8, 64, 9, 0.3);
    svgEl(svg, "rect", { x: 23.5, y: 9.5, width: 22, height: 6, rx: 3, fill: "#fff" });
    sep(55.5, 10, 5);
    sep(70.5, 10, 5);
    pill(svg, 90, 8, 13, 9, 0.45);
    body = 26;
  }
  for (const [k, w] of [[0, 70], [1, 82], [2, 58], [3, 76]] as [number, number][]) {
    const y = body + k * 9;
    if (y < 70) pill(svg, 14, y, w, 3, 0.18);
  }
};

// 사이드바 탭 전환 효과 그림 (사용자 요청: 경로 표시처럼 그림으로 고르기). 창 왼쪽에 사이드바, 그 위에 패널 탭 줄(점 없이 트랙만, 사용자 요청).
// 렌즈: 탭 줄보다 큰 흰 유리 알약이 탭 사이를 미끄러져 오가며 가는 동안 가로로 늘어난다. 심플: 칠해진 선택 알약이 탭 사이를 건너뛴다.
// 목록: 탭이 한 줄에 하나씩, 칠해진 선택 줄이 줄 사이를 건너뛴다. move 가 거짓이면 멈춘 그림
const animate = (el: Element, attr: string, values: string, keyTimes: string, mode: "spline" | "discrete") => {
  const a = svgEl(el, "animate", { attributeName: attr, values, keyTimes, dur: "3.2s", repeatCount: "indefinite", calcMode: mode });
  if (mode === "spline") a.setAttribute("keySplines", keyTimes.split(";").slice(1).map(() => "0.45 0 0.35 1").join(";"));
};
const drawTabAnim = (svg: Element, kind: string, move: boolean) => {
  svgEl(svg, "rect", { x: 1.5, y: 1.5, width: 109, height: 77, rx: 10, fill: "currentColor", "fill-opacity": 0.06, stroke: "currentColor", "stroke-width": 3 });
  svgEl(svg, "rect", { x: 3, y: 3, width: 52, height: 74, fill: "currentColor", "fill-opacity": 0.07 });
  svgEl(svg, "rect", { x: 55, y: 3, width: 1.4, height: 74, fill: "currentColor", "fill-opacity": 0.25 });
  for (const [k, w] of [[0, 30], [1, 24], [2, 34], [3, 20]] as [number, number][]) pill(svg, 62, 12 + k * 9, w, 3, 0.18);
  if (kind === "list") {
    // 버튼 줄 없이 목록만 (사용자 요청)
    const hl = pill(svg, 7, 9, 44, 9, 0.35);
    if (move) animate(hl, "y", "9;31;9", "0;0.5;1", "discrete");
    for (const y of [9, 20, 31]) pill(svg, 12, y + 3, 26, 3, 0.55);
    return;
  }
  pill(svg, 7, 9, 44, 10, 0.25);
  if (kind === "lens") {
    const lens = svgEl(svg, "rect", { x: 33, y: 6.5, width: 20, height: 15, rx: 7.5, fill: "#fff", stroke: "currentColor", "stroke-width": 1.4 });
    if (move) {
      // 오른쪽 탭 → 왼쪽 탭 → 오른쪽 탭. 가는 동안 폭이 늘었다가 도착하면 돌아온다
      const kt = "0;0.2;0.35;0.5;0.7;0.85;1";
      animate(lens, "x", "33;33;16;5;5;16;33", kt, "spline");
      animate(lens, "width", "20;20;26;20;20;26;20", kt, "spline");
    }
  } else {
    const sel = pill(svg, 35, 10.5, 15, 7, 1);
    if (move) animate(sel, "x", "35;8;35", "0;0.5;1", "discrete");
  }
};

// 설정 값 키. iosColors 는 toggleColor("green"/"accent")를 켜고 끄기로 보여 주는 가상 키
type Key = keyof Settings | "iosColors";

// 설정 탭. Obsidian 1.13 의 선언형 설정(getSettingDefinitions)이라 설정 검색에 잡힌다.
// 값 읽기·쓰기는 getControlValue·setControlValue 가 맡고, 목록이 바뀌면(폴더 색 등) update() 로 다시 만든다
export class GlassShelfSettingTab extends PluginSettingTab {
  declare plugin: GlassShelfPlugin;
  // 드롭다운 설정마다 이 기기에서 보여 주는 선택지
  private options = new Map<string, Record<string, string>>();
  // 유리 미리 보기 문서를 그릴 때 쓰는 수명(설정 화면을 닫거나 다시 그리면 정리한다)
  private demoComp: Component | null = null;
  private demoEl: HTMLElement | null = null;
  // 컴팩트 모드 미리 보기 되풀이를 멈춘다 (설정 화면을 닫거나 다시 그릴 때)
  private motionStop: (() => void) | null = null;

  constructor(app: App, plugin: GlassShelfPlugin) {
    super(app, plugin);
    this.plugin = plugin;
    // 플러그인 CSS(styles.css)의 설정 화면 꾸밈 기준
    this.containerEl.addClass("lg-settings");
  }

  getControlValue(key: string): unknown {
    if (key === "iosColors") return this.plugin.settings.toggleColor !== "accent";
    // 좌우 패널 투명이 켜져 있으면 렌즈는 심플로 보인다: 그림 고르기에서도 심플을 고른 것으로 보여 준다
    if (key === "tabAnim" && this.plugin.settings.tabAnim === "lens" && this.plugin.settings.sideAcrylic && Platform.isWin && !Platform.isMobile) return "none";
    // 이 기기에 없는 선택지(다른 기기에서 고른 값이 동기화됨)는 기본값으로 보여 준다. 동작도 기본값으로 한다 (사용자 요청)
    const v = super.getControlValue(key);
    const opts = this.options.get(key);
    if (opts && typeof v === "string" && !(v in opts)) return (DEFAULTS as unknown as Record<string, unknown>)[key];
    return v;
  }

  async setControlValue(key: string, value: unknown): Promise<void> {
    const pl = this.plugin;
    const s = pl.settings as unknown as Record<string, unknown>;
    if (key === "iosColors") s.toggleColor = value ? "green" : "accent";
    else s[key] = value;
    if (key === "miniBar" && !value) document.querySelectorAll<HTMLElement>(".workspace-tabs.lg-mini").forEach((el) => pl.setMini(el, false));
    if (key === "webTint") pl.webReset(value === true);
    await pl.saveSettings();
    if (key === "showPath") pl.reloadWebViews();
    if (key === "glassLevel") this.syncDemoDoc();
    if (key === "navCompact") pl.remeasureExplorers();
    if (key === "fileStripes") pl.requestFolderColors(true);
    if (key === "sideAcrylic" && value === true) pl.noticeSimpleTabs();
    // 고른 값에 따라 하위 항목이 생기거나 사라진다
    if (key === "tint" || key === "taskColor" || key === "folderColor" || key === "tabAnim" || key === "sideAcrylic") this.update();
  }

  // 그림으로 고르는 설정 줄: 선택지마다 미리 보기 그림 + 이름 + 동그라미(고르면 강조색 체크). 줄 이름·설명은 위에 그대로 두고
  // 그림 묶음은 줄 아래에 폭 전체로 놓는다 (CSS: .lg-pick-row). 누르면 값을 바꾸고 표시만 바꾼다
  pickRow(s: Setting, key: Key, opts: { value: unknown; label: string; draw: (svg: Element) => void }[]) {
    s.setClass("lg-pick-row");
    const box = s.settingEl.createDiv({ cls: "lg-pick" });
    const cur = this.getControlValue(key);
    const items = opts.map((o) => {
      const it = box.createDiv({ cls: "lg-pick-item", attr: { role: "radio", tabindex: "0", "aria-label": o.label } });
      const svg = it.ownerDocument.createElementNS<"svg">(SVG_NS, "svg");
      svg.setAttribute("viewBox", "0 0 112 80");
      svg.setAttribute("class", "lg-pick-pic");
      it.appendChild(svg);
      o.draw(svg);
      // 그린 뒤 넣은 움직임(SVG animate)은 브라우저가 시간을 한 번 다시 맞춰 줘야 돌기 시작한다 (측정: 그대로 두면 제자리)
      if (svg.querySelector("animate")) svg.ownerDocument.defaultView?.requestAnimationFrame(() => svg.setCurrentTime(0));
      it.createDiv({ cls: "lg-pick-label", text: o.label });
      const dot = it.createDiv({ cls: "lg-pick-dot" });
      setIcon(dot, "check");
      return it;
    });
    const mark = (v: unknown) => items.forEach((it, i) => {
      it.toggleClass("is-picked", opts[i].value === v);
      it.setAttribute("aria-checked", String(opts[i].value === v));
    });
    mark(cur);
    items.forEach((it, i) => {
      const pick = () => {
        mark(opts[i].value);
        void this.setControlValue(key, opts[i].value);
      };
      it.addEventListener("click", pick);
      it.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          pick();
        }
      });
    });
  }

  // 유리 투명도 미리 보기 (사용자 요청: 임시 문서 위에 알약을 띄워 슬라이더를 움직이며 체험). 줄 위쪽에 폭 전체로 둔다.
  // 위에는 실제 편집창 위쪽과 같은 알약(뒤로·앞으로 .lg-tab-nav, 경로 .lg-path-pill, 읽기 모드 .lg-tab-mode)이 같은 클래스로 떠 있어
  // 테마가 그 알약에 거는 유리·테두리·하이라이트·링 그림자·굴절을 그대로 받는다. 그 밑으로 실제 마크다운으로 그린 문서(콜아웃 포함)가 스크롤된다.
  // 알약이 폭 전체에 걸리고, 처음엔 첫 콜아웃이 알약 밑에 오도록 조금 내려 둔다 (사용자 요청: 왼쪽 정렬 글자만으로는 비칠 것이 적다)
  glassDemo(s: Setting) {
    s.setClass("lg-gdemo-row");
    const demo = createDiv({ cls: "lg-gdemo" });
    s.settingEl.prepend(demo);
    this.demoEl = demo;
    // 설정 창이 따로 뜬 창이면 그 창 문서에는 플러그인이 유리 값(--lg-fade·흐림)과 필터(밝기 곡선)를 넣지 않았다:
    // 미리 보기 알약이 슬라이더를 따라가게 그 문서에도 넣는다 (사용자 지적: 6~10 흐림이 안 먹었다)
    window.requestAnimationFrame(() => this.syncDemoDoc());
    const doc = demo.createDiv({ cls: "lg-gdemo-doc" });
    const body = doc.createDiv({ cls: "markdown-rendered lg-gdemo-md" });
    const md = tr(["# 갈비찜", "4인분 · 약 2시간 30분. 명절에도, 주말 저녁에도 좋은 ==달큰한 간장 양념== 갈비찜.", "", "> [!info] 한눈에 보기", "> 핏물 빼기 → 데치기 → 재우기 → 찌기 → 졸이기. 이 순서만 기억하면 됩니다.", "", "## 갈비 고르기", "- 뼈에 붙은 살이 두툼하고 지방이 고르게 박힌 것을 고릅니다.", "- 찜용은 한 대를 5~6cm 길이로 잘라 달라고 하면 편합니다.", "- 냉동 갈비는 하루 전 냉장실로 옮겨 천천히 녹입니다.", "", "## 재료", "- [x] 소갈비 1.5kg", "- [x] 무 1/3개, 당근 1개", "- [ ] 표고버섯 4개", "- [ ] 밤 8알, 대추 6알", "- [ ] 대파 1대, 은행 10알", "- [ ] 통후추 약간, 월계수 잎 2장", "", "## 양념", "| 재료 | 분량 |", "| --- | --- |", "| 간장 | 8큰술 |", "| 설탕 | 3큰술 |", "| 간 배 | 1/2개 |", "| 간 양파 | 1/2개 |", "| 다진 마늘 | 2큰술 |", "| 다진 생강 | 1작은술 |", "| 맛술 | 3큰술 |", "| 물엿 · 참기름 | 2큰술 · 1큰술 |", "| 후추 | 약간 |", "", "> [!note] 미리 할 일", "> 갈비는 찬물에 2시간 담가 핏물을 뺍니다. 물은 두세 번 갈아 주세요.", "> 기름 덩어리와 뼛가루는 칼끝으로 정리해 두면 국물이 맑아집니다.", "", "## 손질", "1. 무와 당근은 큼직하게 썰고 모서리를 둥글게 깎습니다.", "2. 표고는 기둥을 떼고 칼집을 넣습니다.", "3. 밤은 껍질을 벗기고, 대추는 씨를 뺍니다.", "4. 대파는 5cm 길이로 썹니다.", "", "## 만들기", "1. 끓는 물에 통후추, 월계수 잎과 함께 갈비를 5분 데칩니다.", "2. 건져서 찬물에 하나씩 헹궈 불순물을 씻어냅니다.", "3. 물엿과 참기름을 뺀 양념을 모두 섞습니다.", "4. 갈비에 양념의 절반을 버무려 30분 재웁니다.", "5. 냄비에 갈비, 남은 양념, 물 3컵을 넣고 센 불로 끓입니다.", "6. 끓어오르면 중약불로 줄이고 뚜껑을 덮어 **40분** 익힙니다.", "7. 무, 당근, 표고를 넣고 20분 더 익힙니다.", "8. 밤, 대추, 은행, 물엿을 넣고 뚜껑을 열어 10분 졸입니다.", "9. 대파를 넣고 한소끔 끓인 뒤 참기름을 두릅니다.", "", "> [!tip] 팁", "> 국물을 하룻밤 식히면 위에 기름이 굳습니다. 걷어 내고 데우면 훨씬 깔끔합니다.", "", "## 불 조절", "| 단계 | 불 | 시간 |", "| --- | --- | --- |", "| 처음 끓이기 | 센 불 | 10분 |", "| 고기 익히기 | 중약불 | 40분 |", "| 채소 넣기 | 중약불 | 20분 |", "| 졸이기 | 중불 | 10분 |", "", "> [!warning] 주의", "> 물엿을 처음부터 넣으면 바닥이 타기 쉽습니다. 마지막에 넣으세요.", "> 졸일 때는 바닥을 자주 긁어 주세요.", "", "## 곁들이기", "- [ ] 흰쌀밥", "- [ ] 배추김치, 동치미", "- [ ] 시금치나물", "- [ ] 맑은 무국"].join("\n"), ["# Galbi-jjim (Braised Short Ribs)", "Serves 4 · about 2½ hours. A dish for holidays or a weekend dinner, in a ==sweet soy glaze==.", "", "> [!info] At a glance", "> Soak → blanch → marinate → braise → reduce. Remember this order and you are set.", "", "## Choosing the ribs", "- Pick ribs with thick meat on the bone and evenly marbled fat.", "- Ask the butcher to cut them into 5–6 cm pieces for braising.", "- Move frozen ribs to the fridge a day ahead and thaw them slowly.", "", "## Ingredients", "- [x] 1.5 kg beef short ribs", "- [x] 1/3 Korean radish, 1 carrot", "- [ ] 4 shiitake mushrooms", "- [ ] 8 chestnuts, 6 jujubes", "- [ ] 1 green onion, 10 ginkgo nuts", "- [ ] A few peppercorns, 2 bay leaves", "", "## Sauce", "| Ingredient | Amount |", "| --- | --- |", "| Soy sauce | 8 tbsp |", "| Sugar | 3 tbsp |", "| Grated pear | 1/2 |", "| Grated onion | 1/2 |", "| Minced garlic | 2 tbsp |", "| Minced ginger | 1 tsp |", "| Cooking wine | 3 tbsp |", "| Rice syrup · sesame oil | 2 tbsp · 1 tbsp |", "| Black pepper | A pinch |", "", "> [!note] Before you start", "> Soak the ribs in cold water for 2 hours to draw out the blood. Change the water two or three times.", "> Trim off lumps of fat and bone dust with the tip of a knife for a clearer broth.", "", "## Prep", "1. Cut the radish and carrot into large chunks and round off the edges.", "2. Remove the shiitake stems and score the caps.", "3. Peel the chestnuts and pit the jujubes.", "4. Cut the green onion into 5 cm lengths.", "", "## Steps", "1. Blanch the ribs for 5 minutes in boiling water with the peppercorns and bay leaves.", "2. Drain and rinse each piece in cold water to wash off impurities.", "3. Mix all the sauce ingredients except the rice syrup and sesame oil.", "4. Toss the ribs with half the sauce and marinate for 30 minutes.", "5. Put the ribs, the rest of the sauce and 3 cups of water in a pot and bring to a boil over high heat.", "6. Once it boils, lower to medium-low, cover and cook for **40 minutes**.", "7. Add the radish, carrot and shiitake and cook 20 minutes more.", "8. Add the chestnuts, jujubes, ginkgo nuts and rice syrup, uncover and reduce for 10 minutes.", "9. Add the green onion, bring to a boil once more, then drizzle with sesame oil.", "", "> [!tip] Tip", "> Cool the broth overnight and the fat sets on top. Skim it off before reheating for a much cleaner taste.", "", "## Heat guide", "| Stage | Heat | Time |", "| --- | --- | --- |", "| First boil | High | 10 min |", "| Cook the meat | Medium-low | 40 min |", "| Add vegetables | Medium-low | 20 min |", "| Reduce | Medium | 10 min |", "", "> [!warning] Warning", "> Rice syrup added at the start can scorch the bottom of the pot. Add it at the end.", "> Scrape the bottom often while reducing.", "", "## To serve with", "- [ ] Steamed white rice", "- [ ] Napa cabbage kimchi, dongchimi", "- [ ] Seasoned spinach", "- [ ] Clear radish soup"].join("\n"));
    this.demoComp?.unload();
    this.demoComp = new Component();
    this.demoComp.load();
    void MarkdownRenderer.render(this.app, md, body, "", this.demoComp).then(() => {
      // 첫 콜아웃이 알약 바로 밑에 오게
      window.requestAnimationFrame(() => {
        const c = body.querySelector<HTMLElement>(".callout");
        if (c) doc.scrollTop = Math.max(0, c.offsetTop - 24);
      });
    });
    const bar = demo.createDiv({ cls: "lg-gdemo-bar" });
    const icon = (parent: HTMLElement, cls: string, name: string) => {
      const el = parent.createDiv({ cls: `clickable-icon ${cls}`.trim() });
      setIcon(el, name);
      return el;
    };
    const pills: HTMLElement[] = [];
    if (Platform.isPhone) {
      // 휴대폰: 검색창과 정렬 버튼 (사용자 요청)
      const search = bar.createDiv({ cls: "lg-path-pill lg-gdemo-search" });
      icon(search, "lg-path-menu", "search");
      search.createDiv({ cls: "lg-path-text", text: tr("검색", "Search") });
      pills.push(search, icon(bar, "lg-tab-mode", "arrow-up-narrow-wide"));
    } else {
      const nav = bar.createDiv({ cls: "lg-tab-nav" });
      icon(nav, "lg-tab-back", "arrow-left");
      nav.createSpan({ cls: "lg-nav-sep" });
      icon(nav, "lg-tab-forward", "arrow-right");
      const path = bar.createDiv({ cls: "lg-path-pill" });
      icon(path, "lg-path-menu", "menu");
      path.createDiv({ cls: "lg-path-text", text: tr("Glass Shelf / 유리 미리 보기", "Glass Shelf / Glass preview") });
      pills.push(nav, path, icon(bar, "lg-tab-mode", "book-open"));
    }
    // 굴절(설정에서 켜 둔 경우)도 실제 알약처럼
    const pl = this.plugin;
    if (pl.refractOn()) for (const el of pills) pl.refractor.attach(el, 26, false);
  }

  // 미리 보기가 있는 문서가 플러그인이 다루는 창이 아니면(따로 뜬 설정 창) 그 문서에도 body 상태를 넣는다
  private syncDemoDoc() {
    const doc = this.demoEl && this.demoEl.isConnected ? this.demoEl.ownerDocument : null;
    if (doc && !this.plugin.docs.has(doc)) this.plugin.applyBodyState(doc);
  }

  // 컴팩트 모드 미리 보기 (사용자 요청): 단독 버튼(···)이 눌리고, 메뉴가 열리고, 항목 위를 차례로 지나가고, 다시 눌려 닫히는 것을
  // 되풀이하는 그림. 실제 메뉴·이벤트를 쓰지 않고(실제 메뉴를 띄우니 사용자가 연 메뉴가 닫히는 등 방해가 됐다, 사용자 지적) 카드 안 요소에
  // 애니메이션만 건다. 모양은 실제 메뉴와 같은 변수(--lg-menu-radius·--lg-menu-pad·--lg-menu-item-h·--lg-menu-item-r)를 쓰므로 이 기기의
  // 설정(body.lg-rm)대로 둥근 메뉴 또는 네모난 메뉴가 보이고, 움직임도 그 설정을 따른다. 눌리지 않는다(styles.css pointer-events: none)
  private motionDemo(s: Setting): (on: boolean) => void {
    s.setClass("lg-mdemo-row");
    this.motionStop?.();
    const pl = this.plugin;
    const demo = createDiv({ cls: "lg-mdemo" });
    s.settingEl.prepend(demo);
    const stage = demo.createDiv({ cls: "lg-mdemo-stage" });
    const state = demo.createDiv({ cls: "lg-mdemo-state" });
    const say = (on: boolean) =>
      state.setText(on
        ? tr("이 기기에서는 컴팩트 모드가 켜져 있습니다: 버튼이 살짝 커지고, 메뉴는 작고 네모나게 바로 열립니다.", "Compact mode is on for this device: buttons grow slightly and menus open right away as smaller, squarer panels.")
        : tr("이 기기에서는 컴팩트 모드가 꺼져 있습니다: 버튼이 흰색으로 부풀고, 메뉴는 버튼에서 넓고 둥글게 펼쳐지며 호버가 미끄러져 따라갑니다.", "Compact mode is off for this device: buttons puff up in white, menus unfold wide and round from the button, and the hover slides along."));
    say(pl.reduceMotion());
    const btn = stage.createDiv({ cls: "clickable-icon lg-tab-mode lg-mdemo-btn" });
    setIcon(btn, "ellipsis");
    const menu = stage.createDiv({ cls: "lg-mdemo-menu" });
    const hl = menu.createDiv({ cls: "lg-mdemo-hl" });
    const items = ([[tr("새 노트", "New note"), "file-plus"], [tr("복사", "Copy"), "copy"], [tr("이름 바꾸기", "Rename"), "pencil"]] as [string, string][]).map(([t, ic]) => {
      const it = menu.createDiv({ cls: "lg-mdemo-item" });
      setIcon(it.createSpan({ cls: "lg-mdemo-icon" }), ic);
      it.createSpan({ text: t });
      return it;
    });
    const win = stage.ownerDocument.defaultView || window;
    let timer = 0;
    let alive = true;
    let visible = false;
    const sleep = (ms: number) => new Promise<void>((res) => (timer = win.setTimeout(res, ms)));
    const io = new win.IntersectionObserver((es) => (visible = es.some((x) => x.isIntersecting)));
    io.observe(stage);
    const stop = () => {
      if (!alive) return;
      alive = false;
      win.clearTimeout(timer);
      io.disconnect();
    };
    this.motionStop = stop;
    const EASE_SPRING = "cubic-bezier(0.3, 1.25, 0.5, 1)";
    const press = (rm: boolean) =>
      btn.animate(
        rm ? [{ scale: "1" }, { scale: "1.08", offset: 0.4 }, { scale: "1" }] : [{ scale: "1", filter: "brightness(1)" }, { scale: "1.28", filter: "brightness(1.12)", offset: 0.45 }, { scale: "1", filter: "brightness(1)" }],
        { duration: rm ? 260 : 500, easing: "ease-out" }
      );
    // 메뉴가 버튼 가운데에서 커지고 그리로 줄어든다(컴팩트 모드를 끈 기기). 기준점은 메뉴 왼쪽 위에서 버튼 가운데까지
    const origin = () => {
      const b = btn.getBoundingClientRect();
      const m = menu.getBoundingClientRect();
      return `${(b.left + b.width / 2 - m.left).toFixed(1)}px ${(b.top + b.height / 2 - m.top).toFixed(1)}px`;
    };
    const hover = (i: number, rm: boolean) => {
      items.forEach((it, k) => it.classList.toggle("is-hover", rm && k === i));
      if (rm) return;
      const it = items[i];
      const first = !hl.classList.contains("is-on");
      if (first) hl.classList.add("lg-no-tr");
      hl.style.transform = `translateY(${it.offsetTop - menu.clientTop - parseFloat(getComputedStyle(menu).paddingTop)}px)`;
      if (first) {
        void hl.offsetWidth;
        hl.classList.remove("lg-no-tr");
      }
      hl.classList.add("is-on");
    };
    const unhover = () => {
      items.forEach((it) => it.classList.remove("is-hover"));
      hl.classList.remove("is-on");
    };
    const loop = async () => {
      await sleep(500);
      while (alive && demo.isConnected) {
        if (!visible) {
          await sleep(500);
          continue;
        }
        const rm = pl.reduceMotion();
        demo.classList.toggle("lg-mdemo-rm", rm);
        // 위아래 하이라이트 선: 실제 메뉴처럼 모서리 곡선을 따라 그린다 (설정에 따라 곡률이 바뀌므로 매번)
        pl.menuHi(menu);
        press(rm);
        await sleep(rm ? 120 : 220);
        menu.style.transformOrigin = rm ? "0 0" : origin();
        menu.animate(
          rm ? [{ opacity: 0, scale: "0.96" }, { opacity: 1, scale: "1" }] : [{ opacity: 0, scale: "0.2" }, { opacity: 1, scale: "1.03", offset: 0.7 }, { opacity: 1, scale: "1" }],
          { duration: rm ? 120 : 380, easing: rm ? "ease-out" : EASE_SPRING, fill: "forwards" }
        );
        await sleep(rm ? 400 : 650);
        menu.classList.add("is-still");
        for (let i = 0; i < items.length && alive; i++) {
          hover(i, rm);
          await sleep(500);
        }
        unhover();
        await sleep(300);
        press(rm);
        await sleep(rm ? 80 : 160);
        menu.classList.remove("is-still");
        menu.animate(
          rm ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 1, scale: "1" }, { opacity: 0, scale: "0.2" }],
          { duration: rm ? 100 : 220, easing: "ease-in", fill: "forwards" }
        );
        await sleep(1700);
      }
      stop();
    };
    void loop();
    return say;
  }

  hide() {
    super.hide();
    this.demoComp?.unload();
    this.demoComp = null;
    this.motionStop?.();
    this.motionStop = null;
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    const st = this.plugin.settings;
    const toggle = (key: Key, name: string, desc: string, visible = true): SettingDefinition => ({ name, desc, visible, control: { type: "toggle", key } });
    const dropdown = (key: Key, name: string, desc: string | undefined, options: Record<string, string>, visible = true): SettingDefinition => {
      this.options.set(key, options);
      return { name, desc, visible, control: { type: "dropdown", key, options } };
    };
    // 위 설정을 켜거나 고르면 생기는 하위 항목: 왼쪽으로 들여 구별한다 (CSS: .lg-settings-sub)
    const sub = (name: string, desc: string | undefined, visible: () => boolean, fill: (s: Setting) => void): SettingDefinition => ({
      name,
      desc,
      visible,
      render: (s) => fill(fresh(s).setClass("lg-settings-sub")),
    });
    const color = (key: "tintColor" | "taskColorCustom" | "folderColorCustom") => (s: Setting): void => {
      s.addColorPicker((c) => c.setValue(st[key]).onChange((v) => void this.setControlValue(key, v)));
    };

    const defs: SettingDefinitionItem[] = [
      {
        type: "group",
        heading: tr("유리", "Glass"),
        items: [
          {
            name: tr("유리 투명도", "Glass opacity"),
            desc: tr("숫자가 클수록 유리가 덜 투명해집니다. 0은 맑은 유리이고, 1~5는 유리 뒤의 내용이 배경색 쪽으로 점점 옅어지며, 6~10은 그 위에서 유리 뒤를 점점 흐리게 만듭니다. 버튼, 편집창 위쪽 유리판, 메뉴에 적용됩니다. 팝업은 6~10단계의 흐림만 따라갑니다.", "Higher values make the glass less transparent. 0 is clear glass; 1–5 gradually fade what is behind the glass toward the background color; 6–10 also blur what is behind the glass more and more. Applies to buttons, the glass panel above the editor and menus. Popups follow only the blur of levels 6–10."),
            render: (s) => {
              this.glassDemo(fresh(s));
              s.addSlider((slider) => slider.setLimits(0, 10, 1).setValue(st.glassLevel).onChange((v) => void this.setControlValue("glassLevel", v))).addExtraButton((btn) =>
                btn
                  .setIcon("rotate-ccw")
                  .setTooltip(tr("기본값으로 되돌리기", "Restore default"))
                  .onClick(() => void this.setControlValue("glassLevel", DEFAULTS.glassLevel).then(() => this.update()))
              );
            },
          },
          dropdown("tint", tr("틴트", "Tint"), tr("유리에 옅은 색을 입힙니다. 버튼, 탭, 메뉴, 팝업에 함께 적용됩니다.", "Adds a light color to the glass. Applies to buttons, tabs, menus and popups."), {
            none: tr("없음 (투명)", "None (clear)"),
            accent: tr("강조색", "Accent color"),
            obsidian: tr("Obsidian 보라", "Obsidian purple"),
            custom: tr("색상 지정", "Custom color"),
          }),
          sub(tr("틴트 색", "Tint color"), undefined, () => st.tint === "custom", color("tintColor")),
          sub(tr("틴트 세기", "Tint strength"), tr("1은 아주 옅게, 10은 가장 진하게 입힙니다.", "1 is very light, 10 is the strongest."), () => st.tint !== "none", (s) => {
            s.addSlider((slider) => slider.setLimits(1, 10, 1).setValue(st.tintLevel).onChange((v) => void this.setControlValue("tintLevel", v)));
          }),
          sub(
            tr("흰색 글자", "White text"),
            tr("유리 위의 아이콘과 글자를 흰색으로 표시합니다. 진한 틴트와 잘 어울립니다. 다크 모드에서는 원래 흰색이라 차이가 없습니다.", "Shows icons and text on glass in white. Works well with strong tints. No difference in dark mode, where they are already white."),
            () => st.tint !== "none",
            (s) => {
              s.addToggle((t) => t.setValue(!!st.tintWhiteInk).onChange((v) => void this.setControlValue("tintWhiteInk", v)));
            }
          ),
          toggle("popupOpaque", tr("불투명한 팝업", "Opaque popups"), tr("대화상자, 명령 팔레트, 링크 미리보기, 알림, 툴팁 같은 팝업의 배경입니다. 끄면 메뉴처럼 뒤가 살짝 비치고, 켜면 불투명하게 채웁니다.", "Background of popups such as dialogs, the command palette, link previews, notices and tooltips. Off: slightly see-through like menus. On: filled opaque.")),
          toggle("sideAcrylic", tr("좌우 패널 투명", "See-through side panels"), tr("좌우 패널 뒤로 바탕화면과 다른 창이 흐리게 비칩니다. Windows 11 22H2 이상에서 동작하고, Windows 설정의 투명 효과가 켜져 있어야 합니다. 켜면 탭 전환 효과는 렌즈 대신 심플로 보입니다. (Windows)", "Your desktop and other windows show through the left and right panels, blurred. Works on Windows 11 22H2 or later with transparency effects turned on in Windows settings. When on, the tab switch effect is shown as Simple instead of Lens. (Windows)"), Platform.isWin && !Platform.isMobile),
          toggle("refraction", tr("굴절", "Refraction"), tr("유리 가장자리에서 뒤 배경이 렌즈처럼 휘어 보입니다. 화면이 느려지면 꺼 주세요. iOS와 iPadOS에서는 지원되지 않습니다.", "Bends the background at the glass edges like a lens. Turn off if the app feels slow. Not supported on iOS and iPadOS.")),
(() => {
            const opts = { off: tr("끔", "Off"), pc: tr("데스크톱만", "Desktop only"), pcTablet: tr("데스크톱·태블릿", "Desktop and tablet") };
            this.options.set("reduceMotion", opts);
            return {
              name: tr("컴팩트 모드", "Compact mode"),
              desc: tr("컴팩트 모드를 쓸 기기입니다. 켜면 메뉴가 작고 네모나게 누른 자리에서 바로 열리고, 단독 버튼은 살짝 커졌다 바로 작아지며 버튼 묶음은 커지지 않습니다. 버튼에 올리면 호버와 기호가 커서를 따라 조금만 움직입니다. 펼쳐지는 검색창은 펼쳐지는 움직임만 남습니다. 끄면 메뉴가 넓고 둥글게 버튼에서 펼쳐지고, 버튼이 흰색으로 크게 부풉니다. 휴대폰은 늘 끈 상태입니다.", "Devices that use compact mode. On: menus are smaller and squarer and open right where you click, single buttons grow slightly and shrink right away, and button groups do not grow. Hover highlights and icons follow the cursor only slightly. Expanding search fields keep only the expanding motion. Off: menus are wider and round and unfold from the button, and buttons puff up in white. Phones always use the off state."),
              visible: !Platform.isPhone,
              render: (s: Setting) => {
                const say = this.motionDemo(fresh(s));
                s.addDropdown((d) =>
                  d
                    .addOptions(opts)
                    .setValue(this.getControlValue("reduceMotion") as string)
                    .onChange((v) => void this.setControlValue("reduceMotion", v).then(() => say(this.plugin.reduceMotion())))
                );
              },
            };
          })(),
          toggle("compactWindowControls", tr("창 제어 버튼 축소", "Compact window controls"), tr("최소화, 최대화, 닫기 버튼을 평소에는 작은 점으로 줄여 두고, 마우스를 올리면 원래 크기로 보여 줍니다. 줄어든 만큼 탭 줄이 넓어집니다. (Windows, Linux)", "Shrinks the minimize, maximize and close buttons to small dots until you hover them. The tab bar gets the freed space. (Windows, Linux)"), !Platform.isMobile),
        ],
      },
      {
        type: "group",
        heading: tr("편집창", "Editor"),
        items: [
          {
            name: tr("경로 표시", "Show path"),
            desc: tr("경로 표시를 고르면 편집창 탭 줄 위쪽 가운데에 현재 문서의 경로를 표시하고, 탭은 그 아래 줄에 좌우 폭을 모두 써서 배치합니다. 폴더 이름을 누르면 파일 탐색기에서 해당 폴더를 보여 줍니다. (데스크톱, 태블릿)", "Show path: shows the current note's path at the top center of the editor tab bar and moves the tabs to a full-width row below. Click a folder name to reveal it in the file explorer. (Desktop, tablet)"),
            visible: !Platform.isPhone,
            render: (s) => this.pickRow(fresh(s), "showPath", [
              { value: true, label: tr("경로 표시", "Show path"), draw: (svg) => drawTabBar(svg, true) },
              { value: false, label: tr("한 줄", "One row"), draw: (svg) => drawTabBar(svg, false) },
            ]),
          },
          toggle("miniBar", tr("스크롤 시 탭 줄 축소", "Collapse tab bar on scroll"), tr("편집창을 아래로 스크롤하면 탭 줄을 접고 현재 문서 제목만 작게 표시합니다. 위로 스크롤하거나 제목을 누르면 다시 펼칩니다. (데스크톱, 태블릿)", "Scrolling down in the editor collapses the tab bar to a small title of the current note. Scroll up or click the title to expand it again. (Desktop, tablet)"), !Platform.isPhone),
          toggle("webTint", tr("몰입형 웹 보기", "Immersive web view"), tr("웹 뷰어에서 페이지가 탭 줄 뒤로 지나가게 하고, 탭 줄과 버튼을 페이지의 대표 색으로 칠합니다. (데스크톱, 태블릿)", "In the web viewer, lets the page scroll behind the tab bar and colors the tab bar and its buttons with the page's theme color. (Desktop, tablet)"), !Platform.isPhone),
          toggle("headingRule", tr("제목 아래 가로줄", "Line under headings"), tr("제목(H1~H6) 아래에 얇은 가로줄을 긋습니다. 라이트 모드에서는 검은색, 다크 모드에서는 흰색입니다.", "Draws a thin line under headings (H1–H6). Black in light mode, white in dark mode.")),
        ],
      },
      {
        type: "group",
        heading: tr("사이드바 탭", "Sidebar tabs"),
        items: [
          (() => {
            // 컴팩트 모드를 켠 기기에서도 설정 그림은 움직인다 (사용자 요청: 효과를 보고 고르는 그림이다)
            const move = true;
            const anims: { value: string; label: string; draw: (svg: Element) => void }[] = [
              // 좌우 패널 투명이 켜져 있으면 렌즈는 심플로 보이므로 고를 수 없게 뺀다 (사용자 요청)
              ...(st.sideAcrylic && Platform.isWin && !Platform.isMobile ? [] : [{ value: "lens", label: tr("렌즈", "Lens"), draw: (svg: Element) => drawTabAnim(svg, "lens", move) }]),
              { value: "none", label: tr("심플", "Simple"), draw: (svg) => drawTabAnim(svg, "none", move) },
              ...(Platform.isPhone ? [] : [{ value: "list", label: tr("목록", "List"), draw: (svg: Element) => drawTabAnim(svg, "list", move) }]),
            ];
            // 이 기기에 없는 선택지(다른 기기에서 고른 목록)는 기본값으로 보여 준다 (getControlValue)
            this.options.set("tabAnim", Object.fromEntries(anims.map((a) => [a.value, a.label])));
            return {
              name: tr("탭 전환 효과", "Tab switch effect"),
              desc: tr("렌즈: 선택 표시가 렌즈처럼 미끄러지며 옮겨 갑니다. 심플: 효과 없이 선택한 탭을 강조색으로 표시합니다. 목록: 탭을 버튼 줄 아래에 한 줄에 하나씩 늘어놓고, 선택한 탭을 강조색으로 표시합니다. 좌우 패널 투명이 켜져 있으면 렌즈 대신 심플로 보입니다. (목록은 데스크톱, 태블릿)", "Lens: the selection slides over like a lens. Simple: no effect; the selected tab is shown in the accent color. List: tabs are listed one per row below the button row, and the selected tab is shown in the accent color. With transparent side panels on, Simple is shown instead of Lens. (List: desktop, tablet)"),
              render: (s: Setting) => this.pickRow(fresh(s), "tabAnim", anims),
            };
          })(),
          // 목록을 고르면 바로 밑에 (하위 항목 표시 없이, 사용자 요청)
          {
            name: tr("목록을 쓸 패널", "Panels using the list"),
            desc: tr("목록 방식을 쓸 패널입니다. 나머지 패널은 렌즈 효과를 씁니다. (데스크톱, 태블릿)", "Panels that use the list. Other panels use the lens effect. (Desktop, tablet)"),
            visible: () => st.tabAnim === "list" && !Platform.isPhone,
            render: (s) => {
              fresh(s).addDropdown((d) =>
                d
                  .addOptions({ left: tr("왼쪽 패널만", "Left panel only"), right: tr("오른쪽 패널만", "Right panel only"), both: tr("양쪽 패널 다", "Both panels") })
                  .setValue(st.tabListSides || "both")
                  .onChange((v) => void this.setControlValue("tabListSides", v))
              );
            },
          },
        ],
      },
      {
        type: "group",
        // 탭 전환 효과와 나누기만 한다 (사용자 요청: 묶음 이름은 두지 않는다)
        items: [
          toggle("tabWide", tr("탭 줄 넓게", "Wide tab bar"), tr("사이드바 탭을 사이드바 좌우 끝까지 넓히고, 보기의 버튼들을 펼쳐서 보여 줍니다. 맨 위 탭 묶음은 버튼 줄 아래로 한 줄 내려 배치합니다. (데스크톱, 태블릿)", "Stretches the sidebar tabs across the full sidebar width and shows the view's buttons expanded. The top tab group moves one row down, below the button row. (Desktop, tablet)"), !Platform.isMobile),
          toggle("tabNames", tr("탭 이름 표시", "Show tab names"), tr("사이드바 탭 아이콘 옆에 이름을 표시합니다. 탭이 하나뿐인 묶음은 이 설정과 관계없이 이름을 표시합니다. (데스크톱, 태블릿)", "Shows names next to sidebar tab icons. Groups with a single tab always show the name. (Desktop, tablet)"), !Platform.isMobile),
        ],
      },
      {
        type: "group",
        heading: tr("토글과 체크박스", "Toggles and checkboxes"),
        items: [
          toggle("iosColors", tr("토글 초록·슬라이더 파랑", "Green toggles, blue sliders"), tr("켜면 토글은 초록색, 슬라이더는 파란색으로 표시합니다. 끄면 둘 다 강조색을 사용합니다.", "On: toggles are green and sliders are blue. Off: both use the accent color.")),
          dropdown("taskStyle", tr("할 일 체크박스 모양", "Task checkbox style"), tr("체크: 색이 채워진 원에 체크 표시가 나타납니다. 링: 테두리 원 안에 작은 원이 나타납니다.", "Check: a filled circle with a check mark. Ring: a small dot inside an outlined circle."), {
            check: tr("체크", "Check"),
            ring: tr("링", "Ring"),
          }),
          dropdown("taskColor", tr("할 일 체크박스 색", "Task checkbox color"), undefined, {
            yellow: tr("노랑", "Yellow"),
            accent: tr("강조색", "Accent color"),
            custom: tr("색상 지정", "Custom color"),
          }),
          sub(tr("체크박스 색 지정", "Checkbox color"), undefined, () => st.taskColor === "custom", color("taskColorCustom")),
        ],
      },
      {
        type: "group",
        heading: tr("파일 탐색기", "File explorer"),
        items: [
          toggle("navCompact", tr("줄 간격 좁게", "Compact rows"), tr("파일 목록 항목의 위아래 간격을 컴퓨터만큼 줄여 한 화면에 더 많이 보이게 합니다. (모바일)", "Reduces the vertical spacing of file list items to the desktop size so more fit on screen. (Mobile)"), Platform.isMobile),
          toggle("fileStripes", tr("줄무늬 배경", "Striped rows"), tr("파일 목록에 한 줄씩 번갈아 줄무늬를 깔아 항목을 구분하기 쉽게 합니다.", "Alternates row backgrounds in the file list so items are easier to tell apart."), !Platform.isMobile),
          toggle("fileGuides", tr("들여쓰기 세로줄", "Indentation guides"), tr("폴더 안 항목 왼쪽에 폴더 단계를 보여 주는 세로줄을 긋습니다.", "Draws vertical lines left of the items inside a folder to show the folder levels.")),
          dropdown("fileIcons", tr("파일 탐색기 스타일", "File explorer style"), tr("기본: 입체 폴더·문서 아이콘. 심플: Obsidian의 닫힌 폴더 아이콘을 폴더에만 붙이고 문서에는 붙이지 않으며, 목록을 조금 크게 표시합니다.", "Default: shaded folder and note icons. Simple: Obsidian's closed folder icon on folders only, no icon on notes, and a slightly larger list."), {
            none: tr("없음", "None"),
            finder: tr("기본", "Default"),
            line: tr("심플", "Simple"),
          }),
          dropdown("folderColor", tr("폴더 아이콘 색", "Folder icon color"), undefined, {
            blue: tr("기본 파랑", "Default blue"),
            accent: tr("강조색", "Accent color"),
            custom: tr("색상 지정", "Custom color"),
          }),
          sub(tr("폴더 아이콘 색 지정", "Custom folder icon color"), undefined, () => st.folderColor === "custom", color("folderColorCustom")),
        ],
      },
      {
        type: "group",
        heading: tr("폴더 색", "Folder color"),
        items: this.folderColorItems(),
      },
      {
        type: "group",
        // 제목 없이 이름별 색 바로 아래에 따로 묶는다 (사용자 요청: 묶음 이름은 두지 않고 나누기만)
        items: this.paletteItems(),
      },
    ];
    // 이 기기에서 늘 숨는 항목은 아예 뺀다: 묶음 첫 항목이 숨어 있으면 다음 항목 위에 구분선이 남았다 (사용자 지적)
    for (const d of defs) if ("items" in d && d.type === "group") d.items = d.items.filter((i: SettingDefinitionItem) => !("visible" in i) || i.visible !== false);
    return defs;
  }

  // 폴더 색 관리: 이름별로 지정된 색(바꾸기·지우기·더하기). 색 고르기 창의 팔레트는 따로 묶음(paletteItems, 사용자 요청).
  // 둘 다 data.json 에 둔다. 줄은 위아래를 줄여 표처럼 쓴다 (CSS: .lg-fc-row, 사용자 요청). 자기 묶음 안이라 하위 항목 들여쓰기는 하지 않는다
  folderColorItems(): SettingDefinition[] {
    const pl = this.plugin;
    const map = pl.shared.folderColorsByName || (pl.shared.folderColorsByName = {});
    const row = (s: Setting, ...cls: string[]) => {
      fresh(s).setClass("lg-fc-row");
      for (const c of cls) s.setClass(c);
      return s;
    };
    const items: SettingDefinition[] = [
      {
        name: tr("이름별 색", "Colors by name"),
        desc: tr("폴더 이름별로 색을 지정합니다. 이름이 같은 폴더는 위치와 관계없이 같은 색이 되고, 하위 폴더와 문서는 따로 지정하지 않으면 상위 폴더의 색을 따릅니다. 파일 탐색기에서 폴더를 우클릭한 뒤 '폴더 색'을 선택해도 지정할 수 있습니다.", "Assigns colors by folder name. Folders with the same name get the same color wherever they are, and subfolders and notes follow their parent's color unless set separately. You can also right-click a folder in the file explorer and choose 'Folder color'."),
      },
    ];

    // 지정된 색: [이름 ……… 폴더 n곳 | 색 | 지우기]
    const names = Object.keys(map).sort((x, y) => x.localeCompare(y, getLanguage()));
    if (!names.length) items.push({ name: tr("지정된 색 없음", "No colors assigned"), searchable: false, render: (s) => void row(s) });
    for (const name of names) {
      items.push({
        name,
        aliases: [tr("폴더 색", "Folder color")],
        render: (s) => {
          const n = pl.folderCount(name);
          row(s)
            .addColorPicker((c) =>
              c.setValue(map[name]).onChange((value) => {
                map[name] = value.toUpperCase();
                void pl.saveFolderColors();
              })
            )
            .addExtraButton((btn) =>
              btn
                .setIcon("trash-2")
                .setTooltip(tr("색 지우기", "Clear color"))
                .onClick(() => {
                  delete map[name];
                  void pl.saveFolderColors().then(() => this.update());
                })
            );
          s.controlEl.prepend(createSpan({ cls: "lg-fc-count", text: n ? tr(`폴더 ${n}개`, `${n} folder${n === 1 ? "" : "s"}`) : tr("해당 폴더 없음", "No matching folders") }));
        },
      });
    }
    // 더하기: 폴더 이름과 색
    items.push({
      name: tr("색 추가", "Add color"),
      render: (s) => {
        let newName = "";
        let newHex = (pl.folderPalette()[0] || ["", "#4981D0"])[1];
        row(s, "lg-fc-add-row")
          .addText((t) => t.setPlaceholder(tr("폴더 이름", "Folder name")).onChange((v) => (newName = v.trim())))
          .addColorPicker((c) => c.setValue(newHex).onChange((v) => (newHex = v.toUpperCase())))
          .addButton((btn) =>
            btn.setButtonText(tr("추가", "Add")).onClick(() => {
              if (!newName) return;
              map[newName] = newHex;
              void pl.saveFolderColors().then(() => this.update());
            })
          );
      },
    });
    return items;
  }

  // 색 고르기 창의 팔레트(고치기·끌어서 순서·더하기·빼기·기본으로)
  paletteItems(): SettingDefinition[] {
    const pl = this.plugin;
    const row = (s: Setting, ...cls: string[]) => {
      fresh(s).setClass("lg-fc-row");
      for (const c of cls) s.setClass(c);
      return s;
    };
    const items: SettingDefinition[] = [];
    items.push({
      name: tr("팔레트", "Palette"),
      desc: tr("폴더 색 선택 창에 표시되는 색입니다. 오른쪽 손잡이를 끌어 순서를 바꿀 수 있고, 색 코드 칸에 HEX 값을 붙여 넣을 수도 있습니다. 팔레트를 바꿔도 이미 지정한 폴더 색은 바뀌지 않습니다.", "Colors shown in the folder color picker. Drag the handle on the right to reorder, or paste a HEX value into the color code field. Changing the palette does not change colors already assigned to folders."),
      render: (s) => {
        fresh(s).addExtraButton((btn) =>
          btn
            .setIcon("rotate-ccw")
            .setTooltip(tr("기본 팔레트로 되돌리기", "Restore default palette"))
            .onClick(() => {
              // 고친 팔레트가 모두 사라지므로 한 번 더 묻는다 (사용자 요청)
              new ConfirmModal(
                this.app,
                tr("기본 팔레트로 되돌릴까요?", "Restore the default palette?"),
                tr("팔레트에서 고치거나 더한 색이 모두 사라집니다. 이미 폴더에 지정한 색은 바뀌지 않습니다.", "All colors you edited or added to the palette will be lost. Colors already assigned to folders stay the same."),
                tr("되돌리기", "Restore"),
                () => {
                  delete pl.shared.folderPalette;
                  void pl.saveData(pl.shared).then(() => this.update());
                }
              ).open();
            })
        );
      },
    });
    // 고칠 때 기본 팔레트를 복사해 공유 설정에 둔다
    const edit = async (fn: (p: Palette) => void) => {
      if (!Array.isArray(pl.shared.folderPalette)) pl.shared.folderPalette = FOLDER_PALETTE.map(([n, h]) => [n, h]);
      fn(pl.shared.folderPalette);
      await pl.saveData(pl.shared);
    };
    const rows: HTMLElement[] = [];
    pl.folderPalette().forEach(([name, hex], i: number) => {
      items.push({
        name: "",
        aliases: [name],
        render: (s) => this.paletteRow(row(s, "lg-fc-pal-row"), name, hex, i, rows, edit),
      });
    });
    items.push({
      name: "",
      searchable: false,
      render: (s) => {
        row(s).addButton((btn) =>
          btn.setButtonText(tr("팔레트에 색 추가", "Add color to palette")).onClick(() => {
            void edit((p) => p.push([tr("새 색", "New color"), "#888888"])).then(() => this.update());
          })
        );
      },
    });
    return items;
  }

  // 팔레트 한 줄: [이름 | 색 코드 | 색 | 빼기 | 손잡이]
  paletteRow(st: Setting, name: string, hex: string, i: number, rows: HTMLElement[], edit: (fn: (p: Palette) => void) => Promise<void>) {
    const pl = this.plugin;
    let picker: ColorComponent | null = null;
    let code: TextComponent | null = null;
    const setHex = (v: string): void => {
      void edit((p) => {
        p[i][1] = v;
      });
    };
    st.addText((t) =>
      t
        .setValue(name)
        .setPlaceholder(tr("이름", "Name"))
        .onChange((v) => {
          void edit((p) => {
            p[i][0] = v.trim() || name;
          });
        })
    )
      // 색 코드: 복사·붙여 넣기용. #은 없어도 된다. 올바른 6자리일 때만 반영한다
      .addText((t) => {
        code = t;
        t.inputEl.addClass("lg-fc-hex");
        t.inputEl.spellcheck = false;
        t.setValue(hex.toUpperCase()).onChange((v) => {
          const m = /^#?([0-9a-f]{6})$/i.exec(v.trim());
          if (!m) return;
          const h = "#" + m[1].toUpperCase();
          if (picker !== null) picker.setValue(h.toLowerCase());
          setHex(h);
        });
        t.inputEl.addEventListener("blur", () => {
          const cur = (pl.folderPalette()[i] || [])[1];
          if (cur) t.setValue(cur.toUpperCase());
        });
      })
      .addColorPicker((c) => {
        picker = c;
        c.setValue(hex.toLowerCase()).onChange((v) => {
          if (code !== null) code.setValue(v.toUpperCase());
          setHex(v.toUpperCase());
        });
      })
      .addExtraButton((btn) =>
        btn
          .setIcon("trash-2")
          .setTooltip(tr("팔레트에서 빼기", "Remove from palette"))
          .onClick(() => {
            void edit((p) => p.splice(i, 1)).then(() => this.update());
          })
      );
    // 끌어서 순서 바꾸기 (손잡이는 줄 오른쪽 끝). 브라우저 끌어 놓기 대신 포인터로 직접 옮긴다: 끄는 동안 줄이 커서 위치의
    // 다른 줄 사이(각 줄의 위아래 가운데 기준)로 바로 들어가고, 놓으면 그 순서를 저장한다.
    // 움직임·놓기는 손잡이가 아니라 문서 전체에서 받는다: 줄을 DOM 에서 옮기면 손잡이의 포인터 잡기(capture)가 풀려,
    // 한 칸 옮긴 뒤로 움직임도 놓기도 안 와서 한 칸만 움직이고 끄는 표시(회색)가 남았다
    const el = st.settingEl;
    el.lgIdx = i;
    rows[i] = el;
    const grip = createDiv({ cls: "lg-fc-grip" });
    setIcon(grip, "grip-vertical");
    setTooltip(grip, tr("끌어서 순서 바꾸기", "Drag to reorder"));
    el.appendChild(grip);
    grip.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      const doc = grip.ownerDocument;
      const live = rows.filter((r) => r && r.isConnected);
      el.addClass("lg-fc-dragging");
      doc.body.addClass("lg-fc-sorting"); // 끄는 동안 글자 선택 막기
      const move = (ev: PointerEvent) => {
        const others = live.filter((r) => r !== el);
        const before = others.find((r) => {
          const rr = r.getBoundingClientRect();
          return ev.clientY < rr.top + rr.height / 2;
        });
        const parent = el.parentElement;
        if (before) {
          if (el.nextSibling !== before) parent.insertBefore(el, before);
        } else {
          const last = others[others.length - 1];
          if (last && last.nextSibling !== el) parent.insertBefore(el, last.nextSibling);
        }
      };
      const finish = async () => {
        doc.removeEventListener("pointermove", move);
        doc.removeEventListener("pointerup", up);
        doc.removeEventListener("pointercancel", up);
        el.removeClass("lg-fc-dragging");
        doc.body.removeClass("lg-fc-sorting");
        const order = live
          .slice()
          .sort((x, y) => (x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
          .map((r) => r.lgIdx);
        if (order.every((k, j) => k === j)) return;
        await edit((p) => {
          const copy = p.slice();
          p.splice(0, p.length, ...order.map((k) => copy[k]));
        });
        this.update();
      };
      const up = (): void => {
        void finish();
      };
      doc.addEventListener("pointermove", move);
      doc.addEventListener("pointerup", up);
      doc.addEventListener("pointercancel", up);
    });
  }
}
