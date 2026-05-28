export type Company = {
  id: string;
  biz_no: string | null;
  name_kr: string;
  name_en: string;
  email: string;
  phone: string;
  scale_code: number;
  asean_countries: string[];
  other_countries: string[];
};

export type CompanyInput = Omit<Company, "id">;

export const ASEAN: { kr: string; en: string; flag: string }[] = [
  { kr: "베트남", en: "Vietnam", flag: "🇻🇳" },
  { kr: "태국", en: "Thailand", flag: "🇹🇭" },
  { kr: "말레이시아", en: "Malaysia", flag: "🇲🇾" },
  { kr: "인도네시아", en: "Indonesia", flag: "🇮🇩" },
  { kr: "싱가포르", en: "Singapore", flag: "🇸🇬" },
  { kr: "필리핀", en: "Philippines", flag: "🇵🇭" },
  { kr: "캄보디아", en: "Cambodia", flag: "🇰🇭" },
  { kr: "미얀마", en: "Myanmar", flag: "🇲🇲" },
  { kr: "라오스", en: "Laos", flag: "🇱🇦" },
  { kr: "브루나이", en: "Brunei", flag: "🇧🇳" },
];

export const ASEAN_FLAG = "🌏";

// EU 27 — country names match Korean spellings used in KOIMA other_countries data.
export const EU: { kr: string; en: string; flag: string }[] = [
  { kr: "독일", en: "Germany", flag: "🇩🇪" },
  { kr: "프랑스", en: "France", flag: "🇫🇷" },
  { kr: "이탈리아", en: "Italy", flag: "🇮🇹" },
  { kr: "스페인", en: "Spain", flag: "🇪🇸" },
  { kr: "네덜란드", en: "Netherlands", flag: "🇳🇱" },
  { kr: "폴란드", en: "Poland", flag: "🇵🇱" },
  { kr: "체코공화국", en: "Czechia", flag: "🇨🇿" },
  { kr: "오스트리아", en: "Austria", flag: "🇦🇹" },
  { kr: "벨기에", en: "Belgium", flag: "🇧🇪" },
  { kr: "스웨덴", en: "Sweden", flag: "🇸🇪" },
  { kr: "헝가리", en: "Hungary", flag: "🇭🇺" },
  { kr: "루마니아", en: "Romania", flag: "🇷🇴" },
  { kr: "덴마크", en: "Denmark", flag: "🇩🇰" },
  { kr: "포루투갈", en: "Portugal", flag: "🇵🇹" },
  { kr: "불가리아", en: "Bulgaria", flag: "🇧🇬" },
  { kr: "슬로바키아", en: "Slovakia", flag: "🇸🇰" },
  { kr: "핀란드", en: "Finland", flag: "🇫🇮" },
  { kr: "아일랜드", en: "Ireland", flag: "🇮🇪" },
  { kr: "슬로베니아", en: "Slovenia", flag: "🇸🇮" },
  { kr: "리투아니아", en: "Lithuania", flag: "🇱🇹" },
  { kr: "그리스", en: "Greece", flag: "🇬🇷" },
  { kr: "크로아티아", en: "Croatia", flag: "🇭🇷" },
  { kr: "라트비아", en: "Latvia", flag: "🇱🇻" },
  { kr: "에스토니아", en: "Estonia", flag: "🇪🇪" },
  { kr: "몰타", en: "Malta", flag: "🇲🇹" },
  { kr: "룩셈부르그", en: "Luxembourg", flag: "🇱🇺" },
  { kr: "키프로스", en: "Cyprus", flag: "🇨🇾" },
];

export const EU_NAMES = EU.map((e) => e.kr);

export const EU_FLAG = "🇪🇺";


