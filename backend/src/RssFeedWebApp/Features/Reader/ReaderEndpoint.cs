using Microsoft.AspNetCore.Mvc;
using RssFeedWebApp.Features.Reader.Services;

namespace RssFeedWebApp.Features.Reader;

public static class ReaderEndpoint
{
    public static IEndpointRouteBuilder MapReaderEndpoint(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/reader", HandleReaderAsync);
        return endpoints;
    }
    
    private static async Task<IResult> HandleReaderAsync([FromQuery] string url, IFetchUrlService  fetchUrlService)
    {
        if (string.IsNullOrEmpty(url))
        {
            return Results.Problem(
                detail: "No URL provided",
                statusCode: StatusCodes.Status400BadRequest,
                title: "No URL provided"
            );
        }

        var html = await fetchUrlService.GetUrlAsync(url);

        return Results.Ok(html);
    }
}