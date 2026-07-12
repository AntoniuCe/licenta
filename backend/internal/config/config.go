package config

import "os"

var JWTSecret = []byte(getEnv("JWT_SECRET", "supersecretkey"))

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
