# Mawarith Manual License System

## Product model

Mawarith remains usable without an account. Calculation, inheritance scenarios, local case storage, and local backup/import/export remain available in the free edition. Professional access is a manually prepaid, fixed-duration license. There is no automatic renewal, online payment gateway, payment API, customer database, server-side file storage, or cloud synchronization in this model.

The proposed pilot periods and prices are product decisions, not technical constants:
- 30 days — 1,000 DZD
- 90 days — 2,500 DZD
- 365 days — 8,000 DZD

Prices belong in one presentation/configuration layer. They must not affect calculation formulas or the inheritance engine.

## Trust boundaries

1. The customer's browser creates a random installation ID and stores it locally.
2. The customer shares that ID with the owner by a normal communication channel.
3. The owner independently confirms that the funds have actually arrived in the owner's account.
4. The owner runs the offline issuer on a trusted local computer.
5. The issuer signs a small JSON license file with the owner's ECDSA P-256 private key.
6. The customer imports that file. The browser checks signature, expiry, product, and installation ID using the public key.
7. The browser stores the accepted license locally. No license check calls a server.

The private key must never enter Git, Vercel, a browser bundle, a website admin page, or a customer device. Only the public key belongs in lib/licensing/public-key.ts.

## One-time owner setup

Run this on the owner's trusted computer:

    npm run license:keys

This creates:
- .license-keys/private-key.pem — private signing key; ignored by Git.
- .license-keys/public-key.pem — public key copy.
- Updated lib/licensing/public-key.ts — public verification key; safe to commit.

Back up the private key offline. Do not run key generation again after issuing customer licenses unless intentionally rotating the key and reissuing all licenses. The script refuses to overwrite an existing key pair unless --rotate is supplied.

## Issue a license

Ask the customer to copy the installation ID displayed by the application. After independently verifying payment, issue a license:

    npm run license:issue -- --installation-id "<CUSTOMER_INSTALLATION_ID>" --customer "اسم المكتب" --days 90

The command creates a .mwlicense file in the repository root. Send that file to the customer. The private key remains on the owner's computer.

## Important limitations

This design is intentionally local-first and low-cost; it is not tamper-proof DRM. Without a server or database, the application cannot remotely revoke an issued license, enforce a reliable device count, detect a deliberate system-clock rollback, or prevent a technically capable user from modifying client-side JavaScript. Binding the license to the installation ID discourages casual file sharing, but clearing browser data or changing devices requires the owner to issue a replacement manually.

The free calculation engine must not be blocked when a license is missing, expired, or invalid. Professional features should fail closed, while the calculator itself stays available.

## Implementation checklist

- [x] Isolated feature branch created from main.
- [x] ECDSA P-256 client verification module.
- [x] Offline key-generation and license-issuance scripts.
- [x] Unit tests for signature, expiry, payload tampering, and installation binding.
- [x] Local activation page with three manually prepaid term options; current Pro entitlement is PDF watermark removal only.
- [ ] Replace server entitlement lookup with local license status.
- [ ] Remove server-side PDF finalization and apply export watermark locally.
- [ ] Remove Cloud Sync UI and cloud case APIs; preserve local encrypted storage and JSON backup.
- [ ] Remove account registration/login/email verification and server sessions.
- [ ] Remove Stripe, Neon/Drizzle/PostgreSQL, Resend, and unused dependencies/lockfile entries.
- [ ] Add activation and manual-payment information UI; communication remains manual.
- [ ] Review identity/branding and update README, environment example, and metadata.
- [ ] Run tests, lint, type-check, production build, inspect branch diff, and verify the live production deployment still points to the original main.

## Release gate

Do not merge this branch or trigger a production deployment until every checklist item is completed or explicitly deferred, all CI checks pass, the owner has generated and safely backed up the private key, and the complete activation flow has been tested using a test license on a clean browser profile.
