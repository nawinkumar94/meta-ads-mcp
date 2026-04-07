# Meta Ads MCP - Complete Testing & Deployment Guide

This guide helps you test the Meta Ads MCP setup using your **personal Meta account** before involving your business team, then deploy to Cloudflare Containers.

**Tested and verified on March 30, 2026**

---

## Overview: What We'll Do

```
Phase 1: Set up Meta Developer Account & App (15 min)
    ↓
Phase 2: Create Facebook Page & Ad Account (10 min)
    ↓
Phase 3: Generate Access Token (5 min)
    ↓
Phase 4: Clone and Run MCP Server Locally (20 min)
    ↓
Phase 5: Test with MCP Inspector (10 min)
    ↓
Phase 6: Deploy to Cloudflare Containers (30 min)
    ↓
Phase 7: Test Cloudflare Deployment (10 min)
    ↓
Phase 8: Cleanup (Delete to avoid costs)
    ↓
Phase 9: Secure with Cloudflare Zero Trust (30 min) [Production]
    ↓
Phase 10: Connect to Claude/Cowork (15 min) [Production]
```

**Total Time: ~1.5-2 hours (testing) + 45 min (production setup)**

---

## Cost & Privacy Information

| Item | Cost | Privacy |
|------|------|---------|
| Meta Developer Account | **Free** | Nothing posted to your profile |
| Facebook Test Page | **Free** | Can be unpublished/invisible |
| Ad Account (no ads) | **Free** | No payment needed for testing |
| Local Docker testing | **Free** | Runs on your machine |
| Cloudflare Containers | **~$0.01-$1** for brief testing | Delete after testing |

---

## Phase 1: Set Up Meta Developer Account & App

### Step 1.1: Create a Meta Developer Account

1. Go to: https://developers.facebook.com/
2. Click **"Get Started"** or **"Log In"**
3. Log in with your personal Facebook account
4. Accept the Developer Terms
5. Verify your account (phone number or email)

> 💡 **This is free and nothing is posted to your profile!**

### Step 1.2: Create a New App

1. Go to: https://developers.facebook.com/apps/
2. Click **"Create App"**
3. Select **"Other"** as the use case → Click **"Next"**
4. Select **"Business"** as app type → Click **"Next"**
5. Fill in:
   - **App Name:** `Ads MCP Test`
   - **Contact Email:** Your email
   - **Business Account:** Skip if asked
6. Click **"Create App"**
7. Re-enter your Facebook password if prompted

### Step 1.3: Add Marketing API to Your App

1. On the App Dashboard, find **"Add products to your app"**
2. Find **"Marketing API"** and click **"Set up"**

### Step 1.4: Get Your App Credentials

1. Go to **App Settings** → **Basic** (left sidebar)
2. Note down:

```
App ID: _________________ (visible on page)
App Secret: _____________ (click "Show" to reveal)
```

> ⚠️ **Keep App Secret private!** Never commit it to Git.

---

## Phase 2: Create Facebook Page & Ad Account

### Step 2.1: Create a Test Facebook Page

Meta requires a Facebook Page before you can create an Ad Account.

1. Go to: https://www.facebook.com/pages/create
2. Enter:
   - **Page name:** `MCP Test Page` (or anything)
   - **Category:** `Software` or `Technology`
   - **Bio:** Optional
3. Click **"Create Page"**

> 💡 **This page is not published by default** - no one will see it.

### Step 2.2: Create an Ad Account

1. Go to: https://www.facebook.com/ads/manager/
2. Follow the setup wizard:
   - Select your country and currency
   - Select your time zone
   - Accept the terms
3. **Skip any payment prompts** - you don't need to add payment for testing

### Step 2.3: Find Your Ad Account ID via Graph API Explorer

If you can't find the Ad Account ID in the URL, use the Graph API Explorer:

1. Go to: https://developers.facebook.com/tools/explorer/
2. Select your app (**"Ads MCP Test"**) in the dropdown
3. Click **"Generate Access Token"**
4. When prompted, grant permissions:
   - ✅ `ads_read`
   - ✅ `ads_management`
   - ✅ `business_management`
