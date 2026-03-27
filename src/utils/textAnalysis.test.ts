import { TextAnalyzer } from './textAnalysis';

describe('TextAnalyzer', () => {
  let analyzer: TextAnalyzer;

  beforeEach(() => {
    analyzer = new TextAnalyzer();
  });

  test('tokenize method splits text into words', () => {
    const text = 'Hello world, this is a test!';
    const tokens = analyzer.tokenize(text);
    expect(tokens).toEqual(['hello', 'world', 'this', 'is', 'a', 'test']);
  });

  test('calculateKeywordMatch returns correct percentage', () => {
    const resume = 'I am a software engineer with React experience';
    const jobDescription = 'We need a software engineer with React and TypeScript skills';
    
    const matchPercentage = analyzer.calculateKeywordMatch(resume, jobDescription);
    expect(matchPercentage).toBeGreaterThan(50);
  });

  test('extractRelevantKeywords returns top keywords', () => {
    const text = 'React is a popular JavaScript library for building user interfaces. React helps create interactive web applications.';
    
    const keywords = analyzer.extractRelevantKeywords(text, 3);
    expect(keywords).toContain('react');
    expect(keywords).toContain('javascript');
    expect(keywords).toContain('library');
  });
});