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

func ReadJSON[T any](r *http.Request) (T, error) {
	var result T
	defer r.Body.Close()
	err := json.NewDecoder(r.Body).Decode(&result)
	if err != nil {
		return result, err
	}
	return result, nil
}
