import { calculateSaju, solarToLunar } from "./vendor/ssaju.mjs";
import {
  STEM_KO, BRANCH_KO, STEM_EL, BRANCH_EL, STEM_YANG, EL_ORDER, EL_HANJA, ZODIAC, COLOR_PREFIX, PILLAR_MEANING,
  DAY_MASTER, ELEMENT_INFO, TEN_GODS, TEN_GOD_GROUPS, LUCK_BY_TEN_GOD, STAGES12, SALS,
  STEM_HAP, BRANCH_YUKHAP, BRANCH_CHUNG, BRANCH_WONJIN, SAMHAP, GLOSSARY, FAQ,
} from "./content.js";

// ---------- helpers ----------
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const hasBatchim = (w) => { const c = String(w).charCodeAt(String(w).length - 1); return c >= 0xac00 && c <= 0xd7a3 ? (c - 0xac00) % 28 > 0 : null; };
const josa = (a, b) => (w) => { const h = hasBatchim(w); return w + (h === null ? `${a}(${b})` : h ? a : b); };
const I = josa("이", "가"), R = josa("을", "를"), N = josa("은", "는"), W = josa("과", "와");
const pad = (n) => String(n).padStart(2, "0");
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); } catch {} },
};
const PILLARS = ["hour", "day", "month", "year"];
const PILLAR_KO = { hour: "시주", day: "일주", month: "월주", year: "연주" };
const MAIN_HIDDEN = { 子: "癸", 丑: "己", 寅: "甲", 卯: "乙", 辰: "戊", 巳: "丙", 午: "丁", 未: "己", 申: "庚", 酉: "辛", 戌: "戊", 亥: "壬" };

const glyph = (ch, el, small = "", cls = "") =>
  `<div class="glyph el-${esc(el)} ${cls}">${esc(ch)}${small ? `<small>${esc(small)}</small>` : ""}</div>`;
const gzGlyphs = (gz) => {
  const [s, b] = [...String(gz)];
  return glyph(s, STEM_EL[s], STEM_KO[s]) + glyph(b, BRANCH_EL[b], BRANCH_KO[b]);
};
const stars = (n) => `<span class="stars" aria-label="5점 중 ${n}점">${"★".repeat(n)}<span class="off">${"★".repeat(5 - n)}</span></span>`;

function tenGodOf(dayStem, stem) {
  const e0 = EL_ORDER.indexOf(STEM_EL[dayStem]), e1 = EL_ORDER.indexOf(STEM_EL[stem]);
  const same = STEM_YANG[dayStem] === STEM_YANG[stem];
  return [["비견", "겁재"], ["식신", "상관"], ["편재", "정재"], ["편관", "정관"], ["편인", "정인"]][(e1 - e0 + 5) % 5][same ? 0 : 1];
}
const elRelation = (a, b) => ["같은", "생하는", "극하는", "극받는", "생받는"][(EL_ORDER.indexOf(b) - EL_ORDER.indexOf(a) + 5) % 5];

// ---------- theme switcher ----------
function setTheme(t) {
  document.documentElement.dataset.theme = t;
  $$(".theme-btn").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.themeSet === t)));
  store.set("ssaju:theme", t);
}
$$(".theme-btn").forEach((b) => b.addEventListener("click", () => setTheme(b.dataset.themeSet)));
setTheme(document.documentElement.dataset.theme || "ink");

// ---------- glossary / faq ----------
$("#glossary-list").innerHTML = GLOSSARY.map(([t, d]) => `<details><summary>${esc(t)}</summary><p>${esc(d)}</p></details>`).join("");
$("#faq-list").innerHTML = FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("");

// ---------- form ----------
const form = $("#form");
const LONGITUDES = [["126.9784", "서울"], ["126.7052", "인천"], ["127.0286", "수원"], ["127.3845", "대전"], ["127.4890", "청주"], ["127.1480", "전주"], ["126.8526", "광주"], ["128.6014", "대구"], ["129.0756", "부산"], ["129.3114", "울산"], ["128.6811", "창원"], ["127.7300", "춘천"], ["128.8961", "강릉"], ["126.5312", "제주"]];
const TIMEZONES = [["Asia/Seoul", "한국"], ["Asia/Tokyo", "일본"], ["Asia/Shanghai", "중국"], ["Asia/Taipei", "대만"], ["Asia/Ho_Chi_Minh", "베트남"], ["America/Los_Angeles", "미국 서부"], ["America/Chicago", "미국 중부"], ["America/New_York", "미국 동부"], ["America/Toronto", "캐나다 동부"], ["Europe/London", "영국"], ["Europe/Paris", "중부 유럽"], ["Australia/Sydney", "호주 동부"]];

function personFields(p, title, defGender) {
  return `
    <div class="person-title"><i>${p === "a" ? "1" : "2"}</i><span class="pt-text">${esc(title)}</span></div>
    <div class="row">
      <label class="field grow"><span>이름 <em>(선택)</em></span><input type="text" name="${p}_name" maxlength="20" placeholder="${p === "a" ? "홍길동" : "성춘향"}" /></label>
      <fieldset class="field"><span>성별</span>
        <div class="seg">
          <label><input type="radio" name="${p}_gender" value="여" ${defGender === "여" ? "checked" : ""} /><span>여</span></label>
          <label><input type="radio" name="${p}_gender" value="남" ${defGender === "남" ? "checked" : ""} /><span>남</span></label>
        </div>
      </fieldset>
    </div>
    <div class="row">
      <fieldset class="field"><span>달력</span>
        <div class="seg">
          <label><input type="radio" name="${p}_calendar" value="solar" checked /><span>양력</span></label>
          <label><input type="radio" name="${p}_calendar" value="lunar" /><span>음력</span></label>
        </div>
      </fieldset>
      <label class="check leap" hidden><input type="checkbox" name="${p}_leap" /> 윤달</label>
    </div>
    <div class="row">
      <label class="field grow"><span>년</span><select name="${p}_year"></select></label>
      <label class="field grow"><span>월</span><select name="${p}_month"></select></label>
      <label class="field grow"><span>일</span><select name="${p}_day"></select></label>
    </div>
    <div class="row">
      <label class="field grow"><span>태어난 시각</span><input type="time" name="${p}_time" value="12:00" /></label>
      <label class="check"><input type="checkbox" name="${p}_unknown" /> 시간 모름</label>
    </div>
    <details class="more">
      <summary>고급 설정 (해외 출생 · 평균태양시)</summary>
      <div class="row">
        <label class="field grow"><span>출생지 시간대</span>
          <select name="${p}_tz">${TIMEZONES.map(([v, l]) => `<option value="${v}">${l} (${v})</option>`).join("")}</select>
        </label>
      </div>
      <div class="row">
        <label class="check"><input type="checkbox" name="${p}_lmt" /> 지역 평균태양시 보정</label>
        <label class="field grow lmt-field" hidden><span>출생지</span>
          <select name="${p}_lon">${LONGITUDES.map(([v, l]) => `<option value="${v}">${l} ${(+v).toFixed(2)}°E</option>`).join("")}</select>
        </label>
      </div>
      <p class="hint">한국 표준시는 동경 135° 기준이라 실제 태양시와 약 30분 차이가 납니다. 보정을 켜면 출생지 경도만큼 시각을 조정합니다.</p>
    </details>`;
}

