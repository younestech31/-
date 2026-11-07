# Mawarith — Commercial Readiness & Revenue Audit
**Review date:** 7 November 2026  
**Repository:** `younestech31/-`  
**Working branch:** `work/mawarith`  
**Production branch:** `main` (must remain untouched during this audit)

## Executive decision

**Do not start collecting customer money through the current public activation page yet.** The application has a workable low-cost manual licensing foundation, but the product is not commercially launch-ready: the pinned browser public key is still empty, no official support channel is configured, the license issue flow needed stronger key-pair validation, and the legal operating model for selling a remotely delivered software license in Algeria has not been confirmed.

The chosen approach remains deliberately lightweight: no customer accounts, no cloud storage of inheritance cases, no paid database, no payment gateway dependency, and no automatic renewal. The application remains useful in its free tier. This reduces operating cost and protects customer case data, but makes sales, renewals, support, device changes, and revocation a manual business process.

## 1. Product and current monetization

### Existing product
Mawarith is a local-first inheritance calculation and estate-settlement tool. Inheritance inputs, saved cases, exports, and ordinary backups are handled in the browser. The current commercial model is a fixed-duration Professional license, activated by importing a signed `.mwlicense` file.

### Current Free / Pro division
| Free | Pro |
|---|---|
| Inheritance calculation engine and currently available cases | Clean PDF export without the Mawarith watermark |
| Saved cases and ordinary JSON backup/import | Password-protected encrypted backup export/import |
| Word and Excel exports | The same local-first privacy model; no case files sent to Mawarith |

The free tier must remain useful. Do not paywall the correctness of inheritance calculations or hide legal warnings behind the license.

### Pilot prices currently hard-coded
| Duration | Price displayed | Approx. monthly equivalent |
|---|---:|---:|
| 30 days | 1,000 DZD | 1,000 DZD |
| 90 days | 2,500 DZD | 833 DZD |
| 365 days | 8,000 DZD | 667 DZD |

These are **unvalidated pilot hypotheses**, not evidence of market price or willingness to pay. The annual offer is about 20% below four quarterly purchases and about 33% below twelve monthly purchases. Do not treat that discount as correct until customers have tested the product and renewed.

Illustrative gross revenue at the displayed annual price, before taxes, refunds, support, and other costs:
- 10 annual licenses: 80,000 DZD
- 25 annual licenses: 200,000 DZD
- 50 annual licenses: 400,000 DZD

These are arithmetic scenarios only. The product has no automatic renewal, so none of this revenue is recurring unless customers voluntarily renew.

## 2. Technical audit findings

### Blockers before the first paid license
1. `lib/licensing/public-key.ts` currently contains an empty `LICENSE_PUBLIC_KEY_SPKI`. The UI correctly fails closed and hides the purchase/activation controls while the key is missing. Do not insert a placeholder key.
2. `NEXT_PUBLIC_MAWARITH_WHATSAPP` is blank in the example environment. A copy-request button alone is not a complete sales channel. An optional public support email has been added as `NEXT_PUBLIC_MAWARITH_SUPPORT_EMAIL`; set a real, monitored contact channel before inviting customers.
3. The offline issuer previously signed with whichever private key was supplied, without proving it matched the browser's pinned public key. The issuer now checks the PEM public key against the pinned client key and performs a sign/verify challenge before writing a license.
4. Pro entitlements are now explicit: `professional-pdf-export` and `encrypted-backup`. The encrypted-backup actions check that specific entitlement rather than merely checking a generic paid flag. Existing valid PDF-only licenses remain parseable, but do not receive the encrypted-backup entitlement.
5. The issuer and verifier must remain in lockstep. New licenses include both current Pro features; the public key must be generated once by the owner and retained with a secure offline backup of the private key.

