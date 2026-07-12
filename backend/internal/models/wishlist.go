package models

type WishlistItem struct {
	ID        uint `gorm:"primaryKey" json:"id"`
	UserID    uint `gorm:"not null;index:idx_user_product,unique" json:"user_id"`
	ProductID uint `gorm:"not null;index:idx_user_product,unique" json:"product_id"`
}