5. In the query field, enter: `me/adaccounts`
6. Click **"Submit"**
7. You'll see your Ad Account ID in the response (e.g., `act_123456789`)

```
Ad Account ID: _________________ (just the number without "act_")
```

---

## Phase 3: Generate Access Token

### Step 3.1: Get Access Token from Graph API Explorer

1. Go to: https://developers.facebook.com/tools/explorer/
2. Select your app in the dropdown
3. Click **"Generate Access Token"**
4. When the popup appears:
   - Click **"Continue as [Your Name]"**
   - Select **"Opt in to current Businesses only"**
5. Copy the Access Token (long string starting with `EAA...`)

```
Access Token: EAAxxxxxxxxxxxxxxx... (very long string)
```

> ⚠️ **Token expires in ~1 hour!** Regenerate if you get auth errors.

---

## Phase 4: Clone and Run MCP Server Locally

### Step 4.1: Prerequisites Check

```bash
# Check Docker is installed and running
docker --version
docker info  # Should not show errors

# Check Git
git --version

# Check Node.js (for MCP Inspector later)
node --version
```

**If Docker Desktop is not running**, start it from Applications.

### Step 4.2: Clone the Repository

```bash
cd ~/code  # Or your preferred directory
git clone --depth 1 https://github.com/pipeboard-co/meta-ads-mcp.git
cd meta-ads-mcp
```

### Step 4.3: Create Environment File

```bash
cat > .env << 'EOF'
META_APP_ID=your_app_id_here
META_APP_SECRET=your_app_secret_here
META_ACCESS_TOKEN=your_access_token_here
META_ADS_ACCOUNT_ID=your_ad_account_id_here
META_ADS_DISABLE_CALLBACK_SERVER=1
EOF
```

Edit the file and replace with your actual values:
```bash
nano .env  # or: code .env
```

### Step 4.4: Build Docker Image

```bash
docker build -t meta-ads-mcp .
```

Wait for the build to complete (1-2 minutes).

### Step 4.5: Run MCP Server Locally

```bash
docker run -d --rm \
  --name meta-ads-mcp-server \
  --env-file .env \
  -p 8080:8080 \
  meta-ads-mcp \
  python -m meta_ads_mcp --transport streamable-http --host 0.0.0.0 --port 8080
```

### Step 4.6: Verify Server is Running

```bash
# Check container is running
docker ps | grep meta-ads

# Check logs
docker logs meta-ads-mcp-server

# Test the endpoint (expected: JSON error about headers - this is normal!)
curl http://localhost:8080/mcp
```

**Expected response:**
```json
{"jsonrpc":"2.0","id":"server-error","error":{"code":-32600,"message":"Not Acceptable: Client must accept text/event-stream"}}
```

This error is **normal** - it means the server is working but needs proper MCP client headers.

---

## Phase 5: Test with MCP Inspector

### Step 5.1: Run MCP Inspector

```bash
npx @modelcontextprotocol/inspector http://localhost:8080/mcp
```

When prompted to install, type `y` and press Enter.

The inspector will output a URL like:
```
🚀 MCP Inspector is up and running at:
   http://localhost:6274/?MCP_PROXY_AUTH_TOKEN=xxxxx
```

### Step 5.2: Connect in Browser

1. Open the URL in your browser
2. You should see the MCP Inspector interface
3. The tools list should appear on the left side

### Step 5.3: Test a Tool

1. Click on **`get_ad_accounts`**
2. Click **"Run"** or **"Execute"**
3. You should see your test ad account in the response

> ✅ **If you see your ad account info, local testing is successful!**

---

## Phase 6: Deploy to Cloudflare Containers

### Step 6.1: Install Wrangler CLI

```bash
npm install -g wrangler
wrangler login  # Opens browser for authentication
```

### Step 6.2: Install Cloudflare Containers Package

