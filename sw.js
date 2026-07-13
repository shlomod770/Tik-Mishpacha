// Service Worker מינימלי - נדרש כדי שהדפדפן יאפשר "הוספה למסך הבית"
self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ self.clients.claim(); });
self.addEventListener('fetch', function(e){
  // עובר-דרך פשוט - לא שומר cache, תמיד מביא מהרשת
  e.respondWith(fetch(e.request).catch(function(){ return caches.match(e.request); }));
});
