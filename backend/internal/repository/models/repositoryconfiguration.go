package models

type RepositoryConfiguration struct {
	ConnectionString string
	DatabaseName     string
	CollectionNames  []string
}
