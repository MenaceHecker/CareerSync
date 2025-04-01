import { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.js?url';
import mammoth from 'mammoth';
import './index.css';
import { analyzeResumeWithJD } from './utils/openai';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

function App() {
  const [activeTab, setActiveTab] = useState<'profile' | 'documents' | 'dashboard'>('documents');
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

  const handleAnalyze = async () => {
    if (!resumeText || !jobDescription) {
      alert('Please upload a resume and paste a job description.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await analyzeResumeWithJD(resumeText, jobDescription);
      setResult(response || 'No analysis returned.');
    } catch (err) {
      console.error('OpenAI API error:', err);
      setResult('❌ Failed to analyze. Please check your API key or network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-[360px] h-[560px] bg-gradient-to-br from-blue-50 to-blue-100 font-sans shadow-xl overflow-auto rounded-md">
      {/* Top Navbar */}
      <nav className="flex justify-between items-center px-4 py-2 bg-white shadow rounded-t-md text-sm">
        <div className="flex items-center space-x-2">
          <img src="./icon.png" alt="CareerSync" className="w-6 h-6 rounded" />
          <span className="text-blue-700 font-bold text-base">CareerSync</span>
        </div>
        <span className="text-xs text-gray-400">v1.0</span>
      </nav>

      {/* Tab Buttons */}
      <div className="flex justify-around bg-white text-sm border-b border-gray-200">
        {['profile', 'documents', 'dashboard'].map((tab) => (
          <button
            key={tab}
            className={`flex-1 py-2 transition ${
              activeTab === tab
                ? 'text-blue-600 border-b-2 border-blue-600 font-semibold'
                : 'text-gray-500 hover:text-blue-600'
            }`}
            onClick={() => setActiveTab(tab as any)}
          >
            {tab === 'profile' && '👤 Profile'}
            {tab === 'documents' && '📄 Documents'}
            {tab === 'dashboard' && '📊 Dashboard'}
          </button>
        ))}
      </div>

      <div className="p-4 text-sm">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">Your Profile</h2>
            <p className="text-gray-600 text-sm">Only certified Joes can access this menu.</p>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <>
            <h2 className="text-lg font-bold text-gray-800 text-center mb-2">Resume Matcher</h2>

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

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Paste Job Description</label>
              <textarea
                className="w-full h-24 p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
                placeholder="Paste job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Analyzing with GPT...' : 'Analyze'}
            </button>

            {result && (
              <div className="mt-4 p-3 text-green-700 border border-green-300 bg-green-100 rounded text-xs whitespace-pre-wrap max-h-24 overflow-auto">
                {result}
              </div>
            )}

            {resumeText && (
              <div className="mt-4 text-xs text-gray-600 bg-white p-2 rounded border border-gray-200 max-h-32 overflow-auto whitespace-pre-wrap">
                <strong className="block mb-1 text-gray-800">Parsed Resume Text:</strong>
                {resumeText.slice(0, 1000) + (resumeText.length > 1000 ? '...' : '')}
              </div>
            )}
          </>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">Dashboard</h2>
            <p className="text-gray-600 text-sm">When is this gonna come out?</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
