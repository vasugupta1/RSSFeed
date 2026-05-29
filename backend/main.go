package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/vasugupta1/RSSFeed/backend/features/healthcheck"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	http.HandleFunc("/api/healthcheck", healthcheck.HealthCheckHandler)

	fmt.Printf("Server listening on port %s\n", port)
	http.ListenAndServe(":"+port, nil)
}
