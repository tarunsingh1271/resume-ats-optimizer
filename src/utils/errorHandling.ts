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
  if (!resume.name || resume.name.trim().length < 2) {
    throw new ValidationError('Name must be at least 2 characters long');
  }

  if (!resume.contact || !resume.contact.includes('@')) {
    throw new ValidationError('Please provide a valid contact email');
  }

  if (resume.experience.length === 0) {
    throw new ValidationError('Please add at least one professional experience');
  }

  if (resume.skills.length === 0) {
    throw new ValidationError('Please add at least one skill');
  }
}

export function handleOptimizationError(error: Error): string {
  if (error instanceof ValidationError) {
    return error.message;
  }

  console.error('Unexpected error during resume optimization:', error);
  return 'An unexpected error occurred. Please try again.';
}