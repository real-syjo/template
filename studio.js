
  
/* ===== 단계/노드 ===== */
const steps = [
  { name:"데이터 선택",    nodes:["XLP","XLE","XLI","XLF"] },
  { name:"전처리 설정",    nodes:["결측치","스케일","인코딩","파생","샘플링"] },
  { name:"모델 구성",      nodes:["n_estimators","max_depth","max_features","criterion","seed"] },
  { name:"학습/검증 분할", nodes:["train","valid","test","k-fold","shuffle"] },
  { name:"평가/리포트",    nodes:["정확도","AUC","F1","리포트","리프트"] },
];

let currentStep = 0;
let donutData   = [];                  // 도넛 세그먼트(칩 진행도만 반영)
let legendData  = [];                  // 추천DATA 칩 상태
const blockStates = Array(steps.length).fill("empty");

/* ===== 엘리먼트 ===== */
const wrap     = document.getElementById('stage');
const gaugeEl  = document.getElementById('gauge');
const stepTitle= document.getElementById('stepTitle');
const segGroup = document.getElementById('segments');
const centerMain = document.getElementById('centerMain');
const imgPane  = document.getElementById('resultImage');
const wrapEl   = document.querySelector('.your-panel .wrap');
const btn      = document.getElementById('directBtn');



/* ===== 오버레이 토글(직접 선택) ===== */
if (btn && wrapEl && imgPane) {
  btn.addEventListener('click', ()=>{
    const goingOut = !wrapEl.classList.contains('is-out');
    if (goingOut) {
      imgPane.classList.remove('show');
      wrapEl.classList.add('is-out');
      wrapEl.addEventListener('transitionend', ()=> imgPane.classList.add('show'), { once:true });
    } else {
      imgPane.classList.remove('show');
      requestAnimationFrame(()=> wrapEl.classList.remove('is-out'));
    }
  });
}

// ▼ 추가: 버튼 표시/숨김 토글
function updateDirectBtnVisibility() {
  const hasActiveFirst = !!document.querySelector('.gblock.active[data-index="0"]');
  if (btn) btn.style.display = hasActiveFirst ? '' : 'none'; // 없으면 숨김
}


function renderGauge(){
  gaugeEl.innerHTML = '';
  steps.forEach((s,i)=>{
    const state = blockStates[i];
    const div = document.createElement('div');
    div.className =
      'gblock' +
      (i===currentStep ? ' active' : '') +
      (state==='empty'  ? ' empty'  : '') +
      (state==='partial'? ' partial': '') +
      (state==='done'   ? ' done'   : '');
    div.dataset.index = i;
    div.setAttribute('data-label', `${i+1}단계 · ${s.name}`);
    gaugeEl.appendChild(div);
  });
  updateDirectBtnVisibility();
}

gaugeEl.addEventListener('click', (e)=>{
  const blk = e.target.closest('.gblock');
  if(!blk) return;
  selectBlock(+blk.dataset.index);
});

function selectBlock(i){
  currentStep = i;
  blockStates[i] = 'empty';
  initDonutForStep(i);
  renderGauge();   // ← 여기서 active 클래스 다시 붙음
  showPage(i);     // ← 해당 step 화면 보여주기
}
window.selectBlock = selectBlock;  // 전역 노출 (외부에서도 호출 가능하게)


