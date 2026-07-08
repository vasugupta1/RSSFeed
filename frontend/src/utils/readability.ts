/**
 * Utility for fetching article content from the backend crawler API.
 * The API returns a CrawlUrlResponse with structured summary and keywords arrays.
 */

export interface CrawlUrlResponse {
  url: string;
  title: string;
  summary: string[];
  keywords: string[];
}

/**
 * Fetches article content for a given URL.
 * Returns the full CrawlUrlResponse from the API.
 */
export async function fetchArticleContent(url: string): Promise<CrawlUrlResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

  try {
    console.log(`[Readability] Requesting article content from API for: ${url}`);
    const response = await fetch('/api/crawler', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ url })
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API returned ${response.status} ${response.statusText}`);
    }

    const data: CrawlUrlResponse = await response.json();
    console.log(`[Readability] API response received:`, data);

    if (!data.summary || data.summary.length === 0) {
      throw new Error('Empty summary from API');
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`[Readability] fetchArticleContent error:`, error);
    throw error;
  }
}
