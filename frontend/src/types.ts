export interface FeedItem {
  id: string;
  title: string;
  link: string;
  description: string;
  pubDate: string;
  read: boolean;
  starred: boolean;
  author?: string;
  content?: string;
  imageUrl?: string;
  summary?: string[];
  keywords?: string[];
}

export interface Feed {
  id: string;
  title: string;
  link: string;
  description: string;
  items: FeedItem[];
  isCustom?: boolean;
}
