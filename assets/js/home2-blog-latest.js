(function () {
  const grid = document.getElementById('home2-blog-row');
  if (!grid) return;

  const fmtDate = (d) => {
    try {
      return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch (_) {
      return d;
    }
  };

  const FALLBACKS = Array.from({ length: 12 }, (_, i) => `assets/img/ikm/ikm${String(i + 1).padStart(2, '0')}.jpg`);

  // Coba beberapa path supaya kompatibel kalau nanti folder dipindah
  const CANDIDATES = [
    'assets/data/articles.json',
    './assets/data/articles.json',
    '../assets/data/articles.json',
    '/frisk-v.1.3/assets/data/articles.json'
  ];

  async function loadArticles() {
    for (const url of CANDIDATES) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          console.log('Home2Blog: load', data.length, 'artikel dari', url);
          return data;
        } else {
          console.warn('Home2Blog: tidak ketemu', url, res.status);
        }
      } catch (e) {
        console.warn('Home2Blog: gagal fetch', url, e.message);
      }
    }
    throw new Error('Home2Blog: articles.json tidak ditemukan. Pastikan berada di assets/data/articles.json');
  }

  function card(it, idx) {
    const img = it.image || FALLBACKS[idx % FALLBACKS.length];
    const date = fmtDate(it.date || '');
    const cat = it.category || '-';
    const slug = encodeURIComponent(it.slug || '');
    const catHref = `blog.html?cat=${encodeURIComponent(cat)}`;

    // Markup kartu persis gaya Frisk (anchor .blog-card.style2)
    return `
      <div class="col-lg-4 col-md-6">
        <a href="blog-details.html?slug=${slug}" class="blog-card style2 wow img-custom-anim-right" data-wow-duration="1s" data-wow-delay="${0.1 + idx * 0.1}s">
          <div class="blog-img">
            <img src="${img}" alt="blog image" onerror="this.onerror=null;this.src='${FALLBACKS[(idx + 1) % FALLBACKS.length]}'">
          </div>
          <div class="blog-content">
            <div class="post-meta-item blog-meta">
              <span>${date}</span>
              <span><a href="${catHref}">${cat}</a></span>
            </div>
            <h4 class="blog-title">${it.title || '-'}</h4>
            <span class="link-btn">
              <span class="link-effect">
                <span class="effect-1">READ MORE</span>
                <span class="effect-1">READ MORE</span>
              </span>
              <img src="assets/img/icon/arrow-left-top.svg" alt="icon">
            </span>
          </div>
        </a>
      </div>
    `;
  }

  async function run() {
    try {
      const items = await loadArticles();
      items.sort((a, b) => new Date(b.date) - new Date(a.date));
      const latest = items.slice(0, 3);
      grid.innerHTML = latest.map(card).join('') || '<p>Artikel belum tersedia.</p>';
      if (typeof WOW !== 'undefined') new WOW().init();
    } catch (e) {
      console.error(e);
      grid.innerHTML = '<p>Gagal memuat artikel. Cek console.</p>';
    }
  }

  document.addEventListener('DOMContentLoaded', run);
})();
