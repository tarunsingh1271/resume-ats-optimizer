export class TextAnalyzer {
  // Tokenize text into individual words
  tokenize(text: string): string[] {
    return text.toLowerCase().match(/\b\w+\b/g) || [];
  }

  // Calculate keyword match percentage
  calculateKeywordMatch(resume: string, jobDescription: string): number {
    const resumeTokens = this.tokenize(resume);
    const jobDescTokens = this.tokenize(jobDescription);

    const matchedKeywords = jobDescTokens.filter(keyword => 
      resumeTokens.includes(keyword)
    );

    return (matchedKeywords.length / jobDescTokens.length) * 100;
  }

  // Extract most relevant keywords
  extractRelevantKeywords(text: string, topN: number = 10): string[] {
    const tokens = this.tokenize(text);
    const frequencyMap = new Map<string, number>();

    tokens.forEach(token => {
      const count = frequencyMap.get(token) || 0;
      frequencyMap.set(token, count + 1);
    });

    return Array.from(frequencyMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(entry => entry[0]);
  }
}