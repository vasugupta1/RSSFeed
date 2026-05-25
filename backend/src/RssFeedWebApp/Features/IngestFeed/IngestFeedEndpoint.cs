using RssFeedParser;

namespace RssFeedWebApp.Features.IngestFeed;

public static class IngestFeedEndpoint
{
    public static IEndpointRouteBuilder MapIngestFeedEndpoint(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost("/api/ingestfeed/{id}", async (string id, HttpContext context, IParser parser) =>
        {
            if (string.IsNullOrEmpty(id))
            {
                return Results.Problem(
                    detail: "No id specified",
                    statusCode: 400,
                    title: "No id specified"
                );
            }
            context.Request.EnableBuffering();
            if (context.Request.ContentLength == 0)
            {
                return Results.BadRequest("The request body is empty.");
            }

            try
            {
                var parsedFeed = await parser.Parse(context.Request.Body);
                //need to save the feed in the database do that later
                return Results.Ok();
            }
            catch (Exception ex)
            {
                return Results.Problem(
                    detail: ex.Message,
                    statusCode: 500,
                    title: "Failed to stream parse XML Feed"
                );
            }
        });
        return endpoints;
    }
}