
  
/* ===== 단계/노드 ===== */
// const steps = [
//   { name:"전처리 설정",    nodes:["결측치","스케일","인코딩","파생","샘플링"] },
//   { name:"모델 구성",      nodes:["n_estimators","max_depth","max_features","criterion","seed"] },
//   { name:"학습/검증 분할", nodes:["train","valid","test","k-fold","shuffle"] },
//   { name:"평가/리포트",    nodes:["정확도","AUC","F1","리포트","리프트"] },
// ];

let currentStep = 0;
let donutData   = [];                  // 도넛 세그먼트(칩 진행도만 반영)
let legendData  = [];                  // 추천DATA 칩 상태
//const blockStates = Array(steps.length).fill("empty");

/* ===== 엘리먼트 ===== */
const wrap     = document.getElementById('stage');
const gaugeEl  = document.getElementById('gauge');
const stepTitle= document.getElementById('stepTitle');
const segGroup = document.getElementById('segments');
const centerMain = document.getElementById('centerMain');
const imgPane  = document.getElementById('resultImage');
const wrapEl   = document.querySelector('.your-panel .wrap');
const btn      = document.getElementById('directBtn');

//================= IFRAME===================
// function studio1(url) {
//   document.getElementById('studio1').src = "studio1.html"; // 예: '/pages/step2.html'
// }
// studio1('studio1.html');

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


/* ===== 게이지 ===== */
// function renderGauge(){
//   // gaugeEl.innerHTML = '';
//   steps.forEach((s,i)=>{
//     const div = document.createElement('div');
//     div.className = 'gblock'
//       + (i===currentStep ? ' active' : '')
//       + (blockStates[i]==='partial' ? ' partial' : '')
//       + (blockStates[i]==='done' ? ' done' : '');
//     div.dataset.index = i;
//     div.setAttribute('data-label', `${i+1}단계 · ${s.name}`);
//     div.title = `${i+1}단계 · ${s.name}`;
//     gaugeEl.appendChild(div);
//   });

  // ▼ 여기서 버튼 가시성 갱신
//   updateDirectBtnVisibility();
// }

// gaugeEl.addEventListener('click', (e)=>{
//   const blk = e.target.closest('.gblock');
//   if(!blk) return;
//   selectBlock(+blk.dataset.index);
// });
function selectBlock(i){
  currentStep = i;
  blockStates[i] = 'empty';
 // initDonutForStep(i);
 renderGauge();
}

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

// function initDonutForStep(stepIdx){
//   // 칩 텍스트 초기화(고정)
//   legendData = steps[stepIdx].nodes.map(n => ({ label:n, value:1, selected:false }));
//   renderLegend();
//   updateDonutProgressFromChips(); // 도넛 = 칩 진행도만 반영
// }

function updateDonutProgressFromChips(){
  const chipTotal = Math.max(legendData.length, 1);
  const chipDone  = legendData.filter(d => d.selected).length;
  donutData = Array.from({length: chipTotal}, (_, i) => ({
    label:'', value:1, selected: i < chipDone
  }));
  drawDonut();
}

function drawDonut(){
  segGroup.innerHTML = '';
 // stepTitle.textContent = `2단계 · ${steps[currentStep].name}`;

  const total = donutData.length;
  const gaps  = cfg.gapDeg * total;
  let cur = 0;

  donutData.forEach((d)=>{
    const sweep = (d.value/total) * (360 - gaps);
    const start = cur, end = cur + sweep; cur = end + cfg.gapDeg;

    const path = document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d', arcPath(cfg.cx,cfg.cy,cfg.r,start,end));
    path.setAttribute('fill','none');
    path.setAttribute('stroke', d.selected ? cfg.colorOn : cfg.colorOff);
    path.setAttribute('stroke-width', cfg.width);
    path.setAttribute('stroke-linecap','round');
    path.classList.add('seg');
    // 도넛 클릭 반응 제거(칩만 반영)
    // path.addEventListener('click', ()=>{});
    segGroup.appendChild(path);
  });

  applyStateToCurrentBlock();
}

