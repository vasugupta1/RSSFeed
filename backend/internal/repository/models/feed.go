package models

type Feed struct {
	ID          string     `bson:"_id,omitempty"`
	Title       string     `bson:"title"`
	Description string     `bson:"description"`
	Link        string     `bson:"link"`
	Articles    []Articles `bson:"articles"`
}

type Articles struct {
	URL   string `bson:"url"`
	Title string `bson:"title,omitempty"`
}
