package handlers

import (
	"ecommerce/internal/database"
	"ecommerce/internal/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetProductReviews(c *gin.Context) {
	productID := c.Param("id")
	var reviews []models.Review
	database.DB.Where("product_id = ?", productID).Order("created_at desc").Find(&reviews)
	c.JSON(http.StatusOK, reviews)
}

func AddReview(c *gin.Context) {
	userID := c.GetUint("user_id")
	productID := c.Param("id")
	var input struct {
		Rating  int    `json:"rating"`
		Comment string `json:"comment"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if input.Rating < 1 || input.Rating > 5 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Rating must be between 1 and 5"})
		return
	}
	review := models.Review{ProductID: toUint(productID), UserID: userID, Rating: input.Rating, Comment: input.Comment}
	if err := database.DB.Create(&review).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create review"})
		return
	}
	c.JSON(http.StatusCreated, review)
}
