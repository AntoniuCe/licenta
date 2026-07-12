package models

import "time"

type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Email     string    `gorm:"uniqueIndex;not null" json:"email"`
	// Password is empty string for Google-authenticated users
	Password  string    `gorm:"default:''" json:"-"`
	Role      string    `gorm:"default:user;not null" json:"role"`
	CreatedAt time.Time `json:"created_at"`
}
