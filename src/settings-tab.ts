import type { App, ColorComponent, Setting, SettingDefinition, SettingDefinitionItem, TextComponent } from "obsidian";
import { PluginSettingTab, Platform, setIcon, setTooltip, getLanguage } from "obsidian";
import type { GlassShelfPlugin } from "./host";
import type { Palette, Settings } from "./settings";
import { tr } from "./util";
import { FOLDER_PALETTE } from "./color";
import { ConfirmModal } from "./folder-modal";
import { DEFAULTS } from "./settings";

// Obsidian 은 다시 그릴 때 설정 줄 요소를 자리대로 다시 쓴다. 직접 그리는 줄은 그리기 전에 우리가 붙인 클래스와 요소를 걷어 낸다
// (안 걷으면 팔레트 줄을 하나 지운 뒤 아래 줄에 팔레트 줄 표시·손잡이가 남았다)
const OUR_CLS = ["lg-settings-sub", "lg-fc-row", "lg-fc-pal-row", "lg-fc-add-row", "lg-fc-dragging"];
const fresh = (s: Setting): Setting => {
  s.settingEl.removeClass(...OUR_CLS);
  s.settingEl.querySelectorAll(".lg-fc-grip, .lg-fc-count").forEach((el) => el.remove());
  return s;
};

// 설정 값 키. iosColors 는 toggleColor("green"/"accent")를 켜고 끄기로 보여 주는 가상 키
type Key = keyof Settings | "iosColors";

// 설정 탭. Obsidian 1.13 의 선언형 설정(getSettingDefinitions)이라 설정 검색에 잡힌다.
// 값 읽기·쓰기는 getControlValue·setControlValue 가 맡고, 목록이 바뀌면(폴더 색 등) update() 로 다시 만든다
export class GlassShelfSettingTab extends PluginSettingTab {
  declare plugin: GlassShelfPlugin;
  // 드롭다운 설정마다 이 기기에서 보여 주는 선택지
  private options = new Map<string, Record<string, string>>();

  constructor(app: App, plugin: GlassShelfPlugin) {
    super(app, plugin);
    this.plugin = plugin;
    // 플러그인 CSS(styles.css)의 설정 화면 꾸밈 기준
    this.containerEl.addClass("lg-settings");
  }

  getControlValue(key: string): unknown {
    if (key === "iosColors") return this.plugin.settings.toggleColor !== "accent";
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
    if (key === "navCompact") pl.remeasureExplorers();
    if (key === "fileStripes") pl.requestFolderColors(true);
    if (key === "sideAcrylic" && value === true) pl.noticeSimpleTabs();
    // 고른 값에 따라 하위 항목이 생기거나 사라진다
    if (key === "tint" || key === "taskColor" || key === "folderColor" || key === "tabAnim") this.update();
  }

