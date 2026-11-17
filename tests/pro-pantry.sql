-- Read-only assertions. Execute within a transaction; no account or recipe changes.
begin;
do $$begin
 assert public.pro_ingredient_normalize('Eggs, onions, potatoes')='egg onion potato';
 assert not public.pro_ingredient_name_matches('eggplant','egg');
 assert not public.pro_ingredient_name_matches('egg noodles','egg');
 assert not public.pro_ingredient_name_matches('chicken stock','chicken');
 assert not public.pro_ingredient_name_matches('cream of chicken soup','chicken');
 assert not public.pro_ingredient_name_matches('barbecue chicken rub','chicken');
 assert not public.pro_ingredient_name_matches('rice flour','rice');
 assert not public.pro_ingredient_name_matches('coconut milk','milk');
 assert not public.pro_ingredient_name_matches('peanut butter','butter');
 assert not public.pro_ingredient_line_matches('salt and black pepper',array['salt']);
 assert public.pro_ingredient_line_matches('salt and black pepper',array['salt','black pepper']);
 assert public.pro_ingredient_line_matches('butter or margarine',array['butter']);
 assert not has_function_privilege('anon','public.match_pro_pantry_recipes(text[],boolean,boolean,text,integer)','execute');
 assert has_function_privilege('authenticated','public.match_pro_pantry_recipes(text[],boolean,boolean,text,integer)','execute');
end;$$;
set local role authenticated;
select set_config('request.jwt.claims','{}',true);
select set_config('request.jwt.claim.sub','',true);
do $$begin
 begin perform public.match_pro_pantry_recipes(array['chicken']);raise exception 'Missing Pro check';exception when insufficient_privilege then null;end;
end;$$;
rollback;
