using RssFeedParser.Models;

namespace RssFeedParser;

public interface IParser
{
    Task<Feed> Parse(Stream stream);
}