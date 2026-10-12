# icagria — Frontend Client

The frontend for **icagria**, a full-stack MERN web application built for smallholder tuber and legume farmers in Indonesia. It connects farmers with precision soil pH monitoring, localized weather and agricultural advisory tips, an input supply shop, and a direct harvest marketplace linking farmers and buyers.

---

## 1. Overview & Tech Stack

- **Framework**: React 19 (JavaScript JSX, zero TypeScript)
- **Bundler & Tooling**: Vite with `@tailwindcss/vite`
- **Styling**: Tailwind CSS v4, custom editorial typography (`Newsreader` / `Source Serif 4` serif headings and `Inter` sans body), white & green palette (`#2D5A27` brand green)
- **Routing**: `react-router-dom` v7 with role-based routing guards (`farmer`, `buyer`, `admin`)
- **Data Visualization**: `recharts` for soil pH historical charts and admin resource distribution charts (with accessible data table alternatives)
- **Icons**: `lucide-react`
- **HTTP Client**: Axios with automatic JWT bearer token handling and unified error normalization

---

## 2. Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- Running **icagria** backend server (by default on `http://localhost:5000`)

### Installation & Environment Configuration

1. Navigate to the `client/` directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup environment variables:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Verify that `VITE_API_URL` points to your backend API endpoint:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

### Running the App

- **Development server**:
  ```bash
  npm run dev
  ```
  Runs Vite dev server on `http://localhost:5173`.

- **Production build**:
  ```bash
  npm run build
  ```
  Generates production-optimized assets in `dist/`.

- **Preview production build**:
  ```bash
  npm run preview
  ```

---

## 3. Demo Accounts & Role Permissions

The backend provides three core user roles. When seeded via `npm run seed` in the `server` directory, default credentials correspond to the server configuration:

| Role | Default Email | Seed Password | Access & Responsibilities |
| :--- | :--- | :--- | :--- |
| **Farmer** | `farmer@icagria.test` | Value configured in server seed (`DEMO_PASSWORD`) | Manage farms, plantings, soil sensors & readings, browse weather & pest advice, purchase inputs, book agronomist consultations, list produce for sale. |
| **Buyer** | `buyer@icagria.test` | Value configured in server seed (`DEMO_PASSWORD`) | Browse harvest marketplace, inquire on produce batches, track inquiry statuses, view farmer contacts upon acceptance. |
| **Admin** | Configured in server environment (`ADMIN_EMAIL`) | Value configured in server seed (`ADMIN_PASSWORD`) | Platform-wide metrics and bar chart overview, user account administration, product catalog management, marketplace listing moderation, booking status fulfillment. |

> **Security Note**: Never commit actual environment passwords or `.env` secrets into version control.

---

## 4. Application Routes & Navigation Map

### Public Routes
- `/` — Landing page (editorial hero, features, workflow steps, crop guide preview, testimonial/mission statement)
- `/login` — Account sign-in
- `/register` — Smallholder farmer or buyer registration with validation

### Farmer Routes (`/app/*`, restricted to `farmer`)
- `/app/dashboard` — Farmer home dashboard (pH health card, 7-day trend chart, current weather & agronomy tips, upcoming harvest schedules, unread alerts)
- `/app/farms` — Farm plots management, GPS coordinates, main crop assignment
- `/app/crops` — Reference guide for tuber and legume varieties, growth cycle stages, and optimal pH tolerances
- `/app/soil-ph` — Real-time telemetry hub, status evaluation (Suitable, Too Acidic, Too Alkaline), historical filter (7, 30, 90 days), Recharts visual timeline
- `/app/weather` — 5-day agro-meteorological forecast, rain alerts, localized farming recommendations
- `/app/alerts` — Real-time sensor threshold warnings and notifications
- `/app/shop` — Supply catalog (seeds, fertilizers, equipment), input orders with quantity stepper and estimated total, agronomist consultation booking, order history with stock-restoration cancellations
- `/app/pest-tips` — Farm-specific biological pest identification and organic remedy tips
- `/app/reports` — Monthly agronomy performance summaries and printable soil health log
- `/app/marketplace` — Farmer sales view (create listing, view incoming inquiries from buyers, accept/reject inquiries, mark produce sold)
- `/app/profile` — Farmer personal profile and contact details

