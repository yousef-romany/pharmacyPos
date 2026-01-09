# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Critical Non-Obvious Patterns

- All database numeric values are stored as VARCHAR (strings) - ALWAYS use `safeParseFloat()` helper before calculations (defined in multiple files, should be centralized)
- Database connection via Tauri plugin: `mysql://root:root@localhost:3306/pharmacypos` - NOT standard Next.js database setup
- Next.js configured as static export (`output: 'export'`) - no SSR, required for Tauri desktop app
- Build process: Tauri wraps Next.js build output from `../out` directory
- TypeScript and ESLint errors are ignored during builds - see `next.config.ts`

## Project-Specific Conventions

- Products support dual-unit pricing (main/sub units) with conversion via `subUnitsPerUnit`
- Discount system: product-level discounts first, then insurance-level discounts applied to subtotal
- Cart items tracked by (productId + selectedUnitType) - same product can exist twice if different units selected
- Zustand stores use versioned storage names (e.g., `pharmacy-cart-storage-v4`) for migrations
- State management: Zustand with localStorage persistence for auth and cart
- Path alias: `@/*` maps to `./src/*`

## Build & Development

- Dev: `npm run dev` (uses Turbopack) - starts Next.js on port 3000
- Tauri dev: automatically runs `npm run dev` before Tauri window
- Build: `npm run build` - creates static export in `out/` directory
- Tauri build: runs `npm run build` then packages desktop app
- Genkit AI dev: `npm run genkit:dev` - starts AI development server
- Type check: `npm run typecheck` - runs TypeScript compiler without emitting files
- Lint: `npm run lint` - runs Next.js linter

## Important Notes

- No test framework configured - `npm test` mentioned in docs but doesn't exist
- AI integration: Genkit with Google AI (Gemini 2.0 Flash) - requires `GOOGLE_GENAI_API_KEY` env var
- UI is Arabic-first (RTL) - use `arSA` locale for date formatting
- All price/cost/quantity fields in types are strings - parse before math operations
