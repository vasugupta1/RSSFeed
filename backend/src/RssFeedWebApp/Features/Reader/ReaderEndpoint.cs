using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using RssFeedWebApp.Features.Reader.Models;
using RssFeedWebApp.Models.Configuration;

namespace RssFeedWebApp.Features.Reader;

public static class ReaderEndpoint
{
    private static readonly JsonSerializerOptions SerializerOptions = new System.Text.Json.JsonSerializerOptions
    {
        PropertyNameCaseInsensitive = true
    };
    public static IEndpointRouteBuilder MapReaderEndpoint(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost("/api/reader", HandleReaderAsync);
        return endpoints;
    }
    
    private static async Task<IResult> HandleReaderAsync([FromBody] CrawlRequest request, IHttpClientFactory clientFactory, IOptions<AppSettings> settings)
    {
        ArgumentNullException.ThrowIfNull(request);
        if (string.IsNullOrEmpty(request.Url))
        {
            return Results.Problem(
                detail: "No URL provided",
                statusCode: StatusCodes.Status400BadRequest,
                title: "No URL provided"
            );
        }
        var crawlerConfiguration = settings.Value.AiCrawlerService;
        var client = clientFactory.CreateClient("aicrawler");
        var response = await client.GetAsync(ConstructURL(crawlerConfiguration.BaseUrl, crawlerConfiguration.CrawlEndpoint, request.Url));
        if (!response.IsSuccessStatusCode)
        {
            return Results.Problem(
                detail: response.ReasonPhrase,
                statusCode: (int)response.StatusCode,
                title: "Failed to crawl url");
        }
        var content = await response.Content.ReadAsStringAsync();
        var crawlResponse = System.Text.Json.JsonSerializer.Deserialize<CrawlResponse>(content, SerializerOptions);
        return Results.Ok(crawlResponse);
    }

    private static string ConstructURL(string baseurl, string endpointUrl, string pageUrl)
    {
        var cleanBase = baseurl.EndsWith('/') ? baseurl : baseurl + "/";
        var cleanEndpoint = endpointUrl.StartsWith('/') ? endpointUrl.Substring(1) : endpointUrl;
        return $"{cleanBase}{cleanEndpoint}?url={pageUrl}";
    }
}