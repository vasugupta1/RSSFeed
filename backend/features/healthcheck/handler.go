package healthcheck

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
)

func HealthCheckHandler(c *gin.Context) {
	response := HealthCheckResponse{
		Status: "healthy",
	}
	c.Header("Content-Type", "application/json")
	jsonBytes, err := json.Marshal(response)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusOK)
	c.Writer.Write(jsonBytes)
}
