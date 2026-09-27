/* Nexora Technologies — Luminous Glass interactions */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var hasIO = 'IntersectionObserver' in window;

  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }

  /* ---------- Year ---------- */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Nav: scrolled state ---------- */
  var nav = $('#nav');
  function onScrollNav() {
    if (!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > 8);
  }
  onScrollNav();
  window.addEventListener('scroll', onScrollNav, { passive: true });

  /* ---------- Mobile menu ---------- */
  var menuBtn = $('#menu-btn');
  var menu = $('#mobile-menu');

  function setMenu(open, returnFocus) {
    if (!menuBtn || !menu) return;
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.hidden = !open;
    nav.classList.toggle('open', open);
    if (!open && returnFocus) menuBtn.focus();
  }

  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () {
      setMenu(menuBtn.getAttribute('aria-expanded') !== 'true');
    });
    $$('a', menu).forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    doc.addEventListener('keydown', function (e) {
      if ((e.key === 'Escape' || e.key === 'Esc') && menuBtn.getAttribute('aria-expanded') === 'true') {
        setMenu(false, true);
      }
    });
    doc.addEventListener('click', function (e) {
      if (menuBtn.getAttribute('aria-expanded') === 'true' && !nav.contains(e.target)) setMenu(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 960 && menuBtn.getAttribute('aria-expanded') === 'true') setMenu(false);
    });
  }

  /* ---------- Active nav link ---------- */
  var navLinks = $$('.nav-links a');
  if (hasIO && navLinks.length) {
    var linkMap = {};
    navLinks.forEach(function (a) { linkMap[a.getAttribute('href').slice(1)] = a; });
    var secObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.remove('active'); a.removeAttribute('aria-current'); });
        var link = linkMap[entry.target.id];
        if (link) { link.classList.add('active'); link.setAttribute('aria-current', 'true'); }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    $$('main section[id]').forEach(function (s) { secObserver.observe(s); });
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = $$('.reveal');
  // Stagger siblings that share a parent (grids)
  reveals.forEach(function (el) {
    var parent = el.parentElement;
    var sibs = parent ? Array.prototype.filter.call(parent.children, function (c) { return c.classList.contains('reveal'); }) : [];
    var i = sibs.indexOf(el);
    if (i > 0) el.style.transitionDelay = Math.min(i % 6, 5) * 70 + 'ms';
  });
  if (hasIO && !reduceMQ.matches) {
    var revObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(function (el) { revObserver.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Hero parallax ---------- */
  var stage = $('#stage');
  var hero = $('.hero');
  if (stage && hero && !reduceMQ.matches) {
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var target = { mx: 0, my: 0, sy: 0 };
    var ticking = false;
    var heroVisible = true;

    var render = function () {
      ticking = false;
      stage.style.setProperty('--ry', (target.mx * 8).toFixed(2) + 'deg');
      stage.style.setProperty('--rx', (window.innerWidth <= 640 ? 8 : 14) - target.my * 5 + 'deg');
      stage.style.setProperty('--px', target.mx.toFixed(3));
      stage.style.setProperty('--py', target.my.toFixed(3));
      stage.style.setProperty('--sy', target.sy.toFixed(3));
    };
    var queue = function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(render); }
    };

    if (finePointer) {
      window.addEventListener('pointermove', function (e) {
        if (!heroVisible) return;
        target.mx = (e.clientX / window.innerWidth) * 2 - 1;
        target.my = (e.clientY / window.innerHeight) * 2 - 1;
        queue();
      }, { passive: true });
    }
    window.addEventListener('scroll', function () {
      if (!heroVisible) return;
      var h = hero.offsetHeight || 1;
      target.sy = Math.max(0, Math.min(1, window.scrollY / h));
      queue();
    }, { passive: true });

    if (hasIO) {
      new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting;
      }).observe(hero);
    }
  }

  /* ---------- EduNexus sticky scroll story ---------- */
  var story = $('#story');
  var device = $('#device');
  if (story && device) {
    var steps = $$('.step', story);
    var screens = $$('.screen', device);
    var sideIcons = $$('.dev-side span', device);
    var dots = $$('.story-dots i', story);
    var titleEl = $('#device-title');
    var chipEl = $('#device-chip');
    var winBar = $('.win-bar', device);
    var current = -1;

    // Build per-step visuals for the stacked (mobile/tablet) layout
    steps.forEach(function (step, i) {
      var slot = $('.step-visual', step);
      var scr = screens[i];
      if (!slot || !scr) return;
      var lite = doc.createElement('div');
      lite.className = 'device device-lite';
      var bar = winBar.cloneNode(true);
      Array.prototype.forEach.call(bar.querySelectorAll('[id]'), function (n) { n.removeAttribute('id'); });
      var t = bar.querySelector('.win-title');
      var c = bar.querySelector('.win-chip');
      if (t) t.textContent = scr.getAttribute('data-title');
      if (c) c.textContent = scr.getAttribute('data-chip');
      var copy = scr.cloneNode(true);
      copy.classList.add('is-active');
      lite.appendChild(bar);
      lite.appendChild(copy);
      slot.appendChild(lite);
      var note = doc.createElement('p');
      note.className = 'preview-note';
      note.textContent = 'Illustrative interface preview';
      slot.appendChild(note);
    });
    story.classList.add('has-clones');

    var activate = function (i) {
      if (i === current || i < 0 || i >= steps.length) return;
      current = i;
      steps.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
      screens.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
      sideIcons.forEach(function (s) { s.classList.toggle('on', Number(s.getAttribute('data-for')) === i); });
      dots.forEach(function (d, k) { d.classList.toggle('on', k === i); });
      device.setAttribute('data-active', String(i));
      var scr = screens[i];
      if (scr && titleEl) titleEl.textContent = scr.getAttribute('data-title');
      if (scr && chipEl) chipEl.textContent = scr.getAttribute('data-chip');
    };
    activate(0);

    if (hasIO) {
      story.classList.add('is-live');
      var stepObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) activate(steps.indexOf(entry.target));
        });
      }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
      steps.forEach(function (s) { stepObserver.observe(s); });
    }
  }

  /* ---------- CTA interest prefill ---------- */
  var form = $('#contact-form');
  var interest = $('#f-interest');
  $$('[data-interest]').forEach(function (el) {
    el.addEventListener('click', function () {
      if (!interest) return;
      var want = el.getAttribute('data-interest');
      Array.prototype.forEach.call(interest.options, function (opt) {
        if (opt.value === want || opt.text === want) interest.value = opt.value;
      });
      clearError(interest);
    });
  });

  /* ---------- Contact form -> mailto ---------- */
  var EMAIL_TO = 'madhacker237@gmail.com';
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var attempted = false;

  function errEl(field) { return doc.getElementById(field.getAttribute('aria-describedby')); }
  function setError(field, msg) {
    field.setAttribute('aria-invalid', 'true');
    var e = errEl(field); if (e) e.textContent = msg;
  }
  function clearError(field) {
    if (!field) return;
    field.removeAttribute('aria-invalid');
    var e = field.getAttribute('aria-describedby') && errEl(field); if (e) e.textContent = '';
  }

  function validate() {
    var name = $('#f-name'), email = $('#f-email'), msg = $('#f-msg');
    var first = null;
    [name, email, interest, msg].forEach(clearError);
    if (name.value.trim().length < 2) { setError(name, 'Please enter your name.'); first = first || name; }
    if (!email.value.trim()) { setError(email, 'Please enter your email address.'); first = first || email; }
    else if (!emailRe.test(email.value.trim())) { setError(email, 'Please enter a valid email address.'); first = first || email; }
    if (!interest.value) { setError(interest, 'Please choose what you’re interested in.'); first = first || interest; }
    if (msg.value.trim().length < 10) { setError(msg, 'Please add a short message (at least 10 characters).'); first = first || msg; }
    return first;
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      attempted = true;
      var status = $('#form-status');
      status.textContent = '';
      var firstInvalid = validate();
      if (firstInvalid) { firstInvalid.focus(); return; }

      var name = $('#f-name').value.trim();
      var email = $('#f-email').value.trim();
      var org = $('#f-org').value.trim();
      var topic = interest.value;
      var message = $('#f-msg').value.trim();

      var subject = 'Enquiry: ' + topic + ' — ' + name;
      var body = 'Hello Nexora Technologies,\n\n' + message +
        '\n\n—\nName: ' + name +
        '\nEmail: ' + email +
        '\nOrganization: ' + (org || '—') +
        '\nInterested in: ' + topic + '\n';

      var href = 'mailto:' + EMAIL_TO + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      status.textContent = 'Opening your email app… If nothing happens, email us at ' + EMAIL_TO + '.';
      window.location.href = href;
    });

    $$('input, select, textarea', form).forEach(function (field) {
      var evt = field.tagName === 'SELECT' ? 'change' : 'input';
      field.addEventListener(evt, function () { if (attempted) validate(); });
    });
  }
})();