const personEl = { a: $('[data-person="a"]'), b: $('[data-person="b"]') };
personEl.a.innerHTML = personFields("a", "내 정보", "여");
personEl.b.innerHTML = personFields("b", "상대방 정보", "남");
const F = (p, n) => form.elements[`${p}_${n}`];

function fillYears(p) {
  const y = F(p, "year"), m = F(p, "month");
  for (let i = 2099; i >= 1900; i--) y.add(new Option(`${i}년`, i));
  for (let i = 1; i <= 12; i++) m.add(new Option(`${i}월`, i));
  y.value = p === "a" ? 1990 : 1988; m.value = 1;
}
function refreshDays(p) {
  const d = F(p, "day");
  const lunar = F(p, "calendar").value === "lunar";
  const max = lunar ? 30 : new Date(+F(p, "year").value, +F(p, "month").value, 0).getDate();
  const keep = +d.value || 1;
  d.length = 0;
  for (let i = 1; i <= max; i++) d.add(new Option(`${i}일`, i));
  d.value = Math.min(keep, max);
}
function syncPerson(p) {
  const el = personEl[p];
  $(".leap", el).hidden = F(p, "calendar").value !== "lunar";
  F(p, "time").disabled = F(p, "unknown").checked;
  const seoul = F(p, "tz").value === "Asia/Seoul";
  F(p, "lmt").disabled = !seoul;
  if (!seoul) F(p, "lmt").checked = false;
  $(".lmt-field", el).hidden = !F(p, "lmt").checked;
}
for (const p of ["a", "b"]) { fillYears(p); refreshDays(p); }

form.addEventListener("change", (e) => {
  const [p, n] = (e.target.name || "").split("_");
  if (!p || !personEl[p]) return;
  if (["year", "month", "calendar"].includes(n)) refreshDays(p);
  syncPerson(p);
});

function readPerson(p) {
  const unknown = F(p, "unknown").checked;
  const [hh, mm] = (F(p, "time").value || "12:00").split(":").map(Number);
  const input = {
    year: +F(p, "year").value, month: +F(p, "month").value, day: +F(p, "day").value,
    hour: unknown ? 12 : hh, minute: unknown ? 0 : mm,
    gender: F(p, "gender").value, calendar: F(p, "calendar").value,
    leap: F(p, "calendar").value === "lunar" && F(p, "leap").checked,
    timezone: F(p, "tz").value,
  };
  if (F(p, "lmt").checked) { input.applyLocalMeanTime = true; input.longitude = +F(p, "lon").value; }
  return { input, name: F(p, "name").value.trim(), unknown };
}
function savePerson(p) {
  return {
    name: F(p, "name").value, gender: F(p, "gender").value, calendar: F(p, "calendar").value,
    year: F(p, "year").value, month: F(p, "month").value, day: F(p, "day").value, leap: F(p, "leap").checked,
    time: F(p, "time").value, unknown: F(p, "unknown").checked, tz: F(p, "tz").value, lmt: F(p, "lmt").checked, lon: F(p, "lon").value,
  };
}
function loadPerson(p, s) {
  if (!s) return;
  F(p, "name").value = s.name || "";
  if (s.gender) F(p, "gender").value = s.gender;
  if (s.calendar) F(p, "calendar").value = s.calendar;
  if (s.year) F(p, "year").value = s.year;
  if (s.month) F(p, "month").value = s.month;
  refreshDays(p);
  if (s.day) F(p, "day").value = s.day;
  F(p, "leap").checked = !!s.leap;
  F(p, "time").value = s.time || "12:00";
  F(p, "unknown").checked = !!s.unknown;
  if (s.tz) F(p, "tz").value = s.tz;
  F(p, "lmt").checked = !!s.lmt;
  if (s.lon) F(p, "lon").value = s.lon;
}
const saved = store.get("ssaju:form") || {};
loadPerson("a", saved.a); loadPerson("b", saved.b);
syncPerson("a"); syncPerson("b");

// ---------- mode ----------
let mode = "saju";
function setMode(m) {
  mode = m;
  $$(".mode-tab").forEach((t) => { t.classList.toggle("active", t.dataset.mode === m); t.setAttribute("aria-selected", String(t.dataset.mode === m)); });
  personEl.b.hidden = m !== "gunghap";
  $(".persons").classList.toggle("two", m === "gunghap");
  $(".pt-text", personEl.a).textContent = m === "gunghap" ? "첫 번째 사람" : "내 정보";
  $(".pt-text", personEl.b).textContent = "두 번째 사람";
  $("#submit-btn").textContent = m === "gunghap" ? "궁합 보기" : "사주 풀이 보기";
}
$$(".mode-tab").forEach((t) => t.addEventListener("click", () => setMode(t.dataset.mode)));
$$("[data-mode-link]").forEach((a) => a.addEventListener("click", () => setMode(a.dataset.modeLink)));
setMode("saju");

