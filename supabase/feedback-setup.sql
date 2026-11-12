-- Apply once before deploying send-feedback. Only the server can access the outbox.
create table public.feedback_outbox (
 id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check(kind in ('suggestion','problem','love')),
 message text not null check(length(message) between 5 and 4000),
 metadata jsonb not null default '{}',
 state text not null default 'sending' check(state in ('sending','sent','failed')),
 created_at timestamptz not null default now()
);
alter table public.feedback_outbox enable row level security;
revoke all on public.feedback_outbox from public,anon,authenticated;
grant select,insert,update on public.feedback_outbox to service_role;
create index feedback_outbox_user_time on public.feedback_outbox(user_id,created_at);
create function public.claim_feedback(p_id uuid,p_user uuid,p_kind text,p_message text,p_metadata jsonb)
returns text language plpgsql security invoker set search_path='' as $$
declare existing public.feedback_outbox; n integer;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,61027));
 select * into existing from public.feedback_outbox where id=p_id;
 if found then
  if existing.user_id<>p_user or existing.kind<>p_kind or existing.message<>p_message then return 'conflict';end if;
  return existing.state;
 end if;
 select count(*) into n from public.feedback_outbox where user_id=p_user and created_at>now()-interval '1 hour';
 if n>=5 then return 'limited';end if;
 insert into public.feedback_outbox(id,user_id,kind,message,metadata) values(p_id,p_user,p_kind,p_message,p_metadata);
 return 'claimed';
end;$$;
revoke all on function public.claim_feedback(uuid,uuid,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.claim_feedback(uuid,uuid,text,text,jsonb) to service_role;
