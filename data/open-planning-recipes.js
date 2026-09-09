/** OliveWeek-authored recipes released under the project's MIT license. */
const source = 'https://github.com/TomasOrtega/oliveweek';
const licenseSource = `${source}/blob/main/LICENSE`;
const storage = 'Refrigerate promptly at 4°C / 40°F or below and use within 3 days. Freeze only when the recipe says it is suitable, and thaw in the refrigerator.';
const dipStorage = 'Refrigerate the dip and dippers separately at 4°C / 40°F or below and use within 3 days. Freeze the dip only; prepare fresh dippers after thawing.';
const freshDipStorage = 'Refrigerate the dip and dippers separately at 4°C / 40°F or below and use within 3 days. Do not freeze; prepare and eat the avocado spread fresh.';

function ingredients(entries) {
  const totals = new Map();
  for (const [foodId,grams] of entries) totals.set(foodId,(totals.get(foodId)||0)+grams);
  return [...totals].map(([foodId,grams])=>({foodId,grams}));
}

function recipe(slug,name,slot,minutes,amounts,steps,options={}) {
  return {
    id:`open-${slug}`,
    name,
    slots:[slot],
    minutes,
    ingredients:ingredients(amounts),
    steps,
    prep:'batch',
    freezer:true,
    fridgeDays:3,
    storage,
    mediterranean:true,
    description:`An OliveWeek-authored, weighed ${slot} recipe released with the project under the MIT license.`,
    servingNote:'Amounts are for one base portion. Grains are weighed dry, canned beans are drained, and nutrition includes all listed oil.',
    collection:'OliveWeek Recipe Pack',
    photoId:slug,
    author:'OliveWeek contributors',
    license:'MIT',
    licenseSource,
    source,
    ...options,
  };
}

const fruits = [
  {slug:'banana',name:'Banana',foodId:'banana',grams:100},
  {slug:'blueberry',name:'Blueberry',foodId:'berries',grams:110},
  {slug:'apple',name:'Apple',foodId:'apple',grams:110},
  {slug:'orange',name:'Orange',foodId:'orange',grams:130},
  {slug:'pineapple',name:'Pineapple',foodId:'pineapple',grams:120},
];

const toppings = [
  {slug:'chia',name:'chia',foodId:'chia',grams:14},
  {slug:'walnut',name:'walnut',foodId:'walnuts',grams:16},
  {slug:'almond',name:'almond',foodId:'almonds',grams:16},
  {slug:'pumpkin-seed',name:'pumpkin seed',foodId:'pumpkin-seeds',grams:18},
  {slug:'peanut-butter',name:'peanut butter',foodId:'peanut-butter',grams:20},
];

const overnightOats = fruits.flatMap(fruit=>toppings.map(topping=>recipe(
  `breakfast-overnight-${fruit.slug}-${topping.slug}`,
  `${fruit.name}, ${topping.name} & soy overnight oats`,
  'breakfast',
  10,
  [['oats',60],['soy-milk',210],[fruit.foodId,fruit.grams],[topping.foodId,topping.grams],['cinnamon',0.5]],
  [
    `Chop or mash the ${fruit.name.toLowerCase()} as needed.`,
    `Stir it with the oats, soy milk, ${topping.name} and cinnamon in a covered container.`,
    'Refrigerate overnight, stir again, and eat cold. Prepare no more than 3 refrigerated portions at a time.',
  ],
  {prep:'fresh',freezer:false},
)));

const yogurtBowls = fruits.flatMap(fruit=>toppings.map(topping=>recipe(
  `breakfast-yogurt-${fruit.slug}-${topping.slug}`,
  `${fruit.name} & ${topping.name} yogurt breakfast bowl`,
  'breakfast',
  5,
  [['yogurt',190],['oats',35],[fruit.foodId,fruit.grams],[topping.foodId,topping.grams],['honey',8]],
  [
    `Chop or mash the ${fruit.name.toLowerCase()} as needed.`,
    'Spoon the yogurt into a bowl and top with the oats and fruit.',
    `Finish with the ${topping.name} and honey. Assemble just before eating.`,
  ],
  {prep:'fresh',freezer:false},
)));