// 중앙 표시는 '칩'만, 상단 게이지 색상은 도넛 진행도 기준
function applyStateToCurrentBlock(){
  const chipDone  = legendData.filter(d => d.selected).length;
  const chipTotal = legendData.length;
  centerMain.textContent = `${chipDone} / ${chipTotal}`;

  const done  = donutData.filter(d => d.selected).length;
  const total = donutData.length;
  //blockStates[currentStep] = (done===0)?'empty':(done<total?'partial':'done');
  //renderGauge();
}

/* ===== 추천DATA 칩 ===== */
function renderLegend(){
  const legendEl = document.getElementById("legend");
  if (!legendEl) return;
  legendEl.innerHTML = '';

  legendData.forEach((d)=>{
    const chip = document.createElement('div');
    chip.className = `chip ${d.selected ? 'active' : ''}`;
    chip.textContent = d.label;
    chip.addEventListener('click', ()=>{
      d.selected = !d.selected;
      chip.classList.toggle('active', d.selected);
      updateDonutProgressFromChips();
    });
    legendEl.appendChild(chip);
  });
}


document.addEventListener('DOMContentLoaded', () => {
  ensureAskFirstIndex();
  enableAskWrapDragSort();
})
/* ===== 슬라이드/추천 패널 ===== */
let slideIndex = 1;
let autoTimer = setInterval(() => plusSlides(1), 3000);
let recommandInserted = false;
let keepChoiceBtn = false; 
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

  const choiceBtn = document.getElementById('choiceBtn');
  if (choiceBtn) {
     const onLast = (slideIndex === total);
    // ▼ 플래그가 켜져 있으면 항상 보이게
    choiceBtn.style.display = (keepChoiceBtn || onLast) ? '' : 'none';
  }

  if (!recommandInserted && slideIndex === total) {
  const rc = document.getElementById("recommand");
  if (rc) {
    rc.innerHTML = `
      <div class="ask-wrap ask-first" data-idx="0">
        <div class="ask-head collapse__btn" aria-expanded="false">
          <span class="ask-title">*결측치 처리</span>
          <label><input type="radio" class="ask-opt" name="ask0-missing" value="all">전체</label>
            <label><input type="radio" class="ask-opt" name="ask0-missing" value="split">구분</label>
          <span class="chev">▾</span>
        </div>
        <div class="collapse__content" role="region">
        여기서 상세 데이터 선택 <br>
        여기서 상세 데이터 선택 <br>
        여기서 상세 데이터 선택 <br>
        여기서 상세 데이터 선택 <br>
          <div class="ask-opts" role="radiogroup" aria-label="결측치 처리 방식">
               
          </div>
        </div>
      </div>
    `;
   ensureAskFirstIndex();
    reindexAskWraps();               // ← 이제 함수가 아래 2번에서 정의됨
    syncLegendToRecommandInputs();// 도넛 초기 동기화
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


/* ===== Collapse ===== */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.collapse__btn');
  if (!btn) return;

  const panelId = btn.getAttribute('aria-controls');
  const panel   = document.getElementById(panelId);
  const willOpen = btn.getAttribute('aria-expanded') !== 'true';

  btn.setAttribute('aria-expanded', String(willOpen));
  panel?.classList.toggle('open', willOpen);

  // ❗여기서는 legendData/도넛을 건드리지 않습니다.
});

// 추천 입력창 상태 → legendData로 재구성 → 도넛 갱신
function syncLegendToRecommandInputs(){
  const rc = document.getElementById('recommand');
  if (!rc) return;

  const groups = Array.from(rc.querySelectorAll('.ask-wrap')).slice(0,5);
  legendData = groups.map(g=>{
    const inp = g.querySelector('.recommend-input');
    return { label:'custom', value:1, selected: !!(inp && inp.value.trim()!=='') };
  });

  updateDonutProgressFromChips();
}

