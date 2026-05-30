package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/vasugupta1/RSSFeed/backend/features/healthcheck"
)

func main() {
	port := os.Getenv("PORT")
	r := gin.Default()
	r.GET("/", func(ctx *gin.Context) {
		ctx.JSON(http.StatusOK, gin.H{
			"status": "ok",
		})
	})
	r.GET("/api/healthcheck", healthcheck.HealthCheckHandler)

	r.Run(fmt.Sprintf(":%s", port))
}
