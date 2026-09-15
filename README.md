# SolVerify - Solana Token Verification Platform

A complete, production-ready Web3 application for Solana token verification and community curation. Built with React, TypeScript, Express, PostgreSQL, and Solana wallet integration.

## 🚀 Features

- **Token Verification System**: Submit and review token verification requests
- **Community Likes**: Wallet-based like system with duplicate prevention
- **News Curation**: Submit and approve token-related news and updates
- **Admin Dashboard**: Manage submissions, verifications, and content moderation
- **Wallet Integration**: Secure Phantom/Solflare/Backpack wallet connection
- **Token Search**: Real-time search by name, symbol, or mint address
- **Risk Warnings**: Display and manage token risk indicators
- **Data Completeness Tracking**: Monitor metadata completeness
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile

## 🛠 Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Solana Wallet Adapter
- Lucide React Icons
- React Hot Toast

### Backend
- Node.js
- Express
- PostgreSQL
- Prisma ORM
- TypeScript

### Blockchain
- Solana Web3.js
- Wallet Adapter (Phantom, Solflare, Backpack)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v20.x or higher)
- **npm** (v10.x or higher)
- **PostgreSQL** (v14 or higher)
- **Git**

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
cd /Users/wikiwoo/Mobileapp/jupiter\ wallet
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

#### Option A: Local PostgreSQL

1. Install PostgreSQL if not already installed:
   ```bash
   # macOS (using Homebrew)
   brew install postgresql@14
   brew services start postgresql@14
   ```

2. Create a database:
   ```bash
   createdb solverify
   ```

3. Update `.env` file with your database connection:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/solverify?schema=public"
   ```

#### Option B: PostgreSQL with Docker

```bash
docker run --name solverify-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=solverify \
  -p 5432:5432 \
  -d postgres:14
```

Update `.env`:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/solverify?schema=public"
```

### 4. Environment Configuration

The `.env` file is already created. Update it with your settings:

```env
# Database
DATABASE_URL="postgresql://localhost:5432/solverify?schema=public"

# Server
PORT=3001
NODE_ENV=development

# Solana
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"

# Admin (optional - for development admin access)
ADMIN_WALLET_ADDRESS=""
```

**Note**: To enable admin features during development, add your wallet address to `ADMIN_WALLET_ADDRESS`.

### 5. Database Migration

Generate Prisma client and push schema to database:

```bash
npm run db:generate
npm run db:push
```

### 6. Seed Demo Data

Populate the database with demo tokens:

```bash
npm run db:seed
```

This creates:
- MOLLIE token (as shown in the screenshot)
- SolanaMax (verified token)
- CryptoRunner (pending token)
- Risk warnings
- Sample data

## 🚀 Running the Application

### Development Mode

Start both frontend and backend in development mode:

```bash
npm run dev
```

This runs:
- Frontend on `http://localhost:5173`
- Backend API on `http://localhost:3001`

The frontend proxies API requests to the backend automatically.

### Production Build

Build the frontend:

```bash
npm run build
```

Start the backend:

```bash
npm run server
```

Serve the built frontend with a static file server or deploy separately.

## 📱 Usage

### Accessing the Application

1. Open your browser to `http://localhost:5173`
2. You'll see the dashboard with demo tokens
3. Click "Sign in with Wallet" to connect your Solana wallet
4. Browse tokens, search, and explore features

### Key Features to Try

#### 1. Browse Tokens
- View all tokens on the dashboard
- See verification status, activity level, and risk warnings
- Click any token to view details

#### 2. Token Detail Page
- View complete token information
- Like/unlike tokens (requires wallet connection)
- Add metadata (description, website, social links)
- Submit for verification
- Add news posts

#### 3. Search Tokens
- Use the search bar in the navbar
- Search by token name, symbol, or mint address
- Real-time autocomplete suggestions

#### 4. Submit Verification
- Connect your wallet
- Navigate to a token page
- Click "Verify" button
- Complete the verification checklist
- Submit for review

#### 5. Add News
- Connect your wallet
- Navigate to a token page
- Click "Add Post" in the News section
- Submit relevant news URL with description

#### 6. Admin Dashboard
To access admin features:

1. Add your wallet address to `.env`:
   ```env
   ADMIN_WALLET_ADDRESS="YourWalletAddressHere"
   ```

2. Restart the server:
   ```bash
   npm run dev
   ```

3. Connect your wallet in the app

4. Navigate to `/admin` or create a link to it

5. Review and approve/reject:
   - Verification submissions
   - News posts
   - View platform statistics

## 🔐 Security

### Wallet Security

**IMPORTANT**: This application NEVER requests or stores:
- ❌ Seed phrases
- ❌ Private keys
- ❌ Recovery phrases
- ❌ Wallet passwords

The application uses the standard Solana Wallet Adapter which:
- ✅ Only receives public wallet addresses
- ✅ Requests signatures through the wallet provider
- ✅ Never has access to private credentials

### Authentication Flow

1. User clicks "Connect Wallet"
2. Wallet selection modal appears
3. User selects wallet (Phantom/Solflare/Backpack)
4. Wallet provider handles authentication
5. Application receives only public address
6. User can disconnect at any time

