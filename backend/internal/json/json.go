package json

import (
	"encoding/json"
	"net/http"
)

func Write(w http.ResponseWriter, status int, value any, headers http.Header) {
	if headers != nil {
		for k, values := range headers {
			for _, v := range values {
				w.Header().Add(k, v)
			}

		}
	}
	w.WriteHeader(status)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(value)
}
