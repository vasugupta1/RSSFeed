package repository

import (
	"context"
	"log/slog"

	"github.com/vasugupta1/RSSFeed/backend/internal/repository/models"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type MongoRepository struct {
	Client *mongo.Client
	Db     *mongo.Database
}

func NewMongoRepository(config *models.RepositoryConfiguration) (*MongoRepository, error) {
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

	return &MongoRepository{Db: db, Client: client}, nil
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

func (f *MongoRepository) SaveFeed(ctx context.Context, feed models.Feed) error {
	collection := f.Db.Collection("feedurl")
	if _, err := collection.InsertOne(ctx, feed); err != nil {
		slog.Error("Failed to save feed in the database", "error", err, "feed", feed)
		return err
	}

	return nil
}
