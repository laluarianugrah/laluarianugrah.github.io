<script>
/* home2-blog.js — isi 3 artikel terbaru dengan markup "blog-card style2" bawaan Frisk */
(function(){
  const row = document.getElementById('home2-blog-row');
  if(!row) return;

  const fmt = d => { try { return new Date(d).toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'}) } catch(e){ return d } };

  function card(it, i){
    return `
    <div class="col-lg-4 col-md-6">
      <a href="blog-details.html?slug=${encodeURIComponent(it.slug)}" class="blog-card style2 wow img-custom-anim-up" data-wow-duration="1s" data-wow-delay="${0.1 + i*0.1}s">
        <div class="blog-img">
          <img src="${it.image}" alt="blog image" onerror="this.onerror=null;this.src='assets/img/ikm/ikm0${(i%9)+1}.jpg'">
        </div>
        <div class="blog-content">
          <div class="post-meta-item blog-meta">
            <span>${fmt(it.date)}</span>
            <span>${it.category}</span>
          </div>
          <h4 class="blog-title">${it.title}</h4>
          <span class="link-btn">
            <span class="link-effect">
              <span class="effect-1">READ MORE</span>
              <span class="effect-1">READ MORE</span>
            </span>
            <img src="assets/img/icon/arrow-left-top.svg" alt="icon">
          </span>
        </div>
      </a>
    </div>`;
  }

  async function run(){
    try {
      const res = await fetch('assets/data/articles.json', {cache:'no-store'});
      if(!res.ok) throw new Error(res.status);
      const data = await res.json();
      data.sort((a,b)=> new Date(b.date)-new Date(a.date));
      row.innerHTML = data.slice(0,3).map(card).join('');
      if (typeof WOW!=='undefined') new WOW().init();
    } catch(e) {
      row.innerHTML = '<p>Artikel belum tersedia.</p>';
      console.error(e);
    }
  }
  document.addEventListener('DOMContentLoaded', run);
})();
</script>
