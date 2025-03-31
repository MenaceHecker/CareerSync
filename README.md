# CareerSync

CareerSync is a cross-browser, AI-powered Chrome extension that compares your resume against job descriptions to identify missing skills and recommend improvements. It parses PDF and DOCX files, extracts text, and uses GPT (coming soon) to enhance your job application process.

---

## ✨ Features

- Upload and parse resumes in **PDF** and **DOCX** formats
- Paste job descriptions to compare against resume content
- Displays parsed resume text for transparency
- Shows file name and size after upload
- Sleek UI built for Chrome extension popups using **Tailwind CSS**
- Ready for GPT-powered AI analysis and skill suggestions (next step)

---

## 🚀 Tech Stack

- **React** + **TypeScript**
- **Vite** (bundler)
- **Tailwind CSS**
- **pdfjs-dist** (PDF parsing)
- **mammoth** (DOCX parsing)
- **Chrome Extension APIs**
- **GPT integration (coming soon)**

---

## 📦 Dependencies

Make sure these are installed:

```bash
npm install react react-dom
npm install -D typescript vite @vitejs/plugin-react-swc

npm install pdfjs-dist@3 mammoth
npm install -D tailwindcss@3.4.1 postcss autoprefixer
```

---

## ⚙️ Project Setup

```bash
# 1. Clone the repo
git clone https://github.com/your-username/CareerSync.git
cd CareerSync/careersync

# 2. Install dependencies
npm install

# 3. Start development server (optional)
npm run dev

# 4. Build for extension
npm run build
```

---

## 🧩 Load the Extension in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **"Load unpacked"**
4. Select the `dist/` folder from this project
5. Click the CareerSync icon to test the popup

---

## 🧠 Upcoming Features

- 🔌 OpenAI GPT integration
- 📊 Skill match scoring
- ✍️ Smart resume rewriting
- ☁️ Save sessions with AWS Lambda

---

## 📁 Folder Structure

```
careersync/
│
├── public/
│   └── icon.png
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── popup.html
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

---

## 🙌 Contributing

Pull requests and suggestions are welcome! Let’s build the future of AI-assisted job search together.

---

## 📝 License

MIT © 2025 CareerSync
