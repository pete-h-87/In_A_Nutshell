// AI summarization utilities
class Summarizer {
  constructor(apiKey = null) {
    this.apiKey = apiKey;
  }

  async summarize(transcript) {
    // TODO: Implement AI summarization (OpenAI, Claude, etc.)
    throw new Error('Not implemented yet');
  }

  formatSummary(summary) {
    // Format summary for display in mobile/extension
    return {
      shortSummary: summary.slice(0, 200) + '...',
      fullSummary: summary,
      keyPoints: this.extractKeyPoints(summary)
    };
  }

  extractKeyPoints(text) {
    // Extract bullet points from summary
    return [];
  }
}

export default Summarizer;