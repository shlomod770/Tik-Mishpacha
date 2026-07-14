// Service Worker - שומר "מעטפת אפליקציה" (app shell) במטמון האמיתי של הדפדפן,
// כדי שהאפליקציה תיפתח גם בפתיחה קרה (Cold Start) ללא חיבור לרשת בכלל.
// אסטרטגיה: network-first (תמיד מנסה קודם רשת כדי לקבל עדכונים) עם נפילה
// חזרה למטמון כשאין רשת בכלל.
var CACHE_NAME = 'mdocs-shell-v2';
var SHELL_FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      // אם קובץ מסוים נכשל (למשל אייקון חסר) - לא מפילים את כל ההתקנה
      return Promise.all(SHELL_FILES.map(function(url){
        return cache.add(url).catch(function(){ /* לא קריטי */ });
      }));
    })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  // רק בקשות GET עוברות דרך המטמון (בקשות POST ל-Apps Script לא אמורות להיות מטופלות פה)
  if(req.method !== 'GET') return;

  e.respondWith(
    fetch(req).then(function(res){
      var resClone = res.clone();
      caches.open(CACHE_NAME).then(function(cache){ cache.put(req, resClone); });
      return res;
    }).catch(function(){
      return caches.match(req).then(function(cached){
        // נפילה חזרה: קודם הקובץ המדויק שהתבקש, ואם אין - עמוד האפליקציה עצמו
        // (חשוב לניווט ראשוני / פתיחה קרה כשאין רשת בכלל)
        return cached || caches.match('./index.html');
      });
    })
  );
});
