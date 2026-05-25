using AngleSharp;
using AngleSharp.Dom;

namespace RssFeedWebApp.Features.Reader.Services;

public class FetchUrlService : IFetchUrlService
{
    private readonly HttpClient _httpClient;

    public FetchUrlService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }
    
    public async Task<CleanHtml> GetUrlAsync(string url)
    {
        var config = Configuration.Default.WithDefaultLoader();
        var context = BrowsingContext.New(config);
        var finalUrl = await GetRedirectedUrlAsync(url);
        var document = await context.OpenAsync(finalUrl);
        return ProcessDocument(document);
    }

    private async Task<string> GetRedirectedUrlAsync(string url)
    {
        var response = await _httpClient.GetAsync(url);
        var finalUrl = response.RequestMessage?.RequestUri?.ToString();
        if (string.IsNullOrEmpty(finalUrl))
        {
            ///Fix this later, not good to be doing this
            throw new Exception("No Redirected URL found");
        }
        return finalUrl;
    }

    private CleanHtml ProcessDocument(IDocument document)
    {
        var noiseElements = document.QuerySelectorAll("script, style, iframe, nav, footer, aside, .advertisement");
        foreach (var element in noiseElements)
        {
            element.Remove();
        }
        
        var title = document.QuerySelector("h1")?.TextContent.Trim() ?? document.Title;
        
        var mainContentNode = document.QuerySelector("article") ?? 
                              document.QuerySelector("[role='main']") ?? 
                              document.QuerySelector("main") ?? 
                              document.Body;
        
        var cleanHtml = mainContentNode?.InnerHtml.Trim() ?? "";
        
        return new CleanHtml() { Title = title, Content = cleanHtml }; 
    }
}

public class CleanHtml
{
    public string Title { get; set; }
    public string Content { get; set; }
}