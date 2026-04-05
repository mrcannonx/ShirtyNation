#!/bin/bash
# ShirtyNation Design Watch Folder
#
# HOW IT WORKS:
# 1. You generate a design in ChatGPT and download the PNG
# 2. Save/move it to ~/Downloads/ShirtyNation-Designs/
# 3. Name it like: funny__introverted-but-willing-to-discuss-tacos__white.png
#    Format: CATEGORY__SLUG-NAME__SHIRT-COLORS.png
#    Colors: white, black, navy, heather (comma-separated for multiple: white,heather)
# 4. This script detects it and auto-pushes through Printify → Supabase → Live on store
#
# USAGE: ./scripts/watch-designs.sh
#
# The script watches ~/Downloads/ShirtyNation-Designs/ for new .png files

WATCH_DIR="$HOME/Downloads/ShirtyNation-Designs"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

mkdir -p "$WATCH_DIR"
mkdir -p "$WATCH_DIR/processed"
mkdir -p "$WATCH_DIR/failed"

echo "🔥 ShirtyNation Design Watcher"
echo "📁 Drop designs into: $WATCH_DIR"
echo "📝 Naming format: CATEGORY__slug-name__colors.png"
echo "   Example: funny__coffee-before-talkie__white,heather.png"
echo ""
echo "Watching..."

fswatch -0 "$WATCH_DIR" | while IFS= read -r -d '' file; do
  # Only process .png files in the root of watch dir (not subdirs)
  if [[ "$file" == "$WATCH_DIR"/*.png ]]; then
    filename=$(basename "$file")
    echo ""
    echo "🆕 New design detected: $filename"

    # Run the upload pipeline
    cd "$PROJECT_DIR"
    node scripts/upload-design.js "$file" 2>&1

    if [ $? -eq 0 ]; then
      echo "✅ Published! Moving to processed/"
      mv "$file" "$WATCH_DIR/processed/$filename"
    else
      echo "❌ Failed! Moving to failed/"
      mv "$file" "$WATCH_DIR/failed/$filename"
    fi
  fi
done