```bash
cd ~/code/meta-ads-mcp  # Or wherever you cloned it
npm init -y
npm install @cloudflare/containers
```

### Step 6.3: Create Worker Wrapper

Create `worker.js`:

```javascript
// worker.js
import { Container, getContainer } from "@cloudflare/containers";

export class MetaAdsMCP extends Container {
  defaultPort = 8080;
  sleepAfter = "5m";
  
  // Pass secrets as environment variables to the container
  getEnv(env) {
    return {
      META_APP_ID: env.META_APP_ID,
      META_APP_SECRET: env.META_APP_SECRET,
      META_ACCESS_TOKEN: env.META_ACCESS_TOKEN,
      META_ADS_ACCOUNT_ID: env.META_ADS_ACCOUNT_ID,
      META_ADS_DISABLE_CALLBACK_SERVER: env.META_ADS_DISABLE_CALLBACK_SERVER || "1"
    };
  }
}

export default {
  async fetch(request, env) {
    const container = getContainer(env.META_ADS_MCP);
    return container.fetch(request);
  }
};
```

### Step 6.4: Create Wrangler Configuration

Create `wrangler.json`:

```json
{
  "name": "meta-ads-mcp-test",
  "account_id": "YOUR_CLOUDFLARE_ACCOUNT_ID",
  "main": "worker.js",
  "compatibility_date": "2024-01-01",
  "durable_objects": {
    "bindings": [
      {
        "name": "META_ADS_MCP",
        "class_name": "MetaAdsMCP"
      }
    ]
  },
  "migrations": [
    {
      "tag": "v1",
      "new_sqlite_classes": ["MetaAdsMCP"]
    }
  ],
  "containers": [
    {
      "class_name": "MetaAdsMCP",
      "image": "./Dockerfile",
      "instance_type": "basic",
      "max_instances": 1
    }
  ]
}
```

**Find your Cloudflare Account ID:**
```bash
wrangler whoami
```

Edit `wrangler.json` and replace `YOUR_CLOUDFLARE_ACCOUNT_ID`.

### Step 6.5: Update Dockerfile

Edit the Dockerfile and change the last `CMD` line to:

```dockerfile
# Expose port for HTTP transport
EXPOSE 8080

# Command to run the Meta Ads MCP server with HTTP transport
CMD ["python", "-m", "meta_ads_mcp", "--transport", "streamable-http", "--host", "0.0.0.0", "--port", "8080"]
```

### Step 6.6: Set Cloudflare Secrets

```bash
echo "YOUR_APP_ID" | wrangler secret put META_APP_ID
echo "YOUR_APP_SECRET" | wrangler secret put META_APP_SECRET
echo "YOUR_ACCESS_TOKEN" | wrangler secret put META_ACCESS_TOKEN
echo "YOUR_AD_ACCOUNT_ID" | wrangler secret put META_ADS_ACCOUNT_ID
python3 -c "import uuid; print(uuid.uuid4())" | npx wrangler secret put DEV_API_TOKEN
echo "1" | wrangler secret put META_ADS_DISABLE_CALLBACK_SERVER
```

### Step 6.7: Deploy

```bash
wrangler deploy
```

Wait for deployment (2-3 minutes). You'll get a URL like:
```
https://meta-ads-mcp-test.YOUR_SUBDOMAIN.workers.dev
```

---

## Phase 7: Test Cloudflare Deployment

### Step 7.1: Quick Health Check

```bash
# This should return "Not Found" (normal - no webpage at root)
curl https://meta-ads-mcp-test.YOUR_SUBDOMAIN.workers.dev/

# This should return JSON (server is working!)
curl https://meta-ads-mcp-test.YOUR_SUBDOMAIN.workers.dev/mcp
```

### Step 7.2: Test with MCP Inspector

```bash
# Stop local server first
docker stop meta-ads-mcp-server

# Start inspector for Cloudflare endpoint
npx @modelcontextprotocol/inspector https://meta-ads-mcp-test.YOUR_SUBDOMAIN.workers.dev/mcp
```

