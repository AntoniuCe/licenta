package handlers

import (
	"ecommerce/internal/database"
	"ecommerce/internal/models"
	"ecommerce/internal/services"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func CreateOrder(c *gin.Context) {
	userID := c.GetUint("user_id")
	tx := database.DB.Begin()

	var cart models.Cart
	tx.Preload("Items").Where("user_id = ?", userID).First(&cart)
	if cart.ID == 0 || len(cart.Items) == 0 {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cart empty"})
		return
	}

	order := models.Order{UserID: userID, Status: "pending"}
	tx.Create(&order)

	var total float64
	for _, item := range cart.Items {
		var product models.Product
		tx.First(&product, item.ProductID)
		if product.Stock < item.Quantity {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Not enough stock for: " + product.Name})
			return
		}
		product.Stock -= item.Quantity
		tx.Save(&product)
		total += product.Price * float64(item.Quantity)
		tx.Create(&models.OrderItem{
			OrderID:   order.ID,
			ProductID: product.ID,
			Quantity:  item.Quantity,
			Price:     product.Price,
		})
	}

	order.Total = total
	tx.Save(&order)
	tx.Where("cart_id = ?", cart.ID).Delete(&models.CartItem{})

	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order"})
		return
	}

	database.DB.Preload("Items").First(&order, order.ID)
	c.JSON(http.StatusCreated, order)
}

func PayOrder(c *gin.Context) {
	userID := c.GetUint("user_id")
	orderID := c.Param("id")

	var order models.Order
	if err := database.DB.Preload("Items").First(&order, orderID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	// Ownership check — users can only pay their own orders
	if order.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not your order"})
		return
	}

	if order.Status == "paid" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Order already paid"})
		return
	}

	payment := models.Payment{
		OrderID: order.ID,
		Amount:  order.Total,
		Status:  "paid",
		Method:  "card",
	}
	order.Status = "paid"

	database.DB.Create(&payment)
	database.DB.Save(&order)

	// Fetch the user's email for the confirmation email
	var user models.User
	if err := database.DB.First(&user, userID).Error; err == nil {
		emailItems := make([]services.OrderItem, 0, len(order.Items))
		for _, item := range order.Items {
			emailItems = append(emailItems, services.OrderItem{
				ProductID: item.ProductID,
				Quantity:  item.Quantity,
				Price:     item.Price,
			})
		}

		go func() {
			err := services.SendPaymentConfirmation(services.PaymentConfirmationData{
				ToEmail: user.Email,
				OrderID: order.ID,
				Total:   order.Total,
				Items:   emailItems,
			})
			if err != nil {
				log.Printf("Failed to send payment confirmation email to %s: %v", user.Email, err)
			}
		}()
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Payment successful",
		"status":  order.Status,
		"order":   order,
	})
}

func GetMyOrders(c *gin.Context) {
	userID := c.GetUint("user_id")
	var orders []models.Order
	database.DB.Preload("Items").Where("user_id = ?", userID).Order("created_at desc").Find(&orders)
	c.JSON(http.StatusOK, orders)
}