/* ===== 도넛 ===== */
const cfg = {
  cx:120, cy:120, r:84, width:24, gapDeg:4,
  colorOn:getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),
  colorOff:getComputedStyle(document.documentElement).getPropertyValue('--base').trim()
};
const toRad = d => (Math.PI/180)*d;
const polar = (cx,cy,r,a)=>({ x: cx + r*Math.cos(toRad(a)), y: cy + r*Math.sin(toRad(a)) });
function arcPath(cx,cy,r,start,end){
  const s=polar(cx,cy,r,start), e=polar(cx,cy,r,end);
  const large = ((end-start)%360) > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

function initDonutForStep(stepIdx){
  // 칩 텍스트 초기화(고정)
  legendData = steps[stepIdx].nodes.map(n => ({ label:n, value:1, selected:false }));
  updateDonutProgressFromChips(); // 도넛 = 칩 진행도만 반영
}

function updateDonutProgressFromChips(){
  const chipTotal = Math.max(legendData.length, 1);
  const chipDone  = legendData.filter(d => d.selected).length;
  donutData = Array.from({length: chipTotal}, (_, i) => ({
    label:'', value:1, selected: i < chipDone
  }));
 
}



// 중앙 표시는 '칩'만, 상단 게이지 색상은 도넛 진행도 기준
function applyStateToCurrentBlock(){
  const chipDone  = legendData.filter(d => d.selected).length;
  const chipTotal = legendData.length;
  centerMain.textContent = `${chipDone} / ${chipTotal}`;

  const done  = donutData.filter(d => d.selected).length;
  const total = donutData.length;
  blockStates[currentStep] = (done===0)?'empty':(done<total?'partial':'done');
  renderGauge();
}

/* ===== 추천DATA 칩 ===== */
function renderLegend(){
  let legendEl = document.getElementById("legend");
  if (!legendEl) {
    // 추천DATA 영역이 아직 없으면 만들어 줌(안 열어도 동작하도록 안전장치)
    const rc = document.getElementById("recommand");
    if (rc) {
      rc.innerHTML = `
        <div class="collapse">
          <button class="collapse__btn" id="c1-button" aria-expanded="true" aria-controls="c1-panel">
            *추천DATA
          </button>
          <div class="collapse__content open" id="c1-panel" role="region" aria-labelledby="c1-button">
            <div class="legend" id="legend"></div>
            <div class="controls">
              <button id="nextStep2">결정하기</button>
            </div>
          </div>
        </div>`;
      legendEl = document.getElementById("legend");
    } else {
      return; // 추천 영역이 전혀 없다면 일단 종료
    }
  }

  legendEl.innerHTML = '';
  legendData.forEach((d)=>{
    const chip = document.createElement('div');
    chip.className = `chip ${d.selected ? 'active' : ''}`;
    chip.textContent = d.label;
    legendEl.appendChild(chip);
  });

  // 그려진 직후 진행률 1회 갱신
  updateChipProgress();
}

function upgradeAskWrapToCollapse(wrap){
  if (!wrap || wrap.querySelector('.collapse')) return;
  const title = wrap.querySelector('.ask-title')?.textContent?.trim() || '*항목';
  const contentHTML = wrap.querySelector('.ask-content, .ask-opts')?.outerHTML || '';
  const id = makeAskId();
  wrap.innerHTML = `
    <div class="collapse">
      <button class="collapse__btn" aria-expanded="true" aria-controls="${id}">
        <span class="ask-title">${title}</span>
      </button>
      <div class="collapse__content open" id="${id}" role="region">
        ${contentHTML}
      </div>
    </div>`;
}

/* ===== 슬라이드/추천 패널 ===== */
let slideIndex = 1;
let autoTimer = setInterval(() => plusSlides(1), 3000);
let recommandInserted = false;
function plusSlides(n){ showSlides(slideIndex += n); }
function currentSlide(n){ showSlides(slideIndex = n); }
function showSlides(n){
  const slides = document.getElementsByClassName("slide");
  const dots   = document.getElementsByClassName("dot");
  const total  = slides.length;
  if (n < 1) n = 1;
  if (n > total) n = total;
  slideIndex = n;
  for (let s of slides) s.style.display="none";
  for (let d of dots) d.classList.remove("active");
  slides[slideIndex-1].style.display="block";
  if (dots.length>=slideIndex) dots[slideIndex-1].classList.add("active");
  document.querySelector(".prev").style.visibility = (slideIndex===1?"hidden":"visible");
  document.querySelector(".next").style.visibility = (slideIndex===total?"hidden":"visible");
  if (slideIndex===total && autoTimer){ clearInterval(autoTimer); autoTimer=null; }

  if (!recommandInserted && slideIndex === total) {
    const rc = document.getElementById("recommand");
    if (rc) {
      rc.innerHTML = `
        <div class="collapse">
          <button class="collapse__btn" id="c1-button" aria-expanded="false" aria-controls="c1-panel">
            *추천DATA
          </button>
          <div class="collapse__content" id="c1-panel" role="region" aria-labelledby="c1-button">
            <div class="legend" id="legend"></div>
            <div class="controls">
              <button id="nextStep2">결정하기</button>
            </div>
          </div>
        </div>`;
      renderLegend();
      // 버튼: 칩만 반영

      recommandInserted = true;
    }
  }
}
showSlides(slideIndex);

/* ===== dataTicker 클릭 → 선택 박스 표시 ===== */
const dataTickerEl = document.getElementById('dataTicker');
if (dataTickerEl) {
  dataTickerEl.addEventListener('click', (e) => {
    e.stopPropagation();
    imgPane.classList.remove('show');
    document.body.classList.remove('overlay-open');

    if (wrapEl && wrapEl.classList.contains('is-out')) {
      wrapEl.addEventListener('transitionend', () => { buildSelectBoxes(); }, { once: true });
      wrapEl.classList.remove('is-out');
    } else {
      buildSelectBoxes();
    }
  });
}

/* ===== selectDataGroup(kw-sheet/sel-box) ===== */
document.getElementById('selectDataGroup')?.addEventListener('click', (e)=>{
  const root = e.currentTarget;

  // 0) kw-chip 토글(가장 먼저 처리)
  const chip = e.target.closest('.kw-chip');
  if (chip && root.contains(chip)) {
    const sheet  = chip.closest('.kw-sheet');
    const boxKey = sheet?.dataset.box;
    const key    = chip.dataset.key;
    if (!boxKey || !key) return;

    const set = selectedKeywords[boxKey];
    const willActivate = !chip.classList.contains('active');
    chip.classList.toggle('active', willActivate);
    if (willActivate) set.add(key); else set.delete(key);

    renderSelectedRow(boxKey);
    updateExcelButton();
    updateChipProgress();
    return;
  }

  // 1) sel-box 클릭: 그룹 확장/축소
  const group = e.target.closest('.sel-group');
  const box   = e.target.closest('.sel-box');
  if (group && box && root.contains(group)
      && !e.target.closest('.mini-close')
      && !e.target.closest('.tag-remove')) {
    const willExpand = !group.classList.contains('expanded');
    root.querySelectorAll('.sel-group.expanded').forEach(x => { if (x!==group) x.classList.remove('expanded'); });
    group.classList.toggle('expanded', willExpand);
    return;
  }

  // 2) 태그 X 삭제
  const rm = e.target.closest('.tag-remove');
  if (rm) {
    e.preventDefault();
    e.stopPropagation();
    const selGroup = rm.closest('.sel-group');
    const boxKey   = rm.dataset.box || selGroup?.getAttribute('data-box');
    const key      = rm.dataset.key;
    if (!boxKey || !key || !selGroup) return;

    selectedKeywords[boxKey]?.delete(key);

    // 시트 칩 active 해제
    const sheet = selGroup.querySelector('.kw-sheet');
    if (sheet) {
      const chipEl = Array.from(sheet.querySelectorAll('.kw-chip'))
        .find(el => (el.dataset.key || '') === key);
      chipEl?.classList.remove('active');
    }

    renderSelectedRow(boxKey);
    updateExcelButton();
    updateChipProgress();
    return;
  }

  // 3) 미니카드 X 삭제
  const x = e.target.closest('.mini-close');
  if (x) {
    const card = x.closest('.mini-card');
    if (card){
      card.classList.add('removing');
      card.addEventListener('animationend', ()=> card.remove(), { once:true });
    }
  }
});

(function attachMiniCloseHandler(){
  const root = document.getElementById('selectDataGroup');
  if (!root) return;

  root.addEventListener('click', function(e){
    const btn = e.target.closest('.mini-close');
    if (!btn || !root.contains(btn)) return;

    // 다른 분기로 전파 차단(확장 토글 등)
    e.preventDefault();
    e.stopPropagation();

    const card = btn.closest('.mini-card');
    if (!card) return;

    // 제거 애니메이션 클래스(있으면 사용, 없어도 fallback로 제거)
    card.classList.add('removing');

    const removeCard = () => {
      card.remove();
      // 카드 제거 후 버튼 활성화 상태 등 갱신 필요시
      if (typeof updateExcelButton === 'function') updateExcelButton();
    };

    // 애니메이션/트랜지션이 있다면 이벤트로, 없으면 즉시 제거
    const cs = getComputedStyle(card);
    const animDur = parseFloat(cs.animationDuration) || 0;
    const transDur = parseFloat(cs.transitionDuration) || 0;

    if (animDur > 0 || transDur > 0) {
      let done = false;
      const onEnd = () => { if (done) return; done = true; removeCard(); };
      card.addEventListener('animationend', onEnd, { once:true });
      card.addEventListener('transitionend', onEnd, { once:true });
      setTimeout(onEnd, 500); // 안전 타임아웃
    } else {
      removeCard();
    }
  }, true); // ← 캡처 단계에서 가장 먼저 잡음
})();

/* ===== Excel 확인 바 ===== */
function ensureExcelBar(){
  let bar = document.getElementById('excelBar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'excelBar';
    bar.className = 'excel-bar';
    bar.innerHTML = '<button id="excelConfirm" class="btn" disabled>Excel 확인</button>';
    document.body.appendChild(bar);
  }
  // 혹시라도 존재하는 중복 .excel-bar 제거
  document.querySelectorAll('.excel-bar').forEach(el => { if (el !== bar) el.remove(); });
}
let freezeExcelBar = false;
function updateExcelButton(){
  ensureExcelBar();
  const bar = document.getElementById('excelBar');
  const btn = document.getElementById('excelConfirm');
  if (!bar || !btn) return;

  if (freezeExcelBar) {
    bar.classList.remove('show');
    btn.disabled = true;
    return;
  }

  const groups = document.querySelectorAll('#selectDataGroup .sel-group[data-box]');
  if (groups.length === 0){
    bar.classList.remove('show');
    btn.disabled = true;
    return;
  }

  // 각 그룹의 selected-row 안에 tag가 최소 1개 이상인지 체크
  const allOk = Array.from(groups).every(g =>
    g.querySelectorAll('.selected-row .tag').length >= 1
  );

  bar.classList.toggle('show', allOk);
  btn.disabled = !allOk;
}

/* ===== 선택 박스 빌드 ===== */
function buildSelectBoxes() {
  const selectGroup = document.getElementById('selectDataGroup');
  if (!selectGroup) return;

  const itemsA = ["SPY","QQQ","BND","VTI"];
  const itemsB = ["KODEX 200","KODEX 코스닥150"];
  const keywordMap = {
    A: ["데이터 기준 일자","시가","장중 최고가","장중 최저가","종가","총수익지수","거래량 기준 회전율"],
    B: ["데이터 기준 일자","시가","장중 최고가","장중 최저가","종가","총수익지수","거래량 기준 회전율"]
  };

  // kw-chip용 툴팁 문구
const KW_TOOLTIPS = {
  // 한글 라벨 버전
  "데이터 기준 일자": "ymd",
  "시가": "po",
  "장중 최고가": "ph",
  "장중 최저가": "pl",
  "종가": "p",
  "총수익지수": "ri",
  "거래량 기준 회전율": "pi",

  // 축약키도 지원 (혹시 다른 화면에서 쓰신다면)
  ymd: "기준 날짜 (YYYY-MM-DD).",
  po: "시가 (Open).",
  ph: "장중 최고가 (High).",
  pl: "장중 최저가 (Low).",
  p:  "종가 (Close).",
  ri: "총수익지수(Return Index).",
  vo: "거래량 기반 회전율."
};

  const cardTpl = (boxKey, title, items) => `
    <div class="sel-group" data-box="${boxKey}">
      <div class="sel-box" data-box="${boxKey}">
        <div class="box-head"><h4>${title}</h4></div>
        <div class="mini-grid">
          ${items.map(v=>`
            <div class="mini-card">
              <button class="mini-close" aria-label="삭제">×</button>
              <span>${v}</span>
            </div>`).join("")}
        </div>
        <div class="selected-row" aria-live="polite"></div>
      </div>
      <div class="kw-sheet" data-box="${boxKey}">
       ${keywordMap[boxKey].map(k=>{
        const tip = (KW_TOOLTIPS[k] || String(k));
        return `<button class="kw-chip" data-key="${k}" data-tip="${tip}" aria-label="${tip}" title="${tip}">${k}</button>`;
      }).join("")}
      </div>
    </div>`;

  selectGroup.innerHTML = `${cardTpl("A","미국ETF", itemsA)}${cardTpl("B","한국ETF", itemsB)}`;
  requestAnimationFrame(()=> selectGroup.classList.add('show'));
  syncSheetChips();
  updateExcelButton();
  updateChipProgress();
}

/* ===== KW 상태 ===== */
const selectedKeywords = { A:new Set(), B:new Set() };

function renderSelectedRow(boxKey){
  const group = document.getElementById('selectDataGroup');
  const selGroup = group?.querySelector(`.sel-group[data-box="${boxKey}"]`);
  if (!selGroup) return;
  const row = selGroup.querySelector('.selected-row');
  const tags = Array.from(selectedKeywords[boxKey]).map(k => `
    <span class="tag" data-key="${k}">
      ${k}
      <button class="tag-remove" aria-label="${k} 제거" data-key="${k}" data-box="${boxKey}">×</button>
    </span>
  `);
  row.innerHTML = tags.join('');
}

function syncSheetChips(){
  const group = document.getElementById('selectDataGroup');
  ['A','B'].forEach(k=>{
    const set = selectedKeywords[k];
    group?.querySelectorAll(`.kw-sheet[data-box="${k}"] .kw-chip`).forEach(ch=>{
      ch.classList.toggle('active', set.has(ch.dataset.key));
    });
    renderSelectedRow(k);
  });
}

// 열릴 때: selectDataGroup 내부의 show 전부 제거
document.querySelectorAll('#selectDataGroup.show, #selectDataGroup .show')
  .forEach(el => el.classList.remove('show'));

  
/* ===== [PATCH] 슬라이드 문구 세트 & 유틸 ===== */
if (typeof window.setSlideTexts !== 'function') {
  window.setSlideTexts = function(texts) {
    const slides = document.querySelectorAll('.slideshow-container .slide');
    slides.forEach((el, i) => {
      if (typeof texts[i] !== 'undefined') el.textContent = texts[i];
    });
  };
}
if (typeof window.resetSlidesAutoplayToFirst !== 'function') {
  window.resetSlidesAutoplayToFirst = function() {
    if (typeof currentSlide === 'function') currentSlide(1);
    if (typeof autoTimer !== 'undefined') {
      if (autoTimer) clearInterval(autoTimer);
      autoTimer = setInterval(() => plusSlides(1), 3000);
    }
  };
}

// ✅ 추천DATA 패널이 열렸을 때 보여줄 문구
const SLIDE_TEXTS_COLLAPSE_OPEN = [
  "추천 데이터 패널을 열었습니다.",
  "칩을 눌러 항목을 선택, 제외 할 수 있습니다.",
  "완료되면 ‘결정하기’로 2단계로 이동합니다."
];


/* ===== Collapse ===== */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.collapse__btn');
  if (!btn) return;

  const panelId = btn.getAttribute('aria-controls');
  const panel   = document.getElementById(panelId);
  const wasOpen = btn.getAttribute('aria-expanded') === 'true';
  const willOpen = !wasOpen;

  btn.setAttribute('aria-expanded', String(willOpen));
  panel?.classList.toggle('open', willOpen);

  if (willOpen) {
    // (기존 로직 그대로 유지)
    document.querySelectorAll('#selectDataGroup.show, #selectDataGroup .show')
      .forEach(el => el.classList.remove('show'));
    freezeExcelBar = true;
    const barOpen = document.querySelector('.excel-bar');
    if (barOpen) {
      barOpen.classList.remove('show');
      barOpen.querySelector('#excelConfirm')?.setAttribute('disabled', '');
    }
    legendData.forEach(d => d.selected = true);
    renderLegend();
    updateDonutProgressFromChips();

    // ✅ 추가: 패널 열림 시 슬라이드 문구 변경 + 리셋/자동재생
    if (typeof setSlideTexts === 'function') {
      setSlideTexts(SLIDE_TEXTS_COLLAPSE_OPEN);
      resetSlidesAutoplayToFirst();
    }

  } else {
    // (기존 닫힘 로직 그대로)
    freezeExcelBar = false;
    updateExcelButton();
    const barAfter = document.querySelector('.excel-bar');
    if (barAfter) {
      barAfter.classList.remove('show');
      barAfter.querySelector('#excelConfirm')?.setAttribute('disabled', '');
    }
    legendData.forEach(d => d.selected = false);
    renderLegend();
    updateDonutProgressFromChips();
    blockStates[currentStep] = 'empty';
    document.querySelectorAll('.gblock.active').forEach(el => el.classList.remove('active'));
  }
});





