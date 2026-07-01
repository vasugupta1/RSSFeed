package models

import "time"

type Feed struct {
	ID          string     `bson:"_id,omitempty"`
	Title       string     `bson:"title"`
	Description string     `bson:"description"`
	Link        string     `bson:"link"`
	Articles    []Articles `bson:"articles"`
	CreatedAt   time.Time  `bson:"created_at" json:"created_at"`
}

type Articles struct {
	URL   string `bson:"url"`
	Title string `bson:"title,omitempty"`
}
