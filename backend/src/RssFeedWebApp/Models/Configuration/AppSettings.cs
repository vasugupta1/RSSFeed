namespace RssFeedWebApp.Models.Configuration;

public record AppSettings
{
    public AiCrawlerService  AiCrawlerService { get; set; }
}

public record AiCrawlerService
{
    public string BaseUrl { get; set; }
    public string CrawlEndpoint { get; set; }
}
