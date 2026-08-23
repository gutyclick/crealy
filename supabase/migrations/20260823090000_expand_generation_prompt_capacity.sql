-- The thumbnail creative planner now stores a structured, model-ready prompt
-- containing semantic reasoning, composition, identity and typography rules.
-- The historical 8k limit predates that planner and rejected valid jobs during
-- preparation, before the image provider was called.

alter table public.generations
  drop constraint if exists generations_enhanced_prompt_length;

alter table public.generations
  add constraint generations_enhanced_prompt_length
  check (
    enhanced_prompt is null
    or char_length(enhanced_prompt) between 10 and 24000
  );
