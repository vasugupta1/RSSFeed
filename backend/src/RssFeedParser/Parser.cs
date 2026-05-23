using System.Text;
using RssFeedParser.Enum;
using RssFeedParser.Factories;
using RssFeedParser.Models;

namespace RssFeedParser;

public class Parser : IParser
{
    private const string RSS = "<rss";
    private const string Atom = "<feed";
    private readonly IFeedDeserialiserFactory _feedDeserialiserFactory;

    public Parser(IFeedDeserialiserFactory feedDeserialiserFactory)
    {
        _feedDeserialiserFactory = feedDeserialiserFactory;
    }
    public async Task<Feed> Parse(Stream stream)
    {
        ArgumentNullException.ThrowIfNull(stream, nameof(stream));
        if (!stream.CanSeek)
        {
            throw new NotSupportedException("Streams are not seekable");
        }

        var feedType = await FeedType(stream);
        var deserializer = _feedDeserialiserFactory.GetDeserialiser(feedType);
        return await deserializer.Deserialise(stream);
    }

    private async Task<FeedType> FeedType(Stream stream)
    {
        var originalPosition = stream.Position;
        var buffer = new byte[1024];
        var bytesRead = await  stream.ReadAsync(buffer, 0, buffer.Length);
        var topLineSnippet = Encoding.UTF8.GetString(buffer, 0, bytesRead);
        stream.Position = originalPosition;

        if (topLineSnippet.Contains(RSS, StringComparison.InvariantCultureIgnoreCase))
        {
            return Enum.FeedType.Rss;
        }

        if (topLineSnippet.Contains(Atom, StringComparison.InvariantCultureIgnoreCase))
        {
            return Enum.FeedType.Atom;
        }
        
        return Enum.FeedType.Unknown;
    }
}