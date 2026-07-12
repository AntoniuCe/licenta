package handlers

import (
	"ecommerce/internal/database"
	"ecommerce/internal/models"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

func toUint(value string) uint {
	n, _ := strconv.Atoi(value)
	return uint(n)
}

func productResponse(product models.Product) gin.H {
	rating, reviewCount := getProductRating(product.ID)
	return gin.H{
		"id":           product.ID,
		"name":         product.Name,
		"description":  product.Description,
		"category":     product.Category,
		"price":        product.Price,
		"stock":        product.Stock,
		"images":       product.Images,
		"rating":       rating,
		"review_count": reviewCount,
	}
}

func getProductRating(productID uint) (float64, int64) {
	var reviews []models.Review
	database.DB.Where("product_id = ?", productID).Find(&reviews)
	if len(reviews) == 0 {
		return 0, 0
	}
	var sum int
	for _, r := range reviews {
		sum += r.Rating
	}
	return float64(sum) / float64(len(reviews)), int64(len(reviews))
}

func GetProducts(c *gin.Context) {
	var products []models.Product
	query := database.DB.Preload("Images")
	category := strings.TrimSpace(c.Query("category"))
	search := strings.TrimSpace(c.Query("search"))
	sort := strings.TrimSpace(c.Query("sort"))
	if category != "" && category != "all" {
		query = query.Where("LOWER(category) = LOWER(?)", category)
	}
	if search != "" {
		like := "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(name) LIKE ? OR LOWER(description) LIKE ? OR LOWER(category) LIKE ?", like, like, like)
	}
	switch sort {
	case "price_asc":
		query = query.Order("price asc")
	case "price_desc":
		query = query.Order("price desc")
	case "stock_desc":
		query = query.Order("stock desc")
	default:
		query = query.Order("id desc")
	}
	query.Find(&products)
	result := make([]gin.H, 0, len(products))
	for _, p := range products {
		result = append(result, productResponse(p))
	}
	c.JSON(http.StatusOK, result)
}

func GetProductByID(c *gin.Context) {
	id := c.Param("id")
	var product models.Product
	if err := database.DB.Preload("Images").First(&product, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}
	response := productResponse(product)
	var similar []models.Product
	database.DB.Preload("Images").Where("category = ? AND id <> ?", product.Category, product.ID).Limit(4).Find(&similar)
	similarOut := make([]gin.H, 0, len(similar))
	for _, p := range similar {
		similarOut = append(similarOut, productResponse(p))
	}
	response["similar_products"] = similarOut
	c.JSON(http.StatusOK, response)
}

func CreateProduct(c *gin.Context) {
	name := strings.TrimSpace(c.PostForm("name"))
	description := strings.TrimSpace(c.PostForm("description"))
	category := strings.TrimSpace(c.PostForm("category"))
	isFeatured := c.PostForm("is_featured") == "true"

	price, err := strconv.ParseFloat(c.PostForm("price"), 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid price"})
		return
	}

	stock, err := strconv.Atoi(c.PostForm("stock"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid stock"})
		return
	}

	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name is required"})
		return
	}

	if price < 0 || stock < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid price or stock"})
		return
	}

	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid multipart form"})
		return
	}

	files := form.File["images"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "At least one image is required"})
		return
	}

	if err := os.MkdirAll("uploads", os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create uploads folder"})
		return
	}

	product := models.Product{
		Name:        name,
		Description: description,
		Category:    category,
		Price:       price,
		Stock:       stock,
		IsFeatured:  isFeatured,
	}

	if err := database.DB.Create(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create product"})
		return
	}

	for i, file := range files {
		ext := strings.ToLower(filepath.Ext(file.Filename))
		filename := fmt.Sprintf("%d_%d%s", time.Now().UnixNano(), i, ext)
		savePath := filepath.Join("uploads", filename)

		if err := c.SaveUploadedFile(file, savePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image"})
			return
		}

		image := models.ProductImage{
			ProductID: product.ID,
			ImageURL:  "/uploads/" + filename,
			IsPrimary: i == 0,
		}

		if err := database.DB.Create(&image).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save product image"})
			return
		}
	}

	database.DB.Preload("Images").First(&product, product.ID)
	c.JSON(http.StatusCreated, product)
}

