using RssFeedParser.Enum;
using RssFeedParser.Services;

namespace RssFeedParser.Factories;

public interface IFeedDeserialiserFactory
{
    IDeserialiser GetDeserialiser(FeedType feedType);
}