const smoothieBoosters = [
  {slug:'oat',name:'oat',foodId:'oats',grams:38},
  {slug:'chia',name:'chia',foodId:'chia',grams:16},
  {slug:'peanut-butter',name:'peanut butter',foodId:'peanut-butter',grams:22},
  {slug:'almond',name:'almond',foodId:'almonds',grams:20},
  {slug:'pumpkin-seed',name:'pumpkin seed',foodId:'pumpkin-seeds',grams:22},
];

const breakfastSmoothies = fruits.flatMap(fruit=>smoothieBoosters.map(booster=>recipe(
  `breakfast-smoothie-${fruit.slug}-${booster.slug}`,
  `${fruit.name} & ${booster.name} breakfast smoothie`,
  'breakfast',
  5,
  [['yogurt',120],['milk',190],[fruit.foodId,fruit.grams],[booster.foodId,booster.grams]],
  [
    `Chop the ${fruit.name.toLowerCase()} if needed.`,
    `Blend the fruit, yogurt, milk and ${booster.name} until smooth, adding a little water if needed.`,
    'Drink promptly or keep refrigerated until serving. Stir if the smoothie separates.',
  ],
  {prep:'fresh',freezer:false},
)));

const savoryFillings = [
  {slug:'spinach-tomato',name:'spinach & tomato',amounts:[['spinach',60],['tomato',110]],prep:'Chop the spinach and tomato.'},
  {slug:'mushroom-pepper',name:'mushroom & pepper',amounts:[['mushroom',100],['bell-pepper',90]],prep:'Slice the mushrooms and dice the pepper.'},
  {slug:'zucchini-onion',name:'zucchini & onion',amounts:[['zucchini',130],['onion',55]],prep:'Dice the zucchini and onion.'},
  {slug:'kale-sweet-potato',name:'kale & sweet potato',amounts:[['kale',60],['sweet-potato',140]],prep:'Dice the sweet potato and chop the kale. Steam the sweet potato until nearly tender.'},
  {slug:'broccoli-feta',name:'broccoli & feta',amounts:[['broccoli',120],['feta',32]],prep:'Chop the broccoli and steam it until nearly tender. Crumble the feta.'},
];

const savoryFormats = [
  {
    slug:'egg-scramble', label:f=>`${f.name} scrambled eggs with toast`, minutes:25,
    amounts:[['egg',110],['bread',65],['oil',6],['pepper',0.3]],
    steps:f=>[f.prep,'Warm the oil in a skillet and cook the vegetables until tender.','Add beaten egg and pepper. Stir until the egg reaches 71°C / 160°F, then serve with toast.'],
    options:{freezer:false},
  },
  {
    slug:'tofu-scramble', label:f=>`${f.name} tofu scramble with toast`, minutes:25,
    amounts:[['tofu',170],['bread',65],['oil',6],['nutritional-yeast',8],['paprika',1]],
    steps:f=>[f.prep,'Warm the oil in a skillet and cook the vegetables until tender.','Crumble in the tofu, nutritional yeast and paprika. Cook until piping hot and serve with toast.'],
  },
  {
    slug:'quinoa-bowl', label:f=>`${f.name} breakfast quinoa bowl`, minutes:30,
    amounts:[['quinoa',65],['chickpeas',85],['oil',6],['lemon',12]],
    steps:f=>[f.prep,'Cook the quinoa in water according to its packet.','Cook the vegetables in the oil until tender. Stir in rinsed chickpeas and cooked quinoa, heat through, and finish with lemon.'],
  },
  {
    slug:'breakfast-tacos', label:f=>`${f.name} breakfast tacos`, minutes:25,
    amounts:[['egg',100],['corn-tortilla',80],['oil',6],['cumin',0.7]],
    steps:f=>[f.prep,'Warm the oil and cook the vegetables with cumin until tender.','Add beaten egg and cook to 71°C / 160°F. Warm the tortillas and divide the filling among them.'],
    options:{freezer:false},
  },
  {
    slug:'savory-oats', label:f=>`Savory oats with ${f.name}`, minutes:25,
    amounts:[['oats',60],['egg',55],['water',260],['oil',5],['pepper',0.3]],
    steps:f=>[f.prep,'Cook the vegetables in the oil until tender. Add the oats and water and simmer until thick.','Stir in the beaten egg and pepper. Continue stirring until the egg reaches 71°C / 160°F.'],
    options:{freezer:false},
  },
];

