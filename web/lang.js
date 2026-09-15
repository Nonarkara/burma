// Pirchchat — language view toggle.
// Burmese is the default. EN button hides Burmese sections and shows English sections.
// My button hides English sections and shows Burmese sections.

(function () {
  var STORAGE_KEY = 'pirchchat.langView';
  var DEFAULT = 'my';

  function apply(view) {
    document.body.setAttribute('data-lang-view', view);
    var btnMy = document.getElementById('toggle-my');
    var btnEn = document.getElementById('toggle-en');
    if (btnMy) {
      btnMy.classList.toggle('langbtn--active', view === 'my');
      btnMy.setAttribute('aria-pressed', view === 'my' ? 'true' : 'false');
    }
    if (btnEn) {
      btnEn.classList.toggle('langbtn--active', view === 'en');
      btnEn.setAttribute('aria-pressed', view === 'en' ? 'true' : 'false');
    }
  }

  function readStored() {
    try {
      var v = localStorage.getItem(STORAGE_KEY);
      return v === 'my' || v === 'en' ? v : DEFAULT;
    } catch (e) {
      return DEFAULT;
    }
  }

  function setStored(v) {
    try { localStorage.setItem(STORAGE_KEY, v); } catch (e) { /* private mode */ }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var initial = readStored();
    apply(initial);

    var btnMy = document.getElementById('toggle-my');
    var btnEn = document.getElementById('toggle-en');
    if (btnMy) btnMy.addEventListener('click', function () { apply('my'); setStored('my'); });
    if (btnEn) btnEn.addEventListener('click', function () { apply('en'); setStored('en'); });
  });
})();
