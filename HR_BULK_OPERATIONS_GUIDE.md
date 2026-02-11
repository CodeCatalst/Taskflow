# HR Bulk Operations Guide

This document describes the new bulk operations features available to HR and Admin users for attendance marking and leave management.

## Features Overview

### 1. Bulk Attendance Marking
HR and Admin users can now mark attendance for any employee with a searchable interface.

**Location**: Attendance Page > "Mark Attendance" button

**Features**:
- Search employees by name or email
- Select date for attendance
- Choose status: Present, Absent, Half Day, Leave, or Holiday
- Optional check-in/check-out times (only for Present status)
- Add notes for reference

**Access**: HR and Admin roles only

**Workflow**:
1. Click "Mark Attendance" button on Attendance page
2. Search and select employee
3. Choose date and status
4. Optionally add check-in/out times (for Present status)
5. Add notes if needed
6. Submit to create attendance record

**Backend Route**: `POST /hr/attendance/mark`

---

### 2. Multi-Day Leave Marking
HR and Admin users can mark leave for employees across multiple consecutive days with a single action.

**Location**: Leaves Page > "Mark Leave" button

**Features**:
- Select any employee from the workspace
- Choose leave type
- Select date range (start and end date)
- Automatic day calculation
- Pre-approved status (HR-marked leaves are auto-approved)
- Automatic balance deduction

**Access**: HR and Admin roles only

**Workflow**:
1. Click "Mark Leave" button on Leaves page
2. Select employee from dropdown (shows name, email, department)
3. Choose leave type from available options
4. Select start and end dates
5. View calculated total days
6. Enter reason for leave
7. Submit to create leave record

**Backend Route**: `POST /hr/leaves/bulk`

**Important Notes**:
- Leaves marked by HR are automatically approved
- Balance is checked and deducted immediately
- If employee doesn't have balance record, it's created automatically
- Cannot mark leave if insufficient balance available

---

## Implementation Details

### Frontend Components Modified

#### AttendancePage.jsx
- Added state management for mark attendance modal
- Implemented user search functionality
- Created filteredUsers with real-time search
- Added Mark Attendance button for HR/Admin
- Complete modal UI with form validation

**Key Functions**:
- `fetchUsers()`: Loads all users for selection
- `handleMarkAttendance()`: Submits attendance record
- `filteredUsers`: Memoized search results

#### LeavesPage.jsx
- Added bulk leave marking modal
- Implemented employee selection
- Date range picker with validation
- Automatic day calculation
- Auto-approved status for HR-marked leaves

**Key Functions**:
- `fetchUsers()`: Loads all users for selection
- `handleBulkLeaveSubmit()`: Creates leave request
- `calculateDays()`: Computes total days between dates

### Backend Routes Modified

#### backend/routes/attendance.js
**Route**: `POST /hr/attendance/mark`
- Restricted to HR/Admin roles
- Creates attendance record for specified user
- Validates date and status
- Logs change in audit trail

#### backend/routes/leaves.js
**New Route**: `POST /hr/leaves/bulk`
- Restricted to HR/Admin roles
- Validates user and leave type
- Checks/creates leave balance
- Auto-approves leave request
- Updates balance immediately
- Logs action in audit trail

**Request Body**:
```json
{
  "userId": "user_id",
  "leaveTypeId": "leave_type_id",
  "startDate": "2024-01-15",
  "endDate": "2024-01-17",
  "days": 3,
  "reason": "Medical leave",
  "status": "approved"
}
```

---

## Security & Permissions

### Access Control
- Both features require authentication
- Both features require CORE workspace (not available in community workspaces)
- Both features restricted to HR and Admin roles
- Actions are logged in audit trail

### Validation
- **Attendance Marking**:
  - User must exist
  - Date must be valid
  - Status must be from allowed values

- **Leave Marking**:
  - User must exist and be active in workspace
  - Leave type must exist in workspace
  - Sufficient balance must be available
  - Start date must be before or equal to end date

---

## User Interface

### Attendance Marking Modal
- **Header**: "Mark Attendance" with close button
- **Search Field**: Real-time employee search
- **Employee Dropdown**: Multi-select dropdown with search results
- **Date Picker**: Single date selection
- **Status Selector**: Dropdown with 5 options
- **Time Inputs**: Check-in/out (only shown for "Present" status)
- **Notes Field**: Optional textarea
- **Actions**: Cancel and "Mark Attendance" buttons

### Leave Marking Modal
- **Header**: "Mark Leave for Employee" with close button
- **Employee Selector**: Dropdown showing name, email, department
- **Leave Type Selector**: Dropdown of available leave types
- **Date Range**: Start and End date pickers
- **Days Display**: Auto-calculated total days
- **Reason Field**: Required textarea
- **Actions**: Cancel and "Mark Leave" buttons

---

## Benefits

### For HR Team
1. **Efficiency**: Mark attendance/leave for any employee without switching accounts
2. **Bulk Operations**: Handle multiple days of leave in one action
3. **Search**: Quickly find employees in large organizations
4. **Audit Trail**: All actions are logged for compliance

### For Employees
1. **Accuracy**: HR can correct attendance issues immediately
2. **Retroactive Updates**: HR can mark past attendance if needed
3. **Leave Management**: HR can handle special leave cases

### For Organization
1. **Compliance**: Proper audit trail for all HR actions
2. **Flexibility**: Handle exceptions and special cases
3. **Data Integrity**: Proper validation ensures clean data

---

## Future Enhancements

### Potential Features
- [ ] Bulk import from CSV for multiple employees
- [ ] Recurring leave patterns (weekly off, alternate Saturdays)
- [ ] Attendance templates (team outings, training days)
- [ ] Bulk operations history view
- [ ] Export marked records to CSV
- [ ] Mobile-optimized interface for bulk operations

### Integration Opportunities
- [ ] Integration with biometric systems
- [ ] Calendar sync for leave periods
- [ ] Email notifications to employees when HR marks their attendance/leave
- [ ] Approval workflow for bulk operations (two-level approval)

---

## Support & Troubleshooting

### Common Issues

**Issue**: Cannot see "Mark Attendance" or "Mark Leave" buttons
- **Solution**: Verify user has HR or Admin role and is in a CORE workspace

**Issue**: "User not found" error when marking attendance/leave
- **Solution**: Ensure selected user is active in the current workspace

**Issue**: "Insufficient leave balance" error
- **Solution**: Check employee's leave balance or create/adjust balance in Leave Types management

**Issue**: Search not working in modals
- **Solution**: Ensure users list is loaded; check browser console for errors

### Debug Tips
- Check browser console for API errors
- Verify workspace context is properly set
- Ensure backend routes have proper authentication middleware
- Check audit logs for successful operations

---

## Related Documentation
- [Community Workspace Restrictions](./COMMUNITY_WORKSPACE_RESTRICTIONS.md)
- [HR Module Implementation](./HR_MODULE_IMPLEMENTATION.md)
- [Leave Status Fix](./LEAVE_STATUS_FIX.md)
- [Quick Reference](./QUICK_REFERENCE.md)
