# Fix Local Development Environment

**Date:** February 24, 2026  
**Project:** Link Shortener Application  
**Issue:** Dashboard page freezing after sign-in and SSL certificate errors

---

## 🔍 Problem Description

When running `npm run dev` and accessing `localhost:3000`, after successful Clerk authentication and redirecting to `/dashboard`, the page would freeze with only "rendering..." text displayed.

### Symptoms

- Development server starts but application hangs on dashboard page
- No error messages in browser console
- Page appears to be loading indefinitely
- Database queries timing out silently

---

## 🎯 Root Cause

**SSL Certificate Verification Failure** in corporate network environment.

The application was unable to establish a secure connection to the Neon PostgreSQL database due to SSL certificate verification issues:

```
Error: unable to get local issuer certificate
code: 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY'
```

This occurred when:
- Running `npx drizzle-kit push` to sync database schema
- Making database queries from the Next.js application
- Any connection to Neon database via `@neondatabase/serverless`

---

## ✅ Solution

### 1. Add SSL Workaround to Environment Variables

**File:** `.env`

Add the following line at the top of your `.env` file:

```bash
# SSL Workaround for corporate network
NODE_TLS_REJECT_UNAUTHORIZED=0
```

**Complete `.env` structure:**

```bash
# SSL Workaround for corporate network
NODE_TLS_REJECT_UNAUTHORIZED=0

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
DATABASE_URL=postgresql://neondb_owner:xxxxx@ep-sweet-unit-xxxxx-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### 2. Configure Git Account for Project

Set the personal GitHub account for this specific project:

```bash
# Configure project-specific Git identity
git config --local user.name "Antonio Tomita"
git config --local user.email "antonio.tomita@gmail.com"

# Verify configuration
git config --local --list | grep user
```

**Output:**
```
user.name=Antonio Tomita
user.email=antonio.tomita@gmail.com
```

---

## 🛠️ Commands and Tests

### Kill Existing Dev Server

If you encounter port conflicts or lock file issues:

```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Or kill all Next.js dev processes
pkill -f "next dev"

