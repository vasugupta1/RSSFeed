package repository

import (
	"context"
	"errors"
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

func (f *MongoRepository) GetAllFeed(ctx context.Context) ([]models.Feed, error) {
	collection := f.Db.Collection("feedurl")
	cursor, err := collection.Find(ctx, bson.D{})
	if err != nil {
		return nil, err
	}

	defer cursor.Close(ctx)

	var feeds []models.Feed

	if err := cursor.All(ctx, &feeds); err != nil {
		return nil, err
	}

	return feeds, err
}

func (f *MongoRepository) SaveArticle(ctx context.Context, articleSummary models.ArticleSummary) error {
	collection := f.Db.Collection("feedarticle")

	filter := bson.M{"url": articleSummary.Url}
	update := bson.M{"$setOnInsert": articleSummary}
	opts := options.UpdateOne().SetUpsert(true)

	_, err := collection.UpdateOne(ctx, filter, update, opts)
	if err != nil {
		slog.Error("Failed to save feed in the database", "error", err, "article summary", articleSummary)
		return err
	}

	return nil
}

func (f *MongoRepository) ArticleExists(ctx context.Context, url string) (bool, error) {
	collection := f.Db.Collection("feedarticle")
	filter := bson.D{{Key: "url", Value: url}}
	err := collection.FindOne(ctx, filter).Err()
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return false, nil
		}
		return false, err
	}

	return true, nil
}

func (f *MongoRepository) GetArticle(ctx context.Context, url string) (*models.ArticleSummary, error) {
	collection := f.Db.Collection("feedarticle")
	filter := bson.D{{Key: "url", Value: url}}
	var article *models.ArticleSummary
	err := collection.FindOne(ctx, filter).Decode(&article)
	if err != nil {
		return nil, err
	}
	return article, nil
}

func (f *MongoRepository) GetAllArticles(ctx context.Context) ([]models.ArticleSummary, error) {
	collection := f.Db.Collection("feedarticle")
	filter := bson.D{}
	sort := bson.D{{Key: "created_at", Value: -1}}
	findOptions := options.Find().SetSort(sort)
	cursor, err := collection.Find(ctx, filter, findOptions)
	if err != nil {
		return nil, err
	}
	len := cursor.RemainingBatchLength()
	articles := make([]models.ArticleSummary, 0, len)
	for cursor.Next(ctx) {
		var article models.ArticleSummary
		if err := cursor.Decode(&article); err != nil {
			return nil, err
		}
		articles = append(articles, article)
	}

	if err := cursor.Err(); err != nil {
		return nil, err
	}

	return articles, nil
}

func (f *MongoRepository) DeleteArticle(ctx context.Context, url string) error {
	collection := f.Db.Collection("feedarticle")
	filter := bson.D{{Key: "url", Value: url}}
	result, error := collection.DeleteOne(ctx, filter)
	if !result.Acknowledged || result.DeletedCount != 1 || error != nil {
		slog.Error("Failed to delete article from the database", "error", error, "url", url)
		return error
	}

	return nil
}