In the browser:
1. Set **Transport Type** to `Streamable HTTP`
2. Verify the URL is your Cloudflare endpoint
3. Click **Connect**
4. Wait 5-10 seconds for container cold-start
5. Test `get_ad_accounts` tool

> ✅ **If tools work, your Cloudflare deployment is successful!**

---

## Phase 8: Cleanup (Important!)

### Delete Cloudflare Deployment (to avoid costs)

```bash
cd ~/code/meta-ads-mcp
wrangler delete --force
```

### Stop Local Docker Container

```bash
docker stop meta-ads-mcp-server
```

### Stop MCP Inspector

Press `Ctrl+C` in the terminal running the inspector.

---

## Troubleshooting

### "Invalid OAuth access token"
**Cause:** Token expired (they last ~1 hour)
**Fix:** Generate a new token at https://developers.facebook.com/tools/explorer/

### "Not Acceptable: Client must accept text/event-stream"
**Cause:** Normal response when accessing /mcp directly in browser
**Fix:** This is expected! Use MCP Inspector or Claude to connect.

### "Not Found" at root URL
**Cause:** Normal - MCP server is an API, not a website
**Fix:** Access `/mcp` endpoint instead, using MCP Inspector.

### Container cold-start takes too long
**Cause:** Cloudflare Containers take 3-10 seconds to start
**Fix:** This is normal for containers. Wait and retry.

### Docker build fails
**Cause:** Docker Desktop not running
**Fix:** Start Docker Desktop and retry.

### Port already in use
```bash
# Find what's using the port
lsof -i:8080

# Stop the process or use a different port
docker run -p 8081:8080 ...
```

---

## Quick Reference: Your Credentials

