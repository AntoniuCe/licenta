package handlers

import (
	"ecommerce/internal/database"
	"ecommerce/internal/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetMyCart(c *gin.Context) {
	userID := c.GetUint("user_id")
	var cart models.Cart
	if err := database.DB.Preload("Items").Where("user_id = ?", userID).First(&cart).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"id": 0, "user_id": userID, "items": []models.CartItem{}})
		return
	}
	c.JSON(http.StatusOK, cart)
}

func AddToCart(c *gin.Context) {
	userID := c.GetUint("user_id")
	var input struct {
		ProductID uint `json:"product_id"`
		Quantity  int  `json:"quantity"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if input.Quantity <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid quantity"})
		return
	}
	var product models.Product
	if err := database.DB.First(&product, input.ProductID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}
	var cart models.Cart
	database.DB.Where("user_id = ?", userID).First(&cart)
	if cart.ID == 0 {
		cart = models.Cart{UserID: userID}
		database.DB.Create(&cart)
	}
	var cartItem models.CartItem
	err := database.DB.Where("cart_id = ? AND product_id = ?", cart.ID, input.ProductID).First(&cartItem).Error
	if err == nil {
		cartItem.Quantity += input.Quantity
		database.DB.Save(&cartItem)
	} else {
		cartItem = models.CartItem{CartID: cart.ID, ProductID: input.ProductID, Quantity: input.Quantity}
		database.DB.Create(&cartItem)
	}
	c.JSON(http.StatusOK, gin.H{"message": "Added to cart"})
}

func UpdateCartItem(c *gin.Context) {
	itemID := c.Param("id")
	var item models.CartItem
	if err := database.DB.First(&item, itemID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Item not found"})
		return
	}
	var input struct{ Quantity int `json:"quantity"` }
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if input.Quantity <= 0 {
		database.DB.Delete(&item)
	} else {
		item.Quantity = input.Quantity
		database.DB.Save(&item)
	}
	c.JSON(http.StatusOK, gin.H{"message": "Cart updated"})
}

func RemoveCartItem(c *gin.Context) {
	itemID := c.Param("id")
	database.DB.Delete(&models.CartItem{}, itemID)
	c.JSON(http.StatusOK, gin.H{"message": "Item removed"})
}

func ClearCart(c *gin.Context) {
	userID := c.GetUint("user_id")
	var cart models.Cart
	if err := database.DB.Where("user_id = ?", userID).First(&cart).Error; err == nil {
		database.DB.Where("cart_id = ?", cart.ID).Delete(&models.CartItem{})
	}
	c.JSON(http.StatusOK, gin.H{"message": "Cart cleared"})
}
