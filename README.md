# Owe

Krisceipt is a small debt, invoice, and receipt tracker built for deployment on Cloudflare Pages with Pages Functions.

Records are stored in Cloudflare D1, not browser `localStorage`, so the same data is available from phones and other devices.

## Local Development

```bash
npm install
npm run db:migrate:local
npm run dev
```

## Cloudflare Deployment

Create a D1 database named `owe-db`, update `wrangler.jsonc` with the real `database_id`, then run:

```bash
npm run db:migrate:remote
npm run deploy
```
