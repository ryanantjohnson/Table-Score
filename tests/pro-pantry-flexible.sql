-- Read-only assertions against the deployed published recipe catalog.
begin;
do $$begin
 assert not has_function_privilege('anon','public.match_pro_pantry_recipes_v3(text[],boolean,boolean,text,integer,text)','execute');
 assert has_function_privilege('authenticated','public.match_pro_pantry_recipes_v3(text[],boolean,boolean,text,integer,text)','execute');
 assert not (select prosecdef from pg_proc where oid='public.match_pro_pantry_recipes_v3(text[],boolean,boolean,text,integer,text)'::regprocedure);
end;$$;
select set_config('request.jwt.claim.sub',coalesce((select user_id::text from public.pro_access_grants where expires_at>now() order by expires_at desc limit 1),(select user_id::text from public.account_marks where mark_type='first_round' and is_active limit 1)),true);
set local role authenticated;
do $$declare result jsonb; m jsonb; fallback_count int:=0; previous numeric:=2; ratio numeric;
begin
 assert public.has_tablerec_pro();
 result:=public.match_pro_pantry_recipes_v3(array['chicken','peanut butter','cinnamon'],false,false,null,20,'everyday');
 assert jsonb_array_length(result->'matches')>0,'Mixed pantry must offer useful ingredient subsets';
 for m in select value from jsonb_array_elements(result->'matches') loop
  ratio:=(m->>'matched_count')::numeric/(m->>'required_count')::numeric;
  assert ratio<=previous;previous:=ratio;
  assert (m->>'matched_count')::int>0;
  assert jsonb_array_length(m->'missing')=(m->>'required_count')::int-(m->>'matched_count')::int;
  if ratio<0.5 then fallback_count:=fallback_count+1;assert jsonb_array_length(m->'missing')<=3;assert m->>'match_tier'='shopping';end if;
  assert length(m->'recipe'->>'source_url')>0;
  assert jsonb_array_length(m->'recipe'->'steps')>0;
 end loop;
 assert fallback_count>0,'Below-half pantry options must not be discarded';
 result:=public.match_pro_pantry_recipes_v3(array['chicken','peanut butter','regression ingredient xyz'],true,false,null,20,'everyday');
 assert jsonb_array_length(result->'matches')=0,'Use every ingredient must remain strict, including collection fallback';
 result:=public.match_pro_pantry_recipes_v3(array['chickpeas'],false,false,null,20,'everyday');
 assert (result->>'collection_fallback')::boolean and result->>'collection'='all';
 assert jsonb_array_length(result->'matches')>0,'All Recipes fallback must find published chickpea options';
 begin perform public.match_pro_pantry_recipes_v3(array['chicken'],false,false,null,20,'invalid');raise exception 'Invalid collection accepted';exception when raise_exception then assert sqlerrm='Invalid recipe collection';end;
end;$$;
select set_config('request.jwt.claim.sub','',true);
do $$begin begin perform public.match_pro_pantry_recipes_v3(array['rice']);raise exception 'Missing Pro guard';exception when insufficient_privilege then null;end;end;$$;
rollback;
