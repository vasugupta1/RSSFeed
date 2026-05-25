using RssFeedParser;
using RssFeedParser.Factories;
using RssFeedWebApp.Features.IngestFeed;
using RssFeedWebApp.Features.Reader;
using RssFeedWebApp.Models.Configuration;

namespace RssFeedWebApp
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);
            builder.Services.AddSingleton(builder.Configuration);
            builder.Services.Configure<AppSettings>(options =>
            {
                builder.Configuration.GetSection(nameof(AppSettings)).Bind(options);
                
                var aspireUrl = builder.Configuration["services:rssfeedai:https:0"] 
                             ?? builder.Configuration["services:rssfeedai:http:0"];

                if (!string.IsNullOrEmpty(aspireUrl))
                {
                    if (options.AiCrawlerService is null)
                    {
                        options.AiCrawlerService = new AiCrawlerService();
                    }
                    options.AiCrawlerService.BaseUrl = aspireUrl;
                }
            });
            builder.Services.AddTransient<IParser, Parser>();
            builder.Services.AddTransient<IFeedDeserialiserFactory, FeedDeserialiserFactory>();
            builder.Services.AddHttpClient();
            var app = builder.Build();

            //Endpoint Registration
            //Endpoint auth will be done later on
            app.MapReaderEndpoint();
            app.MapIngestFeedEndpoint();
            app.Run();
        }
    }
}