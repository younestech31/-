# i18n URL-Segment Migration Plan
This document outlines the complete transition plan from cookie-based language routing to deterministic URL-segment routing (`/` for Arabic and `/fr` for French).

---

## 1. Context & Architectural Problem
Currently, the website has French and Arabic variants on the same exact URLs (or separate structures such as `/blog/fr/[slug]`).
* **Hreflang compliance:** Crawlers like Googlebot require distinct, crawlable, and clean URLs for different locales to avoid duplicates and ensure indexes are localized.
* **CDN caching:** Multi-locale pages serving content over the same URL depending on `cookies()` either suffer from disabled edge caches, or risk mixing cache delivery based on cookies (`Vary: Cookie`).
* **SEO visibility:** By default, Web spiders crawl without cookies, leading to poor indexed visibility for all French translations.

---

## 2. Proposed URL Structure
| Page Target | Arabic URL (Default) | French URL (New Segment) |
| :--- | :--- | :--- |
| **Home Page** | `lattab.vercel.app/` | `lattab.vercel.app/fr` |
| **Blog Index** | `lattab.vercel.app/blog` | `lattab.vercel.app/fr/blog` |
| **Blog Post** | `lattab.vercel.app/blog/[slug]` | `lattab.vercel.app/fr/blog/[slug]` |
| **Calculator** | `lattab.vercel.app/calculateur-prix-referentiel` | *(Bilingual single-screen state; no path prefix)* |

---

## 3. Implementation Steps (Phased Rollout)

### Phase 1: Directory Movement
1. Move French dynamic blog pages:
   * **Source Directory:** `app/blog/fr/[slug]/`
   * **Target Directory:** `app/fr/blog/[slug]/`
2. Create standard French indexes:
   * Create `app/fr/page.tsx` for French-localized layouts and content.
   * Create `app/fr/blog/page.tsx` for the French blog catalog.

### Phase 2: Middleware & Locale Routing
We have integrated Phase 2 into `middleware.ts`:
* Detect `/fr` prefixes directly in incoming paths.
* Map language variables accordingly (`ar` on root/neutral URL lanes, `fr` on `/fr` URL lanes).
* Push `x-lang: fr` & sync the client cookie `lang=fr` for underlying page components or tools.
* Exclude `/api/` dynamic headers and ensure assets/manifest files avoid intercepting loops.

### Phase 3: Redirect Handling (SEO Integrity)
Ensure old French blog URLs redirect via a fast `301 Moved Permanently` header mapping:
```typescript
if (url.pathname.startsWith('/blog/fr/')) {
  const slug = url.pathname.slice('/blog/fr/'.length);
  url.pathname = `/fr/blog/${slug}`;
  return NextResponse.redirect(url, { status: 301 });
}
```

### Phase 4: LangSwitcher Component & Navigation Updates
* Refactor the `LanguageSwitcher` to execute deterministic page transformations (e.g., adding or stripping the `/fr` path prefix) rather than dynamically reloading context states via cookies alone.

---

## 4. Hreflang Structure Output
For all routed paths, clean semantic layout tags will output:
```html
<link rel="alternate" hreflang="ar-DZ" href="https://notaire-lattab-oran.com/blog/some-slug" />
<link rel="alternate" hreflang="fr-DZ" href="https://notaire-lattab-oran.com/fr/blog/some-slug" />
<link rel="alternate" hreflang="x-default" href="https://notaire-lattab-oran.com/blog/some-slug" />
```
This guarantees fully compliant multilingual indexing, increases Google's crawl signals, and reduces rendering layout shifts.
