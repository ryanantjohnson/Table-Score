-- Record submission time on the server. A client cannot manufacture distinct
-- visit days by backdating a new rating or moving an existing rating's timestamp.
create or replace function private.tr_rating_recorded_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  if TG_OP='INSERT' then new.created_at:=now();
  else new.created_at:=old.created_at;
  end if;
  return new;
end;
$$;
revoke all on function private.tr_rating_recorded_at() from public,anon,authenticated;
drop trigger if exists tr_rating_recorded_at on public.ratings;
create trigger tr_rating_recorded_at before insert or update of created_at on public.ratings
for each row execute function private.tr_rating_recorded_at();

-- PENDING release dependency. Do not run until the consolidated update is ready.
-- Legacy chefs_table identity grants do not qualify.
-- SECURITY DEFINER is required to count an owner's private contributions.
-- Return only marks/counts to permitted viewers, never rating rows/coordinates.
create or replace function public.get_account_contributor_status(p_user_ids uuid[])
returns table(user_id uuid, qualifying_ratings bigint, distinct_restaurants bigint, earned boolean, marks text[])
language sql stable security definer set search_path = '' as $$
 with targets as (
   select distinct p.id from public.profiles p
   where p.id = any((coalesce(p_user_ids,array[]::uuid[]))[1:100])
     and private.tr_user_available(p.id)
     and (p.id=auth.uid() or private.tr_can_read_content(p.id))
 ), visits as (
   -- Canonical Google place collapses duplicate restaurant records. One rating
   -- per place per Central calendar day; launch geography is Central Texas.
   select distinct r.user_id, rst.google_place_id as place,
     (r.created_at at time zone 'America/Chicago')::date as visit_day
   from public.ratings r join targets t on t.id=r.user_id
   join public.restaurants rst on rst.id=r.restaurant_id
   where r.verified_visit is true and nullif(trim(rst.google_place_id),'') is not null
     and r.created_at <= now()
     and r.visit_latitude between -90 and 90 and r.visit_longitude between -180 and 180
     and not (r.visit_latitude=0 and r.visit_longitude=0)
     and private.tr_content_visible('rating',r.id)
 ), totals as (
   select t.id, count(v.place) as ratings, count(distinct v.place) as places
   from targets t left join visits v on v.user_id=t.id group by t.id
 )
 select x.id,x.ratings,x.places,(x.ratings>=250 and x.places>=50),
   array(select am.mark_type from public.account_marks am
     where am.user_id=x.id and am.is_active and (
       am.mark_type='first_round' or
       (am.mark_type='og' and am.user_id='493a7069-d9df-4e16-906d-ef3279a6bfee'::uuid)
     ) order by am.mark_type)
 from totals x;
$$;
revoke all on function public.get_account_contributor_status(uuid[]) from public;
grant execute on function public.get_account_contributor_status(uuid[]) to anon, authenticated;
