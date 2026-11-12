# In-app feedback email

Backend deployed to project jyojnjkpwhwzgarfpepm on November 12, 2026. The mailbox secret is configured. A signed-in browser test was confirmed received by Ryan, and feedback_outbox records the suggestion as sent. Signup confirmation and password-reset sender/link tests were also confirmed. SPF, DKIM and DMARC are publicly published. Native iPhone/Android feedback UI and travel/location tests remain required before public launch.

For deployment to another environment:

1. Review and apply `supabase/feedback-setup.sql`; RLS enabled, no client table access. Server-only claim RPC serializes per-user limits (five/hour) and request IDs.
2. In Supabase > Edge Functions > Secrets, add `FEEDBACK_SMTP_PASSWORD` using the support@tablerec.co mailbox password. Do not commit it or send it in chat. Auth SMTP configuration does not automatically provide this secret to Edge Functions.
3. Deploy `send-feedback` with JWT verification **enabled**. Also validates the caller against Auth. Verified email provides Reply-To; username is looked up server-side. Destination and sender cannot be supplied by clients.
4. Confirm unsigned requests fail, two simultaneous same-ID requests send at most one email, rate limit works, and feedback from a real signed-in tester arrives in support@tablerec.co.
5. Only then merge/rebuild and test on iPhone and Android.

The outbox retains feedback for troubleshooting. SMTP cannot guarantee exactly-once inbox delivery: if acceptance or final status is uncertain, the same ID is not automatically re-sent. Review the outbox and mail logs before resolving. No GPS, passwords, or photo attachments are collected automatically. An email-provider quota still applies.
