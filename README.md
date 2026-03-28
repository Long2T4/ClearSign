# ClearSign

> A browser-based document signing platform — no plugins, no installs.

ClearSign lets users upload, view, and sign documents directly in the browser. It supports PDFs, Word documents, and HEIC images out of the box, with user authentication and cloud storage powered by Supabase.

---

## 🛠 Tech Stack

| | Technology |
|---|---|
| **Frontend** | React 19 + Vite 8 |
| **Styling** | Tailwind CSS v4 |
| **Backend / Auth / DB** | Supabase |
| **PDF Rendering** | PDF.js |
| **DOCX Parsing** | Mammoth.js |
| **HEIC Conversion** | heic2any |

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/Long2T4/ClearSign.git
cd ClearSign
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> Find these in your Supabase project under **Settings → API**.

### 3. Run

```bash
npm run dev
```

App will be live at `http://localhost:5173`.

---

## 📜 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

---

## 📁 Project Structure

```
ClearSign/
├── public/          # Static assets
├── src/             # React source code
├── index.html       # HTML entry point
├── vite.config.js   # Vite config
└── package.json
```

---

## ☁️ Deployment

```bash
npm run build
```

Deploy the generated `dist/` folder to any static host (Vercel, Netlify, GitHub Pages). Make sure to set your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables in your host's settings — Vite embeds them at build time.
