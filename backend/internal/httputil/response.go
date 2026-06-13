package httputil

import (
	"encoding/json"
	"net/http"
)

func WriteJSON(w http.ResponseWriter, status int, value any, headers http.Header) {
	if headers != nil {
		for k, values := range headers {
			for _, v := range values {
				w.Header().Add(k, v)
			}
		}
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(value)
}