/* ===== 초기 실행 ===== */
renderGauge();
updateDirectBtnVisibility(); 
initDonutForStep(currentStep);


/* ===== 단계별 카드 페이지 전환 ===== */
const pages = Array.from(document.querySelectorAll('.card[data-step]'));

function showPage(stepIdx) {
  pages.forEach(p => p.classList.toggle('active', Number(p.dataset.step) === stepIdx));
}

/* 기존 selectBlock에 한 줄만 추가 */
function selectBlock(i){
  currentStep = i;
  blockStates[i] = 'empty';
  initDonutForStep(i);
  renderGauge();
  showPage(i);            // ← 이 줄 추가!
}

/* 초기 로딩 시 현재 단계 페이지 보이기 */
showPage(currentStep);
/* ===== 공용: 오버레이 열기 (wrapEl을 아래로 밀고, 특정 오버레이 표시) ===== */
function openAltPane(paneEl) {
  if (!paneEl || !wrapEl) return;

  // 1) 열려있던 오버레이 전부 닫기
  document.querySelectorAll('.alt-image.show').forEach(p => p.classList.remove('show'));

  // 2) 보여줄 오버레이 준비 + 이미지 드롭 애니메이션 초기화
  const img = paneEl.querySelector('img');
  if (img) {
    img.classList.remove('drop');     // 리셋
    void img.offsetWidth;             // 리플로우(트랜지션 재생 보장)
  }

  // 3) 패널을 아래로 밀고 → 전환 끝나면 오버레이 표시
  const showPane = () => {
    paneEl.classList.add('show');
    requestAnimationFrame(() => img && img.classList.add('drop')); // 부드러운 드롭 시작
  };

  if (!wrapEl.classList.contains('is-out')) {
    wrapEl.classList.add('is-out');
    wrapEl.addEventListener('transitionend', showPane, { once: true });
  } else {
    showPane();
  }
}

