<!-- assets/js/blog-latest.js -->
<script>
(function(){
  // Cari semua container blog-latest di halaman
  function getContainers(){
    const list = [...document.querySelectorAll('[data-blog-latest]')];
    const backup = document.getElementById('home2-blog-row');
    if (backup && !list.includes(backup)) list.push(backup);
    return list;
  }

  // Dapatkan URL absolut ke assets/data/articles.json
  function jsonPathFromScript(){
    try{
      const cs = document.currentScript;
      const base = new URL(cs ? cs.src : window.location.href);
      // blog-latest.js ada di assets/js → JSON ada di assets/data
      return new URL('../data/articles.json', base).href;
    }catch(e){
      const basePath = location.pathname.replace(/[^\/]+$/, ''); // path folder file saat ini
      return location.origin + basePath + 'assets/data/articles.json';
    }
  }

  const JSON_URL = jsonPathFromScript();

  fetch(JSON_URL, {cache:'no-cache'})
    .then(r => { if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
    .then(data => {
      // Gabung semua kategori, sort desc by date
      const all = []
        .concat(data.Berita||[], data.Edukasi||[], data['Kisah Sukses']||[])
        .filter(x => x && x.title && x.slug && x.date)
        .sort((a,b) => new Date(b.date) - new Date(a.date));

      const containers = getContainers();
      containers.forEach(el => {
        const limit = Math.max(1, parseInt(el.getAttribute('data-count')||'3', 10));
        const items = all.slice(0, limit);

        // Markup KARTU = PERSIS gaya home-2 (blog-card)
        el.innerHTML = items.map(item => `
          <div class="col-lg-4 col-md-6">
            <div class="blog-card">
              <div class="blog-img">
                <a href="blog-details.html?slug=${encodeURIComponent(item.slug)}">
                  <img src="${item.image || 'assets/img/blog/blog_1_1.png'}" alt="blog image">
                </a>
              </div>
              <div class="blog-content">
                <div class="post-meta-item blog-meta">
                  <a href="blog-details.html?slug=${encodeURIComponent(item.slug)}">${item.date}</a>
                  <a href="blog.html?cat=${encodeURIComponent(item.category||'')}">${item.category||''}</a>
                </div>
                <h4 class="blog-title">
                  <a href="blog-details.html?slug=${encodeURIComponent(item.slug)}">${item.title}</a>
                </h4>
                <a href="blog-details.html?slug=${encodeURIComponent(item.slug)}" class="link-btn">
                  <span class="link-effect">
                    <span class="effect-1">BACA SELENGKAPNYA</span>
                    <span class="effect-1">BACA SELENGKAPNYA</span>
                  </span>
                  <img src="assets/img/icon/arrow-left-top.svg" alt="icon">
                </a>
              </div>
            </div>
          </div>
        `).join('');

        if (!items.length){
          el.innerHTML = '<p class="text-center">Artikel belum tersedia.</p>';
        }
      });
    })
    .catch(err => {
      console.error('[blog-latest] gagal memuat:', JSON_URL, err);
      getContainers().forEach(el => {
        el.innerHTML = '<p class="text-center">Gagal memuat artikel.</p>';
      });
    });
})();
</script>
