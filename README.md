# VAT Approval Form (VAT Analysis)

Internal product and service approval workflow for Shannon Health VAT (Value Analysis Team) requests. Replaces the previous Microsoft Forms + Excel process with a multi-step public submission form and an administrative review workspace.

**Tech stack:** Next.js 15 (App Router) · TypeScript · Prisma · SQLite · Tailwind CSS · shadcn-style UI · Zustand · Zod

## Features

### Public Form (No Login Required)

Requestors submit product and service approval requests through a five-step form.

| Step | Section | Description |
|---|---|---|
| 1 | Requestor & Item Information | Request type, requestor information, department, required Oracle department number, product, vendor, catalog number, representative, and product type |
| 2 | Product Classification | Reusable/disposable classification, minor equipment, capital information, and mandatory quote upload |
| 3 | Product Request Details | Presenters, team leads, purpose, procedures, usage, impacted departments/providers, reasons for the request, current procedures, and clinical metrics |
| 4 | Specific Product & Usage | Governing body, multi-department usage, monthly usage, and special handling requirements |
| 5 | Financial Information | Monthly cost impact, optional cost amount/range, required old/new monthly usage, required replacement-item information, expected ROI, and optional payor-mix attachments |

Additional capabilities:

- No requestor account or login required.
- Form state persists when navigating backward and forward using Zustand and localStorage.
- Zod validation enforces required fields and rejects incomplete placeholder answers such as `N/A` and `TBD`.
- Quote uploads are mandatory before submission.
- Payor-mix attachments are optional.
- Uploaded files are stored under `public/files/<submissionId>/`, with file paths recorded in the database.

### Admin Workspace (Login Required)

Administrators can review submissions, update request information, manage statuses, and maintain post-approval details.

#### Submission Dashboard

- View submitted requests and submission dates without displaying the time.
- See attachment counts and status badges.
- Change status from the submission list or detail page.
- Archive and unarchive submissions, with confirmation before archiving.
- Open individual submissions for detailed review.

Supported statuses:

- **New**
- **Reviewing**
- **Approved**
- **Not approved**

#### Submission Review Tabs

| Tab | Purpose |
|---|---|
| Summary | Request snapshot, clinical justification, request number, assignee, and supply-chain metadata |
| Request Details | Complete requestor-submitted answers, editable by administrators |
| Material Review | Section B — current-versus-proposed product comparison, pricing, volume, cost savings, and materials management actions |
| VAT Review | Section C — committee decisions, trial coordinators, and education coordinators |
| Evaluation | Section D — trial results and evaluation findings |
| Inventory Setup | Section E — post-approval inventory and Lawson/Oracle-style inventory fields |
| Files | Downloadable quotes, payor-mix attachments, and additional administrator-uploaded documents |

Review capabilities:

- Proposed product fields are prefilled from the original submission where applicable.
- Administrators can edit request details.
- The **Save review** action validates required fields before saving.
- Required-field validation is enforced in both the client and API.
- Additional supporting documents can be uploaded and assigned custom document names.

Supported additional document formats: PDF, Word, and Excel. Maximum additional document size: 25 MB.

#### Product Request Presentation

A compact, high-contrast document view is available for meetings and projector displays.

- Designed for reviewing requests in committee meetings.
- Supports fullscreen presentation.
- Provides recommendation options: **Approve**, **Trial**, **Table**, and **Deny**.

#### Excel Export

Administrators can export a submission as a multi-sheet Excel workbook containing:

1. Request Details
2. Material Review
3. VAT Review
4. Evaluation
5. Inventory
6. Files

Excel export runs client-side using `xlsx`. The exported workbook supports meetings, offline review, and record sharing. The application remains the system of record.

## Getting Started

### Prerequisites

- Node.js and npm
- A compatible environment for Next.js 15
- SQLite support through Prisma

### Local Development

```bash
cd vat-analysis
cp .env.example .env
npm install
npx prisma db push
npm run dev
```

Open the application at:

- **Application:** http://localhost:3000
- **Public form:** http://localhost:3000/form
- **Admin login:** http://localhost:3000/admin/login

### Environment Variables

Configure the following variables in `.env`:

```dotenv
DATABASE_URL="file:./dev.db"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin123"

# Enable only when the application is served over HTTPS.
# COOKIE_SECURE=true
```

The default credentials above are for local development only. Use a strong, unique administrator password in production.

`DATABASE_URL` is interpreted relative to the Prisma schema location. Verify the configured path before running database commands or deploying.

## Production Deployment

### Deployment Environment

| Setting | Value |
|---|---|
| Server | `vsauto3` |
| Application directory | `/home/suraj/projects/vat-analysis` |
| PM2 process name | `vat-analysis` |
| Port | `3010` |
| Production database | `prisma/vat_prod.db` |
| Database URL | `file:./vat_prod.db` |
| Application URL | http://172.16.11.138:3010 |
| Deployment workflow | `.github/workflows/deployment.yml` |
| Deployment trigger | Push to `main` |
| Runner | Self-hosted GitHub Actions runner |

### GitHub Actions Secrets

Configure the following secrets in the GitHub repository's **Production environment**:

| Secret | Requirement |
|---|---|
| `ADMIN_PASSWORD` | Required |
| `ADMIN_USERNAME` | Optional; defaults to the configured application value if not supplied |

