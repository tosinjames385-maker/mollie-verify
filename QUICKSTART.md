# Quick Start Guide

## Prerequisites

1. **Node.js v20+** and **npm**
2. **PostgreSQL** running on your system
3. A **Solana wallet browser extension** (Phantom, Solflare, or Backpack)

## Fast Setup (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

**Note**: This may take 3-5 minutes due to Solana wallet dependencies. The install is running successfully even if it appears slow.

### 2. Setup Database

**Option A: Using existing PostgreSQL**
```bash
# Create database
createdb solverify

# Update .env with your database URL
# DATABASE_URL="postgresql://YOUR_USERNAME@localhost:5432/solverify?schema=public"
```

**Option B: Using Docker (recommended)**
```bash
docker run --name solverify-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=solverify \
  -p 5432:5432 \
  -d postgres:14

# Update .env
# DATABASE_URL="postgresql://postgres:password@localhost:5432/solverify?schema=public"
```

### 3. Initialize Database
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with demo data
npm run db:seed
```

### 4. Run the Application
```bash
npm run dev
```

This starts:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### 5. Open in Browser

Navigate to **http://localhost:5173**

You should see the dashboard with demo tokens!

## First Steps

1. **Browse Tokens**: Click any token to view details
2. **Connect Wallet**: Click "Sign in with Wallet" button
3. **Like a Token**: Connect wallet, then click the heart icon
4. **Search**: Try searching for "MOLLIE" or "Solana"
5. **Add Metadata**: On a token page, click "Add now" to add information
6. **Submit Verification**: Click the "Verify" button on any token
7. **Add News**: Click "Add Post" in the News section

## Enable Admin Features

To access the admin dashboard:

1. Connect your wallet to the app
2. Copy your wallet address
3. Add it to `.env`:
   ```bash
   ADMIN_WALLET_ADDRESS="YOUR_WALLET_ADDRESS_HERE"
   ```
4. Restart the development server: `npm run dev`
5. Navigate to http://localhost:5173/admin

## Troubleshooting

### "npm install" is stuck
- It's not stuck! Solana wallet packages take time to download
- Wait 5-10 minutes for completion
- Check your internet connection

### Database connection error
```bash
# Check if PostgreSQL is running
pg_isready

# If using Docker
docker ps
```

### Port already in use
```bash
# Kill processes
lsof -ti:3001 | xargs kill
lsof -ti:5173 | xargs kill
```

### Wallet not connecting
- Install Phantom wallet extension
- Refresh the page
- Check browser console for errors

## Demo Data

The seed script creates:
- **MOLLIE** - Unverified token (from screenshot)
- **SolanaMax** - Verified token example  
- **CryptoRunner** - Pending verification example
- Risk warnings
- Sample metadata

## Development Tips

- **Hot Reload**: Changes auto-reload in development
- **API Logs**: Check terminal for backend logs
- **Database**: Use Prisma Studio to view data:
  ```bash
  npx prisma studio
  ```

## Project Structure

```
/src
  /components    - React components
  /pages         - Page components (Dashboard, TokenDetail, etc.)
  /lib           - API client functions
/server
  /routes        - Express API routes
  /middleware    - Auth and other middleware
/prisma
  schema.prisma  - Database schema
```

## Key Features

✅ **Token Verification System** - Submit and review tokens  
✅ **Community Likes** - Wallet-based voting system  
✅ **News Curation** - Submit and approve news posts  
✅ **Admin Dashboard** - Manage submissions and content  
✅ **Real-time Search** - Search tokens instantly  
✅ **Risk Warnings** - Display token risk indicators  
✅ **Responsive Design** - Works on mobile and desktop  

## Next Steps

- Explore the code in `/src` and `/server`
- Check the full README.md for detailed documentation
- Try submitting a token for verification
- Test the admin approval workflow
- Customize the styling in Tailwind config

## Need Help?

1. Check the full **README.md** for detailed docs
2. Review **prisma/schema.prisma** for database structure  
3. Check **server/routes/** for API endpoints
4. Look at **src/lib/api.ts** for API client functions

---

**Happy coding! 🚀**

The application is fully functional and ready to use. All features from the screenshot are implemented and working.
