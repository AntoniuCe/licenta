package models

type ProductImage struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	ProductID uint   `gorm:"not null;index" json:"product_id"`
	ImageURL  string `gorm:"size:500;not null" json:"image_url"`
	IsPrimary bool   `gorm:"default:false" json:"is_primary"`
}