Keep this handy (don't commit to Git!):

```
App ID:          _______________
App Secret:      _______________ (keep secret!)
Ad Account ID:   _______________
Access Token:    _______________ (expires in 1 hour!)
Cloudflare URL:  _______________
```

---

## What's Next?

After successful testing:

1. ✅ **Delete test deployment** to avoid costs
2. 📋 **Contact business team** for production Meta credentials
3. 🔐 **Set up Cloudflare Zero Trust** for security (Phase 9 below)
4. 🤖 **Connect to Claude/Cowork** for real use (Phase 10 below)
5. 📊 **Start analyzing Meta Ads** with natural language!

---

## Phase 9: Secure with MCP Server Portals (Production)

> ⚠️ **Prerequisites:** Complete Phase 6 (Deploy to Cloudflare) before this phase.

This phase uses **Cloudflare MCP Portals** - the recommended way to secure MCP servers. It's simpler than manual Zero Trust setup and provides built-in logging.

### What are MCP Portals?

**Simple Explanation:**
- MCP Portals are a **security gateway** specifically designed for MCP servers
- Users log in via your company's SSO (Okta/Google) before accessing MCP tools
- All requests are logged for audit purposes
- You can control which tools each user can access

```
Without MCP Portal:          With MCP Portal:
                            
User → MCP Server            User → MCP Portal → MCP Server
(no security)                      ↓
                                   🔐 Login required
                                   📊 All requests logged
                                   🎛️ Tool access controlled
```

### Step 9.1: Set Up an Identity Provider (One-time setup)

Before creating a portal, you need an Identity Provider configured.

1. Go to: https://one.dash.cloudflare.com/
2. Select your account (e.g., "Funding Societies")
3. Go to: **Settings** → **Authentication**
4. Click **"Add new"** under Login methods

**Option A: Google Workspace**
```
- Select "Google"
- Enter your Google Workspace Client ID and Secret
- Save
```

**Option B: Okta**
```
- Select "Okta"
- Enter your Okta Domain
- Enter Client ID and Client Secret
- Save
```

**Option C: One-Time PIN (simplest)**
```
- Select "One-time PIN"
- This emails a login code to users
- No external setup needed
```

> 💡 **Already have an IdP configured?** Skip to Step 9.2.

### Step 9.2: Add Your MCP Server to Cloudflare

1. In Cloudflare One dashboard, go to: **Access controls** → **AI controls**
2. Go to the **MCP servers** tab
3. Click **"Add an MCP server"**
4. Fill in:

```
Name: Meta Ads MCP
Server ID: meta-ads (optional, auto-generated if blank)
HTTP URL: https://meta-ads-mcp-test.YOUR_SUBDOMAIN.workers.dev/mcp
```

5. Add an **Access Policy** to control who can see this server:
   - **Policy name:** `DM Team Access`
   - **Action:** `Allow`
   - **Include:** Emails ending in `@yourcompany.com`

6. Click **"Save and connect server"**

7. Wait for status to change to **"Ready"** (Cloudflare fetches available tools)

### Step 9.3: Create an MCP Portal

1. In **AI controls**, click **"Add MCP server portal"**
2. Fill in:

```
Portal name: Meta Ads Portal
```

3. Under **Custom domain**, configure the portal URL:
```
Subdomain: meta-ads-portal
Domain: yourcompany.com (select from your Cloudflare domains)

Portal URL will be: https://meta-ads-portal.yourcompany.com/mcp
```

4. Under **MCP servers**, select your **"Meta Ads MCP"** server

5. (Optional) Configure which tools are available:
   - Expand the server
   - Enable/disable specific tools
   - For read-only access, disable tools like `create_campaign`, `update_ad`

6. Configure **"Require user auth"**:
   - `Enabled` (default): Each user authenticates with their own Meta credentials
   - `Disabled`: All users share the admin credential (simpler but less audit trail)

7. Add an **Access Policy** for the portal:
   - **Policy name:** `DM Team Portal Access`
   - **Action:** `Allow`
   - **Include:** Emails ending in `@yourcompany.com`
   - Or: **Include:** Group `DM-Team` (if using IdP groups)

8. Click **"Add an MCP server portal"**

### Step 9.4: Test the MCP Portal

**Method 1: Workers AI Playground (Quick test)**

1. Go to: https://playground.ai.cloudflare.com/
2. Under **MCP Servers**, enter your portal URL:
   ```
   https://meta-ads-portal.yourcompany.com/mcp
   ```
3. Click **"Connect"**
4. Log in with your corporate email in the popup
5. You should see **"Connected"** and the available tools listed

**Method 2: MCP Inspector**

```bash
npx @modelcontextprotocol/inspector https://meta-ads-portal.yourcompany.com/mcp
```

1. Open the inspector URL in your browser
2. Select **Transport Type:** `Streamable HTTP`
3. Click **"Connect"**
4. Log in when prompted
5. Verify tools appear and work

### Step 9.5: View Portal Logs

To see who is using the MCP portal and what they're doing:

1. In **AI controls**, find your portal
2. Click the **three dots** → **Edit**
3. Select **"Logs"**

You'll see:
- **Time:** When the request was made
- **Status:** Success or failure
- **Server:** Which MCP server handled it
- **Capability:** Which tool was called
- **Duration:** How long it took

> 💡 **For long-term storage:** Set up Logpush to export logs to your SIEM (Splunk, etc.)

### Step 9.6: Customize Login Experience (Optional)

1. Go to: **Access controls** → **Applications**
2. Find your portal application (auto-created)
3. Click **three dots** → **Edit**
4. In **Login methods** tab:
   - Select which identity providers to show
   - Enable **"Instant Auth"** to skip the login page (redirects directly to SSO)
5. Save

### MCP Portal Verification Checklist

```
[ ] Identity Provider configured (Okta/Google/One-time PIN)
[ ] MCP Server added with status "Ready"
[ ] MCP Portal created with custom domain
[ ] Access Policy restricts to authorized users
[ ] Tested: Workers AI Playground connects successfully
[ ] Tested: Tools return expected data
[ ] Logs show requests when tools are used
```

### Comparison: MCP Portals vs Manual Zero Trust

| Feature | MCP Portals | Manual Zero Trust |
|---------|-------------|-------------------|
| Setup time | ~15 minutes | ~30 minutes |
| MCP-specific features | ✅ Yes | ❌ No |
| Per-tool access control | ✅ Yes | ❌ No |
| Built-in request logging | ✅ Yes | Manual setup |
| Multiple MCP servers | ✅ Single portal | Separate apps |
| Learning curve | Lower | Higher |

> 💡 **Recommendation:** Use MCP Portals for MCP servers. It's purpose-built and simpler.

---

## Phase 10: Connect to Claude/Cowork (Production)

> ⚠️ **Prerequisites:** 
> - Complete Phase 6 (Deploy to Cloudflare)
> - Complete Phase 9 (MCP Portal) for production use

This phase connects your MCP server to Claude so your team can ask questions in natural language.

### What is Claude/Cowork?

- **Claude:** Anthropic's AI assistant (like ChatGPT)
- **Cowork:** A collaborative version of Claude for teams
- **MCP Connection:** Allows Claude to call your Meta Ads tools directly

### Step 10.1: Get Your MCP URL Ready

**If using MCP Portal (recommended):**
```
Portal URL: https://meta-ads-portal.yourcompany.com/mcp
```

**If using direct Workers URL (without portal):**
```
Workers URL: https://meta-ads-mcp-test.YOUR_SUBDOMAIN.workers.dev/mcp
```

> 💡 **Recommendation:** Use the MCP Portal URL for production. It includes authentication and logging.

### Step 10.2: Configure Claude Desktop (Option A)

If using **Claude Desktop app** on your Mac:

1. Open Claude Desktop
2. Go to: **Settings** (⚙️) → **Developer** → **MCP Servers**
3. Click **"Add Server"**
4. Fill in:

```
Name: Meta Ads
URL: https://meta-ads-portal.yourcompany.com/mcp
Transport: Streamable HTTP
```

5. Click **"Save"**
6. Restart Claude Desktop

**Alternatively, edit the config file directly:**

```bash
# Open Claude config file
code ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

Add this configuration:

```json
{
  "mcpServers": {
    "meta-ads": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote@latest",
        "https://meta-ads-portal.yourcompany.com/mcp"
      ]
    }
  }
}
```

> 💡 **Why `mcp-remote`?** This is the recommended way to connect to MCP Portals. It handles authentication and session management automatically.

Save and restart Claude Desktop.

### Step 10.3: Configure Cowork (Option B)

If your company uses **Cowork** (team version of Claude):

1. Contact your Cowork administrator
2. Request they add your MCP server to the workspace
3. Provide them:
   - MCP Portal URL: `https://meta-ads-portal.yourcompany.com/mcp`
   - Access requirements (Portal protected via IdP)
   - List of authorized users/groups