// 체크박스 중 하나라도 체크되면, 아직 입력세트가 없다면 1개 생성
document.addEventListener('change', (e)=>{
  if (!e.target.matches('#recommand')) return;
  const rc = document.getElementById('recommand');
  if (!rc) return;

  // 우선순위: .ask-first → 없으면 첫 번째 .ask-wrap
  const firstWrap = rc.querySelector('.ask-first') || rc.querySelector('.ask-wrap');
  const anyChecked = firstWrap
    ? Array.from(firstWrap.querySelectorAll('.ask-opt')).some(o=>o.checked)
    : false;

  if (anyChecked && !rc.querySelector('.ask-wrap.ask-input')){
    addInputAskWrap();
  }
  syncLegendToRecommandInputs();
});


// 입력창 내용 변하면 도넛 반영
document.addEventListener('input', (e)=>{
  if (e.target.matches('#recommand .recommend-input') ||
      e.target.matches('#recommand .ask-opt')){
    syncLegendToRecommandInputs();
  }
});

// 입력창에서 엔터 → 아래에 새 입력세트 추가(최대 5개)
document.addEventListener('keydown', (e)=>{
  if (e.key !== 'Enter') return;
  if (!e.target.matches('#recommand .recommend-input')) return;
  e.preventDefault();
  addInputAskWrap();
  syncLegendToRecommandInputs();
});


// 모든 추천 input에서 타이핑될 때마다 동기화
document.addEventListener('input', (e) => {
  if (e.target.matches('#recommand .recommend-input, #recommand #c1-input')) {
    syncLegendToRecommandInputs();
  }
});


/* ===== 초기 실행 ===== */
//renderGauge();
updateDirectBtnVisibility(); 
//initDonutForStep(currentStep);


/* ===== 단계별 카드 페이지 전환 ===== */
const pages = Array.from(document.querySelectorAll('.card[data-step]'));

function showPage(stepIdx) {
  pages.forEach(p => p.classList.toggle('active', Number(p.dataset.step) === stepIdx));
}

/* 기존 selectBlock에 한 줄만 추가 */
function selectBlock(i){
  currentStep = i;
  blockStates[i] = 'empty';
  //initDonutForStep(i);
  //renderGauge();
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
    //initDonutForStep(1);
  //  renderGauge();
    showPage(1);
  }

  // 선택: 추천 패널 닫기(접힘 상태 동기화)
  const panel = document.getElementById('c1-panel');
  const btn   = document.getElementById('c1-button');
  if (panel) panel.classList.remove('open');
  if (btn)   btn.setAttribute('aria-expanded', 'false');
});

// collapse 템플릿 생성 함수
function createCollapseHTML() {
  const id = "c-panel-" + Date.now();
  return `
    <div class="collapse">
      <button class="collapse__btn" aria-expanded="true" aria-controls="${id}">
        *추천DATA
      </button>
      <div class="collapse__content open" id="${id}" role="region">
        <input type="text" class="recommend-input"/>
      </div>
    </div>`;
}

// === 슬라이드 문구 풀 ===
const SLIDE_MESSAGES = [
  [
    "결측치 처리란? 데이터에서 비어있는 값을 채워주는 과정입니다.",
    "평균값, 직전값, 보간법 등 다양한 방식으로 대체할 수 있습니다."
  ],
   [
    "결측치 대체란?"
  ],
  [
    "수익률 계산: (오늘가격 - 어제가격) / 어제가격",
    "일간, 월간, 연간 단위로 계산할 수 있습니다."
  ],
  [
    "래깅값 계산: 과거 데이터를 현재의 특징으로 추가하는 과정",
    "예: 1개월 전 수익률 → 현재 예측 변수"
  ],
  [
    "데이터 라벨링: 미래 수익률이 양수면 1, 음수면 0",
    "분류 모델 학습용 타겟을 만드는 과정"
  ],
  [
    "결측치 제거: 값이 없는 행을 삭제",
    "분석의 정확성을 위해 불필요한 행 제거"
  ]
];

let slideMsgIndex = 0;

