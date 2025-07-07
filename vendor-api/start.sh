#!/bin/sh
echo "Setting up database..."
npx prisma db push
echo "Starting application..."
node dist/index.js 