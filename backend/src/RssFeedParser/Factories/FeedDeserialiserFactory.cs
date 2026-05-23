using System.ComponentModel;
using RssFeedParser.Enum;
using RssFeedParser.Services;

namespace RssFeedParser.Factories;

public class FeedDeserialiserFactory : IFeedDeserialiserFactory
{
    public IDeserialiser GetDeserialiser(FeedType feedType)
        => feedType switch
        {
            FeedType.Rss => new RssDeserialiser(),
            FeedType.Atom => new AtomDeserialiser(),
            _ => throw new InvalidEnumArgumentException("No Deserialiser provided")
        };
}