// assets/js/policy-list.js
(function(){
  var wrap = document.getElementById('policy-list');
  if (!wrap) return;

  var tab = (new URLSearchParams(location.search).get('tab') || 'regulasi').toLowerCase();
  var mapHref = {
    regulasi: 'regulasi-peraturan.html',
    teknis:   'dokumen-teknis.html',
    publikasi:'publikasi-resmi.html'
  };

  function jsonURL(){
    try {
      var base = new URL(document.currentScript.src);
      return new URL('../data/policies.json', base).href;
    } catch(_) {
      var p = location.pathname.replace(/[^\/]+$/, '');
      return location.origin + p + 'assets/data/policies.json';
    }
  }

  fetch(jsonURL(), {cache:'no-cache'})
    .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
    .then(function(db){
      var list = [];
      if (tab === 'regulasi')   list = db.regulasi || [];
      else if (tab === 'teknis')list = db.teknis || [];
      else if (tab === 'publikasi') list = db.publikasi || [];
      else list = (db.regulasi || []);

      if (!list.length){
        wrap.innerHTML = '<div class="col-12 text-center"><p>Belum ada dokumen pada kategori ini.</p></div>';
        return;
      }

      var html = list.map(function(item, idx){
        var imgIdx = (idx % 10) + 1; // 1..10
        var catHref = mapHref[tab] || 'kebijakan.html';
        var groupHref = 'kebijakan.html'; // induk

        return `
          <div class="col-xl-6 col-lg-6">
            <div class="portfolio-wrap">
              <div class="portfolio-thumb">
                <a href="${item.pdf_url}" target="_blank" rel="noopener">
                  <img src="assets/img/portfolio/portfolio4_${imgIdx}.png" alt="Dokumen ${item.title}">
                </a>
              </div>
              <div class="portfolio-details">
                <h3 class="portfolio-title mb-3">
                  <a href="${item.pdf_url}" target="_blank" rel="noopener">${item.title}</a>
                </h3>
                <ul class="portfolio-meta">
                  <li><a href="${groupHref}">Kebijakan &amp; Dokumen</a></li>
                  <li><a href="${catHref}">${item.category}</a></li>
                </ul>
              </div>
            </div>
          </div>
        `;
      }).join('');

      wrap.innerHTML = html;
    })
    .catch(function(err){
      console.error('[policy-list] gagal memuat:', err);
      wrap.innerHTML = '<div class="col-12 text-center"><p>Terjadi kesalahan memuat dokumen.</p></div>';
    });
})();
