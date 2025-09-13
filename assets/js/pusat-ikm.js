/* =======================
   PUSAT IKM – Landing (home-2)
   ======================= */
(function(){
  console.log("[PusatIKM] pusat-ikm.js loaded");

  /* ---------- CSV helpers ---------- */
  function parseCSV(text){
    text = text.replace(/\r\n/g,"\n").replace(/\r/g,"\n");
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
    const first = (text.split("\n")[0]||"");
    const sc = (first.match(/;/g)||[]).length;
    const cc = (first.match(/,/g)||[]).length;
    const D = sc>cc ? ";" : ",";
    const rows=[], currow=[]; let cur="", q=false;
    for (let i=0;i<text.length;i++){
      const c=text[i], n=text[i+1];
      if (c==='"' && n===`"`) { cur+='"'; i++; continue; }
      if (c==='"') { q=!q; continue; }
      if (c===D && !q) { currow.push(cur); cur=""; continue; }
      if (c==="\n" && !q) { currow.push(cur); rows.push(currow.slice()); currow.length=0; cur=""; continue; }
      cur+=c;
    }
    if (cur!=="" || currow.length){ currow.push(cur); rows.push(currow); }
    if (!rows.length) return [];
    const header = rows.shift().map(h=>(h||"").trim());
    return rows
      .filter(r => r.length && r.join("").trim().length)
      .map(r => { const o={}; header.forEach((h,i)=> o[h]=(r[i]||"").trim() ); return o; });
  }
  async function loadCSV(path){
    const res = await fetch(path, { cache:"no-store" });
    if (!res.ok) throw new Error("Gagal load "+path);
    return parseCSV(await res.text());
  }

  /* ---------- Utils ---------- */
  const uniqSorted = arr => [...new Set(arr.filter(Boolean))].sort((a,b)=>a.localeCompare(b,'id'));
  const fixCoord = v => {
    if (v==null) return NaN;
    const s = String(v).replace(/\s/g,"").replace(",",".");
    const num = parseFloat(s);
    return isNaN(num) ? NaN : num;
  };
  const isValidLatLon = (lat,lon) =>
    isFinite(lat) && isFinite(lon) && lat>=-90 && lat<=90 && lon>=-180 && lon<=180;

  const slug = s => (s||"").toString().toLowerCase()
    .replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");
  const makeId = (r, idx=0) => {
    const base = `${slug(r["Nama IKM"]||"ikm")}-${(r._lat??"")}-${(r._lon??"")}`;
    return `${base}-${idx}`;
  };

  /* ---------- COUNTER (Angka Kunci) ---------- */
  function animateCounters(scope) {
    const els = (scope || document).querySelectorAll('#count-ikm, #count-badan, #count-komoditas, #count-kecamatan, .counter-number');
    if (!els.length) return;
    const run = (el, target) => {
      const dur = 1000; const t0 = performance.now();
      function tick(t){
        const p = Math.min((t - t0) / dur, 1);
        el.textContent = Math.floor(target * p).toLocaleString('id-ID');
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(en=>{
        if (!en.isIntersecting) return;
        const el = en.target;
        const target = parseInt(el.getAttribute('data-target') || el.textContent || '0', 10) || 0;
        el.textContent = "0";
        run(el, target);
        io.unobserve(el);
      });
    }, {threshold:0.35});
    els.forEach(el=> io.observe(el));
  }

  function renderAngkaKunci(ikm){
    const aktif = ikm.filter(x => (x["Status"]||"").toLowerCase()==="aktif");
    const total = aktif.length;
    const badan = new Set(aktif.map(x => (x["Badan Usaha"]||"").trim()).filter(Boolean)).size;
    const komod = new Set(aktif.map(x => (x["Komoditas"]||"").trim()).filter(Boolean)).size;
    const kec   = new Set(aktif.map(x => (x["Kecamatan"]||"").trim()).filter(Boolean)).size;

    const setTarget = (id, val) => { const s = document.getElementById(id); if (s) s.setAttribute("data-target", String(val)); };
    setTarget("count-ikm", total);
    setTarget("count-badan", badan);
    setTarget("count-komoditas", komod);
    setTarget("count-kecamatan", kec);

    animateCounters(document);
    (window.__IKM_DEBUG__=window.__IKM_DEBUG__||{}).angka={total,badan,komod,kec};
  }

  /* ---------- Award-list renderer (gaya home-10) ---------- */
  function ikmRowToAwardLi(r){
    // Gunakan Tahun Berdiri jika ada, kalau tidak pakai tahun dari Tanggal/Tgl Update
// Tahun yang ditampilkan = Tahun Berdiri (dibersihkan), fallback ke tanggal jika kosong
const tbRaw = r["Tahun Berdiri"] ?? r["Tahun berdiri"] ?? r["TahunBerdiri"] ?? r["thn_berdiri"];
let tahun = "";
if (tbRaw != null && tbRaw !== "") {
  const m = String(tbRaw).trim().match(/\d{4}/);  // "2012.0" -> "2012"
  if (m) {
    const yr = parseInt(m[0], 10);
    const nowY = new Date().getFullYear() + 1;
    if (yr >= 1900 && yr <= nowY) {
      tahun = String(yr);
    }
  }
}
if (!tahun) {
  const t = r["Tanggal Berdiri"] || r["Tanggal Update"] || r["Tanggal"];
  let d = null;
  if (t != null && t !== "") {
    if (typeof t === "string" && /^\d{4}-\d{1,2}-\d{1,2}/.test(t)) d = new Date(t);
    else d = new Date(String(t));
  }
  if (d && !isNaN(d)) tahun = String(d.getFullYear());
}



    const nama   = r["Nama IKM"] || "-";
    const pemilik= r["Nama Pemilik"] || "-";
    const produk = r["Jenis Produk"] || "-";
    const kel    = r["Desa/Kel"] || r["Kelurahan"] || r["Desa"] || "-";
    const kec    = r["Kecamatan"] || "-";
    const komod  = r["Komoditas"] || "-";
    const img    = r["Foto URL"] || "assets/img/award/award-1-1.png";

    return `
<li class="single-award-list style2 tg-img-reveal-item" data-img="${img}" data-ikm="${r._id}">
  <span class="award-year">${tahun || "&nbsp;"}</span>
  <div class="award-details">
    <h4><a href="#peta-sebaran" class="ikm-jump" data-ikm="${r._id}">${nama}</a></h4>
    <div class="award-meta">
      <a href="#peta-sebaran" class="ikm-jump" data-ikm="${r._id}">${pemilik}</a>
      <a href="#peta-sebaran" class="ikm-jump" data-ikm="${r._id}">${produk}</a>
      <a href="#peta-sebaran" class="ikm-jump" data-ikm="${r._id}">${kel}</a>
      <a href="#peta-sebaran" class="ikm-jump" data-ikm="${r._id}">${kec}</a>
    </div>
  </div>
  <span class="award-tag">${komod}</span>
</li>`;
  }

  /* ---------- Hover preview mandiri (kuat & ada fallback) ---------- */
function enableHoverPreview(root){
  // 1) satu kali buat box-nya
  let box = document.querySelector('.ikm-hover-preview');
  if (!box){
    box = document.createElement('div');
    box.className = 'ikm-hover-preview';
    box.innerHTML = '<img alt="preview">';
    document.body.appendChild(box);
  }
  const img = box.querySelector('img');

  // 2) simpan posisi mouse global, jadi begitu load langsung nempel
  let last = {x:0,y:0}, visible = false;
  document.addEventListener('mousemove', (e)=>{
    last.x = e.clientX; last.y = e.clientY;
    if (visible){
      box.style.transform = `translate(${last.x + 24}px, ${last.y + 24}px)`;
    }
  });

  // 3) show/hide dengan preloading & fallback
  const show = (src)=>{
    if (!src) return;
    visible = true;
    // reset handler
    img.onload = null; img.onerror = null;

    img.onload = ()=>{
      // posisikan segera begitu gambar siap
      box.style.transform = `translate(${last.x + 24}px, ${last.y + 24}px)`;
      box.style.opacity = '1';
    };
    img.onerror = ()=>{
      // fallback kalau path salah → pakai placeholder agar tetap muncul
      img.onerror = null;
      img.src = 'assets/img/award/award-1-1.png';
      box.style.transform = `translate(${last.x + 24}px, ${last.y + 24}px)`;
      box.style.opacity = '1';
    };

    // set sumber terakhir agar selalu refresh
    img.src = src;
  };

  const hide = ()=>{
    visible = false;
    box.style.opacity = '0';
  };

  // 4) pasang listener ke setiap item list
  const items = root.querySelectorAll('.tg-img-reveal-item');
  items.forEach(el=>{
    const src = (el.getAttribute('data-img') || '').trim();
    el.addEventListener('mouseenter', ()=> show(src));
    el.addEventListener('mouseleave', hide);
  });
}


  /* ---------- Section Peta & Direktori ---------- */
  function renderPetaSebaran(sectionEl, ikm){
    if (!sectionEl) return;

    // Data aktif + koordinat + id
    const aktif = ikm
      .filter(x => (x["Status"]||"").toLowerCase()==="aktif")
      .map((x, i) => {
        const lat = fixCoord(x["Latitude"]);
        const lon = fixCoord(x["Longitude"]);
        return Object.assign({}, x, { _lat: lat, _lon: lon, _id: makeId(x, i) });
      });

    // Leaflet init + fallback tile
    const mapEl = document.getElementById("sebarMap");
    let map=null, markers=[], markerById={}, highlightedId=null;
    if (window.L && mapEl){
      map = L.map("sebarMap");
      const providers = [
        {url:"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attr:"© OpenStreetMap"},
        {url:"https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", attr:"© OSM France / HOT"}
      ];
      let idx=0, layer=null;
      const addLayer=()=>{
        layer = L.tileLayer(providers[idx].url,{attribution:providers[idx].attr});
        layer.on("tileerror", ()=>{ if (idx<providers.length-1){ map.removeLayer(layer); idx++; addLayer(); }});
        layer.addTo(map);
      };
      addLayer();
      setTimeout(()=> map.invalidateSize(), 250);
      window.addEventListener("resize", ()=> map.invalidateSize());
    }

    function clearMarkers(){
      markers.forEach(m=>m.remove());
      markers=[]; markerById={}; highlightedId=null;
    }

    function setMarkers(rows){
      if (!map) return;
      clearMarkers();
      const bounds = L.latLngBounds();

      rows.forEach(r=>{
        if (!isValidLatLon(r._lat, r._lon)) return;
        const m = L.marker([r._lat, r._lon], { className: 'ikm-marker' })
          .addTo(map)
          .bindPopup(`<strong>${r["Nama IKM"]||""}</strong><br>${r["Komoditas"]||""} — ${r["Kecamatan"]||""}`);
        m._ikmId = r._id;
        markerById[r._id] = m;
        markers.push(m);
        bounds.extend([r._lat, r._lon]);
        m.on('click', ()=> highlightMarker(r._id, false));
      });

      if (markers.length) map.fitBounds(bounds,{padding:[20,20]}); else map.setView([-8.761,116.89], 9);
    }

    function highlightMarker(id, doScroll=true){
      if (!map) return;
      highlightedId = id;
      markers.forEach(m=>{
        if (!m._icon) return;
        m._icon.classList.remove('ikm-highlight');
        m.setZIndexOffset(0);
      });
      const t = markerById[id];
      if (t && t._icon){
        t._icon.classList.add('ikm-highlight');
        t.setZIndexOffset(999);
        const ll = t.getLatLng();
        map.flyTo(ll, Math.max(map.getZoom(), 12), { duration: 0.6 });
        t.openPopup();
        if (doScroll){
          const sec = document.getElementById('peta-sebaran');
          sec && sec.scrollIntoView({behavior:'smooth', block:'start'});
        }
      }
    }

    // Target hasil + paginasi toggle
    const awardList = document.getElementById("ikmAwardList");
    const noRes     = document.getElementById("ikmNoResult");
    const moreWrap  = document.getElementById("ikmLoadMoreWrap");
    const moreBtn   = document.getElementById("ikmLoadMore");
    const collapseBtn = document.getElementById("ikmCollapse");


const PAGE = 10;
let currentRows = [];
let shownCount = PAGE;


    function bindListClicks(){
      document.querySelectorAll('.ikm-jump').forEach(a=>{
        a.addEventListener('click', (ev)=>{
          ev.preventDefault();
          const id = a.getAttribute('data-ikm');
          highlightMarker(id, true);
        });
      });
    }

function drawList(){
  if (!awardList) return;

  // Render hanya sampai 'shownCount'
  const rows = currentRows.slice(0, shownCount);
  awardList.innerHTML = rows.map(ikmRowToAwardLi).join("");

  // Tampilkan/hidden tombol sesuai kondisi
  if (currentRows.length > PAGE) {
    moreWrap?.classList.remove('d-none');
    // "Load more" tampil jika masih ada sisa data
    if (moreBtn) moreBtn.style.display = (shownCount < currentRows.length) ? '' : 'none';
    // "Tutup" tampil jika sudah > PAGE
    if (collapseBtn) collapseBtn.style.display = (shownCount > PAGE) ? '' : 'none';
  } else {
    moreWrap?.classList.add('d-none');
  }

  // re-wire hover preview & klik "lompat ke peta" ke item yang baru
  enableHoverPreview(awardList);
  bindListClicks();
}



function renderResults(rows){
  currentRows = rows || [];
  shownCount = Math.min(PAGE, currentRows.length);

  if (!currentRows.length){
    awardList && (awardList.innerHTML="");
    noRes?.classList.remove("d-none");
    moreWrap?.classList.add("d-none");
  } else {
    noRes?.classList.add("d-none");
    drawList();
  }
  (window.__IKM_DEBUG__=window.__IKM_DEBUG__||{}).list_count=currentRows.length;
}

    // +10 setiap klik
moreBtn?.addEventListener("click", ()=>{
  shownCount = Math.min(shownCount + PAGE, currentRows.length);
  drawList();
});

// Balik ke 10 & scroll halus ke anchor
collapseBtn?.addEventListener("click", ()=>{
  shownCount = PAGE;
  drawList();
  const anchor = document.getElementById('ikm-list-anchor') || awardList;
  const y = (anchor?.getBoundingClientRect().top || 0) + window.scrollY - 120;
  window.scrollTo({ top: y, behavior: 'smooth' });
});


    /* ---- Search + Multi-filter ---- */
    const qInput   = document.getElementById("ikmSearchInput");
    const btnCari  = document.getElementById("ikmSearchBtn");
    const btnReset = document.getElementById("btnResetFilter");

    const pills = {
      badan: document.querySelector('.filter-pill-wrap[data-filter="badan"] .filter-pill'),
      kel:   document.querySelector('.filter-pill-wrap[data-filter="kel"] .filter-pill'),
      kec:   document.querySelector('.filter-pill-wrap[data-filter="kec"] .filter-pill'),
      komod: document.querySelector('.filter-pill-wrap[data-filter="komod"] .filter-pill'),
    };

    const options = {
      badan: uniqSorted(aktif.map(x=>x["Badan Usaha"])),
      kel:   uniqSorted(aktif.map(x=>x["Desa/Kel"] || x["Kelurahan"] || x["Desa"])),
      kec:   uniqSorted(aktif.map(x=>x["Kecamatan"])),
      komod: uniqSorted(aktif.map(x=>x["Komoditas"]))
    };
    const selected = { badan:new Set(), kel:new Set(), kec:new Set(), komod:new Set() };

    const filterRow = document.getElementById("ikmFilterRow");
    function buildPop(key, values){
      const wrap = filterRow?.querySelector(`.filter-pill-wrap[data-filter="${key}"]`);
      if (!wrap) return;
      const grid = wrap.querySelector('.filter-pop .opt-grid');
      grid.innerHTML = values.map(v=>{
        const sel = selected[key].has(v) ? 'is-selected' : '';
        return `<label class="${sel}"><input type="checkbox" value="${v}" ${sel?'checked':''}> <span>${v}</span></label>`;
      }).join('') || "<em style='padding:8px;'>Tidak ada opsi.</em>";

      grid.querySelectorAll('input[type="checkbox"]').forEach(cb=>{
        cb.addEventListener('change', ()=>{
          const v = cb.value, lab = cb.closest('label');
          if (cb.checked){ selected[key].add(v); lab.classList.add('is-selected'); }
          else{ selected[key].delete(v); lab.classList.remove('is-selected'); }
          applyFilter();
        });
      });

      wrap.addEventListener('click', ev=>{
        if (ev.target.tagName.toLowerCase()==='input') return;
        wrap.classList.toggle('open');
      });
      document.addEventListener('click', ev=>{
        if (!wrap.contains(ev.target)) wrap.classList.remove('open');
      });
    }
    buildPop("badan", options.badan);
    buildPop("kel",   options.kel);
    buildPop("kec",   options.kec);
    buildPop("komod", options.komod);

    function anySelected(){
      return (qInput.value||"").trim() ||
             selected.badan.size || selected.kel.size || selected.kec.size || selected.komod.size;
    }
    function syncPillActive(){
      pills.badan?.classList.toggle('active', !!selected.badan.size);
      pills.kel?.classList.toggle('active',   !!selected.kel.size);
      pills.kec?.classList.toggle('active',   !!selected.kec.size);
      pills.komod?.classList.toggle('active', !!selected.komod.size);
    }
    function updateResetVisibility(){
      btnReset?.classList.toggle('d-none', !anySelected());
    }

    function applyFilter(){
      const q = (qInput.value||"").toLowerCase().trim();

      const rows = aktif.filter(r=>{
        const blob = `${r["Nama IKM"]||""} ${r["Nama Pemilik"]||""} ${r["Jenis Produk"]||""} ${r["Komoditas"]||""} ${r["Kecamatan"]||""} ${r["Kelurahan"]||r["Desa/Kel"]||r["Desa"]||""}`.toLowerCase();
        const qOK = q ? blob.includes(q) : true;

        const badanOK = selected.badan.size ? selected.badan.has(r["Badan Usaha"]) : true;
        const kelVal  = r["Desa/Kel"] || r["Kelurahan"] || r["Desa"];
        const kelOK   = selected.kel.size   ? selected.kel.has(kelVal) : true;
        const kecOK   = selected.kec.size   ? selected.kec.has(r["Kecamatan"]) : true;
        const komOK   = selected.komod.size ? selected.komod.has(r["Komoditas"]) : true;

        return qOK && badanOK && kelOK && kecOK && komOK;
      });

      renderResults(rows);
      setMarkers(rows);
      syncPillActive();
      updateResetVisibility();
    }

    btnCari?.addEventListener('click', applyFilter);
    qInput?.addEventListener('keydown', e=>{ if (e.key==="Enter") applyFilter(); });
    btnReset?.addEventListener('click', ()=>{
      qInput && (qInput.value="");
      Object.values(selected).forEach(s=>s.clear());
      buildPop("badan", options.badan); buildPop("kel", options.kel);
      buildPop("kec", options.kec);     buildPop("komod", options.komod);
      applyFilter();
    });

    // render awal
    renderResults(aktif);     // list awal
    setMarkers(aktif);        // pin semua
    updateResetVisibility();  // show/hide reset
  }


/* ===== Render Blog Area (Home) dari artikel.csv ===== */
function renderBlogHome(container, artikelRows) {
  if (!container) return;
  // filter Publik + sort by tanggal desc (YYYY-MM-DD)
  const rows = artikelRows
    .filter(a => (a["Status"]||"").trim().toLowerCase() === "publik")
    .sort((a,b) => String(b["Tanggal"]||"").localeCompare(String(a["Tanggal"]||"")))
    .slice(0, 3);

  if (!rows.length) {
    container.innerHTML = `<div class="col-12"><p>Belum ada artikel.</p></div>`;
    return;
  }

  const html = rows.map(a => {
    const judul = a["Judul"] || "";
    const link  = a["Link"]  || "#";
    const ringk = a["Ringkasan"] || "";
    const thumb = a["Thumbnail URL"] || ""; // boleh kosong
    const kat   = a["Kategori"] || "";

    return `
      <div class="col-md-4 mb-30">
        <div class="blog-card">
          ${thumb ? `
          <div class="blog-img">
            <a href="${link}"><img src="${thumb}" alt="${judul}"></a>
          </div>` : ``}
          <div class="blog-content">
            ${kat ? `<div class="blog-meta mb-10"><span class="tag">${kat}</span></div>` : ``}
            <h5 class="blog-title"><a href="${link}">${judul}</a></h5>
            ${ringk ? `<p class="blog-text">${ringk}</p>` : ``}
            <a class="link-btn" href="${link}">Baca selengkapnya</a>
          </div>
        </div>
      </div>
    `;
  }).join("");

  container.innerHTML = html;
}





  /* ---------- Init ---------- */
(async function init(){
  try{
    const [ikm, artikel] = await Promise.all([
      loadCSV("assets/data/ikm.csv"),
      loadCSV("assets/data/artikel.csv")
    ]);

    // Simpan global kalau perlu modul lain
    window.__IKM_ROWS__ = ikm;
    window.__ARTIKEL_ROWS__ = artikel;

    // Angka kunci, peta/list, dll (biarkan sesuai versi kamu)
    renderAngkaKunci(ikm);
    const sec = document.getElementById("peta-sebaran");
    renderPetaSebaran(sec, ikm);

    // === Blog Area (Home)
    const blogWrap = document.getElementById("artikel-terbaru");
    renderBlogHome(blogWrap, artikel);

    // (kalau kamu punya initServiceInsight utk slider service area, tetap panggil di sini)
    if (typeof initServiceInsight === "function") initServiceInsight();

  }catch(err){
    console.error(err);
  }
})();






  
})();



/* ======================
   SERVICE INSIGHT SLIDER
   ====================== */

// Urutan 8 kecamatan KSB (agar bar selalu 8 & urut rapi)
const KSB_KECAMATAN = [
  "Taliwang","Brang Rea","Brang Ene",
  "Poto Tano","Seteluk","Jereweh",
  "Maluk","Sekongkang"
];

// Hitung grup & persen (Status=Aktif)
function groupPercent(rows, key, { ordered=null, topN=null } = {}) {
  const aktif = rows.filter(r => (r["Status"]||"").toString().trim().toLowerCase()==="aktif");
  const total = aktif.length || 1;
  const map = new Map();
  aktif.forEach(r => {
    const name = (r[key]||"").toString().trim();
    if (!name) return;
    map.set(name, (map.get(name)||0) + 1);
  });

  let arr = Array.from(map, ([name, count]) => ({ name, count, pct: Math.round(count*100/total) }));

  if (ordered) {
    const have = new Set(arr.map(a=>a.name));
    ordered.forEach(n => { if(!have.has(n)) arr.push({name:n,count:0,pct:0}); });
    arr.sort((a,b)=> ordered.indexOf(a.name)-ordered.indexOf(b.name));
  } else {
    arr.sort((a,b)=> b.count - a.count);
  }
  if (topN && arr.length>topN) arr = arr.slice(0, topN);
  return arr;
}

// Render progress bars + animasi saat terlihat
function renderInsightBars(container, items){
  container.innerHTML = items.map(it => `
    <div class="bar">
      <div class="bar-head">
        <span class="bar-name">${it.name}</span>
        <span class="bar-val">${it.pct}%</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" data-pct="${it.pct}"></div>
      </div>
    </div>
  `).join("");

  const fills = container.querySelectorAll('.bar-fill');
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{
      if(!en.isIntersecting) return;
      const el = en.target;
      el.style.width = el.getAttribute('data-pct') + '%';
      io.unobserve(el);
    });
  }, { threshold:.25 });
  fills.forEach(el=>io.observe(el));
}

function initServiceInsight(){
  // Ambil dataset yang sama dengan map/list
  const rows = window.__IKM_ROWS__ || window.IKM_DATA || [];
  const sect = document.getElementById('service-insight');
  if(!sect || !rows.length) return;

  // Hitung
  const perKec = groupPercent(rows, 'Kecamatan', { ordered: KSB_KECAMATAN });
  const perKom = groupPercent(rows, 'Komoditas', { topN: 8 });

  // Render bars
  const elKec = document.getElementById('bars-kecamatan');
  const elKom = document.getElementById('bars-komoditas');
  if (elKec) renderInsightBars(elKec, perKec);
  if (elKom) renderInsightBars(elKom, perKom);

  // Aktifkan Swiper (1 slide per view + dots)
  if (window.Swiper) {
    new Swiper('.insightSwiper', {
      slidesPerView: 1,
      loop: false,
      speed: 700,
      autoHeight: true,
      pagination: { el: '.insight-pagination', clickable: true }
    });
  }
}
// (jaga-jaga kalau dipanggil sebelum CSV, DOMContentLoaded akan coba lagi)
document.addEventListener('DOMContentLoaded', initServiceInsight);


