# LightLine

LightLine is a voice-first electricity complaint intake system for Nigeria. Its intended workflow turns a natural-language call into a validated, stored complaint, an operations dashboard entry, and a human-readable ticket reference returned to the caller.

## Project status

This repository currently contains governance and contributor guidance. The application has not been scaffolded yet, so there are no setup commands, environment variables, or CI checks to run.

The intended MVP uses Next.js App Router, TypeScript, Tailwind CSS, Next.js Route Handlers with Zod validation, Supabase/PostgreSQL, and Vercel. BimpeAI is the primary voice workflow platform, using Temlio phone infrastructure and YarnGPT voice through BimpeAI. See [AGENTS.md](AGENTS.md) for the product boundaries and engineering workflow.

## Contributing

Create a focused branch from the latest `main`, open a pull request into `main`, and include the change, reason, verification, schema/config changes, and limitations in the PR description. Do not commit credentials; add placeholder-only entries to `.env.example` as variables are introduced.

## License

No license has been selected yet. The repository owner needs to choose one before a `LICENSE` file is added.
