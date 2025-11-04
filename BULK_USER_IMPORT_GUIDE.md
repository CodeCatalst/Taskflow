# Bulk User Import Feature - User Guide

## Overview
The bulk import feature allows administrators and HR to import multiple users at once using Excel or JSON files. Teams are automatically created if they don't exist.

## Features
- ✅ Import from **Excel (.xlsx, .xls)** or **JSON** files
- ✅ **Auto-create teams** that don't exist
- ✅ Validate all user data before import
- ✅ Detailed import results with success/failure breakdown
- ✅ Automatic credential emails sent to new users
- ✅ Download templates for easy formatting

## How to Use

### Step 1: Access Bulk Import
1. Navigate to **User Management** page
2. Click the **"Bulk Import"** button (green button with upload icon)

### Step 2: Download Template
Choose one of the template formats:
- Click **"Download Excel Template"** for .xlsx format
- Click **"Download JSON Template"** for .json format

### Step 3: Fill in User Data

#### Required Fields:
| Field | Description | Example |
|-------|-------------|---------|
| `full_name` | User's full name | John Doe |
| `email` | Valid email address | john.doe@example.com |
| `password` | Password (min 6 characters) | password123 |
| `role` | User role | member |
| `team` | Team name (auto-created if new) | Development |

#### Valid Roles:
- `admin` - Full system access
- `hr` - Can manage users
- `team_lead` - Can manage team tasks
- `member` - Regular user

### Step 4: Upload File
1. Click **"Select File"** in the bulk import modal
2. Choose your filled Excel or JSON file
3. Click **"Import Users"**

### Step 5: Review Results
After import, you'll see:
- **Total** users processed
- **Successful** imports (green)
- **Failed** imports with reasons (red)
- **Teams Created** (purple) - New teams that were auto-created

## Excel Template Format

```
| full_name   | email                  | password    | role      | team        |
|-------------|------------------------|-------------|-----------|-------------|
| John Doe    | john.doe@example.com   | pass123     | member    | Development |
| Jane Smith  | jane.smith@example.com | pass456     | team_lead | Design      |
| Bob Johnson | bob.johnson@example.com| pass789     | hr        | HR          |
```

## JSON Template Format

```json
[
  {
    "full_name": "John Doe",
    "email": "john.doe@example.com",
    "password": "password123",
    "role": "member",
    "team": "Development"
  },
  {
    "full_name": "Jane Smith",
    "email": "jane.smith@example.com",
    "password": "password456",
    "role": "team_lead",
    "team": "Design"
  }
]
```

## Team Auto-Creation

### How it Works:
1. If a team name is provided that doesn't exist, it will be **automatically created**
2. The new team will have:
   - Name: As specified in the import file
   - Description: "Auto-created during bulk user import"
   - Created by: System
3. The user is automatically added to the team's members list
4. Multiple users can be assigned to the same new team in one import

### Example:
If you import:
```
User 1: team = "Marketing" (doesn't exist)
User 2: team = "Marketing" (doesn't exist)
User 3: team = "Development" (exists)
```

Result:
- ✅ "Marketing" team is created automatically
- ✅ User 1 and User 2 are added to the new Marketing team
- ✅ User 3 is added to the existing Development team

## Validation Rules

### Email Validation:
- ✅ Must be valid format (contains @ and domain)
- ❌ Duplicate emails are rejected
- ❌ Users with existing emails are skipped

### Password Validation:
- ✅ Minimum 6 characters
- ❌ Empty passwords are rejected

### Role Validation:
- ✅ Must be one of: admin, hr, team_lead, member
- ⚠️ Defaults to "member" if not specified
- ❌ Invalid roles are rejected

### Team Validation:
- ✅ Team name can be any string
- ✅ New teams are auto-created
- ⚠️ Optional field - users can have no team

## Common Import Scenarios

### Scenario 1: New Company Setup
```excel
Full Name       | Email              | Password | Role      | Team
--------------- | ------------------ | -------- | --------- | ------------
CEO Name        | ceo@company.com    | pass123  | admin     | 
HR Manager      | hr@company.com     | pass456  | hr        | HR
Dev Lead        | devlead@company.com| pass789  | team_lead | Engineering
Developer 1     | dev1@company.com   | pass101  | member    | Engineering
Developer 2     | dev2@company.com   | pass102  | member    | Engineering
Designer        | design@company.com | pass103  | member    | Design
```

