-- Additive matcher: preserve v2 for installed testers. Include useful near matches with at most three missing ingredients.
create or replace function public.match_pro_pantry_recipes_v3(
 p_pantry text[],p_require_all boolean default false,p_assume_staples boolean default false,
 p_category text default null,p_limit integer default 20,p_collection text default 'everyday'
) returns jsonb language plpgsql set search_path='' as $$
declare pantry text[]; available text[]; result jsonb;
begin
 if not coalesce(public.has_tablerec_pro(),false) then raise exception 'Pro required' using errcode='42501';end if;
 if p_collection is null or p_collection not in ('everyday','all') then raise exception 'Invalid recipe collection';end if;
 if p_pantry is null or cardinality(p_pantry)<1 or cardinality(p_pantry)>40 or p_limit is null or p_limit<1 or p_limit>30 or length(coalesce(p_category,''))>100
 or exists(select 1 from unnest(p_pantry) p where p is null or length(trim(p))<2 or length(p)>60 or trim(p) !~ '[A-Za-z]') then raise exception 'Enter 1 to 40 ingredients, each 2 to 60 characters';end if;
 select array_agg(distinct public.pro_ingredient_normalize(p)) into pantry from unnest(p_pantry) p;
 available:=pantry||case when p_assume_staples then array['water','salt','black pepper'] else '{}'::text[] end;
 with raw_lines as materialized (
  select r.id,r.record,i.line,i.ord,public.pro_ingredient_normalize(i.line) as normalized
  from public.pro_recipes r cross join lateral jsonb_array_elements_text(r.record->'ingredients') with ordinality i(line,ord)
  where (p_category is null or r.category=p_category) and (p_collection='all' or public.pro_recipe_is_everyday(r.name))
 ), ingredient_lines as materialized (
  select r.id,r.record,r.line,r.ord,
   r.line ~* '\moptional\M' as optional,
   public.pro_ingredient_line_matches(r.normalized,available) as matched,
   array(select p from unnest(pantry) p where public.pro_ingredient_name_matches(r.normalized,p)) as provided
  from raw_lines r
 ), scored as (
  select id,record,count(*) filter(where not optional)::int as total,
   count(*) filter(where matched and not optional)::int as matched,
   coalesce(jsonb_agg(line order by ord) filter(where matched and not optional),'[]'::jsonb) as have,
   coalesce(jsonb_agg(line order by ord) filter(where not matched and not optional),'[]'::jsonb) as missing,
   coalesce(jsonb_agg(line order by ord) filter(where optional),'[]'::jsonb) as optional
  from ingredient_lines group by id,record
 ), used_items as (
  select i.id,array_agg(distinct p) as used from ingredient_lines i cross join lateral unnest(i.provided) p where i.matched group by i.id
 ), ranked as (
  select s.*,u.used from scored s join used_items u using(id) where total>0 and matched>0 and (2*matched>=total or (total-matched<=3 and exists(select 1 from unnest(u.used) p where p not in ('water','salt','black pepper','sugar','oil'))))
 ), candidates as (
  select *,round(100.0*matched/total)::int as percent,
   case when record->>'name' ~* '(taco|pizza|burger|meatloaf|pot roast|fried chicken|roast chicken|spaghetti|macaroni.*cheese|lasagna|chili|fajita|enchilada|quesadilla|grilled cheese|sandwich|chicken noodle|pot pie|pancake|waffle|french toast|biscuit|salmon|steak|carbonara|stir.fry|fried rice|pulled pork|stroganoff|chicken parmesan|chicken alfredo|baked potato|chicken tender|scrambled egg|omelet|mashed potato|crepe|crêpe)' then 1 else 0 end as familiar
   from ranked where cardinality(used)>0 and (not coalesce(p_require_all,false) or cardinality(used)=cardinality(pantry))
 ), limited as (
  select * from candidates order by 1.0*matched/total desc,familiar desc,cardinality(used) desc,total-matched,record->>'name',id limit p_limit
 ) select jsonb_build_object('collection',p_collection,'count',(select count(*) from candidates),'pantry',to_jsonb(pantry),'assumed_staples',case when p_assume_staples then jsonb_build_array('water','salt','black pepper') else '[]'::jsonb end,
 'matches',coalesce((select jsonb_agg(jsonb_build_object('recipe',record,'matched_count',matched,'required_count',total,'percent',percent,'match_tier',case when matched=total then 'ready' when 2*matched>=total then 'close' else 'shopping' end,'have',have,'missing',missing,'optional',optional,'used',used,'unused',array(select p from unnest(pantry) p where not(p=any(used)))) order by 1.0*matched/total desc,familiar desc,cardinality(used) desc,total-matched,record->>'name',id) from limited),'[]'::jsonb)) into result;
 if p_collection='everyday' and (result->>'count')::int=0 then
  result:=public.match_pro_pantry_recipes_v3(p_pantry,p_require_all,p_assume_staples,p_category,p_limit,'all')||jsonb_build_object('collection_fallback',true);
 end if;
 return result;
end;$$;
revoke all on function public.match_pro_pantry_recipes_v3(text[],boolean,boolean,text,integer,text) from public,anon;
grant execute on function public.match_pro_pantry_recipes_v3(text[],boolean,boolean,text,integer,text) to authenticated;
