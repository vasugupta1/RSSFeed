/**
 * Pure TypeScript distraction-free Reader View engine.
 * Implements a heuristic-based Readability scoring algorithm.
 */

export interface ParsedArticle {
  title: string;
  content: string;
  excerpt?: string;
  byline?: string;
}

/**
 * Step 1: HTML Fetching
 * Downloads the raw HTML directly from the target URL without any CORS proxies.
 */
export async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
  
  try {
    console.log(`[Readability] Fetching HTML from backend reader proxy for link: ${url}`);
    
    const proxyUrl = `/api/reader?url=${encodeURIComponent(url)}`;

    console.log(`[Readability] Constructed proxy URL: ${proxyUrl}`);

    const response = await fetch(proxyUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Reader proxy returned status ${response.status} ${response.statusText}`);
    }
    
    const htmlText = await response.text();
    console.log(`[Readability] Received HTML content from proxy (length: ${htmlText.length} characters)`);
    console.log(`[Readability] HTML content:\n${htmlText}`);

    if (htmlText.trim().length < 200) {
      throw new Error('Received empty or incomplete webpage content from reader proxy.');
    }
    
    console.log(`[Readability] Successfully fetched HTML content via proxy!`);
    return htmlText;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`[Readability] Proxy fetch failed:`, error);
    throw error;
  }
}

/**
 * Step 2: DOM Parsing
 * Converts HTML string into a structural DOM Document tree in memory.
 */
export function parseHtml(htmlText: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(htmlText, 'text/html');
}

/**
 * Step 3 & 4: Scoring, Cleaning & Formatting Engine
 * Identifies the core content container using text density heuristics and structures a styled semantic output.
 */
export function extractAndFormat(doc: Document, originalTitle: string): ParsedArticle {
  // Pre-Sanitize: Strip scripts, styles, forms, embeds, and header/footer elements that are definitely clutter
  const rawClutterSelectors = [
    'script', 'style', 'noscript', 'iframe', 'canvas', 'svg', 'embed', 'object',
    'header', 'footer', 'nav', 'aside', 'form', 'button', 'input', 'select', 'textarea',
    '.ads', '.ad', '#ads', '#ad', '.sidebar', '.menu', '.navigation', '.social-share', 
    '.comments', '.comment', '.footer', '.header', '.nav', '.banner', '.promo', '.widget', 
    '.social', '#sidebar', '#comments', '#footer', '#header', '#nav', '#menu'
  ];
  
  rawClutterSelectors.forEach(selector => {
    doc.querySelectorAll(selector).forEach(el => el.remove());
  });

  // Extract byline if present
  let byline = '';
  const authorSelectors = [
    '[itemprop*="author"]', '.author', '.byline', '.entry-author', '.creator', '.post-author', '.author-name'
  ];
  for (const selector of authorSelectors) {
    const authorEl = doc.querySelector(selector);
    if (authorEl && authorEl.textContent?.trim()) {
      byline = authorEl.textContent.trim();
      break;
    }
  }

  // Find all elements to score as potential content containers
  const scoreMap = new Map<Element, number>();
  
  // Paragraph-like content-bearing nodes
  const paragraphNodes = Array.from(doc.querySelectorAll('p, blockquote, pre'));
  
  paragraphNodes.forEach(node => {
    const text = node.textContent || '';
    const textLength = text.trim().length;
    
    // Ignore extremely short nodes
    if (textLength < 25) return;
    
    // Compute heuristic score for this node
    let elementScore = 0;
    
    // 1 point per 100 characters in the text node
    elementScore += Math.floor(textLength / 100);
    
    // 2 points for every punctuation mark (comma, period, semicolon, colon) indicating structured editorial content
    const commaMatches = text.match(/,/g);
    const periodMatches = text.match(/\./g);
    const colonMatches = text.match(/:/g);
    const semicolonMatches = text.match(/;/g);
    elementScore += (commaMatches ? commaMatches.length : 0) * 2;
    elementScore += (periodMatches ? periodMatches.length : 0) * 2;
    elementScore += (colonMatches ? colonMatches.length : 0) * 2;
    elementScore += (semicolonMatches ? semicolonMatches.length : 0) * 2;
    
    // Apply this score to the parent and half to the grandparent
    const parent = node.parentElement;
    if (parent) {
      if (!scoreMap.has(parent)) {
        initializeNodeScore(parent, scoreMap);
      }
      scoreMap.set(parent, (scoreMap.get(parent) || 0) + elementScore);
      
      const grandparent = parent.parentElement;
      if (grandparent) {
        if (!scoreMap.has(grandparent)) {
          initializeNodeScore(grandparent, scoreMap);
        }
        scoreMap.set(grandparent, (scoreMap.get(grandparent) || 0) + (elementScore * 0.5));
      }
    }
  });

  // Find top candidate node
  let topCandidate: Element | null = null;
  let maxScore = -1;
  
  scoreMap.forEach((score, el) => {
    if (score > maxScore) {
      maxScore = score;
      topCandidate = el;
    }
  });

  // Default fallbacks if no strong candidate node is identified
  if (!topCandidate || maxScore <= 5) {
    topCandidate = doc.querySelector('article') || doc.querySelector('[role="article"]') || doc.querySelector('.post') || doc.querySelector('.content') || doc.body;
  }

  // If we still don't have a node, return basic fallback response
  if (!topCandidate) {
    return {
      title: originalTitle,
      content: '<p>Could not extract readable article contents. Please visit the original website using the link below.</p>',
      byline
    };
  }

  // Clean the selected top container node
  cleanTopCandidate(topCandidate);

  // Parse and build beautiful output markup
  const cleanHtml = renderFormattedOutput(topCandidate);
  
  // Extract brief description excerpt
  let excerpt = '';
  const firstP = topCandidate.querySelector('p');
  if (firstP && firstP.textContent) {
    excerpt = firstP.textContent.trim().substring(0, 160) + '...';
  }

  return {
    title: originalTitle,
    content: cleanHtml || '<p>Article content could not be cleanly parsed. Please visit the original site.</p>',
    excerpt,
    byline
  };
}

/**
 * Initializes a container's node score based on its class names and ID attributes
 */
function initializeNodeScore(el: Element, scoreMap: Map<Element, number>) {
  let score = 0;
  const tag = el.tagName.toLowerCase();
  
  // Give semantic tags a slight boost
  if (tag === 'article' || tag === 'section') {
    score += 15;
  } else if (tag === 'div') {
    score += 0;
  } else if (tag === 'form' || tag === 'aside') {
    score -= 20;
  }
  
  // Scan attributes
  const idStr = el.getAttribute('id') || '';
  const classStr = el.getAttribute('class') || '';
  const attrText = (idStr + ' ' + classStr).toLowerCase();
  
  // Positive matching keyword list
  const positiveRegex = /article|body|content|entry|main|story|text|post|blog/i;
  // Negative matching keyword list
  const negativeRegex = /ad|banner|comment|foot|nav|sidebar|social|share|widget|sponsor|promo|menu/i;
  
  if (positiveRegex.test(attrText)) {
    score += 25;
  }
  if (negativeRegex.test(attrText)) {
    score -= 30;
  }
  
  scoreMap.set(el, score);
}

/**
 * Cleans the top candidate node of remaining links lists, empty nodes, etc.
 */
function cleanTopCandidate(topNode: Element) {
  // 1. Remove elements with high link-to-text density (e.g. navigation widgets, tables of content)
  topNode.querySelectorAll('div, ul, ol, table').forEach(node => {
    const textLength = node.textContent?.trim().length || 0;
    if (textLength === 0) {
      node.remove();
      return;
    }
    
    let linkTextLength = 0;
    node.querySelectorAll('a').forEach(a => {
      linkTextLength += a.textContent?.trim().length || 0;
    });
    
    // If more than 50% of content is wrapped in anchors, remove it
    if (linkTextLength / textLength > 0.5 && textLength > 40) {
      node.remove();
    }
  });

  // 2. Remove empty block tags that contribute no visual elements
  topNode.querySelectorAll('p, div, span').forEach(node => {
    if (!node.textContent?.trim() && !node.querySelector('img')) {
      node.remove();
    }
  });
}

/**
 * Walk top node tree and render beautifully formatted, brand-cohesive HTML strings
 */
function renderFormattedOutput(topNode: Element): string {
  const containerDiv = document.createElement('div');
  containerDiv.className = 'space-y-6';
  
  // Get all relevant elements under the candidate root
  const elements = topNode.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote, pre, img');
  
  elements.forEach(node => {
    const tagName = node.tagName.toLowerCase();
    
    if (tagName === 'p') {
      const pText = node.textContent?.trim();
      if (pText && pText.length > 5) {
        const p = document.createElement('p');
        p.className = 'text-[17px] md:text-[18px] leading-relaxed text-secondary font-serif antialiased mb-6';
        
        // Retain inline links or bold items with caution
        p.innerHTML = cleanInlineTags(node.innerHTML);
        containerDiv.appendChild(p);
      }
    } else if (tagName.startsWith('h')) {
      const headingText = node.textContent?.trim();
      if (headingText) {
        const heading = document.createElement(tagName);
        const headingSize = tagName === 'h1' || tagName === 'h2' ? 'text-2xl font-bold' : tagName === 'h3' ? 'text-xl font-semibold' : 'text-lg font-semibold';
        heading.className = `font-sans ${headingSize} text-primary mt-10 mb-4 tracking-tight leading-snug`;
        heading.textContent = headingText;
        containerDiv.appendChild(heading);
      }
    } else if (tagName === 'blockquote') {
      const quoteText = node.textContent?.trim();
      if (quoteText) {
        const quote = document.createElement('blockquote');
        quote.className = 'border-l-4 border-brand pl-5 italic text-muted text-[17px] font-serif my-6 leading-relaxed bg-brand/5 py-3 pr-3 rounded-r-xl';
        quote.innerHTML = cleanInlineTags(node.innerHTML);
        containerDiv.appendChild(quote);
      }
    } else if (tagName === 'ul' || tagName === 'ol') {
      const list = document.createElement(tagName);
      const listStyle = tagName === 'ul' ? 'list-disc' : 'list-decimal';
      list.className = `${listStyle} list-inside mb-6 pl-4 space-y-2.5 text-[17px] leading-relaxed text-secondary font-serif`;
      
      node.querySelectorAll('li').forEach(li => {
        const item = document.createElement('li');
        item.innerHTML = cleanInlineTags(li.innerHTML);
        list.appendChild(item);
      });
      
      if (list.children.length > 0) {
        containerDiv.appendChild(list);
      }
    } else if (tagName === 'pre') {
      const codeText = node.textContent?.trim();
      if (codeText) {
        const pre = document.createElement('pre');
        pre.className = 'bg-card border border-border-custom p-5 rounded-2xl font-mono text-sm overflow-x-auto text-primary leading-relaxed shadow-inner-custom mb-6';
        pre.textContent = codeText;
        containerDiv.appendChild(pre);
      }
    } else if (tagName === 'img') {
      const src = node.getAttribute('src');
      if (src && !src.startsWith('data:image')) {
        const img = document.createElement('img');
        const realSrc = node.getAttribute('data-src') || node.getAttribute('data-original') || src;
        img.setAttribute('src', realSrc);
        img.className = 'w-full rounded-2xl my-8 object-cover max-h-[480px] border border-border-custom shadow-md hover:shadow-lg transition-shadow duration-300';
        img.setAttribute('alt', node.getAttribute('alt') || 'Article visual');
        img.setAttribute('loading', 'lazy');
        containerDiv.appendChild(img);
      }
    }
  });

  return containerDiv.innerHTML;
}

/**
 * Sanitizes inline content to keep basic formatting (a, strong, em, b, i, code) but strip tracking or scripts
 */
function cleanInlineTags(html: string): string {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Strip links with tracking parameters or scripts
  tempDiv.querySelectorAll('a').forEach(a => {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('javascript:')) {
      // replace link with raw text
      const span = document.createElement('span');
      span.textContent = a.textContent;
      a.replaceWith(span);
    } else {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
      a.className = 'text-brand hover:text-brand-hover underline transition-colors duration-150 font-medium';
    }
  });
  
  // Strip any embedded script or inline event handlers
  tempDiv.querySelectorAll('*').forEach(el => {
    const attributes = el.attributes;
    for (let i = attributes.length - 1; i >= 0; i--) {
      const attrName = attributes[i].name;
      if (attrName.startsWith('on')) {
        el.removeAttribute(attrName);
      }
    }
  });
  
  return tempDiv.innerHTML;
}