const savoryBreakfasts = savoryFormats.flatMap(format=>savoryFillings.map(filling=>recipe(
  `breakfast-${format.slug}-${filling.slug}`,
  format.label(filling),
  'breakfast',
  format.minutes,
  [...format.amounts,...filling.amounts],
  format.steps(filling),
  format.options,
)));

const biteFlavors = [
  {slug:'banana',name:'Banana',foodId:'banana',grams:65},
  {slug:'apple',name:'Apple',foodId:'apple',grams:65},
  {slug:'blueberry',name:'Blueberry',foodId:'berries',grams:55},
  {slug:'orange',name:'Orange',foodId:'orange',grams:55},
  {slug:'pineapple',name:'Pineapple',foodId:'pineapple',grams:55},
];

const energyBites = biteFlavors.flatMap(flavor=>toppings.map(topping=>recipe(
  `snack-bites-${flavor.slug}-${topping.slug}`,
  `${flavor.name} & ${topping.name} energy bites`,
  'snack',
  15,
  [['oats',45],['dates',40],[flavor.foodId,flavor.grams],[topping.foodId,topping.grams],['cinnamon',0.5]],
  [
    `Finely chop the dates and ${flavor.name.toLowerCase()}, or pulse them briefly in a food processor.`,
    `Mix with the oats, ${topping.name} and cinnamon until the mixture holds together.`,
    'Shape into small bites and refrigerate until firm. Keep chilled until serving.',
  ],
  {},
)));

const hummusFlavors = [
  {slug:'pepper',name:'Roasted pepper',amounts:[['bell-pepper',85],['paprika',0.8]],prep:'Roast or sauté the pepper until tender, then cool slightly.'},
  {slug:'beet',name:'Beet',amounts:[['beets',85],['cumin',0.6]],prep:'Steam or roast the beet until completely tender, then cool slightly.'},
  {slug:'carrot',name:'Carrot',amounts:[['carrot',90],['cumin',0.6]],prep:'Steam or roast the carrot until completely tender, then cool slightly.'},
  {slug:'spinach-herb',name:'Spinach herb',amounts:[['spinach',55],['parsley',6]],prep:'Wilt the spinach, squeeze out excess water, and cool.'},
  {slug:'olive',name:'Olive',amounts:[['olives',38],['oregano',0.8]],prep:'Rinse the olives if they are very salty.'},
];

const dippers = [
  {slug:'carrot',name:'carrot sticks',amounts:[['carrot',130]]},
  {slug:'cucumber',name:'cucumber rounds',amounts:[['cucumber',160]]},
  {slug:'pepper',name:'pepper strips',amounts:[['bell-pepper',130]]},
  {slug:'pita',name:'pita wedges',amounts:[['pita',50]]},
  {slug:'tortilla',name:'corn tortilla wedges',amounts:[['corn-tortilla',65]]},
];

const hummusSnacks = hummusFlavors.flatMap(flavor=>dippers.map(dipper=>recipe(
  `snack-hummus-${flavor.slug}-${dipper.slug}`,
  `${flavor.name} hummus with ${dipper.name}`,
  'snack',
  40,
  [['chickpeas',110],['tahini',18],['lemon',15],['garlic',3],['oil',4],...flavor.amounts,...dipper.amounts],
  [
    flavor.prep,
    'Blend the prepared flavoring with rinsed chickpeas, tahini, lemon, garlic and oil. Add water a spoonful at a time until smooth.',
    `Prepare the ${dipper.name}; toast wedges until crisp if desired. Keep the dip and dippers separate until eating.`,
  ],
  {storage:dipStorage,servingNote:'Amounts are for one base portion. Canned chickpeas are drained, and nutrition includes all listed oil. Dippers are included; freeze the hummus only.'},
)));

const roastBases = [
  {slug:'chickpeas',name:'chickpeas',amounts:[['chickpeas',175]],prep:'Rinse and thoroughly dry the chickpeas.'},
  {slug:'sweet-potato',name:'sweet potato',amounts:[['sweet-potato',220]],prep:'Cut the sweet potato into small, even pieces.'},
  {slug:'cauliflower',name:'cauliflower',amounts:[['cauliflower',240]],prep:'Cut the cauliflower into small florets and dry well.'},
  {slug:'broccoli',name:'broccoli',amounts:[['broccoli',240]],prep:'Cut the broccoli into small florets and dry well.'},
  {slug:'edamame',name:'edamame',amounts:[['edamame',185]],prep:'Pat the cooked edamame dry.'},
];