// ---------- submit ----------
let current = null;
form.addEventListener("submit", (e) => {
  e.preventDefault();
  $("#error").textContent = "";
  store.set("ssaju:form", { a: savePerson("a"), b: savePerson("b") });
  try {
    if (mode === "saju") {
      const pa = readPerson("a");
      const r = calculateSaju(pa.input);
      current = r;
      renderSaju(r, pa);
      $("#gh-result").hidden = true;
      $("#result").hidden = false;
      $("#result").scrollIntoView({ block: "start" });
    } else {
      const pa = readPerson("a"), pb = readPerson("b");
      const ra = calculateSaju(pa.input), rb = calculateSaju(pb.input);
      renderGunghap(ra, pa, rb, pb);
      $("#result").hidden = true;
      $("#gh-result").hidden = false;
      $("#gh-result").scrollIntoView({ block: "start" });
    }
  } catch (err) {
    $("#error").textContent = "계산할 수 없는 날짜입니다. 입력을 확인해주세요. (" + (err?.message || err) + ")";
  }
});

// ---------- analysis helpers ----------
function elementCounts(r, unknown) {
  const c = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  for (const k of PILLARS) {
    if (k === "hour" && unknown) continue;
    const p = r.pillarDetails[k];
    c[p.element.stem]++; c[p.element.branch]++;
  }
  return c;
}
function tenGodCounts(r, unknown) {
  const c = Object.fromEntries(Object.keys(TEN_GODS).map((k) => [k, 0]));
  for (const k of PILLARS) {
    if (k === "hour" && unknown) continue;
    const t = r.tenGods[k];
    if (k !== "day" && c[t.stem] !== undefined) c[t.stem]++;
    if (c[t.branch] !== undefined) c[t.branch]++;
  }
  return c;
}
function yongsinElements(r) {
  const out = [];
  for (const y of r.advanced.yongsin || []) {
    const el = STEM_EL[y] || BRANCH_EL[y] || (EL_ORDER.includes(y) ? y : null);
    if (el && !out.includes(el)) out.push(el);
  }
  return out;
}
function branchRelation(a, b) {
  if (BRANCH_YUKHAP[a] === b) return { kind: "육합", score: 1 };
  if (a !== b && SAMHAP.some((g) => g.includes(a) && g.includes(b))) return { kind: "삼합", score: 1 };
  if (BRANCH_CHUNG[a] === b) return { kind: "충", score: -1 };
  if (BRANCH_WONJIN[a] === b) return { kind: "원진", score: -0.5 };
  if (a === b) return { kind: "같은 지지", score: 0.3 };
  return { kind: null, score: 0 };
}

// 운의 간지(세운·일진 등)를 원국 기준으로 해석
function readLuck(r, gz, useful) {
  const [s, b] = [...String(gz)];
  const dm = r.pillarDetails.day.stem;
  const tgS = tenGodOf(dm, s), tgB = tenGodOf(dm, MAIN_HIDDEN[b]);
  let score = 3;
  const notes = [];
  if (useful.includes(STEM_EL[s])) { score++; notes.push(`천간 ${s}(${STEM_KO[s]})의 ${STEM_EL[s]} 기운이 나에게 필요한 용신이라 힘을 보태줍니다.`); }
  if (useful.includes(BRANCH_EL[b])) { score += 0.5; notes.push(`지지 ${b}(${BRANCH_KO[b]})의 ${BRANCH_EL[b]} 기운이 바탕을 받쳐줍니다.`); }
  const rel = branchRelation(r.pillarDetails.day.branch, b);
  if (rel.kind === "충") { score -= 1; notes.push(`일지와 충(衝)이 생겨 변화·이동·감정 기복이 있을 수 있습니다. 서두르지 마세요.`); }
  else if (rel.kind === "육합" || rel.kind === "삼합") { score += 0.5; notes.push(`일지와 ${rel.kind}을 이루어 사람과의 관계가 부드럽게 풀립니다.`); }
  else if (rel.kind === "원진") { score -= 0.5; notes.push(`일지와 원진이라 사소한 오해가 생기기 쉽습니다. 말은 부드럽게.`); }
  if (r.gongmang.branches.includes(b)) { score -= 0.5; notes.push(`공망에 해당하는 지지라 기대만큼 결과가 따르지 않을 수 있습니다.`); }
  return { stem: s, branch: b, tgS, tgB, score: Math.max(1, Math.min(5, Math.round(score))), notes };
}

