const PREFIX='oliveweek-'+new URL(self.registration.scope).pathname.replaceAll('/','_')+'-';
const CACHE=PREFIX+'__BUILD_VERSION__';
const CORE=['./','index.html','styles.css','src/app.js','src/core.js','src/storage.js','data/catalogue.json','data/community.json','assets/mark.svg','manifest.webmanifest'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)));});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith(PREFIX)&&name!==CACHE)await caches.delete(name);await self.clients.claim();})());});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url),scope=new URL(self.registration.scope);
  if(request.method!=='GET'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
  const path=url.pathname.slice(scope.pathname.length);
  const known=CORE.includes(path)||path===''||/^assets\/recipes\/[a-zA-Z0-9_-]+\.(webp|jpe?g|png)$/.test(path);
  if(!known)return;
  // Cache-first keeps code and catalogue on one coherent version. A newly
  // installed worker activates after the old tabs close, without forcing reload.
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE),cached=await cache.match(request);
    if(cached)return cached;
    try{const response=await fetch(request);if(response.ok&&response.type==='basic')await cache.put(request,response.clone());return response;}
    catch(error){if(request.mode==='navigate'){const page=await cache.match('index.html');if(page)return page;}throw error;}
  })());
});
