import { TextAnalyzer } from '../utils/textAnalysis';
import { JobDescription, Resume, OptimizationResult } from '../types/interfaces';

export class ResumeOptimizer {
  private textAnalyzer: TextAnalyzer;

  constructor() {
    this.textAnalyzer = new TextAnalyzer();
  }

  optimizeResume(resume: Resume, jobDescription: JobDescription): OptimizationResult {
    // Convert resume and job description to text for analysis
    const resumeText = this.convertResumeToText(resume);
    const jobDescriptionText = jobDescription.description;

    // Calculate keyword match percentage
    const keywordMatchScore = this.textAnalyzer.calculateKeywordMatch(
      resumeText, 
      jobDescriptionText
    );

    // Extract relevant keywords from job description
    const jobKeywords = this.textAnalyzer.extractRelevantKeywords(jobDescriptionText);

    // Generate recommendations
    const recommendations = this.generateRecommendations(resume, jobKeywords);

    return {
      score: keywordMatchScore,
      recommendations
    };
  }

  private convertResumeToText(resume: Resume): string {
    return [
      resume.name,
      resume.contact,
      ...resume.experience,
      ...resume.skills
    ].join(' ');
  }

  private generateRecommendations(resume: Resume, jobKeywords: string[]): string[] {
    const recommendations: string[] = [];

    // Check if resume skills match job keywords
    const missingKeywords = jobKeywords.filter(
      keyword => !resume.skills.some(skill => 
        skill.toLowerCase().includes(keyword)
      )
    );

    if (missingKeywords.length > 0) {
      recommendations.push(
        `Consider adding these keywords to your skills: ${missingKeywords.join(', ')}`
      );
    }

    // Check experience depth
    if (resume.experience.length < 2) {
      recommendations.push('Add more detailed professional experience');
    }

    return recommendations;
  }
}