// Korean country name -> ISO2 code. Covers every country appearing in KOIMA data.
// Misspelled / outdated names are normalized to the official Korean name via NAME_FIX.
const NAME_FIX: Record<string, string> = {
  체코공화국: "체코",
  포루투갈: "포르투갈",
  룩셈부르그: "룩셈부르크",
  사이프러스: "키프로스",
  베네주엘라: "베네수엘라",
  마다카스카르: "마다가스카르",
  아프카니스탄: "아프가니스탄",
  에쿠아도르: "에콰도르",
  러시아연방: "러시아",
  아랍에미리트연합: "아랍에미리트",
  "보스니아-헤르체고비나": "보스니아 헤르체고비나",
  마세도니아: "북마케도니아",
  베닝: "베냉",
  벨리제: "벨리즈",
  스와질랜드: "에스와티니",
  코트디봐르: "코트디부아르",
  타지크: "타지키스탄",
  투르크멘: "투르크메니스탄",
  챠드: "차드",
  예맨: "예멘",
  그린랜드: "그린란드",
  기네비소: "기니비사우",
  마샬군도: "마셜제도",
  솔로몬군도: "솔로몬제도",
  세이쉘: "세이셸",
  자마이카: "자메이카",
  지브랄타: "지브롤터",
  큐라소: "퀴라소",
  코모로스: "코모로",
  쿡아일랜드: "쿡 제도",
  티모르: "동티모르",
  저어지: "저지",
  네덜란드열도: "네덜란드령 안틸레스",
  상토메프린스페: "상투메 프린시페",
  안티가바부다: "앤티가 바부다",
  트리니다드토바고: "트리니다드 토바고",
  파로에군도: "페로 제도",
  포클랜드군도: "포클랜드 제도",
  크리스마스아일랜드: "크리스마스섬",
  영령캐이맨군도: "케이맨 제도",
  미령버진군도: "미국령 버진아일랜드",
  북마리아나군도: "북마리아나 제도",
  "남조지아&남샌드위치군도": "사우스조지아 사우스샌드위치 제도",
  "투르크&카이코스군도": "터크스 케이커스 제도",
  "왈라스&퓨투나군도": "왈리스 푸투나",
  마이너아우틀링합중국군도: "미국령 군소 제도",
  스발비드군도: "스발바르 얀마옌",
  허드앤맥도날드군도: "허드 맥도날드 제도",
  코스군도: "코코스 제도",
  불령가이아나: "프랑스령 기아나",
  불령남부지역: "프랑스령 남방 및 남극",
  불령리유니온코모도제도: "레위니옹",
  불령폴리네시아: "프랑스령 폴리네시아",
  영령인도양: "영국령 인도양 지역",
  과델로프: "과들루프",
  보네르신트외스타티위스: "보네르 신트외스타티위스 사바",
  세인트바르탤르미: "생바르텔레미",
  "세인트마틴(생마르탱)": "생마르탱",
  세인트빈센트그레나딘: "세인트빈센트 그레나딘",
  세인트키츠네비스: "세인트키츠 네비스",
  피트카이른: "핏케언",
  안타티카: "남극",
  팔레스타인해방기구: "팔레스타인",
};

