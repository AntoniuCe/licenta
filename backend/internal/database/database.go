package database

import (
	"ecommerce/internal/models"
	"fmt"
	"log"
	"os"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect() {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Database connection failed:", err)
	}

	DB = db

	err = DB.AutoMigrate(
		&models.User{},
		&models.Product{},
		&models.ProductImage{},
		&models.Cart{},
		&models.CartItem{},
		&models.Order{},
		&models.OrderItem{},
		&models.Payment{},
		&models.Review{},
		&models.WishlistItem{},
	)
	if err != nil {
		log.Fatal("AutoMigrate failed:", err)
	}

	seedAdminUser()
}

func seedAdminUser() {
	var count int64

	// check if any users exist
	DB.Model(&models.User{}).Count(&count)

	if count == 0 {
		admin := models.User{
			Email:    "admin@local.com",
			Password: hashPassword("admin"), // NEVER store plain text
			Role:     "admin",
		}

		DB.Create(&admin)
		log.Println("Admin user created")
	}
}

func hashPassword(password string) string {
	bytes, _ := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes)
}
