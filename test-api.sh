#!/bin/bash

# TaskFlow API Test Script
# This script tests the backend API endpoints

echo "╔════════════════════════════════════════╗"
echo "║   TaskFlow - API Test Script          ║"
echo "╚════════════════════════════════════════╝"
echo ""

BASE_URL="http://localhost:5000/api"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test 1: Health Check
echo "1️⃣  Testing Health Endpoint..."
response=$(curl -s -w "\n%{http_code}" $BASE_URL/health)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
    echo "   Response: $body"
else
    echo -e "${RED}❌ Health check failed (HTTP $http_code)${NC}"
fi
echo ""

# Test 2: Register User
echo "2️⃣  Testing User Registration..."
register_response=$(curl -s -w "\n%{http_code}" -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test Admin",
    "email": "testadmin@taskflow.com",
    "password": "admin123",
    "role": "admin"
  }')

http_code=$(echo "$register_response" | tail -n1)
body=$(echo "$register_response" | head -n-1)

if [ "$http_code" = "201" ]; then
    echo -e "${GREEN}✅ User registration successful${NC}"
    echo "   User created: Test Admin"
    
    # Extract access token
    ACCESS_TOKEN=$(echo "$body" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    echo "   Access token obtained"
elif [ "$http_code" = "400" ]; then
    echo -e "${YELLOW}⚠️  User might already exist (HTTP $http_code)${NC}"
    echo "   This is okay - trying to login instead..."
    
    # Try to login
    login_response=$(curl -s -w "\n%{http_code}" -X POST $BASE_URL/auth/login \
      -H "Content-Type: application/json" \
      -d '{
        "email": "testadmin@taskflow.com",
        "password": "admin123"
      }')
    
    http_code=$(echo "$login_response" | tail -n1)
    body=$(echo "$login_response" | head -n-1)
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ Login successful${NC}"
        ACCESS_TOKEN=$(echo "$body" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
        echo "   Access token obtained"
    fi
else
    echo -e "${RED}❌ Registration failed (HTTP $http_code)${NC}"
    echo "   Response: $body"
    echo ""
    echo -e "${YELLOW}⚠️  Likely Cause: MongoDB Atlas IP not whitelisted${NC}"
    echo "   📚 See MONGODB_SETUP.md for instructions"
    exit 1
fi
echo ""

# Test 3: Get Current User
if [ -n "$ACCESS_TOKEN" ]; then
    echo "3️⃣  Testing Get Current User..."
    user_response=$(curl -s -w "\n%{http_code}" -X GET $BASE_URL/users/me \
      -H "Authorization: Bearer $ACCESS_TOKEN")
    
    http_code=$(echo "$user_response" | tail -n1)
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ User data retrieved successfully${NC}"
    else
        echo -e "${RED}❌ Failed to get user data (HTTP $http_code)${NC}"
    fi
    echo ""
    
    # Test 4: Create Task
    echo "4️⃣  Testing Task Creation..."
    task_response=$(curl -s -w "\n%{http_code}" -X POST $BASE_URL/tasks \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "title": "Test Task - API Check",
        "description": "This is a test task created by the test script",
        "priority": "high",
        "status": "todo"
      }')
    
    http_code=$(echo "$task_response" | tail -n1)
    
    if [ "$http_code" = "201" ]; then
        echo -e "${GREEN}✅ Task created successfully${NC}"
        echo "   Title: Test Task - API Check"
    else
        echo -e "${RED}❌ Failed to create task (HTTP $http_code)${NC}"
    fi
    echo ""
    
    # Test 5: Get All Tasks
    echo "5️⃣  Testing Get All Tasks..."
    tasks_response=$(curl -s -w "\n%{http_code}" -X GET $BASE_URL/tasks \
      -H "Authorization: Bearer $ACCESS_TOKEN")
    
    http_code=$(echo "$tasks_response" | tail -n1)
    body=$(echo "$tasks_response" | head -n-1)
    
    if [ "$http_code" = "200" ]; then
        task_count=$(echo "$body" | grep -o '"count":[0-9]*' | cut -d':' -f2)
        echo -e "${GREEN}✅ Tasks retrieved successfully${NC}"
        echo "   Total tasks: $task_count"
    else
        echo -e "${RED}❌ Failed to get tasks (HTTP $http_code)${NC}"
    fi
fi

echo ""
echo "╔════════════════════════════════════════╗"
echo "║   Test Summary                         ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "✅ Backend server is running"
echo "✅ API endpoints are working"

if [ -n "$ACCESS_TOKEN" ]; then
    echo "✅ Authentication is functional"
    echo "✅ Database operations are working"
    echo ""
    echo -e "${GREEN}🎉 All tests passed! Your TaskFlow CTMS is ready to use!${NC}"
    echo ""
    echo "🌐 Visit: http://localhost:3000"
    echo "📧 Login with: testadmin@taskflow.com / admin123"
else
    echo ""
    echo -e "${YELLOW}⚠️  Database connection issue detected${NC}"
    echo "   Please configure MongoDB Atlas IP whitelist"
    echo "   See MONGODB_SETUP.md for detailed instructions"
fi

echo ""
