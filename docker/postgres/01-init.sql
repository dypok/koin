-- ==============================================================================
-- KOIN ENTERPRISE POSTGRESQL INITIALIZATION SCHEMA
-- Multi-Schema Architecture: auth, finance, analytics, system
-- ==============================================================================

-- 1. Create Enterprise Schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS finance;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS system;

-- 2. Configure Default Search Path
ALTER DATABASE koin SET search_path TO finance, auth, analytics, system, public;
ALTER USER postgres SET search_path TO finance, auth, analytics, system, public;
SET search_path TO finance, auth, analytics, system, public;

-- ==============================================================================
-- SCHEMA: auth (Identity, Profiles, Access)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS auth.users (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	email varchar(255) NOT NULL,
	password_hash varchar(255) NOT NULL,
	full_name varchar(150) NOT NULL,
	created_at timestamp with time zone DEFAULT now() NOT NULL,
	updated_at timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT users_email_unique UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS auth.profiles (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	user_id uuid NOT NULL,
	name varchar(100) NOT NULL,
	avatar_icon varchar(50) DEFAULT 'User' NOT NULL,
	theme_config jsonb NOT NULL,
	base_currency varchar(3) DEFAULT 'USD' NOT NULL,
	has_pin boolean DEFAULT false NOT NULL,
	pin_hash varchar(255),
	pin_digits integer DEFAULT 4 NOT NULL,
	failed_attempts integer DEFAULT 0 NOT NULL,
	locked_until timestamp with time zone,
	use_biometrics boolean DEFAULT false NOT NULL,
	created_at timestamp with time zone DEFAULT now() NOT NULL,
	updated_at timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT profiles_user_id_fk FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE cascade
);

CREATE INDEX IF NOT EXISTS idx_users_email ON auth.users USING btree (email);
CREATE INDEX IF NOT EXISTS idx_profiles_user ON auth.profiles USING btree (user_id);

-- ==============================================================================
-- SCHEMA: finance (Core Sovereign Accounting & Ledger)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS finance.accounts (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	created_by_profile_id uuid NOT NULL,
	name varchar(100) NOT NULL,
	institution_name varchar(100),
	type varchar(20) NOT NULL,
	currency varchar(3) DEFAULT 'USD' NOT NULL,
	initial_balance numeric(14, 2) DEFAULT '0.00' NOT NULL,
	current_balance numeric(14, 2) DEFAULT '0.00' NOT NULL,
	is_shared boolean DEFAULT false NOT NULL,
	color varchar(20) DEFAULT '#F59E0B' NOT NULL,
	icon varchar(50) DEFAULT 'Wallet' NOT NULL,
	is_archived boolean DEFAULT false NOT NULL,
	created_at timestamp with time zone DEFAULT now() NOT NULL,
	updated_at timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT accounts_created_by_profile_id_fk FOREIGN KEY (created_by_profile_id) REFERENCES auth.profiles(id) ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS finance.account_members (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	account_id uuid NOT NULL,
	profile_id uuid,
	role varchar(20) NOT NULL,
	invited_email varchar(255),
	status varchar(20) DEFAULT 'accepted' NOT NULL,
	created_at timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT account_members_account_id_fk FOREIGN KEY (account_id) REFERENCES finance.accounts(id) ON DELETE cascade,
	CONSTRAINT account_members_profile_id_fk FOREIGN KEY (profile_id) REFERENCES auth.profiles(id) ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS finance.account_invitations (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	account_id uuid NOT NULL,
	inviter_profile_id uuid NOT NULL,
	role varchar(20) DEFAULT 'editor' NOT NULL,
	token varchar(128) UNIQUE NOT NULL,
	expires_at timestamp with time zone NOT NULL,
	accepted_by_profile_id uuid,
	accepted_at timestamp with time zone,
	created_at timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT account_invitations_account_id_fk FOREIGN KEY (account_id) REFERENCES finance.accounts(id) ON DELETE cascade,
	CONSTRAINT account_invitations_inviter_profile_id_fk FOREIGN KEY (inviter_profile_id) REFERENCES auth.profiles(id) ON DELETE cascade,
	CONSTRAINT account_invitations_accepted_by_profile_id_fk FOREIGN KEY (accepted_by_profile_id) REFERENCES auth.profiles(id) ON DELETE set null
);

CREATE TABLE IF NOT EXISTS finance.categories (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	profile_id uuid NOT NULL,
	name varchar(100) NOT NULL,
	type varchar(20) NOT NULL,
	icon varchar(50) DEFAULT 'Tag' NOT NULL,
	color varchar(20) DEFAULT '#6B7280' NOT NULL,
	is_default boolean DEFAULT false NOT NULL,
	sort_order integer DEFAULT 0 NOT NULL,
	created_at timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT categories_profile_id_fk FOREIGN KEY (profile_id) REFERENCES auth.profiles(id) ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS finance.budgets (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	profile_id uuid NOT NULL,
	category_id uuid NOT NULL,
	period varchar(20) DEFAULT 'monthly' NOT NULL,
	limit_amount numeric(14, 2) NOT NULL,
	alert_threshold_percent integer DEFAULT 80 NOT NULL,
	created_at timestamp with time zone DEFAULT now() NOT NULL,
	updated_at timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT budgets_profile_id_fk FOREIGN KEY (profile_id) REFERENCES auth.profiles(id) ON DELETE cascade,
	CONSTRAINT budgets_category_id_fk FOREIGN KEY (category_id) REFERENCES finance.categories(id) ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS finance.recurring_rules (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	profile_id uuid NOT NULL,
	account_id uuid NOT NULL,
	category_id uuid,
	name varchar(100) NOT NULL,
	type varchar(20) NOT NULL,
	amount numeric(14, 2) NOT NULL,
	currency varchar(3) DEFAULT 'USD' NOT NULL,
	frequency varchar(20) DEFAULT 'monthly' NOT NULL,
	day_of_month integer DEFAULT 1 NOT NULL,
	is_installment boolean DEFAULT false NOT NULL,
	total_installments integer,
	current_installment integer DEFAULT 0 NOT NULL,
	principal_amount numeric(14, 2),
	total_interest_amount numeric(14, 2),
	installment_principal numeric(14, 2),
	installment_interest numeric(14, 2),
	interest_rate numeric(6, 3),
	auto_apply boolean DEFAULT true NOT NULL,
	next_run_date date NOT NULL,
	last_run_at timestamp with time zone,
	status varchar(20) DEFAULT 'active' NOT NULL,
	note text,
	created_at timestamp with time zone DEFAULT now() NOT NULL,
	updated_at timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT recurring_profile_id_fk FOREIGN KEY (profile_id) REFERENCES auth.profiles(id) ON DELETE cascade,
	CONSTRAINT recurring_account_id_fk FOREIGN KEY (account_id) REFERENCES finance.accounts(id) ON DELETE cascade,
	CONSTRAINT recurring_category_id_fk FOREIGN KEY (category_id) REFERENCES finance.categories(id) ON DELETE set null
);

CREATE TABLE IF NOT EXISTS finance.transactions (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	profile_id uuid NOT NULL,
	account_id uuid NOT NULL,
	to_account_id uuid,
	category_id uuid,
	type varchar(20) NOT NULL,
	amount numeric(14, 2) NOT NULL,
	to_amount numeric(14, 2),
	currency varchar(3) DEFAULT 'USD' NOT NULL,
	exchange_rate_to_base numeric(18, 6) DEFAULT '1.000000' NOT NULL,
	base_amount numeric(14, 2) NOT NULL,
	date timestamp with time zone DEFAULT now() NOT NULL,
	note text,
	tags text[],
	is_recurring boolean DEFAULT false NOT NULL,
	recurring_rule_id uuid,
	installment_number integer,
	principal_portion numeric(14, 2),
	interest_portion numeric(14, 2),
	created_at timestamp with time zone DEFAULT now() NOT NULL,
	updated_at timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT transactions_profile_id_fk FOREIGN KEY (profile_id) REFERENCES auth.profiles(id) ON DELETE restrict,
	CONSTRAINT transactions_account_id_fk FOREIGN KEY (account_id) REFERENCES finance.accounts(id) ON DELETE restrict,
	CONSTRAINT transactions_to_account_id_fk FOREIGN KEY (to_account_id) REFERENCES finance.accounts(id) ON DELETE restrict,
	CONSTRAINT transactions_category_id_fk FOREIGN KEY (category_id) REFERENCES finance.categories(id) ON DELETE restrict,
	CONSTRAINT transactions_recurring_rule_id_fk FOREIGN KEY (recurring_rule_id) REFERENCES finance.recurring_rules(id) ON DELETE set null
);

CREATE INDEX IF NOT EXISTS idx_accounts_creator ON finance.accounts USING btree (created_by_profile_id, is_archived);
CREATE INDEX IF NOT EXISTS idx_account_members_profile ON finance.account_members USING btree (profile_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_account_profile_member ON finance.account_members USING btree (account_id, profile_id);
CREATE INDEX IF NOT EXISTS idx_account_invitations_token ON finance.account_invitations USING btree (token);
CREATE INDEX IF NOT EXISTS idx_account_invitations_account ON finance.account_invitations USING btree (account_id);
CREATE INDEX IF NOT EXISTS idx_categories_profile ON finance.categories USING btree (profile_id, type);
CREATE UNIQUE INDEX IF NOT EXISTS uq_profile_category_budget ON finance.budgets USING btree (profile_id, category_id, period);
CREATE INDEX IF NOT EXISTS idx_transactions_profile_date ON finance.transactions USING btree (profile_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_account_date ON finance.transactions USING btree (account_id, date);

-- ==============================================================================
-- SCHEMA: system (Rates & Audit Logs)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS system.exchange_rates (
	pair varchar(7) PRIMARY KEY NOT NULL,
	from_currency varchar(3) NOT NULL,
	to_currency varchar(3) NOT NULL,
	rate numeric(18, 6) NOT NULL,
	updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS system.audit_logs (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	user_id uuid,
	profile_id uuid,
	action varchar(50) NOT NULL,
	entity varchar(50) NOT NULL,
	entity_id uuid,
	details jsonb,
	ip_address varchar(45),
	created_at timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT audit_logs_user_id_fk FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE set null,
	CONSTRAINT audit_logs_profile_id_fk FOREIGN KEY (profile_id) REFERENCES auth.profiles(id) ON DELETE set null
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON system.audit_logs USING btree (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_profile ON system.audit_logs USING btree (profile_id, created_at);

-- ==============================================================================
-- SCHEMA: analytics (Financial Intelligence & User Spending Views)
-- ==============================================================================

-- 1. Gastos por Categoría (En qué gasta)
CREATE OR REPLACE VIEW analytics.v_category_expenses AS
SELECT 
    t.profile_id,
    c.id AS category_id,
    c.name AS category_name,
    c.icon AS category_icon,
    c.color AS category_color,
    to_char(t.date, 'YYYY-MM') AS month_period,
    COUNT(t.id) AS transaction_count,
    SUM(t.base_amount) AS total_spent,
    ROUND(AVG(t.base_amount), 2) AS average_ticket
FROM finance.transactions t
JOIN finance.categories c ON t.category_id = c.id
WHERE t.type = 'expense'
GROUP BY t.profile_id, c.id, c.name, c.icon, c.color, to_char(t.date, 'YYYY-MM');

-- 2. Flujo de Caja Mensual y Tasa de Ahorro (Cómo lo gasta y cuánto retiene)
CREATE OR REPLACE VIEW analytics.v_monthly_cashflow AS
SELECT 
    t.profile_id,
    to_char(t.date, 'YYYY-MM') AS month_period,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.base_amount ELSE 0 END), 0) AS total_income,
    COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.base_amount ELSE 0 END), 0) AS total_expense,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.base_amount ELSE -t.base_amount END), 0) AS net_savings,
    CASE 
        WHEN SUM(CASE WHEN t.type = 'income' THEN t.base_amount ELSE 0 END) > 0 
        THEN ROUND(
            ((SUM(CASE WHEN t.type = 'income' THEN t.base_amount ELSE 0 END) - 
              SUM(CASE WHEN t.type = 'expense' THEN t.base_amount ELSE 0 END)) / 
             SUM(CASE WHEN t.type = 'income' THEN t.base_amount ELSE 0 END)) * 100, 2
        )
        ELSE 0 
    END AS savings_rate_percent
FROM finance.transactions t
GROUP BY t.profile_id, to_char(t.date, 'YYYY-MM');

-- 3. Salud de Presupuestos vs Gasto Real
CREATE OR REPLACE VIEW analytics.v_budget_health AS
SELECT 
    b.id AS budget_id,
    b.profile_id,
    b.category_id,
    c.name AS category_name,
    c.color AS category_color,
    b.limit_amount,
    COALESCE(SUM(t.base_amount), 0) AS spent_amount,
    b.limit_amount - COALESCE(SUM(t.base_amount), 0) AS remaining_amount,
    CASE 
        WHEN b.limit_amount > 0 
        THEN ROUND((COALESCE(SUM(t.base_amount), 0) / b.limit_amount) * 100, 1)
        ELSE 0 
    END AS percentage_used,
    CASE 
        WHEN COALESCE(SUM(t.base_amount), 0) > b.limit_amount THEN 'exceeded'
        WHEN COALESCE(SUM(t.base_amount), 0) >= (b.limit_amount * b.alert_threshold_percent / 100) THEN 'warning'
        ELSE 'on_track'
    END AS status
FROM finance.budgets b
JOIN finance.categories c ON b.category_id = c.id
LEFT JOIN finance.transactions t ON t.category_id = b.category_id 
    AND t.profile_id = b.profile_id 
    AND t.type = 'expense'
    AND to_char(t.date, 'YYYY-MM') = to_char(CURRENT_DATE, 'YYYY-MM')
GROUP BY b.id, b.profile_id, b.category_id, c.name, c.color, b.limit_amount, b.alert_threshold_percent;

-- ==============================================================================
-- SEED: system.exchange_rates
-- ==============================================================================
INSERT INTO system.exchange_rates (pair, from_currency, to_currency, rate) VALUES
('USD_USD', 'USD', 'USD', 1.000000),
('USD_EUR', 'USD', 'EUR', 0.920000),
('EUR_USD', 'EUR', 'USD', 1.086957),
('USD_COP', 'USD', 'COP', 4150.250000),
('COP_USD', 'COP', 'USD', 0.000241),
('USD_MXN', 'USD', 'MXN', 19.500000),
('MXN_USD', 'MXN', 'USD', 0.051282),
('USD_BRL', 'USD', 'BRL', 5.500000),
('BRL_USD', 'BRL', 'USD', 0.181818),
('USD_ARS', 'USD', 'ARS', 980.000000),
('ARS_USD', 'ARS', 'USD', 0.001020),
('USD_CLP', 'USD', 'CLP', 940.000000),
('CLP_USD', 'CLP', 'USD', 0.001064),
('USD_PEN', 'USD', 'PEN', 3.750000),
('PEN_USD', 'PEN', 'USD', 0.266667),
('USD_GBP', 'USD', 'GBP', 0.770000),
('GBP_USD', 'GBP', 'USD', 1.298701),
('USD_CAD', 'USD', 'CAD', 1.380000),
('CAD_USD', 'CAD', 'USD', 0.724638),
('EUR_COP', 'EUR', 'COP', 4511.140000),
('COP_EUR', 'COP', 'EUR', 0.000222),
('EUR_MXN', 'EUR', 'MXN', 21.195652),
('MXN_EUR', 'MXN', 'EUR', 0.047180)
ON CONFLICT (pair) DO UPDATE SET rate = EXCLUDED.rate, updated_at = NOW();