### Known licensing limits
- The license is bound to a browser-local installation ID, not proven hardware identity. Clearing site data, switching browser profiles, or changing devices may require a replacement license.
- A local license cannot be remotely revoked or checked against a central payment ledger.
- A technically capable user can tamper with the local clock or client JavaScript. This is a deterrent to casual sharing, not unbreakable DRM.
- No payment is verified by the application. The owner must independently confirm that funds have actually arrived before issuing a license.
- Never upload `.license-keys/private-key.pem`, a customer `.mwlicense` file, or a customer's inheritance backup to GitHub, Vercel, an online form, or a support chat.

### Professional document integrity
The PDF office-mode controls previously used language such as “official act” and “approved notary” based on user-editable local settings. That wording could imply legal validation the application cannot establish. The PDF labels and office-settings control have been changed to describe a professional review template and user-entered office details, not an official act or accreditation. A SHA-256 digest or QR code is a technical integrity reference; it is not a qualified electronic signature, a notarial seal, or proof that the legal calculation is correct.

## 3. Algerian legal and payment checks

This is a product-readiness review, **not a legal opinion**. Obtain a written answer from the competent authority or a qualified Algerian adviser before accepting paid orders.

### Potential application of Law 18-05 on electronic commerce
Law 18-05 defines electronic commerce broadly around an electronic supplier offering or providing goods/services remotely through electronic communications. A time-limited software license advertised online and requested through an online activation page may fall within this framework; the exact classification of the proposed manual software-license flow needs confirmation.

If the activity is treated as electronic commerce, the official text includes important requirements:
- Article 8 addresses registration in the commercial register or artisan register and publication of a website/page hosted in Algeria with a `.com.dz` extension, with means to authenticate the supplier website.
- Article 9 provides for a national register/file of electronic suppliers at CNRC and domain filing.
- Article 10 requires an electronic commercial offer before each electronic commercial transaction and documentation by an electronic contract accepted by the e-consumer.
- Article 11 specifies information for the offer, including supplier identification/contact and registration details, the nature and price of the service (including applicable taxes), delivery, terms, after-sales support, payment, cancellation, and other transaction steps.

The current public address is `mawarith.vercel.app`, not a `.com.dz` domain, and the current license page is not a complete statutory commercial offer or contract. This is a **legal readiness blocker to resolve**, not a conclusion that the project is already in breach. Ask the Directorate of Commerce/CNRC whether this exact software-license model and manual transfer process are covered, and what hosting/domain and supplier-registration arrangements are required.

Law 18-05 also distinguishes transactions involving services for which an official contract is required. Mawarith sells access to software; it must not present its generated calculation report as the official notarial act itself. The revised interface and PDF wording now make that distinction clearer.

### Auto-entrepreneur route
The official ANAE activity list includes code **020103 — Développeur logiciel / مطور برمجيات** under digital services. This is a relevant activity to ask about, but the listing by itself does not prove that selling a time-limited license to a self-developed software product is classified identically to providing software-development services. Law 22-23 limits the status to eligible activities and excludes liberal, regulated, and craft activities. Ask ANAE in writing whether the specific activity description covers development, publication, licensing, maintenance, and sale of this software, and whether it fits the intended legal form. Do not infer eligibility from the code title alone.

### Electronic payment
SATIM explains that online card payment integration requires a process involving an acquiring bank and authorization from GIE Monétique, followed by technical certification. GIE Monétique documents the web-merchant authorization/certification workflow. Therefore:
- Do not plan around Stripe or an unverified foreign gateway.
- Do not add a payment API or collect card details in the Mawarith app.
- Start only with a lawful, documented, reconciled payment method after confirming the seller's legal/tax status.
- Consider CIB/Edahabia online payment only after the bank, GIE Monétique, and SATIM requirements are met.

### Electronic signatures and QR codes
Law 26-02 (17 February 2026) now appears in the Ministry of Post and Telecommunications' official list of laws concerning trust services and electronic identification. Mawarith's ECDSA key signs a **software entitlement file** only. Do not market this as a qualified electronic signature, identity certificate, official notarial authentication, or legally certified deed. Any future feature claiming such status requires the competent certification/trust-service framework and a separate legal/technical review.

## 4. Recommended revenue plan

