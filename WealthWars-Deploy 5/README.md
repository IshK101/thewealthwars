# Wealth Wars — ready-to-host bundle

Version 2.6.0 adds an always-available Player Handbook. Before a match, players can open a full How to Play overlay; during play, the same information is available from the permanent Guide tab and `?` button. It explains the purpose, winning score, full turn flow, level unlocks and every major control. A searchable plain-language glossary defines investing concepts, cognitive biases and game-only perks without interrupting play.

The deployment build explicitly installs the frontend and backend build tools on production hosts before compiling, preventing missing `vite/client` or TypeScript definitions during deployment.

This folder contains the complete game, organized as one deployable web service. The Node server serves both the website and the real-time Socket.IO game, so you need only one hosting service and one domain record.

The v2.5 gameplay update positions Wealth Wars as a Behavioral Capital Lab: a long-term investing game about how markets, online information and social pressure shape judgment. It includes anytime buy and sell orders, live cost-basis gain/loss percentages, level-specific decisions, evidence-based answer reviews, meaningful portfolio consequences, research discounts, downside-protection abilities, investing-focused events, contextual tips, a clearly labeled game-only insider-information mechanic, and support for 2–4 players.

Social-media scenarios now appear across all three levels, including viral stock tips, sponsored creator promotions, algorithmic echo chambers and private investment-group claims. Each player sees a private, live influence pattern covering verification habits, hype pull and independent judgment, with an immediate side notification after each relevant choice. This is an in-game reflection feature only: it does not add a survey, research export, external tracking requirement or separate paper.

Progression is paced for a 20-round game. Strongest-fit decisions earn 2 Investor Progress points, defensible decisions earn 1, and bias traps earn 0. Level 2 unlocks at 4 points and Level 3 at 10. One-time points are also awarded for building a $300 emergency fund, owning two asset classes, using a research discount, holding a bond to maturity, and disciplined rebalancing. Guaranteed Investor Reviews in rounds 6 and 13 prevent progress from depending entirely on dice rolls.

Stocks and funds sell at the current market price. Bonds can be sold early for 95% of face value, and property sales include a 10% transaction cost. The order desk shows these proceeds and costs before the player confirms a sale.

The accelerated economy adds $100, $175 or $275 of investable cash at the start of each move based on player level. Income tiles, skill-based decision bonuses, property income and market swings are also larger, creating more capital and more visible portfolio risk within 20 rounds.

## Recommended hosting: Render

Render supports Node/Express web services, WebSockets, automatic HTTPS, and custom domains. Do **not** deploy this as a static site: the multiplayer server must stay running.

### 1. Put this folder on GitHub

1. Create a new empty GitHub repository, for example `wealth-wars-game`.
2. Upload the complete `WealthWars-Deploy` folder to the repository root. The included Blueprint is configured for this folder layout.
3. Commit the files to the main branch.

### 2. Deploy it on Render

The easiest path is **Render Dashboard → New → Blueprint**, then connect the GitHub repository. Render will read `render.yaml` and create the web service.

If you use **New → Web Service** instead, enter:

| Setting | Value |
|---|---|
| Runtime | Node |
| Build command | `npm run build` |
| Start command | `npm start` |
| Health check path | `/health` |
| Environment variable | `NODE_ENV=production` |

After the deploy finishes, open the generated address ending in `.onrender.com`. Test creating a lobby in one browser and joining it from another before connecting the domain.

### 3. Connect a GoDaddy domain

Using a subdomain such as `play.yourdomain.com` is the safest choice because it does not disturb an existing website or email setup.

1. In Render, open the service, go to **Settings → Custom Domains**, and add `play.yourdomain.com`.
2. Copy the service hostname shown by Render, such as `wealth-wars-game.onrender.com`.
3. In GoDaddy, open **Domain Portfolio → your domain → DNS → Add New Record**.
4. Add this record:

| Type | Name | Value | TTL |
|---|---|---|---|
| CNAME | `play` | your Render hostname, such as `wealth-wars-game.onrender.com` | Default / 1 hour |

5. Return to Render and click **Verify** next to the domain.

Render automatically creates and renews the HTTPS certificate. DNS often updates within an hour but can take up to 48 hours globally.

#### If you want to use the root domain

If the game should open at `yourdomain.com` instead of `play.yourdomain.com`, add the root domain in Render first, then configure GoDaddy as follows:

| Type | Name | Value |
|---|---|---|
| A | `@` | `216.24.57.1` |
| CNAME | `www` | your Render hostname |

Remove conflicting A or AAAA records for the same host only after checking that they are not serving an existing site. Do not delete MX or TXT records used for email. A subdomain is recommended if the root domain already hosts anything.

## Important multiplayer hosting notes

- Keep the service at **one instance**. Lobby and game state currently live in server memory; multiple instances would split players across separate game processes.
- A server restart or redeploy ends games in progress. Durable game recovery would require a database or shared key-value store in a future release.
- Render's free web service can sleep after inactivity, so the first visitor may wait for it to wake. For scheduled workshops or reliable live play, upgrade to an always-on paid instance before the event.
- GoDaddy supplies the domain; the multiplayer app should run on a Node/WebSocket-capable host such as Render. Ordinary static or shared website hosting is not sufficient unless it explicitly supports long-running Node processes and WebSockets.

## Local production check

With Node.js 22 installed:

```bash
npm run build
npm start
```

Then open `http://localhost:3002`. Stop the server with `Ctrl+C`.

## Updating the live game

Edit the source, commit it, and push to the connected GitHub repository. Render automatically rebuilds and deploys the new version. Avoid deploying while a live game is running because in-progress state is not persistent.

## Folder map

```text
WealthWars-Deploy/
├── backend/          Express + Socket.IO multiplayer server
├── frontend/         Vite browser game
├── Dockerfile        Portable Docker deployment option
├── render.yaml       One-click Render configuration
├── package.json      Root build/start commands
└── README.md         Hosting and GoDaddy instructions
```

Official references:

- [Render web services](https://render.com/docs/web-services)
- [Render WebSockets](https://render.com/docs/websocket)
- [Render custom domains](https://render.com/docs/custom-domains)
- [Render DNS configuration](https://render.com/docs/configure-other-dns)
- [GoDaddy DNS records](https://help-center-east.dc-aws.godaddy.com/help/manage-dns-records-680)
- [GoDaddy CNAME records](https://help-center-east.dc-aws.godaddy.com/help/add-a-cname-record-19236)