func UpdateProduct(c *gin.Context) {
	id := c.Param("id")
	var product models.Product
	if err := database.DB.Preload("Images").First(&product, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}
	if name := strings.TrimSpace(c.PostForm("name")); name != "" {
		product.Name = name
	}
	if description := strings.TrimSpace(c.PostForm("description")); description != "" {
		product.Description = description
	}
	if category := strings.TrimSpace(c.PostForm("category")); category != "" {
		product.Category = category
	}
	if priceStr := strings.TrimSpace(c.PostForm("price")); priceStr != "" {
		price, err := strconv.ParseFloat(priceStr, 64)
		if err != nil || price < 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid price"})
			return
		}
		product.Price = price
	}
	if stockStr := strings.TrimSpace(c.PostForm("stock")); stockStr != "" {
		stock, err := strconv.Atoi(stockStr)
		if err != nil || stock < 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid stock"})
			return
		}
		product.Stock = stock
	}
	if featuredStr := strings.TrimSpace(c.PostForm("is_featured")); featuredStr != "" {
		product.IsFeatured = featuredStr == "true"
	}
	if err := database.DB.Save(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update product"})
		return
	}
	form, err := c.MultipartForm()
	if err == nil && form != nil {
		files := form.File["images"]
		if len(files) > 0 {
			if err := os.MkdirAll("uploads", os.ModePerm); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create uploads folder"})
				return
			}
			for i, file := range files {
				ext := strings.ToLower(filepath.Ext(file.Filename))
				filename := fmt.Sprintf("%d_%d%s", time.Now().UnixNano(), i, ext)
				savePath := filepath.Join("uploads", filename)
				if err := c.SaveUploadedFile(file, savePath); err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image"})
					return
				}
				image := models.ProductImage{ProductID: product.ID, ImageURL: "/uploads/" + filename, IsPrimary: false}
				if err := database.DB.Create(&image).Error; err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save product image"})
					return
				}
			}
		}
	}
	database.DB.Preload("Images").First(&product, product.ID)
	c.JSON(http.StatusOK, productResponse(product))
}

func SetProductFeatured(c *gin.Context) {
	id := c.Param("id")

	var input struct {
		IsFeatured bool `json:"is_featured"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	var product models.Product
	if err := database.DB.First(&product, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	product.IsFeatured = input.IsFeatured

	if err := database.DB.Save(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update featured flag"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":     "Featured flag updated",
		"id":          product.ID,
		"is_featured": product.IsFeatured,
	})
}
func DeleteProduct(c *gin.Context) {
	id := c.Param("id")
	var product models.Product
	if err := database.DB.Preload("Images").First(&product, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}
	for _, img := range product.Images {
		_ = os.Remove(strings.TrimPrefix(img.ImageURL, "/"))
	}
	if err := database.DB.Delete(&product).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Delete failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Product deleted"})
}

func DeleteProductImage(c *gin.Context) {
	productID := c.Param("id")
	imageID := c.Param("imageId")

	var product models.Product
	if err := database.DB.Preload("Images").First(&product, productID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	var image models.ProductImage
	if err := database.DB.Where("id = ? AND product_id = ?", imageID, productID).First(&image).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
		return
	}

	if len(product.Images) <= 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Product must have at least one image"})
		return
	}

	path := strings.TrimPrefix(image.ImageURL, "/")
	_ = os.Remove(path)

	if err := database.DB.Delete(&image).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete image"})
		return
	}

	if image.IsPrimary {
		var nextImage models.ProductImage
		if err := database.DB.Where("product_id = ?", productID).First(&nextImage).Error; err == nil {
			nextImage.IsPrimary = true
			database.DB.Save(&nextImage)
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Image deleted"})
}

func SetPrimaryProductImage(c *gin.Context) {
	productID := c.Param("id")
	imageID := c.Param("imageId")

	var image models.ProductImage
	if err := database.DB.Where("id = ? AND product_id = ?", imageID, productID).First(&image).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
		return
	}

	if err := database.DB.Model(&models.ProductImage{}).
		Where("product_id = ?", productID).
		Update("is_primary", false).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reset primary image"})
		return
	}

	image.IsPrimary = true
	if err := database.DB.Save(&image).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set primary image"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Primary image updated"})
}