# Remove Next.js lock files
rm -rf .next/dev 2>/dev/null || true
```

### Push Database Schema

```bash
# With SSL workaround
export NODE_TLS_REJECT_UNAUTHORIZED=0 && npx drizzle-kit push
```

**Expected Output:**
```
✓ Pulling schema from database...
[i] No changes detected
```

### Test Database Connection

Create a test file to verify database connectivity:

```javascript
// test-db-connection.js
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function testConnection() {
  try {
    const result = await sql`SELECT NOW()`;
    console.log('✅ Database connection successful!');
    console.log('Server time:', result[0].now);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
```

**Run the test:**

```bash
export NODE_TLS_REJECT_UNAUTHORIZED=0 && \
export $(cat .env | grep -v '^#' | xargs) && \
node test-db-connection.js
```

**Expected Output:**
```
✅ Database connection successful!
Server time: 2026-02-25T02:11:45.561Z
```

### Start Development Server

```bash
npm run dev
```

**Expected Output:**
```
Warning: Setting the NODE_TLS_REJECT_UNAUTHORIZED environment variable to '0' 
makes TLS connections and HTTPS requests insecure by disabling certificate verification.

▲ Next.js 16.0.10
- Local:        http://localhost:3000
```

---

## ⚠️ Important Warnings and Notes

### Security Warning

```
Warning: Setting the NODE_TLS_REJECT_UNAUTHORIZED environment variable to '0' 
makes TLS connections and HTTPS requests insecure by disabling certificate verification.
```

- **Expected:** This warning is normal and safe for local development
- **Scope:** Only affects this project (not system-wide)
- **Purpose:** Bypasses SSL certificate validation in corporate networks
- **Production:** Never use this in production environments

### Git Account Configuration

- **Scope:** Local configuration affects only this project
- **Corporate Account:** Remains active in other repositories
- **Verification:** Run `git config --local user.email` to confirm
- **Per-Project:** Each repository can have different Git identities

---

## 🤖 GitHub Copilot Configuration

### Switch to Personal Account

1. **Sign out of corporate account:**
   - Press `Ctrl+Shift+P` (Linux/Windows) or `Cmd+Shift+P` (Mac)
   - Type: `Accounts: Sign Out`
   - Select: `atomita@uolinc.com`

2. **Sign in with personal account:**
   - Press `Ctrl+Shift+P` (Linux/Windows) or `Cmd+Shift+P` (Mac)
   - Type: `GitHub Copilot: Sign In`
   - Use: `antonio.tomita@gmail.com`

### Alternative: VS Code Profiles

Create separate profiles for work and personal projects:

1. **Create Personal Profile:**
   - Press `Ctrl+Shift+P`
   - Type: `Profiles: Create Profile`
   - Name: "Personal Development"
   - Sign in with: `antonio.tomita@gmail.com`

2. **Create Work Profile:**
   - Repeat process
   - Name: "Corporate Development"
   - Sign in with: `atomita@uolinc.com`

3. **Switch Profiles:**
   - Click profile icon in bottom-left
   - Select appropriate profile

---

## 📋 Verification Checklist

Before testing the application, verify:

- [ ] `.env` file contains `NODE_TLS_REJECT_UNAUTHORIZED=0`
- [ ] Git configured with personal email: `git config --local user.email`
- [ ] Database schema pushed successfully: `npx drizzle-kit push`
- [ ] Database connection test passed
- [ ] Development server running on port 3000
- [ ] No other Next.js instances running

## 🚀 Testing the Application

1. **Start Development Server:**
   ```bash
   npm run dev
   ```

2. **Open Browser:**
   - Navigate to: http://localhost:3000

3. **Sign In:**
   - Click "Sign In" button
   - Authenticate with Clerk

4. **Access Dashboard:**
   - Should redirect to: http://localhost:3000/dashboard
   - Page should load instantly (no freezing)

5. **Create Link:**
   - Click "Create Link" button
   - Enter a URL to shorten
   - Submit and verify link creation

---

## 🔧 Troubleshooting

### Issue: Port 3000 Already in Use

**Error:**
```
⚠ Port 3000 is in use by an unknown process
```

**Solution:**
```bash
lsof -ti:3000 | xargs kill -9
```

### Issue: Lock File Error

**Error:**
```
⨯ Unable to acquire lock at .next/dev/lock
```

**Solution:**
```bash
rm -rf .next/dev
npm run dev
```

### Issue: Database Connection Timeout

**Symptoms:** Page hangs, no error messages

**Solution:**
```bash
# Verify NODE_TLS_REJECT_UNAUTHORIZED is set
grep NODE_TLS_REJECT_UNAUTHORIZED .env

# Should output:
# NODE_TLS_REJECT_UNAUTHORIZED=0

# If not found, add it to .env file
```

### Issue: Wrong Git Account

**Verification:**
```bash
git config user.email
```

**Fix:**
```bash
git config --local user.email "antonio.tomita@gmail.com"
```

---

## 📚 Environment Files Reference

### Files to Check

- **`.env`** - Main environment variables file (exists)
- **`.env.local`** - Alternative environment file (not used in this project)
- **`.gitignore`** - Ensure `.env` is listed (security)

### Environment Variables Required

| Variable | Purpose | Location |
|----------|---------|----------|
| `NODE_TLS_REJECT_UNAUTHORIZED` | SSL workaround | Corporate network |
| `DATABASE_URL` | Neon PostgreSQL connection | [Neon Console](https://console.neon.tech/) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key | [Clerk Dashboard](https://dashboard.clerk.com/) |
| `CLERK_SECRET_KEY` | Clerk secret key | [Clerk Dashboard](https://dashboard.clerk.com/) |

---

## 📝 Additional Notes

### Corporate Network Considerations

This project requires special configuration due to corporate network SSL certificate policies:

1. **Proxy Settings:** Corporate proxies may interfere with SSL connections
2. **Certificate Validation:** Internal certificates not recognized by Node.js
3. **Firewall Rules:** WebSocket connections may be restricted

### Best Practices

1. **Never commit `.env` file** to version control
2. **Use `.env.local` for sensitive overrides** (optional)
3. **Document environment setup** for team members
4. **Keep separate Git configs** per project
5. **Use VS Code profiles** to manage multiple accounts

### Development Workflow

```bash
# 1. Pull latest changes
git pull origin main

# 2. Install dependencies (if needed)
npm install

# 3. Verify environment
cat .env | grep NODE_TLS

# 4. Sync database schema
export NODE_TLS_REJECT_UNAUTHORIZED=0 && npx drizzle-kit push

# 5. Start development
npm run dev
```

---

## 🆘 Getting Help

If issues persist:

1. **Check terminal output** for specific error messages
2. **Verify all environment variables** are set correctly
3. **Test database connection** independently
4. **Restart VS Code** to refresh extensions
5. **Clear Next.js cache:** `rm -rf .next`

### Common Error Patterns

| Error | Likely Cause | Solution |
|-------|--------------|----------|
| SSL/TLS errors | Corporate network | Add `NODE_TLS_REJECT_UNAUTHORIZED=0` |
| Port conflicts | Multiple servers | `pkill -f "next dev"` |
| Lock file errors | Interrupted builds | `rm -rf .next/dev` |
| Database timeout | Connection failure | Verify `DATABASE_URL` and SSL fix |
| Auth redirect loops | Clerk misconfiguration | Check Clerk dashboard settings |

---

## 📌 Quick Reference

### Essential Commands

```bash
# Start development
npm run dev

# Push database schema
npx drizzle-kit push

# Check Git config
git config --local --list

# Kill dev server
pkill -f "next dev"

# Check running processes
ps aux | grep "next dev"
```

### File Locations

- Environment: `.env`
- Database config: `drizzle.config.ts`
- Database schema: `db/schema.ts`
- Proxy/Middleware: `proxy.ts`
- Dashboard: `app/dashboard/page.tsx`

---

**Last Updated:** February 24, 2026  
**Maintainer:** Antonio Tomita (antonio.tomita@gmail.com)
