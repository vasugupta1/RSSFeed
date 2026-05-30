#:package Aspire.Hosting.Azure@13.3.5
#:package Aspire.Hosting.JavaScript@13.3.5
#:package Aspire.Hosting.PostgreSQL@13.3.5
#:package Aspire.Hosting.Python@13.3.5
#:package CommunityToolkit.Aspire.Hosting.Golang@13.3.0
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
                    .WithEnvironment("OLLAMA_KEEP_ALIVE", "-1")
                    .WithEnvironment("HSA_OVERRIDE_GFX_VERSION", "11.0.0")
                    .WithEnvironment("HIP_VISIBLE_DEVICES", "0")
                    .WithEnvironment("RUST_LOG", "debug")
                    .WithOpenWebUI()
                    .WithGPUSupport(OllamaGpuVendor.AMD)
                    .WithImageTag("rocm")
                    .WithEnvironment("OLLAMA_CONTEXT_LENGTH", "16384")
                    .WithContainerRuntimeArgs("--device", "/dev/kfd", "--device", "/dev/dri");
        
var chatmodel = ollama.AddModel("chat", "llama3.2:latest");


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

var gobff = builder.AddGolangApp("rssfeedbff", "../backend")
                    .WithHttpEndpoint(env: "PORT")
                    .WithHttpHealthCheck("/api/healthcheck")
                    .WithReference(db)
                    .WithReference(ai);

//#####################Frontend################################
var frontendservice = builder.AddViteApp(name: "rssfeedfrontend", appDirectory: "../frontend")
                             .WithReference(bff)
                             .WaitFor(bff);

builder.Build().Run();