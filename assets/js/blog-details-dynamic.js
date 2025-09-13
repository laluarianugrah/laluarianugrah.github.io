<script>
// blog-details-dynamic.js — render artikel sesuai slug, style asli Frisk
(function(){
  function base(){
    const seg = location.pathname.split('/').filter(Boolean);
    const i = seg.indexOf('frisk-v.1.3');
    return (i>-1? '/'+seg.slice(0,i+1).join('/')+'/' : '/frisk-v.1.3/');
  }
  const BASE = base();
  const u = (rel)=> (/^https?:|^\//.test(rel)? rel : (BASE + rel.replace(/^\.?\//,'')));
  const fmt = (d)=>{ try{return new Date(d).toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'})}catch(e){return d} };
  const FB = Array.from({length:12},(_,i)=>u(`assets/img/ikm/ikm${String(i+1).padStart(2,'0')}.jpg`));

  async function loadJSON(){
    const res = await fetch(u('assets/data/articles.json'), {cache:'no-store'});
    if(!res.ok) throw new Error(res.status);
    return await res.json();
  }

  function el(id){ return document.getElementById(id); }

  async function render(){
    const slug = new URLSearchParams(location.search).get('slug');
    const hero = el('article-hero');
    const date = el('article-date');
    const cat  = el('article-category');
    const auth = el('article-author');
    const title= el('article-title');
    const body = el('article-content');
    const recentBox = el('recent-posts');
    const catList   = el('category-list');
    const bcJenis   = el('bc-jenis');
    const bcJudul   = el('bc-judul');

    try{
      const data = await loadJSON();
      // ======== DETAIL
      const post = data.find(x=>x.slug===slug) || data.sort((a,b)=>new Date(b.date)-new Date(a.date))[0];

      // isi elemen yang SUDAH ADA di template (supaya tidak dobel)
      if (hero) { hero.src = u(post.image || FB[0]); hero.onerror = ()=>{hero.onerror=null;hero.src=FB[1]}; }
      if (date) date.textContent = fmt(post.date);
      if (cat)  { cat.textContent = post.category; cat.href = u(`blog.html?cat=${encodeURIComponent(post.category)}`); }
      if (auth) auth.textContent = 'by Admin'; // placeholder
      if (title) title.textContent = post.title;
      if (body)  body.innerHTML   = post.body_html || '<p>(Dummy) Konten belum diisi.</p>';

      if (bcJenis) { bcJenis.textContent = post.category; bcJenis.href = u(`blog.html?cat=${encodeURIComponent(post.category)}`); }
      if (bcJudul) bcJudul.textContent = post.title;

      // ======== RECENT POSTS (sidebar)
      if (recentBox){
        const recent = data.sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);
        recentBox.innerHTML = recent.map(it=>{
          const img = u(it.image || FB[2]);
          const fb  = FB[3];
          return `
            <div class="sidebar__post-item-two">
              <div class="sidebar__post-thumb-two">
                <a href="${u('blog-details.html')}?slug=${encodeURIComponent(it.slug)}">
                  <img src="${img}" alt="" onerror="this.onerror=null;this.src='${fb}'">
                </a>
              </div>
              <div class="sidebar__post-content-two">
                <span class="date">${fmt(it.date)} • ${it.category}</span>
                <h6 class="title"><a href="${u('blog-details.html')}?slug=${encodeURIComponent(it.slug)}">${it.title}</a></h6>
              </div>
            </div>`;
        }).join('');
      }

      // ======== CATEGORY LIST (sidebar)
      if (catList){
        const counts = data.reduce((m,x)=>{m[x.category]=(m[x.category]||0)+1; return m;}, {});
        const cats = Object.keys(counts);
        catList.innerHTML = cats.map(c=>`
          <li><a href="${u('blog.html')}?cat=${encodeURIComponent(c)}">${c} <span>(${counts[c]})</span></a></li>
        `).join('');
      }
    }catch(e){
      console.error('blog-details-dynamic error:', e);
      if (title) title.textContent = 'Artikel tidak ditemukan';
      if (body)  body.innerHTML = '<p>Data artikel belum tersedia.</p>';
    }
  }

  document.addEventListener('DOMContentLoaded', render);
})();
</script>
