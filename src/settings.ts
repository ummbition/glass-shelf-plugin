// 폴더 색 팔레트: [이름, #색]
export type Palette = [string, string][];

// 설정 값의 모양. 값의 뜻은 DEFAULTS 의 주석에 있다
export interface Settings {
  glassLevel: number;
  showPath: boolean;
  webTint: boolean;
  miniBar: boolean;
  popupOpaque: boolean;
  sideAcrylic: boolean;
  refraction: boolean;
  reduceMotion: string;
  toggleColor: string;
  tint: string;
  tintColor: string;
  tintLevel: number;
  tintWhiteInk: boolean;
  taskStyle: string;
  taskColor: string;
  taskColorCustom: string;
  folderColor: string;
  folderColorCustom: string;
  compactWindowControls: boolean;
  tabAnim: string;
  tabWide: boolean;
  tabNames: boolean;
  tabListSides: string;
  fileIcons: string;
  headingRule: boolean;
  fileStripes: boolean;
  fileGuides: boolean;
  navCompact: boolean;
  // 폴더 이름 → #색 (폴더 색)
  folderColorsByName?: Record<string, string>;
  // 예전 폴더 경로 → #색. 이름 기준으로 옮긴 뒤 지운다
  folderColors?: Record<string, string>;
  // 사용자가 고친 팔레트 (없으면 기본 팔레트)
  folderPalette?: Palette;
  // 보기 종류 → 그 보기의 아이콘 이름. 보기가 열릴 때 배워 둔다 (파일 탐색기 문서 종류 기호)
  viewIcons?: Record<string, string>;
}

// data.json 에서 읽은 그대로의 값 (옛 키가 남아 있을 수 있다)
export type RawSettings = Partial<Settings> & Record<string, unknown>;

export const DEFAULTS: Settings = {
  // 유리 투명도 0~10 단계 (클수록 덜 투명). 0 = 맑은 유리.
  // 1~5: 유리 뒤를 바탕색 쪽으로 바래게 (--lg-fade 0.45~0.8). 6~10: 다 바랜 채로 채움을 더해 뿌옇게 (예전 뿌연 정도 1~5).
  // 흐림 세기는 테마에 고정(--lg-blur-k)
  glassLevel: 5,
  // 탭 줄 첫 줄에 지금 문서의 "폴더 / 파일" 경로를 보이고, 탭은 둘째 줄로 내린다
  showPath: true,
  webTint: true,
  // 편집창을 아래로 스크롤하면 탭 줄을 접고 문서 제목만 작게 남긴다 (사파리식)
  miniBar: true,
  // Obsidian 팝업(대화상자·명령 팔레트·미리보기·알림 등): false = 메뉴만큼 비침, true = 꽉 채움
  popupOpaque: false,
  // 좌우 패널 뒤로 바탕화면이 흐리게 비치게 (Windows 11 아크릴, 사용자 요청)
  sideAcrylic: false,
  // 굴절(가장자리에서 뒤 배경이 휘어 보이는 효과)
  refraction: true,
  // 컴팩트 모드: 버튼 누름 효과를 줄이는 곳. "off" = 끔, "pc" = PC 만, "pcTablet" = PC·태블릿 (휴대폰은 늘 원래 효과)
  reduceMotion: "pc",
  // 토글·슬라이더 색: "green" = iOS 색(토글 초록, 슬라이더 파랑), "accent" = 둘 다 Obsidian 강조색
  toggleColor: "green",
  // 유리 틴트: "none" = 투명, "accent" = Obsidian 강조색, "obsidian" = Obsidian 기본 보라, "custom" = tintColor
  tint: "none",
  tintColor: "#ffffff",
  // 틴트 세기 1~10 단계 (10 = 색 40%)
  tintLevel: 5,
  // 틴트 때 유리 안 기호·글자를 흰색으로 (라이트 모드용. 다크 모드는 원래 흰색)
  tintWhiteInk: false,
  // 할 일 체크박스: 모양 "check" = 색 원에 체크가 뚫린 모양, "ring" = 테두리 원 안에 띄운 작은 원
  taskStyle: "check",
  // 체크박스 색: "yellow" = 노랑, "accent" = Obsidian 강조색, "custom" = taskColorCustom
  taskColor: "accent",
  taskColorCustom: "#fac800",
  // 파일 탐색기 폴더 기호 색: "blue" = 테마 기본 파랑, "accent" = Obsidian 강조색, "custom" = folderColorCustom
  folderColor: "blue",
  folderColorCustom: "#5fb0eb",
  // 창 제어 버튼(최소화·최대화·닫기)을 평소엔 작은 점으로, 올리면 제 크기로 (Windows·Linux)
  compactWindowControls: true,
  // 패널 탭 전환 효과: "lens" = 렌즈가 옮겨 간다, "none" = 효과 없이 선택한 탭이 강조색 알약,
  // "list" = 탭을 한 줄에 하나씩 세로로 늘어놓는다(tabListSides 의 패널만, 나머지 패널은 렌즈)
  tabAnim: "lens",
  // 목록 방식을 쓸 패널: "left" | "right" | "both"
  tabListSides: "both",
  // 패널 탭 알약을 좌우 끝까지 넓게 (맨 위 묶음은 한 줄 내려서)
  tabWide: true,
  // 패널 탭 기호 오른쪽에 이름 (탭이 하나뿐이면 설정과 상관없이 붙는다)
  tabNames: true,
  // 제목(h1~h6) 밑 가로줄 (CSS: body.lg-hrule)
  headingRule: false,
  // 파일 탐색기 줄무늬
  fileStripes: false,
  // 파일 탐색기 들여쓰기 세로줄 (끄면 CSS: body.lg-no-guides)
  fileGuides: true,
  // 파일 탐색기 기호: "none" = 없음, "finder" = 테마의 입체 폴더·문서 기호, "line" = Obsidian 닫힌 폴더 기호(폴더만)
  fileIcons: "finder",
  // 모바일 파일 탐색기 줄 위아래 간격 좁게 (CSS: body.lg-nav-compact)
  navCompact: false,
};

// 예전 "이 기기만 따로 설정"(삭제, 사용자 요청)이 이 기기 저장소(localStorage)에 쓰던 키. 남은 값을 지우는 데만 쓴다
export const OLD_DEVICE_KEYS = ["liquid-glass-device-only", "liquid-glass-device-settings"];

// Obsidian 기본 강조색(보라). 사용자가 강조색을 바꿔도 이 색은 그대로
export const OBSIDIAN_PURPLE = "hsl(258 88% 66%)";

// 예전 "유리 뿌연 정도"(frostLevel 0~10)를 "유리 투명도"(glassLevel)로 옮긴다.
// 예전 1~5 는 새 6~10 (다 바랜 뒤 뿌옇게), 예전 0 은 새 5 (다 바랬고 채움 없음). 예전 6 이상은 새 10
export const migrateGlassLevel = function (o: RawSettings): void {
  if (o.glassLevel == null && typeof o.frostLevel === "number") {
    o.glassLevel = Math.min(10, 5 + Math.max(0, Math.round(o.frostLevel)));
  }
  delete o.frostLevel;
};