const COUNTRY_ISO: Record<string, string> = {
  베트남: "VN", 태국: "TH", 말레이시아: "MY", 인도네시아: "ID", 싱가포르: "SG",
  필리핀: "PH", 캄보디아: "KH", 미얀마: "MM", 라오스: "LA", 브루나이: "BN",
  중국: "CN", 일본: "JP", 미국: "US", 대만: "TW", 홍콩: "HK", 마카오: "MO",
  인도: "IN", 파키스탄: "PK", 방글라데시: "BD", 스리랑카: "LK", 네팔: "NP",
  부탄: "BT", 몰디브: "MV", 몽골: "MN", 카자흐스탄: "KZ", 우즈베키스탄: "UZ",
  키르기스스탄: "KG", 타지키스탄: "TJ", 투르크메니스탄: "TM", 아프가니스탄: "AF",
  독일: "DE", 영국: "GB", 프랑스: "FR", 이탈리아: "IT", 스페인: "ES",
  네덜란드: "NL", 벨기에: "BE", 스위스: "CH", 오스트리아: "AT", 폴란드: "PL",
  체코: "CZ", 스웨덴: "SE", 노르웨이: "NO", 핀란드: "FI", 덴마크: "DK",
  아일랜드: "IE", 포르투갈: "PT", 그리스: "GR", 헝가리: "HU", 루마니아: "RO",
  슬로바키아: "SK", 슬로베니아: "SI", 크로아티아: "HR", 라트비아: "LV",
  리투아니아: "LT", 에스토니아: "EE", 몰타: "MT", 불가리아: "BG", 키프로스: "CY",
  룩셈부르크: "LU", 아이슬란드: "IS", 우크라이나: "UA", 벨라루스: "BY",
  몰도바: "MD", 세르비아: "RS", 몬테네그로: "ME", 알바니아: "AL", 북마케도니아: "MK",
  "보스니아 헤르체고비나": "BA", 안도라: "AD", 모나코: "MC", 산마리노: "SM",
  리히텐슈타인: "LI", 교황청: "VA", 맨섬: "IM", 건지: "GG", 저지: "JE",
  러시아: "RU", 조지아: "GE", 아르메니아: "AM", 아제르바이잔: "AZ", 튀르키예: "TR",
  사우디아라비아: "SA", 아랍에미리트: "AE", 이스라엘: "IL", 이집트: "EG",
  이란: "IR", 이라크: "IQ", 카타르: "QA", 쿠웨이트: "KW", 오만: "OM",
  요르단: "JO", 레바논: "LB", 시리아: "SY", 예멘: "YE", 바레인: "BH",
  팔레스타인: "PS",
  케냐: "KE", 나이지리아: "NG", 모로코: "MA", 알제리: "DZ", 튀니지: "TN",
  리비아: "LY", 가나: "GH", 가봉: "GA", 감비아: "GM", 기니: "GN", 기니비사우: "GW",
  나미비아: "NA", 남수단: "SS", 남아프리카공화국: "ZA", 니제르: "NE", 라이베리아: "LR",
  레소토: "LS", 르완다: "RW", 마다가스카르: "MG", 말라위: "MW", 말리: "ML",
  모리셔스: "MU", 모리타니: "MR", 모잠비크: "MZ", 베냉: "BJ", 보츠와나: "BW",
  부룬디: "BI", 부르키나파소: "BF", "상투메 프린시페": "ST", 세네갈: "SN",

  세이셸: "SC", 세인트헬레나: "SH", 소말리아: "SO", 수단: "SD", 시에라리온: "SL",
  앙골라: "AO", 에리트리아: "ER", 에스와티니: "SZ", 에티오피아: "ET",
  우간다: "UG", 잠비아: "ZM", 적도기니: "GQ", 중앙아프리카공화국: "CF",
  지부티: "DJ", 짐바브웨: "ZW", 차드: "TD", 카메룬: "CM", 카보베르데: "CV",
  코모로: "KM", 코트디부아르: "CI", 콩고: "CG", 콩고민주공화국: "CD",
  탄자니아: "TZ", 토고: "TG", "프랑스령 기아나": "GF", "프랑스령 남방 및 남극": "TF",
  레위니옹: "RE", 마요트: "YT", 마티니크: "MQ", 과들루프: "GP",
  "보네르 신트외스타티위스 사바": "BQ", 생바르텔레미: "BL", 생마르탱: "MF",
  캐나다: "CA", 멕시코: "MX", 과테말라: "GT", 온두라스: "HN", 엘살바도르: "SV",
  니카라과: "NI", 코스타리카: "CR", 파나마: "PA", 쿠바: "CU", 자메이카: "JM",
  아이티: "HT", 도미니카: "DM", 도미니카공화국: "DO", 바하마: "BS",
  바베이도스: "BB", 그레나다: "GD", 세인트루시아: "LC", "세인트빈센트 그레나딘": "VC",
  "세인트키츠 네비스": "KN", "앤티가 바부다": "AG", "트리니다드 토바고": "TT",
  벨리즈: "BZ", 푸에르토리코: "PR", "미국령 버진아일랜드": "VI", 아루바: "AW",
  퀴라소: "CW", "네덜란드령 안틸레스": "AN", 버뮤다: "BM", 앙귈라: "AI",
  몬트세라트: "MS", "케이맨 제도": "KY", "터크스 케이커스 제도": "TC",
  브라질: "BR", 아르헨티나: "AR", 칠레: "CL", 페루: "PE", 콜롬비아: "CO",
  볼리비아: "BO", 에콰도르: "EC", 우루과이: "UY", 파라과이: "PY",
  베네수엘라: "VE", 가이아나: "GY", 수리남: "SR",
  "포클랜드 제도": "FK", "사우스조지아 사우스샌드위치 제도": "GS",
  호주: "AU", 뉴질랜드: "NZ", 파푸아뉴기니: "PG", 피지: "FJ", 사모아: "WS",
  통가: "TO", 바누아투: "VU", "솔로몬제도": "SB", "마셜제도": "MH",
  마이크로네시아: "FM", 키리바티: "KI", 나우루: "NR", 팔라우: "PW", 투발루: "TV",
  뉴칼레도니아: "NC", "프랑스령 폴리네시아": "PF", 괌: "GU", 아메리칸사모아: "AS",
  "북마리아나 제도": "MP", "쿡 제도": "CK", 니우에: "NU", 토켈라우: "TK",
  핏케언: "PN", "왈리스 푸투나": "WF", 크리스마스섬: "CX", "코코스 제도": "CC",
  "허드 맥도날드 제도": "HM", "미국령 군소 제도": "UM",
  "영국령 인도양 지역": "IO", 지브롤터: "GI", "스발바르 얀마옌": "SJ",
  그린란드: "GL", "페로 제도": "FO", 동티모르: "TL", 남극: "AQ",
};

