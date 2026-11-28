-- Private idempotency and budget ledger for recipe generation. No client writes.
create table if not exists private.pro_recipe_generation_jobs(
 id uuid primary key,user_id uuid not null references auth.users(id) on delete cascade,
 fingerprint text not null check(fingerprint ~ '^[a-f0-9]{64}$'),
 status text not null check(status in ('pending','ready','failed')),
 response jsonb,created_at timestamptz not null default now(),finished_at timestamptz
);
alter table private.pro_recipe_generation_jobs enable row level security;
create policy generation_jobs_no_client_access on private.pro_recipe_generation_jobs for all to anon,authenticated using(false) with check(false);
revoke all on private.pro_recipe_generation_jobs from public,anon,authenticated;
grant usage on schema private to service_role;
grant select,insert,update on private.pro_recipe_generation_jobs to service_role;
create index if not exists pro_recipe_jobs_user_created on private.pro_recipe_generation_jobs(user_id,created_at);
create index if not exists pro_recipe_jobs_created on private.pro_recipe_generation_jobs(created_at);
create or replace function public.claim_pro_recipe_generation(p_id uuid,p_user uuid,p_fingerprint text,p_user_limit integer,p_global_limit integer)
returns jsonb language plpgsql set search_path='' as $$
declare prior private.pro_recipe_generation_jobs; today timestamptz:=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC';
begin
 if p_id is null or p_user is null or p_fingerprint is null or p_fingerprint !~ '^[a-f0-9]{64}$' or p_user_limit is null or p_user_limit<1 or p_user_limit>20 or p_global_limit is null or p_global_limit<1 or p_global_limit>1000 then raise exception 'Invalid generation request';end if;
 perform pg_advisory_xact_lock(hashtext('pro_recipe_generation_budget_v1'));
 select * into prior from private.pro_recipe_generation_jobs where id=p_id;
 if found then
  if prior.user_id<>p_user or prior.fingerprint<>p_fingerprint then return jsonb_build_object('status','mismatch');end if;
  return jsonb_build_object('status',prior.status,'response',prior.response);
 end if;
 if (select count(*) from private.pro_recipe_generation_jobs where user_id=p_user and created_at>=today)>=p_user_limit or (select count(*) from private.pro_recipe_generation_jobs where created_at>=today)>=p_global_limit then return jsonb_build_object('status','limited');end if;
 insert into private.pro_recipe_generation_jobs(id,user_id,fingerprint,status) values(p_id,p_user,p_fingerprint,'pending');
 return jsonb_build_object('status','claimed');
end;$$;
create or replace function public.finish_pro_recipe_generation(p_id uuid,p_user uuid,p_response jsonb,p_success boolean)
returns boolean language plpgsql set search_path='' as $$
declare n integer;
begin
 if p_response is not null and octet_length(p_response::text)>60000 then raise exception 'Response too large';end if;
 update private.pro_recipe_generation_jobs set response=p_response,status=case when p_success then 'ready' else 'failed' end,finished_at=now() where id=p_id and user_id=p_user and status='pending';
 get diagnostics n=row_count;return n=1;
end;$$;
revoke all on function public.claim_pro_recipe_generation(uuid,uuid,text,integer,integer),public.finish_pro_recipe_generation(uuid,uuid,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.claim_pro_recipe_generation(uuid,uuid,text,integer,integer),public.finish_pro_recipe_generation(uuid,uuid,jsonb,boolean) to service_role;
