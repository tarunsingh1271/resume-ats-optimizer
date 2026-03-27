import React, { useState, useRef } from 'react';
import { Resume } from '../types/interfaces';

interface ResumeInputProps {
  onSubmit: (resume: Resume) => void;
}

export const ResumeInput: React.FC<ResumeInputProps> = ({ onSubmit }) => {
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
      } else {
        alert('Please upload a PDF file');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a PDF file');
      return;
    }

    // TODO: Implement PDF parsing logic here
    // For now, we'll use placeholder data
    const resume: Resume = {
      name: file.name.replace('.pdf', ''),
      contact: '',
      experience: [],
      skills: []
    };

    onSubmit(resume);
  };

  return (
    <div className="resume-input">
      <h2>Upload Resume</h2>
      <form onSubmit={handleSubmit}>
        <div className="file-upload">
          <label htmlFor="resume-file">Upload your resume (PDF)</label>
          <input
            id="resume-file"
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            ref={fileInputRef}
            required
          />
          <p className="file-info">
            {file ? `Selected file: ${file.name}` : 'No file selected'}
          </p>
        </div>
        <button type="submit" disabled={!file}>
          Optimize Resume
        </button>
      </form>
    </div>
  );
};