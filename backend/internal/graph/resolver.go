package graph

import "github.com/vasugupta1/RSSFeed/backend/internal/client"

// This file will not be regenerated automatically.
//
// It serves as dependency injection for your app, add any dependencies you require
// here.

type Resolver struct {
	GraphClient *client.GraphApiClient
}
