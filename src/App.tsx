import { useState } from 'react';
import './index.css';

function App() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleAnalyze = () => {
    if (!resumeFile || !jobDescription) {
      alert("Please upload a resume and paste a job description.");
      return;
    }

    setLoading(true);
    setResult(null);

    setTimeout(() => {
      setResult("✅ Analysis complete! (This is a placeholder)");
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="w-[350px] p-4 font-sans bg-white rounded-xl shadow-lg text-sm">
      <div className="flex flex-col items-center mb-4">
        <img
          src="./icon.png"
          alt="CareerSync Logo"
          className="w-16 h-16 mb-2 rounded-md shadow"
        />
        <h1 className="text-xl font-bold text-blue-700">CareerSync</h1>
        <p className="text-gray-500 text-xs text-center">AI-powered resume matcher</p>
      </div>

      <div className="mb-3">
        <label className="block font-medium text-gray-700 mb-1">Upload Resume</label>
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
          className="block w-full text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
        />
      </div>

      <div className="mb-3">
        <label className="block font-medium text-gray-700 mb-1">Paste Job Description</label>
        <textarea
          className="w-full h-28 p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
          placeholder="Paste job description here..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />
      </div>

      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="w-full mt-2 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? 'Analyzing...' : 'Analyze'}
      </button>

      {result && (
        <div className="mt-4 p-3 text-green-700 border border-green-300 bg-green-100 rounded text-xs">
          {result}
        </div>
      )}
    </div>
  );
}

export default App;
