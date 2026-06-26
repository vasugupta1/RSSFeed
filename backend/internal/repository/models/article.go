package models

type ArticleSummary struct {
	ID      string `bson:"_id,omitempty"`
	Url     string `bson:"url"`
	Summary string `bson:"summary"`
}
