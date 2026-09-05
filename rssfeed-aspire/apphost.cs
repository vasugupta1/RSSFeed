#:package Aspire.Hosting.Azure@13.5.3
#:package Aspire.Hosting.JavaScript@13.5.3
#:package Aspire.Hosting.MongoDB@13.5.3
#:package Aspire.Hosting.PostgreSQL@13.5.3
#:package Aspire.Hosting.Python@13.5.3
#:package Aspire.Hosting.RabbitMQ@13.5.3
#:package CommunityToolkit.Aspire.Hosting.Golang@13.3.0
#:package CommunityToolkit.Aspire.Hosting.McpInspector@13.4.0
#:package CommunityToolkit.Aspire.Hosting.Ollama@13.3.0
#:sdk Aspire.AppHost.Sdk@13.5.3

var builder = DistributedApplication.CreateBuilder(args);

//###################Messasging################################
var articleCrawlExchange = "rssfeed-article-crawl-exchange";
var articleCrawlEvent = "rssfeed-article-crawl-event";
var articleCrawlResultEvent = "rssfeed-article-crawl-result-event";
var articleOntologyEvent = "rssfeed-article-ontology-event";
var articleResearchEvent = "rssfeed-article-research-event";


var username = builder.AddParameter("rmq-user", "guest");
var password = builder.AddParameter("rmq-pwd", "guest");
var messagingQueues = builder
                        .AddRabbitMQ("messaging", userName: username, password: password)
                        .WithDataVolume("rssfeed-queue-data")
                        .WithLifetime(ContainerLifetime.Persistent)
                        .WithManagementPlugin(15672);

var queueMigration = AddRabitMqQueueInit(
    builder, 
    messagingQueues, 
    username, 
    password, 
    articleCrawlEvent, articleOntologyEvent
);

var pubSubMigration = AddRabbitMqPubSubInit(
    builder, 
    messagingQueues, 
    username, 
    password, 
    articleCrawlExchange,
    [articleCrawlResultEvent, articleResearchEvent]
);
//#####################Database################################

var mongo = builder.AddMongoDB("rssfeed")
    .WithImage("mongo")
    .WithImageTag("8.2.9-noble")
    .WithEnvironment("GLIBC_TUNABLES", "glibc.pthread.rseq=1")
    .WithLifetime(ContainerLifetime.Persistent)
    .WithMongoExpress();

var mongodb = mongo.AddDatabase("rssfeedurl");

var neo4j = builder.AddContainer("rssfeedneo4j", "neo4j", "latest")
    .WithVolume("rssfeed-neo4j-data", "/data")
    .WithEnvironment("NEO4J_AUTH", "neo4j/password")
    .WithEnvironment("NEO4J_PLUGINS", "[\"apoc\"]")
    .WithEnvironment("NEO4J_dbms_security_procedures_unrestricted", "apoc.*")
    .WithHttpEndpoint(port: 7474, targetPort: 7474, name: "http")
    .WithEndpoint(port: 7687, targetPort: 7687, name: "bolt", scheme: "bolt")
    .WithLifetime(ContainerLifetime.Persistent);

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
        
var llm = ollama.AddModel("llm", "gemma4:e2b");
var embeddings = ollama.AddModel("embeddings", "nomic-embed-text");
var ai = builder.AddUvicornApp(name: "rssfeedai", appDirectory: "../ai", app: "app:app")
                    .WithEnvironment("RABBITMQ_ONTOLOOGY_QUEUE", articleOntologyEvent)
                    .WithEnvironment("RABITMQ_CRAWL_RESEARCH_QUEUE", articleResearchEvent)
                    .WithEnvironment("RABBITMQ_CRAWL_QUEUE", articleCrawlEvent)
                    .WithEnvironment("RABBITMQ_CRAWL_EXCHANGE", articleCrawlExchange)
                    .WithEnvironment("NEO4J_URI", "bolt://neo4j:password@localhost:7687")
                    .WithReference(mongodb)
                    .WithReference(llm)
                    .WithReference(ollama)
                    .WithReference(llm)
                    .WithReference(neo4j.GetEndpoint("bolt"))
                    .WithReference(vectorDb)
                    .WithReference(messagingQueues)
                    .WithReference(embeddings)
                    .WaitFor(mongodb)
                    .WaitFor(neo4j)
                    .WaitFor(llm)
                    .WaitFor(embeddings)
                    .WaitFor(messagingQueues)
                    .WaitForCompletion(vectorDbMigration)
                    .WithHttpEndpoint(port: 8001);

