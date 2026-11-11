-- Output parameter names overlap table columns. Name the primary-key constraint
-- explicitly so a logo tap works for both new and existing reward holders.
create or replace function public.unlock_secret_sauce()
returns table(user_id uuid,reward_slug text,reward_type text,reward_name text,
  reward_emoji text,unlocked_at timestamptz,is_new boolean)
language plpgsql security definer set search_path='public' as $function$
declare
  uid uuid := auth.uid();
begin
  if uid is null then return; end if;
  insert into public.user_secret_rewards
    (user_id,reward_slug,reward_type,reward_name,reward_emoji,is_new)
  values (uid,'secret-sauce','badge','Secret Sauce','SAUCE',true)
  on conflict on constraint user_secret_rewards_pkey do nothing;
  return query
    select r.user_id,r.reward_slug,r.reward_type,r.reward_name,
      r.reward_emoji,r.unlocked_at,r.is_new
    from public.user_secret_rewards r
    where r.user_id=uid and r.reward_slug='secret-sauce'
    limit 1;
end;
$function$;
