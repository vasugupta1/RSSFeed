namespace RssFeedWebApp.Features.Reader.Models;

public record CrawlResponse
{
    public string Url { get; set; }
    public string Result { get; set; }
}