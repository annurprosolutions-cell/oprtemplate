/* =====================================================================
 *  SISTEM OPR — SERVICE WORKER (pilihan)
 *  ---------------------------------------------------------------------
 *  Letakkan fail ini di sebelah index.html. Tanpa fail ini sistem tetap
 *  berfungsi sepenuhnya — cuma Chrome tidak akan menawarkan butang
 *  "Pasang aplikasi" dan tiada sokongan luar talian.
 *
 *  Strategi: rangkaian dahulu, cache sebagai sandaran, dan HANYA untuk
 *  fail dari domain yang sama. Panggilan ke Apps Script (domain lain)
 *  tidak pernah disentuh, jadi data laporan sentiasa terkini.
 * ===================================================================== */
var CACHE = 'opr-shell-v1';

self.addEventListener('install', function () { self.skipWaiting(); });

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (kunci) {
        return Promise.all(kunci.map(function (k) {
          return k === CACHE ? null : caches.delete(k);
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url;
  try { url = new URL(req.url); } catch (x) { return; }
  if (url.origin !== self.location.origin) return;   // biarkan CDN & Apps Script

  e.respondWith(
    fetch(req)
      .then(function (r) {
        if (r && r.ok) {
          var salinan = r.clone();
          caches.open(CACHE).then(function (c) { c.put(req, salinan); }).catch(function () {});
        }
        return r;
      })
      .catch(function () {
        return caches.match(req).then(function (r) {
          return r || caches.match('index.html') || caches.match('./');
        });
      })
  );
});
