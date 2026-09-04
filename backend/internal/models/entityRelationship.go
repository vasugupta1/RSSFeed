package models

type Entity struct {
	Id   string `json:"id"`
	Name string `json:"name"`
	Type string `json:"type"`
}

type Relationship struct {
	Source string `json:"source"`
	Target string `json:"target"`
	Type   string `json:"type"`
}

type GetEntitiesRelationshipResponse struct {
	Nodes []Entity       `json:"nodes"`
	Edges []Relationship `json:"edges"`
}
