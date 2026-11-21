-- Prioritize the founder in public people suggestions; retain all eligibility exclusions.
CREATE OR REPLACE FUNCTION public.get_people_suggestions(p_limit integer DEFAULT 8)
 RETURNS TABLE(id uuid, display_name text, username text, home_city text, avatar_url text, mutual_count bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with
  me as (
    select auth.uid() as uid
  ),
  my_following as (
    select f.following_id as user_id
    from public.follows f, me
    where f.follower_id=me.uid
      and f.status='accepted'
  ),
  my_followers as (
    select f.follower_id as user_id
    from public.follows f, me
    where f.following_id=me.uid
      and f.status='accepted'
  ),
  excluded as (
    select auth.uid() as user_id
    union
    select f.following_id
    from public.follows f
    where f.follower_id=auth.uid()
  ),
  candidate_mutuals as (
    -- People I follow who also follow the candidate.
    select f.following_id as candidate_id, mf.user_id as mutual_id
    from my_following mf
    join public.follows f
      on f.follower_id=mf.user_id
     and f.status='accepted'

    union

    -- Candidate and I both follow the same person.
    select f.follower_id as candidate_id, mf.user_id as mutual_id
    from my_following mf
    join public.follows f
      on f.following_id=mf.user_id
     and f.status='accepted'

    union

    -- One of my followers also follows the candidate.
    select f.following_id as candidate_id, mfr.user_id as mutual_id
    from my_followers mfr
    join public.follows f
      on f.follower_id=mfr.user_id
     and f.status='accepted'
  ),
  scored as (
    select cm.candidate_id, count(distinct cm.mutual_id)::bigint as mutual_count
    from candidate_mutuals cm
    where cm.candidate_id <> auth.uid()
    group by cm.candidate_id
  ),
  my_city as (
    select lower(trim(coalesce(p.home_city,''))) as city
    from public.profiles p
    where p.id=auth.uid()
  )
  select
    p.id,
    p.display_name,
    p.username,
    p.home_city,
    p.avatar_url,
    coalesce(s.mutual_count,0)::bigint as mutual_count
  from public.profiles p
  left join scored s on s.candidate_id=p.id
  cross join my_city mc
  where auth.uid() is not null
    and p.id <> auth.uid()
    and p.username is not null
    and not exists (select 1 from public.tr_people_dismissals d where d.user_id=auth.uid() and d.suggested_user_id=p.id)
    and not exists (select 1 from public.tr_user_blocks b where (b.blocker_id=auth.uid() and b.blocked_id=p.id) or (b.blocked_id=auth.uid() and b.blocker_id=p.id))
    and not exists (select 1 from excluded e where e.user_id=p.id)
  order by
    case when p.id='493a7069-d9df-4e16-906d-ef3279a6bfee'::uuid then 0 else 1 end,
    case when coalesce(s.mutual_count,0)>0 then 0 else 1 end,
    coalesce(s.mutual_count,0) desc,
    case
      when mc.city<>'' and lower(trim(coalesce(p.home_city,'')))=mc.city then 0
      else 1
    end,
    p.created_at asc
  limit greatest(1,least(coalesce(p_limit,8),20));
$function$
