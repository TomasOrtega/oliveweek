import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as C from '../src/core.js';
import {blankState,parseBackup,loadState,saveState,validateState} from '../src/storage.js';
const catalogue=JSON.parse(await readFile(new URL('../dist/data/catalogue.json',import.meta.url)));
const community=JSON.parse(await readFile(new URL('../dist/data/community.json',import.meta.url)));
const ctx=C.createContext(catalogue),p={...C.defaultPreferences(),startDate:'2026-09-07'};
const plan=()=>C.generatePlan(p,ctx,{seed:42});
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);

test('catalogue has attributed photos and honest nutrition status',()=>{
  assert.equal(catalogue.recipes.length,46);assert.ok(community.length>=300);
  assert.equal(catalogue.nutritionStatus,'generic-starter-estimates-not-verified');
  for(const f of catalogue.foods)assert.equal(f.source.type,'starter-estimate');
  for(const r of catalogue.recipes){
    assert.ok(r.photo);assert.ok(r.author);
    if(r.sourceCollection){assert.equal(r.sourceCollection,'RECIPES RECEPTES.xlsx');assert.match(r.sourceWorkbookSha256,/^[a-f0-9]{64}$/);assert.ok(r.photoSource.startsWith('https://commons.wikimedia.org/'));assert.ok(r.photoAuthor);assert.ok(r.photoLicense);}
    else{assert.equal(r.collection,'Based Cooking');assert.ok(r.source.includes(r.revision));assert.ok(r.licenseSource.includes(r.revision));assert.ok(community.some(s=>s.id===r.sourceId));}
  }
  assert.equal(catalogue.recipes.filter(r=>r.sourceCollection).length,20);
});
test('every bundled image is local and exactly matches its recorded checksum',async()=>{
  for(const r of [...community.filter(r=>r.photo),...catalogue.recipes.filter(r=>r.sourceCollection)]){assert.match(r.photo,/^assets\/recipes\/[\w-]+\.(webp|jpg|jpeg|png)$/);const bytes=await readFile(new URL('../dist/'+r.photo,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),r.imageSha256);}
});
test('all recipes in the spreadsheet index are present',()=>{
  const expected=['baba-ganoush','beet-hummus','falafel','gazpacho','gorditas','japanese-curry','mung-bean-pancake','pineapple-tofu','samosa-masoor-dal','spinach-pesto','tabbouleh','vegan-bolognese','vegan-carbonara','vegan-enchiladas','vegetable-couscous','vegetable-fajitas','vegetable-paella','vegetable-pizza','vegetarian-ramen','zucchini-soup'];
  assert.deepEqual(catalogue.recipes.filter(r=>r.sourceCollection).map(r=>r.photoId).sort(),expected);
});
test('source recipes retain collection provenance',()=>{
  assert.deepEqual(new Set(community.map(r=>r.collection)),new Set(['Based Cooking','Public Domain Recipes']));
  for(const r of community){assert.ok(r.source.includes(r.revision));assert.ok(r.licenseSource.includes(r.revision));assert.ok(r.originalMarkdown);}
});
test('externally credited recipes are not published',()=>{for(const slug of ['beef-tips','couscous','gumbo-shrimp-and-sausage','shrimp-and-grits','tuscan-style-pork-roast','yorkshire-puddings'])assert.ok(!community.some(r=>r.slug===slug));});
test('recipe IDs and source IDs are unique',()=>{assert.equal(new Set(catalogue.recipes.map(r=>r.id)).size,catalogue.recipes.length);assert.equal(new Set(community.map(r=>r.id)).size,community.length);});
test('ingredient arithmetic matches an independent direct sum',()=>{for(const r of catalogue.recipes)for(const key of C.NUTRIENTS){let total=0;for(const i of r.ingredients)total+=ctx.foods.get(i.foodId).per100g[key]*i.grams/100;near(C.recipeNutrition(r.id,1,ctx)[key],total);near(C.recipeNutrition(r.id,3.75,ctx)[key],total*3.75);}});
test('water has no nutrition and is excluded from shopping',()=>{assert.ok(C.NUTRIENTS.every(k=>ctx.foods.get('water').per100g[k]===0));assert.ok(!C.groceryList(plan(),ctx).some(i=>i.id==='water'));});
test('calendar dates preserve local-independent consecutive days',()=>{assert.equal(C.addDays('2024-02-28',1),'2024-02-29');assert.equal(C.addDays('2026-12-31',1),'2027-01-01');assert.equal(C.validDate('2026-02-29'),false);assert.throws(()=>C.addDays('not-a-date',1));});
test('preferences reject malformed and unsafe values',()=>{for(const bad of [{calories:NaN},{calories:-1},{days:8},{household:0},{days:2.5},{allergens:['other']},{excludedFoods:['__proto__']},{startDate:'2026-02-30'},{diet:'bogus'}])assert.throws(()=>C.normalizePreferences({...p,...bad}));});
test('generated plan validates and is deterministic for a seed',()=>{const a=plan(),b=plan();assert.deepEqual(a,b);assert.ok(C.validatePlan(a,ctx));assert.equal(a.days.length,7);assert.equal(a.days[0].meals.length,4);});
test('two prep sessions vary every meal type and keep portions consistent within each batch',()=>{
  for(const seed of [1,42,983]){
    const a=C.generatePlan(p,ctx,{seed});
    for(const slot of C.SLOTS){
      const meals=a.days.map(d=>d.meals.find(m=>m.slot===slot));
      assert.notEqual(meals[0].recipeId,meals[3].recipeId,slot);
      for(const session of [meals.slice(0,3),meals.slice(3)]){
        assert.equal(new Set(session.map(m=>m.recipeId)).size,1);
        assert.equal(new Set(session.map(m=>m.servings)).size,1);
      }
    }
    assert.deepEqual([...new Set(C.prepSchedule(a,ctx,p).map(j=>j.sessionDay))],[0,3]);
  }
});
test('two prep sessions allow repeats when restrictions leave one choice',()=>{
  const recipes=C.SLOTS.map(slot=>({...C.allowedRecipes(p,ctx,slot)[0],id:`only-${slot}`,slots:[slot]}));
  const limited=C.createContext({...catalogue,recipes});
  const pref={...p};
  const a=C.generatePlan(pref,limited,{seed:42});
  assert.ok(C.validatePlan(a,limited));
  for(const d of a.days)for(const m of d.meals)assert.ok(C.eligible(limited.recipes.get(m.recipeId),pref,limited,m.slot));
  assert.equal(new Set(a.days.map(d=>d.meals[0].recipeId)).size,1);
});
test('short batch plans use only their available prep sessions',()=>{
  for(const days of [1,3,4]){
    const pref={...p,days,meals:3},a=C.generatePlan(pref,ctx,{seed:42});
    assert.equal(a.days.length,days);
    assert.ok(a.days.every(d=>d.meals.length===3));
    assert.deepEqual([...new Set(C.prepSchedule(a,ctx,pref).map(j=>j.sessionDay))],days>3?[0,3]:[0]);
  }
});
test('freezer mode keeps breakfast and lunch in a single batch',()=>{
  const a=C.generatePlan({...p,mode:'freezer'},ctx,{seed:42});
  for(const slot of ['breakfast','lunch'])assert.equal(new Set(a.days.map(d=>d.meals.find(m=>m.slot===slot).recipeId)).size,1);
});
for(const mode of C.MODES)test(`two snacks work in ${mode} mode`,()=>{
  const pref={...p,meals:5,mode},a=C.generatePlan(pref,ctx,{seed:42});
  assert.ok(C.validatePlan(a,ctx));
  assert.deepEqual(a,C.generatePlan(pref,ctx,{seed:42}));
  for(const d of a.days){
    assert.deepEqual(d.meals.map(m=>m.slot),['breakfast','lunch','dinner','snack','snack2']);
    for(const m of d.meals.slice(3))assert.ok(ctx.recipes.get(m.recipeId).slots.includes('snack'));
    for(const value of Object.values(C.dayTotals(d,ctx)))assert.ok(Number.isFinite(value));
  }
  if(mode==='batch')for(const slot of ['snack','snack2']){
    const meals=a.days.map(d=>d.meals.find(m=>m.slot===slot));
    assert.notEqual(meals[0].recipeId,meals[3].recipeId);
    for(const group of [meals.slice(0,3),meals.slice(3)])assert.ok(group.every(m=>m.recipeId===group[0].recipeId&&m.servings===group[0].servings));
  }
});
test('second snacks obey dietary filters and retain their own locks',()=>{
  const pref={...p,meals:5,diet:'vegan',allergens:['sesame']},a=C.generatePlan(pref,ctx,{seed:42});
  for(const d of a.days)for(const m of d.meals)assert.ok(C.eligible(ctx.recipes.get(m.recipeId),pref,ctx,m.slot));
  const snack=a.days[2].meals.find(m=>m.slot==='snack2');snack.locked=true;snack.servings=1.35;
  const b=C.generatePlan(pref,ctx,{existing:a,seed:123});
  assert.deepEqual(b.days[2].meals.find(m=>m.slot==='snack2'),snack);
  assert.throws(()=>C.generatePlan({...pref,avoidedRecipes:[snack.recipeId]},ctx,{existing:a}),/Locked/);
});
test('five-meal plans reconcile groceries, prep quantities and backups',()=>{
  const pref={...p,meals:5,household:2},a=C.generatePlan(pref,ctx,{seed:42});
  const expected=new Map();
  for(const d of a.days)for(const m of d.meals)for(const i of ctx.recipes.get(m.recipeId).ingredients){
    if(ctx.foods.get(i.foodId).aisle!=='Water')expected.set(i.foodId,(expected.get(i.foodId)||0)+i.grams*m.servings*pref.household);
  }
  for(const i of C.groceryList(a,ctx,pref.household))near(i.needed,expected.get(i.id));
  near(C.prepSchedule(a,ctx,pref).reduce((s,j)=>s+j.servings,0),a.days.reduce((s,d)=>s+d.meals.reduce((s,m)=>s+m.servings*pref.household,0),0));
  const s=blankState();s.preferences=pref;s.plan=a;
  s.savedPlans=[{id:'two-snacks',name:'Two snacks',preferences:C.clone(pref),plan:C.clone(a)}];
  assert.deepEqual(parseBackup(JSON.stringify(s),catalogue),s);
});
test('snack counts can change without losing the original snack lock',()=>{
  const a=plan();a.days[0].meals[3].locked=true;
  const b=C.generatePlan({...p,meals:5},ctx,{seed:42,existing:a});
  assert.deepEqual(b.days[0].meals[3],a.days[0].meals[3]);
  for(const meals of [4,3]){
    const c=C.generatePlan({...p,meals},ctx,{existing:b,seed:42});
    assert.ok(c.days.every(d=>d.meals.length===meals&&!d.meals.some(m=>m.slot==='snack2')));
  }
});
test('plan validation rejects duplicate or orphaned second snacks and non-snack recipes',()=>{
  const a=C.generatePlan({...p,meals:5},ctx,{seed:42});
  const duplicate=C.clone(a);duplicate.days[0].meals[4].slot='snack';assert.throws(()=>C.validatePlan(duplicate,ctx));
  const orphan=C.clone(a);orphan.days[0].meals.splice(3,1);assert.throws(()=>C.validatePlan(orphan,ctx));
  const invalid=C.clone(a);invalid.days[0].meals[4].recipeId=catalogue.recipes.find(r=>!r.slots.includes('snack')).id;assert.throws(()=>C.validatePlan(invalid,ctx));
  assert.throws(()=>C.normalizePreferences({...p,meals:6}));
});
for(const diet of C.DIETS)test(`generator respects ${diet} and ingredient filters`,()=>{
  const pref={...p,diet,excludedFoods:['feta']};const a=C.generatePlan(pref,ctx,{seed:5});
  for(const d of a.days)for(const m of d.meals)assert.ok(C.eligible(ctx.recipes.get(m.recipeId),pref,ctx,m.slot));
});
test('allergen exclusion is a hard constraint',()=>{const pref={...p,allergens:['peanut']},a=C.generatePlan(pref,ctx,{seed:7});for(const d of a.days)for(const m of d.meals)assert.ok(!C.recipeAllergens(ctx.recipes.get(m.recipeId),ctx).includes('peanut'));});
test('impossible restrictions produce an error instead of silently relaxing them',()=>{assert.throws(()=>C.generatePlan({...p,excludedFoods:catalogue.foods.map(f=>f.id)},ctx,{seed:4}),/No breakfast recipes/);});
test('locked meals survive regeneration exactly',()=>{const a=plan();a.days[1].meals[0].locked=true;const old=C.clone(a.days[1].meals[0]);const b=C.generatePlan(p,ctx,{seed:983,existing:a});assert.deepEqual(b.days[1].meals[0],old);});
test('locked meals cannot violate new restrictions',()=>{const a=plan(),m=a.days[0].meals[0];m.locked=true;const r=ctx.recipes.get(m.recipeId);assert.throws(()=>C.generatePlan({...p,excludedFoods:[r.ingredients[0].foodId]},ctx,{seed:98,existing:a}));});
test('daily and weekly totals reconcile',()=>{const a=plan(),total=C.planTotals(a,ctx),avg=C.dailyAverage(a,ctx);for(const k of C.NUTRIENTS){near(total[k],a.days.reduce((s,d)=>s+C.dayTotals(d,ctx)[k],0));near(avg[k]*a.days.length,total[k]);}});
test('household size affects grocery quantities, not per-person nutrition',()=>{const a=plan(),one=C.groceryList(a,ctx,1),four=C.groceryList(a,ctx,4);for(const i of one)near(four.find(x=>x.id===i.id).needed,i.needed*4);const old=C.planTotals(a,ctx);C.groceryList(a,ctx,4);assert.deepEqual(C.planTotals(a,ctx),old);});
test('pantry is subtracted once, never producing negative quantities',()=>{const a=plan(),one=C.groceryList(a,ctx,1),item=one[0];const b=C.groceryList(a,ctx,1,{[item.id]:item.needed/2}).find(i=>i.id===item.id);near(b.buy,item.needed/2);const c=C.groceryList(a,ctx,1,{[item.id]:item.needed*5}).find(i=>i.id===item.id);assert.equal(c.buy,0);near(c.pantryUsed,item.needed);});
test('prep batches reconcile with meal ingredients and household size',()=>{const a=plan(),pref={...p,household:3},jobs=C.prepSchedule(a,ctx,pref);for(const id of new Set(a.days.flatMap(d=>d.meals.map(m=>m.recipeId)))){const expected=a.days.reduce((s,d)=>s+d.meals.filter(m=>m.recipeId===id).reduce((s,m)=>s+m.servings*3,0),0);near(jobs.filter(j=>j.recipeId===id).reduce((s,j)=>s+j.servings,0),expected);}});
test('freezer schedule allocates later portions to freezing',()=>{const pref={...p,mode:'freezer'},a=C.generatePlan(pref,ctx,{seed:5}),jobs=C.prepSchedule(a,ctx,pref);assert.ok(jobs.some(j=>j.freezeServings>0));for(const j of jobs){near(j.servings,j.fridgeServings+j.freezeServings);if(j.freezeServings)assert.ok(ctx.recipes.get(j.recipeId).freezer);}});
test('soft target misses are reported, not represented as exact success',()=>{const a=plan(),issues=C.diagnostics(a,{...p,protein:400},ctx);assert.ok(issues.length>0);assert.ok(issues.some(x=>x.problems.some(s=>s.includes('protein'))));});
test('CSV prevents formula injection and escapes quotes',()=>{const csv=C.groceryCSV([{aisle:'=x',name:'a"b',needed:2,pantryUsed:0,buy:2,basis:'raw'}]);assert.ok(csv.includes('"\'=x"'));assert.ok(csv.includes('"a""b"'));});
test('weight conversion is unit-specific',()=>{assert.equal(C.formatWeight(1000),'1 kg');assert.equal(C.formatWeight(28.3495,'imperial'),'1 oz');});
test('adult energy formula is validated',()=>{const x=C.estimateEnergy({sex:'male',age:30,weightKg:80,heightCm:180,activity:1.2});assert.equal(x.resting,1780);assert.equal(x.maintenance,2136);assert.throws(()=>C.estimateEnergy({sex:'male',age:10,weightKg:80,heightCm:180,activity:1.2}));});
test('backups round-trip plans, pantry and saved weeks',()=>{const s=blankState();s.preferences=p;s.plan=plan();s.pantry={oats:300};s.savedPlans=[{id:'test-week',name:'Example',preferences:C.clone(p),plan:C.clone(s.plan)}];assert.deepEqual(parseBackup(JSON.stringify(s),catalogue),s);});
test('malformed backups and unsupported prototype version fail',()=>{assert.throws(()=>parseBackup('{',catalogue));assert.throws(()=>parseBackup(' '.repeat(5_000_001),catalogue));assert.throws(()=>parseBackup('{"version":1}',catalogue));const s=blankState();s.plan=plan();assert.throws(()=>validateState(s,catalogue));});
test('malicious custom image paths and identifiers are rejected',()=>{const r=C.clone(catalogue.recipes[0]);r.id='custom-1';r.photo='https://tracker.invalid/pixel';assert.throws(()=>C.validateRecipe(r,ctx.foods));assert.equal(C.validId('__proto__'),false);assert.equal(C.validId('constructor'),false);assert.equal(C.validId('../bad'),false);});
test('unreadable browser data is preserved until explicit replacement',()=>{let writes=0;const storage={getItem:()=>'{bad',setItem:()=>writes++};const loaded=loadState(storage,catalogue);assert.ok(loaded.warning);assert.equal(writes,0);});
test('storage errors have a clear local-only warning',()=>{assert.match(saveState({setItem(){throw new Error('full');}},blankState()),/only in memory/);});
