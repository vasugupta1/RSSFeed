## TODO:
1. Create custom middleware for the go api, which verifires the request coming in such as header etc 
2. When webapi first loads, it needs to get all feeds and extract all articles to update the list
3. When an article is read it needs to call delete endpoint to delete the article from the database
4. Maybe a TTL should be present but this is local mostly so doesn't really matter much
5. Need to support both xml and atom format, this way I can use reddit 
6. Need to fix package names in webapi, I need to understand what the current industry standard is for go and use, currently I feel like its a mess
7. Inconsistent naming convention across the whole repo 
8. If deduplicate feed is being added then it needs to stop that
9. If article is already present in the database then it needs to stop creating that
10. Maybe move the caching of articles from mongo to redis, I did it to save time in dev work 
11. For reddit articles need to support comments also and update ai prompt so that it excludes what it thinks it might be an ai generated comment
12. Refactor go api to use channels better
13. Vector embeddings of the articles and based on that create graphs, current implementation doesn't do that correctly