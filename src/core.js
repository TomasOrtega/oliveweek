/** Pure planning logic. No network, DOM, storage, or paid services. */
export const NUTRIENTS = ['kcal','protein','carbs','fat','fiber','sodium','saturatedFat'];
export const ALLERGENS = ['milk','egg','fish','shellfish','tree-nuts','peanut','soy','sesame','gluten'];
export const SLOTS = ['breakfast','lunch','dinner','snack'];
export const DIETS = ['mediterranean','vegetarian','vegan','pescatarian','anything'];
export const MODES = ['batch','freezer','variety'];
export const zero = () => Object.fromEntries(NUTRIENTS.map(k=>[k,0]));
export const clamp = (n,a,b) => Math.min(b,Math.max(a,n));
export const round = (n,d=0) => Math.round((n+Number.EPSILON)*10**d)/10**d;
export const clone = x => JSON.parse(JSON.stringify(x));
export function dateISO(date=new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function validDate(s) {
  if (typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T12:00:00Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10)===s;
}
export function addDays(s,n) {
  if (!validDate(s)||!Number.isInteger(n)) throw new Error('Invalid calendar date.');
  const d=new Date(`${s}T12:00:00Z`); d.setUTCDate(d.getUTCDate()+n);
  return d.toISOString().slice(0,10);
}
export function defaultPreferences() {
  return {calories:2400,protein:120,carbs:0,fat:0,days:7,meals:4,household:1,diet:'mediterranean',mode:'batch',maxTime:90,units:'metric',startDate:dateISO(),allergens:[],excludedFoods:[],avoidedRecipes:[],favorites:[],usePantry:true};
}
function numberIn(value,name,min,max,integer=false) {
  if (typeof value !== 'number'||!Number.isFinite(value)||value<min||value>max||(integer&&!Number.isInteger(value))) throw new Error(`${name} must be ${integer?'a whole number ':''}between ${min} and ${max}.`);
  return value;
}
export function validId(x) { return typeof x==='string' && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(x) && !['constructor','prototype','__proto__'].includes(x); }
export function normalizePreferences(raw={}) {
  if (!raw||typeof raw!=='object'||Array.isArray(raw)) throw new Error('Preferences must be an object.');
  const p={...defaultPreferences(),...raw};
  for (const [k,a,b,int] of [['calories',800,7000,false],['protein',0,400,false],['carbs',0,1000,false],['fat',0,300,false],['days',1,7,true],['meals',3,4,true],['household',1,12,true],['maxTime',5,180,true]]) numberIn(p[k],k,a,b,int);
  if (!DIETS.includes(p.diet)||!MODES.includes(p.mode)||!['metric','imperial'].includes(p.units)||!validDate(p.startDate)) throw new Error('Unsupported diet, schedule, unit, or start date.');
  for (const k of ['allergens','excludedFoods','avoidedRecipes','favorites']) {
    if (!Array.isArray(p[k])||p[k].length>500||!p[k].every(validId)) throw new Error(`Invalid ${k}.`);
    p[k]=[...new Set(p[k])];
  }
  if (p.allergens.some(x=>!ALLERGENS.includes(x))) throw new Error('Unknown allergen.');
  p.usePantry=Boolean(p.usePantry);
  return Object.fromEntries(Object.keys(defaultPreferences()).map(k=>[k,p[k]]));
}
export function validateFood(f) {
  if (!f||!validId(f.id)||typeof f.name!=='string'||!f.name.trim()||f.name.length>160) throw new Error('A food needs a valid ID and name.');
  if (!['plant','dairy','egg','meat','fish','honey'].includes(f.kind)) throw new Error(`Invalid food type: ${f.name}`);
  if (typeof f.aisle!=='string'||f.aisle.length>80||typeof f.basis!=='string'||f.basis.length>250) throw new Error('Invalid food aisle or weight basis.');
  if (!Array.isArray(f.allergens)||f.allergens.some(a=>!ALLERGENS.includes(a))) throw new Error(`Invalid allergen tags: ${f.name}`);
  for (const k of NUTRIENTS) numberIn(f.per100g?.[k],`${f.name}: ${k}`,0,k==='sodium'?100000:k==='kcal'?1000:100);
  if (f.unitGrams!==undefined) numberIn(f.unitGrams,'Unit weight',.1,10000);
  if (f.unit!==undefined&&(typeof f.unit!=='string'||f.unit.length>80)) throw new Error('Invalid unit name.');
  return true;
}
export function validateRecipe(r,foods) {
  if (!r||!validId(r.id)||typeof r.name!=='string'||!r.name.trim()||r.name.length>160) throw new Error('A recipe needs a valid ID and name.');
  if (!Array.isArray(r.slots)||!r.slots.length||r.slots.some(s=>!SLOTS.includes(s))) throw new Error('Choose at least one meal type.');
  numberIn(r.minutes,'Recipe time',1,240,true);
  numberIn(r.fridgeDays,'Storage days',0,3,true);
  if (!['fresh','batch'].includes(r.prep)||typeof r.freezer!=='boolean') throw new Error('Invalid meal-prep settings.');
  if (!Array.isArray(r.ingredients)||!r.ingredients.length||r.ingredients.length>80) throw new Error('A recipe needs 1–80 ingredients.');
  for (const i of r.ingredients) {
    if (!foods.has(i.foodId)) throw new Error(`Unknown ingredient: ${i.foodId}`);
    numberIn(i.grams,'Ingredient grams',.01,5000);
  }
  if (!Array.isArray(r.steps)||!r.steps.length||r.steps.length>30||r.steps.some(s=>typeof s!=='string'||s.length>2000||!s.trim())) throw new Error('A recipe needs written cooking steps.');
  for (const key of ['description','storage','servingNote','category']) if (r[key]!==undefined&&(typeof r[key]!=='string'||r[key].length>4000)) throw new Error(`Invalid recipe ${key}.`);
  if (r.photo!==undefined && (typeof r.photo!=='string' || !/^assets\/recipes\/[a-zA-Z0-9_-]+\.(webp|jpe?g|png)$/.test(r.photo))) throw new Error('Invalid local recipe photograph.');
  return true;
}
export function createContext(catalogue,customFoods=[],customRecipes=[]) {
  if (!catalogue||!Array.isArray(catalogue.foods)||!Array.isArray(catalogue.recipes)) throw new Error('Invalid catalogue.');
  const foods=new Map(), recipes=new Map(), nutrition=new Map();
  for (const f of [...catalogue.foods,...customFoods]) {validateFood(f);if(foods.has(f.id))throw new Error(`Duplicate food: ${f.id}`);foods.set(f.id,f);}
  for (const r of [...catalogue.recipes,...customRecipes]) {
    validateRecipe(r,foods);if(recipes.has(r.id))throw new Error(`Duplicate recipe: ${r.id}`);recipes.set(r.id,r);
    const total=zero(); for(const i of r.ingredients) for(const k of NUTRIENTS) total[k]+=foods.get(i.foodId).per100g[k]*i.grams/100;
    if(total.kcal<10)throw new Error(`Recipe has too few calories: ${r.name}`);
    nutrition.set(r.id,total);
  }
  return {foods,recipes,nutrition};
}
export function recipeNutrition(id,servings,ctx) {
  const base=ctx.nutrition.get(id);if(!base)throw new Error(`Unknown recipe: ${id}`);
  if (!Number.isFinite(servings)||servings<0) throw new Error('Invalid portion.');
  return Object.fromEntries(NUTRIENTS.map(k=>[k,base[k]*servings]));
}
export function recipeAllergens(r,ctx) { return [...new Set(r.ingredients.flatMap(i=>ctx.foods.get(i.foodId).allergens))]; }
export function dietAllows(r,diet,ctx) {
  if(diet==='mediterranean' && r.mediterranean===false)return false;
  const kinds=r.ingredients.map(i=>ctx.foods.get(i.foodId).kind);
  const banned=diet==='vegan'?['meat','fish','dairy','egg','honey']:diet==='vegetarian'?['meat','fish']:diet==='pescatarian'?['meat']:[];
  return !kinds.some(k=>banned.includes(k));
}
export function eligible(r,p,ctx,slot=null) {
  if(!r)return false;
  if (slot&&!r.slots.includes(slot)) return false;
  if (r.minutes>p.maxTime||p.avoidedRecipes.includes(r.id)||!dietAllows(r,p.diet,ctx))return false;
  if (r.ingredients.some(i=>p.excludedFoods.includes(i.foodId)))return false;
  if (recipeAllergens(r,ctx).some(a=>p.allergens.includes(a)))return false;
  if (p.mode==='freezer'&&r.prep!=='fresh'&&!r.freezer)return false;
  return true;
}
export function allowedRecipes(p,ctx,slot=null) { return [...ctx.recipes.values()].filter(r=>eligible(r,p,ctx,slot)); }
export function dayTotals(day,ctx) {
  const t=zero();for (const m of day.meals) { const n=recipeNutrition(m.recipeId,m.servings,ctx); for(const k of NUTRIENTS)t[k]+=n[k]; }return t;
}
export function planTotals(plan,ctx) {
  const total=zero();if(!plan?.days?.length)return total;
  for(const d of plan.days) {const t=dayTotals(d,ctx);for(const k of NUTRIENTS)total[k]+=t[k];}return total;
}
export function dailyAverage(plan,ctx) {const t=planTotals(plan,ctx);return Object.fromEntries(NUTRIENTS.map(k=>[k,t[k]/(plan?.days?.length||1)]));}
export function validatePlan(plan,ctx) {
  if (plan===null)return true;
  if(!plan||!Array.isArray(plan.days)||plan.days.length<1||plan.days.length>7)throw new Error('A plan needs 1–7 days.');
  const dates=new Set();
  for(const d of plan.days){
    if(!validDate(d.date)||dates.has(d.date))throw new Error('Invalid or duplicate plan date.');dates.add(d.date);
    if(!Array.isArray(d.meals)||d.meals.length<3||d.meals.length>4)throw new Error('A day needs 3–4 meals.');
    const slots=new Set();
    for(const m of d.meals){
      if(!SLOTS.includes(m.slot)||slots.has(m.slot)||!ctx.recipes.has(m.recipeId))throw new Error('Invalid meal entry.');slots.add(m.slot);
      if(!ctx.recipes.get(m.recipeId).slots.includes(m.slot))throw new Error('Recipe does not match this meal type.');
      numberIn(m.servings,'Portions',.25,4);if(typeof m.locked!=='boolean')throw new Error('Invalid lock.');
    }
    if(!['breakfast','lunch','dinner'].every(s=>slots.has(s)))throw new Error('Missing main meal.');
  }
  for(let i=1;i<plan.days.length;i++)if(plan.days[i].date!==addDays(plan.days[0].date,i))throw new Error('Plan days must be consecutive.');
  return true;
}
export function seededRandom(seed) {let a=(Number(seed)>>>0)||1;return ()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
const fraction=(slot,meals)=> (meals===4?{breakfast:.25,lunch:.30,dinner:.33,snack:.12}:{breakfast:.28,lunch:.35,dinner:.37})[slot];
function nutritionScore(t,p) {
  let s=24*((t.kcal-p.calories)/p.calories)**2;
  if(p.protein>0)s+=6*(Math.max(0,p.protein-t.protein)/p.protein)**2;
  if(p.carbs>0)s+=1.5*((t.carbs-p.carbs)/p.carbs)**2;
  if(p.fat>0)s+=1.5*((t.fat-p.fat)/p.fat)**2;
  return s;
}
function adjust(t,n,m) {for(const k of NUTRIENTS)t[k]+=n[k]*m;}
function tune(groups,p,ctx,passes=3) {
  const totals=Array.from({length:p.days},zero);
  for(const g of groups)for(const d of g.days)adjust(totals[d],ctx.nutrition.get(g.recipeId),g.servings);
  for(let pass=0;pass<passes;pass++)for(const g of groups){
    if(g.locked)continue;
    const n=ctx.nutrition.get(g.recipeId);for(const d of g.days)adjust(totals[d],n,-g.servings);
    let best=g.servings,bestScore=Infinity;
    for(let q=10;q<=50;q++){
      const v=q/20;
      let score=0;
      for(const d of g.days){const t={...totals[d]};adjust(t,n,v);score+=nutritionScore(t,p);}
      const ideal=p.calories*fraction(g.slot,p.meals);
      score+=g.days.length*.03*((n.kcal*v-ideal)/ideal)**2;
      if(score<bestScore){bestScore=score;best=v;}
    }
    g.servings=best;for(const d of g.days)adjust(totals[d],n,best);
  }
  return totals.reduce((s,t)=>s+nutritionScore(t,p),0);
}
function pantryCoverage(r,pantry,ctx) {
  const items=r.ingredients.filter(i=>ctx.foods.get(i.foodId).aisle!=='Water');
  return items.reduce((s,i)=>s+Math.min(1,(pantry[i.foodId]||0)/i.grams),0)/Math.max(1,items.length);
}
/** Seeded multi-start coordinate search. Targets are soft, restrictions are hard. */
export function generatePlan(raw,ctx,{seed=Date.now(),existing=null,pantry={}}={}) {
  const p=normalizePreferences(raw), rand=seededRandom(seed),slots=SLOTS.slice(0,p.meals),pools={};
  for(const s of slots){pools[s]=allowedRecipes(p,ctx,s);if(!pools[s].length)throw new Error(`No ${s} recipes satisfy these restrictions. Increase the cooking-time limit, add a compatible recipe, or review exclusions. No restriction was relaxed.`);}
  const template=[], groupMap=new Map();
  for(let d=0;d<p.days;d++)for(const slot of slots){
    const date=addDays(p.startDate,d),old=existing?.days?.find(x=>x.date===date)?.meals.find(x=>x.slot===slot);
    if(old?.locked){
      if(!eligible(ctx.recipes.get(old.recipeId),p,ctx,slot))throw new Error(`Locked ${slot} on ${date} conflicts with your new restrictions. Unlock or replace it first.`);
      template.push({slot,days:[d],recipeId:old.recipeId,servings:old.servings,locked:true});continue;
    }
    const key=p.mode==='variety'?`${d}-${slot}`:`${slot}-${(p.mode==='batch'||slot==='dinner')&&d>=3?'b':'a'}`;
    if(!groupMap.has(key)){const g={slot,days:[],locked:false};groupMap.set(key,g);template.push(g);}groupMap.get(key).days.push(d);
  }
  let winner=null,winnerScore=Infinity;
  const attempts=p.mode==='variety'?22:48;
  for(let attempt=0;attempt<attempts;attempt++){
    const used=new Map(),usedBySlot=new Map(slots.map(slot=>[slot,new Set()])),groups=template.map(g=>{
      if(g.locked)return {...g};
      let pool=pools[g.slot];
      if(p.mode==='batch'){
        const alternatives=pool.filter(r=>!usedBySlot.get(g.slot).has(r.id));
        if(alternatives.length)pool=alternatives;
      }
      const ranked=pool.map(r=>{
        let w=1+(p.favorites.includes(r.id)?2:0)+(p.usePantry?pantryCoverage(r,pantry,ctx):0);
        if(used.has(r.id))w*=.15;
        return {r,rank:-Math.log(Math.max(1e-9,rand()))/w};
      }).sort((a,b)=>a.rank-b.rank);
      const r=ranked[0].r;used.set(r.id,(used.get(r.id)||0)+1);
      usedBySlot.get(g.slot).add(r.id);
      return {...g,recipeId:r.id,servings:clamp(round(p.calories*fraction(g.slot,p.meals)/ctx.nutrition.get(r.id).kcal*20)/20,.5,2.5)};
    });
    let score=tune(groups,p,ctx,4);
    const seen=new Map();
    for(const g of groups){seen.set(g.recipeId,(seen.get(g.recipeId)||0)+1);if(p.favorites.includes(g.recipeId))score-=.0008*g.days.length;if(p.usePantry)score-=.0006*g.days.length*pantryCoverage(ctx.recipes.get(g.recipeId),pantry,ctx);}
    if(p.mode==='variety')score+=[...seen.values()].reduce((s,n)=>s+Math.max(0,n-1)*.005,0);
    else score+=[...seen.values()].reduce((s,n)=>s+Math.max(0,n-1)*.002,0);
    if(score<winnerScore){winnerScore=score;winner=groups;}
  }
  const plan={version:1,seed:Number(seed)>>>0,days:Array.from({length:p.days},(_,d)=>({date:addDays(p.startDate,d),meals:slots.map(slot=>{
    const g=winner.find(g=>g.slot===slot&&g.days.includes(d));return {slot,recipeId:g.recipeId,servings:g.servings,locked:g.locked};
  })}))};
  validatePlan(plan,ctx);return plan;
}
export function groceryList(plan,ctx,household=1,pantry={}) {
  numberIn(household,'Household',1,12,true);const amounts=new Map();
  for(const d of plan?.days||[])for(const m of d.meals)for(const i of ctx.recipes.get(m.recipeId).ingredients){
    if(ctx.foods.get(i.foodId).aisle==='Water')continue;
    amounts.set(i.foodId,(amounts.get(i.foodId)||0)+i.grams*m.servings*household);
  }
  return [...amounts].map(([id,grams])=>{const owned=Math.max(0,Number(pantry[id])||0);return {id,...ctx.foods.get(id),needed:grams,pantryUsed:Math.min(owned,grams),buy:Math.max(0,grams-owned)};}).sort((a,b)=>a.aisle.localeCompare(b.aisle)||a.name.localeCompare(b.name));
}
export function prepSchedule(plan,ctx,p) {
  if(!plan)return [];
  const jobs=new Map();
  for(let d=0;d<plan.days.length;d++)for(const m of plan.days[d].meals){
    const r=ctx.recipes.get(m.recipeId);
    let session=p.mode==='variety'?d:p.mode==='freezer'&&r.freezer?0:d<3?0:3;
    if(r.prep!=='fresh'&&!(p.mode==='freezer'&&r.freezer)&&d-session>r.fridgeDays)session=d;
    const key=`${session}-${r.id}`;
    if(!jobs.has(key))jobs.set(key,{recipeId:r.id,sessionDay:session,date:plan.days[session].date,servings:0,fridgeServings:0,freezeServings:0,days:[],fresh:r.prep==='fresh'});
    const j=jobs.get(key),amount=m.servings*p.household;j.servings+=amount;j.days.push(d);
    if(p.mode==='freezer'&&r.freezer&&d-session>r.fridgeDays)j.freezeServings+=amount;else j.fridgeServings+=amount;
  }
  return [...jobs.values()].sort((a,b)=>a.sessionDay-b.sessionDay||Number(a.fresh)-Number(b.fresh)||ctx.recipes.get(b.recipeId).minutes-ctx.recipes.get(a.recipeId).minutes);
}
export function diagnostics(plan,p,ctx) {
  if(!plan)return [];
  const out=[];
  for(const d of plan.days){
    const t=dayTotals(d,ctx),problems=[];
    if(Math.abs(t.kcal-p.calories)>.1*p.calories)problems.push(`${Math.round(t.kcal)} kcal vs ${p.calories} target`);
    if(t.protein+1<p.protein)problems.push(`${Math.round(t.protein)} g protein vs ${p.protein} g minimum`);
    if(p.carbs&&Math.abs(t.carbs-p.carbs)>.2*p.carbs)problems.push('carbohydrate target outside ±20%');
    if(p.fat&&Math.abs(t.fat-p.fat)>.2*p.fat)problems.push('fat target outside ±20%');
    for(const m of d.meals)if(!eligible(ctx.recipes.get(m.recipeId),p,ctx,m.slot))problems.push(`${m.slot} conflicts with current filters`);
    if(problems.length)out.push({date:d.date,problems});
  }
  return out;
}
export function estimateEnergy({sex,age,weightKg,heightCm,activity,adjustment=0}) {
  if(!['male','female'].includes(sex))throw new Error('Choose the equation coefficient.');
  numberIn(age,'Age',18,100,true);numberIn(weightKg,'Weight (kg)',35,300);numberIn(heightCm,'Height (cm)',120,230);numberIn(activity,'Activity factor',1.2,2.2);numberIn(adjustment,'Calorie adjustment',-500,500);
  const resting=10*weightKg+6.25*heightCm-5*age+(sex==='male'?5:-161);
  return {resting:Math.round(resting),maintenance:Math.round(resting*activity),target:Math.round((resting*activity+adjustment)/50)*50};
}
export function formatWeight(grams,units='metric') {
  if(units==='imperial')return grams>=453.592?`${round(grams/453.592,2)} lb`:`${round(grams/28.3495,2)} oz`;
  return grams>=1000?`${round(grams/1000,2)} kg`:`${round(grams,grams<10?1:0)} g`;
}
export function groceryCSV(items,units='metric') {
  const cell=v=>{let text=String(v);if(typeof v==='string'&&/^[=+@\t\r-]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';};
  const rows=[['Aisle','Ingredient','Need (g)','Pantry used (g)','Buy (g)','Display amount','Weight basis']];
  for(const i of items)rows.push([i.aisle,i.name,round(i.needed,1),round(i.pantryUsed,1),round(i.buy,1),formatWeight(i.buy,units),i.basis]);
  return rows.map(r=>r.map(cell).join(',')).join('\r\n');
}
