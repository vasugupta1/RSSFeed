using RssFeedParser;
using RssFeedParser.Factories;

namespace RssFeedWebApp
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);
            builder.Services.AddSingleton(builder.Configuration);
            builder.Services.AddTransient<IParser, Parser>();
            builder.Services.AddTransient<IFeedDeserialiserFactory, FeedDeserialiserFactory>();
            var app = builder.Build();
            
            
            app.MapGet("/api/heartbeat", () => "OK");
            app.MapPost("/api/parsefeed", async (HttpContext context, IParser parser) =>
            {
                context.Request.EnableBuffering();
                if (context.Request.ContentLength == 0)
                {
                    return Results.BadRequest("The request body is empty.");
                }

                try
                {
                    var parsedFeed = await parser.Parse(context.Request.Body);
                    return Results.Ok(parsedFeed);
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
            app.Run();
        }
    }
}