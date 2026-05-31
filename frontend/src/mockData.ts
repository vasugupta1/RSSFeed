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
  },
  {
    id: 'skynews',
    title: 'Sky News - Home',
    link: 'https://news.sky.com/home',
    description: 'Sky news delivers breaking news, headlines and top stories from business, politics, entertainment and more in the UK and worldwide.',
    items: [
      {
        id: 'sky-1',
        title: "Ex-Spurs chairman Levy joins basketball bid | Mark Kleinman blog",
        link: 'https://news.sky.com/story/mark-kleinman-blog-see-the-latest-stories-from-sky-news-city-editor-13505671',
        description: '',
        pubDate: 'Tue, 10 Feb 2026 11:47:00 +0000',
        read: false,
        starred: false,
        author: undefined,
        content: ''
      },
      {
        id: 'sky-2',
        title: 'Police mount investigation after rare miniature horses stolen',
        link: 'https://news.sky.com/story/police-mount-investigation-after-rare-miniature-horses-stolen-13549277',
        description: 'Police have launched an appeal after two rare miniature horses were stolen from a farm in Kent.',
        pubDate: 'Sat, 30 May 2026 12:56:00 +0100',
        read: false,
        starred: false,
        author: undefined,
        content: ''
      },
      {
        id: 'sky-3',
        title: 'Almost 100 homes evacuated in former mining village after ground movement detected',
        link: 'https://news.sky.com/story/almost-100-homes-evacuated-in-former-mining-village-after-ground-movement-detected-13549253',
        description: 'Almost 100 homes have been evacuated following reports of ground movement in a former mining village in Clackmannanshire.',
        pubDate: 'Sat, 30 May 2026 15:09:00 +0100',
        read: false,
        starred: false,
        author: undefined,
        content: ''
      },
      {
        id: 'sky-4',
        title: 'US, UK and Australia to develop underwater drones through defence pact',
        link: 'https://news.sky.com/story/aukus-nations-to-develop-underwater-drones-through-defence-pact-13549241',
        description: 'Unmanned undersea vehicles will be developed under the AUKUS defence pact, US secretary of defence Pete Hegseth said.',
        pubDate: 'Sat, 30 May 2026 15:00:00 +0100',
        read: false,
        starred: false,
        author: undefined,
        content: ''
      },
      {
        id: 'sky-5',
        title: "NHS trial of blood test offers 'genuine hope' for people with some cancers",
        link: 'https://news.sky.com/story/nhs-trial-of-blood-test-offers-genuine-hope-for-people-with-some-cancers-13549242',
        description: 'A blood test designed to detect multiple cancers could offer "genuine hope" for people with some types of the disease, experts say.',
        pubDate: 'Sat, 30 May 2026 11:05:00 +0100',
        read: false,
        starred: false,
        author: undefined,
        content: ''
      },
      {
        id: 'sky-6',
        title: 'Teenager charged with murder after 15-year-old boy fatally stabbed in London',
        link: 'https://news.sky.com/story/teenager-charged-with-murder-after-15-year-old-boy-fatally-stabbed-in-london-13549211',
        description: 'A 16-year-old has been charged with murder after a teenage boy was fatally stabbed in east London.',
        pubDate: 'Sat, 30 May 2026 08:18:00 +0100',
        read: false,
        starred: false,
        author: undefined,
        content: ''
      },
      {
        id: 'sky-7',
        title: 'Ex-England star Raheem Sterling arrested on suspicion of drug driving',
        link: 'https://news.sky.com/story/ex-england-star-raheem-sterling-arrested-on-suspicion-of-drug-driving-sky-news-understands-13549226',
        description: 'Former England footballer Raheem Sterling has been arrested on suspicion of drug driving, Sky News understands.',
        pubDate: 'Sat, 30 May 2026 10:08:00 +0100',
        read: false,
        starred: false,
        author: undefined,
        content: ''
      },
      {
        id: 'sky-8',
        title: 'Temperatures to fall in UK as heatwave comes to an end',
        link: 'https://news.sky.com/story/uk-weather-temperatures-to-fall-as-record-breaking-heatwave-comes-to-an-end-13549197',
        description: 'Temperatures will drop across much of the UK over the weekend, as a record-breaking heatwave gives way to cloudy skies and rain, the Met Office has said.',
        pubDate: 'Sat, 30 May 2026 05:59:00 +0100',
        read: false,
        starred: false,
        author: undefined,
        content: ''
      },
      {
        id: 'sky-9',
        title: 'Four people trapped in flooded cave in Laos pulled to safety',
        link: 'https://news.sky.com/story/four-people-trapped-in-flooded-cave-in-laos-pulled-to-safety-13549218',
        description: 'Four people trapped for 10 days in a flooded cave in Laos have been safely evacuated by rescuers.',
        pubDate: 'Sat, 30 May 2026 09:32:00 +0100',
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