**For Cowork Admins:**

1. Go to Cowork Admin Panel
2. Navigate to: **Workspace Settings** → **Integrations** → **MCP Servers**
3. Click **"Add MCP Server"**
4. Fill in:

```
Name: Meta Ads Analysis
URL: https://meta-ads-portal.yourcompany.com/mcp
Transport: Streamable HTTP
```

5. Set permissions for which users/groups can use this MCP server
6. Save and deploy

### Step 10.4: Authenticate with MCP Portal

When connecting via MCP Portal, authentication works automatically:

1. **First connection:** Claude will prompt you to authenticate
2. **Login popup:** Enter your corporate credentials (Okta/Google/etc.)
3. **Session cached:** You stay logged in for the session duration (e.g., 24 hours)

**To clear cached authentication (if needed):**

```bash
rm -rf ~/.mcp-auth
```

Then reconnect - you'll be prompted to log in again.

### Step 10.5: Test the Connection

1. Open Claude Desktop or Cowork
2. Start a new conversation
3. Type a test query:

```
What Meta Ads tools do you have access to?
```

Claude should respond listing available tools like:
- `get_ad_accounts`
- `get_campaigns`
- `get_ad_insights`
- etc.

4. Try a real query:

```
Show me my Meta Ads accounts
```

> ✅ **Success:** If Claude returns your ad account info (like "Naveen Kumar"), the connection works!

