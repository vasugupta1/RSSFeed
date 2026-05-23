using RssFeedParser.Models;

namespace RssFeedParser.Services;

public interface IDeserialiser
{
    Task<Feed> Deserialise(Stream stream);
}