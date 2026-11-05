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
	PinDigits     int         `json:"pinDigits"`
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
	InstitutionName    *string         `json:"institutionName,omitempty"`
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

type AccountMember struct {
	ID                uuid.UUID  `json:"id"`
	AccountID         uuid.UUID  `json:"accountId"`
	ProfileID         *uuid.UUID `json:"profileId"`
	Role              string     `json:"role"`
	InvitedEmail      *string    `json:"invitedEmail,omitempty"`
	Status            string     `json:"status"`
	ProfileName       *string    `json:"profileName,omitempty"`
	ProfileAvatarIcon *string    `json:"profileAvatarIcon,omitempty"`
	CreatedAt         time.Time  `json:"createdAt"`
}

type AccountWithRole struct {
	Account
	Role string `json:"role"`
}

type AccountInvitation struct {
	ID                 uuid.UUID  `json:"id"`
	AccountID          uuid.UUID  `json:"accountId"`
	AccountName        string     `json:"accountName"`
	AccountType        string     `json:"accountType"`
	AccountCurrency    string     `json:"accountCurrency"`
	InviterProfileID   uuid.UUID  `json:"inviterProfileId"`
	InviterProfileName string     `json:"inviterProfileName"`
	Role               string     `json:"role"`
	Token              string     `json:"token"`
	InviteLink         string     `json:"inviteLink"`
	ExpiresAt          time.Time  `json:"expiresAt"`
	AcceptedByProfileID *uuid.UUID `json:"acceptedByProfileId,omitempty"`
	AcceptedAt         *time.Time `json:"acceptedAt,omitempty"`
	IsExpired          bool       `json:"isExpired"`
	IsAccepted         bool       `json:"isAccepted"`
	CreatedAt          time.Time  `json:"createdAt"`
}

type CreateAccountRequest struct {
	Name            string          `json:"name"`
	InstitutionName *string         `json:"institutionName,omitempty"`
	Type            string          `json:"type"`
	Currency        string          `json:"currency"`
	InitialBalance  decimal.Decimal `json:"initialBalance"`
	Color           string          `json:"color"`
	Icon            string          `json:"icon"`
	IsShared        bool            `json:"isShared"`
}

type UpdateAccountRequest struct {
	Name            *string `json:"name,omitempty"`
	InstitutionName *string `json:"institutionName,omitempty"`
	Type            *string `json:"type,omitempty"`
	Color           *string `json:"color,omitempty"`
	Icon            *string `json:"icon,omitempty"`
	IsArchived      *bool   `json:"isArchived,omitempty"`
}

type CreateInvitationRequest struct {
	Role string `json:"role"`
}

type AcceptInvitationRequest struct {
	Token     string    `json:"token"`
	ProfileID uuid.UUID `json:"profileId"`
}

type UpdateMemberRoleRequest struct {
	Role string `json:"role"`
}

// ------------------------------------------------------
// Transaction Models & DTOs (TXN-02 to TXN-05)
// ------------------------------------------------------

type Transaction struct {
	ID                 uuid.UUID        `json:"id"`
	ProfileID          uuid.UUID        `json:"profileId"`
	AccountID          uuid.UUID        `json:"accountId"`
	ToAccountID        *uuid.UUID       `json:"toAccountId,omitempty"`
	CategoryID         *uuid.UUID       `json:"categoryId,omitempty"`
	Type               string           `json:"type"` // expense, income, transfer
	Amount             decimal.Decimal  `json:"amount"`
	ToAmount           *decimal.Decimal `json:"toAmount,omitempty"`
	Currency           string           `json:"currency"`
	ExchangeRateToBase decimal.Decimal  `json:"exchangeRateToBase"`
	BaseAmount         decimal.Decimal  `json:"baseAmount"`
	Date               time.Time        `json:"date"`
	Note               *string          `json:"note,omitempty"`
	Tags               []string         `json:"tags"`
	IsRecurring        bool             `json:"isRecurring"`
	CreatedAt          time.Time        `json:"createdAt"`
	UpdatedAt          time.Time        `json:"updatedAt"`

	// Relational fields for UX & history
	AccountName       *string `json:"accountName,omitempty"`
	AccountColor      *string `json:"accountColor,omitempty"`
	AccountIcon       *string `json:"accountIcon,omitempty"`
	AccountCurrency   *string `json:"accountCurrency,omitempty"`
	ToAccountName     *string `json:"toAccountName,omitempty"`
	ToAccountColor    *string `json:"toAccountColor,omitempty"`
	ToAccountIcon     *string `json:"toAccountIcon,omitempty"`
	ToAccountCurrency *string `json:"toAccountCurrency,omitempty"`
	CategoryName      *string `json:"categoryName,omitempty"`
	CategoryIcon      *string `json:"categoryIcon,omitempty"`
	CategoryColor     *string `json:"categoryColor,omitempty"`
}

