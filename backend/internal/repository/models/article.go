package models

import (
	// Import the v2 bson package directly
	"go.mongodb.org/mongo-driver/v2/bson"
)

type ArticleSummary struct {
	// Changed from primitive.ObjectID to bson.ObjectID
	ID      bson.ObjectID `bson:"_id,omitempty" json:"id"`
	Url     string        `bson:"url" json:"url"`
	Summary string        `bson:"summary" json:"summary"`
	Title   string        `bson:"title" json:"title"`
}
