# Trigger.dev job consumer

Trigger.dev is Crealy's primary low-latency job consumer. Supabase remains the
source of truth for job state, idempotency and credit reservations. Only the job
UUID is sent to Trigger.dev. The five-minute GitHub workflow remains enabled as
a recovery mechanism for jobs that were not dispatched or need another retry.

## Production setup

1. Create a Trigger.dev project and copy its `proj_...` reference.
2. Connect the Trigger.dev project to the Crealy GitHub repository and Vercel
   project. Keep automatic production task deployments enabled.
3. Add `TRIGGER_PROJECT_REF` to Vercel and Trigger.dev.
4. Add the production Trigger.dev secret as `TRIGGER_SECRET_KEY` in Vercel.
5. In Trigger.dev, configure every server-side variable used by the worker,
   especially Supabase service credentials, OpenAI, R2, Resend and Sentry.
   Secret variables may need to be copied manually because Vercel does not expose
   all secret values to integrations.
6. Deploy the tasks with `npm run trigger:deploy`, or let the Vercel integration
   deploy them from `main`.
7. Set `TRIGGER_ENABLED=true` in Vercel only after the production task is visible
   in Trigger.dev.

If dispatch fails, the API still accepts the durable Supabase job and logs
`job.trigger_dispatch_failed`; the recovery cron processes it later.
