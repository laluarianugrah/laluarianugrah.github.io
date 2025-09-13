<script>
// blog-latest-home2.js — untuk home-2 (3 artikel terbaru, style asli Frisk)
(function(){
  function base(){
    const seg = location.pathname.split('/').filter(Boolean);
    const i = seg.indexOf('frisk-v.1.3');
    return (i>-1? '/'+seg.slice(0,i+1).join('/')+'/' : '/frisk-v.1.3/');
  }
  const BASE = base();
  const u = (rel)=> (/^https?:|^\//.test(rel)? rel : (BASE + rel.replace(/^\.?\//,'')));
  const tgl = (d)=>{ try{return new Date(d).toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'})}catch(e){return d} };
  const FB = Array.from({length:12},(_,i)=>`assets/img/ikm/ikm${String(i+1).padStart(2,'0')}.jpg`);

  async function getData(){
    const res = await fetch(u('assets/data/articles.json'), {cache:'no-store'});
    if(!res.ok) throw new Error(res.status);
    return await res.json();
  }

  function card(it, i){
    const img = u(it.image || FB[i%FB.length]);
    const fb  = u(FB[(i+1)%FB.length]);

    // Kolom + markup kartu blog ala Frisk (tanpa ubah CSS-mu)
    return `
    <div class="col-lg-4 col-md-6">
      <div class="blog-grid wow img-custom-anim-up" data-wow-duration="1s" data-wow-delay="${0.1+i*0.1}s">
        <div class="blog-img">
          <a href="${u('blog-details.html')}?slug=${encodeURIComponent(it.slug)}">
            <img src="${img}" alt="blog image" onerror="this.onerror=null;this.src='${fb}'">
          </a>
        </div>
        <div class="blog-content">
          <div class="post-meta-item blog-meta">
            <a href="${u('blog.html')}?cat=${encodeURIComponent(it.category)}">${tgl(it.date)}</a>
            <a href="${u('blog.html')}?cat=${encodeURIComponent(it.category)}">${it.category}</a>
          </div>
          <h4 class="blog-title">
            <a href="${u('blog-details.html')}?slug=${encodeURIComponent(it.slug)}">${it.title}</a>
          </h4>
          <a href="${u('blog-details.html')}?slug=${encodeURIComponent(it.slug)}" class="link-btn">
            <span class="link-effect">
              <span class="effect-1">BACA SELENGKAPNYA</span>
              <span class="effect-1">BACA SELENGKAPNYA</span>
            </span>
            <img src="${u('assets/img/icon/arrow-left-top.svg')}" alt="icon">
          </a>
        </div>
      </div>
    </div>`;
  }

  async function run(){
    // container blog di home-2 kamu = <div class="row" id="blog-cards"></div>
    const wrap = document.getElementById('blog-cards');
    if(!wrap) return;

    try{
      const items = (await getData()).sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,3);
      wrap.innerHTML = items.map(card).join('') || '<p>Artikel belum tersedia.</p>';
      if (typeof WOW!=='undefined') new WOW().init();
    }catch(e){
      console.error('Blog latest error:', e);
      wrap.innerHTML = '<p>Artikel belum tersedia.</p>';
    }
  }

  document.addEventListener('DOMContentLoaded', run);
})();
</script>
