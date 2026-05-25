namespace RssFeedWebApp.Features.Reader.Models;

public record CrawlRequest
{
    public string Url { get; set; }
}