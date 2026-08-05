/*
 * 共用前端腳本：
 *  1) 深色／淺色主題：跟隨系統 prefers-color-scheme，提供手動切換，狀態存 localStorage
 *  2) Service Worker：註冊 + 偵測新版本 + 提示使用者一鍵套用（不卡舊快取）
 * 純 vanilla JS、無相依套件；以 defer 載入。
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  var PREF_KEY = 'pet_theme';                 // 'light' | 'dark' | 'auto'(=未設定)
  var THEME_COLOR = { light: '#0f766e', dark: '#0f5b54' };
  var ORDER = ['auto', 'light', 'dark'];
  var INFO = {
    auto:  { icon: '🌗', name: '跟隨系統' },
    light: { icon: '☀️', name: '淺色' },
    dark:  { icon: '🌙', name: '深色' }
  };

  function getPref() {
    try {
      var v = localStorage.getItem(PREF_KEY);
      return (v === 'light' || v === 'dark') ? v : 'auto';
    } catch (e) { return 'auto'; }
  }
  function systemDark() { return mq ? mq.matches : false; }
  function resolve(pref) {
    return (pref === 'dark' || (pref === 'auto' && systemDark())) ? 'dark' : 'light';
  }

  function apply(pref) {
    var theme = resolve(pref);
    root.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEME_COLOR[theme]);

    var toggles = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < toggles.length; i++) {
      var btn = toggles[i];
      var ico = btn.querySelector('.tt-ico');
      if (ico) ico.textContent = INFO[pref].icon;
      var shown = theme === 'dark' ? '深色' : '淺色';
      btn.setAttribute('aria-label', '佈景主題：' + INFO[pref].name + '（目前顯示' + shown + '），點擊切換');
      btn.setAttribute('title', '佈景主題：' + INFO[pref].name);
    }
  }

  function setPref(pref) {
    try {
      if (pref === 'auto') localStorage.removeItem(PREF_KEY);
      else localStorage.setItem(PREF_KEY, pref);
    } catch (e) { /* localStorage 可能被停用，仍套用本次 */ }
    apply(pref);
  }

  // 點擊切換鈕：auto → light → dark → auto
  document.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest ? e.target.closest('[data-theme-toggle]') : null;
    if (!btn) return;
    var next = ORDER[(ORDER.indexOf(getPref()) + 1) % ORDER.length];
    setPref(next);
  });

  // 系統主題變動時，若使用者為「跟隨系統」則即時反映
  if (mq) {
    var onSysChange = function () { if (getPref() === 'auto') apply('auto'); };
    if (mq.addEventListener) mq.addEventListener('change', onSysChange);
    else if (mq.addListener) mq.addListener(onSysChange);
  }

  apply(getPref());

  /* ============ Service Worker：註冊 + 即時更新 ============ */
  if ('serviceWorker' in navigator) {
    var refreshing = false;
    var updateApplied = false; // 只有使用者按下「立即更新」後，接管才觸發重新整理
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (refreshing || !updateApplied) return; // 首次安裝的 claim 不會誤觸重新整理
      refreshing = true;
      window.location.reload();
    });

    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').then(function (reg) {
        function notify(worker) {
          if (!worker) return;
          showUpdateBar(function () {
            updateApplied = true;
            worker.postMessage({ type: 'SKIP_WAITING' });
          });
        }
        // 開頁時已有等待中的新版本
        if (reg.waiting && navigator.serviceWorker.controller) notify(reg.waiting);
        // 之後偵測到新版本
        reg.addEventListener('updatefound', function () {
          var nw = reg.installing;
          if (!nw) return;
          nw.addEventListener('statechange', function () {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) notify(nw);
          });
        });
        // 週期性主動檢查（每 30 分鐘）
        setInterval(function () { reg.update().catch(function () {}); }, 30 * 60 * 1000);
      }).catch(function () { /* 忽略註冊失敗（例如非 https 環境） */ });
    });

    // 回到前景時再檢查一次新版本
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState !== 'visible') return;
      navigator.serviceWorker.getRegistration().then(function (reg) {
        if (reg) reg.update().catch(function () {});
      }).catch(function () {});
    });
  }

  var barShown = false;
  function showUpdateBar(onUpdate) {
    if (barShown) return;
    barShown = true;
    var bar = document.createElement('div');
    bar.className = 'sw-update';
    bar.setAttribute('role', 'alert');

    var msg = document.createElement('span');
    msg.textContent = '✨ 有新版本可用';

    var later = document.createElement('button');
    later.type = 'button';
    later.className = 'sw-later';
    later.textContent = '稍後';
    later.setAttribute('aria-label', '關閉新版本提示');
    later.addEventListener('click', function () { bar.remove(); barShown = false; });

    var update = document.createElement('button');
    update.type = 'button';
    update.textContent = '立即更新';
    update.addEventListener('click', function () {
      update.textContent = '更新中…';
      update.disabled = true;
      onUpdate();
    });

    bar.appendChild(msg);
    bar.appendChild(later);
    bar.appendChild(update);
    document.body.appendChild(bar);
  }
})();
