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
}

export interface Feed {
  id: string;
  title: string;
  link: string;
  description: string;
  items: FeedItem[];
  isCustom?: boolean;
}

export const INITIAL_FEEDS: Feed[] = [
  {
    id: 'bbcnews',
    title: 'BBC News - Home',
    link: 'https://feeds.bbci.co.uk/news/rss.xml',
    description: 'BBC News comprehensive up-to-date international coverage.',
    items: [
      {
        id: "bbc-1",
        title: "The questions raised by the Murrell embezzlement controversy",
        link: "https://www.bbc.com/news/articles/c74dd82w943o",
        description: "The case has been hanging over the SNP like a toxic cloud since the police investigation began five years ago.",
        pubDate: "Mon, 25 May 2026 11:08:57 GMT",
        read: false,
        starred: false,
        author: "BBC News",
        content: "<p>The case has been hanging over the SNP like a toxic cloud since the police investigation began five years ago.</p>"
      },
      {
        id: "bbc-2",
        title: "Deal with US not imminent, Iran says",
        link: "https://www.bbc.com/news/articles/cglpp2yk336o",
        description: "The US secretary of state earlier said that an agreement could possibly come on Monday.",
        pubDate: "Mon, 25 May 2026 11:17:49 GMT",
        read: false,
        starred: false,
        author: "BBC News",
        content: "<p>The US secretary of state earlier said that an agreement could possibly come on Monday.</p>"
      },
      {
        id: "bbc-3",
        title: "Oil prices slide on hopes of US-Iran peace deal",
        link: "https://www.bbc.com/news/articles/c809m7g29r7o",
        description: "Trump said on Saturday that an agreement would include the reopening of the Strait of Hormuz, without giving further details.",
        pubDate: "Mon, 25 May 2026 10:39:18 GMT",
        read: false,
        starred: false,
        author: "BBC News",
        content: "<p>Trump said on Saturday that an agreement would include the reopening of the Strait of Hormuz, without giving further details.</p>"
      },
      {
        id: "bbc-4",
        title: "Greek swimmer only athlete to beat world record at controversial Enhanced Games",
        link: "https://www.bbc.com/sport/articles/cx211xyd298o",
        description: "Greek swimmer Kristian Gkolomeev beats a world record in the pool at the controversial Enhanced Games in Las Vegas.",
        pubDate: "Mon, 25 May 2026 07:49:56 GMT",
        read: false,
        starred: false,
        author: "BBC News",
        content: "<p>Greek swimmer Kristian Gkolomeev beats a world record in the pool at the controversial Enhanced Games in Las Vegas.</p>"
      },
      {
        id: "bbc-5",
        title: "Starmer 'appalled' by case of boys spared jail after raping teenage girls",
        link: "https://www.bbc.com/news/articles/c332ljdkd81o",
        description: "The prime minister said it was \"right\" that the sentences were being urgently reviewed.",
        pubDate: "Mon, 25 May 2026 10:14:43 GMT",
        read: false,
        starred: false,
        author: "BBC News",
        content: "<p>The prime minister said it was \"right\" that the sentences were being urgently reviewed.</p>"
      }
    ]
  }
,
  {
    id: 'guardian',
    title: 'World news | The Guardian',
    link: 'https://www.theguardian.com/world',
    description: "Latest World news news, comment and analysis from the Guardian, the world's leading liberal voice",
    items: [
      {
        id: 'guardian-1',
        title: 'Death of Congolese man renews scrutiny of race relations in Ireland',
        link: 'https://www.theguardian.com/world/2026/may/31/yves-sakila-death-congolese-man-ireland-race-relations',
        description: '',
        pubDate: 'Sun, 31 May 2026 13:59:34 GMT',
        read: false,
        starred: false,
        author: undefined,
        content: ''
      },
      {
        id: 'guardian-2',
        title: 'Bound by blood: new film highlights Jamaica’s outlawed obeah belief system',
        link: 'https://www.theguardian.com/world/2026/may/30/stew-pews-film-obeah-jamaica-magic-tradition',
        description: '',
        pubDate: 'Sat, 30 May 2026 11:00:18 GMT',
        read: false,
        starred: false,
        author: undefined,
        content: ''
      }
    ]
  }
];

export const SAMPLE_XML_FEED = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Wired Technology</title>
    <link>https://www.wired.com</link>
    <description>The latest technology news and trends from Wired Magazine.</description>
    <item>
      <title>The Rise of Localized Edge Computing in Smart Cities</title>
      <link>https://www.wired.com/edge-computing-smart-cities</link>
      <description>How local edge nodes are processing gigabytes of sensor data in real-time without relying on central cloud data centers, saving bandwidth and improving latency.</description>
      <pubDate>Fri, 22 May 2026 10:00:00 GMT</pubDate>
    </item>
    <item>
      <title>Quantum Sensors Find Practical Applications in Medical Imaging</title>
      <link>https://www.wired.com/quantum-sensors-medical-imaging</link>
      <description>Researchers deploy quantum-based magnetic field sensors to detect subtle changes in neural activity, potentially revolutionizing non-invasive brain-machine interfaces.</description>
      <pubDate>Thu, 21 May 2026 14:15:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;
