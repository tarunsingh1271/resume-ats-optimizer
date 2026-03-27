import React, { useState } from 'react';
import { JobDescription } from '../types/interfaces';

interface JobDescriptionInputProps {
  onSubmit: (jobDescription: JobDescription) => void;
}

export const JobDescriptionInput: React.FC<JobDescriptionInputProps> = ({ onSubmit }) => {
  const [jobTitle, setJobTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic keyword extraction
    const keywords = description
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 20);

    const jobDescription: JobDescription = {
      title: jobTitle,
      description,
      keywords
    };

    onSubmit(jobDescription);
  };

  return (
    <div className="job-description-input">
      <h2>Job Description</h2>
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          placeholder="Job Title" 
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          required
        />
        <textarea 
          placeholder="Paste Job Description" 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <button type="submit">Analyze Job Description</button>
      </form>
    </div>
  );
};