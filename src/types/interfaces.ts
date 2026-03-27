export interface JobDescription {
  title: string;
  description: string;
  keywords: string[];
}

export interface Resume {
  name: string;
  contact: string;
  experience: string[];
  skills: string[];
}

export interface OptimizationResult {
  score: number;
  recommendations: string[];
}