package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type ArticleSummary struct {
	ID        bson.ObjectID `bson:"_id,omitempty" json:"id"`
	Url       string        `bson:"url" json:"url"`
	Summary   string        `bson:"summary" json:"summary"`
	Title     string        `bson:"title" json:"title"`
	CreatedAt time.Time     `bson:"created_at" json:"created_at"`
}
