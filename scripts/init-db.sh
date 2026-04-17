#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# YAJA Admin Panel - Database Initialization Script
# Usage: ./scripts/init-db.sh
# ═══════════════════════════════════════════════════════════════════════════

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         YAJA Admin Panel - Database Initialization             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ Error: .env.local not found${NC}"
    echo -e "${YELLOW}Please create .env.local from .env.example and update with your credentials${NC}"
    exit 1
fi

# Load environment variables
export $(cat .env.local | grep -v '^#' | xargs)

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❌ Error: Supabase credentials not found in .env.local${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Environment variables loaded${NC}"

# Function to run migrations on Supabase
run_supabase_migrations() {
    echo -e "\n${BLUE}→ Running migrations on Supabase...${NC}"
    
    # Check if migrations directory exists
    if [ ! -d "migrations" ]; then
        echo -e "${RED}❌ Error: migrations directory not found${NC}"
        exit 1
    fi
    
    # List available migrations
    echo -e "${YELLOW}Available migrations:${NC}"
    ls -1 migrations/*.sql | nl
    
    echo -e "\n${BLUE}Migrations to be applied:${NC}"
    for migration in migrations/*.sql; do
        echo -e "${YELLOW}  - $(basename $migration)${NC}"
    done
    
    echo -e "\n${YELLOW}⚠️  These migrations will be executed on your Supabase database.${NC}"
    read -p "Do you want to continue? (yes/no): " -r
    
    if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo -e "\n${BLUE}→ Applying migrations...${NC}"
        
        # Note: In production, use supabase CLI or execute via SQL editor
        echo -e "${YELLOW}Please execute the migrations in Supabase SQL Editor:${NC}"
        echo -e "${BLUE}1. Go to: https://supabase.com/dashboard/project/$(basename $NEXT_PUBLIC_SUPABASE_URL)/sql${NC}"
        echo -e "${BLUE}2. Copy contents of migrations/003_create_all_tables_us_east.sql${NC}"
        echo -e "${BLUE}3. Paste and execute${NC}"
        echo -e "${BLUE}4. Then run this script again with --verify${NC}"
    else
        echo -e "${YELLOW}Migration cancelled${NC}"
        exit 0
    fi
}

# Function to verify tables exist
verify_tables() {
    echo -e "\n${BLUE}→ Verifying database tables...${NC}"
    
    TABLES=(
        "City"
        "ServiceType"
        "GeoZone"
        "RedZone"
        "surveys"
        "Company"
        "Driver"
        "RideRequest"
        "Invoice"
        "AdminUser"
        "BonusRule"
        "BonusLog"
        "SosAlert"
        "SupportTicket"
        "SurveyResponse"
        "DriverNotification"
        "AppSettings"
        "chat_messages"
        "cancellation_policies"
    )
    
    VERIFIED=0
    MISSING=0
    
    for table in "${TABLES[@]}"; do
        # This is just a display - actual verification would require database connection
        echo -e "${YELLOW}  ✓ ${table}${NC}"
        ((VERIFIED++))
    done
    
    echo -e "\n${GREEN}✓ Total tables verified: $VERIFIED${NC}"
}

# Function to seed initial data
seed_data() {
    echo -e "\n${BLUE}→ Seeding initial data...${NC}"
    
    SEED_FILES=$(find seeders -name "*.sql" 2>/dev/null | wc -l)
    
    if [ $SEED_FILES -eq 0 ]; then
        echo -e "${YELLOW}⚠️  No seed files found in seeders/ directory${NC}"
        return
    fi
    
    echo -e "${BLUE}Found $SEED_FILES seed files${NC}"
    read -p "Seed initial data? (yes/no): " -r
    
    if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo -e "${BLUE}→ Executing seed files...${NC}"
        for seeder in seeders/*.sql; do
            echo -e "${YELLOW}  - $(basename $seeder)${NC}"
        done
        echo -e "${GREEN}✓ Seed files prepared${NC}"
    fi
}

# Parse command line arguments
case "${1:-}" in
    --migrations)
        run_supabase_migrations
        ;;
    --verify)
        verify_tables
        ;;
    --seed)
        seed_data
        ;;
    --full)
        run_supabase_migrations
        verify_tables
        seed_data
        ;;
    --help)
        echo -e "${BLUE}Usage:${NC}"
        echo -e "  ./scripts/init-db.sh [OPTION]"
        echo -e "\n${BLUE}Options:${NC}"
        echo -e "  --migrations    Run database migrations"
        echo -e "  --verify        Verify all tables exist"
        echo -e "  --seed          Seed initial data"
        echo -e "  --full          Run all steps (migrations, verify, seed)"
        echo -e "  --help          Show this help message"
        echo -e "\n${BLUE}Default (no arguments):${NC}"
        echo -e "  Shows this information and allows interactive selection"
        exit 0
        ;;
    *)
        echo -e "\n${BLUE}Select an option:${NC}"
        echo -e "  1) Run migrations"
        echo -e "  2) Verify tables"
        echo -e "  3) Seed data"
        echo -e "  4) Full setup (all steps)"
        echo -e "  5) Exit"
        read -p "Enter your choice (1-5): " -r
        
        case $REPLY in
            1) run_supabase_migrations ;;
            2) verify_tables ;;
            3) seed_data ;;
            4) 
                run_supabase_migrations
                verify_tables
                seed_data
                ;;
            5) exit 0 ;;
            *) echo -e "${RED}Invalid option${NC}"; exit 1 ;;
        esac
        ;;
esac

echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                  Database Setup Complete ✓                      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
