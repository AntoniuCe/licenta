package main

import (
	"ecommerce/internal/database"
	"ecommerce/internal/handlers"
	"ecommerce/internal/middleware"
	"log"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, using system env variables")
	}

	database.Connect()

	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			"https://store.antoniu.xyz",
			"https://api.antoniu.xyz",
			"http://localhost:5173", // keep for local dev
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	r.Static("/uploads", "./uploads")

	api := r.Group("/api")
	{
		// Public routes
		api.POST("/register", handlers.Register)
		api.POST("/login", handlers.Login)
		api.POST("/google-login", handlers.GoogleLogin) // ← Google Sign-In
		api.GET("/products", handlers.GetProducts)
		api.GET("/products/:id", handlers.GetProductByID)
		api.GET("/products/:id/reviews", handlers.GetProductReviews)

		// Authenticated routes
		auth := api.Group("/")
		auth.Use(middleware.AuthMiddleware())
		{
			auth.GET("/cart", handlers.GetMyCart)
			auth.POST("/cart", handlers.AddToCart)
			auth.PUT("/cart/:id", handlers.UpdateCartItem)
			auth.DELETE("/cart/:id", handlers.RemoveCartItem)
			auth.DELETE("/cart", handlers.ClearCart)

			auth.POST("/orders", handlers.CreateOrder)
			auth.GET("/orders", handlers.GetMyOrders)
			auth.POST("/orders/:id/pay", handlers.PayOrder)

			auth.GET("/wishlist", handlers.GetMyWishlist)
			auth.POST("/wishlist/:id", handlers.AddToWishlist)
			auth.DELETE("/wishlist/:id", handlers.RemoveFromWishlist)

			auth.POST("/products/:id/reviews", handlers.AddReview)
		}

		// Admin routes
		admin := api.Group("/admin")
		admin.Use(middleware.AuthMiddleware(), middleware.AdminMiddleware())
		{
			admin.POST("/products", handlers.CreateProduct)
			admin.PUT("/products/:id", handlers.UpdateProduct)
			admin.PUT("/products/:id/featured", handlers.SetProductFeatured)
			admin.DELETE("/products/:id", handlers.DeleteProduct)
			admin.GET("/users", handlers.GetAllUsers)
			admin.PUT("/users/:id/role", handlers.UpdateUserRole)
			admin.DELETE("/products/:id/images/:imageId", handlers.DeleteProductImage)
			admin.PUT("/products/:id/images/:imageId/primary", handlers.SetPrimaryProductImage)
		}
	}

	r.Run(":8080")
}
