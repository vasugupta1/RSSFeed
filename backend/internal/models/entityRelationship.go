package models

type Entity struct {
	Name string `json:"name"`
	Id   string `json:"id"`
	Type string `json:"type"`
}

type Relationship struct {
	Source Entity `json:"source"`
	Target Entity `json:"target"`
	Type   string `json:"type"`
}

type EntityRelationship struct {
	Nodes Entity
	Edges Relationship
}