Production credentials must be managed through GitHub Environment secrets rather than committed to source control.

### PM2 Configuration

The central PM2 ecosystem configuration uses the following settings:

```javascript
{
  name: "vat-analysis",
  cwd: "/home/suraj/projects/vat-analysis",
  script: "npm",
  args: "start",
  env: {
    NODE_ENV: "production",
    PORT: 3010
  }
}
```

If the application needs to bind explicitly to all network interfaces, configure the package script as follows:

```json
{
  "scripts": {
    "start": "next start -p 3010 -H 0.0.0.0"
  }
}
```

Apply this change only if needed by the deployment environment.

### Production Environment Considerations

- **Session cookies:** Set `COOKIE_SECURE=true` only when serving over HTTPS. Leave it unset for the current HTTP-only internal network deployment.
- **Firewall:** TCP port `3010` must be open on the server for access from the organizational network.
- **Persistent data:** The production SQLite database and `public/files` directory must be preserved during deployments.
- **Deployment exclusions:** The deployment process excludes the production database and uploaded files from `rsync --delete` cleanup.
- **Schema changes:** Apply Prisma schema updates deliberately in the target environment before relying on the updated application.
- **Backups:** Back up the production database and uploaded attachments before database migrations or deployment changes.

### Deploying Schema or Application Changes

After modifying `prisma/schema.prisma`, synchronize the database schema in the appropriate environment:

```bash
npx prisma db push
```

When application code also changes, build the application:

```bash
npm run build
```

Restart the production process when deployment is complete:

```bash
pm2 restart vat-analysis --update-env
```

Run production database commands from the correct application directory and verify that `DATABASE_URL` points to the production database before executing them. Never run local development configuration against production data unintentionally.

## Project Structure

```text
src/
├── app/
│   ├── (public)/
│   │   └── form/                    # Public multi-step form and success page
│   ├── (auth)/
│   │   └── admin/login/              # Administrator login
│   ├── (present)/
│   │   └── admin/submissions/[id]/
│   │       └── present/              # Product Request meeting view
│   ├── admin/                        # Submission list and detail workspace
│   └── api/
│       ├── form/submit/              # Public submission POST and uploads
│       └── admin/                    # Login, logout, updates, and file uploads
├── components/
│   ├── form/
│   │   └── FormWizard.tsx            # Main five-step form
│   ├── admin/
│   │   ├── SubmissionDetailClient.tsx
│   │   ├── ProductRequestPresent.tsx
│   │   ├── StatusActions.tsx
│   │   └── LogoutButton.tsx
│   └── ui/                           # shadcn-style UI primitives
├── lib/
│   ├── prisma.ts                     # Prisma client
│   ├── auth.ts                       # Authentication helpers
│   ├── form-store.ts                 # Zustand persistence
│   ├── export-submission.ts          # Excel workbook export
│   └── validations/
│       └── form.ts                   # Zod form schemas
└── prisma/
    └── schema.prisma                 # Database schema
```

## File Uploads and Validation

### Public Request Attachments

- Quote uploads are required for submission.
- Up to four quote files are allowed, with a maximum size of 100 MB per file.
- Payor-mix attachments are optional.
- Files are stored under `public/files/<submissionId>/`.
- Attachment paths and related metadata are persisted in the database.

### Additional Admin Attachments

- Administrators can upload supporting documents from the Files tab.
- Supported formats include PDF, DOCX, and XLSX.
- Maximum file size is 25 MB per additional document.
- Each document can be assigned a custom display name.

### Validation Rules

- Required fields must be completed before the applicable form or review can be saved.
- Placeholder answers such as `N/A` and `TBD` are rejected where validation applies.
- The Oracle department number is required.
- Old and new monthly usage information is required.
- Replacement-item information is required.
- The quote upload is mandatory for public submission.
- Server-side validation must remain enabled even when client-side validation is present.

## Application Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build the production application |
| `npm run start` | Start the production server |
| `npx prisma db push` | Synchronize the Prisma schema with SQLite |
| `npx prisma studio` | Open the optional Prisma database interface |

## Design and Accessibility

The interface uses a Shannon-inspired medical green primary color with dark body text and strong contrast.

Design priorities include:

- Clear, readable form labels and review information.
- High-contrast status indicators and actions.
- Consistent navigation between multi-step form sections.
- A compact presentation view suitable for committee meetings and projectors.
- An administrative workflow that supports detailed review without relying on spreadsheets as the primary record.

## Not in Scope Yet

The following features are intentionally deferred until after feedback from real users:

- Send-back and requestor revision workflow with email notifications and secure edit links.
- Requestor accounts and login.
- Multiple administrator roles.
- Single sign-on (SSO).

## Operational Notes

- Collect feedback from live users before expanding the revision and notification workflow.
- Keep the application database as the authoritative system of record.
- Use Excel exports for committee meetings and offline copies, not as the primary approval database.
- Preserve the production database and uploaded files during every deployment.
- Back up both the database and attachments as part of the operational recovery plan.
- Keep production credentials out of source control and rotate default development credentials before any production use.

## License and Internal Use

This application is intended for internal Shannon Health VAT operations. Follow organizational requirements for access control, information security, and retention of product approval records.