// === ask-wrap 클릭 시 새 ask-wrap 추가 ===
// ask-wrap 클릭 시 새 ask-wrap 추가 + 도넛 게이지 진행
// === ask-wrap 클릭 시 새 ask-wrap 추가 + 도넛 게이지 진행 ===
// === ask-wrap 클릭 시 새 ask-wrap 추가 ===
document.addEventListener('click', (e) => {
  const wrap = e.target.closest('.ask-wrap');
  if (!wrap) return;

  const rc = document.getElementById("recommand");
  if (!rc) return;

  // 현재 ask-wrap 개수
  let groups = rc.querySelectorAll('.ask-wrap');

  // ask-wrap 추가 (최대 5개)
  if (groups.length < 5) {
      const title = getNextAskTitle();
    const content = getNextPlaceholder();
    const idx = inferIdxFromText(content);
   addAskWrap(title, content, idx);
  }

  // ✅ ask-wrap 개수 기반으로 legendData 갱신
  groups = rc.querySelectorAll('.ask-wrap');
  const count = groups.length;  // 현재 몇 개 있는지
  const total = 5;              // 항상 5 고정

  legendData = Array.from({ length: total }, (_, i) => ({
    label: `chip${i+1}`,
    value: 1,
    selected: i < count
  }));

  // donutData를 legendData 기반으로 다시 만들기
  donutData = legendData.map(d => ({
    label: d.label, value: 1, selected: d.selected
  }));

  drawDonut();
});


// ==== placeholder 문구 풀 ====
const ASK_PLACEHOLDER_POOL = [
  "비어있는 날짜의 가격 데이터를 이전 날 값으로 채웁니다.",
  "1개월(21일) 및 1년(252일) 수익률을 계산하고, ETF의 Total Return Index 열을 사용하여 예측에 필요한 데이터를 준비합니다.",
  "1개월 수익률의 래깅값을 계산하여 미래 수익률 예측에 사용합니다.",
  "1개월 뒤 수익률 상승 여부를 0과 1로 구분하여 라벨링합니다.",
  "데이터 처리 과정에서 발생한 결측치를 모두 제거하여 정확한 분석을 위한 데이터를 준비합니다."
];

// ==== 자동 placeholder 선택 ====
function getNextPlaceholder() {
  const rc = document.getElementById('recommand');
  const existing = rc ? rc.querySelectorAll('.ask-wrap').length : 0;
  const idx = existing - 1;
  return ASK_PLACEHOLDER_POOL[idx] || "추천 데이터를 입력하세요.";
}

// 일반 입력 ask-wrap 추가 (최대 5개 제한)
function addInputAskWrap(){
  const rc = document.getElementById("recommand");
  if (!rc) return;

  const groups = rc.querySelectorAll('.ask-wrap');
  if (groups.length >= 5) return;

  const title = getNextAskTitle();
  const placeholder = getNextPlaceholder();

  rc.insertAdjacentHTML('beforeend', `
    <div class="ask-wrap ask-input">
      <span class="ask-title">${title}</span>
      <p class="ask-content">${placeholder}</p>
    </div>
  `);

  const inp = rc.querySelector('.ask-wrap.ask-input:last-child .recommend-input');
  if (inp) inp.focus();
  syncLegendToRecommandInputs();
}

// ==== ask-title 자동 생성 ====
const ASK_TITLE_POOL = [
  '*결측치 대체',
  '*수익률 계산',
  '*래깅값 계산',
  '*데이터 라벨링',
];

function getNextAskTitle() {
  const rc = document.getElementById('recommand');
  const existing = rc ? rc.querySelectorAll('.ask-wrap').length : 0;
  const idx = existing - 1; // 첫 ask-first 제외
  return ASK_TITLE_POOL[idx] || `*추천DATA 항목 ${existing}`;
}

function enableAskWrapDragSort() {
  const rc = document.getElementById("recommand");
  if (!rc) return;

  // 기존 이벤트 중복 방지
  rc.removeEventListener("dragover", handleDragOver);

  // 컨테이너 dragover 등록
  rc.addEventListener("dragover", handleDragOver);

  // 자식 ask-wrap들에 draggable 속성 붙이기
  rc.querySelectorAll(".ask-wrap").forEach(wrap => {
    wrap.setAttribute("draggable", "true");

    wrap.removeEventListener("dragstart", handleDragStart);
    wrap.removeEventListener("dragend", handleDragEnd);

    wrap.addEventListener("dragstart", handleDragStart);
    wrap.addEventListener("dragend", handleDragEnd);
  });
}

