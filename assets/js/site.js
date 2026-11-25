/* ============================================================
   杨正飞 · 三维数字孪生作品集 — 交互脚本
   1 顶栏状态 ／ 2 移动端抽屉 ／ 3 滚动出现 ／ 4 设备筛选
   5 作品详情弹层 ／ 6 复制微信号
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1 顶栏：滚过首屏换成浅色 ---------- */
  var header = document.getElementById('hdr');
  var lastState = null;

  function syncHeader() {
    var solid = window.scrollY > 64;
    if (solid === lastState) return;
    lastState = solid;
    header.classList.toggle('is-solid', solid);
  }
  syncHeader();
  window.addEventListener('scroll', syncHeader, { passive: true });

  /* ---------- 2 移动端抽屉 ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var drawer = document.getElementById('drawer');
  var menuLabel = menuBtn.querySelector('.menu-btn__txt');
  var drawerOpen = false;

  function openDrawer() {
    drawerOpen = true;
    drawer.hidden = false;
    document.body.style.overflow = 'hidden';
    menuBtn.setAttribute('aria-expanded', 'true');
    if (menuLabel) menuLabel.textContent = '关闭';
    requestAnimationFrame(function () { drawer.classList.add('is-open'); });
    drawer.focus({ preventScroll: true });
  }

  function closeDrawer() {
    if (!drawerOpen) return;
    drawerOpen = false;
    drawer.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    if (menuLabel) menuLabel.textContent = '菜单';
    document.body.style.overflow = '';
    window.setTimeout(function () { drawer.hidden = true; }, reduceMotion ? 0 : 260);
    menuBtn.focus({ preventScroll: true });
  }

  menuBtn.addEventListener('click', function () {
    drawerOpen ? closeDrawer() : openDrawer();
  });

  drawer.addEventListener('click', function (e) {
    if (e.target.closest('a')) closeDrawer();
  });

  /* ---------- 3 滚动出现 ---------- */
  var revealTargets = document.querySelectorAll(
    '.project, .work, .cap__row, .tools'
  );

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealTargets.forEach(function (el) { el.classList.add('in'); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('reveal'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealTargets.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 项目档案锚点 ---------- */
  function revealCase(hash) {
    var id = hash.slice(1);
    var details = document.getElementById(id);
    if (!details || !details.matches('details.case')) return;
    details.open = true;
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
    revealCase(link.hash);
  });
  window.addEventListener('hashchange', function () { revealCase(location.hash); });
  revealCase(location.hash);

  /* ---------- 4 设备筛选 ---------- */
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip[data-filter]'));
  var works = Array.prototype.slice.call(document.querySelectorAll('#eqGrid .work'));
  var eqCount = document.getElementById('eqCount');

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) {
        c.classList.remove('is-on');
        c.setAttribute('aria-pressed', 'false');
      });
      chip.classList.add('is-on');
      chip.setAttribute('aria-pressed', 'true');

      var key = chip.dataset.filter;
      var shown = 0;
      works.forEach(function (w) {
        var match = key === 'all' || w.dataset.cat === key;
        w.classList.toggle('is-filtered-out', !match);
        if (match) shown++;
      });
      if (eqCount) eqCount.textContent = '显示 ' + shown + ' / ' + works.length + ' 件';
    });
  });

  /* ---------- 5 作品详情 ---------- */
  var modal = document.getElementById('modal');
  var mImg = document.getElementById('mImg');
  var mCat = document.getElementById('mCat');
  var mTitle = document.getElementById('mTitle');
  var mDesc = document.getElementById('mDesc');
  var mSpecs = document.getElementById('mSpecs');
  var mIndex = document.getElementById('mIndex');
  var mPrev = document.getElementById('mPrev');
  var mNext = document.getElementById('mNext');

  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-img]'));
  var current = -1;
  var opener = null;

  function visibleInGroup(group) {
    return cards.filter(function (c) {
      return c.dataset.group === group && !c.classList.contains('is-filtered-out') && c.offsetParent !== null;
    });
  }

  function fill(i) {
    var card = cards[i];
    if (!card) return;
    current = i;

    mImg.src = card.dataset.img;
    mImg.alt = card.dataset.title + '（放大预览）';
    mCat.textContent = card.dataset.catName || '';
    mTitle.textContent = card.dataset.title || '';
    mDesc.textContent = card.dataset.desc || '';
    mDesc.hidden = !card.dataset.desc;

    mSpecs.replaceChildren();
    mSpecs.hidden = !card.dataset.specs;
    (card.dataset.specs || '').split('||').forEach(function (row) {
      var parts = row.split('::');
      if (!parts[1]) return;
      var div = document.createElement('div');
      var dt = document.createElement('dt');
      var dd = document.createElement('dd');
      dt.textContent = parts[0];
      dd.textContent = parts[1];
      div.appendChild(dt);
      div.appendChild(dd);
      mSpecs.appendChild(div);
    });

    var group = visibleInGroup(card.dataset.group);
    var pos = group.indexOf(card);
    mIndex.textContent = String(pos + 1).padStart(2, '0') + ' / ' + String(group.length).padStart(2, '0');

    var single = group.length < 2;
    mPrev.disabled = single;
    mNext.disabled = single;
    mPrev.style.opacity = single ? 0.35 : 1;
    mNext.style.opacity = single ? 0.35 : 1;
  }

  function openModal(card, trigger) {
    opener = trigger || null;
    fill(cards.indexOf(card));
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    var panel = modal.querySelector('.modal__panel');
    if (panel) panel.focus({ preventScroll: true });
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = '';
    mImg.removeAttribute('src');
    if (opener) opener.focus({ preventScroll: true });
  }

  function step(dir) {
    var card = cards[current];
    if (!card) return;
    var group = visibleInGroup(card.dataset.group);
    if (group.length < 2) return;
    var pos = group.indexOf(card);
    var next = group[(pos + dir + group.length) % group.length];
    fill(cards.indexOf(next));
    modal.querySelector('.modal__panel').scrollTop = 0;
  }

  cards.forEach(function (card) {
    var trigger = card.querySelector('a');
    if (!trigger) return;
    trigger.addEventListener('click', function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
      e.preventDefault();
      openModal(card, trigger);
    });
  });

  modal.addEventListener('click', function (e) {
    if (e.target.closest('[data-close]')) closeModal();
  });
  mPrev.addEventListener('click', function () { step(-1); });
  mNext.addEventListener('click', function () { step(1); });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (!modal.hidden) { closeModal(); return; }
      if (drawerOpen) closeDrawer();
      return;
    }
    if (modal.hidden) return;
    if (e.key === 'ArrowLeft') { step(-1); }
    if (e.key === 'ArrowRight') { step(1); }
    if (e.key === 'Tab') {
      var focusables = modal.querySelectorAll('button:not(:disabled), a[href]');
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === modal.querySelector('.modal__panel'))) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
  });

  /* ---------- 6 复制微信号 ---------- */
  var copyBtn = document.getElementById('copyWechat');
  var copyState = document.getElementById('copyState');
  var copyTimer = null;

  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var text = copyBtn.dataset.copy || '';
      var done = function () {
        copyState.textContent = '已复制';
        copyBtn.classList.add('is-copied');
        window.clearTimeout(copyTimer);
        copyTimer = window.setTimeout(function () {
          copyState.textContent = '复制';
          copyBtn.classList.remove('is-copied');
        }, 2200);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else {
        fallback();
      }

      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); done(); } catch (err) {
          copyState.textContent = '请手动复制';
        }
        document.body.removeChild(ta);
      }
    });
  }
})();
