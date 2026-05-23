namespace RssFeedParser.Models;

public record Feed
{
    public string Title { get; set; } = string.Empty;
    public string Link { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<FeedItem> Items { get; set; } = new();
}

public record FeedItem
{
    public string Title { get; set; } = string.Empty;
    public string Link { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string PubDate { get; set; } = string.Empty;
}