function handleDragStart(e) {
  this.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", ""); // Firefox fix
}

function handleDragEnd() {
  this.classList.remove("dragging");
   ensureAskFirstIndex();
 reindexAskWraps();
}

function handleDragOver(e) {
  e.preventDefault();
  const rc = e.currentTarget;
  const dragging = rc.querySelector(".dragging");
  if (!dragging) return;

  const afterElement = getDragAfterElement(rc, e.clientY);
  if (afterElement == null) {
    rc.appendChild(dragging);
  } else {
    rc.insertBefore(dragging, afterElement);
  }
}

// 마우스 위치 기준으로 끌고 있는 요소가 들어갈 위치 계산
function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll(".ask-wrap:not(.dragging)")];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - (box.top + box.height / 2);

    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function addAskWrap(title, content, idx){
  if (!title || !content) return;
  const rc = document.getElementById("recommand");
  if (!rc) return;

  const wrap = document.createElement("div");
  wrap.className = "ask-wrap";
  if (typeof idx === 'number' && !Number.isNaN(idx)) {
    wrap.setAttribute("data-idx", String(idx));
  }
  wrap.innerHTML = `
    <div class="ask-head collapse__btn" aria-expanded="false">
      <span class="ask-title">${title}</span>
      <div class="ask-content">${content}</div>
      <span class="chev">▾</span>
    </div>
    <div class="collapse__content" role="region">
        test
    </div>
  `;
  rc.appendChild(wrap);

  enableAskWrapDragSort();
  ensureAskFirstIndex();
  reindexAskWraps(); // *순번 유지가 필요하면: 이미 data-idx 있으면 덮어쓰지 않도록 reindex 수정*
}


document.addEventListener("click", (e) => {
const wasVisible = choiceBtn && getComputedStyle(choiceBtn).display !== 'none';
if (wasVisible) keepChoiceBtn = true;

  const wrap = e.target.closest(".ask-wrap");
  if (!wrap) return;

let idx = Number(wrap.getAttribute("data-idx"));
 if (Number.isNaN(idx)) {         // 혹시 누락되어도
   ensureAskFirstIndex();
   reindexAskWraps();             // 즉시 재매김
   idx = Number(wrap.getAttribute("data-idx"));
 }
  const messages = SLIDE_MESSAGES[idx] || ["설명이 준비되어 있지 않습니다."];
  const slideContainer = document.querySelector(".slideshow-container");
  if (!slideContainer) return;

  // dots 래퍼 보장
  let dotsWrap = slideContainer.querySelector(".dots");
  if (!dotsWrap) {
    dotsWrap = document.createElement("div");
    dotsWrap.className = "dots";
    slideContainer.appendChild(dotsWrap);
  }

  // 기존 슬라이드/도트 제거
  slideContainer.querySelectorAll(".slide").forEach(s => s.remove());
  dotsWrap.innerHTML = "";

  // 새 슬라이드 붙이기
  messages.forEach((msg, i) => {
    const div = document.createElement("div");
    div.className = "slide";
    div.textContent = msg;
    if (i !== 0) div.style.display = "none";
    slideContainer.appendChild(div);

    const dot = document.createElement("span");
    dot.className = "dot" + (i === 0 ? " active" : "");
    dot.addEventListener("click", () => showSlides(i+1));
    dotsWrap.appendChild(dot);
  });

  // 네비 버튼이 없을 수도 있으니 안전 가드(선택)
  const prevBtn = document.querySelector(".prev");
  const nextBtn = document.querySelector(".next");
  if (prevBtn && nextBtn) {
    slideIndex = 1;
    showSlides(slideIndex);
  } else {
    // 최소 표시만
    document.getElementsByClassName("slide")[0]?.style && (document.getElementsByClassName("slide")[0].style.display = "block");
  }
});



