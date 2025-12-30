#!/bin/bash
# Backup script for MOGU Edu Database
# Usage: bash backup-database.sh [local|remote]

MODE="${1:-local}"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="./backups"
BACKUP_FILE="$BACKUP_DIR/moguedu-backup-$DATE.sql"

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

echo "🔄 Starting database backup..."
echo "📅 Date: $DATE"
echo "💾 Mode: $MODE"
echo "📁 File: $BACKUP_FILE"

# Database name
DB_NAME="moguedu-production"

# Remote or local flag
if [ "$MODE" = "remote" ]; then
  FLAG="--remote"
else
  FLAG="--local"
fi

# Create SQL backup file header
cat > "$BACKUP_FILE" << 'HEADER'
-- MOGU Edu Database Backup
-- Generated: DATE_PLACEHOLDER
-- Database: moguedu-production
-- Mode: MODE_PLACEHOLDER

BEGIN TRANSACTION;

HEADER

sed -i "s/DATE_PLACEHOLDER/$(date)/g" "$BACKUP_FILE"
sed -i "s/MODE_PLACEHOLDER/$MODE/g" "$BACKUP_FILE"

echo ""
echo "📦 Backing up tables..."

# Backup training_centers
echo "  → training_centers"
npx wrangler d1 execute $DB_NAME $FLAG --command="SELECT * FROM training_centers" --json >> "$BACKUP_FILE.tmp" 2>/dev/null
echo "" >> "$BACKUP_FILE"
echo "-- training_centers" >> "$BACKUP_FILE"
cat "$BACKUP_FILE.tmp" >> "$BACKUP_FILE"
rm -f "$BACKUP_FILE.tmp"

# Backup training_programs
echo "  → training_programs"
npx wrangler d1 execute $DB_NAME $FLAG --command="SELECT * FROM training_programs" --json >> "$BACKUP_FILE.tmp" 2>/dev/null
echo "" >> "$BACKUP_FILE"
echo "-- training_programs" >> "$BACKUP_FILE"
cat "$BACKUP_FILE.tmp" >> "$BACKUP_FILE"
rm -f "$BACKUP_FILE.tmp"

# Backup certificates
echo "  → certificates"
npx wrangler d1 execute $DB_NAME $FLAG --command="SELECT * FROM certificates" --json >> "$BACKUP_FILE.tmp" 2>/dev/null
echo "" >> "$BACKUP_FILE"
echo "-- certificates" >> "$BACKUP_FILE"
cat "$BACKUP_FILE.tmp" >> "$BACKUP_FILE"
rm -f "$BACKUP_FILE.tmp"

# Backup accreditation_standards
echo "  → accreditation_standards"
npx wrangler d1 execute $DB_NAME $FLAG --command="SELECT * FROM accreditation_standards" --json >> "$BACKUP_FILE.tmp" 2>/dev/null
echo "" >> "$BACKUP_FILE"
echo "-- accreditation_standards" >> "$BACKUP_FILE"
cat "$BACKUP_FILE.tmp" >> "$BACKUP_FILE"
rm -f "$BACKUP_FILE.tmp"

# Backup admin_users (without passwords for security)
echo "  → admin_users"
npx wrangler d1 execute $DB_NAME $FLAG --command="SELECT id, username, created_at, last_login FROM admin_users" --json >> "$BACKUP_FILE.tmp" 2>/dev/null
echo "" >> "$BACKUP_FILE"
echo "-- admin_users (passwords excluded for security)" >> "$BACKUP_FILE"
cat "$BACKUP_FILE.tmp" >> "$BACKUP_FILE"
rm -f "$BACKUP_FILE.tmp"

# Backup contact_submissions
echo "  → contact_submissions"
npx wrangler d1 execute $DB_NAME $FLAG --command="SELECT * FROM contact_submissions" --json >> "$BACKUP_FILE.tmp" 2>/dev/null
echo "" >> "$BACKUP_FILE"
echo "-- contact_submissions" >> "$BACKUP_FILE"
cat "$BACKUP_FILE.tmp" >> "$BACKUP_FILE"
rm -f "$BACKUP_FILE.tmp"

# End transaction
echo "" >> "$BACKUP_FILE"
echo "COMMIT;" >> "$BACKUP_FILE"

echo ""
echo "✅ Backup completed successfully!"
echo "📁 File: $BACKUP_FILE"
echo "📊 Size: $(du -h "$BACKUP_FILE" | cut -f1)"
echo ""
echo "📋 To restore this backup:"
echo "   npx wrangler d1 execute moguedu-production --$MODE --file=$BACKUP_FILE"

