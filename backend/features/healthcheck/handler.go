package healthcheck

import (
	"encoding/json"
	"net/http"
)

func HealthCheckHandler(w http.ResponseWriter, r *http.Request) {
	response := HealthCheckResponse{
		Status: "healthy",
	}
	w.Header().Set("Content-Type", "application/json")
	jsonBytes, err := json.Marshal(response)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write(jsonBytes)
}
