const CACHE_NAME = 'lottery-wheel-v3.0.2';

const STATIC_ASSETS = [
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// ================================
// 安装
// ================================
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ================================
// 激活
// 删除旧缓存
// ================================
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys.map(key => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// ================================
// 请求处理
// ================================
self.addEventListener('fetch', event => {

  const request = event.request;

  // -------------------------------
  // HTML 页面
  // 永远请求服务器最新版本
  // -------------------------------
  if (
    request.method === 'GET' &&
    (
      request.mode === 'navigate' ||
      request.destination === 'document'
    )
  ) {

    event.respondWith(
      fetch(request, {
        cache: 'no-store'
      }).catch(() => {
        return caches.match(request);
      })
    );

    return;
  }

  // -------------------------------
  // 其他 GET 资源
  // 缓存优先
  // -------------------------------
  if (request.method === 'GET') {

    event.respondWith(

      caches.match(request)
        .then(cached => {

          if (cached) {
            return cached;
          }

          return fetch(request)
            .then(response => {

              if (
                response &&
                response.ok &&
                response.type === 'basic'
              ) {

                const copy = response.clone();

                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(request, copy);
                  });
              }

              return response;
            });

        })
        .catch(() => {
          return new Response(
            '网络连接失败',
            {
              status: 503,
              headers: {
                'Content-Type': 'text/plain;charset=UTF-8'
              }
            }
          );
        })

    );
  }

});
