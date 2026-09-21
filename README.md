# VAT Approval Form

Multi-step VAT product approval submission system built with Next.js, Prisma (SQLite), and shadcn/ui-style components.

## Features

- **5-step public form** (no login required)
  - Requestor & Item Information (12 fields)
  - Product Classification + mandatory quote upload
  - Operational Justification
  - Specific Product & Usage
  - Financial Information + optional payor mix files
- Form state persists when navigating back/forward (Zustand + localStorage)
- File uploads stored under `public/files/<submissionId>/` with paths in DB
- Simple admin login (credentials in `.env`)
- Admin dashboard: list submissions, change status (NEW / REVIEWING / APPROVED / NOT_APPROVED), archive/unarchive
- Detail view of every answer + downloadable attachments

## Getting Started

```bash
cd vat-approval-form
cp .env.example .env   # or use existing .env
npm install
npx prisma db push
npm run dev
```

Open http://localhost:3000

### Admin

- URL: http://localhost:3000/admin/login
- Default credentials (from `.env`):
  - Username: `admin`
  - Password: `admin123`

## Project Structure

```
src/
├── app/
│   ├── (public)/form/          # multi-step form + success
│   ├── admin/                  # protected dashboard + detail
│   └── api/                    # form submit, admin auth & status
├── components/
│   ├── form/FormWizard.tsx     # main multi-step form
│   ├── admin/                  # status actions, logout
│   └── ui/                     # shadcn-style primitives
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   ├── form-store.ts           # zustand persistence
│   └── validations/form.ts     # zod schemas per step
└── prisma/schema.prisma
```

## Environment

```
DATABASE_URL="file:./dev.db"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin123"
```

## Notes

- Quote upload is mandatory (max 4 files, 100MB each).
- Incomplete answers like "N/A" / "TBD" are rejected by validation.
- Uploaded files are served from `/files/...` (public folder).

## Admin Review Sections (Excel-inspired)

When an admin opens a submission they see tabbed sections:

| Tab | Purpose |
|-----|---------|
| **Summary** | Snapshot + clinical justification + supply-chain meta (request #, assignee) |
| **Request Details** | Full form answers from the requestor |
| **Material Review** | Section B – Current vs Proposed side-by-side comparison, pricing, volume, cost savings, MM action |
| **VAT Review** | Section C – Committee action, trial/education coordinators |
| **Evaluation** | Section D – Trial results |
| **Inventory Setup** | Section E – Lawson / inventory fields after approval |
| **Files** | Downloadable quotes & payor-mix attachments |

All review fields are editable and saved with the **Save review** button. Proposed product fields are pre-filled from the original submission.
