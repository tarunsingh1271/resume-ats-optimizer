import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import { ResumeOptimizer, AIProvider, ModelOption } from './services/resumeOptimizer';
import { JobDescription, Resume, OptimizationResult } from './types/interfaces';
import { generateOptimizedResumePDF, downloadPDF } from './utils/pdfGenerator';
import { generateDocx } from './utils/docxGenerator';
import { extractTextFromFile } from './utils/fileParser';

const App: React.FC = () => {
  const [provider, setProvider] = useState<AIProvider>('Gemini');
  const [model, setModel] = useState<string>('gemini-2.5-flash');
  const [apiKey, setApiKey] = useState<string>('');
  
  const [availableModels, setAvailableModels] = useState<ModelOption[] | null>(null);
  const [isCheckingModels, setIsCheckingModels] = useState<boolean>(false);
  const [keyMessage, setKeyMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [jobDescription, setJobDescription] = useState<string>('');
  const [jobTitle, setJobTitle] = useState<string>('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Editable template state
  const [editableResume, setEditableResume] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedProvider = localStorage.getItem('aiProvider') as AIProvider;
    const savedApiKey = localStorage.getItem('aiApiKey');
    const savedModel = localStorage.getItem('aiModel');
    if (savedProvider) setProvider(savedProvider);
    if (savedApiKey) setApiKey(savedApiKey);
    if (savedModel) setModel(savedModel);
  }, []);

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value as AIProvider;
    setProvider(newProvider);
    localStorage.setItem('aiProvider', newProvider);
    const defaultModel = newProvider === 'Gemini' ? 'gemini-2.5-flash' : 'gpt-4o-mini';
    setModel(defaultModel);
    localStorage.setItem('aiModel', defaultModel);
    
    setAvailableModels(null);
    setKeyMessage(null);
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value;
    setModel(newModel);
    localStorage.setItem('aiModel', newModel);
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKey = e.target.value;
    setApiKey(newKey);
    localStorage.setItem('aiApiKey', newKey);
    setAvailableModels(null);
    setKeyMessage(null);
  };

  const handleCheckModels = async () => {
    if (!apiKey.trim()) {
      setKeyMessage({ text: 'Please enter an API key first.', type: 'error' });
      return;
    }

    setIsCheckingModels(true);
    setKeyMessage(null);

    try {
      const optimizer = new ResumeOptimizer();
      const models = await optimizer.fetchAvailableModels(provider, apiKey);
      if (models.length > 0) {
        setAvailableModels(models);
        setModel(models[0].id);
        localStorage.setItem('aiModel', models[0].id);
        setKeyMessage({ text: `Success! Loaded ${models.length} models for this key.`, type: 'success' });
      } else {
        setKeyMessage({ text: 'Key valid, but no text-generation models found.', type: 'error' });
      }
    } catch (err) {
      setAvailableModels(null);
      setKeyMessage({ text: err instanceof Error ? err.message : 'Invalid API Key', type: 'error' });
    } finally {
      setIsCheckingModels(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const filename = selectedFile.name.toLowerCase();
      
      if (filename.endsWith('.pdf') || filename.endsWith('.docx')) {
        setResumeFile(selectedFile);
        setError(null);
      } else {
        setError('Please upload a valid PDF or DOCX file for the resume.');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const handleOptimize = async () => {
    try {
      if (!apiKey.trim()) throw new Error('Please enter your AI Provider API Key in the settings.');
      if (!jobTitle.trim() || !jobDescription.trim()) throw new Error('Please provide both Job Title and Job Description.');
      if (!resumeFile) throw new Error('Please upload a Resume PDF or DOCX.');

      setIsProcessing(true);
      setError(null);
      setOptimizationResult(null);
      setEditableResume('');

      const jdObj: JobDescription = {
        title: jobTitle,
        description: jobDescription,
        keywords: [] 
      };

      // 1. Extract Text from PDF or DOCX dynamically
      const fileText = await extractTextFromFile(resumeFile);
      if (!fileText || fileText.trim().length === 0) {
        throw new Error('Could not extract text from the file. It might be image-based or empty.');
      }

      const resumeObj: Resume = {
        name: resumeFile.name.split('.')[0],
        contact: '',
        experience: [fileText], 
        skills: []
      };

      // 2. Fetch Optimization & Rewrite
      const optimizer = new ResumeOptimizer();
      const result = await optimizer.optimizeResumeWithAI(resumeObj, jdObj, provider, model, apiKey.trim());
      
      setOptimizationResult(result);
      setEditableResume(result.rewritten_resume); // Pre-fill editable UI!

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during optimization.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Dual Export handlers
  const downloadAsPDF = async () => {
    if (!optimizationResult || !resumeFile) return;
    try {
      const jdObj = { title: jobTitle, description: jobDescription, keywords: [] };
      // Passing the user's tweaked text to override the raw parse string
      const pdfBlob = await generateOptimizedResumePDF(optimizationResult, editableResume, jdObj);
      downloadPDF(pdfBlob, `ATS_${resumeFile.name.split('.')[0]}.pdf`);
    } catch (err) {
      setError("Failed to build the PDF file.");
    }
  };

  const downloadAsDOCX = async () => {
    if (!optimizationResult || !resumeFile) return;
    try {
      const docxBlob = await generateDocx(editableResume, `ATS Optimized Resume - ${jobTitle}`);
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(docxBlob);
      link.download = `ATS_${resumeFile.name.split('.')[0]}.docx`;
      link.click();
    } catch (err) {
      setError("Failed to build the DOCX file.");
    }
  };

  return (
    <div className="App">
      <header>
        <h1>AI Resume Optimizer</h1>
        <p className="subtitle">Level up your resume with deep semantic analysis from an AI to beat any Applicant Tracking System.</p>
      </header>

      <main className="main-container">

        <div className="settings-panel input-group">
          <div className="settings-header">
            <h3>🤖 AI Provider Settings</h3>
            <span className="badge">Bring Your Own Key</span>
          </div>
          
          <div className="settings-fields" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={provider} onChange={handleProviderChange} className="provider-select">
              <option value="Gemini">Google Gemini</option>
              <option value="OpenAI">OpenAI</option>
            </select>
            
            <input 
              type="password"
              placeholder={`Paste your ${provider} API Key here`}
              value={apiKey}
              onChange={handleApiKeyChange}
              required
            />
            
            <button 
              className="check-key-btn" 
              onClick={handleCheckModels} 
              disabled={isCheckingModels || !apiKey.trim()}
            >
              {isCheckingModels ? 'Checking...' : 'Check Models'}
            </button>
          </div>

          <div style={{ paddingBottom: '0.75rem' }}>
            <select value={model} onChange={handleModelChange} className="provider-select" style={{ maxWidth: '100%' }}>
              {availableModels ? (
                availableModels.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))
              ) : provider === 'Gemini' ? (
                <>
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                  <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Preview)</option>
                </>
              ) : (
                <>
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </>
              )}
            </select>
          </div>

          {keyMessage && (
            <small className={`settings-hint ${keyMessage.type === 'success' ? 'text-success' : 'text-error'}`}>
              {keyMessage.text}
            </small>
          )}
          {!keyMessage && (
            <small className="settings-hint">Your key is stored securely in your browser's local storage.</small>
          )}
        </div>
        
        <div className="input-group">
          <label htmlFor="jobTitle">Target Job Title</label>
          <input 
            id="jobTitle"
            type="text" 
            placeholder="e.g. Senior Frontend Engineer" 
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label htmlFor="jobDescription">Job Description</label>
          <textarea 
            id="jobDescription"
            placeholder="Paste the full job description here..." 
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>

        <div 
          className="file-upload-wrapper" 
          onClick={() => fileInputRef.current?.click()}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          {resumeFile ? (
            <span className="file-name">{resumeFile.name}</span>
          ) : (
            <span>Click to upload your Resume (.PDF or .DOCX format)</span>
          )}
          <input
            type="file"
            accept=".pdf, .docx, application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileChange}
            onClick={(e) => e.stopPropagation()}
            ref={fileInputRef}
          />
        </div>

        <button 
          className="optimize-btn" 
          onClick={handleOptimize}
          disabled={isProcessing || !jobTitle.trim() || !jobDescription.trim() || !resumeFile || !apiKey.trim()}
        >
          {isProcessing ? (
            <>
              <div className="loader"></div>
              AI is Optimizing...
            </>
          ) : 'Analyze, Refactor & Optimize Resume'}
        </button>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

      </main>

      {optimizationResult && (
        <div className="optimization-result">
          <div className="result-header">
            <h2>AI Optimization Profile</h2>
            <div className={`score-badge ${optimizationResult.score >= 80 ? '' : optimizationResult.score >= 50 ? 'medium' : 'low'}`}>
              {optimizationResult.score.toFixed(0)}% Match Target
            </div>
          </div>
          
          <div className="recommendations" style={{ marginBottom: "2rem" }}>
            <h3>Strategic AI Advice:</h3>
            <ul>
              {optimizationResult.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
          
          <div className="template-editor-wrapper">
             <div className="settings-header">
                <h3>✍️ Interactive AI Resume Template</h3>
                <span className="badge">Editable View</span>
             </div>
             <p className="subtitle" style={{textAlign: "left", marginBottom: "1rem"}}>
               The AI has fully rewritten your resume to maximize your ATS standing for this role.
               You can click below to edit the phrasing, fix specific bullet points, or delete hallucinated sections before downloading it.
             </p>
             
             <textarea 
               className="resume-editor-pane"
               value={editableResume}
               onChange={(e) => setEditableResume(e.target.value)}
             />

             <div className="export-action-row">
               <button className="export-btn docx-btn" onClick={downloadAsDOCX}>
                 <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                 Download as DOCX (Word)
               </button>
               <button className="export-btn pdf-btn" onClick={downloadAsPDF}>
                 <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
                 Download as PDF
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
