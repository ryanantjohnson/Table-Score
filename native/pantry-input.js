/* Local ingredient-name parsing. No AI calls or ingredient text sent to another service. */
(function(root){
'use strict';
const normalize=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,'').replace(/[-–]/g,' ').replace(/\s+/g,' ').trim();
// Recognize longest phrases first. Unrecognized phrases stay intact for the user to edit;
// splitting every space would turn "cream of mushroom soup" into invented pantry items.
const names=`pasta|milk|cheese|marinara|beef|chicken|garlic|flour|sugar|water|salt|pepper|butter|rice|eggs|egg|bread|oil|onion|onions|tomato|tomatoes|potato|potatoes|carrot|carrots|broccoli|spinach|lettuce|cabbage|celery|corn|peas|beans|mushroom|mushrooms|zucchini|cucumber|avocado|lemon|lime|orange|apple|banana|strawberries|blueberries|raspberries|grapes|peach|pear|pineapple|mango|cherries|cherry|tofu|lentils|chickpeas|quinoa|oats|oatmeal|yogurt|cream|bacon|ham|sausage|turkey|pork|salmon|tuna|shrimp|cod|tilapia|steak|chocolate|cocoa|honey|syrup|vinegar|ketchup|mustard|mayonnaise|mayo|salsa|pesto|cinnamon|paprika|cumin|oregano|basil|parsley|cilantro|rosemary|thyme|dill|ginger|nutmeg|cayenne|sesame|peanuts|almonds|walnuts|pecans|cashews|raisins|dates|coconut|tortillas|tortilla|noodles|spaghetti|macaroni|penne|fettuccine|lasagna|rigatoni|cheddar|mozzarella|parmesan|feta|ricotta|provolone|breadcrumbs|cornmeal|cornstarch|yeast|biscuits|crackers|jalapeno|jalapenos|asparagus|squash|pumpkin|sweetcorn|beets|turnips|radish|rhubarb|eggplant|grits|couscous|bulgur|barley|farro|polenta|chorizo|tempeh|edamame|tahini|olives|capers|pickles|relish|shortening|ghee|lard|molasses|vanilla|coffee|tea|beer|wine|bouillon|stock|broth|ground beef|ground chicken|ground turkey|ground pork|chicken breast|chicken breasts|chicken thigh|chicken thighs|chicken stock|chicken broth|beef stock|beef broth|vegetable stock|vegetable broth|chicken noodle soup|cream of mushroom soup|cream of chicken soup|cream of celery soup|tomato soup|tomato paste|tomato sauce|pasta sauce|marinara sauce|spaghetti sauce|crushed tomatoes|diced tomatoes|canned tomatoes|sun dried tomatoes|sweet potato|sweet potatoes|green beans|black beans|kidney beans|pinto beans|white beans|refried beans|navy beans|garbanzo beans|black eyed peas|split peas|white rice|brown rice|wild rice|jasmine rice|basmati rice|sushi rice|olive oil|vegetable oil|canola oil|coconut oil|peanut oil|sesame oil|sunflower oil|avocado oil|extra virgin olive oil|peanut butter|almond butter|cream cheese|sour cream|heavy cream|whipping cream|double cream|half and half|whole milk|skim milk|oat milk|almond milk|soy milk|coconut milk|condensed milk|evaporated milk|greek yogurt|plain yogurt|american cheese|swiss cheese|blue cheese|goat cheese|pepper jack|monterey jack|cheddar cheese|mozzarella cheese|parmesan cheese|cottage cheese|baking powder|baking soda|all purpose flour|self rising flour|bread flour|whole wheat flour|rice flour|almond flour|coconut flour|brown sugar|white sugar|powdered sugar|granulated sugar|icing sugar|maple syrup|corn syrup|vanilla extract|almond extract|cocoa powder|chocolate chips|baking chocolate|dark chocolate|milk chocolate|white chocolate|soy sauce|hot sauce|barbecue sauce|bbq sauce|worcestershire sauce|fish sauce|oyster sauce|hoisin sauce|teriyaki sauce|rice vinegar|apple cider vinegar|balsamic vinegar|white vinegar|red wine vinegar|black pepper|white pepper|red pepper|green pepper|yellow pepper|bell pepper|bell peppers|red bell pepper|green bell pepper|yellow bell pepper|red pepper flakes|chili flakes|chili powder|garlic powder|onion powder|curry powder|italian seasoning|taco seasoning|ground cinnamon|ground cumin|fresh basil|fresh parsley|fresh cilantro|bay leaf|bay leaves|green onion|green onions|spring onion|spring onions|red onion|yellow onion|white onion|scallion|scallions|romaine lettuce|iceberg lettuce|brussels sprouts|butternut squash|acorn squash|spaghetti squash|yellow squash|sweet corn|corn tortillas|flour tortillas|whole wheat bread|white bread|sourdough bread|bread crumbs|panko breadcrumbs|rolled oats|steel cut oats|pork chops|pork loin|pork shoulder|beef chuck|beef mince|chicken mince|turkey mince|italian sausage|smoked sausage|breakfast sausage|hot dogs|salmon fillet|tuna steak|canned tuna|canned salmon|egg whites|egg yolks|lemon juice|lime juice|orange juice|lemon zest|lime zest|potato starch|tomato puree|coconut cream|nutritional yeast|mac and cheese`;
const phrases=new Set(names.split('|').map(normalize));
const maxWords=Math.max(...[...phrases].map(s=>s.split(' ').length));
function parse(text){
 const input=String(text||'').replace(/^\s*(?:i have|we have|ive got|i've got|we've got)\s*:?\s*/i,'');
 const ingredients=[],unknown=[];const delimited=/[,;\n\r]/.test(input);
 const add=(s,known)=>{s=normalize(s);if(!s)return;if(!ingredients.includes(s))ingredients.push(s);if(!known&&!unknown.includes(s))unknown.push(s);};
 for(const group of input.split(/[,;\n\r]+/)){
  const before=ingredients.length,unknownBefore=unknown.length;
  const tokens=normalize(group.replace(/^\s*[-•]\s*/,'')).split(' ').filter(Boolean);
  let pending=[];
  const flush=()=>{if(pending.length)add(pending.join(' '),false);pending=[];};
  for(let i=0;i<tokens.length;){
   if(tokens[i]==='and'||tokens[i]==='&'){flush();i++;continue;}
   let match='';let length=0;
   for(let n=Math.min(maxWords,tokens.length-i);n>0;n--){const s=tokens.slice(i,i+n).join(' ');if(phrases.has(s)){match=s;length=n;break;}}
   if(match){flush();add(match,true);i+=length;}else{pending.push(tokens[i++]);}
  }
  flush();
  if(delimited&&unknown.length>unknownBefore&&!/\s(?:and|&)\s/i.test(group)){ingredients.splice(before);unknown.splice(unknownBefore);add(group.replace(/^\s*[-•]\s*/,''),false);}
 }
 return {ingredients,unknown};
}
const api=Object.freeze({parse});root.TableRecPantryInput=api;
if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