// 초기 실행 시도
document.addEventListener("DOMContentLoaded", () => {
  enableAskWrapDragSort();
  ensureAskFirstIndex();
  reindexAskWraps();
});

function fitMainToViewport(){
  const main = document.querySelector('.main');
  if (!main) return;
  // .main의 상단부터 창 하단까지 남은 공간을 계산
  const top = main.getBoundingClientRect().top;
  const avail = Math.max(200, window.innerHeight - top); // 최소 200px
  main.style.height = avail + 'px';
  main.style.overflowY = 'auto';
}

// 초기/리사이즈 시 반영
window.addEventListener('load', fitMainToViewport);
window.addEventListener('resize', fitMainToViewport);

// 레이아웃이 변하는 액션 뒤에도 호출
const _openAltPane = openAltPane;
openAltPane = function(paneEl){
  _openAltPane && _openAltPane(paneEl);
  requestAnimationFrame(fitMainToViewport);
};

const _closeAltPane = closeAltPane;
closeAltPane = function(paneEl){
  _closeAltPane && _closeAltPane(paneEl);
  requestAnimationFrame(fitMainToViewport);
};

document.addEventListener('DOMContentLoaded', () => {
  const choiceBtn = document.getElementById('choiceBtn');
  if (choiceBtn) choiceBtn.style.display = 'none';
});


const MODAL_GROUPS = [
  {
    group: "행 삭제",
    items: [
      { key:"row_freq",  tag:"필터/레이블링", title:"데이터 주기 변환", desc:"데이터 주기 변환" },
      { key:"row_na",    tag:"필터/레이블링", title:"결측치 처리",     desc:"빈 값은 기존 행 삭제 또는 해당 값 유지" }, // slide idx=0 내용과 연결
      { key:"horizon",   tag:"통계",         title:"시간 지평 설정",   desc:"투자 기간 설정" }
    ]
  },
  {
    group: "열 삭제/변경",
    items: [
      { key:"col_drop",   tag:"필터/레이블링", title:"열 삭제",     desc:"특정 열 삭제" },
      { key:"col_rename", tag:"기타",         title:"열 이름 변경", desc:"열 이름 변경" },
      { key:"col_move",   tag:"기타",         title:"열 이동",     desc:"열 위치 이동" }
    ]
  },
  {
    group: "열 추가",
    items: [
      { key:"label",   tag:"필터/라벨링", title:"데이터 라벨링", desc:"데이터 라벨링하기" },         // slide idx=4
      { key:"arith",   tag:"수학",       title:"사칙연산",     desc:"열간의 사칙연산 수행" },
      { key:"round",   tag:"수학",       title:"반올림",       desc:"반올림 연산" },
      // { key:"date_rm", tag:"날짜",       title:"날짜 요소 제거", desc:"날짜의 특정 요소 제거" },
      // { key:"date_sp", tag:"날짜",       title:"날짜 요소 분리", desc:"날짜 요소 분리(년, 월, 일, 시간, 분, 초)" },
      // { key:"scale",   tag:"통계",       title:"스케일링",     desc:"데이터를 일정 범위로 변환" },
      //       // slide idx=5
    ]
  }
];

function renderChoiceModalBoxes(){
  const wrap = document.querySelector('#choiceModal .modal-boxes');
  if (!wrap) return;

  wrap.innerHTML = MODAL_GROUPS.map(g => `
    <h5 class="modal-group-title">${g.group}(${g.items.length})</h5>
    <div class="modal-grid">
      ${g.items.map(it => `
        <button class="box" data-key="${it.key}"
                data-title="${it.title}"
                data-desc="${it.desc}"
                data-idx="${TITLE_TO_IDX['*'+it.title] ?? ''}">
          <span class="badge">${it.tag}</span>
          <div class="b-title">${it.title}</div>
          <div class="b-desc">${it.desc}</div>
        </button>
      `).join('')}
    </div>
  `).join('');
}

// DOMContentLoaded 시 한 번만 렌더
document.addEventListener("DOMContentLoaded", renderChoiceModalBoxes);


