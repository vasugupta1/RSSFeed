package repository

import (
	"context"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type DatabaseConfiguration struct {
	ConnectionString string
	DatabaseName     string
	CollectionNames  []string
}

type RepositoryService struct {
	Client *mongo.Client
	Db     *mongo.Database
}

func NewRepositoryService(config *DatabaseConfiguration) (*RepositoryService, error) {
	mongoOptions := options.Client().ApplyURI(config.ConnectionString)
	client, err := mongo.Connect(mongoOptions)
	if err != nil {
		return nil, err
	}

	if err := client.Ping(context.TODO(), nil); err != nil {
		return nil, err
	}

	db := client.Database(config.DatabaseName)
	ensureCollectionExists(db, config.CollectionNames)

	return &RepositoryService{Db: db, Client: client}, nil
}

func ensureCollectionExists(db *mongo.Database, collections []string) error {
	ctx := context.TODO()
	existing, err := db.ListCollectionNames(context.TODO(), bson.D{})
	if err != nil {
		return err
	}

	existsMap := make(map[string]struct{})
	for _, name := range existing {
		existsMap[name] = struct{}{}
	}

	for _, name := range collections {
		if _, ok := existsMap[name]; !ok {
			err := db.CreateCollection(ctx, name)
			if err != nil {
				return err
			}
		}
	}

	return nil
}
