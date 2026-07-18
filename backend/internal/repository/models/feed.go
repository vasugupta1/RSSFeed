package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type Feed struct {
	ID          bson.ObjectID `bson:"_id,omitempty"`
	Title       string        `bson:"title"`
	Description string        `bson:"description"`
	Link        string        `bson:"link"`
	Articles    []Articles    `bson:"articles"`
	CreatedAt   time.Time     `bson:"created_at" json:"created_at"`
}

type Articles struct {
	URL   string `bson:"url"`
	Title string `bson:"title,omitempty"`
}