// 추천 패널이 처음 만들어질 때도 한 번 보정
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("choiceModal");
  const btn = document.getElementById("choiceBtn");
  const closeBtn = modal.querySelector(".close");

  // 버튼 클릭 → 모달 열기
  btn.addEventListener("click", () => {
    modal.style.display = "block";
  });

  // 닫기 버튼 클릭 → 모달 닫기
  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // 모달 외부 클릭 → 닫기
  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("choiceModal");

  // 위임 방식: 모달 안의 카드 클릭
  modal.addEventListener("click", (e) => {
    const box = e.target.closest(".modal-boxes .box");
    if (!box) return;

    const title = box.dataset.title || box.querySelector('.b-title')?.textContent.trim() || '';
    const desc  = box.dataset.desc  || box.querySelector('.b-desc')?.textContent.trim()  || '';
    const idxStr= box.dataset.idx;
    const idx   = idxStr === '' || idxStr == null
      ? inferIdxFromTitle('*' + title)  // 매핑 없으면 제목으로 추론
      : Number(idxStr);

    // ask-wrap 추가 (idx를 data-idx로 심어줌)
    addAskWrap('*' + title, desc, idx);

    // 모달 닫기
    modal.style.display = "none";
  });
});

  // ✅ 모달 내부 박스 클릭 → ask-wrap 추가

  const boxContents = {
  box1: "데이터 전처리 과정을 수행하는 ask-content",
  box2: "머신러닝 모델 학습에 필요한 라벨링 작업 ask-content",
  box3: "시각화 차트를 생성하는 ask-content",
  box4: "DB에서 데이터를 가져오는 ask-content",
  box5: "API를 호출하여 결과를 처리하는 ask-content",
  box6: "데이터 전처리 과정을 수행하는 ask-content",
  box7: "머신러닝 모델 학습에 필요한 라벨링 작업 ask-content",
  box8: "시각화 차트를 생성하는 ask-content",
  box9: "DB에서 데이터를 가져오는 ask-content",
  box10: "API를 호출하여 결과를 처리하는 ask-content",
  box11: "데이터 전처리 과정을 수행하는 ask-content",
  box12: "머신러닝 모델 학습에 필요한 라벨링 작업 ask-content",
  box13: "시각화 차트를 생성하는 ask-content",
  box14: "DB에서 데이터를 가져오는 ask-content",
  box15: "API를 호출하여 결과를 처리하는 ask-content",
  box16: "데이터 전처리 과정을 수행하는 ask-content",
  box17: "머신러닝 모델 학습에 필요한 라벨링 작업 ask-content",
  box18: "시각화 차트를 생성하는 ask-content",
  box19: "DB에서 데이터를 가져오는 ask-content",
  box20: "API를 호출하여 결과를 처리하는 ask-content",
  box21: "데이터 전처리 과정을 수행하는 ask-content",
  box22: "머신러닝 모델 학습에 필요한 라벨링 작업 ask-content",
  box23: "시각화 차트를 생성하는 ask-content",
  box24: "DB에서 데이터를 가져오는 ask-content",
  box25: "API를 호출하여 결과를 처리하는 ask-content"
};

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("choiceModal");

  // modal 안의 box 클릭 → ask-wrap 생성
  modal.querySelectorAll(".modal-boxes .box").forEach((box) => {
    box.addEventListener("click", () => {
      const key = box.getAttribute("data-key");
      const title = box.textContent.trim();
      const content = boxContents[key] || "⚠️ 정의되지 않은 박스입니다.";

      addAskWrap("*" + title, content, inferIdxFromText(content)); // ✅ 이제 title, content 항상 있음
      modal.style.display = "none";
    });
  });
});
function inferIdxFromText(t=''){
  const i = ASK_PLACEHOLDER_POOL.findIndex(s => t && t.startsWith(s));
  return i >= 0 ? i : 0;
}
const TITLE_TO_IDX = {
  '*결측치 처리': 0, 
  '*결측치 대체': 1,
  '*수익률 계산': 2,
  '*래깅값 계산': 3,
  '*데이터 라벨링': 4,
  '*결측치 제거': 5
};
function inferIdxFromTitle(t=''){
  t = t.trim();
  for (const [k,v] of Object.entries(TITLE_TO_IDX)){
    if (t.startsWith(k)) return v;
  }
  return 0;
}
function inferIdxFromWrap(wrap){
  const txt = wrap.querySelector('.ask-content')?.textContent?.trim() || '';
  if (txt) return inferIdxFromText(txt);
  const tit = wrap.querySelector('.ask-title')?.textContent?.trim() || '';
  return inferIdxFromTitle(tit);
}
// ✅ ask-first가 있으면 data-idx=0 보장
function ensureAskFirstIndex(){
  const first = document.querySelector('#recommand .ask-wrap.ask-first');
  if (first) first.setAttribute('data-idx','0');
}
function reindexAskWraps(){
  const rc = document.getElementById('recommand');
  if (!rc) return;
  const first = rc.querySelector('.ask-wrap.ask-first');
  if (first) first.setAttribute('data-idx','0');

let n = 1;
  rc.querySelectorAll('.ask-wrap:not(.ask-first)').forEach(wrap => {
    wrap.setAttribute('data-idx', String(n++));
  });
}

