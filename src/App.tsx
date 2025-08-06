/// <reference types="chrome" />

import { useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.js?url';
import mammoth from 'mammoth';
import './index.css';
import { analyzeResumeWithJD } from './utils/openai';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

interface H1BResult {
  company: string;
  sponsorsH1B: boolean;
  details: string;
  error?: string;
}

function App() {
  const [activeTab, setActiveTab] = useState<'profile' | 'documents' | 'dashboard'>('documents');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  
  // H1B search states
  const [companyName, setCompanyName] = useState('');
  const [h1bLoading, setH1bLoading] = useState(false);
  const [h1bResult, setH1bResult] = useState<H1BResult | null>(null);

  useEffect(() => {
    chrome.storage?.local.get('jobDescription', (data) => {
      if (data?.jobDescription) {
        setJobDescription(data.jobDescription);
        console.log("Auto-filled JD from content script ");
        
        // Try to extract company name from job description
        extractCompanyName(data.jobDescription);
      }
    });
  }, []);

  const extractCompanyName = (jd: string) => {
    // Simple regex patterns to extract company name
    const patterns = [
      /at ([A-Z][a-zA-Z\s&.,]+?)(?:\s|,|\.|\n)/g,
      /([A-Z][a-zA-Z\s&.,]+?) is looking/gi,
      /([A-Z][a-zA-Z\s&.,]+?) seeks/gi,
      /join ([A-Z][a-zA-Z\s&.,]+?)(?:\s|,|\.|\n)/gi
    ];
    
    for (const pattern of patterns) {
      const match = pattern.exec(jd);
      if (match && match[1] && match[1].length < 50) {
        const extractedName = match[1].trim();
        // Filter out common words that aren't company names
        if (!/(the|and|or|for|with|our|team|department|role|position)$/i.test(extractedName)) {
          setCompanyName(extractedName);
          break;
        }
      }
    }
  };

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

  const handleH1BSearch = async () => {
    if (!companyName.trim()) {
      alert('Please enter a company name to search for H1B sponsorship.');
      return;
    }

    setH1bLoading(true);
    setH1bResult(null);

    try {
      // Send message to content script
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      chrome.tabs.sendMessage(
        tab.id!,
        { action: "searchH1B", companyName: companyName.trim() },
        (response) => {
          setH1bLoading(false);
          if (chrome.runtime.lastError) {
            console.error('Chrome runtime error:', chrome.runtime.lastError);
            setH1bResult({
              company: companyName,
              sponsorsH1B: false,
              details: 'Error communicating with content script.',
              error: chrome.runtime.lastError.message
            });
          } else if (response) {
            setH1bResult(response);
          } else {
            setH1bResult({
              company: companyName,
              sponsorsH1B: false,
              details: 'No response received from search.',
              error: 'No response'
            });
          }
        }
      );
    } catch (err) {
      console.error('H1B search error:', err);
      setH1bLoading(false);
      setH1bResult({
        company: companyName,
        sponsorsH1B: false,
        details: 'Failed to perform H1B search.',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  };

  return (
    <div className="w-[360px] h-[560px] bg-gradient-to-br from-blue-50 to-blue-100 font-sans shadow-xl overflow-auto rounded-md">
      {/* Navbar */}
      <nav className="flex items-center justify-between bg-white shadow px-4 py-2 rounded-t-md">
        <div className="flex items-center space-x-2">
          <img src="./icon.png" alt="CareerSync" className="w-6 h-6 rounded" />
          <span className="text-blue-700 font-bold text-base">CareerSync</span>
        </div>
        <span className="text-xs text-gray-400">v1.0</span>
      </nav>

      {/* Tab Menu */}
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
            <p className="text-gray-600 text-sm">Profile details will go here (Coming soon).</p>
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

            <div className="mb-2 flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700">Job Description</label>
              <button
                className="text-xs text-blue-600 underline"
                onClick={() => {
                  chrome.storage.local.get('jobDescription', (data) => {
                    if (data?.jobDescription) {
                      setJobDescription(data.jobDescription);
                      extractCompanyName(data.jobDescription);
                    } else {
                      alert("No job description found on this page.");
                    }
                  });
                }}
              >
                🔁 Scan page again
              </button>
            </div>

            <textarea
              className="w-full h-24 p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
              placeholder="Paste or auto-detected job description..."
              value={jobDescription}
              onChange={(e) => {
                setJobDescription(e.target.value);
                extractCompanyName(e.target.value);
              }}
            />

            {/* H1B Search Section */}
            <div className="mt-4 p-3 bg-white rounded border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🏢 H1B Sponsorship Check
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="Company name..."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
                <button
                  onClick={handleH1BSearch}
                  disabled={h1bLoading}
                  className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50 text-sm"
                >
                  {h1bLoading ? '🔍' : 'Check'}
                </button>
              </div>
              
              {h1bResult && (
                <div className={`mt-3 p-2 rounded text-xs ${
                  h1bResult.error 
                    ? 'bg-red-100 border border-red-300 text-red-700'
                    : h1bResult.sponsorsH1B 
                      ? 'bg-green-100 border border-green-300 text-green-700'
                      : 'bg-yellow-100 border border-yellow-300 text-yellow-700'
                }`}>
                  <div className="font-medium mb-1">
                    {h1bResult.error ? '❌ Error' : h1bResult.sponsorsH1B ? '✅ Likely Sponsors H1B' : '⚠️ Unclear/No Sponsorship'}
                  </div>
                  <div className="text-xs">
                    <strong>Company:</strong> {h1bResult.company}
                  </div>
                  <div className="text-xs mt-1">
                    <strong>Details:</strong> {h1bResult.details}
                  </div>
                  {h1bResult.error && (
                    <div className="text-xs mt-1 text-red-600">
                      <strong>Error:</strong> {h1bResult.error}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full mt-3 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
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
            <p className="text-gray-600 text-sm">Coming soon: Visual insights, match score, GPT suggestions.</p>
            
            {/* Quick H1B Overview */}
            {h1bResult && (
              <div className="mt-4 p-3 bg-white rounded border border-gray-200">
                <h3 className="font-medium text-gray-800 mb-2">Recent H1B Check</h3>
                <div className={`text-sm ${
                  h1bResult.sponsorsH1B ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  <div><strong>{h1bResult.company}</strong></div>
                  <div className="text-xs mt-1">{h1bResult.details}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;