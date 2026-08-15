create table public.generation_feedback (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references public.generations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  verdict text not null check (verdict in ('useful', 'not_useful')),
  reasons text[] not null default '{}'::text[] check (
    reasons <@ array['identity', 'text', 'composition', 'subjects', 'style', 'quality']::text[]
  ),
  comment text check (comment is null or char_length(comment) between 1 and 1000),
  correction_requested boolean not null default false,
  correction_request text check (
    correction_request is null or char_length(correction_request) between 10 and 1200
  ),
  configuration_snapshot jsonb not null,
  automatic_evaluation_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, generation_id),
  check (
    not correction_requested
    or (verdict = 'not_useful' and correction_request is not null)
  )
);

comment on table public.generation_feedback is
  'Structured user decisions tied to an authoritative generation configuration and evaluation snapshot.';

create index generation_feedback_verdict_created_idx
  on public.generation_feedback (verdict, created_at desc);
create index generation_feedback_reasons_idx
  on public.generation_feedback using gin (reasons);
create index generation_feedback_configuration_idx
  on public.generation_feedback using gin (configuration_snapshot);

create trigger generation_feedback_touch_updated_at
before update on public.generation_feedback
for each row execute function public.touch_launch_updated_at();

alter table public.generation_feedback enable row level security;

create policy "Users can read own generation feedback"
on public.generation_feedback for select to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.generations
    where generations.id = generation_feedback.generation_id
      and generations.user_id = (select auth.uid())
  )
);

revoke all on table public.generation_feedback from public, anon, authenticated;
grant select on table public.generation_feedback to authenticated;

