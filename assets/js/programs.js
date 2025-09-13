// assets/js/programs.js
(function(){
  // Map tab → key di JSON + judul section
  const map = {
    'kalender':  { key: 'kalender',  title: 'Kalender Pelatihan IKM' },
    'pembinaan': { key: 'pembinaan', title: 'Program Pembinaan IKM' },
    'kerjasama': { key: 'kerja_sama', title: 'Program Kerja Sama IKM' }
  };
  const tab = (new URLSearchParams(location.search).get('tab') || 'kalender').toLowerCase();
  const cfg = map[tab] || map.kalender;

  // Set judul section
  const h2 = document.getElementById('program-sec-title');
  if (h2) h2.textContent = cfg.title;

  const wrap = document.getElementById('program-carousel');
  if (!wrap) return;

  // Hitung path JSON relatif ke file skrip (stabil di mana pun HTML-nya dibuka)
  function jsonURL(){
    try{
      const base = new URL(document.currentScript.src);
      return new URL('../data/programs.json', base).href;
    }catch(_){
      const p = location.pathname.replace(/[^\/]+$/, '');
      return location.origin + p + 'assets/data/programs.json';
    }
  }

  fetch(jsonURL(), {cache:'no-cache'})
    .then(r => { if (!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
    .then(db => {
      const items = (db[cfg.key] || []).slice(); // clone
      // Urut terbaru dari field "date" (ISO)
      items.sort((a,b) => new Date(b.date) - new Date(a.date));

      // Bangun kartu sesuai template .feature-card
      const html = items.map((it, idx) => `
        <div class="col-xl-4 col-md-6">
          <div class="feature-card">
            <div class="feature-card-icon">
              <img src="assets/img/icon/feature-icon1-${(idx%3)+1}.svg" alt="icon">
            </div>
            <h4 class="feature-card-title">
              <a href="${it.link}" target="_blank" rel="noopener">${it.title}</a>
            </h4>
            <p class="feature-card-text">${it.date_text} • ${it.location}</p>
            <a href="${it.link}" target="_blank" rel="noopener" class="link-btn">
              <span class="link-effect">
                <span class="effect-1">LIHAT DETAIL</span>
                <span class="effect-1">LIHAT DETAIL</span>
              </span>
              <img src="assets/img/icon/arrow-left-top.svg" alt="icon">
            </a>
          </div>
        </div>
      `).join('');

      // Render
      wrap.innerHTML = html;

      // Inisialisasi slick jika belum (pakai jQuery dari template)
      const $wrap = window.jQuery && window.jQuery('#program-carousel');
      if ($wrap && $wrap.length){
        if ($wrap.hasClass('slick-initialized')) $wrap.slick('unslick');
        $wrap.slick({
          slidesToShow: 3,
          dots: true,
          responsive: [
            { breakpoint: 1200, settings: { slidesToShow: 2 } },
            { breakpoint: 992,  settings: { slidesToShow: 2 } },
            { breakpoint: 768,  settings: { slidesToShow: 1 } }
          ]
        });
      }
    })
    .catch(err => {
      console.error('[programs] gagal memuat:', err);
      wrap.innerHTML = '<p class="text-center">Program belum tersedia.</p>';
    });
})();
