const CACHE_NAME = 'lottery-wheel-v3.0.1';

const STATIC_ASSETS = [
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];


// ================================
// 安装新版本
// ================================
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});


// ================================
// 激活新版本
// 自动删除所有旧缓存
// ================================
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => {
        return Promise.all(
          keys.map(key => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});


// ================================
// 处理网页请求
// ================================
self.addEventListener('fetch', event => {

  const request = event.request;


  // =====================================
  // HTML 页面
  // 永远从网络获取最新页面
  // 不缓存 HTML
  // =====================================
  if (
    request.mode === 'navigate' ||
    request.destination === 'document'
  ) {

    event.respondWith(

      fetch(request, {
        cache: 'no-store'
      })

      .catch(() => {

        // 没有网络时才使用缓存
        return caches.match(request);

      })

    );

    return;
  }


  // =====================================
  // 其他资源
  // CSS / JS / 图片 / 字体等
  // 优先使用缓存
  // =====================================
  if (request.method === 'GET') {

    event.respondWith(

      caches.match(request)

        .then(cachedResponse => {

          // 有缓存就直接使用
          if (cachedResponse) {
            return cachedResponse;
          }


          // 没缓存就从网络获取
          return fetch(request)

            .then(response => {

              // 只缓存成功的资源
              if (response.ok) {

                const copy = response.clone();

                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(request, copy);
                  });

              }

              return response;

            });

        })

    );

  }

});
