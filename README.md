# ComplianceHub — AML/KYC/CDD Portal

A professional, React-based financial compliance portal for managing Anti-Money Laundering (AML), Know Your Customer (KYC), and Customer Due Diligence (CDD) workflows.

## Features

- **Dashboard** — Overview with key compliance metrics (Total Customers, Pending KYC, High Risk Alerts, Cases Under Review) and a recent activity feed with risk level indicators
- **KYC (Know Your Customer)** — Customer search and list, identity verification status, and document tracking (Passport, Utility Bill, Bank Statement)
- **AML (Anti-Money Laundering)** — Transaction monitoring table with flagged transactions, risk scores, flag reasons, and alert statuses (Open / Under Review / Resolved)
- **CDD (Customer Due Diligence)** — Case management with PEP screening, sanctions checks, adverse media, source of funds verification, assigned analyst, and case notes

## Tech Stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/) (via `@tailwindcss/vite`)
- [React Router v6](https://reactrouter.com/)

## Prerequisites

- **Node.js >= 18**
- npm >= 9

## Installation & Development

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build for Production

```bash
npm run build
```

The production build will be output to the `dist/` directory.

## Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   └── Sidebar.jsx       # Navigation sidebar
├── pages/
│   ├── Dashboard.jsx     # Overview & stats
│   ├── KYC.jsx           # Know Your Customer
│   ├── AML.jsx           # Anti-Money Laundering
│   └── CDD.jsx           # Customer Due Diligence
├── App.jsx               # Root component & routing
├── main.jsx              # Entry point
└── index.css             # Tailwind CSS entry
```

> All data in this application is mock/static — no backend is required.
