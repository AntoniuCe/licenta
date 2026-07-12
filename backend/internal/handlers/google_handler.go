package handlers

import (
	"ecommerce/internal/config"
	"ecommerce/internal/database"
	"ecommerce/internal/models"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// GoogleTokenInfo is what Google's tokeninfo endpoint returns
type GoogleTokenInfo struct {
	Sub           string `json:"sub"`           // unique Google user ID
	Email         string `json:"email"`
	EmailVerified string `json:"email_verified"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
	Aud           string `json:"aud"` // must match our client ID
	Exp           string `json:"exp"`
	Error         string `json:"error"`
	ErrorDesc     string `json:"error_description"`
}

func GoogleLogin(c *gin.Context) {
	var input struct {
		Credential string `json:"credential" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing Google credential"})
		return
	}

	// Verify the token with Google's tokeninfo endpoint.
	// This is the simplest approach — no extra libraries needed.
	// For production you'd verify locally using the google-auth library,
	// but tokeninfo is fine for a demo/k3s project.
	info, err := verifyGoogleToken(input.Credential)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Google token: " + err.Error()})
		return
	}

	if info.EmailVerified != "true" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Google email not verified"})
		return
	}

	email := strings.TrimSpace(strings.ToLower(info.Email))
	if email == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Could not retrieve email from Google"})
		return
	}

	// Upsert: find existing user or create a new one.
	// Google users have no password (empty string is fine — bcrypt login
	// will always fail for them, which is the correct behavior).
	var user models.User
	result := database.DB.Where("email = ?", email).First(&user)

	if result.Error != nil {
		// New user — create them
		user = models.User{
			Email:    email,
			Password: "", // no password for Google users
			Role:     "user",
		}
		if err := database.DB.Create(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
			return
		}
	}
	// If user already exists (registered with email before), we just log them in —
	// no need to update anything.

	// Issue the same JWT as the regular login
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"role":    user.Role,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	})
	tokenString, err := token.SignedString(config.JWTSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": tokenString,
		"user": gin.H{
			"id":    user.ID,
			"email": user.Email,
			"role":  user.Role,
		},
	})
}

// verifyGoogleToken calls Google's tokeninfo endpoint to validate the
// credential JWT and extract the user's email and subject.
func verifyGoogleToken(credential string) (*GoogleTokenInfo, error) {
	url := "https://oauth2.googleapis.com/tokeninfo?id_token=" + credential

	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to reach Google: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read Google response: %w", err)
	}

	var info GoogleTokenInfo
	if err := json.Unmarshal(body, &info); err != nil {
		return nil, fmt.Errorf("failed to parse Google response: %w", err)
	}

	if info.Error != "" {
		return nil, fmt.Errorf("%s: %s", info.Error, info.ErrorDesc)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Google returned status %d", resp.StatusCode)
	}

	return &info, nil
}
