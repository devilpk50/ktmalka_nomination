# Leo Club Nomination Portal

A web-based nomination management system for the Leo Club of Kathmandu Alka for L.Y. 2025/26. The project digitizes the nomination workflow by combining a public multi-step nomination form with a private admin dashboard for managing submissions, members, settings, documents, and reports.

## Overview

This portal was created to make the club nomination process easier, faster, and more organized for both applicants and the nomination committee. Members can search the directory, verify their Leo ID, review eligibility notices, submit nomination details, upload required documents, and provide payment information through a guided form.

Administrators can manage the nomination cycle from a dashboard, including form deadlines, tenure settings, member records, submission status, and exports.

## Key Features

- Multi-step public nomination form
- Notice and eligibility criteria popup
- Member directory search and Leo ID verification
- Duplicate nomination prevention for the active tenure
- Document uploads for photos, signatures, receipts, citizenship, and cover letters
- eSewa payment QR and transaction code collection
- Admin login dashboard
- Submission overview with application counts
- Submission filtering and status management
- Excel and PDF report export options
- Member database management with CSV upload support
- Configurable nomination deadline and tenure
- Vercel Postgres integration for nominations, members, and settings
- Vercel Blob integration for uploaded documents

## Tech Stack

- HTML
- CSS
- JavaScript
- Vercel Serverless Functions
- Vercel Postgres
- Vercel Blob
- XLSX export library
- EmailJS browser SDK

## Project Structure

```text
.
|-- nomination_form.html    # Public nomination form
|-- script.js               # Public form logic
|-- styles.css              # Public form styles
|-- admin.html              # Admin dashboard
|-- admin.js                # Admin dashboard logic
|-- admin.css               # Admin dashboard styles
|-- data.js                 # Default member data
|-- api/
|   |-- nominations.js      # Nomination CRUD and duplicate checks
|   |-- members.js          # Member database API
|   |-- settings.js         # Deadline and tenure settings API
|   |-- setup.js            # Database table initialization
|   `-- upload.js           # Vercel Blob upload handler
|-- vercel.json             # Vercel routing and security headers
`-- package.json
```

## Getting Started

Install dependencies:

```bash
npm install
```

For deployment, configure the required Vercel environment variables for Postgres, Blob storage, admin credentials, and setup protection.

Recommended environment variables:

```text
ADMIN_USER=
ADMIN_PASS=
SETUP_SECRET=
POSTGRES_URL=
BLOB_READ_WRITE_TOKEN=
```

After deployment, initialize the database by visiting:

```text
/api/setup?key=YOUR_SETUP_SECRET
```

## Pages

- Public form: `/nomination_form.html`
- Admin dashboard: `/admin`

## Notes

Do not commit `.env` files or production secrets to GitHub. Before using this in production, make sure admin credentials and setup keys are stored securely as environment variables.

## Purpose

This project supports the Leo Club of Kathmandu Alka by replacing manual nomination collection with a centralized digital workflow that is easier for applicants to complete and easier for administrators to review.
