import type { Feed, FeedItem } from '../types';

export const stripHtml = (htmlText: string): string => {
  if (!htmlText) return "";
  const doc = new DOMParser().parseFromString(htmlText, 'text/html');
  
  // Clean up Google News style lists or general lists
  const listItems = doc.querySelectorAll('li');
  if (listItems.length > 0) {
    const itemsText: string[] = [];
    listItems.forEach((li, idx) => {
      const link = li.querySelector('a');
      const source = li.querySelector('font');
      if (link) {
        const titleText = link.textContent?.trim() || li.textContent?.trim() || "";
        const sourceText = source?.textContent?.trim() || "";
        let itemText = titleText;
        if (sourceText) {
          itemText += ` (${sourceText})`;
        }
        if (idx === 0) {
          itemsText.push(itemText);
        } else {
          itemsText.push(`Related: ${itemText}`);
        }
      } else {
        itemsText.push(li.textContent?.trim() || "");
      }
    });
    return itemsText.filter(Boolean).join(' • ');
  }
  
  return doc.body.textContent?.trim() || "";
};

export const parseXml = (xmlText: string): Feed => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
  
  // Check for parsing errors
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error(parserError.textContent || 'XML Parsing Error');
  }

  // RSS 2.0
  const channel = xmlDoc.querySelector('channel');
  if (channel) {
    const title = channel.querySelector('title')?.textContent || 'Untitled RSS Feed';
    const link = channel.querySelector('link')?.textContent || '';
    const description = channel.querySelector('description')?.textContent || 'No description available.';
    
    const items: FeedItem[] = [];
    const itemNodes = xmlDoc.querySelectorAll('item');
    
    itemNodes.forEach((node, index) => {
      const itemTitle = node.querySelector('title')?.textContent || 'Untitled Article';
      const itemLink = node.querySelector('link')?.textContent || '';
      
      const itemDesc = node.querySelector('description')?.textContent || '';
      const itemContent = node.querySelector('encoded')?.textContent || node.querySelector('content')?.textContent || itemDesc;
      
      const pubDate = node.querySelector('pubDate')?.textContent || node.querySelector('date')?.textContent || new Date().toUTCString();
      
      items.push({
        id: `custom-item-${Date.now()}-${index}`,
        title: itemTitle,
        link: itemLink,
        description: stripHtml(itemDesc),
        content: itemContent,
        pubDate: pubDate,
        read: false,
        starred: false,
        author: node.querySelector('author')?.textContent || node.querySelector('creator')?.textContent || undefined
      });
    });

    return {
      id: `feed-${Date.now()}`,
      title,
      link,
      description,
      items,
      isCustom: true
    };
  }

  // Atom Feed
  const feed = xmlDoc.querySelector('feed');
  if (feed) {
    const title = feed.querySelector('title')?.textContent || 'Untitled Atom Feed';
    const linkNode = feed.querySelector('link[rel="alternate"]') || feed.querySelector('link');
    const link = linkNode?.getAttribute('href') || '';
    const description = feed.querySelector('subtitle')?.textContent || 'No description available.';
    
    const items: FeedItem[] = [];
    const entryNodes = xmlDoc.querySelectorAll('entry');
    
    entryNodes.forEach((node, index) => {
      const itemTitle = node.querySelector('title')?.textContent || 'Untitled Article';
      const linkNode = node.querySelector('link[rel="alternate"]') || node.querySelector('link');
      const itemLink = linkNode?.getAttribute('href') || '';
      
      const summary = node.querySelector('summary')?.textContent || '';
      const content = node.querySelector('content')?.textContent || summary;
      const pubDate = node.querySelector('published')?.textContent || node.querySelector('updated')?.textContent || new Date().toUTCString();
      
      items.push({
        id: `custom-item-${Date.now()}-${index}`,
        title: itemTitle,
        link: itemLink,
        description: stripHtml(summary || content || ''),
        content: content,
        pubDate: pubDate,
        read: false,
        starred: false,
        author: node.querySelector('author name')?.textContent || undefined
      });
    });

    return {
      id: `feed-${Date.now()}`,
      title,
      link,
      description,
      items,
      isCustom: true
    };
  }

  throw new Error('Unsupported feed format. Please provide a valid RSS 2.0 or Atom feed.');
};

export const extractArticleContent = (htmlText: string): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');
  
  // Remove ads, scripts, CSS stylesheets, inline headers/footers/navbars/asides
  const selectorsToRemove = [
    'script', 'style', 'noscript', 'iframe', 'header', 'footer', 'nav', 
    'aside', '.ads', '.ad', '#ads', '#ad', '.sidebar', '.menu', '.navigation',
    '.social-share', '.comments', 'form', 'button', 'input', 'svg'
  ];
  selectorsToRemove.forEach(selector => {
    doc.querySelectorAll(selector).forEach(el => el.remove());
  });

  // Common wrapper elements for content
  const articleSelectors = [
    'article', '[role="article"]', '.post', '.article', '.entry', 
    '.main-content', '#content', '#main', 'main', '.post-content', '.story-content'
  ];
  
  let mainContainer: Element | null = null;
  for (const selector of articleSelectors) {
    mainContainer = doc.querySelector(selector);
    if (mainContainer) break;
  }
  
  const container = mainContainer || doc.body;

  // Re-build content under a clean layout structure
  const contentNodes = container.querySelectorAll('h1, h2, h3, h4, p, ul, ol, img');
  const containerDiv = document.createElement('div');
  containerDiv.className = 'space-y-6';
  
  contentNodes.forEach(node => {
    const tagName = node.tagName.toLowerCase();
    if (tagName === 'p') {
      const p = document.createElement('p');
      p.className = 'text-[17px] leading-relaxed text-secondary font-serif';
      p.textContent = node.textContent;
      // Filter empty paragraph nodes
      if (p.textContent?.trim()) {
        containerDiv.appendChild(p);
      }
    } else if (tagName.startsWith('h')) {
      const heading = document.createElement(tagName);
      heading.className = 'font-sans font-bold text-primary mt-8 mb-3 ' + 
        (tagName === 'h1' ? 'text-2xl' : tagName === 'h2' ? 'text-xl' : 'text-lg');
      heading.textContent = node.textContent;
      containerDiv.appendChild(heading);
    } else if (tagName === 'img') {
      const src = node.getAttribute('src');
      if (src) {
        const img = document.createElement('img');
        // If image uses lazy loading, try data-src
        const realSrc = node.getAttribute('data-src') || src;
        img.setAttribute('src', realSrc);
        img.className = 'w-full rounded-xl my-6 object-cover max-h-[400px] border border-border-custom shadow-xs';
        img.setAttribute('alt', node.getAttribute('alt') || 'Article Image');
        containerDiv.appendChild(img);
      }
    } else if (tagName === 'ul' || tagName === 'ol') {
      const list = document.createElement(tagName);
      list.className = 'list-disc list-inside mb-4 pl-4 space-y-2 text-[17px] leading-relaxed text-secondary font-serif';
      node.querySelectorAll('li').forEach(li => {
        const item = document.createElement('li');
        item.textContent = li.textContent;
        list.appendChild(item);
      });
      containerDiv.appendChild(list);
    }
  });

  return containerDiv.innerHTML || "<p>Could not extract article content. Please use 'Reader Mode' or visit the original website.</p>";
};