### Buyer Routes (`/app/*`, restricted to `buyer`)
- `/app/marketplace` — Produce marketplace catalog, search, crop filtering, price sorting, inquiry submission modal
- `/app/inquiries` — Buyer inquiry tracking (pending, accepted with revealed farmer phone contact, rejected)
- `/app/profile` — Buyer personal account settings

### Admin Routes (`/admin/*`, restricted to `admin`)
- `/admin` — System overview dashboard with StatCards across all platform entities, Recharts resource volume bar chart (with screen-reader table), and recent user/listing/product feeds
- `/admin/users` — User management directory, role filtering (`farmer`, `buyer`, `admin`), search by name/email, activity footprint inspection, role/details update, and cascade deletion confirmation
- `/admin/products` — Input catalog management, inventory table with low-stock warning indicators (`<= 5` units), add/edit modal, delete confirmation
- `/admin/listings` — Marketplace listing moderation, status tabs (`available`, `reserved`, `sold`), search, cascade delete confirmation
- `/admin/bookings` — Orders & consultations management, filter by type/status, state transitions (`pending` -> `confirmed` -> `delivered`, or `cancelled` restoring stock)
- `/admin/profile` — Admin personal profile settings

---

## 5. Architecture & Project Structure

```
client/
├── public/                 # Static public assets
├── src/
│   ├── api/                # HTTP API client modules matching server/docs/API.md
│   │   ├── admin.js        # Platform stats, admin user detail, update & delete
│   │   ├── alerts.js       # Sensor threshold warnings
│   │   ├── auth.js         # Authentication, login, register, profile
│   │   ├── bookings.js     # Input orders & agronomist consultations
│   │   ├── client.js       # Central Axios client instance with interceptors
│   │   ├── crops.js        # Crop botanical guide
│   │   ├── devices.js      # IoT soil sensor management
│   │   ├── farms.js        # Farming sites & GPS boundaries
│   │   ├── inquiries.js    # Buyer-seller marketplace inquiries
│   │   ├── listings.js     # Produce marketplace listings
│   │   ├── pestTips.js     # Biological pest identification & remedies
│   │   ├── plantings.js    # Crop planting cycles
│   │   ├── products.js     # Supply store catalog & inventory
│   │   ├── readings.js     # Soil pH telemetry readings
│   │   ├── reports.js      # Agronomic summary reports
│   │   ├── users.js        # Admin users directory
│   │   └── weather.js      # Weather forecasts & agricultural tips
│   ├── components/
│   │   ├── charts/         # Recharts wrappers (PhLineChart, custom reference bands)
│   │   ├── layout/         # AppShell, TopNav (with notification badge), Footer
│   │   └── ui/             # Accessible design system components (Button, Modal, StatCard, etc.)
│   ├── context/            # React context providers (AuthContext, ToastContext, FarmContext, AlertsContext)
│   ├── pages/              # Routed pages (public, auth, farmer, buyer, admin)
│   ├── router/             # ProtectedRoute and RoleRoute route guards
│   ├── utils/              # Formatting helpers (formatCurrency, formatDate, formatDateTime, pH status)
│   ├── App.jsx             # Root application router and provider tree
│   ├── index.css           # Tailwind CSS directives, font imports, print stylesheets
│   └── main.jsx            # Application entry point
├── package.json
└── vite.config.js
```

---

## 6. Accessibility & Design Compliance

- **No color alone**: All badges, indicators, and statuses pair color with semantic icons (`lucide-react`) and explicit textual labels (e.g. `Low stock (3)`, `Suitable`, `Pending`).
- **Accessible form controls**: Inputs include explicit `<label>` tags via `htmlFor`, accessible `aria-invalid` and `aria-describedby` error announcements with `role="alert"`, and autofocus on validation failure.
- **Charts accessibility**: All Recharts visual graphs provide hidden semantic `<table>` elements with descriptive captions for screen readers.
- **Desktop/Laptop Optimization**: Designed with high-density editorial aesthetics conforming to `DESIGN.md` (minimum width 1024px, centered in `max-w-7xl mx-auto px-6`).
