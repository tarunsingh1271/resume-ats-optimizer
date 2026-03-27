import { 
  validateJobDescription, 
  validateResume, 
  handleOptimizationError,
  ValidationError 
} from './errorHandling';

describe('Error Handling', () => {
  describe('validateJobDescription', () => {
    test('throws error for short job description', () => {
      expect(() => validateJobDescription('Short desc'))
        .toThrow(ValidationError);
    });

    test('passes for sufficiently long description', () => {
      expect(() => validateJobDescription('This is a detailed job description with more than 50 characters'))
        .not.toThrow();
    });
  });

  describe('validateResume', () => {
    const validResume = {
      name: 'John Doe',
      contact: 'john@example.com',
      experience: ['Software Engineer at XYZ'],
      skills: ['React', 'TypeScript']
    };

    test('throws error for invalid name', () => {
      expect(() => validateResume({...validResume, name: ''}))
        .toThrow(ValidationError);
    });

    test('throws error for invalid contact', () => {
      expect(() => validateResume({...validResume, contact: 'invalid'}))
        .toThrow(ValidationError);
    });

    test('throws error for empty experience', () => {
      expect(() => validateResume({...validResume, experience: []}))
        .toThrow(ValidationError);
    });

    test('throws error for empty skills', () => {
      expect(() => validateResume({...validResume, skills: []}))
        .toThrow(ValidationError);
    });
  });

  describe('handleOptimizationError', () => {
    test('returns validation error message', () => {
      const validationError = new ValidationError('Test validation error');
      const result = handleOptimizationError(validationError);
      expect(result).toBe('Test validation error');
    });

    test('returns generic error message for unexpected errors', () => {
      const unexpectedError = new Error('Unexpected error');
      const result = handleOptimizationError(unexpectedError);
      expect(result).toBe('An unexpected error occurred. Please try again.');
    });
  });
});