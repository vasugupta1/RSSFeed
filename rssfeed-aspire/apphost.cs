#:package Aspire.Hosting.Azure@13.3.5
#:package Aspire.Hosting.JavaScript@13.3.5
#:package Aspire.Hosting.PostgreSQL@13.3.5
#:package Aspire.Hosting.Python@13.3.5
#:sdk Aspire.AppHost.Sdk@13.3.5
#:project ../backend/src/RssFeedWebApp/RssFeedWebApp.csproj

var builder = DistributedApplication.CreateBuilder(args);

//#####################Database################################

var postgres = builder.AddPostgres("rssfeedstorage")
                      .WithPgAdmin()
                      .WithDataVolume(); 
var db = postgres.AddDatabase("rssfeeddatabase");

//#####################BFF#####################################
var webApi = builder.AddProject<Projects.RssFeedWebApp>("rssfeedwebapp")
                    .WaitForStart(postgres)
                    .WithReference(db);

var ai = builder.AddPythonApp(name: "rssfeedai", appDirectory: "../ai", scriptPath: "app.py")
                    .WithReference(db)
                    .WaitFor(db);

//#####################Frontend################################
var frontendservice = builder.AddViteApp(name: "rssfeedfrontend", appDirectory: "../frontend")
                             .WithReference(webApi)
                             .WaitFor(webApi);

builder.Build().Run();