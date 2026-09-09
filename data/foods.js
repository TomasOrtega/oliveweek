/** Generic starter estimates per 100 g, NOT a verified USDA import.
 * Columns: id | name | kind | aisle | weight basis | allergens | kcal,p,c,f,fiber,sodium,saturated fat.
 * Sodium is in mg. Other macronutrients are in g. Check product labels.
 */
const rows = `
oats|Rolled oats|plant|Grains & bread|dry weight|gluten|379,13.2,67.7,6.5,10.1,2,1.2
yogurt|Plain Greek yogurt, 2%|dairy|Dairy & eggs|as sold|milk|73,10,3.9,1.9,0,34,1.2
milk|Milk, 2%|dairy|Dairy & eggs|as sold|milk|50,3.4,4.8,2,0,47,1.3
soy-milk|Unsweetened soy milk|plant|Plant proteins|as sold, brand varies|soy|33,2.9,1.7,1.6,0.4,33,0.2
chia|Chia seeds|plant|Nuts & seeds|raw edible weight||486,16.5,42.1,30.7,34.4,16,3.3
walnuts|Walnuts|plant|Nuts & seeds|raw edible weight|tree-nuts|654,15.2,13.7,65.2,6.7,2,6.1
almonds|Almonds|plant|Nuts & seeds|raw edible weight|tree-nuts|579,21.2,21.6,49.9,12.5,1,3.8
pumpkin-seeds|Unsalted pumpkin seeds|plant|Nuts & seeds|raw edible weight||559,30.2,10.7,49.1,6,7,8.7
banana|Banana, peeled|plant|Fruit|raw edible weight||89,1.1,22.8,0.3,2.6,1,0.1
berries|Blueberries|plant|Fruit|raw edible weight||57,0.7,14.5,0.3,2.4,1,0
apple|Apple, cored|plant|Fruit|raw edible weight||52,0.3,13.8,0.2,2.4,1,0
orange|Orange, peeled|plant|Fruit|raw edible weight||47,0.9,11.8,0.1,2.4,0,0
dates|Dates, pitted|plant|Fruit|edible weight||277,1.8,75,0.2,6.7,1,0
raisins|Raisins|plant|Fruit|as sold||299,3.1,79.2,0.5,3.7,11,0.1
honey|Honey|honey|Oils & seasonings|as sold||304,0.3,82.4,0,0,4,0
cinnamon|Ground cinnamon|plant|Oils & seasonings|dry weight||247,4,80.6,1.2,53.1,10,0.3
oil|Olive oil|plant|Oils & seasonings|as sold||884,0,0,100,0,2,13.8
lemon|Lemon juice|plant|Produce|juice weight, buy extra whole fruit||22,0.4,6.9,0.2,0.3,1,0
garlic|Garlic, peeled|plant|Produce|raw edible weight||149,6.4,33.1,0.5,2.1,17,0.1
oregano|Dried oregano|plant|Oils & seasonings|dry weight||265,9,68.9,4.3,42.5,25,1.6
cumin|Ground cumin|plant|Oils & seasonings|dry weight||375,17.8,44.2,22.3,10.5,168,1.5
paprika|Paprika|plant|Oils & seasonings|dry weight||282,14.1,54,12.9,34.9,68,2.1
pepper|Ground black pepper|plant|Oils & seasonings|dry weight||251,10.4,64,3.3,25.3,20,1.4
salt|Table salt|plant|Oils & seasonings|as sold||0,0,0,0,0,38758,0
egg|Egg, without shell|egg|Dairy & eggs|raw edible weight, about 50 g per large egg|egg|143,12.6,0.7,9.5,0,142,3.1
egg-white|Liquid egg whites|egg|Dairy & eggs|as sold|egg|52,10.9,0.7,0.2,0,166,0
bread|Whole-wheat bread|plant|Grains & bread|as sold, check label for animal ingredients and allergens|gluten,soy,milk,egg,sesame|247,13,41.3,4.2,6.8,400,0.9
pita|Whole-wheat pita|plant|Grains & bread|as sold, check label for animal ingredients and allergens|gluten,soy,milk,egg,sesame|262,9.8,55.9,1.7,6.1,421,0.3
rice|Brown rice|plant|Grains & bread|dry weight||367,7.5,76.3,3.2,3.6,5,0.6
quinoa|Quinoa|plant|Grains & bread|dry weight||368,14.1,64.2,6.1,7,5,0.7
bulgur|Bulgur|plant|Grains & bread|dry weight|gluten|342,12.3,75.9,1.3,18.3,17,0.2
pasta|Whole-wheat pasta|plant|Grains & bread|dry weight, use egg-free pasta for plant-based plans|gluten|348,14.6,70.2,2.5,8.3,8,0.4
lentils|Lentils|plant|Beans & canned goods|dry weight||352,24.6,63.4,1.1,10.7,6,0.2
chickpeas|Canned chickpeas|plant|Beans & canned goods|drained edible weight, rinse before use||139,7.1,22.5,2.8,6.4,246,0.3
white-beans|Canned white beans|plant|Beans & canned goods|drained edible weight, rinse before use||114,7.3,20.5,0.3,4.8,336,0.1
black-beans|Canned black beans|plant|Beans & canned goods|drained edible weight, rinse before use||132,8.9,23.7,0.5,8.7,240,0.1
tofu|Firm tofu|plant|Plant proteins|drained edible weight|soy|144,17.3,2.8,8.7,2.3,14,1.3
chicken|Skinless chicken breast|meat|Meat & fish|raw boneless edible weight||120,22.5,0,2.6,0,45,0.6
turkey|Ground turkey, 93% lean|meat|Meat & fish|raw weight||172,21.4,0,7,0,79,1.8
salmon|Salmon fillet|fish|Meat & fish|raw boneless edible weight|fish|208,20.4,0,13.4,0,59,3.1
cod|Cod fillet|fish|Meat & fish|raw boneless edible weight|fish|82,17.8,0,0.7,0,54,0.1
tuna|Canned light tuna in water|fish|Beans & canned goods|drained weight|fish|116,25.5,0,0.8,0,247,0.2
sardines|Canned sardines in oil|fish|Beans & canned goods|drained weight|fish|208,24.6,0,11.5,0,307,1.5
shrimp|Peeled shrimp|fish|Meat & fish|raw peeled weight|shellfish|85,20.1,0,0.5,0,119,0.1
feta|Feta cheese|dairy|Dairy & eggs|as sold, use vegetarian rennet where needed|milk|265,14.2,3.9,21.5,0,1139,14.9
cottage|Cottage cheese, 2%|dairy|Dairy & eggs|as sold|milk|82,11.1,4.3,2.3,0,321,1.4
tomato|Tomatoes|plant|Produce|raw edible weight||18,0.9,3.9,0.2,1.2,5,0
tomatoes-canned|Canned tomatoes, no salt added|plant|Beans & canned goods|with juice||24,1.2,5.3,0.3,1.5,10,0
cucumber|Cucumber|plant|Produce|raw edible weight||15,0.7,3.6,0.1,0.5,2,0
bell-pepper|Bell pepper, trimmed|plant|Produce|raw edible weight||31,1,6,0.3,2.1,4,0
zucchini|Zucchini|plant|Produce|raw edible weight||17,1.2,3.1,0.3,1,8,0.1
eggplant|Eggplant|plant|Produce|raw edible weight||25,1,5.9,0.2,3,2,0
broccoli|Broccoli, trimmed|plant|Produce|raw edible weight||34,2.8,6.6,0.4,2.6,33,0.1
spinach|Spinach|plant|Produce|raw edible weight||23,2.9,3.6,0.4,2.2,79,0.1
kale|Kale, stems removed|plant|Produce|raw edible weight||35,2.9,4.4,1.5,4.1,53,0.2
carrot|Carrots, trimmed|plant|Produce|raw edible weight||41,0.9,9.6,0.2,2.8,69,0
onion|Onion, peeled|plant|Produce|raw edible weight||40,1.1,9.3,0.1,1.7,4,0
potato|Potatoes|plant|Produce|raw edible weight||77,2,17.5,0.1,2.2,6,0
sweet-potato|Sweet potato|plant|Produce|raw edible weight||86,1.6,20.1,0.1,3,55,0
peas|Frozen green peas|plant|Frozen foods|frozen weight||77,5.2,13.6,0.4,4.5,108,0.1
edamame|Shelled edamame, cooked|plant|Frozen foods|cooked shelled weight|soy|121,11.9,8.9,5.2,5.2,6,0.6
avocado|Avocado flesh|plant|Produce|raw edible weight||160,2,8.5,14.7,6.7,7,2.1
olives|Pitted olives|plant|Beans & canned goods|drained edible weight||116,0.8,6,10.9,1.6,735,2.3
parsley|Fresh parsley|plant|Produce|raw edible weight||36,3,6.3,0.8,3.3,56,0.1
tahini|Tahini|plant|Nuts & seeds|as sold|sesame|595,17,21.2,53.8,9.3,115,7.5
vinegar|Red-wine vinegar|plant|Oils & seasonings|as sold||19,0,0.3,0,0,8,0
mushroom|Mushrooms|plant|Produce|raw edible weight||22,3.1,3.3,0.3,1,5,0.1
water|Water|plant|Water|water weight||0,0,0,0,0,0,0
peanut-butter|Peanut butter|plant|Nuts & seeds|as sold, check label|peanut|588,25,20,50,6,17,10
flour|Whole-wheat flour|plant|Grains & bread|dry weight|gluten|340,13.2,72,2.5,10.7,5,0.4
fennel|Fennel bulb|plant|Produce|raw trimmed weight||31,1.2,7.3,0.2,3.1,52,0.1
leek|Leek|plant|Produce|raw trimmed white and light-green parts||61,1.5,14.2,0.3,1.8,20,0
celery|Celery|plant|Produce|raw trimmed weight||14,0.7,3,0.2,1.6,80,0
corn|Sweetcorn|plant|Frozen foods|frozen or drained weight||86,3.3,19,1.4,2.7,15,0.2
cilantro|Cilantro|plant|Produce|raw edible weight||23,2.1,3.7,0.5,2.8,46,0
lime|Lime juice|plant|Produce|juice weight, buy extra whole fruit||25,0.4,8.4,0.1,0.4,2,0
pineapple|Pineapple, trimmed|plant|Fruit|raw edible weight||50,0.5,13.1,0.1,1.4,1,0
ginger|Fresh ginger, peeled|plant|Produce|raw edible weight||80,1.8,17.8,0.8,2,13,0.2
jalapeno|Jalapeño pepper, trimmed|plant|Produce|raw edible weight||29,0.9,6.5,0.4,2.8,3,0.1
mint|Fresh mint leaves|plant|Produce|raw edible weight||44,3.3,8.4,0.7,6.8,31,0.2
basil|Fresh basil|plant|Produce|raw edible weight||23,3.2,2.7,0.6,1.6,4,0
cauliflower|Cauliflower, trimmed|plant|Produce|raw edible weight||25,1.9,5,0.3,2,30,0.1
green-beans|Green beans, trimmed|plant|Produce|raw edible weight||31,1.8,7,0.1,2.7,6,0
asparagus|Asparagus, trimmed|plant|Produce|raw edible weight||20,2.2,3.9,0.1,2.1,2,0
beets|Beets, trimmed|plant|Produce|raw edible weight||43,1.6,10,0.2,2.8,78,0
butternut-squash|Butternut squash, trimmed|plant|Produce|raw edible weight||45,1,11.7,0.1,2,4,0
acorn-squash|Acorn squash, trimmed|plant|Produce|raw edible weight||40,0.8,10.4,0.1,1.5,3,0
shallot|Shallots, peeled|plant|Produce|raw edible weight||72,2.5,16.8,0.1,3.2,12,0
artichoke|Artichoke hearts|plant|Produce|trimmed raw edible weight||47,3.3,10.5,0.2,5.4,94,0
soy-sauce|Soy sauce|plant|Oils & seasonings|as sold, brand varies|soy,gluten|53,8.1,4.9,0.6,0.8,5493,0.1
miso|Miso paste|plant|Oils & seasonings|as sold, brand varies|soy|198,12.8,25.4,6,5.4,3728,1
doubanjiang|Doubanjiang|plant|Oils & seasonings|as sold, brand varies|soy|83,5,10,2,3,4500,0.4
sriracha|Sriracha sauce|plant|Oils & seasonings|as sold, brand varies||93,1.3,20,0.9,2.1,2120,0.1
oyster-sauce|Oyster sauce|fish|Oils & seasonings|as sold, brand varies|shellfish,soy,gluten|51,1.4,10.9,0.3,0.3,2733,0.1
rice-wine|Rice cooking wine or sake|plant|Oils & seasonings|as sold||134,0.5,5,0,0,5,0
liquid-smoke|Liquid smoke|plant|Oils & seasonings|as sold, brand varies||0,0,0,0,0,5,0
sugar|Granulated sugar|plant|Oils & seasonings|dry weight||387,0,100,0,0,1,0
lite-salt|Lite salt|plant|Oils & seasonings|as sold, about half sodium chloride||0,0,0,0,0,19379,0
canola-oil|Canola oil|plant|Oils & seasonings|as sold||884,0,0,100,0,0,7.4
curry-powder|Japanese curry powder|plant|Oils & seasonings|dry weight, brand varies||325,14.3,55.8,14,53,52,2
cocoa-powder|Unsweetened cocoa powder|plant|Oils & seasonings|dry weight||228,19.6,57.9,13.7,37,21,8.1
peanuts|Unsalted peanuts|plant|Nuts & seeds|edible weight|peanut|567,25.8,16.1,49.2,8.5,18,6.3
cashews|Cashews|plant|Nuts & seeds|raw edible weight|tree-nuts|553,18.2,30.2,43.9,3.3,12,7.8
sesame-seeds|Sesame seeds|plant|Nuts & seeds|dry weight|sesame|573,17.7,23.4,49.7,11.8,11,7
nutritional-yeast|Nutritional yeast|plant|Oils & seasonings|dry weight, brand varies||325,45,35,5,20,200,1
cornmeal|Masa harina|plant|Grains & bread|dry weight||370,7,79,3.5,7.3,7,0.5
rice-flour|Rice flour|plant|Grains & bread|dry weight||366,6,80.1,1.4,2.4,0,0.4
corn-tortilla|Corn tortillas|plant|Grains & bread|as sold||218,5.7,44.6,2.9,6.3,45,0.4
ramen-noodles|Ramen noodles|plant|Grains & bread|dry weight, check label for egg and sodium|gluten|350,10,72,2,3,1000,0.5
black-beans-dry|Dry black beans|plant|Beans & canned goods|dry weight||341,21.6,62.4,1.4,15.5,5,0.4
chickpeas-dry|Dry chickpeas|plant|Beans & canned goods|dry weight||364,19.3,60.7,6,17.4,24,0.6
mung-beans|Dry mung beans|plant|Beans & canned goods|dry weight||347,23.9,62.6,1.2,16.3,15,0.3
lima-beans-dry|Dry large lima beans|plant|Beans & canned goods|dry weight||338,21.5,63.4,0.7,19,18,0.2
tempeh|Tempeh|plant|Plant proteins|as sold, brand varies|soy|192,20.3,7.6,10.8,0,9,2.2
vital-wheat-gluten|Vital wheat gluten|plant|Plant proteins|dry weight|gluten|370,75,14,1.9,0.6,29,0.3
soy-chorizo|Soy chorizo|plant|Plant proteins|as sold, brand varies|soy|250,14.3,8,14.3,3,1054,2.7
plant-cheese|Plant-based mozzarella|plant|Plant proteins|as sold, brand varies|tree-nuts|254,3,25,21,1,791,3
marinated-artichokes|Marinated artichoke hearts|plant|Beans & canned goods|drained weight, brand varies||160,8,8,8,4,800,1
adobo-peppers|Chipotle peppers in adobo|plant|Beans & canned goods|as sold, brand varies||72,3,12,2,4,1000,0.3
tomato-paste|Tomato paste|plant|Beans & canned goods|as sold||82,4.3,18.9,0.5,4.1,59,0.1
sun-dried-tomatoes|Sun-dried tomatoes in oil|plant|Beans & canned goods|drained weight, brand varies||258,14.1,55.8,3,12.3,2095,0.4
kelp|Dried kelp|plant|Oils & seasonings|dry weight||43,1.7,9.6,0.6,1.3,233,0.2
bok-choy|Bok choy, trimmed|plant|Produce|raw edible weight||13,1.5,2.2,0.2,1,65,0
`;
const nutrients = ['kcal','protein','carbs','fat','fiber','sodium','saturatedFat'];
export const foods = rows.trim().split('\n').map(row => {
  const [id,name,kind,aisle,basis,tags,values] = row.split('|');
  const nums = values.split(',').map(Number);
  if(nums.length !== nutrients.length || nums.some(n=>!Number.isFinite(n))) throw new Error(`Bad food row: ${id}`);
  return {id,name,kind,aisle,basis,allergens:tags?tags.split(','):[],per100g:Object.fromEntries(nutrients.map((n,i)=>[n,nums[i]])),source:{type:'starter-estimate',description:'Generic starter estimate. Not a verified USDA import or product label. See docs/NUTRITION.md.'}};
});
