using Microsoft.AspNetCore.Mvc;
using RssFeedParser;
using RssFeedParser.Factories;
using RssFeedWebApp.Features.IngestFeed;
using RssFeedWebApp.Features.Reader;
using RssFeedWebApp.Features.Reader.Services;

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
            builder.Services.AddTransient<IFetchUrlService, FetchUrlService>();
            builder.Services.ConfigureHttpClientDefaults(options =>
            {
                options.ConfigureHttpClient(client =>
                {
                    client.DefaultRequestHeaders.UserAgent.ParseAdd(
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
                        "AppleWebKit/537.36 (KHTML, like Gecko) " +
                        "Chrome/124.0 Safari/537.36");
                });
                options.ConfigurePrimaryHttpMessageHandler(() => new SocketsHttpHandler
                {
                    AllowAutoRedirect = true,
                    UseCookies = true 
                });
            });
            builder.Services.AddHttpClient();
            builder.Services.AddHttpClient<FetchUrlService>();
            var app = builder.Build();
            //Add Cors later on 
            
            ///Feature Endpoints
            app.MapReaderEndpoint();
            app.MapIngestFeedEndpoint();
            app.Run();
        }
    }
}