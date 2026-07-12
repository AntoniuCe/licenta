package handlers

import (
	"ecommerce/internal/database"
	"ecommerce/internal/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func GetAdminDashboard(c *gin.Context) {
	var totalProducts int64
	var totalOrders int64
	var lowStock int64
	var users int64
	database.DB.Model(&models.Product{}).Count(&totalProducts)
	database.DB.Model(&models.Order{}).Count(&totalOrders)
	database.DB.Model(&models.Product{}).Where("stock <= ?", 5).Count(&lowStock)
	database.DB.Model(&models.User{}).Count(&users)
	c.JSON(http.StatusOK, gin.H{
		"total_products": totalProducts,
		"total_orders":   totalOrders,
		"low_stock":      lowStock,
		"users":          users,
	})
}

func GetAllUsers(c *gin.Context) {
	var users []models.User

	if err := database.DB.Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	c.JSON(http.StatusOK, users)
}

func UpdateUserRole(c *gin.Context) {
	id := c.Param("id")

	var user models.User
	if err := database.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var input struct {
		Role string `json:"role"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid body"})
		return
	}

	// Optional: validate role
	if input.Role != "admin" && input.Role != "user" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role"})
		return
	}

	user.Role = input.Role

	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user role"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User role updated",
		"user_id": user.ID,
		"role":    user.Role,
	})
}
