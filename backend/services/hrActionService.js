import User from '../models/User.js';
import LeaveRequest from '../models/LeaveRequest.js';
import LeaveBalance from '../models/LeaveBalance.js';
import Attendance from '../models/Attendance.js';
import { logChange } from '../utils/changeLogService.js';

// HR Action Types
export const HR_ACTIONS = {
  LEAVE_APPROVE: 'LEAVE_APPROVE',
  LEAVE_REJECT: 'LEAVE_REJECT',
  EMPLOYEE_ACTIVATE: 'EMPLOYEE_ACTIVATE',
  EMPLOYEE_DEACTIVATE: 'EMPLOYEE_DEACTIVATE',
  ATTENDANCE_OVERRIDE: 'ATTENDANCE_OVERRIDE'
};

// HR Event Types (emitted after actions)
export const HR_EVENTS = {
  LEAVE_APPROVED: 'LEAVE_APPROVED',
  LEAVE_REJECTED: 'LEAVE_REJECTED',
  EMPLOYEE_ACTIVATED: 'EMPLOYEE_ACTIVATED',
  EMPLOYEE_DEACTIVATED: 'EMPLOYEE_DEACTIVATED',
  ATTENDANCE_OVERRIDDEN: 'ATTENDANCE_OVERRIDDEN'
};

/**
 * Centralized HR Action Service
 * Validates permissions, employee status, applies mutations, logs audits, emits events
 */
class HrActionService {
  /**
   * Validate HR permissions
   */
  static async validateHrPermissions(user) {
    if (!user || !['hr', 'admin', 'community_admin'].includes(user.role)) {
      throw new Error('Unauthorized: HR, Admin, or Community Admin role required');
    }
  }

