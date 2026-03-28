import { JobDescription, Resume, OptimizationResult } from '../types/interfaces';

export interface ModelOption {
  id: string;
  name: string;
}

export type AIProvider = 'OpenAI' | 'Gemini';

export class ResumeOptimizer {
  
  async fetchAvailableModels(provider: AIProvider, apiKey: string): Promise<ModelOption[]> {
    if (!apiKey.trim()) return [];
    
    if (provider === 'OpenAI') {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`
        }
      });
      if (!response.ok) throw new Error('Invalid OpenAI API Key');
      const data = await response.json();
      // Filter for GPT chat models
      const models = data.data
        .filter((model: any) => model.id.startsWith('gpt'))
        .map((model: any) => ({
          id: model.id,
          name: model.id
        }));
      // Sort alphabetically, perhaps move 4o up
      return models.sort((a: any, b: any) => a.id.localeCompare(b.id));
    } else {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`);
      if (!response.ok) throw new Error('Invalid Gemini API Key');
      const data = await response.json();
      
      // Filter for text generation models
      const models = data.models
        .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m: any) => {
          // clean up the 'models/' prefix for the raw ID
          const rawId = m.name.replace('models/', '');
          return {
            id: rawId,
            name: m.displayName || rawId
          };
        });
      return models;
    }
  }

  async optimizeResumeWithAI(
    resume: Resume, 
    jobDescription: JobDescription,
    provider: AIProvider,
    model: string,
    apiKey: string
  ): Promise<OptimizationResult> {
    
    // ... setup prompts
    const resumeText = resume.experience[0] || ''; 
    const jdText = jobDescription.description;

    const systemPrompt = `You are an expert technical recruiter and ATS software analyzer.
You will be given a Target Job Description and a candidate's Resume text.
Analyze the resume based on the job description.
Identify missing keywords, formatting issues affecting readability, or lacking experience.

Provide a JSON response containing exactly three fields:
1. "score": An integer from 0 to 100 representing the ATS match percentage.
2. "recommendations": An array of exactly 3 strings. Each string must be a highly specific, actionable recommendation to improve their resume for this specific role.
3. "rewritten_resume": A complete, professionally written, ATS-compliant plain-text version of the resume that fully incorporates all your recommendations. Optimize bullet points with strong action verbs and relevant keywords from the job description. Do not use complex markdown or tables. Use simple, clean text spacing. Only return the JSON object, NO markdown formatting around it.`;

    const userPrompt = `Job Description:
${jdText}

---

Resume:
${resumeText}`;

    if (provider === 'OpenAI') {
      return this.callOpenAI(systemPrompt, userPrompt, model, apiKey);
    } else {
      return this.callGemini(systemPrompt, userPrompt, model, apiKey);
    }
  }

  private async callOpenAI(systemPrompt: string, userPrompt: string, model: string, apiKey: string): Promise<OptimizationResult> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const resultString = data.choices[0].message.content;
    
    try {
      const parsed = JSON.parse(resultString);
      return {
        score: typeof parsed.score === 'number' ? parsed.score : parseInt(parsed.score, 10),
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        rewritten_resume: parsed.rewritten_resume || "Failed to generate rewritten resume string."
      };
    } catch (e) {
      throw new Error('Failed to parse JSON response from OpenAI.');
    }
  }

  private async callGemini(systemPrompt: string, userPrompt: string, model: string, apiKey: string): Promise<OptimizationResult> {
    
    // Gemini 1.0 Pro doesn't fully document or support systemInstructions in the same way, but 1.5 versions do.
    // If a user selects gemini-pro (1.0), we wrap the system instruction into the user prompt to avoid crashes.
    const isLegacy = model === 'gemini-pro';
    let payload;
    
    if (isLegacy) {
        payload = {
            contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
            generationConfig: { temperature: 0.3 }
        };
    } else {
        payload = {
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: userPrompt }] }],
            generationConfig: { temperature: 0.3 }
        };
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Gemini API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No valid response from Gemini API.');
    }

    const resultString = data.candidates[0].content.parts[0].text;

    try {
      // Strip markdown code block wrappers if Gemini decided to wrap the JSON
      const cleanString = resultString.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanString);
      return {
        score: typeof parsed.score === 'number' ? parsed.score : parseInt(parsed.score, 10),
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        rewritten_resume: parsed.rewritten_resume || "Failed to generate rewritten resume string."
      };
    } catch (e) {
      console.error("Failed to parse", resultString);
      throw new Error('Failed to parse the AI response into the expected format. Please try optimizing again.');
    }
  }
}