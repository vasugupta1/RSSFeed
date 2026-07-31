#:package Aspire.Hosting.Azure@13.4.6
#:package Aspire.Hosting.JavaScript@13.4.6
#:package Aspire.Hosting.MongoDB@13.4.6
#:package Aspire.Hosting.PostgreSQL@13.4.6
#:package Aspire.Hosting.Python@13.4.6
#:package Aspire.Hosting.RabbitMQ@13.4.6
#:package CommunityToolkit.Aspire.Hosting.Golang@13.3.0
#:package CommunityToolkit.Aspire.Hosting.McpInspector@13.4.0
#:package CommunityToolkit.Aspire.Hosting.Ollama@13.3.0
#:sdk Aspire.AppHost.Sdk@13.4.6

var builder = DistributedApplication.CreateBuilder(args);


//###################Messasging################################
var articleCrawlEvent = "rssfeed-article-crawl-event";
var articleCrawlResultEvent = "rssfeed-article-crawl-result-event";
var articleOntologyEvent = "rssfeed-article-ontology-event";

var username = builder.AddParameter("rmq-user", "guest");
var password = builder.AddParameter("rmq-pwd", "guest");
var messagingQueues = builder
                        .AddRabbitMQ("messaging", userName: username, password: password)
                        .WithDataVolume("rssfeed-queue-data")
                        .WithLifetime(ContainerLifetime.Persistent)
                        .WithManagementPlugin();

var messagingMigration = AddRabitMqQueueInit(
    builder, 
    messagingQueues, 
    username, 
    password, 
    articleCrawlEvent, articleCrawlResultEvent,  articleOntologyEvent
);
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
        
var llm = ollama.AddModel("llm", "llama3.1");
var embeddings = ollama.AddModel("embeddings", "nomic-embed-text");
var ai = builder.AddUvicornApp(name: "rssfeedai", appDirectory: "../ai", app: "app:app")
                    .WithEnvironment("RABBITMQ_ONTOLOOGY_QUEUE", articleOntologyEvent)
                    .WithEnvironment("RABBITMQ_CRAWL_QUEUE", articleCrawlEvent)
                    .WithEnvironment("RABBITMQ_CRAWL_RESULT_QUEUE", articleCrawlResultEvent)
                    .WithReference(mongodb)
                    .WithReference(llm)
                    .WithReference(ollama)
                    .WithReference(llm)
                    .WithReference(graphDb)
                    .WithReference(vectorDb)
                    .WithReference(messagingQueues)
                    .WithReference(embeddings)
                    .WithEnvironment("MCP_SERVER_URL", pythonMcp.GetEndpoint("http"))
                    .WaitFor(mongodb)
                    .WaitFor(llm)
                    .WaitFor(embeddings)
                    .WaitFor(messagingQueues)
                    .WaitForCompletion(graphDbMigration)
                    .WaitForCompletion(vectorDbMigration)
                    .WithHttpEndpoint(port: 8001);

//#####################BFF#####################################

var rssfeedwebapp = builder
                    .AddGolangApp("rssfeedwebapp", "../backend/cmd/server")
                    .WithHttpEndpoint(env: "PORT", port: 8002)
                    .WithHttpHealthCheck("/api/healthcheck")
                    .WithEnvironment("RABBITMQ_CRAWL_QUEUE", articleCrawlEvent)
                    .WithEnvironment("RABBITMQ_CRAWL_RESULT_QUEUE", articleCrawlResultEvent)
                    .WithReference(mongodb)
                    .WithReference(ai)
                    .WithReference(messagingQueues)
                    .WaitFor(mongodb)
                    .WaitFor(messagingQueues);    

//#####################Frontend################################
var frontendservice = builder.AddViteApp(name: "rssfeedfrontend", appDirectory: "../frontend")
                             .WithReference(rssfeedwebapp)
                             .WaitFor(rssfeedwebapp)
                             .WithHttpEndpoint(port: 8003);

builder.Build().Run();


//Used to create queues, quicky easy way to get it up and running
static IResourceBuilder<ContainerResource> AddRabitMqQueueInit(IDistributedApplicationBuilder builder,
    IResourceBuilder<RabbitMQServerResource> rabbitMq,
    IResourceBuilder<ParameterResource> userParam,
    IResourceBuilder<ParameterResource> pwdParam,
    params string[] queues)
{
    var commandList = queues.Select(q => 
        $"curl -s -u \"$RMQ_USER:$RMQ_PWD\" -X PUT -H \"Content-Type: application/json\" " +
        $"-d '{{\"durable\":true,\"auto_delete\":false}}' " +
        $"http://messaging:15672/api/queues/%2F/{q}"
    );
    
    var inlineScript = string.Join(" && ", commandList);

    return builder.AddContainer("messaging-init", "alpine/curl")
        .WithReference(rabbitMq)
        .WithEnvironment("RMQ_USER", userParam)
        .WithEnvironment("RMQ_PWD", pwdParam)
        .WithArgs("-c", inlineScript)
        .WithEntrypoint("sh") 
        .WaitFor(rabbitMq);
}