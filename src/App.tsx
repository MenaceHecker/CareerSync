import { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.js?url';
import mammoth from 'mammoth';
import './index.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

function App() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setResumeFile(file);
    const fileExt = file.name.split('.').pop()?.toLowerCase();

    try {
      if (fileExt === 'pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item: any) => item.str).join(' ') + '\n';
        }
        setResumeText(text);
      } else if (fileExt === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setResumeText(result.value);
      } else {
        alert('Unsupported file type. Please upload a PDF or DOCX.');
      }
    } catch (err) {
      console.error('Error reading resume:', err);
      alert('Error reading resume file.');
    }
  };

  const handleAnalyze = () => {
    if (!resumeText || !jobDescription) {
      alert('Please upload a resume and paste a job description.');
      return;
    }

    setLoading(true);
    setResult(null);

    setTimeout(() => {
      setResult('✅ Resume parsed and ready for AI analysis!');
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="w-[360px] h-[560px] bg-gradient-to-br from-blue-50 to-blue-100 font-sans shadow-xl overflow-auto rounded-md">
      {/* Navbar */}
      <nav className="flex items-center justify-between bg-white shadow px-4 py-2 rounded-t-md">
        <div className="flex items-center space-x-2">
          <img src="./icon.png" alt="CareerSync" className="w-8 h-8 rounded" />
          <span className="text-blue-700 font-semibold text-lg">CareerSync</span>
        </div>
        <span className="text-xs text-gray-400">v1.0</span>
      </nav>

      <div className="p-4">
        <h2 className="text-lg font-bold text-gray-800 text-center mb-1">AI Resume Matcher</h2>
        <p className="text-xs text-center text-gray-500 mb-4">
          Upload your resume and paste a job description below.
        </p>

        {/* Upload Resume */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Upload Resume</label>
          <input
            type="file"
            accept=".pdf,.docx"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
            }}
            className="block w-full text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
          />

          {/* File name + size */}
          {resumeFile && (
            <div className="mt-2 text-xs text-gray-600 bg-white p-2 rounded border border-gray-200">
              <p><strong>📄 File:</strong> {resumeFile.name}</p>
              <p>
                <strong>📦 Size:</strong>{' '}
                {resumeFile.size > 1024 * 1024
                  ? `${(resumeFile.size / (1024 * 1024)).toFixed(2)} MB`
                  : `${(resumeFile.size / 1024).toFixed(1)} KB`}
              </p>
            </div>
          )}
        </div>

        {/* Job Description */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Paste Job Description</label>
          <textarea
            className="w-full h-24 p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
            placeholder="Paste job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>

        {/* Result */}
        {result && (
          <div className="mt-4 p-3 text-green-700 border border-green-300 bg-green-100 rounded text-xs whitespace-pre-wrap max-h-24 overflow-auto">
            {result}
          </div>
        )}

        {/* Resume Preview */}
        {resumeText && (
          <div className="mt-4 text-xs text-gray-600 bg-white p-2 rounded border border-gray-200 max-h-32 overflow-auto whitespace-pre-wrap">
            <strong className="block mb-1 text-gray-800">Parsed Resume Text:</strong>
            {resumeText.slice(0, 1000) + (resumeText.length > 1000 ? '...' : '')}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