// 펼침 높이 갱신
// 펼침 높이 갱신 (여유 높이 포함)
function setOpenHeight(panel){
  if (!panel) return;

  // 기본 내용 높이
  const contentHeight = panel.scrollHeight;

  // 줄바꿈이 많은 경우 여유 높이 가산
  let extra = 0;
  const contentEl = panel.querySelector('.ask-content');
  if (contentEl) {
    const cs = getComputedStyle(contentEl);
    const lh = parseFloat(cs.lineHeight);
    if (!Number.isNaN(lh) && lh > 0) {
      // 대략적인 줄 수 추정
      const lines = Math.round(contentEl.scrollHeight / lh);
      // 2줄 이상이면 여유를 더 줌 (줄당 8px, 최대 80px)
      if (lines >= 2) extra = Math.min(80, (lines - 1) * 8);
    }
  }

  panel.style.setProperty('--open-h', String(contentHeight) + 'px');
  panel.style.setProperty('--open-extra', String(extra) + 'px');
}


// 클릭 토글 (입력요소 클릭은 무시)
document.addEventListener('click', (e) => {
  const wrap = e.target.closest('.ask-wrap');
  if (!wrap) return;

  // 폼/링크 등 실제 인터랙션은 토글 제외
  if (e.target.closest('input, select, textarea, label, button, a')) return;

  const panel = wrap.querySelector('.collapse__content');
  const btn   = wrap.querySelector('.collapse__btn');
  if (!panel) return;

  const willOpen = !panel.classList.contains('open');

  if (willOpen) {
    // 열기: 먼저 높이 설정 후 open 클래스
    setOpenHeight(panel);
    panel.classList.add('open');
    wrap.classList.add('open');
    btn?.setAttribute('aria-expanded', 'true');
  } else {
    // 닫기: 현재 높이로 고정 → 강제 리플로우 → 0으로 애니메이션
    setOpenHeight(panel);
    void panel.offsetHeight;            // reflow
    panel.classList.remove('open');     // max-height:0 으로 전환
    wrap.classList.remove('open');
    btn?.setAttribute('aria-expanded', 'false');
  }
});

// 내용이 변해도 높이 자동 보정
const ro = new ResizeObserver(entries => {
  for (const { target } of entries) {
    if (target.classList.contains('open')) setOpenHeight(target);
  }
});
document.querySelectorAll('.ask-wrap .collapse__content').forEach(p => ro.observe(p));

// 동적으로 생기는 ask-wrap도 관찰(옵션)
const rc = document.getElementById('recommand');
if (rc) {
  const mo = new MutationObserver(muts => {
    muts.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        node.querySelectorAll?.('.ask-wrap .collapse__content').forEach(p => ro.observe(p));
        if (node.matches?.('.ask-wrap .collapse__content')) ro.observe(node);
      });
    });
  });
  mo.observe(rc, { childList: true, subtree: true });
}




