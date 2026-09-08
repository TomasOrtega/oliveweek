import {defaultPreferences,normalizePreferences,createContext,validatePlan,validId,clone} from './core.js';
export const STORAGE_KEY='oliveweek.v2';
export function blankState(){return {version:2,preferences:defaultPreferences(),plan:null,pantry:{},checked:{},customFoods:[],customRecipes:[],savedPlans:[]};}
function matchPreferences(plan,p){
  if(plan&&(plan.days.length!==p.days||plan.days[0].date!==p.startDate||plan.days.some(d=>d.meals.length!==p.meals)))throw new Error('Plan dates or meal counts do not match its preferences.');
}
export function validateState(raw,catalogue){
  if(!raw||raw.version!==2)throw new Error('This is not an OliveWeek v2 backup. The unpublished v1 prototype used different recipe IDs. Its data is not overwritten.');
  if(!Array.isArray(raw.customFoods)||raw.customFoods.length>500||!Array.isArray(raw.customRecipes)||raw.customRecipes.length>500)throw new Error('Too many custom foods or recipes.');
  const preferences=normalizePreferences(raw.preferences), ctx=createContext(catalogue,raw.customFoods,raw.customRecipes);
  validatePlan(raw.plan,ctx);matchPreferences(raw.plan,preferences);
  const pantry={},checked={};
  if(!raw.pantry||typeof raw.pantry!=='object'||Array.isArray(raw.pantry))throw new Error('Invalid pantry.');
  for(const [id,g] of Object.entries(raw.pantry)){
    if(!validId(id)||!ctx.foods.has(id)||typeof g!=='number'||!Number.isFinite(g)||g<0||g>100000)throw new Error('Invalid pantry amount.');
    pantry[id]=g;
  }
  if(raw.checked&&typeof raw.checked==='object'&&!Array.isArray(raw.checked))for(const [id,v]of Object.entries(raw.checked))if(validId(id)&&ctx.foods.has(id)&&typeof v==='boolean')checked[id]=v;
  if(!Array.isArray(raw.savedPlans)||raw.savedPlans.length>30)throw new Error('A backup may contain at most 30 saved plans.');
  const savedPlans=raw.savedPlans.map(s=>{
    if(!validId(s.id)||typeof s.name!=='string'||s.name.length>120)throw new Error('Invalid saved plan.');
    validatePlan(s.plan,ctx);if(!s.plan)throw new Error('Saved plan is empty.');
    const preferences=normalizePreferences(s.preferences);matchPreferences(s.plan,preferences);
    return {id:s.id,name:s.name,preferences,plan:clone(s.plan)};
  });
  return {version:2,preferences,plan:clone(raw.plan),pantry,checked,customFoods:clone(raw.customFoods),customRecipes:clone(raw.customRecipes),savedPlans};
}
export function parseBackup(text,catalogue){
  if(typeof text!=='string'||text.length>5_000_000)throw new Error('Backup exceeds the 5 MB limit.');
  let data;try{data=JSON.parse(text);}catch{throw new Error('That file is not valid JSON.');}
  return validateState(data,catalogue);
}
export function loadState(storage,catalogue){
  try{const text=storage.getItem(STORAGE_KEY);return {state:text?parseBackup(text,catalogue):blankState(),warning:null};}
  catch(e){return {state:blankState(),warning:`Saved data could not be read: ${e.message} The old data has not been overwritten.`};}
}
export function saveState(storage,state){
  try{storage.setItem(STORAGE_KEY,JSON.stringify(state));return null;}
  catch{return 'Browser storage is unavailable or full. Changes are only in memory. Export a backup before closing this tab.';}
}
