/**
 * Simplified utility for fetching article content directly from the backend API.
 * It assumes the API returns a JSON object matching the ReadResponse interface
 * and that the `Response` field contains ready‑to‑render HTML.
 */

export interface ReadResponse {
  Url: string;
  Response: string;
}

/**
 * Fetches article content for a given URL.
 * Returns the `Response` string from the API without any further processing.
 */
export async function fetchArticleContent(url: string): Promise<string> {
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

    const data: ReadResponse = await response.json();
    console.log(`[Readability] API response received:`, data);
    let content = data.Response;
    if (!content || content.trim().length === 0) {
      throw new Error('Empty response from API');
    }

    // 1️⃣ Prefer explicit "*" bullet markers.
    const starBullets = content
      .split('*')
      .map(item => item.trim())
      .filter(item => item.length > 0);
    if (starBullets.length > 1) {
      const html = `<ul>${starBullets.map(b => `<li>${b}</li>`).join('')}</ul>`;
      return html;
    }

    // 2️⃣ Fallback: treat newline‑separated lines as bullets when there are multiple lines.
    const lineBullets = content
      .split(/\r?\n/) // split on any newline
      .map(item => item.trim())
      .filter(item => item.length > 0);
    if (lineBullets.length > 1) {
      const html = `<ul>${lineBullets.map(b => `<li>${b}</li>`).join('')}</ul>`;
      return html;
    }

    // 3️⃣ Fallback: split on sentence endings if still multiple parts.
    const sentenceBullets = content
      .split(/\.\s+/)
      .map(item => item.trim())
      .filter(item => item.length > 0)
      .map(item => item.endsWith('.') ? item : `${item}.`);
    if (sentenceBullets.length > 1) {
      const html = `<ul>${sentenceBullets.map(b => `<li>${b}</li>`).join('')}</ul>`;
      return html;
    }

    // Single paragraph – return unchanged.
    return content;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`[Readability] fetchArticleContent error:`, error);
    throw error;
  }
}
