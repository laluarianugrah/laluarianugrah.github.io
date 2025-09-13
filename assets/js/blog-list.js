// assets/js/blog-list.js
(function () {
  // --- Target DOM ---
  var listWrap      = document.getElementById('blog-list-row');
  var paginationEl  = document.getElementById('pagination');
  var bcTitle       = document.getElementById('breadcumb-title');
  var sidebarRecent = document.getElementById('sidebar-recent');
  var sidebarCats   = document.getElementById('sidebar-cats');

  if (!listWrap || !paginationEl) return;

  // --- Params & util ---
  var params = new URLSearchParams(location.search);
  var CAT    = params.get('cat'); // "Berita" | "Edukasi" | "Kisah Sukses" | null
  var PAGE   = Math.max(parseInt(params.get('page') || '1', 10), 1);

  var PER_PAGE            = 4; // 4 artikel / halaman
  var MAX_PAGINATION_BTNS = 4; // maksimal 4 tombol angka

  function fmt(d){
    try { return new Date(d).toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' }); }
    catch(e){ return d; }
  }

  // fallback thumbnails (assets/img/ikm/ikm01.jpg dst)
  var FB = (function(){
    var arr = [];
    for (var i=1;i<=12;i++) arr.push('assets/img/ikm/ikm'+('0'+i).slice(-2)+'.jpg');
    return arr;
  })();

  // Beberapa path agar fleksibel saat preview lokal
  var JSON_PATHS = [
    'assets/data/articles.json',
    './assets/data/articles.json',
    '/frisk-v.1.3/assets/data/articles.json'
  ];

  function loadArticles(){
    return new Promise(function(resolve, reject){
      (function tryNext(i){
        if (i >= JSON_PATHS.length) return reject(new Error('articles.json tidak ditemukan (assets/data/articles.json)'));
        fetch(JSON_PATHS[i], {cache:'no-store'}).then(function(r){
          if (!r.ok) return tryNext(i+1);
          return r.json().then(resolve);
        }).catch(function(){ tryNext(i+1); });
      })(0);
    });
  }

  // --- Builder kartu list utama (gaya Frisk) ---
  function buildItem(it, idx){
    var img  = it.image || FB[idx % FB.length];
    var href = 'blog-details.html?slug=' + encodeURIComponent(it.slug);
    var catH = 'blog.html?cat=' + encodeURIComponent(it.category || '');
    return ''
      + '<div class="col-md-12">'
      +   '<div class="blog-post-item">'
      +     '<div class="blog-post-thumb">'
      +       '<a href="'+href+'">'
      +         '<img src="'+img+'" alt="'+(it.title||'')+'" loading="lazy"'
      +         ' onerror="this.onerror=null;this.src=\''+FB[(idx+1)%FB.length]+'\'">'
      +       '</a>'
      +     '</div>'
      +     '<div class="blog-post-content">'
      +       '<div class="blog-post-meta"><ul class="list-wrap">'
      +         '<li>'+fmt(it.date)+'</li>'
      +         '<li><a href="'+catH+'">'+(it.category||'-')+'</a></li>'
      +       '</ul></div>'
      +       '<h2 class="title"><a href="'+href+'">'+(it.title||'-')+'</a></h2>'
      +       '<a href="'+href+'" class="link-btn">'
      +         '<span class="link-effect">'
      +           '<span class="effect-1">BACA SELENGKAPNYA</span>'
      +           '<span class="effect-1">BACA SELENGKAPNYA</span>'
      +         '</span>'
      +         '<img src="assets/img/icon/arrow-left-top.svg" alt="icon">'
      +       '</a>'
      +     '</div>'
      +   '</div>'
      + '</div>';
  }

  function setBreadcrumb(category){
    if (bcTitle) bcTitle.textContent = category ? ('Wawasan: ' + category) : 'Semua Wawasan';
  }

  function buildPagination(totalPages, current){
    paginationEl.innerHTML = '';
    if (totalPages <= 1) return;

    function mkLi(label, target, extra){
      if (!extra) extra = '';
      var url = new URL(location.href);
      if (target <= 1) url.searchParams.delete('page'); else url.searchParams.set('page', target);
      return '<li class="page-item '+extra+'"><a class="page-link" href="'+(url.pathname + url.search)+'">'+label+'</a></li>';
    }

    if (current > 1) paginationEl.insertAdjacentHTML('beforeend', mkLi('<i class="fas fa-arrow-left"></i>', current-1, 'prev-page'));

    var start=1, end=totalPages;
    if (totalPages > MAX_PAGINATION_BTNS){
      var half = Math.floor(MAX_PAGINATION_BTNS/2);
      start = Math.max(1, current - half);
      end   = start + MAX_PAGINATION_BTNS - 1;
      if (end > totalPages){ end = totalPages; start = end - MAX_PAGINATION_BTNS + 1; }
    }

    for (var p=start; p<=end; p++){
      paginationEl.insertAdjacentHTML('beforeend', mkLi(String(p), p, (p===current?'active':'')));
    }

    if (current < totalPages) paginationEl.insertAdjacentHTML('beforeend', mkLi('<i class="fas fa-arrow-right"></i>', current+1, 'next-page'));
  }

  // --- Sidebar: Artikel Terbaru (top-5 global) ---
  function fillSidebarRecent(all){
    if (!sidebarRecent) return;
    var recent = all.slice().sort(function(a,b){ return new Date(b.date)-new Date(a.date); }).slice(0,5);
    var html = '';
    for (var i=0;i<recent.length;i++){
      var it = recent[i];
      html += ''
        + '<div class="sidebar__post-item">'
        +   '<div class="sidebar__post-thumb">'
        +     '<a href="blog-details.html?slug='+encodeURIComponent(it.slug)+'"><img src="'+(it.image||FB[0])+'" alt="'+(it.title||'')+'"></a>'
        +   '</div>'
        +   '<div class="sidebar__post-content">'
        +     '<h5 class="title"><a href="blog-details.html?slug='+encodeURIComponent(it.slug)+'">'+(it.title||'-')+'</a></h5>'
        +     '<span class="date"><i class="flaticon-time"></i>'+fmt(it.date)+'</span>'
        +   '</div>'
        + '</div>';
    }
    sidebarRecent.innerHTML = html;
  }

  // ===== Sidebar: Kategori (judul = .title; isi = kartu "Artikel Terbaru"; animasi smooth) =====
  function fillSidebarCats(all, currentCat){
    if (!sidebarCats) return;

    // group by category
    var byCat = {};
    for (var i=0;i<all.length;i++){
      var key = (all[i].category || '').trim();
      if (!key) continue;
      if (!byCat[key]) byCat[key] = [];
      byCat[key].push(all[i]);
    }
    // sort per kategori (terbaru dulu)
    for (var k in byCat){
      byCat[k].sort(function(a,b){ return new Date(b.date) - new Date(a.date); });
    }

    // render top-level (sembunyikan kategori aktif)
    var cats = Object.keys(byCat)
      .filter(function(c){ return !currentCat || c !== currentCat; })
      .sort(function(a,b){ return a.localeCompare(b,'id'); });

    var html = '';
    for (var c=0;c<cats.length;c++){
      var cat   = cats[c];
      var count = byCat[cat].length;

      html += ''
        + '<li>'
        +   '<h5 class="title"><a href="#" class="cat-toggle" data-cat="'+cat+'">'+cat+' ('+count+')</a></h5>'
        +   '<ul class="list-wrap cat-sub" data-cat="'+cat+'" style="display:none; max-height:0; opacity:0;"></ul>'
        + '</li>';
    }
    sidebarCats.innerHTML = html;

    // builder kartu mini ala "Artikel Terbaru"
    function card(it){
      var img  = it.image || FB[0];
      var href = 'blog-details.html?slug='+encodeURIComponent(it.slug);
      return ''
        + '<li>'
        +   '<div class="sidebar__post-item">'
        +     '<div class="sidebar__post-thumb">'
        +       '<a href="'+href+'"><img src="'+img+'" alt="'+(it.title||'')+'"></a>'
        +     '</div>'
        +     '<div class="sidebar__post-content">'
        +       '<h5 class="title"><a href="'+href+'">'+(it.title||'-')+'</a></h5>'
        +       '<span class="date"><i class="flaticon-time"></i>'+fmt(it.date)+'</span>'
        +     '</div>'
        +   '</div>'
        + '</li>';
    }

    // inject sublist (top 4 + actions)
    var subs = sidebarCats.querySelectorAll('.cat-sub');
    for (var s=0;s<subs.length;s++){
      var catName = subs[s].getAttribute('data-cat');
      var arr     = byCat[catName] || [];
      var inner   = '';
      var top4    = arr.slice(0,4);
      for (var j=0;j<top4.length;j++) inner += card(top4[j]);
      if (arr.length > 4){
        inner += '<li class="cat-actions">'
               +   '<a href="#" class="show-more" data-cat="'+catName+'">Tampilkan lagi</a>'
               +   '<a href="#" class="hide-sub"  data-cat="'+catName+'" style="display:none">Tutup</a>'
               + '</li>';
      }
      subs[s].innerHTML = inner;
    }

    function subOf(cat){
      var subs = sidebarCats.querySelectorAll('.cat-sub');
      for (var i=0;i<subs.length;i++){
        if (subs[i].getAttribute('data-cat') === cat) return subs[i];
      }
      return null;
    }

    // toggle + show-more/hide (smooth)
    sidebarCats.addEventListener('click', function(e){
      var a = e.target.closest('a'); if (!a) return;

      if (a.classList.contains('cat-toggle')){
        e.preventDefault();
        var li  = a.closest('li');
        var sub = li ? li.querySelector('.cat-sub') : null;
        if (!sub) return;

        if (li.classList.contains('open')){
          // CLOSE
          sub.style.maxHeight = '0px';
          sub.style.opacity   = '0';
          setTimeout(function(){ sub.style.display = 'none'; }, 560);
          li.classList.remove('open');
        } else {
          // OPEN
          sub.style.display = 'block';
          requestAnimationFrame(function(){
            sub.style.maxHeight = sub.scrollHeight + 'px';
            sub.style.opacity   = '1';
          });
          li.classList.add('open');
        }
      }

      if (a.classList.contains('show-more')){
        e.preventDefault();
        var cat  = a.getAttribute('data-cat');
        var sub  = subOf(cat);
        var arr  = byCat[cat] || [];
        var more = arr.slice(4);
        var add  = '';
        for (var i=0;i<more.length;i++) add += card(more[i]);
        var actionsLi = sub ? sub.querySelector('.cat-actions') : null;
        if (actionsLi){
          actionsLi.insertAdjacentHTML('beforebegin', add);
          a.style.display = 'none';
          var closeBtn = actionsLi.querySelector('.hide-sub');
          if (closeBtn) closeBtn.style.display = '';
          sub.style.maxHeight = sub.scrollHeight + 'px'; // resize smooth
        }
      }

      if (a.classList.contains('hide-sub')){
        e.preventDefault();
        var cat  = a.getAttribute('data-cat');
        var sub  = subOf(cat);
        var arr  = byCat[cat] || [];
        if (sub){
          var inner = '';
          var top4  = arr.slice(0,4);
          for (var i=0;i<top4.length;i++) inner += card(top4[i]);
          if (arr.length > 4){
            inner += '<li class="cat-actions">'
                   +   '<a href="#" class="show-more" data-cat="'+cat+'">Tampilkan lagi</a>'
                   +   '<a href="#" class="hide-sub"  data-cat="'+cat+'" style="display:none">Tutup</a>'
                   + '</li>';
          }
          sub.innerHTML = inner;
          sub.style.display = 'block';
          requestAnimationFrame(function(){
            sub.style.maxHeight = sub.scrollHeight + 'px';
            sub.style.opacity   = '1';
          });
        }
      }
    });
  }

  // --- RUN ---
  function run(){
    loadArticles().then(function(all){
      // filter + sort
      var data = all.slice();
      if (CAT) data = data.filter(function(x){ return x.category === CAT; });
      data.sort(function(a,b){ return new Date(b.date)-new Date(a.date); });

      // paging
      var total      = data.length;
      var totalPages = Math.max(Math.ceil(total / PER_PAGE), 1);
      var cur        = Math.min(PAGE, totalPages);
      var from       = (cur - 1) * PER_PAGE;
      var to         = from + PER_PAGE;

      setBreadcrumb(CAT);
      if (total){
        var html = '';
        for (var i=from;i<Math.min(to,total);i++) html += buildItem(data[i], i);
        listWrap.innerHTML = html;
      } else {
        listWrap.innerHTML = '<p>Belum ada artikel pada kategori ini.</p>';
      }
      buildPagination(totalPages, cur);

      // sidebar
      fillSidebarRecent(all);
      fillSidebarCats(all, CAT);

      if (typeof WOW !== 'undefined') try{ new WOW().init(); }catch(e){}
    }).catch(function(e){
      console.error(e);
      listWrap.innerHTML = '<p>Gagal memuat artikel.</p>';
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
