package handlers

import (
	"ecommerce/internal/database"
	"ecommerce/internal/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetMyWishlist(c *gin.Context) {
	userID := c.GetUint("user_id")
	var items []models.WishlistItem
	database.DB.Where("user_id = ?", userID).Find(&items)
	productIDs := make([]uint, 0, len(items))
	for _, item := range items {
		productIDs = append(productIDs, item.ProductID)
	}
	var products []models.Product
	if len(productIDs) > 0 {
		database.DB.Preload("Images").Where("id IN ?", productIDs).Find(&products)
	}
	c.JSON(http.StatusOK, products)
}

func AddToWishlist(c *gin.Context) {
	userID := c.GetUint("user_id")
	productID := toUint(c.Param("id"))
	var item models.WishlistItem
	if err := database.DB.Where("user_id = ? AND product_id = ?", userID, productID).First(&item).Error; err == nil {
		c.JSON(http.StatusOK, gin.H{"message": "Already in wishlist"})
		return
	}
	item = models.WishlistItem{UserID: userID, ProductID: productID}
	if err := database.DB.Create(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add to wishlist"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Added to wishlist"})
}

func RemoveFromWishlist(c *gin.Context) {
	userID := c.GetUint("user_id")
	productID := toUint(c.Param("id"))
	database.DB.Where("user_id = ? AND product_id = ?", userID, productID).Delete(&models.WishlistItem{})
	c.JSON(http.StatusOK, gin.H{"message": "Removed from wishlist"})
}
