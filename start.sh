#!/bin/bash
echo ""
echo "  SurveyBet - Starting up..."
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "  Installing dependencies..."
  npm install express sql.js bcryptjs jsonwebtoken cors
  echo ""
fi

# Delete old database to start fresh (optional — remove this line to keep data)
# rm -f surveybet.db

echo "  Starting server..."
node server.js
