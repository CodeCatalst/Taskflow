#!/bin/bash

echo "=========================================="
echo "   Email Configuration Test"
echo "=========================================="
echo ""

# Test local backend
echo "Testing LOCAL backend (http://localhost:5000)..."
curl -s http://localhost:5000/api/test-email-config | json_pp
echo ""
echo ""

# Test production backend
echo "Testing PRODUCTION backend (https://taskflow-nine-phi.vercel.app)..."
curl -s https://taskflow-nine-phi.vercel.app/api/test-email-config | json_pp
echo ""
echo ""

echo "=========================================="
echo "   Comparison"
echo "=========================================="
echo ""
echo "If production shows 'NOT SET' values, you need to:"
echo "1. Go to https://vercel.com/dashboard"
echo "2. Select your Taskflow project"
echo "3. Go to Settings → Environment Variables"
echo "4. Add the missing variables"
echo "5. Redeploy the application"
echo ""
echo "See VERCEL_EMAIL_SETUP.md for detailed instructions"
echo ""