### Phase 0 — prepare before taking money
- Confirm legal structure, activity code, invoicing/tax obligations, and whether Law 18-05 applies to this license-sales flow.
- Decide whether the current domain/hosting can be retained for commercial transactions or whether a compliant Algerian-hosted `.com.dz` presence is required.
- Generate the production key pair on the owner's trusted device, back up the private key offline in two controlled locations, and commit only the public key to the working branch.
- Configure one official support channel and publish business identity, support hours, refund/renewal/cancellation terms, privacy policy, and a clear description of the license/device policy.
- Test the complete flow in a clean browser: request, payment reconciliation, license issuance, activation, expiry, wrong installation, malformed file, and free-tier fallback.

### Phase 1 — small, manual pilot after legal clearance
Start with 5–10 notary offices, not a broad public launch. Demonstrate the product on sample data only. Collect structured feedback on:
- How often the office uses the tool in real work.
- Time saved on a typical case.
- Which exports are actually useful.
- Whether encrypted backup is valuable and understood.
- Whether the office would renew at each price.
- Support burden, errors, and required legal explanations.

Do not collect real heirs' or clients' inheritance data for marketing. Do not use pilot testimonials without permission. Measure paid conversion and renewal, not only sign-ups or compliments.

### Phase 2 — improve the Pro value before scaling
Potential additions, subject to usability and legal audit:
- Reusable professional report templates and office branding, clearly labelled as user-configured formatting rather than verified notary accreditation.
- Versioned legal/reference updates with a dated changelog and test matrix.
- Reliable local export and restoration workflows, plus guided device-migration support.
- Multi-device or multi-seat licensing only after the product has a clear support and revocation policy.
- Optional maintenance/support tier only if the team can actually deliver it.

Do not charge for changes that are necessary to correct a known legal-calculation defect. All calculation fixes should reach every user.

### Phase 3 — formalized sales and payments
After legal and banking approval:
- Add an appropriate compliant local payment integration.
- Generate an order receipt/invoice and a customer-facing license record.
- Maintain a minimal owner-side ledger: transaction reference, customer/business name, plan, license ID, issue date, expiry date, and support status. Do not store estate details.
- Add a privacy-conscious renewal reminder process; do not call the license “auto-renewing” unless it really is.

## 5. Branch and deployment policy

All code and documentation changes in this review are on `work/mawarith`. The `main` branch must remain unchanged. `vercel.json` on the work branch sets `git.deploymentEnabled.work/mawarith` to `false`, while keeping `main` enabled. The Vercel API showed zero deployments for `work/mawarith` before and after the change.

Do not manually deploy, promote, alias, or merge this branch as part of this audit. Confirm zero branch deployments after future pushes. A GitHub commit is not the same as a Vercel deployment.

## 6. External primary references

- Algerian Ministry of Commerce — Law 18-05: https://commerce.gov.dz/reglementation/loi-n-deg-18-05
- Official Journal, Law 18-05 (Arabic text): https://commerce.gov.dz/telecharger/reglementation/872/article
- ANAE activity list, 020103 software developer: https://activities.anae.dz/activities/020100/
- ANAE eligibility and activity-list overview: https://anae.dz/fr/
- Law 22-23 (auto-entrepreneur status), Official Journal: https://www.joradp.dz/FTP/jo-francais/2022/F2022085.pdf
- SATIM — online payment for web merchants: https://satim.dz/index.php/fr/services-cib/paiement-en-ligne
- GIE Monétique — web-merchant authorization: https://www.giemonetique.dz/activites/homologation/processus-homologation/autorisation-dun-web-marchand/
- Ministry of Post and Telecommunications — laws including Law 26-02: https://www.mpt.gov.dz/lois-et-ordonnances/

## Release status

**Not ready for public paid launch.** The engineering changes improve licensing correctness and legal wording, but a paid launch remains blocked by the absent production key, unconfigured contact channel, untested end-to-end activation, unconfirmed legal seller structure, and incomplete commercial disclosures. Keep the free product available while resolving these items.
