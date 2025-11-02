# Justice-Connect

A comprehensive legal services platform that connects clients with verified lawyers, facilitating legal consultations, case management, and AI-powered legal assistance.

## 🌟 Features

### Core Features
- **Smart Lawyer Search**: Find the right lawyer based on specialization, location, years of experience, and ratings
- **Appointment Booking**: Book in-person or online consultations with ease
- **Secure Communication**: Encrypted conversations, voice/video calls, and secure file sharing with your lawyer
- **Case Management**: Complete case tracking with event timelines and document management
- **Secure Payments**: Safe electronic payments for consultations and services with invoice tracking
- **Verified Lawyers**: All lawyers are verified and their professional licenses are authenticated

### AI-Powered Features
- **Legal Document Analysis**: Upload any contract or legal document and get instant analysis including a simple summary, dangerous clauses, and potential risks
- **Smart Legal Assistant**: Ask any legal question and get instant answers from our AI assistant trained on local laws (available 24/7)
- **Case Outcome Prediction**: Get intelligent estimates of your case success rate and expected duration based on thousands of similar cases
- **Ideal Lawyer Recommendation**: An intelligent recommendation system that suggests the best lawyer for your case based on specialization, experience, and ratings

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Justice-Connect
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Create a `.env` file in the root directory
   - Add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Set up the database:
   - Run the SQL scripts in the root directory to set up your database schema
   - Start with `database_setup.sql`
   - Follow any additional setup files as needed

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port Vite assigns).

## 🛠️ Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build locally
- `npm test` - Run tests in watch mode
- `npm run test:ui` - Run tests with UI
- `npm run test:run` - Run tests once
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:integration` - Run integration tests
- `npm run test:unit` - Run unit tests only

## 📁 Project Structure

```
Justice-Connect/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── client/         # Client-specific components
│   │   └── shared/         # Shared components
│   ├── pages/              # Page components
│   │   ├── admin/         # Admin pages
│   │   ├── client/        # Client pages
│   │   └── lawyer/        # Lawyer pages
│   ├── hooks/              # Custom React hooks
│   ├── context/            # React context providers
│   ├── routes/             # Route configurations
│   ├── services/           # API service functions
│   ├── utils/              # Utility functions
│   ├── i18n/              # Internationalization files
│   └── supabaseClient.js  # Supabase client configuration
├── database/               # Database setup files
│   ├── fixes/             # Database fixes
│   └── policies/          # Database policies
└── public/                # Static assets
```

## 🎨 Tech Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router DOM v7
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Internationalization**: i18next (English & Arabic support)
- **Icons**: Lucide React
- **Testing**: Vitest, Testing Library

## 👥 User Roles

### Client
- Search and browse verified lawyers
- Book appointments
- Create and manage legal cases
- Upload documents and evidence
- Communicate with assigned lawyers
- Track case progress and timelines

### Lawyer
- Manage profile and availability
- View and manage assigned cases
- Schedule appointments
- Upload case documents and updates
- Communicate with clients
- Track case timelines and tasks

### Admin
- Verify lawyer accounts
- Manage deletion requests
- Oversee platform operations

## 🌍 Internationalization

The application supports both English and Arabic languages. Language files are located in `src/i18n/`:
- `en.json` - English translations
- `ar.json` - Arabic translations

## 🧪 Testing

The project uses Vitest for testing. Tests are located in:
- Component tests: `src/components/__tests__/`
- Integration tests: `src/test/integration/`

Run tests with:
```bash
npm test
```

## 📝 Database Setup

1. Create a new Supabase project
2. Run the SQL scripts in order:
   - `database_setup.sql`
   - Any additional setup files as documented
3. Set up storage buckets as needed
4. Configure Row Level Security (RLS) policies

Refer to the SQL files in the root directory and `database/` folder for detailed setup instructions.

## 🔒 Security

- All user data is protected with Supabase Row Level Security (RLS)
- Authentication handled through Supabase Auth
- File uploads are secured with storage policies
- Encrypted communication between clients and lawyers

## 📄 License

This project is private and proprietary.

## 🤝 Contributing

This is a private project. Contributions are managed internally.

## 📧 Contact

For questions or support, please contact the development team.

---

Built with ❤️ for connecting people with legal justice
