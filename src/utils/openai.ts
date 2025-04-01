import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export const analyzeResumeWithJD = async (resume: string, jd: string) => {
  const systemPrompt = `You are an expert career coach. Compare the given resume and job description. Return:
- A list of missing skills (if any)
- A brief analysis of fit
- Suggestions to improve the resume`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Resume:\n${resume}\n\nJob Description:\n${jd}` },
  ] as Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages,
    temperature: 0.7,
  });

  return completion.choices[0].message?.content;
};
