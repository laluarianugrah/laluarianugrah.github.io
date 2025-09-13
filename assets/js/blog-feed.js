<!-- assets/js/blog-feed.js -->
<script>
(function () {
  const JSON_URL = 'assets/data/articles.json'; // pastikan path ini benar

  function fmtDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' });
  }

  function byDateDesc(a, b){ return new Date(b.date) - new Date(a.date); }

  // ======= RENDERER: gaya Home 3 (blog-area-3) =======
  function renderHome3(list, mount){
    if(!mount) return;
    const wrap = document.createElement('div');
    wrap.className = 'blog-grid-static-wrap';
    list.slice(0,3).forEach(p=>{
      wrap.insertAdjacentHTML('beforeend', `
        <div class="blog-grid-static">
          <div class="blog-grid">
            <div class="blog-img">
              <a href="blog-details.html?slug=${encodeURIComponent(p.slug||'')}">
                <img src="${p.image}" alt="blog image">
              </a>
            </div>
            <div class="blog-content">
              <div class="post-meta-item blog-meta">
                <a href="blog.html">${fmtDate(p.date)}</a>
                <a href="blog.html">${p.category||'Wawasan'}</a>
              </div>
              <h4 class="blog-title">
                <a href="blog-details.html?slug=${encodeURIComponent(p.slug||'')}">${p.title}</a>
              </h4>
              <a href="blog-details.html?slug=${encodeURIComponent(p.slug||'')}" class="link-btn">
                <span class="link-effect">
                  <span class="effect-1">READ MORE</span>
                  <span class="effect-1">READ MORE</span>
                </span>
                <img src="assets/img/icon/arrow-left-top.svg" alt="icon">
              </a>
            </div>
          </div>
        </div>`);
    });
    mount.innerHTML = '';
    mount.appendChild(wrap);
  }

  // ======= RENDERER: gaya Home 2 (grid 3 artikel terbaru) =======
  function renderHome2(list, mount){
    if(!mount) return;
    const row = document.createElement('div');
    row.className = 'row gx-40 gy-40';
    list.slice(0,3).forEach(p=>{
      row.insertAdjacentHTML('beforeend', `
        <div class="col-md-6 col-lg-4">
          <div class="blog-card">
            <div class="blog-img"><a href="blog-details.html?slug=${encodeURIComponent(p.slug||'')}">
              <img src="${p.image}" alt="${p.title}"></a>
            </div>
            <div class="blog-content">
              <div class="post-meta-item blog-meta">
                <a href="blog.html">${fmtDate(p.date)}</a>
                <a href="blog.html">${p.category||'Wawasan'}</a>
              </div>
              <h4 class="blog-title"><a href="blog-details.html?slug=${encodeURIComponent(p.slug||'')}">${p.title}</a></h4>
              <a href="blog-details.html?slug=${encodeURIComponent(p.slug||'')}" class="link-btn">
                <span class="link-effect"><span class="effect-1">READ MORE</span><span class="effect-1">READ MORE</span></span>
                <img src="assets/img/icon/arrow-left-top.svg" alt="icon">
              </a>
            </div>
          </div>
        </div>`);
    });
    mount.innerHTML = '';
    mount.appendChild(row);
  }

  // ======= INIT: jalan di dua halaman tanpa error silang =======
  async function init() {
    try{
      const res = await fetch(JSON_URL, {cache:'no-store'});
      const all = (await res.json()).sort(byDateDesc);

      // Home 3
      const h3 = document.querySelector('#blog-latest-home3');
      if (h3) renderHome3(all, h3);

      // Home 2
      const h2 = document.querySelector('#blog-latest-home2');
      if (h2) renderHome2(all, h2);

    }catch(err){
      console.error('Blog feed error:', err);
    }
  }
  document.addEventListener('DOMContentLoaded', init);
})();
</script>
