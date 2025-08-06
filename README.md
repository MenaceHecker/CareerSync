# CareerSync - Resume Matcher Extension

A Chrome extension that analyzes resumes against job descriptions using a locally fine-tuned AI model.

## 🤖 AI Model Setup

CareerSync uses a fine-tuned Phi-3 model running locally via Ollama for privacy and cost-effectiveness.

### Option 1: Use Pre-trained Model
Download the fine-tuned model from our releases:
1. Go to [Releases](https://github.com/yourusername/careersync/releases)
2. Download `careersync-model.gguf` 
3. Place it in your models directory

### Option 2: Train Your Own Model
1. Open `training/fine-tune.ipynb` in Google Colab
2. Upload the training dataset from `training/dataset.json`
3. Follow the notebook instructions to fine-tune
4. Download the generated GGUF file

### Setting up Ollama
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Create the model
ollama create html-model -f training/Modelfile

# Start the model
ollama serve
ollama run html-model
```

## 📦 Installation

1. Clone this repository
```bash
git clone https://github.com/yourusername/careersync.git
cd careersync
```

2. Install dependencies
```bash
npm install
```

3. Build the extension
```bash
npm run build:extension
```

4. Load in Chrome
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

## 🚀 Usage

1. **Start Ollama**: `ollama serve`
2. **Navigate to a job posting** on supported sites (LinkedIn, Indeed, etc.)
3. **Click the CareerSync extension icon**
4. **Upload your resume** (PDF or DOCX)
5. **Click "Analyze"** for AI-powered matching

## 🎯 Features

- **Smart Resume Matching**: AI-powered analysis of resume vs job requirements
- **Skill Gap Analysis**: Identifies missing skills and provides recommendations
- **H1B Sponsorship Check**: Searches for visa sponsorship information
- **Multi-platform Support**: Works on 20+ job sites
- **Privacy-First**: All analysis happens locally, no data sent to cloud

## 📊 Training Data

The model was trained on diverse resume-job description pairs covering:
- Software Engineering roles
- Marketing positions  
- Data Science jobs
- UX/UI Design roles
- And more...

For the complete training dataset, see `training/dataset.json`.

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines.

## 📄 License

MIT License - see LICENSE file for details. Joe, Jerry and Jimmy reserve the rights © 2025 CareerSync



