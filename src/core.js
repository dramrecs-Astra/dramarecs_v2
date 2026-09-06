/* Shared dependency-free logic, exercised by Node regression tests. */
(function (root) {
  'use strict';
  function slugs(value) {
    return Array.isArray(value) ? Array.from(new Set(value.filter(function (s) {
      return typeof s === 'string' && s.length <= 120 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s);
    }))).slice(0, 500) : [];
  }
  function createState(storage, warn) {
    var key = 'dr.state.v1', memory, session = false;
    function decode(raw) {
      var v = JSON.parse(raw || 'null');
      if (!v || v.version !== 1) return null;
      return { version: 1, saved: slugs(v.saved), watched: slugs(v.watched), hideWatched: v.hideWatched === true, showEndingTones: v.showEndingTones === true };
    }
    function fail() { session = true; if (warn) warn('Changes are saved for this page session only. Browser storage is unavailable.'); }
    try {
      try { memory = decode(storage.getItem(key)); } catch (_) { memory = null; }
      if (!memory) {
        var legacy;
        try { legacy = JSON.parse(storage.getItem('sd.shelf') || '[]'); } catch (_) { legacy = []; }
        memory = { version: 1, saved: slugs(legacy), watched: [], hideWatched: false, showEndingTones: false };
      }
    } catch (_) { memory = { version: 1, saved: [], watched: [], hideWatched: false, showEndingTones: false }; fail(); }
    function read() { return JSON.parse(JSON.stringify(memory)); }
    function write(next) {
      memory = decode(JSON.stringify(next)) || memory;
      if (!session) {
        try { storage.setItem(key, JSON.stringify(memory)); if (storage.getItem(key) !== JSON.stringify(memory)) throw new Error('Not persisted'); }
        catch (_) { fail(); }
      }
      return !session;
    }
    return { read: read, write: write, sessionOnly: function () { return session; },
      refresh: function () { if (!session) { try { memory = decode(storage.getItem(key)) || {version:1,saved:[],watched:[],hideWatched:false,showEndingTones:false}; } catch (_) { fail(); } } },
      toggle: function (field, slug) {
        if (!['saved', 'watched'].includes(field) || !slugs([slug]).length) return false;
        var next = read(), i = next[field].indexOf(slug);
        if (i < 0) next[field].push(slug); else next[field].splice(i, 1);
        write(next); return i < 0;
      }
    };
  }
  function shared(hash) {
    if (!hash || !/[#&]s=/.test(hash)) return null;
    if (hash.length > 16000) throw new Error('This shared shelf link is too long.');
    var m = /[#&]s=([^&]*)/.exec(hash);
    try { return slugs(decodeURIComponent(m[1]).split(',')); }
    catch (_) { throw new Error('This shared shelf link is damaged.'); }
  }
  function normalize(value) {
    return String(value || '').toLowerCase().replace(/[\u2019'`.,:;!?]/g, '').replace(/\s+/g, ' ').trim()
      .replace(/^(?:(?:k[- ]?)?dramas?|shows?|series)\s+(?:like|similar to)\s+/, '')
      .replace(/^similar (?:(?:k[- ]?)?dramas?|shows?|series) to\s+/, '');
  }
  function distance(a, b) {
    var prev = Array.from({ length: b.length + 1 }, function (_, i) { return i; });
    for (var i = 1; i <= a.length; i++) {
      var row = [i];
      for (var j = 1; j <= b.length; j++) row[j] = Math.min(row[j - 1] + 1, prev[j] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = row;
    }
    return prev[b.length];
  }
  function search(index, query) {
    var q = normalize(query).slice(0, 160);
    if (!q) return [];
    return index.map(function (it) {
      var names = [it.n || normalize(it.t)].concat((it.a || '').split('|').filter(Boolean));
      var score = Math.max.apply(null, names.map(function (n, i) {
        var penalty = i ? 6 : 0;
        if (n === q) return 100 - penalty;
        if (n.startsWith(q)) return 92 - penalty;
        if (n.includes(q)) return 78 - penalty;
        var tol = q.length < 6 ? 1 : 2;
        if (q.length >= 4 && Math.abs(n.length - q.length) <= tol) { var d = distance(q, n); if (d <= tol) return 48 - d * 6 - penalty; }
        return 0;
      }));
      return { it: it, score: score };
    }).filter(function (r) { return r.score > 0; }).sort(function (a, b) { return b.score - a.score || a.it.t.localeCompare(b.it.t); }).slice(0, 7).map(function (r) { return r.it; });
  }
  function validIndex(data) {
    if (!Array.isArray(data) || data.some(function (it) { return !it || !slugs([it.slug]).length || typeof it.t !== 'string'; })) throw new Error('Invalid catalog response');
    return data;
  }
  async function fetchIndex(fetcher, timeout) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, timeout || 12000);
    try { var response = await fetcher('/assets/search.json', { signal: controller.signal }); if (!response.ok) throw new Error('Catalog request failed'); return validIndex(await response.json()); }
    finally { clearTimeout(timer); }
  }
  root.DRCore = { slugs: slugs, createState: createState, shared: shared, normalize: normalize, search: search, validIndex: validIndex, fetchIndex: fetchIndex };
})(globalThis);
