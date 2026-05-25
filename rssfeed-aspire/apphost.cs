#:package Aspire.Hosting.Azure@13.3.5
#:package Aspire.Hosting.JavaScript@13.3.5
#:package Aspire.Hosting.PostgreSQL@13.3.5
#:sdk Aspire.AppHost.Sdk@13.3.5
#:project ../backend/src/RssFeedWebApp/RssFeedWebApp.csproj

var builder = DistributedApplication.CreateBuilder(args);

// 3. PostgreSQL Database setup
var postgres = builder.AddPostgres("rssfeedstorage")
                      .WithPgAdmin()
                      .WithDataVolume(); 

var db = postgres.AddDatabase("rssfeeddatabase");

var webApi = builder.AddProject<Projects.RssFeedWebApp>("rssfeedwebapp")
                    .WithReference(db);

var frontendservice = builder.AddViteApp(name: "rssfeedfrontend", appDirectory: "../frontend")
                             .WithReference(webApi)
                             .WaitFor(webApi);

builder.Build().Run();