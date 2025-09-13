// assets/js/program-cats.js
(function(){
  const listEl = document.getElementById('program-cats-list');
  if (!listEl) return;

  const currentTab = (new URLSearchParams(location.search).get('tab') || 'kalender').toLowerCase();

  // Path JSON stabil relatif terhadap file skrip (bukan halaman)
  function jsonURL(){
    try {
      const base = new URL(document.currentScript.src);
      return new URL('../data/program-categories.json', base).href;
    } catch (_) {
      const p = location.pathname.replace(/[^\/]+$/, '');
      return location.origin + p + 'assets/data/program-categories.json';
    }
  }

  fetch(jsonURL(), {cache:'no-cache'})
    .then(r => { if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
    .then(db => {
      const cats = (db.categories || []).filter(c => c && c.tab && c.label && c.href);

      // Saring: tampilkan SEMUA kategori KECUALI tab aktif
      const others = cats.filter(c => c.tab.toLowerCase() !== currentTab);

      if (!others.length) {
        listEl.innerHTML = '<li class="single-award-list"><div class="award-details"><p>Kategori lain belum tersedia.</p></div></li>';
        return;
      }

      // Bangun item sesuai gaya .single-award-list template
      listEl.innerHTML = others.map(c => `
        <li class="single-award-list">
          <span class="award-year">${c.label.substring(0,1).toUpperCase()}</span>
          <div class="award-details">
            <h4><a href="${c.href}">${c.label}</a></h4>
            <p>${c.desc || 'Lihat detail program terkait.'}</p>
          </div>
          <span class="award-tag">Kunjungi</span>
        </li>
      `).join('');
    })
    .catch(err => {
      console.error('[program-cats] gagal memuat:', err);
      listEl.innerHTML = '<li class="single-award-list"><div class="award-details"><p>Gagal memuat kategori.</p></div></li>';
    });
})();