/* ===== directBtn: 기존과 동일 효과로 #resultImage 열기 ===== */
if (btn && wrapEl) {
  btn.addEventListener('click', () => {
    const pane = document.getElementById('resultImage');
    openAltPane(pane);
  });
}

/* ===== excelConfirm: directBtn과 같은 효과지만 #excelImagePane 열기 ===== */
/* excelConfirm은 ensureExcelBar()에서 동적으로 만들어지므로, 문서 전체에 위임 */
document.addEventListener('click', (e) => {
  const exBtn = e.target.closest('#excelConfirm');
  if (!exBtn) return;
  if (exBtn.disabled) return; // 비활성화면 무시

  e.preventDefault();
  const excelPane = document.getElementById('excelImagePane');
  openAltPane(excelPane);
});

/* ▼ 새로 추가: 다음 클릭 한 번 막는 유틸 */
let suppressNextOpen = false;
function swallowNextClick(ms = 350) {
  const handler = (ev) => { ev.stopPropagation(); ev.preventDefault(); };
  // capture 단계에서 모든 클릭 차단
  document.addEventListener('click', handler, true);
  setTimeout(() => document.removeEventListener('click', handler, true), ms);
}

/* ▼ 기존: dataTicker 클릭 핸들러 교체 */
if (dataTickerEl) {
  dataTickerEl.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    // 오버레이 닫기
    imgPane.classList.remove('show');
    wrapEl.classList.remove('is-out');

    // 바로 아래 버튼으로 클릭이 떨어지는 것 방지
    suppressNextOpen = true;
    swallowNextClick(400);            // CSS 전환시간과 맞춰서(예: 0.4s)
    setTimeout(() => { suppressNextOpen = false; }, 400);

    // 필요하다면 닫은 뒤에 로직(예: buildSelectBoxes()) 실행
    // buildSelectBoxes();
  });
}