  /**
   * Validate employee status for actions requiring active status
   */
  static async validateEmployeeStatus(userId, requiredStatus = 'ACTIVE') {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Employee not found');
    }
    if (user.employmentStatus !== requiredStatus) {
      throw new Error(`Employee status must be ${requiredStatus}, current: ${user.employmentStatus}`);
    }
    return user;
  }

  /**
   * Approve leave request
   */
  static async approveLeave(hrUser, leaveId, workspaceId, ipAddress) {
    await this.validateHrPermissions(hrUser);

    const leave = await LeaveRequest.findById(leaveId).populate('userId');
    if (!leave) {
      throw new Error('Leave request not found');
    }

    await this.validateEmployeeStatus(leave.userId._id);

    // Update leave balance: move from pending to used
    const currentYear = new Date().getFullYear();
    const balance = await LeaveBalance.findOne({
      userId: leave.userId._id,
      leaveTypeId: leave.leaveTypeId,
      year: currentYear
    });

    if (balance) {
      balance.pending -= leave.days;
      balance.used += leave.days;
      // available is calculated automatically by the model's pre-save hook
      await balance.save();
    }

    // Apply state mutation
    leave.status = 'approved';
    leave.approvedBy = hrUser._id;
    leave.approvedAt = new Date();
    await leave.save();

    // Audit log
    await logChange({
      userId: hrUser._id,
      workspaceId,
      action: 'approve',
      entity: 'leave_request',
      entityId: leaveId,
      details: `Approved leave request for ${leave.userId.full_name}`,
      ipAddress
    });

    // Emit event
    return {
      event: HR_EVENTS.LEAVE_APPROVED,
      data: {
        leaveId,
        employeeId: leave.userId._id,
        employeeEmail: leave.userId.email,
        employeeName: leave.userId.full_name
      }
    };
  }

  /**
   * Reject leave request
   */
  static async rejectLeave(hrUser, leaveId, reason, workspaceId, ipAddress) {
    await this.validateHrPermissions(hrUser);

    if (!reason || reason.trim() === '') {
      throw new Error('Rejection reason is required');
    }

    const leave = await LeaveRequest.findById(leaveId).populate('userId');
    if (!leave) {
      throw new Error('Leave request not found');
    }

    await this.validateEmployeeStatus(leave.userId._id);

    // Restore leave balance: move from pending back to available
    const currentYear = new Date().getFullYear();
    const balance = await LeaveBalance.findOne({
      userId: leave.userId._id,
      leaveTypeId: leave.leaveTypeId,
      year: currentYear
    });

    if (balance) {
      balance.pending -= leave.days;
      // available is calculated automatically by the model's pre-save hook
      await balance.save();
    }

    // Apply state mutation
    leave.status = 'rejected';
    leave.approvedBy = hrUser._id;  // Track who rejected it
    leave.approvedAt = new Date();   // Track when it was rejected
    leave.rejectionReason = reason;
    await leave.save();

    // Audit log
    await logChange({
      userId: hrUser._id,
      workspaceId,
      action: 'reject',
      entity: 'leave_request',
      entityId: leaveId,
      details: `Rejected leave request for ${leave.userId.full_name}: ${reason}`,
      ipAddress
    });

    // Emit event
    return {
      event: HR_EVENTS.LEAVE_REJECTED,
      data: {
        leaveId,
        employeeId: leave.userId._id,
        employeeEmail: leave.userId.email,
        employeeName: leave.userId.full_name,
        reason
      }
    };
  }

  /**
   * Activate employee
   */
  static async activateEmployee(hrUser, employeeId, workspaceId, ipAddress) {
    await this.validateHrPermissions(hrUser);

    const employee = await User.findById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    // Apply state mutation
    employee.employmentStatus = 'ACTIVE';
    await employee.save();

    // Audit log
    await logChange({
      event_type: 'user_updated',
      user: hrUser,
      user_ip: ipAddress,
      target_type: 'user',
      target_id: employeeId,
      target_name: employee.full_name,
      action: 'Employee Activated',
      description: `Activated employee ${employee.full_name}`,
      metadata: { employmentStatus: 'ACTIVE' },
      workspaceId
    });

    // Emit event
    return {
      event: HR_EVENTS.EMPLOYEE_ACTIVATED,
      data: {
        employeeId,
        employeeEmail: employee.email,
        employeeName: employee.full_name
      }
    };
  }

  /**
   * Deactivate employee
   */
  static async deactivateEmployee(hrUser, employeeId, workspaceId, ipAddress) {
    await this.validateHrPermissions(hrUser);

    const employee = await User.findById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    // Apply state mutation
    employee.employmentStatus = 'INACTIVE';
    await employee.save();

    // Audit log
    await logChange({
      event_type: 'user_updated',
      user: hrUser,
      user_ip: ipAddress,
      target_type: 'user',
      target_id: employeeId,
      target_name: employee.full_name,
      action: 'Employee Deactivated',
      description: `Deactivated employee ${employee.full_name}`,
      metadata: { employmentStatus: 'INACTIVE' },
      workspaceId
    });

    // Emit event
    return {
      event: HR_EVENTS.EMPLOYEE_DEACTIVATED,
      data: {
        employeeId,
        employeeEmail: employee.email,
        employeeName: employee.full_name
      }
    };
  }

  /**
   * Override attendance
   */
  static async overrideAttendance(hrUser, attendanceId, overrideData, workspaceId, ipAddress) {
    await this.validateHrPermissions(hrUser);

    const attendance = await Attendance.findById(attendanceId).populate('userId');
    if (!attendance) {
      throw new Error('Attendance record not found');
    }

    await this.validateEmployeeStatus(attendance.userId._id);

    // Apply state mutation (example: update check_in_time, etc.)
    // Assuming overrideData has fields like checkIn, checkOut, status, etc.
    Object.assign(attendance, overrideData);
    attendance.overrideBy = hrUser._id;
    attendance.isOverride = true;
    await attendance.save();

    // Audit log
    await logChange({
      userId: hrUser._id,
      workspaceId,
      action: 'override',
      entity: 'attendance',
      entityId: attendanceId,
      details: `Overrode attendance for ${attendance.userId.full_name}`,
      ipAddress
    });

    // Emit event
    return {
      event: HR_EVENTS.ATTENDANCE_OVERRIDDEN,
      data: {
        attendanceId,
        employeeId: attendance.userId._id,
        employeeEmail: attendance.userId.email,
        employeeName: attendance.userId.full_name
      }
    };
  }
}

export default HrActionService;