  getSettingDefinitions(): SettingDefinitionItem[] {
    const st = this.plugin.settings;
    const toggle = (key: Key, name: string, desc: string, visible = true): SettingDefinition => ({ name, desc, visible, control: { type: "toggle", key } });
    const dropdown = (key: Key, name: string, desc: string | undefined, options: Record<string, string>): SettingDefinition => {
      this.options.set(key, options);
      return { name, desc, control: { type: "dropdown", key, options } };
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
            desc: tr("숫자가 클수록 유리가 덜 투명해집니다. 0은 맑은 유리이고, 1~5는 유리 뒤의 내용이 배경색 쪽으로 점점 옅어지며, 6~10은 그 위에 색을 채워 점점 뿌옇게 만듭니다. 버튼과 편집창 위쪽 유리판에 적용되며 메뉴와 팝업은 제외됩니다.", "Higher values make the glass less transparent. 0 is clear glass; 1–5 gradually fade what is behind the glass toward the background color; 6–10 add a fill on top that makes it increasingly frosted. Applies to buttons and the glass panel above the editor, not to menus and popups."),
            render: (s) => {
              fresh(s).addSlider((slider) => slider.setLimits(0, 10, 1).setValue(st.glassLevel).onChange((v) => void this.setControlValue("glassLevel", v))).addExtraButton((btn) =>
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
          toggle("hoverLarge", tr("큰 호버 효과", "Large hover effect"), tr("버튼에 마우스를 올렸을 때 나타나는 유리의 크기입니다. 끄면 버튼에 맞춰 작게, 켜면 버튼 묶음의 높이만큼 크게 표시됩니다.", "Size of the glass that appears when hovering a button. Off: fits the button. On: as tall as the button group.")),
          toggle("compactWindowControls", tr("창 제어 버튼 축소", "Compact window controls"), tr("최소화, 최대화, 닫기 버튼을 평소에는 작은 점으로 줄여 두고, 마우스를 올리면 원래 크기로 보여 줍니다. 줄어든 만큼 탭 줄이 넓어집니다. (Windows, Linux)", "Shrinks the minimize, maximize and close buttons to small dots until you hover them. The tab bar gets the freed space. (Windows, Linux)"), !Platform.isMobile),
        ],
      },
      {
        type: "group",
        heading: tr("편집창", "Editor"),
        items: [
          toggle("showPath", tr("경로 표시", "Show path"), tr("편집창 탭 줄 위쪽 가운데에 현재 문서의 경로를 표시하고, 탭은 그 아래 줄에 좌우 폭을 모두 써서 배치합니다. 폴더 이름을 누르면 파일 탐색기에서 해당 폴더를 보여 줍니다. (데스크톱, 태블릿)", "Shows the current note's path at the top center of the editor tab bar and moves the tabs to a full-width row below. Click a folder name to reveal it in the file explorer. (Desktop, tablet)"), !Platform.isPhone),
          toggle("miniBar", tr("스크롤 시 탭 줄 축소", "Collapse tab bar on scroll"), tr("편집창을 아래로 스크롤하면 탭 줄을 접고 현재 문서 제목만 작게 표시합니다. 위로 스크롤하거나 제목을 누르면 다시 펼칩니다. (데스크톱, 태블릿)", "Scrolling down in the editor collapses the tab bar to a small title of the current note. Scroll up or click the title to expand it again. (Desktop, tablet)"), !Platform.isPhone),
          toggle("webTint", tr("몰입형 웹 보기", "Immersive web view"), tr("웹 뷰어에서 페이지가 탭 줄 뒤로 지나가게 하고, 탭 줄과 버튼을 페이지의 대표 색으로 칠합니다. (데스크톱, 태블릿)", "In the web viewer, lets the page scroll behind the tab bar and colors the tab bar and its buttons with the page's theme color. (Desktop, tablet)"), !Platform.isPhone),
          toggle("headingRule", tr("제목 아래 가로줄", "Line under headings"), tr("제목(H1~H6) 아래에 얇은 가로줄을 긋습니다. 라이트 모드에서는 검은색, 다크 모드에서는 흰색입니다.", "Draws a thin line under headings (H1–H6). Black in light mode, white in dark mode.")),
        ],
      },
      {
        type: "group",
        heading: tr("사이드바 탭", "Sidebar tabs"),
        items: [
          dropdown("tabAnim", tr("탭 전환 효과", "Tab switch effect"), tr("렌즈: 선택 표시가 렌즈처럼 미끄러지며 옮겨 갑니다. 심플: 효과 없이 선택한 탭을 강조색으로 표시합니다. 목록: 탭을 버튼 줄 아래에 한 줄에 하나씩 늘어놓고, 선택한 탭을 강조색으로 표시합니다. 좌우 패널 투명이 켜져 있으면 렌즈 대신 심플로 보입니다. (목록은 데스크톱, 태블릿)", "Lens: the selection slides over like a lens. Simple: no effect; the selected tab is shown in the accent color. List: tabs are listed one per row below the button row, and the selected tab is shown in the accent color. With transparent side panels on, Simple is shown instead of Lens. (List: desktop, tablet)"), {
            lens: tr("렌즈", "Lens"),
            none: tr("심플 (강조색)", "Simple (accent color)"),
            ...(Platform.isPhone ? {} : { list: tr("목록", "List") }),
          }),
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
          toggle("iosColors", tr("토글·슬라이더 iOS 색상", "iOS colors for toggles and sliders"), tr("켜면 토글은 초록색, 슬라이더는 파란색으로 표시합니다. 끄면 둘 다 강조색을 사용합니다.", "On: toggles are green and sliders are blue. Off: both use the accent color.")),
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
