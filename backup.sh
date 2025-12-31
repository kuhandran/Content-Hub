#!/bin/bash
# Backup script for portfolio CMS
# Usage: ./backup.sh [optional: backup-dir]

BACKUP_DIR="${1:-/backups/portfolio-cms}"
SOURCE_DIR="/opt/portfolio-cms/public/collections"
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/collections-$DATE.tar.gz"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔄 Starting backup..."

# Check source directory exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo -e "${RED}✗ Source directory not found: $SOURCE_DIR${NC}"
    exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create backup
echo "📦 Compressing files..."
if tar -czf "$BACKUP_FILE" "$SOURCE_DIR"; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✓ Backup created: $BACKUP_FILE${NC}"
    echo "   Size: $BACKUP_SIZE"
else
    echo -e "${RED}✗ Backup failed${NC}"
    exit 1
fi

# Verify backup
echo "✅ Verifying backup..."
if tar -tzf "$BACKUP_FILE" > /dev/null; then
    echo -e "${GREEN}✓ Backup verified${NC}"
else
    echo -e "${RED}✗ Backup verification failed${NC}"
    rm "$BACKUP_FILE"
    exit 1
fi

# Cleanup old backups (keep 30 days)
echo "🧹 Cleaning old backups..."
DELETED=$(find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete -print | wc -l)
if [ "$DELETED" -gt 0 ]; then
    echo "   Deleted $DELETED old backup(s)"
fi

# Show backup statistics
echo ""
echo "📊 Backup Statistics:"
echo "   Total backups: $(ls -1 "$BACKUP_DIR"/*.tar.gz 2>/dev/null | wc -l)"
echo "   Total size: $(du -sh "$BACKUP_DIR" | cut -f1)"
echo "   Retention: 30 days"

echo ""
echo -e "${GREEN}✅ Backup completed successfully!${NC}"
