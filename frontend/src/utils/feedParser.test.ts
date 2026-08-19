import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { stripHtml, parseXml, extractArticleContent } from './feedParser';

describe('feedParser utilities', () => {
  describe('stripHtml', () => {
    it('should return an empty string for null or empty input', () => {
      expect(stripHtml('')).toBe('');
    });

    it('should strip simple HTML tags and return text content', () => {
      const html = '<p>Hello <strong>World</strong>!</p>';
      expect(stripHtml(html)).toBe('Hello World!');
    });

    it('should handle and format list items for Google News style HTML feed items', () => {
      const html = `
        <ul>
          <li><a href="https://example.com/1">First Article</a> <font>BBC News</font></li>
          <li><a href="https://example.com/2">Second Article</a> <font>CNN</font></li>
          <li>Just plain text item</li>
        </ul>
      `;
      const expected = 'First Article (BBC News) • Related: Second Article (CNN) • Just plain text item';
      expect(stripHtml(html)).toBe(expected);
    });
  });

  describe('parseXml', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 7, 19, 12, 0, 0));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should successfully parse a valid RSS 2.0 feed', () => {
      const rssXml = `<?xml version="1.0" encoding="UTF-8" ?>
        <rss version="2.0">
          <channel>
            <title>Test RSS Feed</title>
            <link>https://example.com/rss</link>
            <description>A test RSS feed description</description>
            <item>
              <title>Article One</title>
              <link>https://example.com/1</link>
              <description>&lt;p&gt;This is article one.&lt;/p&gt;</description>
              <pubDate>Wed, 19 Aug 2026 10:00:00 GMT</pubDate>
              <author>John Doe</author>
            </item>
            <item>
              <title>Article Two</title>
              <link>https://example.com/2</link>
              <description>This is article two without html.</description>
              <pubDate>Wed, 19 Aug 2026 11:00:00 GMT</pubDate>
            </item>
          </channel>
        </rss>`;

      const parsed = parseXml(rssXml);

      expect(parsed.title).toBe('Test RSS Feed');
      expect(parsed.link).toBe('https://example.com/rss');
      expect(parsed.description).toBe('A test RSS feed description');
      expect(parsed.isCustom).toBe(true);
      expect(parsed.items).toHaveLength(2);

      // Verify first item
      const item1 = parsed.items[0];
      expect(item1.title).toBe('Article One');
      expect(item1.link).toBe('https://example.com/1');
      expect(item1.description).toBe('This is article one.');
      expect(item1.pubDate).toBe('Wed, 19 Aug 2026 10:00:00 GMT');
      expect(item1.author).toBe('John Doe');
      expect(item1.read).toBe(false);
      expect(item1.starred).toBe(false);
      expect(item1.id).toContain('custom-item-');

      // Verify second item defaults
      const item2 = parsed.items[1];
      expect(item2.title).toBe('Article Two');
      expect(item2.link).toBe('https://example.com/2');
      expect(item2.description).toBe('This is article two without html.');
      expect(item2.author).toBeUndefined();
    });

    it('should successfully parse a valid Atom feed', () => {
      const atomXml = `<?xml version="1.0" encoding="utf-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <title>Test Atom Feed</title>
          <subtitle>A test Atom feed subtitle</subtitle>
          <link rel="alternate" href="https://example.com/atom"/>
          <entry>
            <title>Atom Entry One</title>
            <link rel="alternate" href="https://example.com/entry1"/>
            <summary>Summary of entry one</summary>
            <published>2026-08-19T10:00:00Z</published>
            <author><name>Jane Smith</name></author>
          </entry>
        </feed>`;

      const parsed = parseXml(atomXml);

      expect(parsed.title).toBe('Test Atom Feed');
      expect(parsed.link).toBe('https://example.com/atom');
      expect(parsed.description).toBe('A test Atom feed subtitle');
      expect(parsed.items).toHaveLength(1);

      const item = parsed.items[0];
      expect(item.title).toBe('Atom Entry One');
      expect(item.link).toBe('https://example.com/entry1');
      expect(item.description).toBe('Summary of entry one');
      expect(item.pubDate).toBe('2026-08-19T10:00:00Z');
      expect(item.author).toBe('Jane Smith');
    });

    it('should throw an error for malformed XML', () => {
      const malformedXml = `<invalid><unclosedTag>hello</invalid>`;
      expect(() => parseXml(malformedXml)).toThrow();
    });

    it('should throw an error for unsupported formats', () => {
      const unsupportedXml = `<?xml version="1.0" encoding="UTF-8" ?>
        <somethingElse>
          <title>Hello</title>
        </somethingElse>`;
      expect(() => parseXml(unsupportedXml)).toThrow('Unsupported feed format');
    });
  });

  describe('extractArticleContent', () => {
    it('should filter out scripts, styles, ads, and sidebars', () => {
      const html = `
        <div>
          <script>console.log("bad");</script>
          <style>body { color: red; }</style>
          <header>Header content</header>
          <aside class="sidebar">Aside content</aside>
          <div class="ad">Advertisement</div>
          <article>
            <h1>My Title</h1>
            <p>Main content of the article.</p>
          </article>
          <footer>Footer content</footer>
        </div>
      `;

      const result = extractArticleContent(html);
      
      expect(result).toContain('My Title');
      expect(result).toContain('Main content of the article.');
      expect(result).not.toContain('bad');
      expect(result).not.toContain('body {');
      expect(result).not.toContain('Header content');
      expect(result).not.toContain('Aside content');
      expect(result).not.toContain('Advertisement');
      expect(result).not.toContain('Footer content');
    });

    it('should extract images and apply tailwind styles', () => {
      const html = `
        <article>
          <p>Text</p>
          <img src="https://example.com/image.jpg" alt="Test Image" />
        </article>
      `;

      const result = extractArticleContent(html);
      expect(result).toContain('img src="https://example.com/image.jpg"');
      expect(result).toContain('alt="Test Image"');
      expect(result).toContain('class="w-full rounded-xl my-6 object-cover max-h-[400px]');
    });

    it('should extract lists', () => {
      const html = `
        <article>
          <ul>
            <li>Item A</li>
            <li>Item B</li>
          </ul>
        </article>
      `;

      const result = extractArticleContent(html);
      expect(result).toContain('list-disc list-inside');
      expect(result).toContain('<li>Item A</li>');
      expect(result).toContain('<li>Item B</li>');
    });

    it('should fall back gracefully if no readable content is found', () => {
      const result = extractArticleContent('');
      expect(result).toContain('Could not extract article content');
    });
  });
});