const roastFlavors = [
  {slug:'smoky-paprika',name:'Smoky paprika',amounts:[['oil',8],['paprika',2],['garlic',4]],finish:'Season with paprika and finely minced garlic before roasting.'},
  {slug:'cumin-lemon',name:'Cumin lemon',amounts:[['oil',8],['cumin',1],['lemon',15]],finish:'Roast with the oil and cumin, then add lemon after cooking.'},
  {slug:'oregano-garlic',name:'Oregano garlic',amounts:[['oil',8],['oregano',1.5],['garlic',5]],finish:'Season with oregano and finely minced garlic before roasting.'},
  {slug:'sriracha-lime',name:'Sriracha lime',amounts:[['oil',6],['sriracha',12],['lime',15]],finish:'Roast with the oil, then toss with sriracha and lime while hot.',mediterranean:false},
  {slug:'sesame-soy',name:'Sesame soy',amounts:[['oil',5],['sesame-seeds',9],['soy-sauce',10]],finish:'Roast with the oil, then toss with sesame seeds and soy sauce while hot.',mediterranean:false},
];

const roastedSnacks = roastBases.flatMap(base=>roastFlavors.map(flavor=>recipe(
  `snack-roasted-${base.slug}-${flavor.slug}`,
  `${flavor.name} roasted ${base.name}`,
  'snack',
  40,
  [...base.amounts,...flavor.amounts],
  [
    'Heat the oven to 220°C / 425°F and line a tray.',
    `${base.prep} ${flavor.finish}`,
    'Spread in one layer and roast until browned and tender, stirring halfway through. Start checking after 18 minutes.',
  ],
  {freezer:false,mediterranean:flavor.mediterranean??true},
)));

const spreads = [
  {slug:'white-bean-lemon',name:'White bean lemon spread',minutes:10,amounts:[['white-beans',140],['lemon',16],['garlic',2],['oil',5]],steps:['Rinse and drain the beans.','Blend the beans with lemon, garlic and oil, adding water a spoonful at a time until smooth.'],options:{}},
  {slug:'black-bean-cumin',name:'Black bean cumin spread',minutes:10,amounts:[['black-beans',140],['lime',15],['cumin',1],['oil',5]],steps:['Rinse and drain the beans.','Blend the beans with lime, cumin and oil, adding water a spoonful at a time until smooth.'],options:{}},
  {slug:'edamame-ginger',name:'Edamame ginger spread',minutes:10,amounts:[['edamame',145],['ginger',4],['lime',15],['oil',4]],steps:['Confirm the edamame is fully cooked and cooled.','Blend the edamame with ginger, lime and oil, adding water a spoonful at a time until smooth.'],options:{mediterranean:false}},
  {slug:'lentil-paprika',name:'Lentil paprika spread',minutes:35,amounts:[['lentils',55],['paprika',1],['lemon',15],['oil',5]],steps:['Rinse the lentils and simmer them in water until completely tender, then drain and cool slightly.','Blend the lentils with paprika, lemon and oil, adding water a spoonful at a time until smooth.'],options:{}},
  {slug:'avocado-herb',name:'Avocado herb spread',minutes:10,amounts:[['avocado',100],['cilantro',5],['lime',15]],steps:['Chop the cilantro.','Mash the avocado with cilantro and lime until mostly smooth.'],options:{prep:'fresh',freezer:false}},
];

const spreadSnacks = spreads.flatMap(spread=>dippers.map(dipper=>recipe(
  `snack-spread-${spread.slug}-${dipper.slug}`,
  `${spread.name} with ${dipper.name}`,
  'snack',
  spread.minutes,
  [...spread.amounts,...dipper.amounts],
  [
    ...spread.steps,
    `Prepare the ${dipper.name}; toast wedges until crisp if desired. Keep the spread and dippers separate until eating.`,
  ],
  {...spread.options,storage:spread.options.freezer===false?freshDipStorage:dipStorage,servingNote:'Amounts are for one base portion. Beans are drained unless identified as dry, and dippers are included; freeze only a spread marked as freezer-suitable.'},
)));

export const openPlanningRecipes = [
  ...overnightOats,
  ...yogurtBowls,
  ...breakfastSmoothies,
  ...savoryBreakfasts,
  ...energyBites,
  ...hummusSnacks,
  ...roastedSnacks,
  ...spreadSnacks,
];
