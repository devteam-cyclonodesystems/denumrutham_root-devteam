# Temple Management System (TMS) — Knowledge Base

This document maps all database migrations, table structures, system permissions, seeding scripts, and architectural modifications implemented in the TMS platform (Sprint 3).

---

## 1. Database Schema Changes & Seeding

All updates are run via the database maintenance script: [execute_database_updates.py](file:///c:/Denumrutham/backend/scratch/execute_database_updates.py).

### Schema Modifications
* **Live Profile (`temple_profiles` Table)**:
  * `short_description` (TEXT, nullable)
  * `meta_title` (VARCHAR, nullable)
  * `meta_description` (TEXT, nullable)
  * `published_at` (TIMESTAMP WITH TIME ZONE, nullable)
  * `published_by` (UUID, nullable)
* **Staging Profile (`temple_profile_drafts` Table)**:
  * `short_description` (TEXT, nullable)
  * `meta_title` (VARCHAR, nullable)
  * `meta_description` (TEXT, nullable)

### New Tables
#### `temple_key_personnels`
Holds administrative directory entries for temple officials (Pujaris, Managers, etc.):
```sql
CREATE TABLE IF NOT EXISTS temple_key_personnels (
    id UUID PRIMARY KEY,
    temple_id UUID NOT NULL REFERENCES temples(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    designation VARCHAR NOT NULL,
    image_url VARCHAR,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);
```

### System Permissions Seeding
Mapped directly to the `SUPER_ADMIN` role:
* **`MANAGE_TEMPLE_PROFILES`**: Direct publish override and live content modifications.
* **`REVIEW_PROFILE_DRAFTS`**: Moderation approval/rejection capability for manager-submitted drafts.

---

## 2. API Endpoint Registrations

All endpoints enforce multi-tenant isolation validation check checks.

### Curation & Staging Profiles
* **`GET /api/v1/temple-profile/draft`** — Retrieve staging draft & live profile side-by-side.
* **`POST /api/v1/temple-profile/draft`** — Submit/Create a profile draft (Locks edits if already pending review).
* **`GET /api/v1/temple-profile/{temple_id}/completeness`** — Computes weighted completeness score (max 100).

### Key Personnel Directory
* **`GET /api/v1/digital-experience/key-personnel`** — List personnel.
* **`POST /api/v1/digital-experience/key-personnel`** — Create personnel.
* **`PUT /api/v1/digital-experience/key-personnel/{id}`** — Edit details.
* **`DELETE /api/v1/digital-experience/key-personnel/{id}`** — Soft deactivates (`is_active = False`) by default.
* **`PATCH /api/v1/digital-experience/key-personnel/reorder`** — Reorder personnel priority hierarchy.

---

## 3. UI Curation & Public Enhancements

* **Notice Board & Announcements**:
  * Tickers automatically sorted and injected deterministically on public pages:
    `['hero', 'about', 'announcements', 'activities', 'festivals', 'gallery', 'key_personnel', 'mantras', 'contact']`
* **Auditing & Moderation**:
  * Built diffing layout highlighting staging changes next to live profile content.
  * Supported direct overrides with "Approve with Edits" metadata trails tracked.
* **Mantra Chanting Preview Card**:
  * Extracted video ID from YouTube/YouTube Music URLs.
  * Controls playback (play, pause, mute, unmute) via an iframe API message passing model (`postMessage`).

---

## 4. Sprint 4 — Transactional Alignment & Preview Refinements

### Option A Transaction Handling
* **Platform Standard Transaction Wrapper**: Removed explicit transaction starting (`db.begin()`) or checks (`db.in_transaction()`) inside `TempleProfileService`. Mutating methods run directly on the session and commit explicitly, with exceptions caught, rolled back via `await db.rollback()`, and bubbled up.
* **Audit Serialization**: Implemented `make_serializable` inside `TempleProfileService.approve_draft` and `direct_update_profile` to convert UUID and datetime fields to string format, preventing JSONB database serialization errors.

### Context Propagation & Curation Refactoring
* **Race-Free Mount Hooks**: Changed sub-resource tabs (`AnnouncementsTab`, `ActivitiesTab`, `GalleryTab`, `FestivalSettings`, `KeyPersonnelTab`) to extract route `templeId` synchronously from Router params via `useParams()` and pass it to store fetch actions.
* **X-Temple-ID Header Injection**: Augmented `digitalExperienceService` API methods to accept optional `templeId` parameters, injecting the `X-Temple-ID` header only if specified. This guarantees that manager flows continue to resolve context via token/JWT while curator flows correctly resolve context via the custom header.
* **Real-time Live Preview Sync**: Removed duplicate local `useState` hooks inside `AboutTab.tsx`. Bind textareas directly to the Zustand store's `profile` state to sync manager keystrokes with the preview iframe in real-time.

### Defensive Rendering & Hardening
* **Hiding Empty Sections**: Applied `.trim()` checks to `TemplePublicPortal.tsx`, `TempleDetail.tsx`, and `PortalWebsitePreview.tsx` to automatically hide the History section if it is empty, null, or contains whitespace only.
* **Stable Announcement Sorting**: Hardened sorting logic in `PortalAnnouncementTickerPreview.tsx` to handle missing/null `created_at` timestamps using safe fallback comparison values.

---

## 5. Sprint 5 — Key Personnel & Devotional Chant Speaker

### Key Personnel Layout Synchronization
* **Automatic Injection & Fallbacks**: Integrated `key_personnel` into the default fallback `section_order` and website settings labels list. Set up an automatic injection rule inside the settings component to mount Key Personnel right before the Contact section. Enabled Key Personnel rendering within the Manager's live portal preview.

### Devotional Chant Speaker Redesign
* **Speaker Control Integration**: Replaced the standalone mantras section with a dedicated Speaker button next to the Follow button in the Hero Banner, adapting to both split and full-screen layouts.
* **Autoplay & Loop**: Implemented a 10-second autoplay delay and loop playback for the devotee portal chant.
* **Backend Serialization**: hard-coded explicit `feature_visibility` dictionary serialization in the `/bootstrap` endpoint inside `public_portal.py` to prevent frontend configuration schema parse failures.

---

## 6. Sprint 6 — Carousel Marquees, Lightbox Close, and Audio Playback Fixes

### Footer Refinement
* **Removed Redundant Header & Address**: Cleaned up `PortalContactPreview.tsx` to remove the duplicate temple name header and location strings from the left column of the public website footer, keeping only social links on the left side.

### Horizontal Marquees
* **React-Controlled Marquees**: Replaced CSS keyframe-based marquee animation with a React-controlled scroll loop container in both `PortalKeyPersonnelPreview.tsx` and `PortalGalleryPreview.tsx`.
* **Native horizontal scrollbar**: Added native horizontal scrollbar styled as a thin orange bar (`spiritual-scrollbar`).
* **Mouse drag-to-scroll & Hover Pause**: Enabled mouse drag-to-scroll gestures and touch swipe. Scrolling automatically pauses during mouse hover or active drag.
* **Seamless Bidirectional Wrap**: Wrapped scroll positions dynamically at boundaries (`scrollLeft` resetting to half of the container's duplicated `scrollWidth`) to allow seamless infinite loops when scrolling forward or backward.
* **Click-Drag Separation**: Implemented a drag movement threshold (`5px`) on the gallery marquee so dragging the carousel does not trigger the lightbox detail modal click.

### Lightbox Overlay
* **z-Index Elevation**: Raised the lightbox overlay container and action buttons to `z-[9999]` to ensure visual dominance.
* **Backdrop Click Dismissal**: Added backdrop clicks to close the lightbox modal.
* **Sleek Control Targets**: Styled Close and navigation buttons with enlarged clickable padding for improved mobile accessibility.

### Audio Playback
* **getMediaUrl Hooking**: Resolved the relative `/static/uploads/...` database audio paths using the `getMediaUrl` helper in `PortalHeroPreview.tsx` to ensure correct development server asset loading.
* **YouTube script suspension bypass**: Replaced `className="hidden"` (which suspends iframe script execution in modern browsers) with `className="absolute opacity-0 pointer-events-none"` to keep the hidden YouTube player active, allowing autoplay and loop command passing.

### Marquee Overflow & Empty Wrapper Fixes
* **Infinite Scrolling on Short Lists & High-Precision Auto-slide Ref**: Modified `PortalKeyPersonnelPreview.tsx` and `PortalGalleryPreview.tsx` to automatically repeat small arrays (e.g. lists containing only 1 or 2 items) up to a minimum size (15 items) and duplicate them. This guarantees the list overflows the container width, so it always displays a scrollbar and always auto-slides seamlessly. Stored the animation scroll position inside a React `useRef` floating-point value to prevent browser integer truncation of fractional sub-pixel scroll increments (which caused the auto-sliding ticker to stall on some screens/browsers).
* **Empty Section Spacer Prevention**: Updated the rendering loops in `TemplePublicPortal.tsx` and `PortalWebsitePreview.tsx` to evaluate the content of a section first. If the content evaluates to `null` (e.g., `mantras` which returns `null` or empty `key_personnel`), the wrapping container `div` is not rendered, eliminating empty spacers caused by `space-y-2` layout classes.
* **Compact Footer Style & Redundant Copyright Removal**: Updated `PortalContactPreview.tsx` to evaluate if any contact coordinates or social links are configured. If they are empty, the entire contact block returns `null` to save page space. Removed the redundant copyright notice text from the contact preview footer entirely since the platform's global footer already displays it.

### Follower Preferences Save Failure
* **Import Scope Resolution**: Resolved a `NameError` in the backend follow preferences router `follow.py` where `select` from `sqlalchemy` and the `TempleFollower` model were referenced but never imported. Moved all model imports (`TempleFollower`, `TempleFollowerPreference`) and `select` to the top of the route file to ensure both GET and PUT preference coordinates successfully execute.

### Hero Banner Button Responsiveness
* **Hero Banner Button Responsiveness**: Updated `PortalHeroPreview.tsx` to handle narrower viewport widths. Reduced the horizontal padding and gap values dynamically (`px-3.5 md:px-5`, `gap-2 md:gap-3` for split layout; and `px-4 md:px-8`, `gap-2.5 md:gap-4` for centered layout) and added `whitespace-nowrap shrink-0` to the CTA buttons. This prevents the "Hall Booking" button from wrapping to a second line prematurely on medium or split desktop/tablet displays.

---

## 7. Sprint 7 — Temple Directory and Homepage Fixes

### Database Purge & Updates
* **Test Temples Deleted**: Permanently deleted both `Test Temple Curation` and `System Platform Placeholder` from the database. Cleaned up all database references (including `audit_logs` and `temple_suggestions`).
* **Malottu Sree Bhadrakali Temple**: Deactivated from public directories (`directory_status = 'INACTIVE'`), removed from featured status (`is_featured = false`), and linked to the Kerala/Thiruvananthapuram master location IDs.
* **Location Text Synchronization**: Updated empty `state` and `district` columns in the `temples` and `temple_profiles` tables using their corresponding `state_master` and `district_master` names.

### Backend Approval Logic
* **Default Directory Status**: Modified the `Temple` SQLAlchemy model in `temple_models.py` to default the `directory_status` column to `"INACTIVE"`.
* **Superadmin Approval Flow**: Updated `RegistrationService.approve_temple` in `registration_service.py` to explicitly set `directory_status = "INACTIVE"` upon onboarding approval, preventing automatic publication.

### Devotee & Admin Portals
* **National Temple Directory**: Added a new route `/directory` in the devotee portal routing to `TempleSearchResults.tsx` to display all active/approved temples in a searchable/filterable list. Fixes the Hero banner "Temple Directory" button and breadcrumbs to navigate directly to it.
* **Featured Card Navigation**: Updated devotee portal `TempleCarousel.tsx` to wrap Featured Temple cards in a link block to `/portal` and remove "Claim" and "Visit" buttons.
* **Dynamic Location Labels**: Replaced direct template string concatenations with filtered dynamic joiners across devotee carousels, search results, and admin directory views to display proper locations without formatting anomalies.

---

## 8. Sprint 8 — Store Commerce, Website Builder, and Directory Status Hardening

### Store & Auctions
* **Auction Stock Concurrency**: Modified `/bid` endpoint to prevent double-deducting physical stock on consecutive bids. Re-reserves expired reservation records securely using row-level locking.
* **Low Stock Alerts Exclusion**: Excluded auction products from the frontend manager stock alerts lists and backend dashboard indicators to prevent misleading restock flags.
* **Devotee Bidder Fields & Winner Settlement Defaults**: Auto-resolves claimant username sessions on bids, hides name input for devotees, and defaults the winner name field to the highest bidder on settlement.
* **Typo Cleanup**: Purged duplicate typo product "Scandal" (0 stock) from the store database catalog.

### Website Builder
* **Visual Preview Loop Fix**: Handled empty gallery items gracefully in `PortalGalleryPreview.tsx` to prevent browser unresponsive infinite loops.
* **Settings Card Optimization**: Removed redundant iframe preview frames and expanded the config panel to full-width in the visual settings tab.

### Temple Directory & Claim Verification
* **Directory Status Synchronization**: Hardened settings publication, unpublication, and superadmin approval endpoints to sync the temple's `directory_status` between `"ACTIVE"` and `"INACTIVE"`.
* **Claim Status Badge Resolution**: Updated backend `resolve_claim_status` to return `"CLAIMED"` for `"GOVERNED"` temples so the devotee UI correctly renders verification badges instead of defaulting them back to `"Unclaimed"`.
* **Hall Booking Photos**: Updated image configurations for Sree Bhadra Convention Center Balaramapuram to use the correct local asset paths.

---

## 9. Sprint 9 — Devotee Profile Customization, Security Validation & UI Enhancements

### Devotee Signup Validation
* **Confirm Password field**: Added a "Confirm Password" input field in [Register.tsx](file:///C:/Denumrutham/frontend/src/pages/auth/Register.tsx). Implemented client-side validation to ensure `password === confirmPassword` before initiating sign up.
* **Password Show/Hide Toggle**: Updated [InputField](file:///C:/Denumrutham/frontend/src/components/ui/index.tsx#L57-L91) component to support toggling password visibility when `type="password"`, automatically rendering an interactive Eye/EyeOff toggle icon.

### Nav Navigation & Header Integration
* **Devotee Profile Dropdown & Notifications Bell**: Created a unified [DevoteeHeaderMenu](file:///C:/Denumrutham/frontend/src/components/bookings/DevoteeSettingsModals.tsx#L686-L833) navigation component and integrated it into [DenumruthamShell.tsx](file:///C:/Denumrutham/frontend/src/layouts/DenumruthamShell.tsx#L66-L80) and [MainLayout.tsx](file:///C:/Denumrutham/frontend/src/layouts/MainLayout.tsx#L52-L63).
* Displays a **Bell Icon** (polling platform and followed temple notifications with inline mark-as-read triggers), a styled orange button showing the devotee's name that toggles a dropdown listing **Your Profile** and **Account Settings**, and a **Logout Icon**.
* Elevated the header component container z-index to `relative z-50` and dropdown z-index to `z-[100]`. This forces the header and dropdown menus to render cleanly on top of the sibling scrolling `MantraBar` ticker (`z-40`).
* Added hover-bulge animations and custom tooltips for History, Cart, Bell, and Logout icons (e.g. "Your booking history", "Your Wishlist", "Notifications", "Log Out") by extending [Tooltip.tsx](file:///C:/Denumrutham/frontend/src/components/ui/Tooltip.tsx) to support positioning.

### Profile & Account Settings Modals
* **Global Modal State Store**: Designed a Zustand state store [devoteeModalStore.ts](file:///C:/Denumrutham/frontend/src/store/devoteeModalStore.ts) to manage visibility state (`isProfileOpen`, `isSettingsOpen`) globally.
* **Viewport Centering & Stacking**: Shifted modal mount points out of the sticky header container to the root shell layouts in [DenumruthamShell.tsx](file:///C:/Denumrutham/frontend/src/layouts/DenumruthamShell.tsx) and [MainLayout.tsx](file:///C:/Denumrutham/frontend/src/layouts/MainLayout.tsx). This bypasses the browser's local coordinate system clipping context created by the header's `backdrop-filter` property, guaranteeing that modal windows display perfectly centered relative to the viewport.
* **Modal UX Fixes**: Prevented background scrolling when modals are open (`document.body.style.overflow = 'hidden'`), and structured modal card layouts with static headers, tabs, and action footers, allowing only the form contents to scroll.

### Backend Endpoints & DB Migrations
* Applied database schema migration revision `27e063926090_add_devotee_profile_extended_fields` on the Neon Postgres database to add `date_of_birth`, `hindu_month`, `hindu_star`, `family_members` (JSONB), `favorite_gods` (JSONB), and `favorite_temples` (JSONB) fields to `devotee_profiles`.
* Created `PUT /api/v1/auth/me/credentials` endpoint in [auth.py](file:///C:/Denumrutham/backend/app/modules/auth/routes/auth.py) for secure credentials updates.
* Created `GET /api/v1/devotee/notifications` endpoint in [devotee_bookings.py](file:///C:/Denumrutham/backend/app/modules/bookings/routes/devotee_bookings.py) to fetch relevant notifications.

---

## 10. Sprint 10 — Devotee Profile Persistence, Sync, and Usability Hardening

### Devotee Profile Persistence
* **On-the-Fly Profile Creation**: Hardened the backend profile GET and PUT endpoints in [devotee_booking_service.py](file:///C:/Denumrutham/backend/app/modules/bookings/services/devotee_booking_service.py) to automatically create a devotee profile record in the database if one does not exist for the logged-in user. This avoids 404 errors for legacy or seeded devotees without profile records.
* **Name Synchronization**: Enabled automatic synchronization of the devotee's name from `DevoteeProfile` to the main `User` record in the database when the profile is updated, ensuring identity consistency across auth and profile contexts.

### State Sync & User Experience
* **Live Refresh Hook**: Added a live profile refresh trigger (`useAuthStore.getState().refreshProfile()`) in [DevoteeSettingsModals.tsx](file:///C:/Denumrutham/frontend/src/components/bookings/DevoteeSettingsModals.tsx) after saving both personal profile and account credentials, instantly updating the devotee's name display on the header button dropdown in the UI.
* **Persistent Layout Integration**: Relocated the "Current Password (Required to Save)" input field in the account settings modal to the bottom of the form (outside activeTab conditional blocks). This makes the current password field always visible on both the Configure and Preview tabs, allowing devotees to double-check their changes on the preview tab and submit directly.

---

## 11. Sprint 11 — Hero Banner Booking Disclaimers and Tooltip Optimizations

### Devotee Online Bookings Disclaimer
* **Online Booking Disclaimer**: Wrapped the devotee Hero Banner action buttons ("Book Pooja", "Submit Offering", "Temple Store", and "Hall Booking") in [PortalHeroPreview.tsx](file:///C:/Denumrutham/frontend/src/pages/manager/website/preview/PortalHeroPreview.tsx) inside a descriptive Tooltip stating: `"Online booking for this temple has not started yet. Please follow this temple to receive a notification when online booking sevices become available."`
* **Action Locking**: Replaced the direct button action handlers in the devotee portal layout with `handleDisabledClick` to block modal trigger events, while enabling hover/click disclaimers.

### Tooltip Upgrades & TS Hardening
* **Long Tooltip Formatting**: Enhanced the [Tooltip.tsx](file:///C:/Denumrutham/frontend/src/components/ui/Tooltip.tsx) component to dynamically detect long descriptions (length > 40). Long messages wrap beautifully at `w-72` and display with a clean, readable normal-case font weight and relaxed line-height. Keeps micro-uppercase styling intact for standard short icons/labels. Added toggle-on-click listeners for touch device compatibility.
* **Strict Compilation Compliance**: Resolved strict TS compilation warnings (`TS6133`) under Vite production builds regarding unused parameters and variables.

---

## 12. Sprint 12 — API Governance, Swagger Alignment & Least-Privilege Security

### Security & RBAC Standardizations
* **Settlements Router Permission**: Guarded `/temple/settlements/history` and `/temple/settlements/dashboard` routes using `Depends(require_permission("finance", "view"))` (replacing the legacy `"website"` permission key).
* **Bank Account Controls**: Guarded POST `/temple/bank-account` with `Depends(require_permission("finance", "write"))` and GET `/temple/bank-accounts` with `Depends(require_permission("finance", "view"))`.
* **Manual Transactions Guard**: Applied `Depends(require_permission("finance", "write"))` to POST `/transactions` and `Depends(require_permission("finance", "view"))` to GET `/transactions`.

### Enterprise Master Ledger SOT Unification
* **Archana Booking Write Path**: Refactored `archana_service.py` to write booking ledger entries directly to the master `transactions` table via `TransactionService.create_transaction`.
* **Revenue Metrics Aggregation**: Updated `AccountingService.get_financial_kpis` to aggregate dashboard revenue KPIs from the master `transactions` table instead of the deprecated `financial_ledger` table.

### Standardized Response Schemas (Pydantic Serialization)
* Defined strict Pydantic serialization models and envelope schemas in `finance_routes.py` for:
  - `PlatformFinancialAccountResponse`
  - `BankAccountResponse` (with masked account number)
  - `BankAccountPendingResponse` (with masked account number by default)
  - `BankAccountRevealResponse` (containing decrypted/unmasked account number for audited reveals)
  - `SettlementBatchResponse`
  - `SettlementBatchApprovalResponse`
  - `SettlementBatchCompleteResponse`
  - `SettlementBatchGenerationResult`
* Configured router decorator responses (e.g. `responses={200: {"model": BankAccountListEnvelope}}`) to ensure explicit contract visibility in Swagger documentation.

### Swagger Tag Reorganization
* Updated all FastAPI router registrations in `app/api/api_v1/api.py` to organize all platform endpoints under the standardized 19 workflow tag divisions:
  - `Authentication`, `Dashboard`, `Temple Profile`, `Finance`, `Bookings`, `Poojas`, `Inventory`, `Hall Booking`, `Website Builder`, `Advertisements`, `Notifications`, `Reports`, `Settings`, `Temple Governance`, `Platform Governance`, `Discovery`, `Analytics`, `Audit`, `System`.

### Least-Privilege Security Reveal & Audit hooks
* **Masked by Default**: `GET /admin/bank-accounts/pending` now masks the bank account numbers by default for Super Admins.
* **Audited Reveal Endpoint**: Created `POST /admin/bank-accounts/{id}/reveal` allowing Super Admins to reveal the full account number on-demand.
* **Audit Trail Hook**: Decryption of bank details triggers `BANK_ACCOUNT_REVEALED` event of `HIGH` severity (risk score: 50) logged to the `ImmutableActivityLog` chain.

### Frontend Service Layer Consolidation
* Created **`financeService.ts`** under `frontend/src/services/` to encapsulate all Axios endpoints for bank accounts, platform accounts, and settlement batches.
* Refactored **`FinanceModule.tsx`** and **`FinanceGovernance.tsx`** to consume `financeService` instead of direct Axios calls.
* **Inline Reveal Button**: Added a "Reveal" button next to bank accounts on the Super Admin verification list (`FinanceGovernance.tsx`) to show the full account number inline when clicked.
* Connected mock **`AdminApprovals.tsx`** view to active backend endpoints `/admin/onboarding/temple-requests`, `/admin/onboarding/approve-temple/{id}`, and `/admin/onboarding/reject-temple/{id}`.