## 📡 API Endpoints

### Token Endpoints

```
GET    /api/tokens              - Get all tokens
GET    /api/tokens/search?q=    - Search tokens
GET    /api/tokens/:mintAddress - Get token details
POST   /api/tokens              - Create new token (requires auth)
POST   /api/tokens/:mint/like   - Like token (requires auth)
DELETE /api/tokens/:mint/like   - Unlike token (requires auth)
POST   /api/tokens/:mint/verify - Submit verification (requires auth)
POST   /api/tokens/:mint/news   - Add news post (requires auth)
PATCH  /api/tokens/:mint        - Update token metadata (requires auth)
```

### Submission Endpoints

```
GET /api/submissions           - Get all submissions
GET /api/submissions/:id       - Get submission by ID
```

### News Endpoints

```
GET /api/news                  - Get approved news
GET /api/news?status=pending   - Get pending news
```

### Admin Endpoints (requires admin auth)

```
PATCH /api/admin/submissions/:id - Approve/reject submission
PATCH /api/admin/news/:id        - Approve/reject news post
GET   /api/admin/stats           - Get platform statistics
```

## 🗄 Database Schema

### Main Models

- **Token**: Token information and metadata
- **TokenLike**: User likes with duplicate prevention
- **VerificationSubmission**: Verification requests
- **NewsPost**: Community-submitted news
- **RiskWarning**: Token risk indicators
- **User**: Wallet addresses and admin status

See `prisma/schema.prisma` for complete schema.

## 🎨 Design

The application closely follows the visual design shown in the reference screenshot:

- Dark navy/black theme
- Lime green (primary) accents
- Clean card-based layout
- Modern Web3 dashboard aesthetic
- Responsive grid system
- Subtle animations and transitions

## 📝 Development Notes

### Adding New Tokens

You can add tokens via:

1. **API**: POST to `/api/tokens` with wallet auth
2. **Database**: Directly insert into Prisma
3. **Seed script**: Add to `server/seed.ts`

### Making a User Admin

```bash
# Connect to your database
psql solverify

# Update user to admin
UPDATE "User" SET "isAdmin" = true WHERE "walletAddress" = 'YOUR_WALLET_ADDRESS';
```

Or add the wallet address to `.env` as `ADMIN_WALLET_ADDRESS` before the user connects.

### Database Migrations

When you modify `prisma/schema.prisma`:

```bash
# Create a migration
npm run db:migrate

# Apply changes without migration (development)
npm run db:push

# Regenerate Prisma client
npm run db:generate
```

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
brew services list

# Test connection
psql -h localhost -U postgres -d solverify
```

### Wallet Connection Issues

- Ensure you have a Solana wallet extension installed (Phantom recommended)
- Check browser console for errors
- Try disconnecting and reconnecting wallet
- Clear browser cache and cookies

### Port Already in Use

```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill

# Kill process on port 5173
lsof -ti:5173 | xargs kill
```

## 📦 Project Structure

```
/
├── prisma/
│   └── schema.prisma          # Database schema
├── server/
│   ├── index.ts               # Express server
│   ├── prisma.ts              # Prisma client
│   ├── seed.ts                # Database seeding
│   ├── middleware/
│   │   └── auth.ts            # Authentication middleware
│   └── routes/
│       ├── tokens.ts          # Token endpoints
│       ├── submissions.ts     # Submission endpoints
│       ├── news.ts            # News endpoints
│       └── admin.ts           # Admin endpoints
├── src/
│   ├── components/
│   │   ├── WalletProvider.tsx # Wallet connection setup
│   │   ├── Layout.tsx         # Page layout wrapper
│   │   ├── Navbar.tsx         # Navigation bar
│   │   ├── AddMetadataModal.tsx
│   │   ├── VerifyTokenModal.tsx
│   │   └── AddNewsModal.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx      # Main dashboard
│   │   ├── TokenDetail.tsx    # Token detail page
│   │   ├── Submissions.tsx    # Submissions page
│   │   ├── News.tsx           # News page
│   │   └── Admin.tsx          # Admin dashboard
│   ├── lib/
│   │   └── api.ts             # API client functions
│   ├── App.tsx                # Root component
│   ├── main.tsx               # Entry point
│   └── index.css              # Global styles
├── .env                       # Environment variables
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
├── vite.config.ts             # Vite config
├── tailwind.config.js         # Tailwind config
└── README.md                  # This file
```

## 🤝 Contributing

This is a demonstration project. For production use:

1. Add proper authentication/session management
2. Implement rate limiting
3. Add comprehensive error handling
4. Set up monitoring and logging
5. Configure CORS properly
6. Use environment-specific configurations
7. Add comprehensive tests
8. Set up CI/CD pipeline

## 📄 License

This project is for demonstration purposes.

## 🙏 Acknowledgments

- Solana Foundation for wallet adapter
- Jupiter Exchange for design inspiration (visual reference only)
- Phantom, Solflare, and Backpack for wallet support

---

**Note**: This application does not impersonate Jupiter. It's an original platform named "SolVerify" that follows similar UX patterns for token verification. All branding is original.

For questions or issues, please check the troubleshooting section or review the code comments.
