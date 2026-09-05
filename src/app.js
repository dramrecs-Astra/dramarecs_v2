/* DramaRecs - client behaviour. No dependencies. */
(function () {
  var toastEl;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('up');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.classList.remove('up'); }, 2600);
  }

  var input = document.getElementById('q');
  if (input) {
    var box = document.getElementById('sug');
    var index = [], cursor = -1, list = [];
    fetch('/assets/search.json').then(function (r) { return r.json(); }).then(function (d) { index = d; });

    function target(item) {
      return item.page ? '/dramas-like/' + item.slug + '/' : '/dramas/' + item.slug + '/';
    }
    /* Same normalisation the build uses when it writes search.json. */
    function nrm(v) {
      return String(v).toLowerCase().replace(/[\u2019'`.,:;!?]/g, '').replace(/\s+/g, ' ').trim();
    }
    /* Levenshtein with a ceiling, so one typo still finds the show. Bails as soon as the best
       possible result is worse than the ceiling, which keeps 195 titles per keystroke cheap. */
    function dist(a, b, max) {
      if (a === b) return 0;
      if (Math.abs(a.length - b.length) > max) return max + 1;
      var prev = [], cur = [], i, j;
      for (j = 0; j <= b.length; j++) prev[j] = j;
      for (i = 1; i <= a.length; i++) {
        cur[0] = i;
        var best = cur[0];
        for (j = 1; j <= b.length; j++) {
          cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
          if (cur[j] < best) best = cur[j];
        }
        if (best > max) return max + 1;
        for (j = 0; j <= b.length; j++) prev[j] = cur[j];
      }
      return prev[b.length];
    }
    /* Title beats alias, alias beats typo. Nothing scores unless it earns it, so an empty
       result set still says so rather than showing seven near-random shows. */
    function score(it, q) {
      var n = it.n || '', a = it.a || '';
      if (n === q) return 100;
      if (n.indexOf(q) === 0) return 92;
      if ((' ' + n).indexOf(' ' + q) > -1) return 84;
      if (n.indexOf(q) > -1) return 74;
      var alts = a ? a.split('|') : [];
      for (var i = 0; i < alts.length; i++) {
        var t = alts[i];
        if (!t) continue;
        if (t === q) return 88;
        if (t.indexOf(q) === 0) return 78;
        if ((' ' + t).indexOf(' ' + q) > -1) return 66;
        if (q.length > 3 && t.indexOf(q) > -1) return 58;
      }
      if (q.length >= 4) {
        var tol = q.length <= 5 ? 1 : q.length <= 9 ? 2 : 3;
        var best = dist(q, n.length > q.length + tol ? n.slice(0, q.length + tol) : n, tol);
        var words = n.split(' ');
        for (var w = 0; w < words.length && best > 0; w++) {
          if (Math.abs(words[w].length - q.length) <= tol) best = Math.min(best, dist(q, words[w], tol));
        }
        if (best <= tol) return 46 - best * 6;
      }
      return 0;
    }
    function draw() {
      var q = nrm(input.value);
      list = [];
      if (q.length > 0) {
        var hits = [];
        for (var i = 0; i < index.length; i++) {
          var sc = score(index[i], q);
          if (sc > 0) hits.push({ it: index[i], s: sc, i: i });
        }
        hits.sort(function (x, y) { return y.s - x.s || y.it.page - x.it.page || x.i - y.i; });
        for (var h = 0; h < hits.length && list.length < 7; h++) list.push(hits[h].it);
      }
      if (!list.length) {
        /* The highest-intent visitor on the site is the one who types the show that wrecked them
           and is not in the catalog. That used to return silence. Now it returns the nearest
           things we have written and a one-click way to put the title in the queue. */
        if (q.length < 3 || !index.length) { box.classList.remove('open'); input.setAttribute('aria-expanded', 'false'); return; }
        var typed = input.value.trim();
        var near = index.filter(function (it) { return it.page; }).sort(function (a, b) {
          return (b.y || 0) - (a.y || 0) || a.t.localeCompare(b.t);
        }).slice(0, 3);
        box.innerHTML = '<div class="nomatch">' +
          '<p class="nm-h">We have not written <b>' + typed.replace(/[<>&]/g, '') + '</b> yet.</p>' +
          '<p class="nm-s">Pages get written in the order people ask for them, so asking genuinely moves it up. Newest lists we have written:</p>' +
          near.map(function (it) {
            return '<a role="option" href="' + target(it) + '"><span class="t">' + it.t + '</span><span class="tag">written</span><span class="y tnum">' + it.y + '</span></a>';
          }).join('') +
          '<a class="nm-req" href="mailto:hello@dramarecs.com?subject=' + encodeURIComponent('Page request: ' + typed) +
          '&body=' + encodeURIComponent('Please write a dramas-like page for: ' + typed) + '">Ask for this one next &rarr;</a>' +
          '<a class="nm-alt" href="/collections/">Or browse by how you want to feel &rarr;</a></div>';
        box.classList.add('open');
        input.setAttribute('aria-expanded', 'true');
        return;
      }
      box.innerHTML = list.map(function (it, i) {
        return '<a role="option" href="' + target(it) + '" class="' + (i === cursor ? 'cursor' : '') + '">' +
          '<span class="t">' + it.t + '</span>' +
          (it.page ? '<span class="tag">written</span>' : '') +
          '<span class="y tnum">' + it.y + '</span></a>';
      }).join('');
      box.classList.add('open');
      input.setAttribute('aria-expanded', 'true');
    }
    function submit() {
      if (cursor >= 0 && list[cursor]) { location.href = target(list[cursor]); return; }
      if (list.length) { location.href = target(list[0]); return; }
      if (input.value.trim()) { draw(); toast('Not written yet. Ask for it and it moves up the queue.'); }
    }
    input.addEventListener('input', function () { cursor = -1; draw(); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); cursor = Math.min(cursor + 1, list.length - 1); draw(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); cursor = Math.max(cursor - 1, 0); draw(); }
      else if (e.key === 'Enter') { e.preventDefault(); submit(); }
      else if (e.key === 'Escape') { box.classList.remove('open'); }
    });
    var goBtn = document.getElementById('gobtn');
    if (goBtn) goBtn.addEventListener('click', submit);
    document.addEventListener('click', function (e) {
      if (!box.contains(e.target) && e.target !== input) box.classList.remove('open');
    });
  }

  document.querySelectorAll('.spoiler').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (btn.classList.contains('shown')) return;
      btn.classList.add('shown');
      btn.innerHTML = '<b style="font-weight:600">' + btn.dataset.label + '.</b>&nbsp; ' + btn.dataset.text;
    });
  });
  window.__sdToast = toast;
})();

