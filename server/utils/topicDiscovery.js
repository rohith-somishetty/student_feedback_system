/**
 * Automatic Topic Discovery Utility
 * Performs lightweight n-gram extraction to identify recurring phrases across issues.
 */

const STOP_WORDS = new Set([
    'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'to', 'for', 'with', 'it', 'this', 'that',
    'has', 'been', 'are', 'was', 'were', 'be', 'of', 'from', 'my', 'our', 'i', 'we', 'you', 'your',
    'issue', 'problem', 'problem', 'report', 'student', 'please', 'help', 'not', 'no', 'but', 'is', 'can'
]);

function tokenize(text) {
    return text.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 2 && !STOP_WORDS.has(word));
}

function getNGrams(tokens, n) {
    const nGrams = [];
    for (let i = 0; i < tokens.length - n + 1; i++) {
        nGrams.push(tokens.slice(i, i + n).join(' '));
    }
    return nGrams;
}

/**
 * Discovers the top recurring phrases in a list of issues.
 * @param {Array} issues - Array of issue objects with .description and .title
 * @param {number} minOccurrences - Minimum number of issues a phrase must appear in
 * @returns {Array} List of discovered topics with frequency and sample issues
 */
function discoverTopics(issues, minOccurrences = 2) {
    if (!issues || issues.length === 0) return [];

    const phraseMap = new Map(); // phrase -> { count: 0, issues: Set }

    issues.forEach(issue => {
        const fullText = `${issue.title} ${issue.description}`;
        const tokens = tokenize(fullText);

        // Generate bi-grams and tri-grams
        const bigrams = getNGrams(tokens, 2);
        const trigrams = getNGrams(tokens, 3);

        // De-duplicate phrases within the same issue
        const uniquePhrases = new Set([...bigrams, ...trigrams]);

        uniquePhrases.forEach(phrase => {
            if (!phraseMap.has(phrase)) {
                phraseMap.set(phrase, { count: 0, issues: new Set(), sample: issue.title });
            }
            const data = phraseMap.get(phrase);
            data.count++;
            data.issues.add(issue.id);
        });
    });

    // Filter and sort
    return Array.from(phraseMap.entries())
        .filter(([_, data]) => data.count >= minOccurrences)
        .map(([phrase, data]) => ({
            phrase,
            frequency: data.count,
            issueCount: data.issues.size,
            sampleIssue: data.sample
        }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5); // Return top 5 hottest topics
}

module.exports = { discoverTopics, tokenize };