// 진짜 국가가 아닌 항목 — 기타국으로 표시
const NON_COUNTRY = new Set(["기타국", "해외교포", "국제통화기금"]);

const iso2ToFlag = (iso: string): string =>
  iso.toUpperCase().split("").map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)).join("");

// 표시용 국가명 (오타/구식 표기 → 정식 명칭, 비국가 항목 → "기타국")
export const displayCountry = (country: string): string => {
  const t = country.trim();
  if (NON_COUNTRY.has(t)) return "기타국";
  return NAME_FIX[t] ?? t;
};

export const flagOf = (country: string): string => {
  const t = country.trim();
  if (NON_COUNTRY.has(t)) return "🏳️";
  const normalized = NAME_FIX[t] ?? t;
  const iso = COUNTRY_ISO[normalized];
  return iso ? iso2ToFlag(iso) : "🏳️";
};


export const SCALE: Record<number, [string, string]> = {
  6: ["50만불 미만", "Under USD 0.5M"],
  7: ["50만~100만불", "USD 0.5–1M"],
  8: ["100만~300만불", "USD 1–3M"],
  9: ["300만~500만불", "USD 3–5M"],
  10: ["500만~700만불", "USD 5–7M"],
  11: ["700만~1,000만불", "USD 7–10M"],
  12: ["1,000만~3,000만불", "USD 10–30M"],
  13: ["3,000만~5,000만불", "USD 30–50M"],
  14: ["5,000만~1억불", "USD 50–100M"],
  15: ["1억불 초과", "Over USD 100M"],
const BRANCH_KEYWORDS =
  "공장|지점|지사|사업소|영업소|출장소|본부|본사|연구소|사업부|센터|공단|기지|물류센터|연구개발센터|제련소|제철소|제강소|발전소|정유공장|제조소|작업소|terminal|터미널|캠퍼스";
export const SCOLOR: Record<number, [string, string]> = {
  6: ["#6D6E70", "#ececec"],


  7: ["#5a6a3a", "#eef0e4"],
  8: ["#4a6a4a", "#e6f0e8"],
  9: ["#3a6a6a", "#e2f0f0"],
  10: ["#3a5a8a", "#e4eaf4"],
  11: ["#1A2B5E", "#e6e9f2"],
  12: ["#5a3a8a", "#ebe4f2"],
  13: ["#8a3a6a", "#f2e4ec"],
  14: ["#a83a3a", "#f4e4e4"],
  15: ["#D0001B", "#fae2e4"],
};

// 상호 뒤에 붙은 지점/공장 등 접미부를 표시용으로 제거합니다.
// 예: "지에스칼텍스(주)여수공장" → "지에스칼텍스(주)"
// 상호 뒤에 붙은 지점/공장 등 접미부 + 괄호 안 지점 표기를 표시용으로 제거합니다.
// 예: "지에스칼텍스(주)여수공장" → "지에스칼텍스(주)"
//     "한국가스공사(인천기지본부)" → "한국가스공사"
//     "앰코테크놀로지코리아(주)(부평 5 공장)" → "앰코테크놀로지코리아(주)"
// (주)/㈜가 문자열 맨 앞에 있는 경우(예: "(주)티비공장")는 본명일 수 있어 건드리지 않습니다.
const BRANCH_KEYWORDS =
  "공장|지점|지사|사업소|영업소|출장소|본부|본사|연구소|사업부|센터|공단|기지|물류센터|연구개발센터";
const BRANCH_SUFFIX_RE = new RegExp(
  `^(.+?(?:\\(주\\)|㈜))\\s*\\S*?(?:${BRANCH_KEYWORDS})(?:지점|공장)?$`
);
const TRAILING_PAREN_BRANCH_RE = new RegExp(
  `\\s*[\\(（][^()（）]*(?:${BRANCH_KEYWORDS})[^()（）]*[\\)）]\\s*$`
);
export function displayCompanyName(name: string | null | undefined): string {
  if (!name) return "";
  let s = name.trim();
  // 끝에 붙은 (xxx공장), (xxx본부) 같은 괄호는 반복 제거
  while (true) {
    const next = s.replace(TRAILING_PAREN_BRANCH_RE, "").trim();
    if (next === s) break;
    s = next;
  }
  if (/^(?:\(주\)|㈜|주식회사)/.test(s)) return s;
  const m = s.match(BRANCH_SUFFIX_RE);
  return m ? m[1] : s;
}