Result:
- ✅ 6 users created
- ✅ 3 teams auto-created (HR, Engineering, Design)
- ✅ All users assigned to appropriate teams
- ✅ Email credentials sent to all

### Scenario 2: Department Expansion
```json
[
  {
    "full_name": "Sales Rep 1",
    "email": "sales1@company.com",
    "password": "temp123",
    "role": "member",
    "team": "Sales - North"
  },
  {
    "full_name": "Sales Rep 2",
    "email": "sales2@company.com",
    "password": "temp456",
    "role": "member",
    "team": "Sales - South"
  }
]
```

Result:
- ✅ 2 users created
- ✅ 2 new teams created (Sales - North, Sales - South)
- ✅ Each user in their respective team

## Error Handling

### Common Errors and Solutions:

| Error | Reason | Solution |
|-------|--------|----------|
| "Missing required fields" | Empty full_name, email, or password | Fill all required columns |
| "Invalid email format" | Email doesn't contain @ or domain | Use valid email format |
| "User already exists" | Email is already registered | Remove duplicate or change email |
| "Invalid role" | Role not in allowed list | Use: admin, hr, team_lead, or member |
| "Password too short" | Less than 6 characters | Use minimum 6 characters |

### Partial Success:
- ✅ Import continues even if some rows fail
- ✅ Successful users are created
- ❌ Failed rows are reported with reasons
- ℹ️ Review failed imports and fix them for re-import

## Best Practices

### 1. Test with Small Batch First
- Import 2-3 users first to verify format
- Check results before importing full list

### 2. Organize by Teams
- Group users by team in your file
- Makes it easier to verify team assignments

### 3. Use Strong Passwords
- Use temporary strong passwords
- Users should change on first login

### 4. Review Before Import
- Check for duplicate emails
- Verify role assignments
- Confirm team names are correct

### 5. Keep Backup
- Save your import file
- Useful for reference or re-import if needed

## API Endpoints

### For Developers:

```
POST /api/users/bulk-import/excel
- Upload Excel file for bulk import
- Content-Type: multipart/form-data
- Body: { file: <excel file> }

POST /api/users/bulk-import/json
- Upload JSON file for bulk import
- Content-Type: multipart/form-data
- Body: { file: <json file> }

GET /api/users/bulk-import/template
- Download Excel template

GET /api/users/bulk-import/template-json
- Download JSON template
```

## Permissions

**Who can use bulk import:**
- ✅ Admin users
- ✅ HR users
- ❌ Team Leads (view only)
- ❌ Members (view only)

## Troubleshooting

### File Upload Issues:
**Problem**: "Invalid file type"
- **Solution**: Use only .xlsx, .xls, or .json files

**Problem**: "File too large"
- **Solution**: File limit is 5MB. Split into smaller batches.

### Import Failures:
**Problem**: All imports failing
- **Solution**: Check template format matches exactly

**Problem**: Teams not being created
- **Solution**: Verify team names have no special characters

**Problem**: Emails not being sent
- **Solution**: Check email configuration in backend .env file

## Example Import Files

### Small Team (5 users)
Download the template and fill in:
```
John Doe       | john@company.com    | secure123 | team_lead | Development
Alice Smith    | alice@company.com   | secure456 | member    | Development
Bob Wilson     | bob@company.com     | secure789 | member    | Development
Carol Davis    | carol@company.com   | secure101 | member    | Design
Dave Miller    | dave@company.com    | secure102 | hr        | HR
```

### Large Department (20+ users)
Use Excel for better organization:
1. Create separate sheets for different teams
2. Copy all into one sheet before import
3. Or import team by team

## Security Notes

- 🔒 All passwords are hashed before storage
- 📧 Credentials are sent via encrypted email
- 🔐 Only authorized users (admin/HR) can bulk import
- ✅ Each import is logged for audit purposes
- ⚠️ Temporary passwords should be changed by users on first login

## Support

For issues or questions:
1. Check this guide first
2. Review error messages in import results
3. Contact your system administrator
4. Check backend logs for detailed errors

---

**Last Updated**: October 31, 2025
**Feature Version**: 1.0.0