type ExchangeRate struct {
	Pair         string          `json:"pair"`
	FromCurrency string          `json:"fromCurrency"`
	ToCurrency   string          `json:"toCurrency"`
	Rate         decimal.Decimal `json:"rate"`
	UpdatedAt    time.Time       `json:"updatedAt"`
}

type CategoryWithUsage struct {
	Category
	UsageCount int `json:"usageCount"`
}

type CreateTransactionRequest struct {
	AccountID          uuid.UUID        `json:"accountId"`
	ToAccountID        *uuid.UUID       `json:"toAccountId,omitempty"`
	CategoryID         *uuid.UUID       `json:"categoryId,omitempty"`
	Type               string           `json:"type"` // expense, income, transfer
	Amount             decimal.Decimal  `json:"amount"`
	ToAmount           *decimal.Decimal `json:"toAmount,omitempty"`
	Currency           *string          `json:"currency,omitempty"`
	ExchangeRateToBase *decimal.Decimal `json:"exchangeRateToBase,omitempty"`
	Date               *time.Time       `json:"date,omitempty"`
	Note               *string          `json:"note,omitempty"`
	Tags               []string         `json:"tags,omitempty"`
	IsRecurring        bool             `json:"isRecurring"`
}

type UpdateTransactionRequest struct {
	AccountID          *uuid.UUID       `json:"accountId,omitempty"`
	ToAccountID        *uuid.UUID       `json:"toAccountId,omitempty"`
	CategoryID         *uuid.UUID       `json:"categoryId,omitempty"`
	Amount             *decimal.Decimal `json:"amount,omitempty"`
	ToAmount           *decimal.Decimal `json:"toAmount,omitempty"`
	ExchangeRateToBase *decimal.Decimal `json:"exchangeRateToBase,omitempty"`
	Date               *time.Time       `json:"date,omitempty"`
	Note               *string          `json:"note,omitempty"`
	Tags               *[]string        `json:"tags,omitempty"`
}

type CreateTransferRequest struct {
	FromAccountID uuid.UUID        `json:"fromAccountId"`
	ToAccountID   uuid.UUID        `json:"toAccountId"`
	Amount        decimal.Decimal  `json:"amount"`
	ToAmount      *decimal.Decimal `json:"toAmount,omitempty"`
	ExchangeRate  *decimal.Decimal `json:"exchangeRate,omitempty"`
	Date          *time.Time       `json:"date,omitempty"`
	Note          *string          `json:"note,omitempty"`
	Tags          []string         `json:"tags,omitempty"`
}

type TransactionFilter struct {
	ProfileID  uuid.UUID
	AccountID  *uuid.UUID
	CategoryID *uuid.UUID
	Type       *string
	StartDate  *time.Time
	EndDate    *time.Time
	Search     *string
	Limit      int
	Offset     int
}

type PaginatedTransactions struct {
	Items      []Transaction `json:"items"`
	TotalCount int           `json:"totalCount"`
	Limit      int           `json:"limit"`
	Offset     int           `json:"offset"`
	HasMore    bool          `json:"hasMore"`
}

type CreateCategoryRequest struct {
	Name      string `json:"name"`
	Type      string `json:"type"`
	Icon      string `json:"icon"`
	Color     string `json:"color"`
	SortOrder int    `json:"sortOrder"`
}

type UpdateCategoryRequest struct {
	Name      *string `json:"name,omitempty"`
	Icon      *string `json:"icon,omitempty"`
	Color     *string `json:"color,omitempty"`
	SortOrder *int    `json:"sortOrder,omitempty"`
}
