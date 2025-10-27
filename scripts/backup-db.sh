#!/bin/bash

# Database backup script
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/window-explorer_backup_$TIMESTAMP.sql"

mkdir -p $BACKUP_DIR

echo "Creating backup: $BACKUP_FILE"
docker-compose exec -T postgres pg_dump -U window-explorer window-explorer_db > $BACKUP_FILE

gzip $BACKUP_FILE

echo "Backup completed: $BACKUP_FILE.gz"

# Delete backups older than 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Old backups cleaned up"