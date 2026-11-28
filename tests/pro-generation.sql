-- Private generation ledger assertions; all test writes roll back.
begin;
do $$begin
 assert not has_table_privilege('authenticated','private.pro_recipe_generation_jobs','select');
 assert not has_table_privilege('anon','private.pro_recipe_generation_jobs','select');
 assert not has_function_privilege('authenticated','public.claim_pro_recipe_generation(uuid,uuid,text,integer,integer)','execute');
 assert not has_function_privilege('anon','public.claim_pro_recipe_generation(uuid,uuid,text,integer,integer)','execute');
 assert not has_function_privilege('authenticated','public.finish_pro_recipe_generation(uuid,uuid,jsonb,boolean)','execute');
end;$$;
set local role service_role;
do $$declare req uuid:=gen_random_uuid(); actor uuid:='493a7069-d9df-4e16-906d-ef3279a6bfee'; result jsonb;
begin
 result:=public.claim_pro_recipe_generation(req,actor,repeat('a',64),20,1000);assert result->>'status'='claimed';
 result:=public.claim_pro_recipe_generation(req,actor,repeat('a',64),20,1000);assert result->>'status'='pending';
 result:=public.claim_pro_recipe_generation(req,actor,repeat('b',64),20,1000);assert result->>'status'='mismatch';
 result:=public.claim_pro_recipe_generation(gen_random_uuid(),actor,repeat('a',64),20,1);assert result->>'status'='limited';
 assert public.finish_pro_recipe_generation(req,actor,'{"recipes":[],"message":"test"}'::jsonb,true);
 assert not public.finish_pro_recipe_generation(req,actor,null,false);
 result:=public.claim_pro_recipe_generation(req,actor,repeat('a',64),20,1000);assert result->>'status'='ready';assert result->'response'->>'message'='test';
end;$$;
rollback;
