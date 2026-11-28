const {PGlite}=require('@electric-sql/pglite');const fs=require('node:fs');const assert=require('node:assert/strict');
(async()=>{
 const db=new PGlite();await db.exec(`
 create role anon;create role authenticated;create schema auth;create schema private;
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid',true),'')::uuid $$;
 create table profiles(id uuid primary key,is_private boolean default false,available boolean default true);
 create table restaurants(id uuid primary key,google_place_id text);
 create table ratings(id uuid primary key,user_id uuid,restaurant_id uuid,verified_visit boolean,created_at timestamptz,visit_latitude double precision default 30,visit_longitude double precision default -97,hidden boolean default false);
 create table account_marks(user_id uuid,mark_type text,is_active boolean);
 create function private.tr_user_available(target uuid) returns boolean language sql as $$select available from public.profiles where id=target$$;
 create function private.tr_can_read_content(target uuid) returns boolean language sql as $$select not is_private or id=auth.uid() from public.profiles where id=target$$;
 create function private.tr_content_visible(kind text,target uuid) returns boolean language sql as $$select not hidden from public.ratings where id=target$$;
 insert into profiles values ('00000000-0000-0000-0000-000000000001',false,true),('00000000-0000-0000-0000-000000000002',true,true),('00000000-0000-0000-0000-000000000003',false,false);
 insert into restaurants select ('10000000-0000-0000-0000-'||lpad(i::text,12,'0'))::uuid,'place-'||i from generate_series(1,250)i;
 insert into ratings(id,user_id,restaurant_id,verified_visit,created_at) select ('20000000-0000-0000-0000-'||lpad(i::text,12,'0'))::uuid,'00000000-0000-0000-0000-000000000001',('10000000-0000-0000-0000-'||lpad(((i-1)%25+1)::text,12,'0'))::uuid,true,now()-((i-1)/25+1)*interval '1 day' from generate_series(1,249)i;
 insert into account_marks values ('00000000-0000-0000-0000-000000000001','chefs_table',true),('00000000-0000-0000-0000-000000000001','first_round',true),('00000000-0000-0000-0000-000000000001','og',true);
 `);
 // Establish history before installing server-owned submission timestamps.
 for(const [user,visits,places] of [[4,250,24],[5,365,1],[6,260,25],[7,250,250]]){
  await db.exec(`insert into profiles values('00000000-0000-0000-0000-00000000000${user}',false,true);
  insert into ratings(id,user_id,restaurant_id,verified_visit,created_at) select ('${user}0000000-0000-0000-0000-'||lpad(i::text,12,'0'))::uuid,'00000000-0000-0000-0000-00000000000${user}',('10000000-0000-0000-0000-'||lpad(((i-1)%${places}+1)::text,12,'0'))::uuid,true,now()-((i-1)/${places}+1)*interval '1 day' from generate_series(1,${visits})i;`);
 }
 await db.exec(fs.readFileSync('supabase/launch-contributor-status.sql','utf8'));
 const id='00000000-0000-0000-0000-000000000001';const status=async(uid=id)=>(await db.query('select * from get_account_contributor_status(array[$1]::uuid[])',[uid])).rows[0];
 const limited=await status('00000000-0000-0000-0000-000000000004');assert.equal(Number(limited.qualifying_ratings),240);assert.equal(Number(limited.distinct_restaurants),24);assert(!limited.earned,'250 raw visits at 24 places cannot qualify');
 const repeated=await status('00000000-0000-0000-0000-000000000005');assert.equal(Number(repeated.qualifying_ratings),10);assert.equal(Number(repeated.distinct_restaurants),1);assert(!repeated.earned,'365 daily visits at one location count only ten');
 const enough=await status('00000000-0000-0000-0000-000000000006');assert.equal(Number(enough.qualifying_ratings),250);assert(enough.earned,'extra repeat visits do not disqualify otherwise eligible diners');
 assert((await status('00000000-0000-0000-0000-000000000007')).earned,'250 distinct verified locations also qualify');
 let row=await status();assert.equal(Number(row.qualifying_ratings),249);assert(!row.earned);assert.deepEqual(row.marks,['first_round']);
 await db.exec(`insert into ratings(id,user_id,restaurant_id,verified_visit,created_at)values('20000000-0000-0000-0000-000000000250','${id}','10000000-0000-0000-0000-000000000025',false,now()-interval '5 days');`);
 assert(!(await status()).earned,'249 qualifying verified ratings is insufficient');
 await db.exec(`update ratings set verified_visit=true where id='20000000-0000-0000-0000-000000000250'`);
 assert((await status()).earned,'250 verified ratings across 25 locations earns');
 // Same-place/day duplicate doesn't count, even if stored as another restaurant.
 await db.exec(`insert into restaurants values('10000000-0000-0000-0000-000000000251','place-25');insert into ratings(id,user_id,restaurant_id,verified_visit,created_at)values('20000000-0000-0000-0000-000000000251','${id}','10000000-0000-0000-0000-000000000251',true,now()-interval '5 days');`);assert.equal(Number((await status()).qualifying_ratings),250);
 await db.exec(`update ratings set created_at=now()-interval '100 days' where id='20000000-0000-0000-0000-000000000251'`);assert.equal(Number((await status()).qualifying_ratings),250,'backdating duplicate cannot add a visit day');
 await db.exec(`update ratings set hidden=true where id='20000000-0000-0000-0000-000000000001'`);assert.equal(Number((await status()).qualifying_ratings),249);assert(!(await status()).earned,'moderated spam removed');
 await db.exec(`update ratings set verified_visit=false where id='20000000-0000-0000-0000-000000000002'`);assert.equal(Number((await status()).qualifying_ratings),248);
 await db.exec(`delete from public.ratings where restaurant_id='10000000-0000-0000-0000-000000000003'`);row=await status();assert.equal(Number(row.distinct_restaurants),24);assert(!row.earned);
 assert.equal(await status('00000000-0000-0000-0000-000000000002'),undefined,'guest cannot see private progress');
 await db.exec(`select set_config('test.uid','00000000-0000-0000-0000-000000000002',false)`);assert(await status('00000000-0000-0000-0000-000000000002'),'owner sees own private progress');
 assert.equal(await status('00000000-0000-0000-0000-000000000003'),undefined,'unavailable user hidden');
 await db.exec('set role anon');assert.equal((await db.query('select * from get_account_contributor_status(array[]::uuid[])')).rows.length,0);await db.exec('reset role');
 await db.close();console.log('PASS: PostgreSQL threshold edges, canonical-place/day dedup, verification, moderation, deletions, legacy grants, private-profile access and anonymous execution');
})().catch(e=>{console.error(e);process.exit(1)});
