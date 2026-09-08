import {readFile,writeFile,mkdir,cp,rm,stat} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {foods} from '../data/foods.js';
import {planningRecipes} from '../data/planning-recipes.js';
import {createContext} from '../src/core.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const source=JSON.parse(await readFile(resolve(root,'data/community.json'),'utf8'));
// Explicit third-party attributions require separate permission, despite the
// collection's blanket public-domain policy. Keep these out of every build.
const excluded=new Set(['couscous','yorkshire-puddings','tuscan-style-pork-roast']);
const community=source.filter(r=>!excluded.has(r.slug));
const byId=new Map(community.map(r=>[r.id,r]));
const recipes=planningRecipes.map(r=>{
  const s=byId.get(r.sourceId);
  if(!s)throw new Error(`Recipe ${r.id} has no approved photographed source: ${r.sourceId}`);
  return {...r,photo:s.photo,source:s.source,photoSource:s.photoSource,sourceName:s.name,author:s.author,license:s.license,revision:s.revision};
});
const catalogue={version:2,nutritionStatus:'generic-starter-estimates-not-verified',foods,recipes};
createContext(catalogue);
for(const r of community){
  if(!/^assets\/recipes\/[a-zA-Z0-9_-]+\.(webp|jpe?g|png)$/.test(r.photo))throw new Error('Invalid image path');
  const bytes=await readFile(resolve(root,r.photo));
  if(createHash('sha256').update(bytes).digest('hex')!==r.imageSha256)throw new Error(`Photograph checksum mismatch: ${r.id}`);
}
const dist=resolve(root,'dist');
await rm(dist,{recursive:true,force:true});
await mkdir(dist,{recursive:true});
for(const path of ['index.html','styles.css','src','assets/mark.svg','manifest.webmanifest']){
  await mkdir(dirname(resolve(dist,path)),{recursive:true});
  await cp(resolve(root,path),resolve(dist,path),{recursive:true});
}
await mkdir(resolve(dist,'data'),{recursive:true});
await writeFile(resolve(dist,'data/catalogue.json'),JSON.stringify(catalogue));
await writeFile(resolve(dist,'data/community.json'),JSON.stringify(community));
for(const r of community){await mkdir(dirname(resolve(dist,r.photo)),{recursive:true});await cp(resolve(root,r.photo),resolve(dist,r.photo));}
await cp(resolve(root,'vendor/based-cooking/LICENSE.txt'),resolve(dist,'RECIPE-LICENSE.txt'));
await writeFile(resolve(dist,'.nojekyll'),'');
const hash=createHash('sha256');
for(const path of ['index.html','styles.css','src/app.js','src/core.js','src/storage.js','data/catalogue.json','data/community.json'])hash.update(await readFile(resolve(dist,path)));
const version=hash.digest('hex').slice(0,12);
const worker=await readFile(resolve(root,'sw.js'),'utf8');
await writeFile(resolve(dist,'sw.js'),worker.replaceAll('__BUILD_VERSION__',version));
await writeFile(resolve(dist,'build-info.json'),JSON.stringify({version,recipes:recipes.length,sourceRecipes:community.length,foods:foods.length,sourceRevision:community[0]?.revision},null,2));
console.log(`Built ${recipes.length} mapped recipes, ${community.length} source recipes/photos, ${foods.length} ingredient records. Build ${version}.`);
