package models

type Product struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Name        string         `gorm:"size:150;not null" json:"name"`
	Description string         `gorm:"type:text" json:"description"`
	Category    string         `gorm:"size:80" json:"category"`
	Price       float64        `gorm:"not null" json:"price"`
	Stock       int            `gorm:"default:0" json:"stock"`
	IsFeatured  bool           `gorm:"default:false" json:"is_featured"`
	Images      []ProductImage `gorm:"foreignKey:ProductID;constraint:OnDelete:CASCADE" json:"images"`
}
