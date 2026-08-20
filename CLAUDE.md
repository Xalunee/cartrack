@AGENTS.md

# Secrets

Never write a real credential into a committed file — no keys, tokens, DSNs,
passwords, URLs with embedded credentials, or any other live value. `.env.example`
and other templates get empty strings or an obvious placeholder like
`"your-key-here"`, and the real value goes to the deployment environment only.

This holds even when the value is technically public or write-only. A scraped
ingest key still costs quota, and once the quota is gone real reports stop
arriving.

# Commits

Never add a `Co-Authored-By` line to suggested commit messages.
