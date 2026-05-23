using RssFeedParser.Models;

namespace RssFeedParser.Services;

public class AtomDeserialiser : IDeserialiser
{
    public Task<Feed> Deserialise(Stream stream)
    {
        throw new NotImplementedException();
    }
}