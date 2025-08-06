interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

interface CareerSyncAnalysis {
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  recommendations: string[];
  role_alignment: string;
}

export const analyzeResumeWithOllama = async (
  resumeText: string, 
  jobDescription: string
): Promise<string> => {
  try {
    const prompt = `Analyze resume vs job description:
RESUME: ${resumeText.substring(0, 2000)}...
JOB: ${jobDescription.substring(0, 1000)}...`;

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'html-model', 
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.9,
          top_k: 40,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data: OllamaResponse = await response.json();
    
    try {
      const analysis: CareerSyncAnalysis = JSON.parse(data.response);
      return formatAnalysisResult(analysis);
    } catch (jsonError) {
      return `📊 Resume Analysis Results:\n\n${data.response}`;
    }

  } catch (error) {
    console.error('Ollama analysis error:', error);

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return `❌ Cannot connect to local AI model. 
      
Please ensure:
1. Ollama is running on your machine
2. Your model 'html-model' is available
3. No firewall is blocking localhost:11434

Run these commands in terminal:
• ollama serve
• ollama run html-model`;
    }
    
    throw error;
  }
};

const formatAnalysisResult = (analysis: CareerSyncAnalysis): string => {
  return `📊 Resume Analysis Results:

🎯 Match Score: ${analysis.match_score}/100

✅ Matched Skills:
${analysis.matched_skills.map(skill => `• ${skill}`).join('\n')}

❌ Missing Skills:
${analysis.missing_skills.map(skill => `• ${skill}`).join('\n')}

💡 Recommendations:
${analysis.recommendations.map(rec => `• ${rec}`).join('\n')}

🔍 Role Alignment: ${analysis.role_alignment}`;
};
export const testOllamaConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch('http://localhost:11434/api/tags', {
      method: 'GET',
    });
    return response.ok;
  } catch {
    return false;
  }
};