(function () {
  var toast = window.__sdToast || function () {};

  var chips = document.querySelectorAll('.refine .chip');
  if (chips.length) {
    var rows = Array.prototype.slice.call(document.querySelectorAll('.rec'));
    var countEl = document.querySelector('.refine .count');
    var clearEl = document.querySelector('.clearall');
    var emptyEl = document.getElementById('nofilterhits');
    var tests = {
      light: function (d) { return +d.heavy <= 3; },
      short: function (d) { return +d.eps < 16; },
      netflix: function (d) { return (d.provs || '').indexOf('Netflix') > -1; },
      romance: function (d) { return +d.romance >= 3; },
      slow: function (d) { return +d.pace <= 2; }
    };
    function apply() {
      var on = [];
      chips.forEach(function (c) { if (c.getAttribute('aria-pressed') === 'true') on.push(c.dataset.f); });
      var shown = 0;
      rows.forEach(function (r) {
        var ok = on.every(function (f) { return tests[f](r.dataset); });
        r.hidden = !ok;
        if (ok) shown++;
      });
      if (countEl) countEl.textContent = shown + ' of ' + rows.length;
      if (clearEl) clearEl.hidden = on.length === 0;
      if (emptyEl) emptyEl.hidden = shown !== 0;
    }
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
        apply();
      });
    });
    function reset() {
      chips.forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
      apply();
    }
    if (clearEl) clearEl.addEventListener('click', reset);
    var emptyClear = document.getElementById('emptyclear');
    if (emptyClear) emptyClear.addEventListener('click', reset);
    window.__sdRefine = apply;
    apply();
  }

  var KEY = 'sd.shelf';
  function shelf() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function paint(btn, on) {
    btn.setAttribute('aria-pressed', String(on));
    btn.textContent = on ? 'On your shelf' : 'Save for later';
    btn.setAttribute('title', on ? 'Remove from your shelf' : 'Save to your shelf');
  }
  var saved = shelf();
  document.querySelectorAll('.shelf').forEach(function (btn) {
    paint(btn, saved.indexOf(btn.dataset.slug) > -1);
    btn.addEventListener('click', function () {
      var cur = shelf(), i = cur.indexOf(btn.dataset.slug);
      if (i > -1) { cur.splice(i, 1); } else { cur.push(btn.dataset.slug); }
      localStorage.setItem(KEY, JSON.stringify(cur));
      paint(btn, i === -1);
      toast(i === -1 ? btn.dataset.title + ' saved to your shelf.' : btn.dataset.title + ' removed.');
    });
  });

  /* A shelf that only exists in localStorage is invisible to everyone, including us. The hash
     carries the slugs, so a reader can post their shelf and the person who opens it can keep it. */
  function sharedSlugs() {
    var m = /[#&]s=([^&]+)/.exec(location.hash || '');
    return m ? decodeURIComponent(m[1]).split(',').filter(Boolean) : null;
  }

  var shareBtn = document.getElementById('shelfshare');
  if (shareBtn) shareBtn.addEventListener('click', function () {
    var cur = sharedSlugs() || shelf();
    if (!cur.length) { toast('Nothing on the shelf to share yet.'); return; }
    var url = location.origin + '/my-shelf/#s=' + encodeURIComponent(cur.join(','));
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () { toast('Link copied. ' + cur.length + ' titles.'); },
        function () { toast(url); });
    } else { toast(url); }
  });

  var mount = document.getElementById('shelfmount');
  if (mount) {
    fetch('/assets/search.json').then(function (r) { return r.json(); }).then(function (index) {
      var shared = sharedSlugs();
      var cur = shared || shelf();
      var items = index.filter(function (it) { return cur.indexOf(it.slug) > -1; });
      if (shared && items.length) {
        var bar = document.createElement('div');
        bar.className = 'sharedbar';
        bar.innerHTML = '<p><b>Someone else&rsquo;s shelf.</b> ' + items.length + ' titles, shared by link.</p>' +
          '<button class="btn" type="button" id="keepshelf">Keep these on my shelf</button> <a class="btn btn--ghost" href="/my-shelf/">Back to mine</a>';
        mount.parentNode.insertBefore(bar, mount);
        bar.querySelector('#keepshelf').addEventListener('click', function () {
          var mine = shelf();
          items.forEach(function (it) { if (mine.indexOf(it.slug) < 0) mine.push(it.slug); });
          localStorage.setItem(KEY, JSON.stringify(mine));
          toast(items.length + ' titles kept. Opening your shelf.');
          setTimeout(function () { location.href = '/my-shelf/'; }, 700);
        });
      }
      if (!items.length) {
        mount.innerHTML = '<div class="empty"><h2>Your shelf is empty.</h2>' +
          '<p>Hit save on anything you want to come back to. It stays on this device. No account, no email.</p>' +
          '<div class="actions"><a class="btn-solid" href="/">Find something</a></div></div>';
        return;
      }
      mount.innerHTML = '<div class="grid-list">' + items.map(function (it) {
        return '<a class="gitem" href="/dramas/' + it.slug + '/" style="--hue:' + (it.hue || 40) + '">' +
          '<div class="plate">' + (it.img
            ? '<img class="pix" src="' + it.img + '" alt="" loading="lazy" width="500" height="750">'
            : '<div class="pix"><span class="fallback">' + it.t + '</span></div>') +
          '</div><h3>' + it.t + '</h3><p class="m tnum">' + it.y + '</p></a>';
      }).join('') + '</div>';
    });
  }
})();


