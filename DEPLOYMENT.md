# Production Deployment Guide - InterviewPilot AI

This guide contains deployment checklists, platform-specific configurations, environment variable structures, and troubleshooting tips to release **InterviewPilot AI** to production.

---

## 🚀 1. Production Verification Checklist

Before deploying, ensure:
- [x] All 27 Vitest unit tests pass (`npm run test`).
- [x] Production build compiles successfully (`npm run build`).
- [x] Exclusions for `.env` and log files are committed inside `.gitignore`.
- [x] SEO attributes (Canonical tags, Open Graph meta assets, Favicon, `manifest.json`) are set inside `index.html`.
- [x] Crawl files (`robots.txt` and `sitemap.xml`) are present inside `/public`.

---

## 🌐 2. Deployment on Vercel

Vercel provides zero-configuration deployment for Vite React single-page applications.

### Deploying via Vercel Git Integration (Recommended)
1. Import your project repository into Vercel from GitHub.
2. Vercel automatically detects Vite as the framework.
3. Configure the following project parameters:
   * **Framework Preset:** `Vite`
   * **Build Command:** `npm run build` (or `vite build`)
   * **Output Directory:** `dist`
4. Add the required Environment Variables (see Section 4).
5. Click **Deploy**.

### Deploying via Vercel CLI
If you prefer terminal-based deployment:
1. Install the CLI: `npm install -g vercel`
2. Run `vercel` and authenticate.
3. Answer the project prompts, setting the build command to `npm run build` and build destination output folder to `dist`.

*Note: Since InterviewPilot AI utilizes `HashRouter`, you do NOT need to configure routing rewrites inside `vercel.json`. Pages are served statically and routing is resolved entirely inside the client.*

---

## ☁️ 3. Deployment on Netlify

Netlify hosts static projects directly from Git connections or local folders.

### Deploying via Netlify Git Integration
1. Link your repository in the Netlify dashboard.
2. Configure build configurations:
   * **Build Command:** `npm run build`
   * **Publish Directory:** `dist`
3. Add the required Environment Variables in **Site settings > Environment variables**.
4. Click **Deploy site**.

---

## 🔑 4. Environment Variables Reference

Define these parameters on your host provider's configuration dashboard:

| Variable Name | Required | Example Value | Description |
| :--- | :---: | :--- | :--- |
| `VITE_GEMINI_API_KEY` | Yes (or client) | `AIzaSyB...` | Key obtained from Google AI Studio. |
| `VITE_JUDGE0_API_URL` | No | `https://judge0-ce.p.rapidapi.com` | Root endpoint of the Judge0 compiler engine. |
| `VITE_JUDGE0_API_KEY` | No | `your_rapidapi_key_here` | RapidAPI credential for Judge0 endpoint authentication. |
| `VITE_JUDGE0_HOST_HEADER` | No | `judge0-ce.p.rapidapi.com` | Host gateway header required by RapidAPI. |

---

## 🛠️ 5. Troubleshooting & FAQ

### 1. Direct Page Reloads return 404
* **Cause:** The site is utilizing standard `BrowserRouter` without rewrite rules on the server.
* **Solution:** InterviewPilot AI is configured to use **`HashRouter`** to bypass this. Ensure that routes in `src/App.tsx` are wrapped with `<HashRouter>` (which is set by default). Direct links must follow the hash format (e.g. `https://yourdomain.com/#/dashboard`).

### 2. Quota Resource Exhausted (429 Errors)
* **Cause:** Frequent Gemini calls on the free tier exceeding rate limits (15 RPM).
* **Solution:** 
  1. Practice code interviews which preload questions, dropping active session calls to only 2 requests (start and finish).
  2. Increase the interval between interview question transitions, or suggest users paste private Gemini credentials inside app Settings (stored inside local sandbox storage).

### 3. Judge0 code execution fails
* **Cause:** Public Judge0 endpoint rate limits exceeded.
* **Solution:** Configure a private self-hosted Judge0 compiler server, and update `VITE_JUDGE0_API_URL` on the host dashboard to point to your container endpoint.
