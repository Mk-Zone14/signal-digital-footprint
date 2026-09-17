# Signal platform foundation

Signal stays a React/Vite single-page application deployed as static assets on Vercel. The browser owns Supabase Auth and ordinary account reads and writes through one shared client. Every browser database request is constrained by Postgres Row Level Security.

The application has two explicit data modes:

- **Demo mode:** deterministic bundled data, local filters and analytics, and no database writes.
- **Account mode:** a restored Supabase session, database activities mapped into the existing `Activity[]` domain, then the same filters, analytics, and pages. Account loading, empty, and error states never substitute demo data.

Pages do not issue database queries. Repositories own persistence operations and mapping between database rows and domain objects. Source adapters normalize provider-specific records before repositories persist them. Analytics only receives normalized activities and has no provider-specific branches.

Current account CRUD uses the browser client because RLS is the security boundary. Future OAuth callbacks, provider API calls, webhook verification, scheduled reconciliation, and browser-extension ingestion belong in Vercel Functions under `api/`. Privileged Supabase access is created only by the server-only module in that directory; it is outside the Vite source graph and must never be imported by `src/`.

Email magic links are the sole login method in this phase. A GitHub login, if added later, remains an authentication option and is separate from connecting GitHub as an activity source.

Future extension flow: Signal Capture obtains a Signal session, submits a user-approved normalized capture request to an authenticated Vercel endpoint, the endpoint validates it and persists `source = browser_extension`, and the ordinary account pipeline reads it. The extension has no independent database.

## Deployment configuration

1. Create a Supabase project and apply the checked-in migrations with the Supabase CLI.
2. Copy `.env.example` to a local ignored environment file and provide the public project URL and anon key for Vite.
3. Add the application origin and Vercel preview/production callback URLs to the Supabase Auth redirect allow list so magic links can restore a browser session.
4. Configure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` only in the Vercel Function environment. The service-role key is used by authenticated server ingestion and is never a Vite variable.
5. Add future provider credentials only when their server-side integration is implemented.

`api/activities/capture.ts` is the future extension ingestion boundary. It already requires a valid Signal bearer token, derives `user_id` from that token, validates the normalized request, and performs an idempotent upsert. No extension or browser permission is included in this phase.
