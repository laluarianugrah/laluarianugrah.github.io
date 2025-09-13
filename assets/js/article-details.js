// assets/js/article-details.js
(function () {
  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return document.querySelectorAll(sel); };

  var BC      = $('#bc');
  var COVER   = $('#article-cover');
  var META    = $('#article-meta');
  var TITLE   = $('#article-title');
  var BODY    = $('#article-body');
  var SID_REC = $('#sidebar-recent');
  var SID_CAT = $('#sidebar-cats');
  var SHARE   = $('#share-links');
  var PREVNXT = $('#prevnext');
  var C_LIST  = $('#comments-list');
  var C_COUNT = $('#comment-count');
  var C_FORM  = $('#comment-form');

  var params = new URLSearchParams(location.search);
  var SLUG   = params.get('slug') || '';

  // Coba beberapa path agar aman di file://, Live Server, atau folder frisk-v.1.3/
  var JSON_PATHS = [
    'assets/data/articles.json',
    './assets/data/articles.json',
    '/frisk-v.1.3/assets/data/articles.json'
  ];

  function fetchJSON(paths) {
    return new Promise(function (resolve, reject) {
      (function next(i) {
        if (i >= paths.length) return reject(new Error('articles.json tidak ditemukan'));
        fetch(paths[i], { cache: 'no-store' })
          .then(function (r) { return r.ok ? r.json() : next(i + 1); })
          .then(function (j) { if (j) resolve(j); })
          .catch(function () { next(i + 1); });
      })(0);
    });
  }

  function fmt(d) {
    try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }); }
    catch (e) { return d || ''; }
  }

  // fallback thumbnail
  var FB_THUMBS = (function () {
    var a = [];
    for (var i = 1; i <= 12; i++) a.push('assets/img/ikm/ikm' + ('0' + i).slice(-2) + '.jpg');
    return a;
  })();

  // ==== NORMALIZER KONTEN (FIX UTAMA) ====
  function pickContent(a) {
    if (!a) return null;
    if (a.body_html) return a.body_html;   // <<— INI YANG KURANG SEBELUMNYA
    if (a.html)      return a.html;
    if (a.content)   return a.content;
    if (a.body)      return a.body;
    if (a.paragraphs) return a.paragraphs;
    if (a.text)      return a.text;
    if (a.excerpt)   return a.excerpt;
    return null;
  }

  function renderBreadcrumb(cat, title) {
    if (!BC) return;
    var urlCat = 'blog.html?cat=' + encodeURIComponent(cat || '');
    BC.innerHTML =
      '<li><a href="blog.html">Wawasan</a></li>' +
      '<li><a href="' + urlCat + '">' + (cat || '-') + '</a></li>' +
      '<li>' + (title || '-') + '</li>';
  }

  function renderMeta(date, cat, author) {
    if (!META) return;
    var urlCat = 'blog.html?cat=' + encodeURIComponent(cat || '');
    var by     = author ? ('<li><a href="#">oleh ' + author + '</a></li>') : '';
    META.innerHTML =
      '<li>' + fmt(date) + '</li>' +
      '<li><a href="' + urlCat + '">' + (cat || '-') + '</a></li>' +
      by;
  }

  function renderBody(content) {
    if (!BODY) return;
    BODY.innerHTML = '';

    if (!content) {
      BODY.innerHTML = '<p>(Konten artikel belum tersedia.)</p>';
      return;
    }

    // Array paragraf
    if (Array.isArray(content)) {
      content.forEach(function (p) {
        var s = String(p || '').trim(); if (!s) return;
        var m = s.match(/^!\[(.*?)\]\((.*?)\)$/);
        if (m) {
          BODY.insertAdjacentHTML('beforeend',
            '<div class="blog__details-inner-thumb mb-20"><img src="' + m[2] + '" alt="' + (m[1] || '') + '"></div>');
        } else {
          BODY.insertAdjacentHTML('beforeend', '<p>' + s + '</p>');
        }
      });
      return;
    }

    // String: kalau sudah HTML, langsung pasang; kalau plain text, split \n\n
    var str = String(content);
    if (/<\/?(p|img|h[1-6]|ul|ol|li|figure|figcaption|strong|em|a)\b/i.test(str)) {
      BODY.insertAdjacentHTML('beforeend', str);
    } else {
      str.split(/\n{2,}/).forEach(function (s) {
        s = s.trim(); if (!s) return;
        var m = s.match(/^!\[(.*?)\]\((.*?)\)$/);
        if (m) {
          BODY.insertAdjacentHTML('beforeend',
            '<div class="blog__details-inner-thumb mb-20"><img src="' + m[2] + '" alt="' + (m[1] || '') + '"></div>');
        } else {
          BODY.insertAdjacentHTML('beforeend', '<p>' + s + '</p>');
        }
      });
    }
  }

  function fillSidebarRecent(all) {
    if (!SID_REC) return;
    var rec = all.slice().sort(function (a, b) { return new Date(b.date) - new Date(a.date); }).slice(0, 5);
    var html = '';
    rec.forEach(function (it) {
      var href = 'blog-details.html?slug=' + encodeURIComponent(it.slug);
      var img  = it.image || FB_THUMBS[0];
      html +=
        '<div class="sidebar__post-item">' +
          '<div class="sidebar__post-thumb"><a href="' + href + '"><img src="' + img + '" alt="' + (it.title || '') + '"></a></div>' +
          '<div class="sidebar__post-content">' +
            '<h5 class="title"><a href="' + href + '">' + (it.title || '-') + '</a></h5>' +
            '<span class="date"><i class="flaticon-time"></i>' + fmt(it.date) + '</span>' +
          '</div>' +
        '</div>';
    });
    SID_REC.innerHTML = html;
  }

  function fillSidebarCats(all) {
    if (!SID_CAT) return;
    var by = {};
    all.forEach(function (x) {
      var c = (x.category || '').trim();
      if (!c) return;
      (by[c] = by[c] || []).push(x);
    });
    Object.keys(by).forEach(function (k) {
      by[k].sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
    });

    var cats = Object.keys(by).sort(function (a, b) { return a.localeCompare(b, 'id'); });
    var html = '';
    cats.forEach(function (c) {
      var count = by[c].length;
      html +=
        '<li>' +
          '<h5 class="title"><a href="#" class="cat-toggle" data-cat="' + c + '">' + c + ' (' + count + ')</a></h5>' +
          '<ul class="list-wrap cat-sub" data-cat="' + c + '" style="display:none; max-height:0; opacity:0;"></ul>' +
        '</li>';
    });
    SID_CAT.innerHTML = html;

    function card(it) {
      var href = 'blog-details.html?slug=' + encodeURIComponent(it.slug);
      var img  = it.image || FB_THUMBS[0];
      return (
        '<li>' +
          '<div class="sidebar__post-item">' +
            '<div class="sidebar__post-thumb"><a href="' + href + '"><img src="' + img + '" alt="' + (it.title || '') + '"></a></div>' +
            '<div class="sidebar__post-content">' +
              '<h5 class="title"><a href="' + href + '">' + (it.title || '-') + '</a></h5>' +
              '<span class="date"><i class="flaticon-time"></i>' + fmt(it.date) + '</span>' +
            '</div>' +
          '</div>' +
        '</li>'
      );
    }

    function subOf(cat) {
      var subs = $$('#sidebar-cats .cat-sub');
      for (var i = 0; i < subs.length; i++) if (subs[i].getAttribute('data-cat') === cat) return subs[i];
      return null;
    }

    // Isi awal 4 item per kategori
    $$('#sidebar-cats .cat-sub').forEach(function (ul) {
      var name = ul.getAttribute('data-cat');
      var arr  = by[name] || [];
      var inner = '';
      arr.slice(0, 4).forEach(function (it) { inner += card(it); });
      if (arr.length > 4) {
        inner += '<li class="cat-actions">' +
                   '<a href="#" class="show-more" data-cat="' + name + '">Tampilkan lagi</a>' +
                   '<a href="#" class="hide-sub" data-cat="' + name + '" style="display:none">Tutup</a>' +
                 '</li>';
      }
      ul.innerHTML = inner;
    });

    SID_CAT.addEventListener('click', function (e) {
      var a = e.target.closest('a'); if (!a) return;

      if (a.classList.contains('cat-toggle')) {
        e.preventDefault();
        var li = a.closest('li'); if (!li) return;
        var sub = li.querySelector('.cat-sub'); if (!sub) return;

        if (li.classList.contains('open')) {
          sub.style.maxHeight = '0px'; sub.style.opacity = '0';
          setTimeout(function () { sub.style.display = 'none'; }, 400);
          li.classList.remove('open');
        } else {
          sub.style.display = 'block';
          requestAnimationFrame(function () {
            sub.style.maxHeight = sub.scrollHeight + 'px';
            sub.style.opacity = '1';
          });
          li.classList.add('open');
        }
      }

      if (a.classList.contains('show-more')) {
        e.preventDefault();
        var cat = a.getAttribute('data-cat');
        var sub = subOf(cat);
        var arr = by[cat] || [];
        var more = arr.slice(4);
        var add = '';
        more.forEach(function (it) { add += card(it); });

        var actions = sub ? sub.querySelector('.cat-actions') : null;
        if (actions) {
          actions.insertAdjacentHTML('beforebegin', add);
          a.style.display = 'none';
          var closeBtn = actions.querySelector('.hide-sub');
          if (closeBtn) closeBtn.style.display = '';
          sub.style.maxHeight = sub.scrollHeight + 'px';
        }
      }

      if (a.classList.contains('hide-sub')) {
        e.preventDefault();
        var cat = a.getAttribute('data-cat');
        var sub = subOf(cat);
        var arr = by[cat] || [];
        var inner = '';
        arr.slice(0, 4).forEach(function (it) { inner += card(it); });
        if (arr.length > 4) {
          inner += '<li class="cat-actions">' +
                     '<a href="#" class="show-more" data-cat="' + cat + '">Tampilkan lagi</a>' +
                     '<a href="#" class="hide-sub" data-cat="' + cat + '" style="display:none">Tutup</a>' +
                   '</li>';
        }
        if (sub) {
          sub.innerHTML = inner;
          sub.style.display = 'block';
          requestAnimationFrame(function () {
            sub.style.maxHeight = sub.scrollHeight + 'px';
            sub.style.opacity = '1';
          });
        }
      }
    });
  }

  function buildShare(title) {
    if (!SHARE) return;
    var url = location.href;
    var txt = title ? (title + ' | Pusat IKM KSB') : 'Pusat IKM KSB';
    var fb  = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url);
    var li  = 'https://www.linkedin.com/shareArticle?mini=true&url=' + encodeURIComponent(url) + '&title=' + encodeURIComponent(txt);
    var tw  = 'https://twitter.com/intent/tweet?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(txt);
    var wa  = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(txt + ' ' + url);
    SHARE.innerHTML =
      '<a href="' + fb + '" target="_blank" rel="noopener"><span class="link-effect"><span class="effect-1"><i class="fab fa-facebook"></i></span><span class="effect-1"><i class="fab fa-facebook"></i></span></span></a>' +
      '<a href="' + li + '" target="_blank" rel="noopener"><span class="link-effect"><span class="effect-1"><i class="fab fa-linkedin"></i></span><span class="effect-1"><i class="fab fa-linkedin"></i></span></span></a>' +
      '<a href="' + tw + '" target="_blank" rel="noopener"><span class="link-effect"><span class="effect-1"><i class="fab fa-twitter"></i></span><span class="effect-1"><i class="fab fa-twitter"></i></span></span></a>' +
      '<a href="' + wa + '" target="_blank" rel="noopener"><span class="link-effect"><span class="effect-1"><i class="fab fa-whatsapp"></i></span><span class="effect-1"><i class="fab fa-whatsapp"></i></span></span></a>';
  }

  function buildPrevNext(all, cur) {
    if (!PREVNXT) return;
    var same = all
      .filter(function (x) { return x.category === cur.category; })
      .sort(function (a, b) { return new Date(a.date) - new Date(b.date); }); // kronologis

    var idx = same.findIndex(function (x) { return x.slug === cur.slug; });
    var prev = idx > 0 ? same[idx - 1] : null;
    var next = (idx >= 0 && idx < same.length - 1) ? same[idx + 1] : null;

    var html = '';
    if (prev) {
      html += '<a href="blog-details.html?slug=' + encodeURIComponent(prev.slug) + '" class="nav-btn">' +
              '<i class="fa fa-arrow-left"></i> <span><span class="link-effect">' +
              '<span class="effect-1">' + (prev.title || 'Artikel Sebelumnya') + '</span>' +
              '<span class="effect-1">' + (prev.title || 'Artikel Sebelumnya') + '</span>' +
              '</span></span></a>';
    }
    if (next) {
      html += '<a href="blog-details.html?slug=' + encodeURIComponent(next.slug) + '" class="nav-btn">' +
              '<span><span class="link-effect">' +
              '<span class="effect-1">' + (next.title || 'Artikel Berikutnya') + '</span>' +
              '<span class="effect-1">' + (next.title || 'Artikel Berikutnya') + '</span>' +
              '</span></span><i class="fa fa-arrow-right"></i></a>';
    }
    PREVNXT.innerHTML = html;
  }

  // ===== Komentar (localStorage demo) =====
  function lsKey(slug) { return 'comments:' + slug; }
  function loadComments(slug) {
    try { return JSON.parse(localStorage.getItem(lsKey(slug)) || '[]'); } catch (e) { return []; }
  }
  function saveComments(slug, arr) {
    try { localStorage.setItem(lsKey(slug), JSON.stringify(arr)); } catch (e) {}
  }
  function emailValid(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); }
  function escapeHTML(s) { return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  function renderComments(slug) {
    var arr = loadComments(slug);
    if (C_COUNT) C_COUNT.textContent = arr.length + ' Komentar';
    if (!C_LIST) return;
    C_LIST.innerHTML = arr.map(function (c) { return commentItem(slug, c); }).join('');
  }

  function commentItem(slug, c) {
    var d = fmt(c.date);
    var replies = (c.replies || []).map(function (r) { return replyItem(slug, c.id, r); }).join('');
    return '<li data-id="' + c.id + '">' +
      '<div class="comments-box">' +
        '<div class="comments-avatar"><img src="assets/img/blog/comment01.png" alt="avatar"></div>' +
        '<div class="comments-text">' +
          '<div class="avatar-name"><span class="date">' + d + '</span><h6 class="name">' + escapeHTML(c.name) + '</h6></div>' +
          '<p>' + escapeHTML(c.message) + '</p>' +
          '<div class="d-flex gap-3">' +
            '<a href="#" class="link-btn reply-btn"><span class="link-effect"><span class="effect-1">BALAS</span><span class="effect-1">BALAS</span></span><img src="assets/img/icon/arrow-left-top.svg" alt="icon"></a>' +
            (canDelete(c) ? '<a href="#" class="link-btn delete-btn text-danger"><span class="link-effect"><span class="effect-1">HAPUS</span><span class="effect-1">HAPUS</span></span></a>' : '') +
          '</div>' +
        '</div>' +
      '</div>' +
      (replies ? '<ul class="children">' + replies + '</ul>' : '') +
    '</li>';
  }

  function replyItem(slug, parentId, r) {
    var d = fmt(r.date);
    return '<li data-id="' + r.id + '" data-parent="' + parentId + '">' +
      '<div class="comments-box">' +
        '<div class="comments-avatar"><img src="assets/img/blog/comment02.png" alt="avatar"></div>' +
        '<div class="comments-text">' +
          '<div class="avatar-name"><span class="date">' + d + '</span><h6 class="name">' + escapeHTML(r.name) + '</h6></div>' +
          '<p>' + escapeHTML(r.message) + '</p>' +
          (canDelete(r) ? '<a href="#" class="link-btn delete-btn text-danger"><span class="link-effect"><span class="effect-1">HAPUS</span><span class="effect-1">HAPUS</span></span></a>' : '') +
        '</div>' +
      '</div>' +
    '</li>';
  }

  function canDelete(c) {
    try {
      var me = localStorage.getItem('me:email') || '';
      return me && c.email && c.email.toLowerCase() === me.toLowerCase();
    } catch (e) { return false; }
  }

  function showReplyForm(parentLI, parentId, slug) {
    var old = parentLI.querySelector('.reply-form-inline');
    if (old) old.remove();

    var wrap = document.createElement('div');
    wrap.className = 'reply-form-inline mt-3';
    wrap.innerHTML =
      '<div class="row g-2">' +
        '<div class="col-md-4"><input type="text" class="form-control style-border" id="r-name" placeholder="Nama *"></div>' +
        '<div class="col-md-4"><input type="email" class="form-control style-border" id="r-email" placeholder="Email *"></div>' +
        '<div class="col-md-12 mt-2"><textarea class="form-control style-border style2" id="r-msg" placeholder="Balasan *"></textarea></div>' +
        '<div class="col-12 mt-2"><button class="btn btn-sm" id="r-send"><span class="link-effect"><span class="effect-1">KIRIM BALASAN</span><span class="effect-1">KIRIM BALASAN</span></span></button></div>' +
      '</div>';
    parentLI.appendChild(wrap);

    wrap.querySelector('#r-send').addEventListener('click', function () {
      var name  = (wrap.querySelector('#r-name').value || '').trim();
      var email = (wrap.querySelector('#r-email').value || '').trim();
      var msg   = (wrap.querySelector('#r-msg').value || '').trim();
      if (!name || !email || !msg) return alert('Lengkapi semua kolom.');
      if (!emailValid(email)) return alert('Format email tidak valid.');

      var arr = loadComments(slug);
      var root = arr.find(function (x) { return x.id === parentId; });
      if (!root) return;
      if (!Array.isArray(root.replies)) root.replies = [];
      root.replies.push({ id: Date.now().toString(36), name: name, email: email, message: msg, date: new Date().toISOString() });
      saveComments(slug, arr);
      try { localStorage.setItem('me:email', email); } catch (e) {}
      renderComments(slug);
    });
  }

  function wireComments(slug) {
    if (!C_LIST) return;

    C_LIST.addEventListener('click', function (e) {
      var a = e.target.closest('a'); if (!a) return;

      if (a.classList.contains('reply-btn')) {
        e.preventDefault();
        var li = a.closest('li'); if (!li) return;
        showReplyForm(li, li.getAttribute('data-id'), slug);
      }

      if (a.classList.contains('delete-btn')) {
        e.preventDefault();
        var li = a.closest('li'); if (!li) return;
        var id = li.getAttribute('data-id');
        var parent = li.getAttribute('data-parent');

        var arr = loadComments(slug);
        if (parent) {
          var root = arr.find(function (x) { return x.id === parent; });
          if (root && Array.isArray(root.replies)) {
            root.replies = root.replies.filter(function (r) { return r.id !== id; });
          }
        } else {
          arr = arr.filter(function (x) { return x.id !== id; });
        }
        saveComments(slug, arr);
        renderComments(slug);
      }
    });

    if (C_FORM) {
      C_FORM.addEventListener('submit', function (e) {
        e.preventDefault();
        var name  = (document.getElementById('c-name').value || '').trim();
        var email = (document.getElementById('c-email').value || '').trim();
        var msg   = (document.getElementById('c-message').value || '').trim();
        if (!name || !email || !msg) return alert('Lengkapi semua kolom.');
        if (!emailValid(email)) return alert('Format email tidak valid. (Verifikasi real akan aktif saat integrasi WP)');

        var arr = loadComments(slug);
        arr.push({ id: Date.now().toString(36), name: name, email: email, message: msg, date: new Date().toISOString(), replies: [] });
        saveComments(slug, arr);
        try { localStorage.setItem('me:email', email); } catch (e) {}
        this.reset();
        renderComments(slug);
      });
    }
  }

  function run() {
    fetchJSON(JSON_PATHS).then(function (all) {
      var article = all.find(function (x) { return (x.slug || '') === SLUG; });

      if (!article) {
        if (TITLE) TITLE.textContent = 'Artikel tidak ditemukan';
        if (BODY)  BODY.innerHTML = '<p>Periksa kembali tautan artikel.</p>';
        return;
      }

      if (COVER) { COVER.src = article.image || FB_THUMBS[0]; COVER.alt = article.title || ''; }
      if (TITLE) TITLE.textContent = article.title || '-';
      renderMeta(article.date, article.category, article.author);
      renderBreadcrumb(article.category, article.title);

      // TAMPILKAN KONTEN (HTML dari JSON didukung)
      renderBody(pickContent(article));

      buildShare(article.title);
      fillSidebarRecent(all);
      fillSidebarCats(all);
      buildPrevNext(all, article);

      renderComments(SLUG);
      wireComments(SLUG);

      if (typeof WOW !== 'undefined') try { new WOW().init(); } catch (e) {}
    }).catch(function (err) {
      console.error(err);
      if (TITLE) TITLE.textContent = 'Gagal memuat artikel';
      if (BODY)  BODY.innerHTML = '<p>File articles.json tidak ditemukan.</p>';
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
