#:package Aspire.Hosting.Azure@13.4.6
#:package Aspire.Hosting.JavaScript@13.4.6
#:package Aspire.Hosting.MongoDB@13.4.6
#:package Aspire.Hosting.PostgreSQL@13.4.6
#:package Aspire.Hosting.Python@13.4.6
#:package CommunityToolkit.Aspire.Hosting.Golang@13.3.0
#:package CommunityToolkit.Aspire.Hosting.Ollama@13.3.0
#:sdk Aspire.AppHost.Sdk@13.4.6

var builder = DistributedApplication.CreateBuilder(args);

//#####################Database################################

var mongo = builder.AddMongoDB("rssfeed")
    .WithImage("mongo")
    .WithImageTag("8.2.9-noble")
    .WithEnvironment("GLIBC_TUNABLES", "glibc.pthread.rseq=1")
    .WithLifetime(ContainerLifetime.Persistent)
    .WithMongoExpress();

var mongodb = mongo.AddDatabase("rssfeedurl");

var apacheAgePostgres = builder.AddPostgres("rssfeedpostgres")
    .WithDataVolume("rssfeedai-data")
    .WithImage("apache/age", "latest")
    .WithLifetime(ContainerLifetime.Persistent)
    .WithPgAdmin();

var graphDb = apacheAgePostgres.AddDatabase("rssfeedontology");

var graphDbMigration = builder.AddContainer("rssfeed-db-migrations", "ghcr.io/amacneil/dbmate")
    .WithBindMount("../migrations/graph", "/db/migrations") 
    .WithReference(graphDb)  
    .WithEnvironment("DATABASE_URL", $"{graphDb.Resource.UriExpression}?sslmode=disable&search_path=public")       
    .WithArgs("up")                                   
    .WaitFor(graphDb);

var vectorPostgres = builder.AddPostgres("rssfeed-vectordb")
    .WithDataVolume("rssfeed-vector-data")
    .WithImage("pgvector/pgvector", "pg15") 
    .WithLifetime(ContainerLifetime.Persistent)
    .WithPgAdmin();

var vectorDb = vectorPostgres.AddDatabase("ressfeedvectors");

var vectorDbMigration = builder.AddContainer("rssfeed-vector-db-migrations", "ghcr.io/amacneil/dbmate")
    .WithBindMount("../migrations/vector", "/db/migrations") 
    .WithReference(vectorDb)  
    .WithEnvironment("DATABASE_URL", $"{vectorDb.Resource.UriExpression}?sslmode=disable&search_path=public")       
    .WithArgs("up")                                   
    .WaitFor(vectorDb);

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
var ontologymodel = ollama.AddModel("onotology", "deepseek-r1:7b");

var ai = builder.AddUvicornApp(name: "rssfeedai", appDirectory: "../ai", app: "app:app")
                    .WithReference(mongodb)
                    .WithReference(chatmodel)
                    .WithReference(ollama)
                    .WithReference(ontologymodel)
                    .WithReference(graphDb)
                    .WithReference(vectorDb)
                    .WaitFor(mongodb)
                    .WaitFor(chatmodel)
                    .WaitFor(ontologymodel)
                    .WaitForCompletion(graphDbMigration)
                    .WaitForCompletion(vectorDbMigration)
                    .WithHttpEndpoint(port: 8001);

//#####################BFF#####################################

var rssfeedwebapp = builder
                    .AddGolangApp("rssfeedwebapp", "../backend/cmd/server")
                    .WithHttpEndpoint(env: "PORT", port: 8002)
                    .WithHttpHealthCheck("/api/healthcheck")
                    .WithReference(mongodb)
                    .WithReference(ai)
                    .WaitFor(mongodb);    

//#####################Frontend################################
var frontendservice = builder.AddViteApp(name: "rssfeedfrontend", appDirectory: "../frontend")
                             .WithReference(rssfeedwebapp)
                             .WaitFor(rssfeedwebapp)
                             .WithHttpEndpoint(port: 8003);

builder.Build().Run();