### Step 10.6: Example Queries to Try

Once connected, your team can ask questions like:

**Basic Queries:**
```
- What are my Meta ad accounts?
- Show me all active campaigns
- List ad sets with their budgets
```

**Performance Queries:**
```
- Which campaigns have the highest CPA this week?
- Show me the top 5 performing ads by CTR
- What's my total ad spend this month?
```

**Analysis Queries:**
```
- Compare this week's performance to last week
- Which audiences are converting best?
- Identify underperforming ads with high spend
```

**Action Queries (if you have write access):**
```
- Pause campaigns with CPA over $50
- Increase budget for top performing ad sets
- Create a report of this month's performance
```

### Step 10.7: Troubleshooting Connection Issues

**Claude says "Cannot connect to MCP server":**
```
1. Check your MCP URL is correct
2. Verify the Cloudflare container is running
3. Check Zero Trust is not blocking Claude
4. Restart Claude Desktop
```

**Claude says "Authentication failed":**
```
1. Regenerate Service Token in Cloudflare
2. Update the headers in Claude config
3. Check the token hasn't expired
```

**Claude says "Tool execution failed":**
```
1. Check your Meta Access Token hasn't expired
2. Regenerate at: https://developers.facebook.com/tools/explorer/
3. Update the token in Cloudflare Secrets:
   wrangler secret put META_ACCESS_TOKEN
4. Redeploy: wrangler deploy
```

**Tools work but return empty data:**
```
This is normal if:
- You have a test ad account with no campaigns
- The Meta API permissions are limited
- The date range has no data
```

### Connection Verification Checklist

```
[ ] MCP Server deployed and running on Cloudflare
[ ] Zero Trust configured (if using for production)
[ ] Claude Desktop or Cowork configured with MCP URL
[ ] Authentication headers added (if Zero Trust enabled)
[ ] Test query "What Meta Ads tools do you have?" works
[ ] Test query "Show me my ad accounts" returns data
[ ] Team members can access (authorized emails only)
```

---

## Summary: Complete Production Setup

After completing all phases, you have:

```
┌─────────────────────────────────────────────────────────────────┐
│                    YOUR PRODUCTION SETUP                        │
│                                                                 │
│  👤 Team Member                                                 │
│       │                                                         │
│       ▼                                                         │
│  🤖 Claude/Cowork                                               │
│       │ "Show me campaign performance"                          │
│       ▼                                                         │
│  🔐 Cloudflare Zero Trust                                       │
│       │ ✓ Verify user identity                                  │
│       │ ✓ Check device posture                                  │
│       ▼                                                         │
│  ☁️  Cloudflare Container                                       │
│       │ ✓ MCP Server running                                    │
│       │ ✓ Processes natural language                            │
│       ▼                                                         │
│  📊 Meta Marketing API                                          │
│       │ ✓ Returns campaign data                                 │
│       ▼                                                         │
│  💬 Human-readable response                                     │
│       "Your top campaign is X with CPA of $Y..."               │
└─────────────────────────────────────────────────────────────────┘
```

**Time Saved:** 5-10 hours/week of manual reporting = **260-520 hours/year**

---

## Quick Reference: Production Checklist

```
Infrastructure:
[ ] Cloudflare Container deployed
[ ] Zero Trust Access Application created
[ ] Identity Provider configured
[ ] Service Token generated (for Claude)

Security:
[ ] Only authorized emails can access
[ ] Device posture checks enabled (optional)
[ ] WARP required (optional)
[ ] Access logs enabled for audit

Meta API:
[ ] Production App ID and Secret from business team
[ ] System User Token (long-lived, not user token)
[ ] Appropriate permissions (ads_read, ads_management)

Claude/Cowork:
[ ] MCP Server URL configured
[ ] Authentication headers set
[ ] Test queries verified
[ ] Team trained on usage
```