var crawlerConsumer = builder.AddPythonApp(name: "crawlerconsumer", appDirectory: "../crawl-worker", scriptPath: "main.py")
            .WithEnvironment("RABBITMQ_CRAWL_QUEUE", articleCrawlEvent)
            .WithEnvironment("RABBITMQ_CRAWL_EXCHANGE", articleCrawlExchange)
            .WithReference(ollama)
            .WithReference(llm)
            .WithReference(embeddings)
            .WithReference(vectorDb)
            .WithReference(messagingQueues)
            .WaitFor(llm)
            .WaitFor(embeddings)
            .WaitFor(messagingQueues)
            .WaitForCompletion(vectorDbMigration);

var researchConsumer = builder.AddPythonApp(name: "researchconsumer", appDirectory: "../research-worker", scriptPath: "main.py")
            .WithEnvironment("RABITMQ_CRAWL_RESEARCH_QUEUE", articleResearchEvent)
            .WithEnvironment("RABBITMQ_ONTOLOOGY_QUEUE", articleOntologyEvent)
            .WithReference(ollama)
            .WithReference(llm)
            .WithReference(embeddings)
            .WithReference(vectorDb)
            .WithReference(messagingQueues)
            .WaitFor(llm)
            .WaitFor(embeddings)
            .WaitFor(messagingQueues)
            .WaitForCompletion(vectorDbMigration);

var ontologyConsumer = builder.AddPythonApp(name: "ontologyconsumer", appDirectory: "../ontology-worker", scriptPath: "main.py")
            .WithEnvironment("RABBITMQ_ONTOLOOGY_QUEUE", articleOntologyEvent)
            .WithEnvironment("NEO4J_URI", "bolt://neo4j:password@localhost:7687")
            .WithReference(neo4j.GetEndpoint("bolt"))
            .WithReference(ollama)
            .WithReference(llm)
            .WithReference(embeddings)
            .WithReference(vectorDb)
            .WithReference(messagingQueues)
            .WaitFor(neo4j)
            .WaitFor(llm)
            .WaitFor(embeddings)
            .WaitFor(messagingQueues)
            .WaitForCompletion(vectorDbMigration);



//#####################BFF#####################################

var rssfeedwebapp = builder
                    .AddGolangApp("rssfeedwebapp", "../backend/cmd/server")
                    .WithHttpEndpoint(env: "PORT", port: 8002)
                    .WithHttpHealthCheck("/api/healthcheck")
                    .WithEnvironment("RABBITMQ_CRAWL_CRAWL_QUEUE", articleCrawlEvent)
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


// Used to create queues, quicky easy way to get it up and running
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

static IResourceBuilder<ContainerResource> AddRabbitMqPubSubInit(
    IDistributedApplicationBuilder builder,
    IResourceBuilder<RabbitMQServerResource> rabbitMq,
    IResourceBuilder<ParameterResource> userParam,
    IResourceBuilder<ParameterResource> pwdParam,
    string exchangeName,
    string[] queues)
{
    var commands = new List<string>();

    // 1. Declare the Fanout Exchange (Pub/Sub hub)
    commands.Add(
        $"curl -s -u \"$RMQ_USER:$RMQ_PWD\" -X PUT -H \"Content-Type: application/json\" " +
        $"-d '{{\"type\":\"fanout\",\"durable\":true,\"auto_delete\":false}}' " +
        $"http://messaging:15672/api/exchanges/%2F/{exchangeName}"
    );

    // 2. Declare each Queue and Bind it to the Exchange
    foreach (var queue in queues)
    {
        // Declare Queue
        commands.Add(
            $"curl -s -u \"$RMQ_USER:$RMQ_PWD\" -X PUT -H \"Content-Type: application/json\" " +
            $"-d '{{\"durable\":true,\"auto_delete\":false}}' " +
            $"http://messaging:15672/api/queues/%2F/{queue}"
        );

        // Bind Queue to Exchange
        commands.Add(
            $"curl -s -u \"$RMQ_USER:$RMQ_PWD\" -X POST -H \"Content-Type: application/json\" " +
            $"-d '{{\"routing_key\":\"\"}}' " +
            $"http://messaging:15672/api/bindings/%2F/e/{exchangeName}/q/{queue}"
        );
    }

    var inlineScript = string.Join(" && ", commands);

    return builder.AddContainer("messaging-pubsub-init", "alpine/curl")
        .WithReference(rabbitMq)
        .WithEnvironment("RMQ_USER", userParam)
        .WithEnvironment("RMQ_PWD", pwdParam)
        .WithArgs("-c", inlineScript)
        .WithEntrypoint("sh")
        .WaitFor(rabbitMq);
}