/* ▼ 기존: directBtn 핸들러 맨 앞에 가드 추가 */
if (btn && wrapEl && imgPane) {
  btn.addEventListener('click', (e) => {
    if (suppressNextOpen) { e.preventDefault(); return; } // 방금 닫은 클릭이면 무시

    const goingOut = !wrapEl.classList.contains('is-out');
    if (goingOut) {
      imgPane.classList.remove('show');
      wrapEl.classList.add('is-out');
      wrapEl.addEventListener('transitionend', () => imgPane.classList.add('show'), { once:true });
    } else {
      imgPane.classList.remove('show');
      requestAnimationFrame(() => wrapEl.classList.remove('is-out'));
    }
  });
}
/* 공용: 오버레이 닫기 (click-through 방지 포함) */
function closeAltPane(paneEl){
  if (!paneEl || !wrapEl) return;
  paneEl.classList.remove('show');
  wrapEl.classList.remove('is-out');

  // 방금 클릭이 아래 버튼들로 떨어져 다시 열리는 것 방지
  suppressNextOpen = true;
  swallowNextClick(400);              // 전환 시간과 맞추세요(예: 0.4s)
  setTimeout(() => { suppressNextOpen = false; }, 400);
}

/* Excel 오버레이 클릭해도 닫히게 */
const excelPaneEl   = document.getElementById('excelImagePane');
const excelTickerEl = document.getElementById('excelTicker');

// 배경(검은 레이어/카드 영역) 클릭 시
if (excelPaneEl) {
  excelPaneEl.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeAltPane(excelPaneEl);
  });
}

// 이미지 자체 클릭 시
if (excelTickerEl) {
  excelTickerEl.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeAltPane(excelPaneEl);
  });
}


// ▼ 추천DATA의 "결정하기" 클릭 → 2단계 페이지로 이동
document.addEventListener('click', (e) => {
  const go = e.target.closest('#nextStep2');
  if (!go) return;
  e.preventDefault();

  // 기존 단계 전환 로직 재사용
  if (typeof selectBlock === 'function') {
    selectBlock(1); // data-step="1" (2단계)
  } else {
    // 혹시 selectBlock이 없으면 직접 처리
    currentStep = 1;
    blockStates[1] = 'empty';
    initDonutForStep(1);
    renderGauge();
    showPage(1);
  }

  // 선택: 추천 패널 닫기(접힘 상태 동기화)
  const panel = document.getElementById('c1-panel');
  const btn   = document.getElementById('c1-button');
  if (panel) panel.classList.remove('open');
  if (btn)   btn.setAttribute('aria-expanded', 'false');
});