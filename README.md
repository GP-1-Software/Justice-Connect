# Justice-Connect

<div align="center">

![Justice-Connect](https://img.shields.io/badge/Justice--Connect-v1.0.0-blue)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991?logo=openai)

**A comprehensive legal management platform connecting clients, lawyers, court clerks, and administrators in the Palestinian legal system.**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [Documentation](#-documentation) • [License](#-license)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Documentation](#-documentation)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [License](#-license)

---

## 🌟 Overview

The rapid advancement of digital technologies has highlighted the need for more efficient, transparent, and accessible legal service platforms, as traditional judicial procedures still rely heavily on manual paperwork, fragmented communication, and limited system integration. This project presents **Justice Connect**, an integrated digital legal management platform designed to connect clients, lawyers, court clerks, and administrators within a unified and secure environment.

The system provides comprehensive electronic legal service management, including case creation and tracking, electronic filing, structured case progress monitoring, hearing scheduling, appointment booking between clients and lawyers, document handling, and payment and invoice management. The platform supports full case lifecycle operations, from initial client request and lawyer assignment to court clerk review, official case registration, session management, decision recording, fee processing, and appeal procedures. Case tracking follows predefined litigation and appeal stages to ensure procedural clarity and alignment with real judicial workflows, reflecting procedures consistent with the formal judicial processes applied in Palestinian courts.

Justice Connect implements role-based access control, secure authentication, real-time notifications, and Arabic-first user interfaces with RTL support. The system is accessible through a responsive web application and a hybrid mobile solution, enabling users to interact with legal services across devices.

The platform also integrates artificial intelligence through **Justice AI** for legal guidance based on Palestinian law and **System AI** for administrative analytics using Retrieval-Augmented Generation (RAG).

---

## ✨ Features

### For Clients (المستخدمين)
- ✅ Register and create account
- 🔍 Search and browse verified lawyers
- 📅 Book appointments with lawyers
- 💬 Chat with lawyers
- 🤖 Access Justice AI for legal questions
- 📄 Upload and analyze legal documents
- 📊 Track case status
- 🎫 Submit support tickets

### For Lawyers (المحامين)
- ✅ Professional profile management
- 📋 Manage client appointments
- 💼 Case management system
- 📄 Document handling
- 💰 Invoice and payment tracking
- 🤖 Access Justice AI for legal research
- 📊 Performance analytics
- 🔔 Real-time notifications

### For Court Clerks (موظفي قلم المحكمة)
- 📋 Manage court cases
- 📝 Log court actions
- 🔔 Send notifications to parties
- 📊 View case statistics
- 📄 Document management
- ⚖️ Update case statuses

### For Administrators (المسؤولين)
- 👥 User verification and management
- ⚖️ Lawyer approval system
- 🏛️ Court management
- 📊 System-wide analytics
- 🎫 Support ticket handling
- 🗑️ Account deletion requests
- 🤖 System AI with database insights
- 👨‍⚖️ Court clerk assignment

---

## 📚 Documentation

Detailed documentation is available for each module:

- **[Admin Module](Admin_README.md)** - Complete admin panel documentation
- **[Justice AI System](JusticeAI_README.md)** - AI assistant technical details
- **[Lawyer & Client Modules](Lawyer_Client_README.md)** - User-facing features
- **[Court Clerk Module](CourtClerkModule.md)** - Court clerk functionality
- **[System AI](SYSTEM_AI_README.md)** - Admin AI with database insights
- **[Mobile Support](MOBILE_SUPPORT_REPORT.md)** - Mobile compatibility
- **[Mobile Auth Fix](MOBILE_AUTH_FIX_REPORT.md)** - Authentication fixes

---

## 🛠 Tech Stack

### Frontend
- **React 18.2** - UI library
- **React Router DOM 7.9** - Client-side routing
- **Vite 7.2** - Build tool and dev server
- **Tailwind CSS 3.3** - Utility-first CSS framework
- **Framer Motion 12.23** - Animation library
- **Recharts 3.5** - Data visualization
- **Lucide React** - Icon library
- **React Markdown** - Markdown rendering
- **i18next** - Internationalization

### Backend
- **Node.js 18+** - Runtime environment
- **Express.js** - Web framework
- **Supabase** - PostgreSQL database and authentication
- **OpenAI GPT-4o** - AI-powered legal assistant
- **SerpAPI** - Google search integration
- **Cheerio** - Web scraping
- **JWT** - Authentication tokens
- **Nodemailer** - Email notifications

### Development Tools
- **Vitest** - Testing framework
- **Testing Library** - Component testing
- **ESLint** - Code linting
- **PostCSS** - CSS processing

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React + Vite)                 │
├─────────────────────────────────────────────────────────────┤
│  Client Portal  │  Lawyer Portal  │  Court Clerk  │  Admin  │
│  /client/*      │  /lawyer/*      │  /clerk/*     │ /admin/*│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND API (Express.js)                  │
├─────────────────────────────────────────────────────────────┤
│  Auth  │  Cases  │  Appointments  │  Justice AI  │  Admin   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE (Supabase/PostgreSQL)             │
├─────────────────────────────────────────────────────────────┤
│  Users │ Lawyers │ Cases │ Appointments │ Court Clerks      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                        │
├─────────────────────────────────────────────────────────────┤
│  OpenAI GPT-4o  │  SerpAPI  │  Email Service  │  Storage   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Installation

### Prerequisites
- **Node.js** 18 or higher
- **npm** or **yarn**
- **Supabase** account
- **OpenAI API** key
- **SerpAPI** key (for legal search)

### Step 1: Clone Repository
```bash
git clone https://github.com/yourusername/justice-connect.git
cd justice-connect
```

### Step 2: Install Frontend Dependencies
```bash
npm install
npm install recharts
npm install vite --save-dev
```

### Step 3: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 4: Environment Configuration

Create `.env` file in the `backend` directory:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# SerpAPI Configuration (for legal search)
SERP_API_KEY=your_serp_api_key

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_ENABLED=1

# Feature Flags
SIGNUP_NOTIFICATION_ENABLED=1

# Server Configuration
PORT=5000
NODE_ENV=development
```

Create `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Step 5: Database Setup

1. Create a Supabase project
2. Run the SQL schemas located in `server/supabase/Schema_for_Tables/Schemas`
3. Set up Row Level Security (RLS) policies
4. Configure authentication settings

### Step 6: Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm start
# or for development
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

The application will be available at:
- **Frontend:** `http://localhost:5173`
- **Backend:** `http://localhost:5000`

---

## ⚙️ Configuration

### Database Schema
All database schemas are located in:
```
server/supabase/Schema_for_Tables/Schemas/
```

Key tables include:
- `users` - Client accounts
- `lawyers` - Lawyer profiles
- `admins` - Administrator accounts
- `court_clerks` - Court clerk assignments
- `cases` - Legal cases
- `appointments` - Lawyer-client meetings
- `invoices` - Billing records
- `payments` - Payment transactions
- `support_tickets` - User support requests
- `notifications` - System notifications

### Feature Flags

Control features via environment variables:

| Flag | Description | Default |
|------|-------------|---------|
| `EMAIL_ENABLED` | Enable/disable email notifications | `1` |
| `SIGNUP_NOTIFICATION_ENABLED` | Notify admins on new signups | `1` |

---

## 🚀 Usage

### Running Tests
```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

# Run unit tests only
npm run test:unit
```

### Building for Production
```bash
# Build frontend
npm run build

# Preview production build
npm run preview
```

### Development Workflow
1. Make changes to code
2. Run tests to ensure nothing breaks
3. Test locally with `npm run dev`
4. Build for production with `npm run build`
5. Deploy to your hosting platform

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 📞 Support

For support, contact: 
- **ali.odeh.pss@gmail.com**
- **aadamadamm343@gmail.com**

---

<div align="center">

[⬆ Back to Top](#justice-connect)

</div>
