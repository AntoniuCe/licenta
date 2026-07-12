package models

type Cart struct {
	ID     uint       `gorm:"primaryKey" json:"id"`
	UserID uint       `gorm:"not null;uniqueIndex" json:"user_id"`
	Items  []CartItem `gorm:"foreignKey:CartID;constraint:OnDelete:CASCADE" json:"items"`
}

type CartItem struct {
	ID        uint `gorm:"primaryKey" json:"id"`
	CartID    uint `gorm:"not null;index" json:"cart_id"`
	ProductID uint `gorm:"not null;index" json:"product_id"`
	Quantity  int  `gorm:"not null;default:1" json:"quantity"`
}
