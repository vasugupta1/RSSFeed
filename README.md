# RSSFeed


## How to run
1. Have aspire install on the machine
2. Navigate to rssfeed-aspire folder and run 'aspire restore && aspire run', this will run the front-end, bff, database etc

## TODO:
1. When user click add feed, that url is saved in the database 
2. When page first loads, the frontend calls the webapi to get the list of articles it must show, this means the webapi is going to be repsonsbile for getting the feed links, getting rss xml and returning back the required data
3. Need some sort of streaming of data to happen from AI API -> WebAPI -> Frontend loading can take ages
4. Cache results from the AI API
5. Images URL must be extracted and returned as part of the response so frontend can display it  