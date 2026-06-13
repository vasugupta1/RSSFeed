package repository

import "database/sql"

type DatabaseConfiguration struct {
	ConnectionString string
	DatbaseName      string
	DriveName        string
}

type RepositoryService struct {
	Db *sql.DB
}

func NewRepository(config *DatabaseConfiguration) (*RepositoryService, error) {
	db, err := sql.Open(config.DriveName, config.ConnectionString)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
	}
	return &RepositoryService{Db: db}, nil
}
