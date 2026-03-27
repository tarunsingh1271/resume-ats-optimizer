import React, { useState } from 'react';
import { Resume } from '../types/interfaces';

interface ResumeInputProps {
  onSubmit: (resume: Resume) => void;
}

export const ResumeInput: React.FC<ResumeInputProps> = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [experience, setExperience] = useState('');
  const [skills, setSkills] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const resume: Resume = {
      name,
      contact,
      experience: experience.split('\n').filter(exp => exp.trim() !== ''),
      skills: skills.split(',').map(skill => skill.trim())
    };

    onSubmit(resume);
  };

  return (
    <div className="resume-input">
      <h2>Resume Details</h2>
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          placeholder="Full Name" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input 
          type="text" 
          placeholder="Contact Information" 
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          required
        />
        <textarea 
          placeholder="Professional Experience (one per line)" 
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          required
        />
        <input 
          type="text" 
          placeholder="Skills (comma-separated)" 
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          required
        />
        <button type="submit">Optimize Resume</button>
      </form>
    </div>
  );
};