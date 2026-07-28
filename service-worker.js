// 记账本 Service Worker - v6 (Cache-First + Auto Refresh)

const CACHE = 'jizhang-v6';

const ASSETS = ['/', '/index.html', '/manifest.json', '/icon-192.png'];



self.addEventListener('install', e => {

  self.skipWaiting();

  e.waitUntil(

    caches.open(CACHE).then(c => c.addAll(ASSETS))

  );

});



self.addEventListener('activate', e => {

  e.waitUntil(

    caches.keys().then(keys =>

      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))

    )

  );

  return self.clients.claim();

});



self.addEventListener('fetch', e => {

  const url = new URL(e.request.url);



  // Don't cache API calls

  if (url.hostname === 'api.github.com') return;



  // HTML navigation: Stale-while-revalidate (cache-first, background update)

  if (e.request.mode === 'navigate') {

    e.respondWith(

      caches.open(CACHE).then(cache =>

        cache.match('/index.html').then(cached => {

          const fetchPromise = fetch(e.request).then(netResp => {

            if (netResp && netResp.status === 200) {

              cache.put('/index.html', netResp.clone());

            }

            return netResp;

          }).catch(() => cached);

          return cached || fetchPromise;

        })

      )

    );

    return;

  }



  // Static assets: Cache-first with network fallback

  e.respondWith(

    caches.match(e.request).then(cached => {

      if (cached) return cached;

      return fetch(e.request).then(netResp => {

        if (netResp && netResp.status === 200) {

          const respClone = netResp.clone();

          caches.open(CACHE).then(c => c.put(e.request, respClone));

        }

        return netResp;

      });

    })

  );

});



self.addEventListener('message', e => {

  if (e.data.action === 'skipWaiting') {

    self.skipWaiting();

  }

});

