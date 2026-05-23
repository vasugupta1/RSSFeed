using System.Xml;
using RssFeedParser.Models;

namespace RssFeedParser.Services;

public class RssDeserialiser : IDeserialiser
{
    public async Task<Feed> Deserialise(Stream stream)
    {
        var rssFeed = new Feed();
        var settings = new XmlReaderSettings { IgnoreWhitespace = true, IgnoreComments = true, Async = true };
        using var reader = XmlReader.Create(stream, settings);

        // Start by advancing to the first node
        bool hasMoreNodes = await reader.ReadAsync();

        while (hasMoreNodes)
        {
            if (reader.NodeType == XmlNodeType.Element)
            {
                if (reader.Name == "title" && reader.Depth == 2)
                {
                    rssFeed.Title = await reader.ReadElementContentAsStringAsync();
                    // ReadElementContentAsStringAsync advanced us, so DO NOT call ReadAsync() at the loop tail
                    continue; 
                }
                else if (reader.Name == "link" && reader.Depth == 2)
                {
                    rssFeed.Link = await reader.ReadElementContentAsStringAsync();
                    continue;
                }
                else if (reader.Name == "description" && reader.Depth == 2)
                {
                    rssFeed.Description = await reader.ReadElementContentAsStringAsync();
                    continue;
                }
                else if (reader.Name == "item")
                {
                    // Pass control to item parser. It handles its own internal reads.
                    rssFeed.Items.Add(await ParseRssItem(reader));
                    
                    // When ParseRssItem returns, it leaves us sitting on the node right AFTER </item>.
                    // Therefore, we must loop back without advancing again.
                    continue;
                }
            }

            // Only advance manually if we didn't process an element content string or sub-item
            hasMoreNodes = await reader.ReadAsync();
        }
     
        return rssFeed;
    }
    
    private async Task<FeedItem> ParseRssItem(XmlReader reader)
    {
        var item = new FeedItem();
        int itemDepth = reader.Depth;

        // Move off the opening <item> tag into its children
        bool hasMoreNodes = await reader.ReadAsync();

        while (hasMoreNodes && reader.Depth > itemDepth)
        {
            if (reader.NodeType == XmlNodeType.Element)
            {
                if (reader.Name == "title")
                {
                    item.Title = await reader.ReadElementContentAsStringAsync();
                    continue;
                }
                else if (reader.Name == "link")
                {
                    item.Link = await reader.ReadElementContentAsStringAsync();
                    continue;
                }
                else if (reader.Name == "description")
                {
                    item.Description = await reader.ReadElementContentAsStringAsync();
                    continue;
                }
                else if (reader.Name == "pubDate")
                {
                    item.PubDate = await reader.ReadElementContentAsStringAsync();
                    continue;
                }
            }

            hasMoreNodes = await reader.ReadAsync();
        }
        
        return item;
    }
}