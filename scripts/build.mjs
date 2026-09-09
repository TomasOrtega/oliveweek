import {readFile,writeFile,mkdir,cp,rm,stat} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {foods} from '../data/foods.js';
import {planningRecipes} from '../data/planning-recipes.js';
import {openPlanningRecipes} from '../data/open-planning-recipes.js';
import {spreadsheetRecipes} from '../data/spreadsheet-recipes.js';
import {createContext} from '../src/core.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const source=JSON.parse(await readFile(resolve(root,'data/community.json'),'utf8'));
const publicDomainSource=JSON.parse(await readFile(resolve(root,'data/public-domain-recipes.json'),'utf8'));
const historicalSource=JSON.parse(await readFile(resolve(root,'data/open-recipe-archive.json'),'utf8'));
const spreadsheetPhotos=JSON.parse(await readFile(resolve(root,'data/spreadsheet-photo-sources.json'),'utf8'));
const openPlanningPhotos=JSON.parse(await readFile(resolve(root,'data/open-planning-photo-sources.json'),'utf8'));
const openPlanningPhotoById=new Map(openPlanningPhotos.map(({id,...photo})=>[id,photo]));
// Explicit third-party attributions require separate permission, despite the
// collection's blanket public-domain policy. Keep these out of every build.
const excluded=new Set(['beef-tips','couscous','gumbo-shrimp-and-sausage','shrimp-and-grits','tuscan-style-pork-roast','yorkshire-puddings']);
const community=[...source,...publicDomainSource,...historicalSource].filter(r=>!excluded.has(r.slug));
const byId=new Map(community.map(r=>[r.id,r]));
const communityRecipes=planningRecipes.map(r=>{
  const s=byId.get(r.sourceId);
  if(!s)throw new Error(`Recipe ${r.id} has no approved photographed source: ${r.sourceId}`);
  const p=r.photoId?openPlanningPhotoById.get(r.photoId):null;
  if(r.photoId&&!p)throw new Error(`Recipe ${r.id} has no attributed photo override: ${r.photoId}`);
  return {...r,photo:p?.photo||s.photo,source:s.source,photoSource:p?.photoSource||s.photoSource,photoAuthor:p?.photoAuthor,photoLicense:p?.photoLicense,photoLicenseUrl:p?.photoLicenseUrl,imageSha256:p?.imageSha256||s.imageSha256,sourceName:s.name,collection:s.collection,author:s.author,license:s.license,licenseSource:s.licenseSource,revision:s.revision};
});
const spreadsheetPhotoById=new Map(spreadsheetPhotos.map(({id,...photo})=>[id,photo]));
const importedRecipes=spreadsheetRecipes.map(r=>{
  const photo=spreadsheetPhotoById.get(r.photoId);
  if(!photo)throw new Error(`Recipe ${r.id} has no attributed spreadsheet photo: ${r.photoId}`);
  return {...r,...photo,sourceName:r.name};
});
const openRecipes=openPlanningRecipes.map(r=>{
  const photo=openPlanningPhotoById.get(r.photoId);
  if(!photo)throw new Error(`Recipe ${r.id} has no attributed open-pack photo: ${r.photoId}`);
  return {...r,...photo,sourceName:r.name};
});
const recipes=[...communityRecipes,...importedRecipes,...openRecipes];
const catalogue={version:2,nutritionStatus:'generic-starter-estimates-not-verified',foods,recipes};
createContext(catalogue);
for(const r of community){
  if(!r.photo)continue;
  if(!/^assets\/recipes\/[a-zA-Z0-9_-]+\.(webp|jpe?g|png)$/.test(r.photo))throw new Error('Invalid image path');
  const bytes=await readFile(resolve(root,r.photo));
  if(createHash('sha256').update(bytes).digest('hex')!==r.imageSha256)throw new Error(`Photograph checksum mismatch: ${r.id}`);
}
for(const r of importedRecipes){
  if(!/^assets\/recipes\/[a-zA-Z0-9_-]+\.(webp|jpe?g|png)$/.test(r.photo))throw new Error('Invalid spreadsheet image path');
  const bytes=await readFile(resolve(root,r.photo));
  if(createHash('sha256').update(bytes).digest('hex')!==r.imageSha256)throw new Error(`Spreadsheet photograph checksum mismatch: ${r.id}`);
}
for(const r of openPlanningPhotos){
  if(!/^assets\/recipes\/[a-zA-Z0-9_-]+\.(webp|jpe?g|png)$/.test(r.photo))throw new Error('Invalid open-pack image path');
  const bytes=await readFile(resolve(root,r.photo));
  if(createHash('sha256').update(bytes).digest('hex')!==r.imageSha256)throw new Error(`Open-pack photograph checksum mismatch: ${r.id}`);
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
for(const photo of new Set([...community,...importedRecipes,...openPlanningPhotos].map(r=>r.photo).filter(Boolean))){await mkdir(dirname(resolve(dist,photo)),{recursive:true});await cp(resolve(root,photo),resolve(dist,photo));}
await cp(resolve(root,'vendor/based-cooking/LICENSE.txt'),resolve(dist,'RECIPE-LICENSE.txt'));
await cp(resolve(root,'vendor/public-domain-recipes/LICENSE.txt'),resolve(dist,'PUBLIC-DOMAIN-RECIPES-LICENSE.txt'));
await cp(resolve(root,'vendor/open-recipe-archive/LICENSE.txt'),resolve(dist,'OPEN-RECIPE-ARCHIVE-LICENSE.txt'));
await writeFile(resolve(dist,'.nojekyll'),'');
const hash=createHash('sha256');
for(const path of ['index.html','styles.css','src/app.js','src/core.js','src/storage.js','data/catalogue.json','data/community.json'])hash.update(await readFile(resolve(dist,path)));
const version=hash.digest('hex').slice(0,12);
const worker=await readFile(resolve(root,'sw.js'),'utf8');
await writeFile(resolve(dist,'sw.js'),worker.replaceAll('__BUILD_VERSION__',version));
await writeFile(resolve(dist,'build-info.json'),JSON.stringify({version,recipes:recipes.length,sourceRecipes:community.length,sourcePhotos:community.filter(r=>r.photo).length,foods:foods.length,sourceRevisions:Object.fromEntries(community.map(r=>[r.collection,r.revision]))},null,2));
console.log(`Built ${recipes.length} mapped recipes, ${community.length} source recipes, ${community.filter(r=>r.photo).length} source photos, ${foods.length} ingredient records. Build ${version}.`);