/* ---------------- streaming region ----------------
   Every provider row ships with the data for eight regions in a data attribute, so switching is
   instant, costs no request, and works on a static host. US stays the default for crawlers and
   for anyone who has not chosen, which is why the row is server-rendered too. */
(function () {
  var toast = window.__sdToast || function () {};
  var KEY = 'sd.region';
  var LABEL = {
    US: 'the United States', GB: 'the United Kingdom', CA: 'Canada', AU: 'Australia',
    IN: 'India', PH: 'the Philippines', ID: 'Indonesia', BR: 'Brazil'
  };
  var rows = document.querySelectorAll('.watch[data-watch]');
  var sels = document.querySelectorAll('.regionsel');
  if (!rows.length && !sels.length) return;

  function stored() { try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; } }
  function esc(v) { return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  /* This file used to decide on its own what a provider chip links to, using the single TMDB link
     for every brand in the row. That meant the markup after a region switch did not match the
     markup the build had rendered, and it silently ignored the affiliate wrapping entirely.
     The build now ships one resolved table in window.DR_WATCH and this reads it, so there is
     exactly one place that knows what a watch link looks like. See build.mjs, affiliate(). */
  var TABLE = window.DR_WATCH || {};

  function href(brand, code, title) {
    var row = TABLE[brand];
    if (!row) return null;
    var cell = row.r ? row.r[code] : row;
    if (!cell || !cell.h) return null;
    return {
      href: cell.h
        .replace('{qq}', encodeURIComponent(encodeURIComponent(title || '')))
        .replace('{q}', encodeURIComponent(title || '')),
      paid: cell.s === 1
    };
  }

  function paint(el, code) {
    var data = {};
    try { data = JSON.parse(el.getAttribute('data-watch') || '{}'); } catch (e) { data = {}; }
    var list = (data.p || {})[code] || [];
    var fallback = (data.l || {})[code] || '';
    var title = el.getAttribute('data-title') || '';
    el.setAttribute('data-region', code);
    if (list.length) {
      el.innerHTML = list.map(function (p) {
        var hit = href(p, code, title);
        var url = hit ? hit.href : fallback;
        if (!url) return '<span class="prov">' + esc(p) + '</span>';
        var paid = !!(hit && hit.paid);
        return '<a class="prov prov--link' + (paid ? ' prov--aff' : '') + '" href="' + esc(url) +
          '" rel="' + (paid ? 'sponsored nofollow noopener' : 'nofollow noopener') +
          '" target="_blank" aria-label="' + esc((title ? title + ' on ' : '') + p +
          (paid ? ', affiliate link' : '') + ', opens in a new tab') + '">' + esc(p) + '</a>';
      }).join('');
    } else {
      el.innerHTML = '<span class="prov prov--none">Not streaming in ' +
        esc(LABEL[code] || 'your region') + ' right now</span>';
    }
    var rec = el.closest ? el.closest('.rec') : null;
    if (rec) rec.dataset.provs = list.join(',');
  }

  function apply(code, announce) {
    for (var i = 0; i < rows.length; i++) paint(rows[i], code);
    for (var j = 0; j < sels.length; j++) sels[j].value = code;
    var names = document.querySelectorAll('.regionname');
    for (var k = 0; k < names.length; k++) names[k].textContent = LABEL[code] || code;
    if (typeof window.__sdRefine === 'function') window.__sdRefine();
    if (announce) toast('Streaming rows now show ' + (LABEL[code] || code) + '.');
  }

  var start = stored();
  if (start && LABEL[start]) apply(start, false);

  for (var s = 0; s < sels.length; s++) {
    sels[s].addEventListener('change', function (e) {
      var code = e.target.value;
      try { localStorage.setItem(KEY, code); } catch (err) {}
      apply(code, true);
    });
  }
})();

/* Consent choices. The privacy policy promises the choice can be withdrawn at any time, so the
   footer link has to actually reopen the CMP. Only rendered when ads are switched on. */
(function () {
  var btn = document.getElementById('cookiechoices');
  if (!btn) return;
  btn.addEventListener('click', function () {
    if (window.googlefc && window.googlefc.callbackQueue) {
      window.googlefc.callbackQueue.push({
        CONSENT_DATA_READY: function () {
          if (window.googlefc.showRevocationMessage) window.googlefc.showRevocationMessage();
        }
      });
      if (window.googlefc.showRevocationMessage) window.googlefc.showRevocationMessage();
    } else if (window.__tcfapi) {
      window.__tcfapi('displayConsentUi', 2, function () {});
    } else if (window.__sdToast) {
      window.__sdToast('Consent settings are not loaded on this page.');
    }
  });
})();
