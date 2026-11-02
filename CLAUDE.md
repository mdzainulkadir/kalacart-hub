# KalaCart agent instructions

Read AGENTS.md first, then B2B_TASKS.md. Do only the task the user names, then stop.

## Working rules
- Work on the git branch `b2b`. Never commit to `main`.
- Open a file before editing it. Do not guess file paths, function names, or library APIs; search the repo to confirm they exist.
- Make the smallest change that completes the task. Do not refactor, rename, or reformat unrelated code.
- Do not read, print, or edit `.env` files. Never write secrets into any file.
- After each task: run `npm run build`. If you could not run it, say so plainly instead of claiming success.
- End each task with: (1) files changed, (2) how to test it in the browser, (3) anything you were unsure about.
- If a task seems to need a change outside its scope, stop and ask instead of doing it.

## Project facts
- Stack: TanStack Start, Tailwind, shadcn/ui, Postgres backend. The WhatsApp webhook lives at `/api/public/whatsapp`.
- Twilio outbound free-text replies are blocked on this trial account (error 21654). Reply sends must be wrapped in try/catch and must never stop the main action.
- Database changes from `b2b_setup.sql` are already applied. Do not create migrations.
