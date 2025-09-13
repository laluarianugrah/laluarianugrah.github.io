// assets/js/policy-hero.js
(function(){
  // Ambil elemen hero
  var $title = document.querySelector('.hero-title');
  var $desc  = document.querySelector('.hero-text');
  if (!$title || !$desc) return;

  // Baca tab dari URL (?tab=regulasi|teknis|publikasi)
  var tab = (new URLSearchParams(location.search).get('tab') || '').toLowerCase();

  // Hitung path JSON relatif thd file skrip (stabil di mana pun HTML dibuka)
  function jsonURL() {
    try {
      var base = new URL(document.currentScript.src);
      return new URL('../data/policy-categories.json', base).href;
    } catch (_) {
      var p = location.pathname.replace(/[^\/]+$/, '');
      return location.origin + p + 'assets/data/policy-categories.json';
    }
  }

  fetch(jsonURL(), { cache: 'no-cache' })
    .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
    .then(function(db){
      var list = (db && db.categories) || [];
      // Cari kategori yg cocok; fallback ke 'regulasi' kalau tab kosong/unknown
      var match = list.find(function(x){ return (x.tab||'').toLowerCase() === tab; }) ||
                  list.find(function(x){ return (x.tab||'').toLowerCase() === 'regulasi'; });

      if (match){
        $title.textContent = match.label;
        $desc.textContent  = match.desc || '';
        // Bonus: set judul halaman (tab browser)
        try { document.title = match.label + ' — Pusat IKM KSB'; } catch(e){}
      }
    })
    .catch(function(err){
      // Kalau JSON gagal, biarkan teks default (aman)
      console.error('[policy-hero] gagal memuat kategori:', err);
    });
})();
