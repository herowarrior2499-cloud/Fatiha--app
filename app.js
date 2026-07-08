const STORAGE_PREFIX = "tadabbur:fatiha:";
let SURAH_DATA = null;
let currentAyah = 1;
let saveTimer = null;

async function init(){
  const res = await fetch("fatiha.json");
  SURAH_DATA = await res.json();
  renderDots();
  renderAyah(1);

  if ("serviceWorker" in navigator){
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

function renderDots(){
  const dots = document.getElementById("ayahDots");
  dots.innerHTML = "";
  SURAH_DATA.ayat.forEach(a => {
    const btn = document.createElement("button");
    btn.className = "ayah-dot" + (a.number === currentAyah ? " active" : "");
    btn.textContent = toArabicDigits(a.number);
    btn.setAttribute("aria-label", "الآية " + a.number);
    btn.onclick = () => renderAyah(a.number);
    btn.id = "dot-" + a.number;
    dots.appendChild(btn);
  });
}

function toArabicDigits(n){
  const map = ["٠","١","٢","٣","٤","٥","٦","٧","٨","٩"];
  return String(n).split("").map(d => map[+d]).join("");
}

function renderAyah(num){
  currentAyah = num;
  document.querySelectorAll(".ayah-dot").forEach(d => d.classList.remove("active"));
  const activeDot = document.getElementById("dot-" + num);
  if (activeDot) activeDot.classList.add("active");

  const ayah = SURAH_DATA.ayat.find(a => a.number === num);
  const container = document.getElementById("ayahContainer");

  const wordsHtml = ayah.words.map(w => `
    <div class="word-item">
      <div class="word-arabic">${w.text}</div>
      ${w.root && w.root !== "-" ? `<span class="word-root">جذر: ${w.root}</span>` : ""}
      <p class="word-meaning">${w.meaning}</p>
      ${w.note ? `<p class="word-note">${w.note}</p>` : ""}
    </div>
  `).join("");

  const crossRefsHtml = (ayah.crossRefs || []).map(c => `
    <div class="crossref-item"><b>${c.word}</b><br>${c.note}</div>
  `).join("");

  container.innerHTML = `
    <div class="ayah-card">
      <div class="ayah-number-glyph">${toArabicDigits(ayah.number)}</div>
      <p class="ayah-text">${ayah.text}</p>

      <div class="tab-bar">
        <button class="tab-btn active" data-tab="tafsir">التفسير</button>
        <button class="tab-btn" data-tab="lexicon">المعجم</button>
        <button class="tab-btn" data-tab="reflection">تفسيري</button>
      </div>

      <div class="tab-panel active" data-panel="tafsir">
        <p class="tafsir-text">${ayah.tafsir}</p>
        ${crossRefsHtml ? `<div class="crossrefs"><div class="crossrefs-title">آيات وكلمات ذات صلة</div>${crossRefsHtml}</div>` : ""}
      </div>

      <div class="tab-panel" data-panel="lexicon">
        <div class="word-list">${wordsHtml}</div>
      </div>

      <div class="tab-panel" data-panel="reflection">
        <textarea class="reflection-area" id="reflectionInput" placeholder="اكتب هنا فهمك الشخصي لهذه الآية، وما تدل عليه بالنسبة لك...">${getReflection(num)}</textarea>
        <p class="reflection-hint">يُحفظ تلقائيًا على جهازك فقط، ولا يحتاج إنترنت.</p>
        <p class="save-status" id="saveStatus">تم الحفظ</p>
      </div>
    </div>
  `;

  container.querySelectorAll(".tab-btn").forEach(btn => {
    btn.onclick = () => switchTab(btn.dataset.tab);
  });

  const input = document.getElementById("reflectionInput");
  input.addEventListener("input", () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveReflection(num, input.value), 400);
  });
}

function switchTab(tab){
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.toggle("active", p.dataset.panel === tab));
}

function getReflection(num){
  return localStorage.getItem(STORAGE_PREFIX + num) || "";
}

function saveReflection(num, text){
  localStorage.setItem(STORAGE_PREFIX + num, text);
  const status = document.getElementById("saveStatus");
  if (status){
    status.classList.add("show");
    setTimeout(() => status.classList.remove("show"), 1200);
  }
}

init();
