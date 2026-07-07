# Development & Deployment Guide - InterviewPilot AI

This guide contains detailed development workflows, testing instructions, build validations, deployment guides, and contribution guidelines for **InterviewPilot AI**.

---

## 🚀 1. Local Development Setup

### Prerequisites
* **Node.js**: v20.x or later.
* **NPM**: v10.x or later.

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/InterviewPilot-AI.git
   cd InterviewPilot-AI
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the root directory:
   ```env
   # Google Gemini API Credentials
   VITE_GEMINI_API_KEY=your_gemini_api_key_here

   # Judge0 Code Execution API Credentials (Optional - Default values point to public CE endpoints)
   VITE_JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
   VITE_JUDGE0_API_KEY=your_rapidapi_key_here
   VITE_JUDGE0_HOST_HEADER=judge0-ce.p.rapidapi.com
   ```

4. **Launch the local development server:**
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173`.

---

## 🧪 2. Run Test Suites & Linter

To guarantee production stability before commits or deployments:

### Run Unit Tests (Vitest)
Unit tests cover JSON parser schema validation, Gemini completions, 429 quota exception fallbacks, base64 codecs, and Judge0 mappings:
```bash
npm run test
```

### Run Static Analysis (Linter)
The project utilizes `oxlint` for high-speed, comprehensive code quality checks:
```bash
npm run lint
```

---

## 📦 3. Production Build & Validation

Verify that TypeScript types check successfully and the bundler splits chunks correctly:

```bash
# Runs TypeScript compiler check and Vite build
npm run build
```

This generates a optimized `/dist` folder with split route chunks:
* `index-*.js`: Core framework runtime (React, React Router, common states).
* `AIInterview-*.js`: Mock room orchestrator, voice recognition controllers, and session loaders.
* `InterviewSetup-*.js`: Large dependencies (Mammoth.js, resume parsers) dynamically split so they do not impact landing page speeds.

---

## 🚀 4. Deployment Workflows

### Deploying to Vercel (Recommended)
Since the app uses client-side routing with HashRouter, it is fully compatible with Vercel's zero-config deployment:

1. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```
2. Deploy the project:
   ```bash
   vercel
   ```
3. Set the build output directory to `dist` when prompted, or configure it in `vercel.json`:
   ```json
   {
     "cleanUrls": true,
     "framework": "vite"
   }
   ```

### Deploying to GitHub Pages
1. Install the `gh-pages` development utility:
   ```bash
   npm install --save-dev gh-pages
   ```
2. Update `vite.config.ts` to configure the base repository path:
   ```typescript
   export default defineConfig({
     base: '/InterviewPilot-AI/',
     // ...other configs
   });
   ```
3. Add deployment scripts in `package.json`:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```
4. Run the deploy task:
   ```bash
   npm run deploy
   ```

---

## 🤝 5. Contributing Guidelines

We welcome contributions to improve mock interviews, analysis tools, or compiler pipelines!

1. **Fork** the repository and create your branch:
   ```bash
   git checkout -b feature/AmazingImprovement
   ```
2. **Commit** your changes with clear, structured messages:
   ```bash
   git commit -m "feat: optimize Monaco autocomplete listings"
   ```
3. **Verify** that code builds and all tests pass:
   ```bash
   npm run test
   npm run build
   ```
4. **Push** your branch and open a **Pull Request** explaining:
   * What issue is addressed.
   * Details of visual or logic changes.
   * Testing done to guarantee zero regressions.

---

## 📝 6. License & Credits

* **License**: Distributed under the **MIT License**. See `LICENSE` for details.
* **Credits**: Built and maintained by **Yash Mohite**.
