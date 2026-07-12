package models

type Payment struct {
	ID      uint    `gorm:"primaryKey" json:"id"`
	OrderID uint    `gorm:"not null;index" json:"order_id"`
	Amount  float64 `gorm:"not null" json:"amount"`
	Status  string  `gorm:"size:30;default:paid" json:"status"`
	Method  string  `gorm:"size:30" json:"method"`
}
