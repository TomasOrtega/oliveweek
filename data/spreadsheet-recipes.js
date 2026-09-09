/** Recipes indexed in RECIPES RECEPTES.xlsx, imported on 2026-09-08.
 * Amounts are edible grams for one workbook portion. The workbook is the
 * authority for recipe content; generic food records only support planning.
 */
const ingredients = text => text.split(',').map(part => {
  const [foodId, grams] = part.trim().split(':');
  return {foodId, grams:Number(grams)};
});

const storage = 'Cool promptly in shallow containers and refrigerate within 2 hours at 4°C / 40°F or below. Use within 3 days, or freeze suitable cooked portions. Reheat cooked leftovers to 74°C / 165°F.';
const workbookSha256 = '866624de9c902aff5c217070731852d5d618616be1ef3dba29629ac12220b479';

function r(slug,name,slots,minutes,amounts,steps,options={}) {
  return {
    id:'xls-'+slug,
    photoId:slug,
    name,
    slots:slots.split(','),
    minutes,
    ingredients:ingredients(amounts),
    steps:steps.split('|'),
    prep:'batch',
    freezer:true,
    fridgeDays:3,
    storage,
    mediterranean:false,
    sourceCollection:'RECIPES RECEPTES.xlsx',
    sourceWorkbookSha256:workbookSha256,
    author:'Personal recipe collection',
    license:'User-provided recipe',
    description:'Imported from the indexed recipe collection in RECIPES RECEPTES.xlsx. Directions are lightly edited for clarity.',
    servingNote:'Amounts are for one workbook base portion. Dry beans, grains and pasta use dry weights unless the ingredient says otherwise. The credited photograph is illustrative and may show different garnishes.',
    ...options,
  };
}

