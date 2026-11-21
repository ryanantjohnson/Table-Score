-- Read-only integration assertions for the deployed collection matcher.
begin;
do $$begin
 assert public.pro_recipe_is_everyday('Chicken casserole');
 assert public.pro_recipe_is_everyday('Basic scrambled eggs');
 assert not public.pro_recipe_is_everyday('Chapati Za Maji (Tanzanian Pancakes)');
 assert not public.pro_recipe_is_everyday('Jahnun (Yemenite Layered Pastry)');
 assert not has_function_privilege('anon','public.match_pro_pantry_recipes_v2(text[],boolean,boolean,text,integer,text)','execute');
 assert has_function_privilege('authenticated','public.match_pro_pantry_recipes_v2(text[],boolean,boolean,text,integer,text)','execute');
end;$$;
select set_config('request.jwt.claim.sub',coalesce((select user_id::text from public.pro_access_grants where expires_at>now() order by expires_at desc limit 1),(select user_id::text from public.account_marks where mark_type='first_round' and is_active limit 1)),true);
set local role authenticated;
do $$declare result jsonb; m jsonb; coverage numeric; previous numeric:=2;
begin
 assert public.has_tablerec_pro(),'Needs an existing Pro test account';
 result:=public.match_pro_pantry_recipes_v2(array['bread','butter','milk','egg','salt','flour','sugar','water','black pepper','chicken','rice','cheddar','garlic','oil','onion'],false,false,null,20,'everyday');
 assert result->>'collection'='everyday';assert jsonb_array_length(result->'matches')>0;
 for m in select value from jsonb_array_elements(result->'matches') loop
  assert public.pro_recipe_is_everyday(m->'recipe'->>'name');
  coverage:=(m->>'matched_count')::numeric/(m->>'required_count')::numeric;
  assert coverage>=0.5;assert coverage<=previous;previous:=coverage;
  assert jsonb_array_length(m->'missing')=(m->>'required_count')::int-(m->>'matched_count')::int;
  assert length(m->'recipe'->>'source_url')>0;assert jsonb_array_length(m->'recipe'->'steps')>0;
 end loop;
 begin perform public.match_pro_pantry_recipes_v2(array['rice'],false,false,null,20,'invalid');raise exception 'Invalid collection accepted';exception when raise_exception then assert sqlerrm='Invalid recipe collection';end;
end;$$;
select set_config('request.jwt.claim.sub','',true);
do $$begin begin perform public.match_pro_pantry_recipes_v2(array['rice']);raise exception 'Missing Pro guard';exception when insufficient_privilege then null;end;end;$$;
rollback;