// ---------- render: saju ----------
function renderSaju(r, { name, unknown }) {
  const inp = r.input, dmD = r.pillarDetails.day, dm = dmD.stem;
  const yb = r.pillarDetails.year.branch, ys = r.pillarDetails.year.stem;
  const z = ZODIAC[yb];
  const useful = yongsinElements(r);
  const s = r.solar;
  let lunarTxt = "";
  try { const l = solarToLunar(s.year, s.month, s.day); lunarTxt = `음력 ${l.year}.${pad(l.month)}.${pad(l.day)}${l.isLeapMonth ? "(윤)" : ""}`; } catch {}
  const timeTxt = unknown ? "시간 모름" : `${pad(inp.hour)}:${pad(inp.minute)}`;
  const strengthKo = { strong: "신강", weak: "신약", neutral: "중화" }[r.advanced.dayStrength.strength];

  // profile
  $("#profile").innerHTML = `
    <div class="zodiac" title="${esc(z.name)}띠">${z.emoji}</div>
    <div>
      <h2>${esc(name || "나")}의 사주</h2>
      <p class="meta"><b>${COLOR_PREFIX[STEM_EL[ys]]} ${esc(z.name)}띠</b> (${esc(ys + yb)}년생) · ${esc(inp.gender === "남" ? "남성" : "여성")} · 만 ${r.currentAge}세</p>
      <p class="meta">양력 ${s.year}.${pad(s.month)}.${pad(s.day)} · ${esc(lunarTxt)} · ${esc(timeTxt)}${inp.timezone !== "Asia/Seoul" ? ` · ${esc(inp.timezone)}` : ""}</p>
    </div>
    <div class="badges">
      <span class="badge">일간<b>${esc(dm)} ${esc(dmD.stemKo)}${esc(dmD.element.stem)}</b></span>
      <span class="badge">격국<b>${esc(r.advanced.geukguk)}</b></span>
      <span class="badge">강약<b>${esc(strengthKo)}</b></span>
      <span class="badge">공망<b>${esc(r.gongmang.branches.join(""))}</b></span>
    </div>`;

  // pillars
  $("#pillars").innerHTML = PILLARS.map((k) => {
    const m = PILLAR_MEANING[k];
    const head = `<div class="p-title">${m.title}</div><div class="p-sub">${m.sub}</div>`;
    if (k === "hour" && unknown) {
      return `<div class="pillar" title="${esc(m.desc)}">${head}<div class="p-god">&nbsp;</div>
        <div class="glyph empty">?</div><div class="glyph empty">?</div><div class="p-god">&nbsp;</div>
        <div class="p-meta">시간 모름</div></div>`;
    }
    const p = r.pillarDetails[k], tg = r.tenGods[k];
    const hidden = Object.values(p.hiddenStems).filter(Boolean).join(" ");
    const sal = r.sals[k];
    const sals = [sal.twelveSal, ...(sal.specialSals || [])].filter(Boolean);
    return `<div class="pillar ${k === "day" ? "is-day" : ""}" title="${esc(m.desc)}">
      ${head}
      <div class="p-god">${k === "day" ? "나 (일간)" : esc(tg.stem)}</div>
      ${glyph(p.stem, p.element.stem, p.stemKo)}
      ${glyph(p.branch, p.element.branch, p.branchKo)}
      <div class="p-god">${esc(tg.branch)}</div>
      <div class="p-meta">
        <div>지장간 <b>${esc(hidden)}</b></div>
        <div>12운성 <b>${esc(r.stages12.bong[k])}</b></div>
        <div>${sals.map((x) => `<span class="sal">${esc(x)}</span>`).join("")}</div>
      </div>
    </div>`;
  }).join("");
  $("#unknown-note").hidden = !unknown;

  // relations
  const rels = [];
  if (r.stemRelations.length) rels.push(["천간", r.stemRelations.filter((x) => !(unknown && x.pillars.includes("hour"))).map((x) => `${PILLAR_KO[x.pillars[0]]}·${PILLAR_KO[x.pillars[1]]} ${x.desc}`).join(" · ")]);
  for (const [type, map] of Object.entries(r.branchRelations)) {
    if (type === "지장간") continue;
    const entries = Object.entries(map || {}).filter(([k]) => !(unknown && k === "hour"));
    if (!entries.length) continue;
    const uniq = [...new Set(entries.flatMap(([, v]) => String(v).split(/\s*[,/]\s*/)).filter(Boolean))];
    rels.push([type, uniq.join(" · ")]);
  }
  const relsF = rels.filter(([, v]) => v);
  $("#relations").innerHTML = `<h3>글자 사이의 관계 (합·충·형·파·해)</h3>` + (relsF.length
    ? relsF.map(([t, v]) => `<div class="rel"><b>${esc(t)}</b><span>${esc(v)}</span></div>`).join("") +
      `<p class="hint">합(合)은 서로 끌어당겨 협력하는 관계, 충(衝)은 부딪혀 변화를 만드는 관계입니다. 형·파·해·원진은 갈등과 예민함을 뜻하지만 조심하면 충분히 다스릴 수 있습니다.</p>`
    : `<p class="hint">원국 안에 두드러진 합·충 관계가 없어 기운이 비교적 고요하게 흐르는 구조입니다.</p>`);

  // elements
  const ec = elementCounts(r, unknown);
  const total = Object.values(ec).reduce((a, b) => a + b, 0) || 1;
  const maxC = Math.max(...Object.values(ec), 1);
  $("#elements").innerHTML = EL_ORDER.map((el) => `
    <div class="el-row el-${el}">
      <div class="el-name">${el}<span>${EL_HANJA[el]}</span></div>
      <div class="bar"><i style="width:${(ec[el] / maxC) * 100}%"></i></div>
      <div class="el-count"><b>${ec[el]}</b>개 · ${Math.round((ec[el] / total) * 100)}%</div>
    </div>`).join("");
  let yang = 0, cnt = 0;
  for (const k of PILLARS) {
    if (k === "hour" && unknown) continue;
    const p = r.pillarDetails[k];
    yang += (p.yinYang.stem === "양") + (p.yinYang.branch === "양"); cnt += 2;
  }
  const yangPct = Math.round((yang / cnt) * 100);
  $("#yinyang").innerHTML = `<p class="hint" style="margin:0 0 8px">음양의 비율</p>
    <div class="yy-bar"><span class="yy-yang" style="width:${Math.max(yangPct, 12)}%">양 ${yang}</span><span class="yy-yin" style="width:${Math.max(100 - yangPct, 12)}%">음 ${cnt - yang}</span></div>
    <p class="hint">${yangPct >= 70 ? "양의 기운이 강해 활동적이고 외향적입니다. 차분히 돌아보는 시간이 균형을 잡아줍니다." : yangPct <= 30 ? "음의 기운이 강해 신중하고 내면이 깊습니다. 몸을 움직이고 표현하는 일이 균형을 잡아줍니다." : "음과 양이 고르게 섞여 상황에 따라 나서고 물러설 줄 압니다."}</p>`;

  const many = EL_ORDER.filter((e) => ec[e] >= 3), few = EL_ORDER.filter((e) => ec[e] === 0);
  const strongest = EL_ORDER.reduce((a, b) => (ec[b] > ec[a] ? b : a));
  const cards = [];
  cards.push(`<div class="el-card el-${strongest}"><h4>가장 강한 기운 · ${strongest}(${EL_HANJA[strongest]})<span>${esc(ELEMENT_INFO[strongest].nature)}</span></h4><p>${esc(ELEMENT_INFO[strongest].many.split(".")[0])}. 이 기운이 당신의 색깔을 만듭니다.</p></div>`);
  for (const e of many.filter((x) => x !== strongest)) cards.push(`<div class="el-card el-${e}"><h4>넘치는 기운 · ${e}(${EL_HANJA[e]})<span>${ec[e]}개</span></h4><p>${esc(ELEMENT_INFO[e].many)}</p></div>`);
  if (ec[strongest] >= 3) cards[0] = `<div class="el-card el-${strongest}"><h4>넘치는 기운 · ${strongest}(${EL_HANJA[strongest]})<span>${ec[strongest]}개</span></h4><p>${esc(ELEMENT_INFO[strongest].many)}</p></div>`;
  for (const e of few) cards.push(`<div class="el-card el-${e}"><h4>부족한 기운 · ${e}(${EL_HANJA[e]})<span>0개</span></h4><p>${esc(ELEMENT_INFO[e].few)}</p></div>`);
  if (!few.length && !many.length) cards.push(`<div class="el-card el-토"><h4>고르게 갖춘 오행</h4><p>다섯 기운이 비교적 고르게 분포해 어느 한쪽으로 치우치지 않습니다. 상황 적응력이 좋은 균형형 사주입니다.</p></div>`);
  $("#element-read").innerHTML = cards.join("");

  // day master
  const D = DAY_MASTER[dm];
  $("#daymaster").innerHTML = `
    <div class="dm-hero el-${dmD.element.stem}">
      ${glyph(dm, dmD.element.stem, dmD.stemKo)}
      <h3>${esc(dmD.stemKo)}${esc(dmD.element.stem)} · ${esc(D.image)}</h3>
      <p class="kw">${esc(dmD.yinYang.stem)}의 ${esc(dmD.element.stem)} — ${esc(D.keyword)}</p>
    </div>
    <div class="dm-body">
      <p class="lead">${esc(D.summary)}</p>
      <div class="dm-grid">
        <div class="dm-item"><h4>강점</h4><p>${esc(D.strength)}</p></div>
        <div class="dm-item"><h4>주의할 점</h4><p>${esc(D.weakness)}</p></div>
        <div class="dm-item"><h4>어울리는 분야</h4><p>${esc(D.career)}</p></div>
        <div class="dm-item"><h4>연애 · 관계</h4><p>${esc(D.love)}</p></div>
        <div class="dm-item"><h4>일지 ${esc(dmD.branch)}(${esc(dmD.branchKo)}) · 배우자 자리</h4><p>배우자 자리에 ${I(esc(r.tenGods.day.branch))} 있습니다. ${esc(TEN_GODS[r.tenGods.day.branch]?.short || "")}의 성향이 가까운 관계와 내면에서 드러납니다.</p></div>
        <div class="dm-item"><h4>신강 · 신약</h4><p>${strengthKo === "신강" ? "일간의 힘이 강해 주관이 뚜렷하고 밀어붙이는 힘이 있습니다. 힘을 밖으로 써줄 때 운이 열립니다." : strengthKo === "신약" ? "일간의 힘이 약한 편이라 섬세하고 협력에 강합니다. 나를 도와주는 사람과 환경을 곁에 두면 운이 열립니다." : "일간의 힘이 균형 잡혀 있어 상황에 따라 유연하게 대처합니다."}</p></div>
      </div>
      <p class="dm-advice">${esc(D.advice)}</p>
    </div>`;

  // ten gods
  const tc = tenGodCounts(r, unknown);
  const groups = {};
  for (const [k, v] of Object.entries(TEN_GODS)) (groups[v.group] ||= []).push(k);
  $("#tengod-groups").innerHTML = Object.entries(groups).map(([g, list]) => {
    const G = TEN_GOD_GROUPS[g], n = list.reduce((a, k) => a + tc[k], 0);
    return `<div class="tg-row el-${G.color}">
      <div class="nm">${esc(G.name)}<small>${esc(G.theme)}</small></div>
      <div class="tg-chips">${list.map((k) => `<span class="tg-chip ${tc[k] ? "" : "zero"}">${k} ${tc[k]}</span>`).join("")}</div>
      <div class="ct">${n}</div>
    </div>`;
  }).join("");
  const sorted = Object.entries(tc).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const lackGroups = Object.entries(groups).filter(([, list]) => list.every((k) => !tc[k]));
  $("#tengod-read").innerHTML =
    sorted.slice(0, 3).map(([k, v]) => `<div class="tg-card"><h4>${k}<small>${v}개 · ${esc(TEN_GODS[k].short)}</small></h4><p>${esc(TEN_GODS[k].desc)}</p></div>`).join("") +
    lackGroups.map(([g]) => `<div class="tg-card lack"><h4>${esc(TEN_GOD_GROUPS[g].name)} 없음<small>${esc(TEN_GOD_GROUPS[g].theme)}</small></h4><p>원국에 ${esc(TEN_GOD_GROUPS[g].theme.split(" · ")[0])}의 별이 없습니다. 이 기운이 들어오는 대운·세운에 관련된 일이 활발해지고, 평소에는 의식적으로 채워주면 좋습니다.</p></div>`).join("");

  // sals
  const salMap = new Map();
  const addSal = (n, where) => { if (!n) return; const k = n; if (!salMap.has(k)) salMap.set(k, new Set()); if (where) salMap.get(k).add(where); };
  for (const k of PILLARS) {
    if (k === "hour" && unknown) continue;
    addSal(r.sals[k].twelveSal, PILLAR_KO[k]);
    for (const x of r.sals[k].specialSals || []) addSal(x, PILLAR_KO[k]);
  }
  for (const x of r.advanced.sinsal.gilsin) addSal(x);
  for (const x of r.advanced.sinsal.hyungsin) addSal(x);
  const order = { good: 0, neutral: 1, bad: 2 };
  const salItems = [...salMap.entries()].map(([n, w]) => ({ n, w: [...w], info: SALS[n] || { type: "neutral", desc: "보조적인 신살입니다." } }))
    .sort((a, b) => order[a.info.type] - order[b.info.type]);
  $("#sals").innerHTML = salItems.map(({ n, w, info }) => `
    <div class="sal ${info.type}">
      <div class="sal-dot">${info.type === "good" ? "吉" : info.type === "bad" ? "凶" : "中"}</div>
      <div><h4>${esc(n)}${w.length ? `<small>${esc(w.join(" · "))}</small>` : ""}</h4><p>${esc(info.desc)}</p></div>
    </div>`).join("") || `<p class="hint">특별한 신살이 없습니다.</p>`;
  $("#stages").innerHTML = `<h3>12운성 · 각 기둥에서 나의 힘</h3>` + PILLARS.filter((k) => !(k === "hour" && unknown)).map((k) => {
    const st = r.stages12.bong[k];
    return `<div class="stage"><span class="pos">${PILLAR_KO[k]}</span><b>${esc(st)}</b><span>${esc(STAGES12[st] || "")}</span></div>`;
  }).join("");

  // yongsin & lucky
  const score = Math.max(0, Math.min(100, r.advanced.dayStrength.score));
  const geukText = (r.advanced.interpretation || "").split("\n")[0];
  $("#yongsin").innerHTML = `
    <div class="panel ys-summary">
      <h3>${esc(r.advanced.geukguk)} · ${esc(strengthKo)}</h3>
      <p>${esc(geukText)}</p>
      <div class="strength-meter"><i style="left:${score}%"></i></div>
      <div class="meter-labels"><span>신약</span><span>중화 (${score}점)</span><span>신강</span></div>
      <p class="hint">용신(用神)은 사주의 균형을 맞추는 데 가장 필요한 기운입니다. 이 사주의 용신 글자: <b>${esc((r.advanced.yongsin || []).join(", ") || "-")}</b></p>
    </div>
    <div>
      ${useful.map((e) => {
        const I = ELEMENT_INFO[e];
        return `<div class="panel" style="margin-bottom:12px">
          <div class="lucky-head">${glyph(EL_HANJA[e], e)}<div><h3 style="font-size:1.05rem">${e}(${EL_HANJA[e]})의 기운으로 개운하기</h3><p class="hint" style="margin:0">${esc(I.nature)}</p></div></div>
          <div class="lucky-grid el-${e}">
            <div class="lucky"><div class="k">행운의 색</div><div class="v">${esc(I.color)}</div></div>
            <div class="lucky"><div class="k">좋은 방향</div><div class="v">${esc(I.direction)}</div></div>
            <div class="lucky"><div class="k">행운의 숫자</div><div class="v">${esc(I.number)}</div></div>
            <div class="lucky"><div class="k">기운이 강한 계절</div><div class="v">${esc(I.season)}</div></div>
            <div class="lucky"><div class="k">도움 되는 맛</div><div class="v">${esc(I.taste)}</div></div>
            <div class="lucky"><div class="k">챙길 건강</div><div class="v">${esc(I.body)}</div></div>
          </div>
        </div>`;
      }).join("") || `<div class="panel"><p>용신을 특정하기 어려운 균형형 사주입니다.</p></div>`}
    </div>`;

  // daeun
  const d = r.daeun;
  $("#daeun-note").textContent = `${d.basis.direction === "forward" ? "순행(順行)" : "역행(逆行)"} 대운 · ${d.startAge}세부터 시작해 10년마다 바뀝니다. 대운은 인생이라는 길의 '계절'과 같습니다.`;
  if (d.current) {
    const c = d.current, L = LUCK_BY_TEN_GOD[c.stemTenGod];
    const lr = readLuck(r, c.ganzhi, useful);
    $("#daeun-now").hidden = false;
    $("#daeun-now").innerHTML = `
      <div class="gz-big">${gzGlyphs(c.ganzhi)}</div>
      <div>
        <p class="hint" style="margin:0">지금의 대운 · ${c.startAge}~${c.endAge ?? c.startAge + 9}세 (${c.startYear}년~)</p>
        <h3>${esc(L?.title || "")}<small>${esc(c.stemTenGod)} · ${esc(c.branchTenGod)} 대운</small></h3>
        <p>${esc(L?.text || "")} 바탕에는 ${esc(c.branchTenGod)}의 기운(${esc(TEN_GODS[c.branchTenGod]?.short || "")})이 깔려 있습니다.</p>
        ${lr.notes.length ? `<p class="hint">${esc(lr.notes.join(" "))}</p>` : ""}
      </div>`;
  } else {
    $("#daeun-now").hidden = false;
    $("#daeun-now").innerHTML = `<div></div><div><h3>아직 첫 대운 전입니다</h3><p>${d.startAge}세에 첫 대운이 시작됩니다. 그 전까지는 월주의 기운이 삶을 이끕니다.</p></div>`;
  }
  $("#daeun").innerHTML = d.list.map((it) => cell(`${it.startAge}세`, it.ganzhi, `${it.stemTenGod}<br>${it.branchTenGod}`, d.current && d.current.startAge === it.startAge, `${it.startYear}~`)).join("");

  // year
  const yearCard = (label, sy) => {
    if (!sy) return "";
    const lr = readLuck(r, sy.ganzhi, useful);
    const L = LUCK_BY_TEN_GOD[lr.tgS];
    const zz = ZODIAC[lr.branch];
    return `<div class="luck-card">
      <div class="lc-head"><div class="gz-big">${gzGlyphs(sy.ganzhi)}</div>
        <div><div class="label">${label} · ${sy.year}년 ${COLOR_PREFIX[STEM_EL[lr.stem]]} ${zz.name}의 해</div><h3>${esc(L.title)}</h3>${stars(lr.score)}</div></div>
      <p>${esc(L.text)}</p>
      <ul class="notes"><li>천간 ${esc(lr.tgS)} · 지지 ${esc(lr.tgB)}의 해입니다. ${esc(TEN_GODS[lr.tgB].short)}의 일이 생활 속에서 드러납니다.</li>${lr.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>
    </div>`;
  };
  $("#year-cards").innerHTML = yearCard("올해", r.seyun.find((x) => x.year === r.currentYear)) + yearCard("내년", r.seyun.find((x) => x.year === r.currentYear + 1));
  $("#seyun").innerHTML = r.seyun.map((it) => cell(`${it.year}`, it.ganzhi, `${it.tenGodStem}<br>${it.tenGodBranch}`, it.year === r.currentYear)).join("");
  const tm = r.reference?.codes?.thisMonth;
  $("#wolun").innerHTML = r.wolun.map((it) => cell(it.monthName || `${it.month}월`, it.ganzhi, `${it.stemTenGod}<br>${it.branchTenGod}`, tm && it.ganzhi === tm)).join("");

  // today
  const dayCard = (label, gz, dateObj) => {
    if (!gz) return "";
    const lr = readLuck(r, gz, useful);
    const L = LUCK_BY_TEN_GOD[lr.tgS];
    const luckyEl = useful[0] || EL_ORDER[(EL_ORDER.indexOf(dmD.element.stem) + 4) % 5];
    const I = ELEMENT_INFO[luckyEl];
    const ds = `${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일`;
    return `<div class="luck-card">
      <div class="lc-head"><div class="gz-big">${gzGlyphs(gz)}</div>
        <div><div class="label">${label} · ${ds} (${esc(STEM_KO[lr.stem] + BRANCH_KO[lr.branch])}일)</div><h3>${esc(lr.tgS)}의 날</h3>${stars(lr.score)}</div></div>
      <p>${esc(L.today)}</p>
      <ul class="notes">${lr.notes.map((n) => `<li>${esc(n)}</li>`).join("")}<li>행운의 색 ${esc(I.color.split("·")[0])}, 행운의 방향 ${esc(I.direction)}, 행운의 숫자 ${esc(I.number)}</li></ul>
    </div>`;
  };
  const now = new Date(), tmr = new Date(Date.now() + 864e5);
  $("#today-cards").innerHTML = dayCard("오늘", r.reference?.codes?.today, now) + dayCard("내일", r.reference?.codes?.tomorrow, tmr);

  // scroll flows to "now"
  for (const id of ["#daeun", "#seyun", "#wolun"]) {
    const n = $(`${id} .now`);
    if (n) n.parentElement.scrollLeft = n.offsetLeft - n.parentElement.offsetLeft - 12;
  }
  showText($(".tab.active").dataset.fmt);
}

