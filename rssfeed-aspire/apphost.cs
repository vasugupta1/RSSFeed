#:package Aspire.Hosting.Azure@13.3.5
#:package Aspire.Hosting.JavaScript@13.3.5
#:package Aspire.Hosting.PostgreSQL@13.3.5
#:package Aspire.Hosting.Python@13.3.5
#:package CommunityToolkit.Aspire.Hosting.Ollama@13.3.0
#:sdk Aspire.AppHost.Sdk@13.3.5
#:project ../backend/src/RssFeedWebApp/RssFeedWebApp.csproj

var builder = DistributedApplication.CreateBuilder(args);

//#####################Database################################

var postgres = builder.AddPostgres("rssfeedstorage")
                      .WithPgAdmin()
                      .WithDataVolume(); 
var db = postgres.AddDatabase("rssfeeddatabase");

//#####################AI#####################################
var ollama = builder.AddOllama("ollama")
                    .WithDataVolume()
                    .WithOpenWebUI();
        
var chatmodel = ollama.AddModel("chat", "llama3.2");


var ai = builder.AddUvicornApp(name: "rssfeedai", appDirectory: "../ai", app: "app:app")
                    .WithReference(db)
                    .WithReference(chatmodel)
                    .WithReference(ollama)
                    .WaitFor(db)
                    .WaitFor(chatmodel);

//#####################BFF#####################################
var bff = builder.AddProject<Projects.RssFeedWebApp>("rssfeedwebapp")
                    .WaitForStart(postgres)
                    .WithReference(db)
                    .WithReference(ai);

//#####################Frontend################################
var frontendservice = builder.AddViteApp(name: "rssfeedfrontend", appDirectory: "../frontend")
                             .WithReference(bff)
                             .WaitFor(bff);

builder.Build().Run();