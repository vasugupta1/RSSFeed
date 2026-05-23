using Projects;
var builder = DistributedApplication.CreateBuilder(args);
var postgres = builder.AddPostgres("rssfeedstorage").WithPgAdmin().WithDataVolume(); 
var db = postgres.AddDatabase("rssfeeddatabase");
var webApi = builder.AddProject<RssFeedWebApp>("rssfeedwebapp").WithReference(db);
var frontendservice = builder.AddViteApp(name: "rssfeedfrontend", appDirectory: "../../../frontend")
    .WithReference(webApi)
    .WaitFor(webApi);

builder.Build().Run();
