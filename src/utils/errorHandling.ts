export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateJobDescription(description: string): void {
  if (!description || description.trim().length < 50) {
    throw new ValidationError('Job description must be at least 50 characters long');
  }
}

export function validateResume(resume: {
  name: string;
  contact: string;
  experience: string[];
  skills: string[];
}): void {
  // For now, we'll only validate that a name exists since we're using PDF upload
  if (!resume.name) {
    throw new ValidationError('Please upload a valid PDF file');
  }
}

export function handleOptimizationError(error: Error): string {
  if (error instanceof ValidationError) {
    return error.message;
  }

  console.error('Unexpected error during resume optimization:', error);
  return 'An unexpected error occurred. Please try again.';
}