function cell(top, gz, gods, isNow, bottom = "") {
  return `<div class="cell ${isNow ? "now" : ""}">
    <div class="top">${esc(top)}</div>
    <div class="gz">${gzGlyphs(gz)}</div>
    <div class="god">${gods}</div>
    ${bottom ? `<div class="top">${esc(bottom)}</div>` : ""}
  </div>`;
}

// ---------- render: gunghap ----------
function renderGunghap(ra, pa, rb, pb) {
  const A = ra.pillarDetails, B = rb.pillarDetails;
  const na = pa.name || "첫 번째 사람", nb = pb.name || "두 번째 사람";
  const items = [];

  // 1. 일간 — 마음의 궁합
  {
    const a = A.day.stem, b = B.day.stem, ea = STEM_EL[a], eb = STEM_EL[b];
    let pt, text;
    if (STEM_HAP[a] === b) { pt = 20; text = `${a}${b} 천간합입니다. 서로에게 자연스럽게 끌리고 마음이 잘 묶이는, 궁합에서 가장 반가운 조합입니다.`; }
    else {
      const rel = elRelation(ea, eb);
      if (rel === "같은") { pt = 8; text = `두 사람 모두 ${ea}의 일간입니다. 친구처럼 통하고 가치관이 비슷하지만, 같은 고집이 부딪힐 때는 한 걸음 양보가 필요합니다.`; }
      else if (rel === "생하는") { pt = 12; text = `${na}의 ${I(ea)} ${nb}의 ${R(eb)} 생(生)해줍니다. ${I(na)} 아낌없이 주고 ${I(nb)} 힘을 얻는 상생 관계입니다.`; }
      else if (rel === "생받는") { pt = 12; text = `${nb}의 ${I(eb)} ${na}의 ${R(ea)} 생(生)해줍니다. ${I(nb)} 든든한 지원군이 되어주는 상생 관계입니다.`; }
      else if (rel === "극하는") { pt = -4; text = `${na}의 ${I(ea)} ${nb}의 ${R(eb)} 극(剋)합니다. ${I(na)} 주도권을 쥐기 쉬워, 상대를 바꾸려 하기보다 존중하는 태도가 중요합니다.`; }
      else { pt = -4; text = `${nb}의 ${I(eb)} ${na}의 ${R(ea)} 극(剋)합니다. ${nb}의 말이 때로 압박으로 느껴질 수 있으니 부드러운 표현이 관계를 지켜줍니다.`; }
    }
    items.push({ title: "마음의 궁합 · 일간", pt, text });
  }
  // 2. 일지 — 생활·배우자 궁합
  {
    const rel = branchRelation(A.day.branch, B.day.branch);
    const map = { 육합: [15, "일지가 육합을 이룹니다. 함께 사는 생활 리듬과 정서가 잘 맞아 편안한 관계가 됩니다."], 삼합: [10, "일지가 삼합의 기운으로 이어져, 같은 목표를 향해 힘을 모으기 좋습니다."], 충: [-12, "일지가 충(衝)입니다. 생활 방식과 감정 표현이 달라 부딪히기 쉬우나, 서로의 공간을 존중하면 오히려 자극이 되는 관계입니다."], 원진: [-6, "일지가 원진입니다. 이유 없이 서운한 순간이 생길 수 있어, 작은 오해를 바로바로 푸는 대화가 필요합니다."], "같은 지지": [4, "일지가 같아 생활 습관과 취향이 닮았습니다."] };
    const [pt, text] = map[rel.kind] || [0, "일지 사이에 특별한 합·충이 없어 무난한 생활 궁합입니다. 함께 만들어가는 습관이 관계를 결정합니다."];
    items.push({ title: `생활의 궁합 · 일지 ${A.day.branch}·${B.day.branch}`, pt, text });
  }
  // 3. 띠
  {
    const ya = A.year.branch, yb = B.year.branch, rel = branchRelation(ya, yb);
    const za = ZODIAC[ya].name, zb = ZODIAC[yb].name;
    const map = { 육합: [8, `${za}띠와 ${zb}띠는 육합으로 서로 잘 어울리는 띠 궁합입니다.`], 삼합: [8, `${za}띠와 ${zb}띠는 삼합으로 손발이 잘 맞는 띠 궁합입니다.`], 충: [-8, `${za}띠와 ${zb}띠는 충(衝) 관계라 집안 분위기나 사회적 성향이 다를 수 있습니다.`], 원진: [-4, `${za}띠와 ${zb}띠는 원진 관계라 사소한 일로 토라지기 쉽습니다.`], "같은 지지": [3, `같은 ${za}띠끼리라 공감대가 큽니다.`] };
    const [pt, text] = map[rel.kind] || [0, `${za}띠와 ${zb}띠는 무난한 띠 궁합입니다.`];
    items.push({ title: "띠 궁합 · 연지", pt, text });
  }
  // 4. 오행 보완
  {
    const ea = elementCounts(ra, pa.unknown), eb = elementCounts(rb, pb.unknown);
    const fillA = EL_ORDER.filter((e) => ea[e] === 0 && eb[e] >= 2), fillB = EL_ORDER.filter((e) => eb[e] === 0 && ea[e] >= 2);
    const pt = Math.min(12, (fillA.length + fillB.length) * 4);
    const parts = [];
    if (fillA.length) parts.push(`${na}에게 없는 ${R(fillA.join("·"))} ${I(nb)} 채워줍니다.`);
    if (fillB.length) parts.push(`${nb}에게 없는 ${R(fillB.join("·"))} ${I(na)} 채워줍니다.`);
    items.push({ title: "오행의 보완", pt, text: parts.join(" ") || "서로의 부족한 오행을 직접 채워주는 구조는 아니지만, 각자의 강점을 나눠 쓰면 균형을 만들 수 있습니다." });
  }
  // 5. 용신 보완
  {
    const ua = yongsinElements(ra), ub = yongsinElements(rb);
    const ea = elementCounts(ra, pa.unknown), eb = elementCounts(rb, pb.unknown);
    const topA = EL_ORDER.reduce((x, y) => (ea[y] > ea[x] ? y : x)), topB = EL_ORDER.reduce((x, y) => (eb[y] > eb[x] ? y : x));
    let pt = 0; const parts = [];
    if (ua.includes(topB)) { pt += 6; parts.push(`${nb}의 강한 ${topB} 기운이 ${na}에게 꼭 필요한 용신입니다.`); }
    if (ub.includes(topA)) { pt += 6; parts.push(`${na}의 강한 ${topA} 기운이 ${nb}에게 꼭 필요한 용신입니다.`); }
    items.push({ title: "서로에게 필요한 사람 · 용신", pt, text: parts.join(" ") || "서로의 용신을 직접 채워주는 관계는 아니어서, 각자의 자리에서 독립적으로 빛나는 관계입니다." });
  }

  const score = Math.max(35, Math.min(99, 60 + items.reduce((a, b) => a + b.pt, 0)));
  const verdict = score >= 90 ? "천생연분" : score >= 80 ? "아주 좋은 인연" : score >= 70 ? "좋은 궁합" : score >= 60 ? "노력하면 빛나는 궁합" : "서로 다름을 배우는 인연";
  const advice = score >= 80
    ? "기본 궁합이 좋은 만큼 편안함에 익숙해져 표현을 소홀히 하지 않는 것이 관건입니다. 고마움을 자주 말로 전하세요."
    : score >= 65
      ? "잘 맞는 부분과 다른 부분이 공존하는 현실적인 궁합입니다. 다른 점을 '틀림'이 아닌 '보완'으로 받아들이면 단단한 관계가 됩니다."
      : "성향 차이가 큰 만큼 서로에게서 배울 것이 많은 인연입니다. 감정이 격해질 때 잠시 멈추는 규칙을 함께 정해두면 좋습니다.";

  const mini = (P, unknown) => `<div class="mini">${PILLARS.map((k) => (k === "hour" && unknown)
    ? `<div class="col"><div class="glyph empty">?</div><div class="glyph empty">?</div></div>`
    : `<div class="col ${k === "day" ? "is-day" : ""}">${glyph(P[k].stem, P[k].element.stem)}${glyph(P[k].branch, P[k].element.branch)}</div>`).join("")}</div>`;
  const za = ZODIAC[A.year.branch], zb = ZODIAC[B.year.branch];

  $("#gh-body").innerHTML = `
    <div class="panel gh-top">
      <div class="gh-person"><div class="name">${za.emoji} ${esc(na)}</div>${mini(A, pa.unknown)}<div class="sub">${esc(A.day.stem + A.day.stemKo)} 일간 · ${esc(DAY_MASTER[A.day.stem].image)} · ${za.name}띠</div></div>
      <div class="gh-score">
        <div class="score-ring" style="--p:${score}"><div><div><b>${score}</b><small>점</small></div></div></div>
        <div class="verdict">${esc(verdict)}</div>
      </div>
      <div class="gh-person"><div class="name">${zb.emoji} ${esc(nb)}</div>${mini(B, pb.unknown)}<div class="sub">${esc(B.day.stem + B.day.stemKo)} 일간 · ${esc(DAY_MASTER[B.day.stem].image)} · ${zb.name}띠</div></div>
    </div>
    <div class="gh-items">
      ${items.map((it) => `<div class="gh-item"><h4>${esc(it.title)}<span class="pt ${it.pt > 0 ? "plus" : it.pt < 0 ? "minus" : "zero"}">${it.pt > 0 ? "+" : ""}${it.pt}</span></h4><p>${esc(it.text)}</p></div>`).join("")}
      <div class="gh-item"><h4>두 사람의 이미지</h4><p>${W(esc(DAY_MASTER[A.day.stem].image))} ${esc(DAY_MASTER[B.day.stem].image)}의 만남입니다. ${N(esc(na))} '${esc(DAY_MASTER[A.day.stem].keyword)}', ${N(esc(nb))} '${esc(DAY_MASTER[B.day.stem].keyword)}'의 사람입니다.</p></div>
    </div>
    <div class="panel callout gh-advice"><div class="seal" style="width:48px;height:48px;font-size:1.4rem">合</div><div><h3>관계를 위한 한마디</h3><p>${esc(advice)}</p></div></div>
    <p class="hint">궁합 점수는 일간·일지·띠·오행·용신의 관계를 바탕으로 한 참고 지표입니다. 실제 관계는 두 사람의 노력과 대화가 만들어갑니다.</p>`;
}

// ---------- text export / print ----------
function showText(fmt) {
  if (!current) return;
  $("#text").textContent = fmt === "markdown" ? current.toMarkdown() : current.toCompact();
}
$$(".tab").forEach((b) => b.addEventListener("click", () => {
  $$(".tab").forEach((x) => x.classList.toggle("active", x === b));
  showText(b.dataset.fmt);
}));
$("#copy").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText($("#text").textContent); $("#copy").textContent = "복사됨 ✓"; }
  catch { $("#copy").textContent = "복사 실패"; }
  setTimeout(() => ($("#copy").textContent = "복사"), 1500);
});
$("#print").addEventListener("click", () => window.print());
