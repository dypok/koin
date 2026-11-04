package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type ThemeConfig struct {
	Preset     string `json:"preset"`
	PrimaryHex string `json:"primaryHex"`
	AccentHex  string `json:"accentHex"`
	BaseMode   string `json:"baseMode"`
}

func (t ThemeConfig) Value() (driver.Value, error) {
	return json.Marshal(t)
}

func (t *ThemeConfig) Scan(value interface{}) error {
	if value == nil {
		*t = ThemeConfig{
			Preset:     "gold",
			PrimaryHex: "#F59E0B",
			AccentHex:  "#FCD34D",
			BaseMode:   "dark",
		}
		return nil
	}
	b, ok := value.([]byte)
	if !ok {
		return errors.New("failed to scan ThemeConfig: expected []byte")
	}
	return json.Unmarshal(b, t)
}

type User struct {
	ID           uuid.UUID `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	FullName     string    `json:"fullName"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

type Profile struct {
	ID            uuid.UUID   `json:"id"`
	UserID        uuid.UUID   `json:"userId"`
	Name          string      `json:"name"`
	AvatarIcon    string      `json:"avatarIcon"`
	ThemeConfig   ThemeConfig `json:"themeConfig"`
	BaseCurrency  string      `json:"baseCurrency"`
	HasPin        bool        `json:"hasPin"`
	PinHash       *string     `json:"-"`
	FailedAttempts int         `json:"failedAttempts"`
	LockedUntil   *time.Time  `json:"lockedUntil,omitempty"`
	UseBiometrics bool        `json:"useBiometrics"`
	CreatedAt     time.Time   `json:"createdAt"`
	UpdatedAt     time.Time   `json:"updatedAt"`
}

type Account struct {
	ID                 uuid.UUID       `json:"id"`
	CreatedByProfileID uuid.UUID       `json:"createdByProfileId"`
	Name               string          `json:"name"`
	Type               string          `json:"type"`
	Currency           string          `json:"currency"`
	InitialBalance     decimal.Decimal `json:"initialBalance"`
	CurrentBalance     decimal.Decimal `json:"currentBalance"`
	IsShared           bool            `json:"isShared"`
	Color              string          `json:"color"`
	Icon               string          `json:"icon"`
	IsArchived         bool            `json:"isArchived"`
	CreatedAt          time.Time       `json:"createdAt"`
	UpdatedAt          time.Time       `json:"updatedAt"`
}

type Category struct {
	ID        uuid.UUID `json:"id"`
	ProfileID uuid.UUID `json:"profileId"`
	Name      string    `json:"name"`
	Type      string    `json:"type"`
	Icon      string    `json:"icon"`
	Color     string    `json:"color"`
	IsDefault bool      `json:"isDefault"`
	SortOrder int       `json:"sortOrder"`
	CreatedAt time.Time `json:"createdAt"`
}

// DTOs
type RegisterRequest struct {
	Email        string `json:"email"`
	Password     string `json:"password"`
	FullName     string `json:"fullName"`
	BaseCurrency string `json:"baseCurrency"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type RegisterResponseData struct {
	User            User      `json:"user"`
	Profile         Profile   `json:"profile"`
	AccountsCount   int       `json:"accountsCount"`
	CategoriesCount int       `json:"categoriesCount"`
	Token           string    `json:"token"`
}

type LoginResponseData struct {
	User          User      `json:"user"`
	Profiles      []Profile `json:"profiles"`
	ActiveProfile *Profile  `json:"activeProfile"`
	Token         string    `json:"token"`
}

type MeResponseData struct {
	User     User      `json:"user"`
	Profiles []Profile `json:"profiles"`
}

type CreateProfileRequest struct {
	Name          string       `json:"name"`
	AvatarIcon    string       `json:"avatarIcon"`
	ThemeConfig   *ThemeConfig `json:"themeConfig,omitempty"`
	BaseCurrency  string       `json:"baseCurrency"`
	PIN           *string      `json:"pin,omitempty"`
	UseBiometrics bool         `json:"useBiometrics"`
}

type UpdateProfileRequest struct {
	Name          *string      `json:"name,omitempty"`
	AvatarIcon    *string      `json:"avatarIcon,omitempty"`
	ThemeConfig   *ThemeConfig `json:"themeConfig,omitempty"`
	BaseCurrency  *string      `json:"baseCurrency,omitempty"`
	PIN           *string      `json:"pin,omitempty"`
	UseBiometrics *bool        `json:"useBiometrics,omitempty"`
}

type VerifyPINRequest struct {
	PIN string `json:"pin"`
}

type SetPINRequest struct {
	PIN string `json:"pin"`
}