export const spreadsheetRecipes = [
  r('pineapple-tofu','Pineapple tofu with rice','lunch,dinner',70,
    'pineapple:39.375,vinegar:5.625,soy-sauce:6.875,miso:4.375,sugar:5,lite-salt:0.1875,ginger:1.25,garlic:1.5,sriracha:6.875,oyster-sauce:5,rice-wine:1.875,tofu:113.5,cauliflower:56.75,oil:11.25,mushroom:27.5,peanuts:10,rice:80',
    'Press and dry the tofu. Marinate briefly with soy sauce and oyster sauce.|Bake the tofu on a lined tray at 200°C / 400°F for 15 minutes per side.|Blend pineapple with the vinegar, miso, sugar, ginger, garlic, sriracha and rice wine. Simmer the sauce gently.|Roast the cauliflower and mushrooms until tender.|Combine the tofu, vegetables and sauce. Cook rice separately and finish with peanuts.',
    {description:'Imported from the PINEAPPLE TOFU worksheet. The workbook notes that the sauce and vegetables may need scaling up for large batches.'}),

  r('gorditas','Bean gorditas with avocado salsa','lunch,dinner',80,
    'cornmeal:90,lite-salt:2.25,oil:13.75,black-beans-dry:50,avocado:41.6667,tomato:33.3333,jalapeno:4.1667,onion:4.1667,garlic:0.8333',
    'Cook the black beans until fully tender, then mash with garlic, onion and part of the oil.|Mix masa harina with lite salt and enough warm water to form a soft dough.|Shape thick rounds, cook on a hot griddle and split carefully while warm.|Fill with beans. Mix avocado, tomato, jalapeño and onion for the salsa and spoon over the gorditas.',
    {description:'Imported from the GORDITAS worksheet. Unweighed cilantro and lime from the workbook remain optional.'}),

  r('mung-bean-pancake','Mung bean pancakes with roasted vegetables','lunch,dinner',60,
    'mung-beans:75,jalapeno:6.25,ginger:5,rice-flour:5,oil:15,sweet-potato:225,cauliflower:112.5',
    'Rinse the mung beans and soak them with the rice flour and fenugreek for 6–8 hours. Drain.|Blend the soaked beans with ginger, chile and enough water to make a thick batter.|Cook pancakes in the measured oil until browned and cooked through on both sides.|Roast the sweet potato and cauliflower until tender. Serve beside the pancakes.',
    {description:'Imported from the MUNG BEANS worksheet. The workbook suggests cilantro chutney as an optional accompaniment.'}),

  r('vegetable-fajitas','Tempeh vegetable fajitas','lunch,dinner',75,
    'tempeh:85.125,corn-tortilla:85.5,oil:8.4375,rice:30,onion:93.75,mushroom:10.625,bell-pepper:65.625,adobo-peppers:6.25,lite-salt:1.125,tomato:56.25,jalapeno:6.25,avocado:65',
    'Heat the oven to 230°C / 450°F. Slice the peppers, onions and mushrooms.|Toss the vegetables with half the oil and the workbook spice mix. Roast for 30–45 minutes, turning once.|Cut the tempeh, toss with the remaining oil and spices, and roast for about 30 minutes.|Cook the tomato, jalapeño and adobo pepper until soft, then fold in the tempeh.|Cook the rice and serve with warm tortillas, roasted vegetables and avocado.',
    {description:'Imported from the FAJITAS worksheet. The spice mix includes cumin, oregano, pepper, paprika, garlic, onion and chile.'}),

  r('vegetable-couscous','Vegetable couscous with chickpeas','lunch,dinner',75,
    'chickpeas-dry:33.3333,oil:15,garlic:1.5,ginger:1.5,onion:91.6667,bell-pepper:33.3333,tomato-paste:14.1667,lite-salt:1,tomatoes-canned:8.3333,butternut-squash:83.3333,carrot:41.6667,acorn-squash:83.3333,mushroom:41.6667,raisins:10,bulgur:100',
    'Soak the chickpeas overnight, then drain.|Sauté the onion, pepper, garlic and ginger in the oil.|Add tomato paste, tomatoes, squash, carrot, mushrooms, chickpeas and the workbook seasonings. Cover with water and simmer until the beans and vegetables are tender.|Prepare the bulgur separately. Serve with the vegetable stew and raisins.',
    {mediterranean:true,description:'Imported from the COUSCOUS worksheet. Bulgur is used in place of couscous in the recorded quantities.'}),

  r('samosa-masoor-dal','Baked samosa with masoor dal','lunch,dinner',120,
    'flour:31.25,lite-salt:1.3,canola-oil:20.7143,water:213.125,potato:61.25,cumin:8.0357,ginger:4.3214,jalapeno:7.4107,peas:6.25,lentils:62.8571,tomato:62.8571,spinach:14.2857,cauliflower:85.7143,garlic:3.5714,paprika:0.4286',
    'Mix the flour and salt. Rub in the first portion of oil, then add water gradually to form a firm dough. Rest covered for 40 minutes.|Boil the potatoes until just tender. Warm the filling spices in oil, add ginger and chile, then mash in the potatoes and peas.|Divide and roll the dough. Fill, seal and bake on a lined tray at 220°C / 425°F for about 25 minutes.|For the dal, rinse the lentils. Simmer with tomato, chile and water until tender.|Cook garlic and cumin in oil, stir into the dal, then add spinach and cauliflower and cook until tender.',
    {description:'Combines the SAMOSA and MASOOR DAL worksheets, matching the workbook index entry.'}),

  r('beet-hummus','Beet hummus','snack,lunch',90,
    'chickpeas-dry:35.75,tahini:14.3,oil:4.5,vinegar:4.5,lemon:9,beets:30,garlic:1.5,lite-salt:0.3,cumin:0.15',
    'Soak the chickpeas overnight. Simmer with a little baking soda until very soft, then drain.|Wrap the beets and roast at 200°C / 400°F until completely tender.|Process tahini, oil, vinegar, lemon, garlic, salt and cumin until smooth.|Add the warm chickpeas and roasted beets and process until creamy.',
    {mediterranean:true,freezer:false,description:'Imported from the HUMMUS worksheet. The workbook pairs it with gazpacho or zucchini soup.'}),

  r('gazpacho','Gazpacho','lunch,dinner',20,
    'garlic:0.7778,vinegar:5,onion:8.8889,tomato:200,oil:12.2222,bell-pepper:11.1111,salt:0.6111,cucumber:20,bread:7.7778,water:111.1111',
    'Blend the tomatoes until smooth and transfer to a large container.|Blend the garlic, vinegar, onion, pepper, salt, cucumber and bread with part of the water.|Combine with the tomatoes. Stir in the oil and remaining water by hand.|Chill thoroughly before serving.',
    {mediterranean:true,prep:'fresh',freezer:false,description:'Imported from the GAZPACHOO worksheet. Campari tomatoes are preferred in the workbook.'}),

  r('zucchini-soup','Zucchini, carrot and potato soup','lunch,dinner',50,
    'zucchini:150,carrot:33.3333,potato:41.6667,onion:25,oil:5,salt:0.25,water:180',
    'Sauté the onion in the oil until soft.|Add the carrot and cook a little longer.|Add the zucchini and potato. Add enough water to cover about half the vegetables.|Simmer for 30–60 minutes until very tender, then blend smooth.',
    {mediterranean:true,description:'Imported from the CREMA CARBASSO worksheet. The workbook says soy milk and rice are not needed.'}),

  r('vegetable-pizza','Vegetable pizza','lunch,dinner',90,
    'flour:105,salt:2.31,bell-pepper:37.8333,marinated-artichokes:28,tomato:16.6667,mushroom:18.9167,soy-chorizo:18.9167,plant-cheese:75,basil:28,oil:5,tomatoes-canned:132.6667',
    'The night before, mix a poolish from part of the flour, equal water and a small amount of yeast. Leave covered at room temperature.|Add the remaining water, flour and salt. Knead, rest, divide and refrigerate the dough balls.|Simmer the canned tomatoes with seasoning until thick. Roast the vegetables separately.|Bring a dough ball to room temperature and stretch it. Add sauce, plant cheese, vegetables and soy chorizo.|Bake on a fully heated stone at the hottest safe oven setting until browned. Add basil after baking.',
    {mediterranean:true,description:'Imported from the PIZZA2 worksheet. Fermentation time is additional to the listed hands-on time.'}),

  r('vegan-carbonara','Vegan mushroom carbonara','lunch,dinner',120,
    'onion:62.5,oil:12.5,garlic:2.5,miso:5.3125,water:68.125,mushroom:10.625,carrot:28.125,lite-salt:0.375,pepper:0.0625,shallot:36.25,liquid-smoke:0.1563,nutritional-yeast:2.8125,zucchini:93.75,cashews:18.75,vinegar:1.5625,salt:0.375,pasta:120',
    'Soak the cashews overnight. Rinse, blend with water and salt, then ferment with sauerkraut brine in a clean covered container. Refrigerate when pleasantly tangy.|Thinly slice and fry the shallots until lightly golden. Drain and crisp them in a low oven.|Roast whole zucchini at 260°C / 500°F until fully tender.|Caramelize the onions, then add garlic. Simmer with miso, mushrooms and carrots until tender.|Blend the sauce with the zucchini, cashew cream, nutritional yeast and liquid smoke.|Boil the pasta. Toss with the hot sauce and a little pasta water, then top with crispy shallots.',
    {mediterranean:true,description:'Imported from the CARBONARA 3 worksheet. Cashew fermentation takes at least one additional day.'}),

  r('tabbouleh','Quinoa tabbouleh with chickpeas','lunch,dinner',30,
    'garlic:3,mint:10,parsley:25,lemon:25,oil:13.75,cucumber:125,raisins:12.5,salt:1.125,quinoa:125,chickpeas:100',
    'Cook the quinoa in water and cool completely.|Finely chop the mint, parsley, cucumber and garlic.|Whisk lemon juice, oil and salt.|Combine the quinoa, herbs, cucumber, chickpeas and raisins with the dressing. Chill before serving.',
    {mediterranean:true,prep:'fresh',freezer:false,description:'Imported from the TABBOULEH worksheet. The workbook leaves herb weights blank; modest bunch-based weights are recorded here.'}),

  r('vegetarian-ramen','Vegetarian miso ramen','lunch,dinner',90,
    'mushroom:1.25,kelp:1.875,water:180,oil:6.25,ginger:3.75,garlic:3.75,doubanjiang:6.875,miso:8.75,rice-wine:7.5,soy-sauce:9.6875,sesame-seeds:7.8125,bok-choy:28.375,soy-milk:240,tofu:93.75,corn:50,sweet-potato:115,ramen-noodles:100',
    'Steep the dried mushroom and kelp in water for up to 4 hours. Heat just to a boil, then remove from the heat.|Sauté ginger, garlic and the white parts of the green onions in oil. Stir in doubanjiang, miso, rice wine and soy sauce.|Toast and grind most of the sesame seeds. Add them and part of the dashi to the seasoning base.|Cube the tofu and soak it in the concentrated broth. Roast the bok choy and sweet potato at 230°C / 450°F.|Add the remaining dashi, soy milk, corn and bok choy without boiling the soy milk.|Boil the ramen separately and assemble each bowl with tofu, broth, noodles and roasted sweet potato.',
    {description:'Imported from the RAMEN 2 worksheet. The workbook calls for sesame oil; olive oil carries the recorded nutrition.'}),

  r('vegan-enchiladas','Layered vegan enchiladas','lunch,dinner',120,
    'black-beans-dry:28.125,water:116.875,tofu:56.25,lite-salt:0.4688,nutritional-yeast:9.375,cashews:18.75,oil:5,onion:21.25,garlic:7.5,bell-pepper:12.5,jalapeno:2.8125,lime:15.625,spinach:12.5,avocado:25,tomatoes-canned:39.8438,corn-tortilla:85.5',
    'Simmer the black beans with onion, garlic, chile and cumin until tender and thick.|Blend or crumble the tofu with cashews, nutritional yeast and seasoning. Fold in the spinach.|Cook the peppers and jalapeño in oil. Stir in lime and part of the tomato sauce.|Layer tofu filling, tortillas, sauce and black beans in a baking dish.|Bake until bubbling and the center reaches 74°C / 165°F. Serve with avocado.',
    {description:'Imported from the ENCHILADAS 3 worksheet. The workbook calls the layered version “enchilasagna.”'}),

  r('vegetable-paella','Vegetable paella','lunch,dinner',120,
    'oil:19.375,garlic:1.875,green-beans:62.5,bell-pepper:75,artichoke:50,mushroom:14,asparagus:15.625,peas:25,tomatoes-canned:100,lite-salt:3,lima-beans-dry:28.375,water:375,rice:100,paprika:1',
    'Make a vegetable broth and keep it hot.|Simmer the lima beans until nearly tender.|Fry the artichokes in part of the oil and set aside. Fry the green beans, peppers, asparagus and mushrooms, adding garlic last.|Add tomatoes, paprika, salt and saffron. Cook briefly, then add hot broth, artichokes and lima beans.|Bring to a boil, add rice evenly and cook without stirring until the rice is tender and the liquid is absorbed.',
    {mediterranean:true,description:'Imported from the PAELLA worksheet. The workbook stresses using fresh artichokes for flavor.'}),

  r('falafel','Baked falafel plate','lunch,dinner',60,
    'chickpeas-dry:52,onion:22.5,garlic:3,oil:6.3,cumin:0.2143,paprika:0.2143,pepper:0.0714,salt:0.8,parsley:23,cilantro:23,cucumber:60,rice:80',
    'Soak the chickpeas with a little baking soda for at least 6 hours, then drain very well.|Process the onion, garlic, herbs and seasonings. Add the chickpeas and pulse to a coarse mixture.|Shape into balls or patties and arrange on lined trays.|Bake at 260°C / 500°F, turning after about 17 minutes, until deeply browned and cooked through.|Serve with cucumber and cooked rice.',
    {mediterranean:true,description:'Imported from the FALAFEL worksheet. The workbook commonly pairs it with baba ganoush.'}),

  r('baba-ganoush','Baba ganoush','snack,lunch',90,
    'eggplant:225,garlic:1.5,tahini:13,lemon:7.5,oil:4.5,cumin:0.125,liquid-smoke:0.0667,salt:0.4,paprika:0.0625',
    'Roast whole eggplants at 230°C / 450°F until collapsed and completely tender, about 60–90 minutes.|Scoop out the flesh and drain excess liquid.|Mix tahini, lemon juice, oil, garlic, cumin, liquid smoke, salt and paprika.|Mash in the eggplant until creamy but not completely smooth. Chill before serving.',
    {mediterranean:true,freezer:false,description:'Imported from the BABA GANOUSH worksheet.'}),

  r('japanese-curry','Tempeh Japanese curry with rice','lunch,dinner',75,
    'canola-oil:15.625,tempeh:70.9375,ginger:3.125,garlic:4.375,onion:168.75,curry-powder:5.3125,miso:1.5625,tomato-paste:2.5,soy-sauce:6.5625,cocoa-powder:0.0625,water:118.75,lite-salt:1.5,cauliflower:78.125,carrot:43.75,rice:100',
    'Brown the tempeh in part of the oil and set aside.|Finely chop the ginger and garlic. Cook in the remaining oil, then add the onion and caramelize until sweet and soft.|Stir in curry powder, miso, tomato paste, soy sauce, cocoa and water. Blend the sauce if desired.|Bring to a simmer. Add carrots first, then cauliflower, and cook until tender.|Return the tempeh to the curry. Cook the rice separately and divide into portions.',
    {description:'Imported from the JAP CURRY3 worksheet.'}),

  r('spinach-pesto','Spinach and walnut pesto','snack,lunch',20,
    'spinach:17.1429,basil:6.4286,oil:18.5714,walnuts:8.5714',
    'Toast the walnuts at 75°C / 170°F for about 10 minutes and cool.|Blend the spinach, basil and walnuts.|Stream in the olive oil and blend to the desired texture.|Refrigerate promptly and use as a spread or pasta sauce.',
    {mediterranean:true,freezer:true,description:'Imported from the SPINACH PESTO worksheet. The recorded portion is pesto only; pasta is not included.'}),

  r('vegan-bolognese','Vegan bolognese pasta','lunch,dinner',150,
    'tomatoes-canned:340.2857,oil:22.8571,onion:142.8571,garlic:1.4286,sun-dried-tomatoes:12.8571,vital-wheat-gluten:42.8571,walnuts:12.8571,white-beans:14.2857,pasta:120',
    'Add the tomatoes, oil and halved onions to a medium pot. Cover and simmer gently.|After the onions soften, add garlic and sun-dried tomatoes. Simmer uncovered until deeply flavored, about 2 hours.|Combine the vital wheat gluten, walnuts and beans into small plant-based crumbles. Cook them through separately.|Boil the pasta. Toss with the tomato sauce and crumbles.',
    {mediterranean:true,description:'Imported from the PASTA BOLO worksheet. The workbook suggests sautéed peppers and zucchini as optional sides.'}),
];
