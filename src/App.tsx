import React, { useState } from 'react';
import './App.css';
import { JobDescriptionInput } from './components/JobDescriptionInput';
import { ResumeInput } from './components/ResumeInput';
import { ResumeOptimizer } from './services/resumeOptimizer';
import { JobDescription, Resume, OptimizationResult } from './types/interfaces';
import { 
  generateOptimizedResumePDF, 
  downloadPDF 
} from './utils/pdfGenerator';
import {
  validateJobDescription,
  validateResume,
  handleOptimizationError,
  ValidationError
} from './utils/errorHandling';

const App: React.FC = () => {
  const [jobDescription, setJobDescription] = useState<JobDescription | null>(null);
  const [resume, setResume] = useState<Resume | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleJobDescriptionSubmit = (jd: JobDescription) => {
    try {
      validateJobDescription(jd.description);
      setJobDescription(jd);
      setError(null);
    } catch (err) {
      if (err instanceof ValidationError) {
        setError(err.message);
      }
    }
  };

  const handleResumeSubmit = (res: Resume) => {
    try {
      validateResume(res);
      setResume(res);
      setError(null);
    } catch (err) {
      if (err instanceof ValidationError) {
        setError(err.message);
      }
    }
  };

  const optimizeResume = async () => {
    try {
      if (!jobDescription || !resume) {
        throw new Error('Please provide both job description and resume');
      }

      const optimizer = new ResumeOptimizer();
      const result = optimizer.optimizeResume(resume, jobDescription);
      setOptimizationResult(result);
      setError(null);

      // Generate and download PDF
      const pdfBlob = await generateOptimizedResumePDF(result);
      downloadPDF(pdfBlob);
    } catch (err) {
      const errorMessage = handleOptimizationError(err as Error);
      setError(errorMessage);
    }
  };

  return (
    <div className="App">
      <h1>ATS Resume Optimizer</h1>
      <div className="input-section">
        <JobDescriptionInput onSubmit={handleJobDescriptionSubmit} />
        <ResumeInput onSubmit={handleResumeSubmit} />
      </div>
      {jobDescription && resume && (
        <button onClick={optimizeResume}>
          Optimize Resume
        </button>
      )}
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      {optimizationResult && (
        <div className="optimization-result">
          <h2>Optimization Results</h2>
          <p>ATS Score: {optimizationResult.score.toFixed(2)}%</p>
          <h3>Recommendations:</h3>
          <ul>
            {optimizationResult.recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default App;
