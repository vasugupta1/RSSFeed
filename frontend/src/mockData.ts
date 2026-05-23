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
    id: 'googlenews',
    title: 'Top stories - Google News',
    link: 'https://news.google.com/?hl=en-GB&gl=GB&ceid=GB:en',
    description: 'Google News comprehensive up-to-date coverage aggregated from sources all over the world.',
    items: [
      {
        id: "gn-1",
        title: "UK’s ‘anxious generation’ of young people struggling to adapt to workplace - The Guardian",
        link: "https://news.google.com/rss/articles/CBMimgFBVV95cUxNcGswcGpIUWM0OUM3RWFQVWhUUU8wUUlQNVFXOWVMLVFQQ3pXVnVYRUFKeUhNNXBJdjNRalVoOXhpeG5nbWtlTDY2V0JUU0VOSEVmXzBINlFXXy1UM25tU1UzYnJtU0RJSEtIZEtBWEFxWGFYdjI4LTVrRmlVb2lEYWdZTWp5aGRQQzhUejM4Q0VHR2tOb0lneTlR?oc=5",
        description: "UK’s ‘anxious generation’ of young people struggling to adapt to workplace (The Guardian) • Related: 'Shameful' more spent on benefits than jobs for young people, says Milburn (BBC) • Related: Alan Milburn warns of ec...",
        pubDate: "Sat, 23 May 2026 12:44:00 GMT",
        read: false,
        starred: false,
        author: "The Guardian",
        content: "<ol><li><a href=\"https://news.google.com/rss/articles/CBMimgFBVV95cUxNcGswcGpIUWM0OUM3RWFQVWhUUU8wUUlQNVFXOWVMLVFQQ3pXVnVYRUFKeUhNNXBJdjNRalVoOXhpeG5nbWtlTDY2V0JUU0VOSEVmXzBINlFXXy1UM25tU1UzYnJtU0RJSEtIZEtBWEFxWGFYdjI4LTVrRmlVb2lEYWdZTWp5aGRQQzhUejM4Q0VHR2tOb0lneTlR?oc=5\" target=\"_blank\">UK’s ‘anxious generation’ of young people struggling to adapt to workplace</a>  <font color=\"#6f6f6f\">The Guardian</font></li><li><a href=\"https://news.google.com/rss/articles/CBMiXEFVX3lxTE80MG1VRFI2YXI1ZnVNSHZwRDA0anF4bU5rYmo0S2xiQ3JjenVhTm5keHkwQnNVbUpMQURvWnhaYXRaQ2szWTlVVjZSUWg4T051b3o1Smw2UjRoczAt?oc=5\" target=\"_blank\">'Shameful' more spent on benefits than jobs for young people, says Milburn</a>  <font color=\"#6f6f6f\">BBC</font></li><li><a href=\"https://news.google.com/rss/articles/CBMivwFBVV95cUxOUk5Ha0N2NFZGOWdRUV9TWTBta3lzRkxaWjJfR2pTNUx5X00yMG92RVRjdTFQOVFkX0NJWVNQQ2RMLWpTTXJhWTN0ajdtV3dnXy1oNGo3dXpubzMzRDdlTUJRNi1IVXNRdFNnQ0JyWEUxLXM4UGU5SGtIWDFRaWNfamhzUEt5RUI4RGZMUFR1NHhpekJDNDdkbHFPbTdkTVlrQ0NmaEVQQzdKdGJfZWtIWXROX0xuRnAyWmpQZjZCSQ?oc=5\" target=\"_blank\">Alan Milburn warns of economic ruin as young are ‘rewired by phones’</a>  <font color=\"#6f6f6f\">The Times</font></li><li><a href=\"https://news.google.com/rss/articles/CBMivgFBVV95cUxORVZkdWhaaksxOGZNYk1QTHEtSVVSN2pTNTdYQVVfbk5fVEV0YUZOZjhWSmFDV0dMZWRCUW94dWpMbnBPSnVFYkdRNDYyN0hkU05QWHlJVjFlN25PbllZbzVHNlExSWl0MGhDUHVYVkgyMlNpWGRGT1hVeFo5amNYZEIxVUxnekZDR3lMZkNodDN3WFdTV0dXb09GM19IT2RWTnRKRThQUkJRMmNteU1GT0I5TFVvZzJybVhwdGNR?oc=5\" target=\"_blank\">UK faces 'economic catastrophe' unless it adapts to young people 'rewired by smartphones'</a>  <font color=\"#6f6f6f\">Sky News</font></li><li><a href=\"https://news.google.com/rss/articles/CBMiqgFBVV95cUxQSDVQZ293aE5qMktHaDdUYmpWZlhrME5KalNIMmxIUnRXeUlPWlhJZWU4RmtzLTFORmVVblFjSnhRTUFtZk5Qc1BhbHpWMnBTQW1SRVpJLU85UHlJSVVxNC1Lemd3amdnZm1yZWlMYnUxNGZlMkN5UHdQSkJROFpoNXQxbVdhY1Q0ZXFVYnQyOGNDTVNiYTU2bk9yNXB3SnB2MFFTaUVZdGI1UQ?oc=5\" target=\"_blank\">Care system is ‘conveyor belt’ to worklessness, says Milburn</a>  <font color=\"#6f6f6f\">The Telegraph</font></li></ol>"
      },
      {
        id: "gn-2",
        title: "Dover bank holiday queues: France suspends extra EU border checks - follow live - BBC",
        link: "https://news.google.com/rss/articles/CBMiVEFVX3lxTE1VS0ZRS2tYZVQxZWhnYzJMRXh4VURfdnphb0E2OWcwSTZlcEhsNjBhX1YtdUt3STU1ZkdicUxYdkR6eDdqc2I2SkdudGVibjB1LXhSNg?oc=5",
        description: "Dover bank holiday queues: France suspends extra EU border checks - follow live  BBCSee more headlines and perspectives on Google News",
        pubDate: "Sat, 23 May 2026 14:27:50 GMT",
        read: false,
        starred: false,
        author: "BBC",
        content: "<a href=\"https://news.google.com/rss/articles/CBMiVEFVX3lxTE1VS0ZRS2tYZVQxZWhnYzJMRXh4VURfdnphb0E2OWcwSTZlcEhsNjBhX1YtdUt3STU1ZkdicUxYdkR6eDdqc2I2SkdudGVibjB1LXhSNg?oc=5\" target=\"_blank\">Dover bank holiday queues: France suspends extra EU border checks - follow live</a>  <font color=\"#6f6f6f\">BBC</font><strong><a href=\"https://news.google.com/stories/CAAqNggKIjBDQklTSGpvSmMzUnZjbmt0TXpZd1NoRUtEd2lJXzdXYkVSSG5tdEViNVlHbzhTZ0FQAQ?hl=en-GB&gl=GB&ceid=GB:en&oc=5\" target=\"_blank\">See more headlines and perspectives on Google News</a></strong>"
      },
      {
        id: "gn-3",
        title: "Who are Andy Burnham’s key aides and allies? - The Guardian",
        link: "https://news.google.com/rss/articles/CBMilgFBVV95cUxNYUlaQjhBNXVDNWhSUXZrYURZSDRVLUczY01ZeUlhZDk3bDQweXV2UW03QmZkVmdMWUdyWjkzbmY3dUlPQTZ1NUJDZm5fdTA1em96RVc1aXZPUVBtRmtieHVheGJnRnRFNm05XzgzaE1kVlRSeTBVVGJZa3RiM0M1MG5YQXE3UjNKMDZTWml4bW5sakFPYUE?oc=5",
        description: "Who are Andy Burnham’s key aides and allies? (The Guardian) • Related: Makerfield by-election contest date confirmed (BBC) • Related: Hate Labour? Vote Labour! (economist.com) • Related: Burnham’s not the messiah. He’...",
        pubDate: "Sat, 23 May 2026 09:00:00 GMT",
        read: false,
        starred: false,
        author: "The Guardian",
        content: "<ol><li><a href=\"https://news.google.com/rss/articles/CBMilgFBVV95cUxNYUlaQjhBNXVDNWhSUXZrYURZSDRVLUczY01ZeUlhZDk3bDQweXV2UW03QmZkVmdMWUdyWjkzbmY3dUlPQTZ1NUJDZm5fdTA1em96RVc1aXZPUVBtRmtieHVheGJnRnRFNm05XzgzaE1kVlRSeTBVVGJZa3RiM0M1MG5YQXE3UjNKMDZTWml4bW5sakFPYUE?oc=5\" target=\"_blank\">Who are Andy Burnham’s key aides and allies?</a>  <font color=\"#6f6f6f\">The Guardian</font></li><li><a href=\"https://news.google.com/rss/articles/CBMiXEFVX3lxTE4wTWVla295Q1ZNN3NNU2ZESlVWendXYml4UlMwcm1hckhuY3Mybmc2czlKelR5M1IwbTJmZ215Qm9jaWtpUE1HVkRQMFFBTWRDcTFDZUtDNGtEakxS?oc=5\" target=\"_blank\">Makerfield by-election contest date confirmed</a>  <font color=\"#6f6f6f\">BBC</font></li><li><a href=\"https://news.google.com/rss/articles/CBMid0FVX3lxTFBEWEN2YnRpa1MzN0ptdTVzUDdvZVByRGZ0U0drWnpUZEZQZ3loUUpGaDNmcDE1X0RZNW1ma3FsblBROGFXTHJtNE1ad3lzTU5mdWFkU0k2OThNaVl2TE53NEhVX1c0MWJDelhfZ3pfSGRGdU9hWW1Z?oc=5\" target=\"_blank\">Hate Labour? Vote Labour!</a>  <font color=\"#6f6f6f\">economist.com</font></li><li><a href=\"https://news.google.com/rss/articles/CBMihAFBVV95cUxNbDhsekViTVpfaWtMMDdwaHlOWktRWUswTTBkN1ZSSDdBOG1IaGVKOUtmLW93N2dEZDZJNU9ObkdWb0tNaEQwOFhFTlNvWWR4a1lhbE1mRlNxLUFmWDZVMF9sNWtlQlRRaENyUkd4eDF3STBHRE5kNk4zOTNMUFVORkFycWU?oc=5\" target=\"_blank\">Burnham’s not the messiah. He’s old Labour’s last throw</a>  <font color=\"#6f6f6f\">Financial Times</font></li><li><a href=\"https://news.google.com/rss/articles/CBMiogFBVV95cUxONjlOTlNfMFNCOW9CZGw4VHhtLWRNLTlpeEo3LXY4U1o4Q0tfRTM1blJFbHE0RnVQcTB3dVFmSU9kTFNhY1AxekNYOUJVbVBIX0dFTWVZeUswVm1BMS1BamhzRzVrYzJsT1pEUTdKam9leHdtUEVFMWFiRkJ3ejlUdVRoZGw5b2dYcGNDaEdjQnJQUGdiMFVSUmZxaDN6N3pmYnc?oc=5\" target=\"_blank\">Inside the Brexit-voting Labour stronghold that looks set to determine our next prime minister</a>  <font color=\"#6f6f6f\">The Independent</font></li></ol>"
      },
      {
        id: "gn-4",
        title: "EU reportedly nixes UK pitch for single market in goods - politico.eu",
        link: "https://news.google.com/rss/articles/CBMinwFBVV95cUxNLTJTaFppUE1wUWM1eElvcjMtMjZ6U2RyWTVDNHI2YVRSdkkxNlVuWEctc2REd1RvaFZPSjY0cHNtRl9VQlVSNTBqeUlac05ZQ3k3MUlic1J3YnNVSFlEMklKZi0tS055WEwtLUFuS0d1M2hiUlVfNDh3dzNwX1pSdWtRdHNodFRGQkY1WmNCcm5LOC12ZTNfdUhrcmszVnM?oc=5",
        description: "EU reportedly nixes UK pitch for single market in goods (politico.eu) • Related: UK officials suggested single market for goods with Europe (BBC) • Related: UK needs ‘national consensus’ over rejoining EU, David Milib...",
        pubDate: "Sat, 23 May 2026 11:56:00 GMT",
        read: false,
        starred: false,
        author: "politico.eu",
        content: "<ol><li><a href=\"https://news.google.com/rss/articles/CBMinwFBVV95cUxNLTJTaFppUE1wUWM1eElvcjMtMjZ6U2RyWTVDNHI2YVRSdkkxNlVuWEctc2REd1RvaFZPSjY0cHNtRl9VQlVSNTBqeUlac05ZQ3k3MUlic1J3YnNVSFlEMklKZi0tS055WEwtLUFuS0d1M2hiUlVfNDh3dzNwX1pSdWtRdHNodFRGQkY1WmNCcm5LOC12ZTNfdUhrcmszVnM?oc=5\" target=\"_blank\">EU reportedly nixes UK pitch for single market in goods</a>  <font color=\"#6f6f6f\">politico.eu</font></li><li><a href=\"https://news.google.com/rss/articles/CBMiXEFVX3lxTFBjT25uRGpuZ2VuTVJGeGFKUFlRRTl0NEVKbTFzeHNneGxVRXptTGJ0cFRFaWRIaTdROVp0cGhsSnlvNWtFWVlYUkdqQjI1V041bFJOamdUb3hDSXFx?oc=5\" target=\"_blank\">UK officials suggested single market for goods with Europe</a>  <font color=\"#6f6f6f\">BBC</font></li><li><a href=\"https://news.google.com/rss/articles/CBMirwFBVV95cUxPYm9GNDhobmUwWldkVnNSdVc3TjNVZEFHd25pOEoxQWdEWTJ6aEVvOS1Jb2d5NkY4cW5POVpNZ1BhWUdUaktNRjZ6SkV0eTJxUVR0aGRYemZlVzFMVXF3SHc5dTAwLU9YSVlRYUpxQlV3aFpFdHdfQVkwdTM5dF85Z0ZSYnA1aFphTEFHMTAzcGoyVUdzaERZb2Y3VHBJemNid3d4OFBWQ1hIZzBBMGxr?oc=5\" target=\"_blank\">UK needs ‘national consensus’ over rejoining EU, David Miliband says</a>  <font color=\"#6f6f6f\">The Guardian</font></li><li><a href=\"https://news.google.com/rss/articles/CBMilAFBVV95cUxNUXRpX0YxUVZWLUpIY3djelZlS1VBaFBvdW9sX3ZzMG9QUHhFWHRCNXJfNnY3bDFJYV9ybUUtZkplRGk4TnZqWEhwNVIzZ1JicklGUHc4a3ExVE9YWExRRHB6dzM1blF5UGVHbEUyOWlDNC1OeXdDbGVCTFRibUlLWnUzaGxfb3NPcXlNUjNaZFpiNGNV?oc=5\" target=\"_blank\">Brussels rejected UK proposal to rejoin single market for goods</a>  <font color=\"#6f6f6f\">The Times</font></li><li><a href=\"https://news.google.com/rss/articles/CBMihAFBVV95cUxQbjI4RWVob1FvQ2ZGaUQyQ1pfWExLT01IT3E5Y3l3cXBNS3Y2U0RyVmxOblhyclBJUWNVcHd4LUVaR1dianQ1RU9Qcm90Z211akpmRWJ4SmsxQ3dSbjlvLWhfam56RnZlRjN5TGR5d0pzX1ZlOFZMRWltcVE1cWlfRkZobEM?oc=5\" target=\"_blank\">EU rejects UK push to create a single market for goods</a>  <font color=\"#6f6f6f\">Financial Times</font></li></ol>"
      },
      {
        id: "gn-5",
        title: "'Heat leaves Africa and Med in shade' and 'Can't cope without Catherine' - BBC",
        link: "https://news.google.com/rss/articles/CBMiXEFVX3lxTE9mUXpXWE5PSHRTWlQxaV9RTWdKRmJsNVpiRDFmb1ZjaE15VVVTWWdHOXI1NGNUbUJVUFAtY2RQNnRvUjN1cE9Vazg3RllDOVZ6QmlmX3NQOERaUHhq?oc=5",
        description: "'Heat leaves Africa and Med in shade' and 'Can't cope without Catherine' (BBC) • Related: UK weather: Heat set to intensify over bank holiday weekend as heatwave forecast (BBC) • Related: Health alerts for bank holida...",
        pubDate: "Sat, 23 May 2026 00:49:20 GMT",
        read: false,
        starred: false,
        author: "BBC",
        content: "<ol><li><a href=\"https://news.google.com/rss/articles/CBMiXEFVX3lxTE9mUXpXWE5PSHRTWlQxaV9RTWdKRmJsNVpiRDFmb1ZjaE15VVVTWWdHOXI1NGNUbUJVUFAtY2RQNnRvUjN1cE9Vazg3RllDOVZ6QmlmX3NQOERaUHhq?oc=5\" target=\"_blank\">'Heat leaves Africa and Med in shade' and 'Can't cope without Catherine'</a>  <font color=\"#6f6f6f\">BBC</font></li><li><a href=\"https://news.google.com/rss/articles/CBMiXkFVX3lxTFA4R3l5ek41RzFjRDhZalJteUM4alFvenVnQzJkanlwR0tLaUJ2Mlc0Mi03MTY3UUVJYnBvdlgxU0JJZ2tmV0txN0dlSU0tWFdodzA1R1VmUnJWSHFDT0E?oc=5\" target=\"_blank\">UK weather: Heat set to intensify over bank holiday weekend as heatwave forecast</a>  <font color=\"#6f6f6f\">BBC</font></li><li><a href=\"https://news.google.com/rss/articles/CBMivwFBVV95cUxQRWNDaWpvV3c2UENDR2Y1d1h3Y0R0X3lFa3IzenF1SVBjTHJJck5aVmNQU0pBSDZ5MTNLRHRTMVo0UFI0eS04N21vcWRQN1pZUG9xOGoyV1o0blhvbWZWbEFwbUt4WVkxdGhINkxMQzd2d2pOd3J5OW04SXFFcUJqRDlVejVscV9IaGdmbk56UGlrWUYxVXY0QVJXMDZvNDVwSEFWeVQ2Vk5EczNZTms5VzcyS0NuR0VoSEVxVzQ4NA?oc=5\" target=\"_blank\">Health alerts for bank holiday weekend as record May heat forecast in UK</a>  <font color=\"#6f6f6f\">The Guardian</font></li><li><a href=\"https://news.google.com/rss/articles/CBMiWkFVX3lxTE9Rc1ZLT2pVQ0VJZExQc0RLbERleGRYRkhFSURTbGY1V2NKUlQtb3VnUnhkMFBSWHZQWHJyY2hZdUlKdkFPbVI5UlUwUkFnT1RTRVNpeHdTdWFjdw?oc=5\" target=\"_blank\">UK sees hottest day of year as bank holiday travellers face queues</a>  <font color=\"#6f6f6f\">BBC</font></li><li><a href=\"https://news.google.com/rss/articles/CBMipgFBVV95cUxPVlAwX3g0Z3JOTW5UNGF3QVFORDhHYWxmdFhkQVJtVlc4RVVoZ0c2V2lINWI5X3djeFlhVVBCTFpQcHVNbFV6VFhSQi00RF83YkZRcmhjeW5kcC1taHV2c0JTOUtvRXRYSF9lNXV3T2NDWkZkSjFHM3hMQzY1ZU9PMmhNNUo3RTh5eDlQaFRKY2FrdW5MZ1UzcDNpV0JEYVRCemV1YWpR?oc=5\" target=\"_blank\">How long will the UK heatwave last?</a>  <font color=\"#6f6f6f\">The Independent</font></li></ol>"
      },
      {
        id: "gn-6",
        title: "French pair held until trial after boys abandoned by road in Portugal - BBC",
        link: "https://news.google.com/rss/articles/CBMiXEFVX3lxTE00ZkdvWEZUdEV2RmRDUDVUbVV5bl8wdHBrazMwWlQ1WmhGWk1EbHJIc2o3eXN1Vl9VRzc3Qjg0LU9kWjVMeHpXWlBBWTZtcEJleTNnd3U3cmZsMmpV?oc=5",
        description: "French pair held until trial after boys abandoned by road in Portugal (BBC) • Related: Pair arrested after boys abandoned by road in Portugal (BBC) • Related: The shocking case of the abandoned children: what we know ...",
        pubDate: "Sat, 23 May 2026 12:39:10 GMT",
        read: false,
        starred: false,
        author: "BBC",
        content: "<ol><li><a href=\"https://news.google.com/rss/articles/CBMiXEFVX3lxTE00ZkdvWEZUdEV2RmRDUDVUbVV5bl8wdHBrazMwWlQ1WmhGWk1EbHJIc2o3eXN1Vl9VRzc3Qjg0LU9kWjVMeHpXWlBBWTZtcEJleTNnd3U3cmZsMmpV?oc=5\" target=\"_blank\">French pair held until trial after boys abandoned by road in Portugal</a>  <font color=\"#6f6f6f\">BBC</font></li><li><a href=\"https://news.google.com/rss/articles/CBMiWkFVX3lxTE80d2kyR290ZlkwWUJjNU5zQ1BqX1B0ZE1wOXIzNHZwc1hNYWN2ajRQZVd4WjNxbm1ubTZuQVpTa0JtektuVUJuQWpYQXdnbE8yQXJIUkpZWlBmUQ?oc=5\" target=\"_blank\">Pair arrested after boys abandoned by road in Portugal</a>  <font color=\"#6f6f6f\">BBC</font></li><li><a href=\"https://news.google.com/rss/articles/CBMiywFBVV95cUxPNVhkb0s1djFDbXktT0c4NDc2NzRpeFdFajBwa2hBTTdBb2U0RlFyU29BV2l0VnNiM1M2dV9uMnFjdHpMMGNET1ByY0djMHhLMm03cVhENHRCSzZWdUNGUnlQcEVkRDlvX2RxT3JhYlZpbEVpVVhCUlNPWU9xS3RQOG5xck81bWtyU1BteUVIR2FxTy1mYW5semU2T0tfY0ZyMzFCeC0zSkZ5SndkTV85LS1SRkxRazJEaTd5NUdmVFlfNEhObHE4YTNZQQ?oc=5\" target=\"_blank\">The shocking case of the abandoned children: what we know</a>  <font color=\"#6f6f6f\">Euronews</font></li><li><a href=\"https://news.google.com/rss/articles/CBMiVkFVX3lxTE1QVXdfY3RJLWtSUFc3OUY5Zlg1YWVFU3VybkQwdmhsVnp6X0w3OEk0M0E0R3FDcjZzRDYwaVZFY3ByVURzV0lrY3pNWTV5Uk9PSUdkSTNR?oc=5\" target=\"_blank\">French children, 4 and 5, found alone in Portugal woods after parents left them blindfolded</a>  <font color=\"#6f6f6f\">ynetnews</font></li><li><a href=\"https://news.google.com/rss/articles/CBMi9AFBVV95cUxNcjJLV21FeC1pOHBZbUU0dlBONnREaXlhX1huektkSV9Ldi0zZXpocVl3dzJVQ0JTa1hCMDRGQUZxazdXTVZybWUxbVpzOElPeGxlZmZBMktQbU9Mcm9mb0s1Z2Izel9RT1lDazlxcjFFV2RzOEtqU3hSajNrbk5UeWktX2RSLVFhNWEtWjVfc0s2cnUyYUgxOHJnVkN5eWhWVVYzeXUyRG0xZDlSY1FuVlA1U0xwS3EyZXF5ekxnU251WDd2VTIxY3pVMnJNeEZsd0EwS0oxZkZ3Q25kOE1wRnJNbjJ0MkRSZm9LOWdydTdyYVJV?oc=5\" target=\"_blank\">CCTV of mum and stepdad of boys abandoned in the woods in Portugal</a>  <font color=\"#6f6f6f\">News.com.au</font></li></ol>"
      },
      {
        id: "gn-7",
        title: "Whitefield police shooting update after suspect who 'drove at cops' dramatically arrested - Manchester Evening News",
        link: "https://news.google.com/rss/articles/CBMiuAFBVV95cUxQWGVGRU94R01CQ09BSENJVU82UFRJRkV6RjBhNDNlVUFGMGp2dHRJYXZaRjlTWk5XeHdNQ1gzTHJCYVBUb3pXdjZKSDc1UWQ3RG51UlZ6VmVFTkYyMXFPR29aWlduYWJRRDJpQWRQVWNBZThVa2F4VzgtTDlIWk54TDNFUS1nRzV5NzFwUXlmZVRUT2pXbVphUDVMY21ydnhkTzhIaDRNWlY2d3R4QlNhMEdGV0sxTTBs0gG-AUFVX3lxTE8zZVlYNm9XN1Y4djRBSFY3ZV96Si1LWHg5bDhtRU9taVFCN2prOXc1ZUVqWHkyTzEtZGVWNHNaMXBMcWpOc2ZsMmR4eWxseE9zeE0xYjJGZnYtZk9mbHJoNGt0SW5sMEVIVnkzMnhuY3ZQRExGNEZrM0RkWmZVOHd6T0RTbjVRMGNpM2FQdlF4S2hxSlZLRHhnUG5rNkhXeUZMNUstRktVQk5nR0ZRb0xkb3VOMVdfcmFTNWFwTUE?oc=5",
        description: "Whitefield police shooting update after suspect who 'drove at cops' dramatically arrested (Manchester Evening News) • Related: Update into ongoing incident in Bury (Greater Manchester Police) • Related: Man shot after...",
        pubDate: "Sat, 23 May 2026 08:53:00 GMT",
        read: false,
        starred: false,
        author: "Manchester Evening News",
        content: "<ol><li><a href=\"https://news.google.com/rss/articles/CBMiuAFBVV95cUxQWGVGRU94R01CQ09BSENJVU82UFRJRkV6RjBhNDNlVUFGMGp2dHRJYXZaRjlTWk5XeHdNQ1gzTHJCYVBUb3pXdjZKSDc1UWQ3RG51UlZ6VmVFTkYyMXFPR29aWlduYWJRRDJpQWRQVWNBZThVa2F4VzgtTDlIWk54TDNFUS1nRzV5NzFwUXlmZVRUT2pXbVphUDVMY21ydnhkTzhIaDRNWlY2d3R4QlNhMEdGV0sxTTBs0gG-AUFVX3lxTE8zZVlYNm9XN1Y4djRBSFY3ZV96Si1LWHg5bDhtRU9taVFCN2prOXc1ZUVqWHkyTzEtZGVWNHNaMXBMcWpOc2ZsMmR4eWxseE9zeE0xYjJGZnYtZk9mbHJoNGt0SW5sMEVIVnkzMnhuY3ZQRExGNEZrM0RkWmZVOHd6T0RTbjVRMGNpM2FQdlF4S2hxSlZLRHhnUG5rNkhXeUZMNUstRktVQk5nR0ZRb0xkb3VOMVdfcmFTNWFwTUE?oc=5\" target=\"_blank\">Whitefield police shooting update after suspect who 'drove at cops' dramatically arrested</a>  <font color=\"#6f6f6f\">Manchester Evening News</font></li><li><a href=\"https://news.google.com/rss/articles/CBMiqgFBVV95cUxON21ZSDlodnZ4OC1SMUpCbi1iaUlQZ2tJeWh5ZHQ0VUdoa2JQYkZLRlJ1VmRmVUdNeXBiYzBDWlB4dWlxMWNrY2tYTkg4Q2ZYcnlodXM0X1Z6VEFxY2hjZTJtRi1jWUxwZzNRd0owYkkxUUstbGluVXo2TUgxeWVxRG5FalRDY3lvTFlzZFZ3ekVQeGUybzN2VVdRWGRKbWZadGNfQm1VWVJXQQ?oc=5\" target=\"_blank\">Update into ongoing incident in Bury</a>  <font color=\"#6f6f6f\">Greater Manchester Police</font></li><li><a href=\"https://news.google.com/rss/articles/CBMiXEFVX3lxTE1HeWx2bm43UEM1RC0xNnBnem15UjJVSFRsUDA5bkktaXAzb1FFT2pPZFI2OHlQR0d1UFJzQ08wRGxqQndvUUdldXRzVkx0d0xRaFBlU2UwaWVIR0N6?oc=5\" target=\"_blank\">Man shot after car 'driven at' officers, say police</a>  <font color=\"#6f6f6f\">BBC</font></li><li><a href=\"https://news.google.com/rss/articles/CBMiswFBVV95cUxPUm1Ca3h0bl9EZ0s3ckd0TnZsMWkxVWNNNDhpdGxMeElGVFRkMVFuaDUtRklLdmNpTzk2VWVhVkREVlRRSXVSSzVVX2JWZTc4V1ppTTlZNldlYkY0NEg4Ni1wcHZOQmdIR3lVYTQ1eVI4b3pKUU1qYVVmV0tEV29wYWg0YU92azB4ZVQ5QzJFWkdjZGE5cDgtU3VyRk9EbV9CdlRrNWtHX0c2b2dJN0F1UVMtRQ?oc=5\" target=\"_blank\">Motorist shot by police after car driven ‘directly at officers’ in Bury | ITV News Granada</a>  <font color=\"#6f6f6f\">ITVX</font></li><li><a href=\"https://news.google.com/rss/articles/CBMiiwFBVV95cUxOMGlzTTlVaDlndWd2dXIwaU96SDY4MmpPZVBVSllFOVhEdVQzd2RuRGpyaEZpcFFTSktMZWQ3bUdHclVOMm9jcE4tbk1JYUNBcEozNzgwajZwRWJ2a3IyQk1KY2kxWlQwOUdQWW92TDRXOE1yQmNhbzAwTHNLUU5FdGFlZFZXdzR5alpj?oc=5\" target=\"_blank\">Motorist shot by police after ‘driving directly at officers’ in bid to evade arrest</a>  <font color=\"#6f6f6f\">AOL.com</font></li></ol>"
      },
      {
        id: "gn-8",
        title: "A55 crash causing long delays - North Wales Live",
        link: "https://news.google.com/rss/articles/CBMijwFBVV95cUxQdW9Od3BRWERjNnU4Q0ppMFhWREJHNklnck80NmNuVTNubG1Pb1dFT3FMMzRZYmdzUmhoNWlIZUFtWUt3STVsQmdaUElCZ1h3cjJySkJ3d0JpZW52WFU2bC1Hd2hOV3NiR2kxdko2TGFfSGIwN3pEb0RtXzAtcVlOMl9mWE1iNnVhQnQ3eXBSUQ?oc=5",
        description: "A55 crash causing long delays (North Wales Live) • Related: Anglesey prepares to host Europe's largest travelling youth festival (BBC) • Related: Celebrating Welsh culture at the Urdd Eisteddfod 2026 (Cardiff Universi...",
        pubDate: "Sat, 23 May 2026 14:01:00 GMT",
        read: false,
        starred: false,
        author: "North Wales Live",
        content: "<ol><li><a href=\"https://news.google.com/rss/articles/CBMijwFBVV95cUxQdW9Od3BRWERjNnU4Q0ppMFhWREJHNklnck80NmNuVTNubG1Pb1dFT3FMMzRZYmdzUmhoNWlIZUFtWUt3STVsQmdaUElCZ1h3cjJySkJ3d0JpZW52WFU2bC1Hd2hOV3NiR2kxdko2TGFfSGIwN3pEb0RtXzAtcVlOMl9mWE1iNnVhQnQ3eXBSUQ?oc=5\" target=\"_blank\">A55 crash causing long delays</a>  <font color=\"#6f6f6f\">North Wales Live</font></li><li><a href=\"https://news.google.com/rss/articles/CBMiXEFVX3lxTE51OVNzazFQS043elFPQ3FnM0F3U0k2bjFxakV6X0RjRWZYWDZ6SWhjSDhsZnI3a19KdVBDQThhN2pMdWNzckxhRjZtUWN5WWFNczRCdFRGc3A1VzBG?oc=5\" target=\"_blank\">Anglesey prepares to host Europe's largest travelling youth festival</a>  <font color=\"#6f6f6f\">BBC</font></li><li><a href=\"https://news.google.com/rss/articles/CBMingFBVV95cUxOaFNrRGViVGNyTFRuczhCNnBQVGdSNTlmRjV3QU5wN0R0cVNxRlg2c2RPR2d1WUswSWhnbDZhOWpoSEJPNk9mVEJkM3NQVFo4a2FLOUhuSDNaWU1VTnQzREpaUDY2UUhVMlVpODEtMUV6MmhSNDhUU2pmN1NSanBBNUE1VXh0dGVlbjJYd0Z0MTljTVI4ckV4SjBQOTQwUQ?oc=5\" target=\"_blank\">Celebrating Welsh culture at the Urdd Eisteddfod 2026</a>  <font color=\"#6f6f6f\">Cardiff University</font></li><li><a href=\"https://news.google.com/rss/articles/CBMiwwFBVV95cUxQOFh1YTdGamgwMWhkemlJejhUNEdSaC1CZ1UxWUJoVFBTcVBuNDU1UnQzVmhaUi1PWUZSdUN4c0xQUlB4dXNjT05BWFlBMGNZby1LOHRrUDZYdF9hRW9BZFg2cE8tNGd6cTBlaUxnTEtjOGNaeVlzYWtBbzEtVGsyS0JEbDRZazdwaExSdXhyemRxQlVBbjZwWWVka1M0SzY5X0N3MVJIOVBBbDZnR0FIa2prUGFKX2tQVlFlek9pTllsM00?oc=5\" target=\"_blank\">Transport for Wales renews supports for the Urdd’s ‘Cronfa Cyfle i Bawb’ (Fund for All)</a>  <font color=\"#6f6f6f\">Herald.Wales</font></li><li><a href=\"https://news.google.com/rss/articles/CBMipwFBVV95cUxNMEpwZExhcGlva2FDelVYM1JsMGxOdTdDY2NWX0E5T29BYUc1WHhsYTIyeTB4cHNtQlI0TmIyX3ZNTEdzSUI4MDNsWkFXWGdYRTFkX0JpbmllM2dTTGpfa3BZcGo3WkFIaklSVkpndnF3TDJ4SlBWRHNaOXFJelpQNzdvR2xPRktaMVN1Um5JU0MtSEFYSkE0Qldja3RrbWhWT3M0QWRvcw?oc=5\" target=\"_blank\">Traffic warning issued for A55 as more than 100,000 travel to Anglesey</a>  <font color=\"#6f6f6f\">Rhyl Journal</font></li></ol>"
      },
      {
        id: "gn-9",
        title: "E-scooter and officer collide near Buckingham Palace - BBC",
        link: "https://news.google.com/rss/articles/CBMiWkFVX3lxTFBCUkluRWxaaWdqYV9GSU5JOUlIbjJ1Q09DamExWUk3M1NncWRrNnZUdktxZEhncjFrT1RDa2tOYUd0aloyUERFbm5yUkF2NXdBN2dia3J6ZlBIUQ?oc=5",
        description: "E-scooter and officer collide near Buckingham Palace  BBC",
        pubDate: "Sat, 23 May 2026 10:23:22 GMT",
        read: false,
        starred: false,
        author: "BBC",
        content: "<a href=\"https://news.google.com/rss/articles/CBMiWkFVX3lxTFBCUkluRWxaaWdqYV9GSU5JOUlIbjJ1Q09DamExWUk3M1NncWRrNnZUdktxZEhncjFrT1RDa2tOYUd0aloyUERFbm5yUkF2NXdBN2dia3J6ZlBIUQ?oc=5\" target=\"_blank\">E-scooter and officer collide near Buckingham Palace</a>  <font color=\"#6f6f6f\">BBC</font>"
      },
      {
        id: "gn-10",
        title: "White van man handed CRIMINAL CONVICTION for tooting his horn at friend - thesun.co.uk",
        link: "https://news.google.com/rss/articles/CBMihwFBVV95cUxNdjZpVUVzc3hOaTJLeWJzaHVHaDZjNWczYVBFbEVCM19ESUxSWm5jNXhKck95QlQxOU43amFSSjNFaVVjX0JEMXFzOVlaWHc3VG5GZ3BNRHlqejVuSDkzVjRSUnVWVUo1WFNYdWJiTmprNXRLblJfSDFhWVZYcWJ0RXg3Y0xudXc?oc=5",
        description: "White van man handed CRIMINAL CONVICTION for tooting his horn at friend  thesun.co.ukSee more headlines and perspectives on Google News",
        pubDate: "Sat, 23 May 2026 11:06:36 GMT",
        read: false,
        starred: false,
        author: "thesun.co.uk",
        content: "<a href=\"https://news.google.com/rss/articles/CBMihwFBVV95cUxNdjZpVUVzc3hOaTJLeWJzaHVHaDZjNWczYVBFbEVCM19ESUxSWm5jNXhKck95QlQxOU43amFSSjNFaVVjX0JEMXFzOVlaWHc3VG5GZ3BNRHlqejVuSDkzVjRSUnVWVUo1WFNYdWJiTmprNXRLblJfSDFhWVZYcWJ0RXg3Y0xudXc?oc=5\" target=\"_blank\">White van man handed CRIMINAL CONVICTION for tooting his horn at friend</a>  <font color=\"#6f6f6f\">thesun.co.uk</font><strong><a href=\"https://news.google.com/stories/CAAqNggKIjBDQklTSGpvSmMzUnZjbmt0TXpZd1NoRUtEd2psbmJHYkVSRm5Yc083eGxrRzNTZ0FQAQ?hl=en-GB&gl=GB&ceid=GB:en&oc=5\" target=\"_blank\">See more headlines and perspectives on Google News</a></strong>"
      },
      {
        id: "gn-11",
        title: "China: 90 killed and nine trapped following gas explosion at coal mine - Sky News",
        link: "https://news.google.com/rss/articles/CBMingFBVV95cUxNb09SWmpxeGpyTExTUVAxNnFRSVVGR0NBc1hGcnJCdVV1RWFXbTdrSDFETFE3bDlPS0xvRzVpdWlDeGJTQkxnS2tSNlIycVNaQW5lN3FUTnhHT3R4MlA4QVBoa0RNTUNVbkVNR1lZb1F2ZHRYWlhGajJOaVBDbko5ZFZnN1BSQjczNXRmTzl0QU1yVVF0ekliT3VFQW5Idw?oc=5",
        description: "China: 90 killed and nine trapped following gas explosion at coal mine (Sky News) • Related: At least 90 killed in Chinese coal mine explosion, state media reports (BBC) • Related: China mine death toll rises to 90 af...",
        pubDate: "Sat, 23 May 2026 10:46:58 GMT",
        read: false,
        starred: false,
        author: "Sky News",
        content: "<ol><li><a href=\"https://news.google.com/rss/articles/CBMingFBVV95cUxNb09SWmpxeGpyTExTUVAxNnFRSVVGR0NBc1hGcnJCdVV1RWFXbTdrSDFETFE3bDlPS0xvRzVpdWlDeGJTQkxnS2tSNlIycVNaQW5lN3FUTnhHT3R4MlA4QVBoa0RNTUNVbkVNR1lZb1F2ZHRYWlhGajJOaVBDbko5ZFZnN1BSQjczNXRmTzl0QU1yVVF0ekliT3VFQW5Idw?oc=5\" target=\"_blank\">China: 90 killed and nine trapped following gas explosion at coal mine</a>  <font color=\"#6f6f6f\">Sky News</font></li><li><a href=\"https://news.google.com/rss/articles/CBMiXEFVX3lxTE9QS2NIQnRURTA5Wnhxb2I1b2x5cHppb0VrVXlTSU1RdnVNalFsN2ctUVk2eDM2NTRkVHdpZlVoUTlKOV92X0VmWEZBLWt1MGhvOWtvaEI1TnNDVnkt?oc=5\" target=\"_blank\">At least 90 killed in Chinese coal mine explosion, state media reports</a>  <font color=\"#6f6f6f\">BBC</font></li><li><a href=\"https://news.google.com/rss/articles/CBMilgFBVV95cUxPUXZvR1JnMVk1Zzdlc1oxYVptZEVaSGZPWUdkdXBpanpjU2VoWm9ON3BMZUpyOC1NVFFUN1Y3c1Y5Z0xPelBqRDZXWnRtaDk5U2tsNDZwUlNEbFNWY0ZZUkRYdVVEck5sdDA1amlnTW5hZ3U3NjBmTWQzWnFLTjUyemZ1SGJZU1ZyOUpSdVgzZkg4R2k5Rnc?oc=5\" target=\"_blank\">China mine death toll rises to 90 after gas blast</a>  <font color=\"#6f6f6f\">The Guardian</font></li><li><a href=\"https://news.google.com/rss/articles/CBMihwFBVV95cUxQQVdreTZUTzRDTmpJaUVseVpGQkFkQ0xIdmZNaEhQdjdrclRrc2tqeUw3UlFBS2d6eEdkekw4Z0FjZ012NWJCa1FSS1hpVG9xbkFyeUhpSl9XaXQ1N1V5MDFzcVdIZ09LSkJPVFhQVlZ1UlNPNzJxWlRsU3N3Z3hZV1FyOGM3Nms?oc=5\" target=\"_blank\">Xi Calls for All-Out Rescue After Coal Mine Explosion Kills at Least 90 in China</a>  <font color=\"#6f6f6f\">The New York Times</font></li><li><a href=\"https://news.google.com/rss/articles/CBMiugFBVV95cUxQMl9ST0l2eGhRbkVpc3pnbWpleHFRRkRFdVZ0R2JxeklUQjR0d2xoNUx3dVhRX2RvdjZUWUlzZDNmTkpudS1JQXR6b1ZfSkNYbmVRMVo0QlFVTTl5dGdqV1c2SWVBVDI2dnU5M09od2RkMFI4Ry1qOHk1clBIanJzSTZzWXZVMjFUSXdnMTI3WHhTeDlGbUFBODVwdjk4ZHRtOXZNZzhEOTNDS1RDaTNRZG5SeDl4eUhPWVE?oc=5\" target=\"_blank\">Four dead, 90 trapped in Chinese coal mine with elevated carbon monoxide levels</a>  <font color=\"#6f6f6f\">CNN</font></li></ol>"
      },
      {
        id: "gn-12",
        title: "‘If something goes wrong, you can’t simply surface’: Maldives tragedy shines light on dangers of cave diving - The Guardian",
        link: "https://news.google.com/rss/articles/CBMiowFBVV95cUxOdFRpSm4ta2k0QXRKU0t6ZkpmaG9xX3g4Z1dBanMxYnBmN1BnNlhUOEMtLUhvTVYzT25vSFg0WVkwRzdIUmJtX2pFUVpYYk1JNDlHTDBfa2JuSEowdkFhLWdzUVN3NG1DWGFIRUJ5QnZsS2ZlR0tTQ3ZrZ2R6RkJROEZic3dENkQyLVlLYzllTFZ5bktKdVQwcjF3V0VYc0ZUY1I0?oc=5",
        description: "‘If something goes wrong, you can’t simply surface’: Maldives tragedy shines light on dangers of cave diving (The Guardian) • Related: Bodies of Italian divers did not have optimal equipment, says rescuer (BBC) • Rela...",
        pubDate: "Sat, 23 May 2026 10:01:00 GMT",
        read: false,
        starred: false,
        author: "The Guardian",
        content: "<ol><li><a href=\"https://news.google.com/rss/articles/CBMiowFBVV95cUxOdFRpSm4ta2k0QXRKU0t6ZkpmaG9xX3g4Z1dBanMxYnBmN1BnNlhUOEMtLUhvTVYzT25vSFg0WVkwRzdIUmJtX2pFUVpYYk1JNDlHTDBfa2JuSEowdkFhLWdzUVN3NG1DWGFIRUJ5QnZsS2ZlR0tTQ3ZrZ2R6RkJROEZic3dENkQyLVlLYzllTFZ5bktKdVQwcjF3V0VYc0ZUY1I0?oc=5\" target=\"_blank\">‘If something goes wrong, you can’t simply surface’: Maldives tragedy shines light on dangers of cave diving</a>  <font color=\"#6f6f6f\">The Guardian</font></li><li><a href=\"https://news.google.com/rss/articles/CBMiXEFVX3lxTE8tTTNObVNzRWE3SU1YVEJfNEVSbjhOeU84aWdFNm1tSlVKWTFwU3FiMXJQOXlHc091UjNua250eWhuUFNVaTJVRkFmazgzbW9nSzU2R1h1NVdpVjBH?oc=5\" target=\"_blank\">Bodies of Italian divers did not have optimal equipment, says rescuer</a>  <font color=\"#6f6f6f\">BBC</font></li><li><a href=\"https://news.google.com/rss/articles/CBMiiAFBVV95cUxNTFRNRXZLbFozOU4wMjZWZC1qeVNISU5uOW9FWVIxelNtMUljYjFsWW1kSzVFQmtwc19SckZYRlp6RGVDMjg2NjVseFkyOTFGYUJidUxjY2dmV0NneWEzTFlpbG05cFZpdFF1c2F1ZHhVZGJ1YWstMzRURVBRMzBabVc0QmJaa052?oc=5\" target=\"_blank\">Maldives cave divers died after ‘taking wrong turn’</a>  <font color=\"#6f6f6f\">The Telegraph</font></li><li><a href=\"https://news.google.com/rss/articles/CBMiswFBVV95cUxPX3lHeVNxZjVLOHdveTYyMjRVbEYtdm1yM1h6a05ZeHVDemYtd1VNSEJ5WHpSOVV3NkViNUttTXFocGJOTGVQM29LZExaQU9jbnlWc1pTZjVrSDBoWjhOMjZuakw2UTNfeFF4d2g1NEQ2U2w1N1h0eFc2ZE0yOWRoM3h3clBfWjZrMGxxNG5qTzNXUnRMOVpXM21QeldweC1kZG1xTy1hMG80bFVqaVQ0Tno0bw?oc=5\" target=\"_blank\">Italian authorities seize Maldives divers’ gear as tragic story unfolds</a>  <font color=\"#6f6f6f\">DIVE Magazine</font></li><li><a href=\"https://news.google.com/rss/articles/CBMipwFBVV95cUxNTzI3Ump4NjdkS0x0d1cza2VEWUNiSC1zbzZUcG9qVXBFOUxEaWhsUUlaY19RTk1xWTBpWDBza1BGVHZMYnpNa0J3TUVENTJILUpXRGw5cjJTNjVhX25rWVB6S2haNks1QWhQYmJheFIydUl0Rllpd0hGUGphdEEzQ181Nnl2YktmeXdjS0xrek5aekJEVGFMZE9Pc1h6djhQUkxjRVhxRQ?oc=5\" target=\"_blank\">First pictures of Maldives deep-sea caves where Italian divers died</a>  <font color=\"#6f6f6f\">The Independent</font></li></ol>"
      },
      {
        id: "gn-13",
        title: "At least 27 people injured with five in serious condition after trams smash into each other in German city centre - thesun.co.uk",
        link: "https://news.google.com/rss/articles/CBMifEFVX3lxTE0wSmlMZWp5aHpYeG1zTGxGN2Q3bldDZnFyR2VZQzd4MUYtZzdTMVZUOGhTU2xveWU3cUROYUZTTkE3ZjA2Z0RILTZVN3ZaVHlPLS1oMUR4blU2Q3U1bVNvaWV3R05wUTdtWVA3WjBvZWFXdmlTU3E0RGxnbnE?oc=5",
        description: "At least 27 people injured with five in serious condition after trams smash into each other in German city centre  thesun.co.ukSee more headlines and perspectives on Google News",
        pubDate: "Sat, 23 May 2026 12:54:00 GMT",
        read: false,
        starred: false,
        author: "thesun.co.uk",
        content: "<a href=\"https://news.google.com/rss/articles/CBMifEFVX3lxTE0wSmlMZWp5aHpYeG1zTGxGN2Q3bldDZnFyR2VZQzd4MUYtZzdTMVZUOGhTU2xveWU3cUROYUZTTkE3ZjA2Z0RILTZVN3ZaVHlPLS1oMUR4blU2Q3U1bVNvaWV3R05wUTdtWVA3WjBvZWFXdmlTU3E0RGxnbnE?oc=5\" target=\"_blank\">At least 27 people injured with five in serious condition after trams smash into each other in German city centre</a>  <font color=\"#6f6f6f\">thesun.co.uk</font><strong><a href=\"https://news.google.com/stories/CAAqNggKIjBDQklTSGpvSmMzUnZjbmt0TXpZd1NoRUtEd2pPa2J5YkVSRjNrR2hGYWF1TU5DZ0FQAQ?hl=en-GB&gl=GB&ceid=GB:en&oc=5\" target=\"_blank\">See more headlines and perspectives on Google News</a></strong>"
      },
      {
        id: "gn-14",
        title: "Ivanka Trump ‘targeted in Iran-backed assassination plot’ - The Telegraph",
        link: "https://news.google.com/rss/articles/CBMinAFBVV95cUxPQ0ViR1diYzJoUk9zY2dMMkJCZHNWNzhtMEsyTjRCa09vWS0xRlRwLXVYU1Q2S0FVT2pZODR4RGNGcmdLN0ZIWktpTEtCb3JfNktGdXN1TXdVaktOempxRmhWZktoNThrRXFiSHRCY3BvLWh3MGdFV1Z4U19DaTJqbTNDUXB4WFZYLURNVnlTUG55T2RNajFmWURPLUM?oc=5",
        description: "Ivanka Trump ‘targeted in Iran-backed assassination plot’ (The Telegraph) • Related: Exclusive | Ivanka Trump targeted for assassination by IRGC terrorist in twisted plot to avenge president taking out his mentor: sou...",
        pubDate: "Sat, 23 May 2026 03:36:00 GMT",
        read: false,
        starred: false,
        author: "The Telegraph",
        content: "<ol><li><a href=\"https://news.google.com/rss/articles/CBMinAFBVV95cUxPQ0ViR1diYzJoUk9zY2dMMkJCZHNWNzhtMEsyTjRCa09vWS0xRlRwLXVYU1Q2S0FVT2pZODR4RGNGcmdLN0ZIWktpTEtCb3JfNktGdXN1TXdVaktOempxRmhWZktoNThrRXFiSHRCY3BvLWh3MGdFV1Z4U19DaTJqbTNDUXB4WFZYLURNVnlTUG55T2RNajFmWURPLUM?oc=5\" target=\"_blank\">Ivanka Trump ‘targeted in Iran-backed assassination plot’</a>  <font color=\"#6f6f6f\">The Telegraph</font></li><li><a href=\"https://news.google.com/rss/articles/CBMi-gFBVV95cUxOeFVNZkJNQnpoSFBGd3hxSEFGcngwZlIxeUwyOUVYajdCaHNPTEVNWUgtNkZjZEc3dFFOTnozLURPQ2RONVNWcmJlbEtXdGdjd0QtSkltYkcwUWJKQ2FPdUtYV3ZPLUloR1pScl9MXzF5aXRpRGp5T1hEOE1pZy1EZmdUZlVHX2g4Q1hDUlEwZ3RDV1Q1MkpSUTJoNlVOUDRiSEhQMlVuY3JwZENNbmtYa1oyQzhyTEhadU9SYV9aTWM0d1dvZ1l4VTdzVjBfU1pPYkVoeTJFNFVxbFZ0NnRkekxrZ0tiTUxPX3hhZE9qZmpRVFl1YVlGRG1n?oc=5\" target=\"_blank\">Exclusive | Ivanka Trump targeted for assassination by IRGC terrorist in twisted plot to avenge president taking out his mentor: sources</a>  <font color=\"#6f6f6f\">New York Post</font></li><li><a href=\"https://news.google.com/rss/articles/CBMisAFBVV95cUxPTS0xZl9yd0ZtWWtKaDE5UG9sZDdkbGhmdFNrSEp4SUJ6MFk4X2RnYmdVQmRYbWpNd2dsNFEtX1RvSm90Rjd4QWx5allzZUprbkZQTmQtRGc4ZjI1SzRXaWNWQ21wRzlKV0FJR3lSTWhsbDduTGozOUlMcXJFSlN0V2ZZNDNGRXdWaW1RNU5hSTlqbE4wdndoYktBOGpCVG1rcWVaR2xPSWZBR1dQaEhHQtIBuAFBVV95cUxOQ3NpZWVrRjFFZlJwTmZhQ0pjcDk0SkUwTzRZc3NJWGJYdHFHajRCeEpicUNHV3dYaS1sR3JJUGVwWVdBQzFfWUVRRUtGcG0zMVNYYkZjTXB3YnpvWVNVbmtXSkJhbVpvTnJfX21oNHVDZE5ja3JoZlFnVFM2anMwYUw1bjE4eUJucTZHdmNCRVkyUGxsb1NDS2JCVDV0b1N3bHBwdUZ1clZYWFlTM3p5XzlmYXRsbXZR?oc=5\" target=\"_blank\">Ivanka Trump Assassination Plotted As Revenge Killing For Qasem Soleimani</a>  <font color=\"#6f6f6f\">NDTV</font></li><li><a href=\"https://news.google.com/rss/articles/CBMigwJBVV95cUxOTWlhZEFpeEFrVXhtU1NYaXZfVWtTUURjRDh2aGtwdW1Fa1hhcTJSSFNtYklMNHgzbVRRV2p0MzZyeXMyRVRfVGRUR2hJM0NDRmxfejR3WXZDV0prS1h0cHQxUE5GejA1MFlscXRBQUYxbGVHQ3d0cFFlem9aWlBVSGt1a3lPcTFSaXlhVEk3SDcyS0Nmdzh6UENRMWVRTGdLdXZRMjBJZzRMZmlRWGxkTktMblNQZDFmSmEzT0c1YlpyYk04YXFwdVVzTGEwdHVJcmFVYW1uR0JzanY5Y184SnJjVFhsQWF0cHU1Yllia1ZuVGhsRFN1WlRkcHg5X1BncGZV?oc=5\" target=\"_blank\">Report: IRGC-linked man suspected of plot on Ivanka Trump, attacks on Jewish targets, recently arrested in Turkey, extradited to US</a>  <font color=\"#6f6f6f\">The Times of Israel</font></li><li><a href=\"https://news.google.com/rss/articles/CBMilAFBVV95cUxNb1JtdTNQUmtYRlFiN1gtRjdVTVNDaElQTWktQVNqYTg1cW04WEtnTXI5aXMtVDFkNDR0T2ZxVVg3cG5uc25pWk03WmhOdHZpZDFJSHZTTmgxbXhRQTBDdmw4dGw3QW5mLWRNWnA1WjJTMTE1bU5yVE5nWFd1WGo1aTRMcmJVRC1KaTlIdVBDbFhCUGtS?oc=5\" target=\"_blank\">The National News Desk Weekend Edition</a>  <font color=\"#6f6f6f\">coastalabc.com</font></li></ol>"
      },
      {
        id: "gn-15",
        title: "Investors doubt Brewdog founder's shares pledge for new beer brand - BBC",
        link: "https://news.google.com/rss/articles/CBMiXEFVX3lxTE91ZkpHNkFnNHB6T0JJWVRSSnBSRnRIV2kyMG1FRW9EOTFFN1ZrRGIyanZKbHdNakkxdUhZdDR1T3FGUm5pazNUNEJaTTIwWVY3VkYzc19IU2JhZmt3?oc=5",
        description: "Investors doubt Brewdog founder's shares pledge for new beer brand (BBC) • Related: BrewDog founder launches new beer brand with vow to ‘equity punks’ (The Times) • Related: BrewDog founder James Watt plots comeback w...",
        pubDate: "Sat, 23 May 2026 10:32:26 GMT",
        read: false,
        starred: false,
        author: "BBC",
        content: "<ol><li><a href=\"https://news.google.com/rss/articles/CBMiXEFVX3lxTE91ZkpHNkFnNHB6T0JJWVRSSnBSRnRIV2kyMG1FRW9EOTFFN1ZrRGIyanZKbHdNakkxdUhZdDR1T3FGUm5pazNUNEJaTTIwWVY3VkYzc19IU2JhZmt3?oc=5\" target=\"_blank\">Investors doubt Brewdog founder's shares pledge for new beer brand</a>  <font color=\"#6f6f6f\">BBC</font></li><li><a href=\"https://news.google.com/rss/articles/CBMiqgFBVV95cUxObWwxdVc0akhMY1J6cEZMVkhtNDNlZkJwa2Vob0VzUnh3WmxhRms5dElseTVIdGFqYTJ5RGhUNkdyeXB5UXB5MXlUdFEycHFtck9KTERBd09MN3hwYi1qRDRkbTlOSVhxU3pZeXl1bHN1Vmh6Y3NYQ21VT1oyWkxBYVZyS2U5TDc3NTNBZm5US3JxYkMwRDR0QmZXdF9EeHJqaFBwQlNrcVlpZw?oc=5\" target=\"_blank\">BrewDog founder launches new beer brand with vow to ‘equity punks’</a>  <font color=\"#6f6f6f\">The Times</font></li><li><a href=\"https://news.google.com/rss/articles/CBMiqAFBVV95cUxNNVRZRXRoU0xlQlFvSjFFMHdpd3NteERWbUljS3FnRVlaMzMyd25jTnVPQTV1N3dGdmV5YmdWYm5waEdyeTN3ZHVMZDFLbWcxbWJ3VllxdXNfZ0pNVGtNcFd3b2RQMUZuNjNIQ1dLNnJxTzJOS3ItQnRvc2pTQUYwRDBYbU9scjZTVkhDLWFzV0lLZnNWLWphSzVIOWM5R0V2bkt5WVFOQ3E?oc=5\" target=\"_blank\">BrewDog founder James Watt plots comeback with new beer brand</a>  <font color=\"#6f6f6f\">The Telegraph</font></li><li><a href=\"https://news.google.com/rss/articles/CBMihAFBVV95cUxPV1l1cUJZellZVU9HdjBVWmw1cjJfQUNybWhfNU1sUklwMkFzenZBbXJWZVcyNUtxQ193TFRNWVZkbnJRejdmcXRicVl2NGNkR1dVWW1yeGk4U01wdzVQZk1RZF9JczdDS3RhYmJuaXhzX2M5T1BPVkVMQng2cXlfcjlKejY?oc=5\" target=\"_blank\">BrewDog co-founder to attempt comeback with ‘Second Best’ beer brand</a>  <font color=\"#6f6f6f\">Financial Times</font></li><li><a href=\"https://news.google.com/rss/articles/CBMisAFBVV95cUxPY2tvU1BkbW5Vc3NNaGpXVWRUZWdUNVBOM1BVMi1hSGFWbGE0OUZQX3p6OHRldFNKT1BBbzBqRGNNNGxWQ2hsR1RJZV96Z0dlUlR5T1BuVDJ1cDdFWXB6cXZfYW1vYWFhU0tGckVNa2RUU0NHclNIRTdrZE1oNTFaWTVuWVFieVN2VldaVk0yNkNIdnlWbUt3Y0l4Z3ctMEpYU2RSS3lHdlgyTkdibVpZTA?oc=5\" target=\"_blank\">BrewDog founder James Watt announces new beer brand Second Best</a>  <font color=\"#6f6f6f\">The Grocer</font></li></ol>"
      },
      {
        id: "gn-16",
        title: "SpaceX launches redesigned Starship in successful pre-IPO test - Financial Times",
        link: "https://news.google.com/rss/articles/CBMihAFBVV95cUxNRmVIWXVOS2dNa2x4YXZJanJJSWwyX1drNDlZRGtFZ05keHdBUUNvUllKVzZwQzJsN0k4RkY3ZDJGUlpiSHcydWN2WDctZDFyQ3pxdThXWDdhUEJZbG5zNGZBM2FfMFVmX2l1enRsbDlsU29jQmd6ZFZNVnl0dGFDdDJSTDA?oc=5",
        description: "SpaceX launches redesigned Starship in successful pre-IPO test (Financial Times) • Related: SpaceX Starship Flight 12: Don't miss these stunning photos from the launch of the most powerful Starship yet (Space) • Relat...",
        pubDate: "Sat, 23 May 2026 00:30:23 GMT",
        read: false,
        starred: false,
        author: "Financial Times",
        content: "<ol><li><a href=\"https://news.google.com/rss/articles/CBMihAFBVV95cUxNRmVIWXVOS2dNa2x4YXZJanJJSWwyX1drNDlZRGtFZ05keHdBUUNvUllKVzZwQzJsN0k4RkY3ZDJGUlpiSHcydWN2WDctZDFyQ3pxdThXWDdhUEJZbG5zNGZBM2FfMFVmX2l1enRsbDlsU29jQmd6ZFZNVnl0dGFDdDJSTDA?oc=5\" target=\"_blank\">SpaceX launches redesigned Starship in successful pre-IPO test</a>  <font color=\"#6f6f6f\">Financial Times</font></li><li><a href=\"https://news.google.com/rss/articles/CBMi-wFBVV95cUxPcW52UkU2R1ZFV1NiMDdIWHhnYkFseVpEeWMzbGcyeEVMNU1fa2JPd2p6bVBXZURBd0tKQUhrX3JWd0VkVDlteW9yN0dCeGZrc2pZXzhuSjJ0YU43aWdmTTV1U0NMV1BON01vREMyV0tvWjRnZndCRmtHTnNLbTBndDN5N3BETWtSSHZPWnQ4WHR5QWNvS0dzZUx6bFU0WVA0WHdDXy1vaF9yMXZ0cXpjbVhXeGluX19UYlR2V2JIamcySkpHZVVyYlY4OHJyU3l1Y3JfWTdxLU5TWUU4R04zazJieUhOcjVhYkVMUFVVSXZSUjdVNlR0T0NBMA?oc=5\" target=\"_blank\">SpaceX Starship Flight 12: Don't miss these stunning photos from the launch of the most powerful Starship yet</a>  <font color=\"#6f6f6f\">Space</font></li><li><a href=\"https://news.google.com/rss/articles/CBMilAFBVV95cUxPSHBBcDFUSG0yZ0VGemZNVC1oU1Y1ZThaMTVoajFFZG5qWURDOEdNbGpqbnhwSzRMcEJpa2FDTklMOFFOX1Bia2VmY2c5UG5Sb2NTY24wZ2VwTkhtQjV6a25nNXBFZFBiRW5ycHV5LXNiM25Sbm80MWdaSnRwOE8yZ1FzODJmbXVsWmttTHhaR1Y2WlFx?oc=5\" target=\"_blank\">Watch: SpaceX rocket explodes after splashdown</a>  <font color=\"#6f6f6f\">The Telegraph</font></li><li><a href=\"https://news.google.com/rss/articles/CBMilgFBVV95cUxNSWtrX05sLUlnWXJ5U000M2JoU2hBS21POEc0WW9pd04yN3dBNjdWQ01OcVVheTVuZ1hhdlZvemVtUUNzSG5vbEZJZWF0SHVsbURjbVlmOU9NbEp0RkJOZ2RzR3hRTmFpTEowODU4S2V3VzRHTVptVlJlRVk4RnZBRjVMcmdIUW92ZDBmVThwbGtYeXU1enc?oc=5\" target=\"_blank\">Highlights: Scaled-up SpaceX Starship megarocket finds mixed success in debut test flight</a>  <font color=\"#6f6f6f\">CNN</font></li><li><a href=\"https://news.google.com/rss/articles/CBMiuwFBVV95cUxNX1VlU2tlQkFWNFN6a1cxNF8xWXVVUnBLUWQxSGZCOUx2T0ZhYmVvaW10V05HbWZEUE5rMWNxSGhGeV8ycjVMQzY5WFFCRWlfcjJfMzJaNnFmREVTSUZyM1NNWXFvbWtTWmVGQVowZmpiajNxYng5MHRTT1VoZ3FMbmdzTzk3eERnWWpzUUxlcHF5TllNQlNGaEZqYjNITG1CdVgtTHdkX1pfRnZzdjdHNV90alA3RUhFRmM4?oc=5\" target=\"_blank\">SpaceX launches high-stakes test flight as record-breaking stock market debut looms</a>  <font color=\"#6f6f6f\">Sky News</font></li></ol>"
      },
      {
        id: "gn-17",
        title: "Bond vigilantes throw Trump’s ‘sock puppet’ Kevin Warsh off course - The Telegraph",
        link: "https://news.google.com/rss/articles/CBMiqAFBVV95cUxPcGJEdTZOWWx6WE5WVFR2eUgtTWIzZURhT3NFVFJxaVgtM3pydkNuNzNHTlpBbEUwVkYzSnhkMklIbW5KejNveWx4VG9veEx0ZWVKdlhRRjhFaWJKVGxFOGp1TW9JWDRMTmF4SXFMSndfUzNJdFpvbmk2VXNObWhOTFQydE9qQm96ODBBczZwdkpFRk5SV29hbXNNNGJJTkQyZFVldm45ZzM?oc=5",
        description: "Bond vigilantes throw Trump’s ‘sock puppet’ Kevin Warsh off course (The Telegraph) • Related: Trump wants new Fed chair to be 'totally independent' (BBC) • Related: Wall Street bets on 2026 rate rise as Kevin Warsh ta...",
        pubDate: "Fri, 22 May 2026 05:30:00 GMT",
        read: false,
        starred: false,
        author: "The Telegraph",
        content: "<ol><li><a href=\"https://news.google.com/rss/articles/CBMiqAFBVV95cUxPcGJEdTZOWWx6WE5WVFR2eUgtTWIzZURhT3NFVFJxaVgtM3pydkNuNzNHTlpBbEUwVkYzSnhkMklIbW5KejNveWx4VG9veEx0ZWVKdlhRRjhFaWJKVGxFOGp1TW9JWDRMTmF4SXFMSndfUzNJdFpvbmk2VXNObWhOTFQydE9qQm96ODBBczZwdkpFRk5SV29hbXNNNGJJTkQyZFVldm45ZzM?oc=5\" target=\"_blank\">Bond vigilantes throw Trump’s ‘sock puppet’ Kevin Warsh off course</a>  <font color=\"#6f6f6f\">The Telegraph</font></li><li><a href=\"https://news.google.com/rss/articles/CBMiXEFVX3lxTFBMR3JrTFhyc1R3ZndRNTJ2Q3BUVEVZZmhzMnAxWnZGbHRBb09WYmZTNmtuTHlyTXVtWldnRnRJdlF1cC11eDltY1hCWEQxUlF6b0lIRDZkdjNZdF9X?oc=5\" target=\"_blank\">Trump wants new Fed chair to be 'totally independent'</a>  <font color=\"#6f6f6f\">BBC</font></li><li><a href=\"https://news.google.com/rss/articles/CBMihAFBVV95cUxNVnBCbkx4cVlhVXJlWEpHTjJ6bmt6d1BSUnVxU2xabkhSUXY1dG0ya25mcmUyVW8ydTQxNnZfYWhDZHNlVVpnSldpUDlnX1NWOWVpTUtaRUJ1ODdyVHJyWUw5ZS1oTDU4RHhmNGtldVpXOFJDQ3NMaE1JUnpnVXQ1SzlsekY?oc=5\" target=\"_blank\">Wall Street bets on 2026 rate rise as Kevin Warsh takes charge of the Fed</a>  <font color=\"#6f6f6f\">Financial Times</font></li><li><a href=\"https://news.google.com/rss/articles/CBMijwJBVV95cUxObEMtY05tXzRWSmw5blUtTjl0SkZzcmZoYlBLOWM0WTVha3pLMEZIenR2YVRReUpvd1hSTDkyek1CODZodXJyUHh3NDVkUDk1U2ZhSGJpZ2lrQV83aHl6dGF1MTNNOWtpeE9rSFY2ZkVuMlFJSDl4R3hGaUtiZ2h3WnZReFdHTzVnY3hWLW96WDBqM1pxa3AzUGgzTkFCTGF1WHNoSmRaSV9wR056UUdwQkNVTVhhLXhsRXNlbzFrSUtDenA3bmlmOGlhcFNxVlVtZXdUcWlZZmpOZEpyaHFqaXhQOHZXd2ZUSmFEQU1TQVVjSkNRdWhycXl1Z1lUSEZYS09ONndpT0JpN2xWakgw?oc=5\" target=\"_blank\">Sunrise Movement takes credit for disrupting Trump’s New York state rally – as it happened</a>  <font color=\"#6f6f6f\">The Guardian</font></li><li><a href=\"https://news.google.com/rss/articles/CBMifkFVX3lxTFBvcGxZYkpPNXpRMmptYURlQU5SLVRyd0NDdDdYOS1UUFZvYXFaQTdaYk5YX2ZYZm9fbm5XQkdWQTdZcEFsTm9XTVU5R3owem9WZVM4NEpKc1BrU1FWQjlMSDBET3RRR0IzY2tUZU5vT0VRbmh5SGhRSHNKczhFUQ?oc=5\" target=\"_blank\">Kevin Warsh sworn in as Fed chair at pivotal moment for US economy</a>  <font color=\"#6f6f6f\">CNN</font></li></ol>"
      },
      {
        id: "gn-18",
        title: "Morrisons to shut 100 'loss-making' stores blaming surge in costs - Yahoo Finance UK",
        link: "https://news.google.com/rss/articles/CBMihgFBVV95cUxNX2M1ZVNFZDlYZHRtVW9iM2k1U0lHQVAzWFBUdTU3M3V0S2NKUGFLRXR5Ym9tTDBha0p6cXd1SUdoQkN6RnEzWVdrTXgtbzRkYTZDRzdndmRfY3NZNmdjVFFQS1hzeGNWOGFKeUVtcGZoSWY4WkdKNGFLR1lPTTA5Z1VKcktCZw?oc=5",
        description: "Morrisons to shut 100 'loss-making' stores blaming surge in costs  Yahoo Finance UKSee more headlines and perspectives on Google News",
        pubDate: "Fri, 22 May 2026 11:51:00 GMT",
        read: false,
        starred: false,
        author: "Yahoo Finance UK",
        content: "<a href=\"https://news.google.com/rss/articles/CBMihgFBVV95cUxNX2M1ZVNFZDlYZHRtVW9iM2k1U0lHQVAzWFBUdTU3M3V0S2NKUGFLRXR5Ym9tTDBha0p6cXd1SUdoQkN6RnEzWVdrTXgtbzRkYTZDRzdndmRfY3NZNmdjVFFQS1hzeGNWOGFKeUVtcGZoSWY4WkdKNGFLR1lPTTA5Z1VKcktCZw?oc=5\" target=\"_blank\">Morrisons to shut 100 'loss-making' stores blaming surge in costs</a>  <font color=\"#6f6f6f\">Yahoo Finance UK</font><strong><a href=\"https://news.google.com/stories/CAAqNggKIjBDQklTSGpvSmMzUnZjbmt0TXpZd1NoRUtEd2pZNDhxWkVSSFNlVFRSZUdiZGtpZ0FQAQ?hl=en-GB&gl=GB&ceid=GB:en&oc=5\" target=\"_blank\">See more headlines and perspectives on Google News</a></strong>"
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
