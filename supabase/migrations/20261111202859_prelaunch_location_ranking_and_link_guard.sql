-- Keep ranking rules consistent for existing builds and the release candidate.
create or replace view public.restaurant_rankings with (security_invoker=true) as
with activity as (
  select r.restaurant_id,
    count(*) as rating_count_from_ratings,
    count(distinct r.user_id) as unique_rater_count,
    min(r.created_at) as first_rating_at,
    max(r.created_at) as last_rating_at,
    count(*) filter(where r.created_at>=now()-interval '7 days') as ratings_7d,
    count(distinct r.user_id) filter(where r.created_at>=now()-interval '7 days') as unique_raters_7d,
    count(*) filter(where r.created_at>=now()-interval '30 days') as ratings_30d,
    count(distinct r.user_id) filter(where r.created_at>=now()-interval '30 days') as unique_raters_30d,
    avg(r.overall_score) filter(where r.created_at>=now()-interval '30 days') as avg_score_30d
  from public.ratings r group by r.restaurant_id
)
select rs.*,
  coalesce(a.unique_rater_count,0::bigint) as unique_rater_count,
  a.first_rating_at,a.last_rating_at,
  coalesce(a.ratings_7d,0::bigint) as ratings_7d,
  coalesce(a.unique_raters_7d,0::bigint) as unique_raters_7d,
  coalesce(a.ratings_30d,0::bigint) as ratings_30d,
  coalesce(a.unique_raters_30d,0::bigint) as unique_raters_30d,
  a.avg_score_30d,
  (coalesce(rs.rating_count,0)>=10 and coalesce(a.unique_rater_count,0::bigint)>=5) as ranking_eligible_v2,
  (coalesce(rs.tablescore,0)>=8 and coalesce(a.avg_score_30d,0)>=8
    and coalesce(a.ratings_30d,0::bigint)>=2
    and coalesce(a.unique_raters_30d,0::bigint)>=2
    and coalesce(a.unique_raters_7d,0::bigint)>=2) as hot_eligible,
  (coalesce(a.ratings_7d,0::bigint)::numeric*4.0
    +coalesce(a.unique_raters_7d,0::bigint)::numeric*6.0
    +coalesce(a.ratings_30d,0::bigint)::numeric*1.5
    +coalesce(a.unique_raters_30d,0::bigint)::numeric*2.0
    +greatest(coalesce(a.avg_score_30d,0::numeric)-7.0,0::numeric)*2.0) as hot_score
from public.restaurant_stats rs left join activity a on a.restaurant_id=rs.id;

-- Ordinary diners keep using create_google_restaurant. Relinking legacy ratings
-- is an owner-only operation; do not broadly grant the original privileged RPC.
create or replace function public.link_restaurant_google_place_admin(
  p_restaurant_id uuid,p_google_place_id text,
  p_address text default null,p_formatted_address text default null,
  p_city text default null,p_state_region text default null,p_postal_code text default null,
  p_latitude double precision default null,p_longitude double precision default null,
  p_google_primary_type text default null,p_google_primary_type_name text default null,
  p_google_maps_url text default null
) returns table(id uuid,name text)
language plpgsql security definer set search_path='' as $function$
begin
  -- Same established owner and active-session check as account-mark moderation.
  if auth.uid() is distinct from '493a7069-d9df-4e16-906d-ef3279a6bfee'::uuid then
    raise exception 'Only the TableRec owner can relink restaurants' using errcode='42501';
  end if;
  if not exists(select 1 from auth.sessions s where s.user_id=auth.uid()
    and s.id::text=auth.jwt()->>'session_id' and (s.not_after is null or s.not_after>now())) then
    raise exception 'Sign in again before linking a restaurant' using errcode='42501';
  end if;
  if p_latitude is not null and (p_latitude<'-90'::double precision or p_latitude>90 or p_latitude='NaN'::double precision) then
    raise exception 'Invalid latitude';
  end if;
  if p_longitude is not null and (p_longitude<'-180'::double precision or p_longitude>180 or p_longitude='NaN'::double precision) then
    raise exception 'Invalid longitude';
  end if;
  return query select * from public.link_restaurant_google_place(
    p_restaurant_id,trim(p_google_place_id),p_address,p_formatted_address,p_city,p_state_region,
    p_postal_code,p_latitude,p_longitude,p_google_primary_type,p_google_primary_type_name,p_google_maps_url);
end $function$;
revoke all on function public.link_restaurant_google_place_admin(uuid,text,text,text,text,text,text,double precision,double precision,text,text,text) from public,anon;
grant execute on function public.link_restaurant_google_place_admin(uuid,text,text,text,text,text,text,double precision,double precision,text,text,text) to authenticated;
