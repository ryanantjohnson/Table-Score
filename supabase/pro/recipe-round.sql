-- Additive endpoint for the improved Pro wheel. Existing clients are unchanged.
create or replace function public.spin_pro_recipe_round(
 p_collection text default 'everyday',p_category text default null,
 p_query text default '',p_exclude text[] default '{}'
) returns jsonb language plpgsql set search_path='' as $$
declare result jsonb;
begin
 if not coalesce(public.has_tablerec_pro(),false) then raise exception 'Pro required' using errcode='42501';end if;
 if p_collection not in ('everyday','all') or p_collection is null or length(coalesce(p_query,''))>100 or cardinality(p_exclude)>100 then raise exception 'Invalid filter';end if;
 with eligible as materialized (
  select r.id,r.record from public.pro_recipes r
  where (p_category is null or r.category=p_category)
  and (coalesce(p_query,'')='' or r.name ilike '%'||p_query||'%' or (r.record->'ingredients')::text ilike '%'||p_query||'%')
  and not(r.id=any(coalesce(p_exclude,'{}')))
  and (p_collection='all' or (
   r.name ~* '(taco|pizza|burger|meatloaf|pot roast|fried chicken|roast chicken|spaghetti|macaroni.*cheese|lasagna|chili|fajita|enchilada|quesadilla|grilled cheese|sandwich|chicken noodle|pot pie|pancake|waffle|french toast|biscuit|salmon|steak|carbonara|stir.fry|fried rice|pulled pork|stroganoff|chicken parmesan|chicken alfredo|baked potato|chicken tender)'
   and r.category not in ('Sauce','Spice Mix','Cookie','Cake','Beverage')
  ))
 ), options as (select record from eligible order by random() limit 12)
 select jsonb_build_object('candidates',coalesce(jsonb_agg(record),'[]'::jsonb),'count',(select count(*) from eligible)) into result from options;
 return result;
end;$$;
revoke all on function public.spin_pro_recipe_round(text,text,text,text[]) from public,anon;
grant execute on function public.spin_pro_recipe_round(text,text,text,text[]) to authenticated;
