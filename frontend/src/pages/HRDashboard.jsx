import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSidebar } from '../context/SidebarContext';
import { useConfirmModal } from '../hooks/useConfirmModal';
import api from '../api/axios';
import ResponsivePageLayout from '../components/layouts/ResponsivePageLayout';
import ConfirmModal from '../components/modals/ConfirmModal';
import HRCalendar from './HRCalendar';
import {
  Calendar, Clock, CheckCircle, XCircle, AlertCircle, User,
  Menu, ChevronLeft, ChevronRight, Briefcase, CalendarDays,
  Users, Plus, Edit2, Save, X, UserCheck, UserX, TrendingUp,
  Filter, Download, Upload, Mail, FileText, Send, Users as UsersIcon,
  CheckSquare, Eye, Code, Palette, UserPlus, MessageSquare, Bell, UserMinus,
  ExternalLink, Settings as SettingsIcon, Layout, ChevronDown
} from 'lucide-react';

export default function HRDashboard() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { theme, colorScheme, currentTheme, currentColorScheme } = useTheme();
  const { toggleMobileSidebar } = useSidebar();
  const confirmModal = useConfirmModal();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Users data
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  
  // Attendance data
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [attendanceSummary, setSummary] = useState(null);
  const [monthlyAttendance, setMonthlyAttendance] = useState([]);
  
  // Leave data
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  
  // Calendar data
  const [holidays, setHolidays] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  
  // Modal states
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [selectedUserForAttendance, setSelectedUserForAttendance] = useState(null);
  
  // Mass attendance
  const [massAttendanceStatus, setMassAttendanceStatus] = useState('present');

  // Email management
  const [emailConfig, setEmailConfig] = useState(null);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [emailRecipients, setEmailRecipients] = useState([]);
    const [recipientMode, setRecipientMode] = useState('INTERNAL'); // 'INTERNAL' or 'EXTERNAL'
    const [manualRecipient, setManualRecipient] = useState({ name: '', email: '' });
    const [emailCampaignStep, setEmailCampaignStep] = useState(1);
    const [emailData, setEmailData] = useState({
    subject: '',
    htmlContent: '',
    variables: {}
  });
  const [showHtmlEditor, setShowHtmlEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [bulkEmailData, setBulkEmailData] = useState({
    recipients: 'all',
    subject: '',
    content: ''
  });

  // User attendance tracking
  const [selectedUser, setSelectedUser] = useState(null);
  const [userAttendanceHistory, setUserAttendanceHistory] = useState([]);
  const [userAttendanceStats, setUserAttendanceStats] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isUserListCollapsed, setIsUserListCollapsed] = useState(false);

  // Employee management
  const [showEmployeeActionModal, setShowEmployeeActionModal] = useState(false);
  const [employeeAction, setEmployeeAction] = useState(null); // 'activate' or 'deactivate'
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'hr');

  useEffect(() => {
    fetchAllData();
  }, [currentDate]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUsers(),
        fetchTodayAttendance(),
        fetchAttendanceSummary(),
        fetchMonthlyAttendance(),
        fetchLeaveRequests(),
        fetchLeaveTypes(),
        fetchCalendarData(),
        fetchEmailConfig(),
        fetchEmailTemplates()
      ]);
    } catch (error) {
      console.error('Error fetching HR data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const today = new Date();
      const response = await api.get('/hr/attendance', {
        params: { 
          month: today.getMonth() + 1, 
          year: today.getFullYear() 
        }
      });
      
      const todayRecords = response.data.records.filter(r => 
        new Date(r.date).toDateString() === today.toDateString()
      );
      setTodayAttendance(todayRecords);
    } catch (error) {
      console.error('Error fetching today attendance:', error);
    }
  };

  const fetchAttendanceSummary = async () => {
    try {
      const response = await api.get('/hr/attendance/summary', {
        params: { 
          month: currentDate.getMonth() + 1, 
          year: currentDate.getFullYear() 
        }
      });
      setSummary(response.data.summary);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const fetchMonthlyAttendance = async () => {
    try {
      const response = await api.get('/hr/attendance', {
        params: { 
          month: currentDate.getMonth() + 1, 
          year: currentDate.getFullYear() 
        }
      });
      setMonthlyAttendance(response.data.records);
    } catch (error) {
      console.error('Error fetching monthly attendance:', error);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const response = await api.get('/hr/leaves');
      setLeaveRequests(response.data.requests || []);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    }
  };

  const fetchLeaveTypes = async () => {
    try {
      const response = await api.get('/hr/leave-types');
      setLeaveTypes(response.data.leaveTypes || []);
    } catch (error) {
      console.error('Error fetching leave types:', error);
    }
  };

  const fetchCalendarData = async () => {
    try {
      const response = await api.get('/hr/calendar', {
        params: { 
          month: currentDate.getMonth() + 1, 
          year: currentDate.getFullYear() 
        }
      });
      setCalendarEvents(response.data.events || []);
      setHolidays(response.data.events?.filter(e => e.type === 'holiday') || []);
    } catch (error) {
      console.error('Error fetching calendar:', error);
    }
  };

  // Get user attendance status for today
  const getUserAttendanceStatus = (userId) => {
    const record = todayAttendance.find(a => a.userId?._id === userId || a.userId === userId);
    if (!record) return { status: 'not-marked', icon: AlertCircle, color: 'text-gray-400' };
    
    if (record.status === 'present') return { status: 'Present', icon: CheckCircle, color: 'text-green-600 dark:text-green-400', record };
    if (record.status === 'absent') return { status: 'Absent', icon: XCircle, color: 'text-red-600 dark:text-red-400', record };
    if (record.status === 'half_day') return { status: 'Half Day', icon: AlertCircle, color: 'text-yellow-600 dark:text-yellow-400', record };
    if (record.status === 'leave') return { status: 'Leave', icon: Calendar, color: 'text-blue-600 dark:text-blue-400', record };
    
    return { status: 'Not Marked', icon: AlertCircle, color: 'text-gray-400' };
  };

  // Mark attendance for a single user
  const markUserAttendance = async (userId, status) => {
    try {
      await api.post('/hr/attendance/mark', {
        userId,
        date: new Date().toISOString().split('T')[0],
        status
      });
      
      fetchTodayAttendance();
      fetchAttendanceSummary();
      alert('Attendance marked successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to mark attendance');
    }
  };

  // Mark mass attendance
  const markMassAttendance = async () => {
    if (selectedUsers.length === 0) {
      alert('Please select at least one user');
      return;
    }

    try {
      const promises = selectedUsers.map(userId =>
        api.post('/hr/attendance/mark', {
          userId,
          date: new Date().toISOString().split('T')[0],
          status: massAttendanceStatus
        })
      );
      
      await Promise.all(promises);
      
      setSelectedUsers([]);
      fetchTodayAttendance();
      fetchAttendanceSummary();
      alert(`Mass attendance marked as ${massAttendanceStatus} for ${selectedUsers.length} users!`);
    } catch (error) {
      alert('Failed to mark mass attendance');
    }
  };

  // Toggle user selection for mass attendance
  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Select all users
  const selectAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u._id));
    }
  };

  // Handle leave approval/rejection
  const handleLeaveAction = async (leaveId, status, reason = '') => {
    try {
      await api.patch(`/hr/leaves/${leaveId}/status`, {
        status,
        rejectionReason: reason
      });
      await fetchLeaveRequests();
      alert(`Leave ${status} successfully!`);
    } catch (error) {
      alert(error.response?.data?.message || `Failed to ${status} leave`);
    }
  };

  // Export HR Report
  const exportHRReport = () => {
    try {
      // Create CSV content
      let csvContent = 'HR Report - ' + new Date().toLocaleDateString() + '\n\n';

      // Attendance Summary
      csvContent += 'ATTENDANCE SUMMARY\n';
      csvContent += 'Month,Present,Absent,Half Day,Leave,Holidays\n';
      if (attendanceSummary) {
        csvContent += `${currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })},${attendanceSummary.present || 0},${attendanceSummary.absent || 0},${attendanceSummary.half_day || 0},${attendanceSummary.leave || 0},${attendanceSummary.holidays || 0}\n`;
      }
      csvContent += '\n';

      // Leave Requests
      csvContent += 'LEAVE REQUESTS\n';
      csvContent += 'Employee,Type,Start Date,End Date,Days,Status\n';
      leaveRequests.forEach(request => {
        csvContent += `${request.userId?.full_name || 'Unknown'},${request.leaveTypeId?.name || 'Unknown'},${request.startDate},${request.endDate},${request.days},${request.status}\n`;
      });
      csvContent += '\n';

      // Today's Attendance
      csvContent += 'TODAY\'S ATTENDANCE\n';
      csvContent += 'Employee,Status,Check In,Check Out\n';
      todayAttendance.forEach(record => {
        csvContent += `${record.userId?.full_name || 'Unknown'},${record.status},${record.checkIn || ''},${record.checkOut || ''}\n`;
      });

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `hr-report-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert('HR Report exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export report');
    }
  };

  // Fetch email configuration
  const fetchEmailConfig = async () => {
    try {
      const response = await api.get('/hr/email-templates/config');
      setEmailConfig(response.data.config);
    } catch (error) {
      console.error('Error fetching email config:', error);
    }
  };

  // Fetch email templates
  const fetchEmailTemplates = async () => {
    try {
      console.log('Fetching email templates...');
      const response = await api.get('/hr/email-templates');
      console.log('Templates response:', response.data);
      setEmailTemplates(response.data.templates || []);
      console.log('Templates set:', response.data.templates || []);
    } catch (error) {
      console.error('Error fetching email templates:', error);
    }
  };

  // Send test email
  const sendTestEmail = async () => {
    if (!testEmailRecipient) {
      await confirmModal.show({
        title: 'Missing Information',
        message: 'Please enter a recipient email address.',
        variant: 'warning'
      });
      return;
    }

    try {
      const response = await api.post('/hr/email-templates/test', {
        to: testEmailRecipient,
        subject: 'Test Email from TaskFlow',
        htmlContent: '<h1>Test Email</h1><p>This is a test email sent from TaskFlow HR Dashboard.</p>'
      });

      await confirmModal.show({
        title: 'Success',
        message: 'Test email sent successfully!',
        variant: 'info'
      });
      setTestEmailRecipient('');
    } catch (error) {
      await confirmModal.show({
        title: 'Email Send Failed',
        message: error.response?.data?.message || 'Failed to send test email',
        variant: 'danger'
      });
    }
  };

  // Send bulk email
  const sendBulkEmail = async () => {
    if (!bulkEmailData.subject || !bulkEmailData.content) {
      await confirmModal.show({
        title: 'Missing Information',
        message: 'Please enter both subject and content for the email.',
        variant: 'warning'
      });
      return;
    }

    try {
      const response = await api.post('/hr/email-templates/send', {
        recipients: bulkEmailData.recipients,
        subject: bulkEmailData.subject,
        htmlContent: bulkEmailData.content
      });

      await confirmModal.show({
        title: 'Success',
        message: response.data.message,
        variant: 'info'
      });
      setBulkEmailData({ recipients: 'all', subject: '', content: '' });
    } catch (error) {
      await confirmModal.show({
        title: 'Email Send Failed',
        message: error.response?.data?.message || 'Failed to send emails',
        variant: 'danger'
      });
    }
  };

    // Handle template selection
    const handleTemplateSelect = (template) => {
      setSelectedTemplate(template);
      
      // Default recipient mode based on category
      if (template.category === 'hiring' || template.category === 'interview') {
        setRecipientMode('EXTERNAL');
      } else {
        setRecipientMode('INTERNAL');
      }
      
      setEmailCampaignStep(2); // Move to next step

      // Auto-populate system variables
    const systemVariables = {};
    if (template.variables) {
      template.variables.forEach(variable => {
        switch (variable.name) {
          case 'workspaceName':
            systemVariables[variable.name] = 'TaskFlow'; // You can get this from context
            break;
          case 'appUrl':
            systemVariables[variable.name] = window.location.origin;
            break;
          case 'currentDate':
            systemVariables[variable.name] = new Date().toLocaleDateString();
            break;
          default:
            systemVariables[variable.name] = variable.example || '';
        }
      });
    }

    setEmailData({
      subject: template.subject,
      htmlContent: template.htmlContent,
      variables: systemVariables
    });
  };

    // Handle user selection for email
    const handleEmailUserSelect = (userId) => {
      if (recipientMode === 'EXTERNAL') return; // Should not happen in UI
      
      setEmailRecipients(prev =>
        prev.includes(userId)
          ? prev.filter(id => id !== userId)
          : [...prev, userId]
      );
    };

    const addExternalRecipient = () => {
      if (manualRecipient.name && manualRecipient.email) {
        const newRecipient = {
          ...manualRecipient,
          id: `ext-${Date.now()}`,
          source: 'EXTERNAL'
        };
        setEmailRecipients(prev => [...prev, newRecipient]);
        setManualRecipient({ name: '', email: '' });
      }
    };

    const removeExternalRecipient = (id) => {
      setEmailRecipients(prev => prev.filter(r => r.id !== id));
    };

  // Send email using template
  const sendTemplateEmail = async () => {
    if (!selectedTemplate) {
      await confirmModal.show({
        title: 'Template Required',
        message: 'Please select an email template to continue.',
        variant: 'warning'
      });
      return;
    }

    if (emailRecipients.length === 0) {
      await confirmModal.show({
        title: 'Recipients Required',
        message: 'Please select at least one recipient for the email.',
        variant: 'warning'
      });
      return;
    }

    if (!emailData.subject.trim()) {
      await confirmModal.show({
        title: 'Subject Required',
        message: 'Please enter a subject for the email.',
        variant: 'warning'
      });
      return;
    }

    try {
      let successCount = 0;
      let errorCount = 0;

      // Send personalized email to each recipient
      for (const recipientData of emailRecipients) {
        let recipientObj;
        
        if (recipientMode === 'INTERNAL') {
          const user = users.find(u => u._id === recipientData);
          if (!user?.email) {
            console.warn(`Skipping user ${recipientData}: no email address`);
            errorCount++;
            continue;
          }
          recipientObj = { email: user.email, name: user.full_name };
        } else {
          recipientObj = { email: recipientData.email, name: recipientData.name };
        }

        // Create personalized content for this user
        let personalizedContent = emailData.htmlContent;
        let personalizedSubject = emailData.subject;

        // Replace user-specific variables
        Object.entries(emailData.variables).forEach(([key, value]) => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          personalizedContent = personalizedContent.replace(regex, value);
          personalizedSubject = personalizedSubject.replace(regex, value);
        });

        // Replace recipient-specific variables
        personalizedContent = personalizedContent.replace(/{{fullName}}/g, recipientObj.name);
        personalizedContent = personalizedContent.replace(/{{email}}/g, recipientObj.email);
        personalizedSubject = personalizedSubject.replace(/{{fullName}}/g, recipientObj.name);
        personalizedSubject = personalizedSubject.replace(/{{email}}/g, recipientObj.email);

        try {
          const response = await api.post('/hr/email-templates/send', {
            recipients: [recipientObj], // Send to one recipient at a time
            subject: personalizedSubject,
            htmlContent: personalizedContent,
            templateId: selectedTemplate._id
          });

          successCount++;
          console.log(`Email sent to ${recipientObj.email}`);
        } catch (emailError) {
          console.error(`Failed to send email to ${recipientObj.email}:`, emailError);
          errorCount++;
        }
      }

      // Show results
      if (successCount > 0) {
        await confirmModal.show({
          title: 'Emails Sent Successfully',
          message: `Email campaign completed! ${successCount} emails sent successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}.`,
          variant: 'info'
        });
      } else {
        await confirmModal.show({
          title: 'Email Send Failed',
          message: 'Failed to send any emails. Please check the console for details.',
          variant: 'danger'
        });
      }

      // Reset form on success
      if (successCount > 0) {
        setEmailRecipients([]);
        setSelectedTemplate(null);
        setEmailData({ subject: '', htmlContent: '', variables: {} });
      }
    } catch (error) {
      await confirmModal.show({
        title: 'Email Send Failed',
        message: error.response?.data?.message || 'Failed to send emails',
        variant: 'danger'
      });
    }
  };

  // Render template variables
  const renderTemplateVariables = () => {
    if (!selectedTemplate?.variables?.length) return null;

    const autoPopulatedVars = ['workspaceName', 'appUrl', 'currentDate'];

    return (
      <div className="mb-4">
        <h4 className={`text-sm font-medium ${currentTheme.text} mb-2`}>Template Variables</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {selectedTemplate.variables.map((variable, index) => {
            const isAutoPopulated = autoPopulatedVars.includes(variable.name);
            const isRecipientVar = ['fullName', 'email'].includes(variable.name);

            return (
              <div key={index}>
                <label className={`block text-xs font-medium ${currentTheme.textSecondary} mb-1`}>
                  {variable.name}
                  {variable.description && (
                    <span className="text-xs text-gray-500 ml-1">({variable.description})</span>
                  )}
                  {isAutoPopulated && (
                    <span className="inline-block ml-2 px-1.5 py-0.5 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                      Auto-filled
                    </span>
                  )}
                  {isRecipientVar && (
                    <span className="inline-block ml-2 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                      Per Recipient
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  placeholder={variable.example || `Enter ${variable.name}`}
                  value={emailData.variables[variable.name] || ''}
                  onChange={(e) => setEmailData(prev => ({
                    ...prev,
                    variables: {
                      ...prev.variables,
                      [variable.name]: e.target.value
                    }
                  }))}
                  disabled={isAutoPopulated}
                  className={`w-full px-3 py-2 text-sm ${currentTheme.surfaceSecondary} rounded border ${currentTheme.border} ${currentTheme.text} focus:ring-2 ${currentTheme.focus} ${
                    isAutoPopulated ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-75' : ''
                  }`}
                />
                {isRecipientVar && (
                  <p className="text-xs text-gray-500 mt-1">
                    Will be personalized for each recipient
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

    // Generate preview HTML with variables replaced
    const generatePreviewHtml = () => {
      let previewHtml = emailData.htmlContent;
      let previewSubject = emailData.subject;

      // Replace system variables
      Object.entries(emailData.variables).forEach(([key, value]) => {
        if (value) {
          const regex = new RegExp(`{{${key}}}`, 'g');
          previewHtml = previewHtml.replace(regex, value);
          previewSubject = previewSubject.replace(regex, value);
        }
      });

      // Use first selected recipient for personalization preview
      if (emailRecipients.length > 0) {
        let firstRecipient;
        if (recipientMode === 'INTERNAL') {
          firstRecipient = users.find(u => u._id === emailRecipients[0]);
        } else {
          firstRecipient = emailRecipients[0];
        }

        if (firstRecipient) {
          const name = recipientMode === 'INTERNAL' ? firstRecipient.full_name : firstRecipient.name;
          const email = recipientMode === 'INTERNAL' ? firstRecipient.email : firstRecipient.email;
          previewHtml = previewHtml.replace(/{{fullName}}/g, name);
          previewHtml = previewHtml.replace(/{{email}}/g, email);
          previewSubject = previewSubject.replace(/{{fullName}}/g, name);
          previewSubject = previewSubject.replace(/{{email}}/g, email);
        }
      }

      return { html: previewHtml, subject: previewSubject };
    };

  // Email Preview Modal Component
  const EmailPreviewModal = () => {
    if (!showPreview) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className={`${currentTheme.surface} rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden`}>
          <div className={`px-6 py-4 border-b ${currentTheme.border} flex items-center justify-between`}>
            <h3 className={`text-lg font-semibold ${currentTheme.text} flex items-center gap-2`}>
              <Eye className="w-5 h-5" />
              Email Preview
            </h3>
            <button
              onClick={() => setShowPreview(false)}
              className={`p-2 ${currentTheme.surfaceSecondary} rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subject
              </label>
              <div className={`px-3 py-2 ${currentTheme.surfaceSecondary} rounded border ${currentTheme.border} ${currentTheme.text}`}>
                {generatePreviewHtml().subject || 'No subject set'}
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Content Preview</span>
              </div>
              <div className="max-h-96 overflow-y-auto p-4">
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: generatePreviewHtml().html }}
                />
              </div>
            </div>
          </div>

          <div className={`px-6 py-4 border-t ${currentTheme.border} flex justify-end gap-3`}>
            <button
              onClick={() => setShowPreview(false)}
              className={`px-4 py-2 ${currentTheme.surfaceSecondary} ${currentTheme.text} rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700`}
            >
              Close Preview
            </button>
            <button
              onClick={() => {
                setShowPreview(false);
                sendTemplateEmail();
              }}
              className={`px-6 py-2 ${currentColorScheme.primary} text-white ${currentColorScheme.primaryHover} rounded-lg flex items-center gap-2`}
            >
              <Send className="w-4 h-4" />
              Send Email
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Fetch user attendance history
  const fetchUserAttendanceHistory = async (userId) => {
    if (!userId) return;

    try {
      const response = await api.get('/hr/attendance', {
        params: {
          userId,
          month: selectedMonth,
          year: selectedYear
        }
      });

      setUserAttendanceHistory(response.data.records || []);

      // Calculate statistics
      const records = response.data.records || [];
      const stats = {
        totalDays: records.length,
        present: records.filter(r => r.status === 'present').length,
        absent: records.filter(r => r.status === 'absent').length,
        halfDay: records.filter(r => r.status === 'half_day').length,
        leave: records.filter(r => r.status === 'leave').length,
        attendanceRate: 0
      };

      const workedDays = stats.present + stats.halfDay + stats.leave;
      stats.attendanceRate = stats.totalDays > 0 ? Math.round((workedDays / stats.totalDays) * 100) : 0;

      setUserAttendanceStats(stats);
    } catch (error) {
      console.error('Error fetching user attendance:', error);
      setUserAttendanceHistory([]);
      setUserAttendanceStats(null);
    }
  };

  // Handle user selection
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    fetchUserAttendanceHistory(user._id);
  };

  const getStatusColor = (status) => {
    const colors = {
      present: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      absent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      half_day: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      leave: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      holiday: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      INACTIVE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      ON_NOTICE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      EXITED: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const handleEmployeeAction = (employee, action) => {
    setSelectedEmployee(employee);
    setEmployeeAction(action);
    setShowEmployeeActionModal(true);
  };

  const confirmEmployeeAction = async () => {
    try {
      const endpoint = employeeAction === 'activate' ? 'activate' : 'deactivate';
      await api.patch(`/users/${selectedEmployee._id}/${endpoint}`);

      setShowEmployeeActionModal(false);
      setSelectedEmployee(null);
      setEmployeeAction(null);
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Employee action error:', error);
      alert(error.response?.data?.message || `Failed to ${employeeAction} employee`);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${currentTheme.background} flex items-center justify-center`}>
        <div className="text-center">
          <Clock className="w-16 h-16 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
          <p className={currentTheme.textSecondary}>Loading HR Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <ResponsivePageLayout
      title="HR Dashboard"
      subtitle={new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}
      actions={
        <button
          onClick={exportHRReport}
          className={`px-4 py-2 ${currentColorScheme.primary} text-white rounded-lg ${currentColorScheme.primaryHover} flex items-center gap-2`}
        >
          <Download className="w-5 h-5" />
          Export Report
        </button>
      }
    >
      {/* Tabs */}
      <div className="flex gap-4 mb-6 overflow-x-auto">
        {['overview', 'attendance', 'calendar', 'users', 'email'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === tab
                ? `${currentColorScheme.primary} text-white`
                : `${currentTheme.textSecondary} ${currentTheme.hover}`
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              {attendanceSummary && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className={`${currentTheme.surface} rounded-lg p-6 border ${currentTheme.border}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm ${currentTheme.textSecondary}`}>Total Users</p>
                        <p className={`text-3xl font-bold ${currentTheme.text}`}>{users.length}</p>
                      </div>
                      <Users className={`w-10 h-10 ${currentColorScheme.primaryText}`} />
                    </div>
                  </div>

                  <div className={`${currentTheme.surface} rounded-lg p-6 border ${currentTheme.border}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm ${currentTheme.textSecondary}`}>Present Today</p>
                        <p className="text-3xl font-bold text-green-600 dark:text-green-400">{attendanceSummary.present || 0}</p>
                      </div>
                      <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>
                  </div>

                  <div className={`${currentTheme.surface} rounded-lg p-6 border ${currentTheme.border}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm ${currentTheme.textSecondary}`}>Absent Today</p>
                        <p className="text-3xl font-bold text-red-600 dark:text-red-400">{attendanceSummary.absent || 0}</p>
                      </div>
                      <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                    </div>
                  </div>

                  <div className={`${currentTheme.surface} rounded-lg p-6 border ${currentTheme.border}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm ${currentTheme.textSecondary}`}>On Leave</p>
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{attendanceSummary.leave || 0}</p>
                      </div>
                      <Calendar className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>

                </div>
              )}

              {/* Bulk Operations Info Banner */}
              <div className={`${currentTheme.surface} rounded-lg p-6 border-l-4 border-blue-500 ${currentTheme.border} bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-900/10`}>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <UserPlus className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-lg font-bold ${currentTheme.text} mb-2`}>
                      New Bulk Operations Available
                    </h3>
                    <p className={`${currentTheme.textSecondary} mb-4 text-sm`}>
                      Save time with powerful bulk actions for HR management:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className={`flex items-center gap-3 p-3 ${currentTheme.surfaceSecondary} rounded-lg`}>
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded">
                          <UserCheck className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className={`font-medium ${currentTheme.text} text-sm`}>Bulk Attendance Marking</p>
                          <p className={`${currentTheme.textSecondary} text-xs`}>
                            Mark attendance for any employee with searchable interface
                          </p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-3 p-3 ${currentTheme.surfaceSecondary} rounded-lg`}>
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                          <Briefcase className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className={`font-medium ${currentTheme.text} text-sm`}>Multi-Day Leave Marking</p>
                          <p className={`${currentTheme.textSecondary} text-xs`}>
                            Mark leave for employees across multiple consecutive days
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => navigate('/hr/attendance')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <UserCheck className="w-4 h-4" />
                        Go to Attendance
                      </button>
                      <button
                        onClick={() => navigate('/hr/leaves')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <Briefcase className="w-4 h-4" />
                        Go to Leaves
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className={`${currentTheme.surface} rounded-lg p-6 border ${currentTheme.border}`}>
                <h2 className={`text-xl font-bold ${currentTheme.text} mb-4`}>Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                  <button
                    onClick={() => navigate('/hr/attendance')}
                    className={`p-4 ${currentTheme.surfaceSecondary} rounded-lg ${currentTheme.hover} transition-colors border ${currentTheme.border}`}
                  >
                    <UserCheck className={`w-8 h-8 ${currentColorScheme.success.replace('bg-', 'text-').replace('-500', '-600')} mb-2`} />
                    <p className={`font-medium ${currentTheme.text} text-sm`}>Mark Attendance</p>
                    <p className={`text-xs ${currentTheme.textSecondary}`}>Single employee</p>
                  </button>

                  <button
                    onClick={() => navigate('/hr/attendance')}
                    className={`p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors border ${currentTheme.border}`}
                  >
                    <Users className="w-8 h-8 text-green-600 mb-2" />
                    <p className={`font-medium ${currentTheme.text} text-sm`}>Bulk Attendance</p>
                    <p className={`text-xs ${currentTheme.textSecondary}`}>Mark for any user</p>
                  </button>

                  <button
                    onClick={() => navigate('/hr/leaves')}
                    className={`p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors border ${currentTheme.border}`}
                  >
                    <Briefcase className="w-8 h-8 text-blue-600 mb-2" />
                    <p className={`font-medium ${currentTheme.text} text-sm`}>Mark Leave</p>
                    <p className={`text-xs ${currentTheme.textSecondary}`}>Multi-day leaves</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('calendar')}
                    className={`p-4 ${currentTheme.surfaceSecondary} rounded-lg ${currentTheme.hover} transition-colors border ${currentTheme.border}`}
                  >
                    <CalendarDays className="w-8 h-8 text-purple-600 mb-2" />
                    <p className={`font-medium ${currentTheme.text} text-sm`}>View Calendar</p>
                    <p className={`text-xs ${currentTheme.textSecondary}`}>{holidays.length} holidays</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('email')}
                    className={`p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors border ${currentTheme.border}`}
                  >
                    <Mail className="w-8 h-8 text-indigo-600 mb-2" />
                    <p className={`font-medium ${currentTheme.text} text-sm`}>Send Email</p>
                    <p className={`text-xs ${currentTheme.textSecondary}`}>Email campaigns</p>
                  </button>

                  <button className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors border ${currentTheme.border}">
                    <TrendingUp className="w-8 h-8 text-orange-600 mb-2" />
                    <p className={`font-medium ${currentTheme.text} text-sm`}>Reports</p>
                    <p className={`text-xs ${currentTheme.textSecondary}`}>Export data</p>
                  </button>
                </div>
              </div>

              {/* User Directory */}
              <div className={`${currentTheme.surface} rounded-lg p-6 border ${currentTheme.border}`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-xl font-bold ${currentTheme.text}`}>User Directory</h2>
                  <button
                    onClick={() => setActiveTab('attendance')}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                  >
                    View Attendance
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {users.slice(0, 9).map((userItem) => {
                    const attendanceStatus = getUserAttendanceStatus(userItem._id);
                    return (
                      <div key={userItem._id} className={`${currentTheme.surfaceSecondary} rounded-lg p-4 border ${currentTheme.border}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                              {userItem.full_name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className={`font-semibold ${currentTheme.text} text-sm`}>{userItem.full_name}</h3>
                              <p className={`text-xs ${currentTheme.textSecondary}`}>{userItem.email}</p>
                            </div>
                          </div>
                          <attendanceStatus.icon className={`w-5 h-5 ${attendanceStatus.color}`} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(attendanceStatus.record?.status || 'not-marked')}`}>
                            {attendanceStatus.status}
                          </span>
                          <button
                            onClick={() => window.open(`mailto:${userItem.email}`, '_blank')}
                            className={`p-1.5 ${currentColorScheme.primaryText} hover:opacity-80 ${currentTheme.hover} rounded`}
                            title="Send Email"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {users.length > 9 && (
                  <div className="text-center mt-4">
                    <button
                      onClick={() => setActiveTab('attendance')}
                      className={`text-sm ${currentTheme.textSecondary} hover:${currentTheme.text} underline`}
                    >
                      View all {users.length} users
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              {/* Mass Attendance Controls */}
              <div className={`${currentTheme.surface} rounded-lg p-6 border ${currentTheme.border}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className={`text-xl font-bold ${currentTheme.text}`}>Mass Attendance</h2>
                    <p className={`text-sm ${currentTheme.textSecondary}`}>
                      {selectedUsers.length} user(s) selected
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={selectAllUsers}
                      className={`px-4 py-2 ${currentTheme.surfaceSecondary} ${currentTheme.text} rounded-lg ${currentTheme.hover}`}
                    >
                      {selectedUsers.length === users.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <select
                      value={massAttendanceStatus}
                      onChange={(e) => setMassAttendanceStatus(e.target.value)}
                      className={`px-4 py-2 border ${currentTheme.border} rounded-lg ${currentTheme.surface} ${currentTheme.text}`}
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="half_day">Half Day</option>
                      <option value="leave">Leave</option>
                    </select>
                    <button
                      onClick={markMassAttendance}
                      disabled={selectedUsers.length === 0}
                      className={`px-6 py-2 ${currentColorScheme.primary} text-white rounded-lg ${currentColorScheme.primaryHover} disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                    >
                      <CheckCircle className="w-5 h-5" />
                      Mark Selected
                    </button>
                  </div>
                </div>
              </div>

              {/* User Attendance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {users.map((userItem) => {
                  const attendanceStatus = getUserAttendanceStatus(userItem._id);
                  const isSelected = selectedUsers.includes(userItem._id);
                  const StatusIcon = attendanceStatus.icon;

                  return (
                    <div
                      key={userItem._id}
                      className={`${currentTheme.surface} rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-blue-500 shadow-lg'
                          : `${currentTheme.border} hover:border-blue-300 dark:hover:border-blue-700`
                      }`}
                    >
                      <div className="p-4">
                        {/* User Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleUserSelection(userItem._id)}
                              className={`w-5 h-5 ${currentColorScheme.primaryText} rounded focus:ring-2 ${currentTheme.focus}`}
                            />
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                              {userItem.full_name?.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <StatusIcon className={`w-6 h-6 ${attendanceStatus.color}`} />
                        </div>

                        {/* User Info */}
                        <div className="mb-4">
                          <h3 className={`font-semibold ${currentTheme.text} text-lg mb-1`}>
                            {userItem.full_name}
                          </h3>
                          <p className={`text-sm ${currentTheme.textSecondary} mb-1`}>
                            {userItem.email}
                          </p>
                          <p className={`text-xs ${currentTheme.textMuted}`}>
                            {userItem.role?.toUpperCase()}
                          </p>
                        </div>

                        {/* Attendance Status */}
                        <div className={`mb-4 p-3 rounded-lg text-center font-medium ${getStatusColor(attendanceStatus.record?.status || 'not-marked')}`}>
                          {attendanceStatus.status}
                        </div>

                        {/* Time Info */}
                        {attendanceStatus.record && (
                          <div className="mb-4 text-sm space-y-1">
                            {attendanceStatus.record.checkIn && (
                              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                <span>Check In:</span>
                                <span className="font-medium">
                                  {new Date(attendanceStatus.record.checkIn).toLocaleTimeString()}
                                </span>
                              </div>
                            )}
                            {attendanceStatus.record.checkOut && (
                              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                <span>Check Out:</span>
                                <span className="font-medium">
                                  {new Date(attendanceStatus.record.checkOut).toLocaleTimeString()}
                                </span>
                              </div>
                            )}
                            {attendanceStatus.record.workingHours > 0 && (
                              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                <span>Hours:</span>
                                <span className="font-medium">
                                  {attendanceStatus.record.workingHours.toFixed(2)}h
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Quick Actions */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => markUserAttendance(userItem._id, 'present')}
                            className="px-3 py-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 text-sm font-medium"
                          >
                            Present
                          </button>
                          <button
                            onClick={() => markUserAttendance(userItem._id, 'absent')}
                            className="px-3 py-2 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 text-sm font-medium"
                          >
                            Absent
                          </button>
                          <button
                            onClick={() => markUserAttendance(userItem._id, 'half_day')}
                            className="px-3 py-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-800 text-sm font-medium"
                          >
                            Half Day
                          </button>
                          <button
                            onClick={() => markUserAttendance(userItem._id, 'leave')}
                            className="px-3 py-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 text-sm font-medium"
                          >
                            Leave
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Calendar Tab */}
          {activeTab === 'calendar' && (
            <HRCalendar embedded={true} />
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className={`${currentTheme.surface} rounded-lg p-6 border ${currentTheme.border}`}>
                <h2 className={`text-xl font-bold ${currentTheme.text} mb-4`}>Individual User Attendance Tracking</h2>

                {/* User Selection */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`text-lg font-semibold ${currentTheme.text}`}>Select User</h3>
                    <button
                      onClick={() => setIsUserListCollapsed(!isUserListCollapsed)}
                      className={`flex items-center gap-2 px-3 py-2 ${currentTheme.surfaceSecondary} rounded-lg ${currentTheme.hover} transition-colors`}
                    >
                      {isUserListCollapsed ? (
                        <>
                          <ChevronRight className="w-4 h-4" />
                          <span className="text-sm">Show Users ({users.length})</span>
                        </>
                      ) : (
                        <>
                          <ChevronLeft className="w-4 h-4" />
                          <span className="text-sm">Hide Users</span>
                        </>
                      )}
                    </button>
                  </div>
                  {!isUserListCollapsed && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.map((user) => (
                      <div
                        key={user._id}
                        onClick={() => handleUserSelect(user)}
                        className={`p-4 ${currentTheme.surfaceSecondary} rounded-lg border cursor-pointer transition-all ${
                          selectedUser?._id === user._id
                            ? `border-blue-500 ${currentColorScheme.primaryLight} dark:bg-blue-900/20`
                            : `${currentTheme.border} ${currentTheme.hover}`
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full ${currentTheme.surface} flex items-center justify-center border ${currentTheme.border}`}>
                            <User className={`w-6 h-6 ${currentColorScheme.primaryText}`} />
                          </div>
                          <div>
                            <p className={`font-medium ${currentTheme.text}`}>{user.full_name}</p>
                            <p className={`text-sm ${currentTheme.textSecondary}`}>{user.email}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    </div>
                  )}
                </div>

                {selectedUser && (
                  <>
                    {/* User Attendance Overview */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-lg font-semibold ${currentTheme.text}`}>
                          Attendance Overview - {selectedUser.full_name}
                        </h3>
                        <div className="flex gap-2">
                          <select
                            value={selectedMonth}
                            onChange={(e) => {
                              setSelectedMonth(parseInt(e.target.value));
                              setTimeout(() => fetchUserAttendanceHistory(selectedUser._id), 100);
                            }}
                            className={`px-3 py-2 ${currentTheme.surfaceSecondary} rounded-lg border ${currentTheme.border} ${currentTheme.text} focus:ring-2 ${currentTheme.focus}`}
                          >
                            {Array.from({ length: 12 }, (_, i) => (
                              <option key={i + 1} value={i + 1}>
                                {new Date(2024, i).toLocaleDateString('en-US', { month: 'long' })}
                              </option>
                            ))}
                          </select>
                          <select
                            value={selectedYear}
                            onChange={(e) => {
                              setSelectedYear(parseInt(e.target.value));
                              setTimeout(() => fetchUserAttendanceHistory(selectedUser._id), 100);
                            }}
                            className={`px-3 py-2 ${currentTheme.surfaceSecondary} rounded-lg border ${currentTheme.border} ${currentTheme.text} focus:ring-2 ${currentTheme.focus}`}
                          >
                            {[2024, 2025, 2026].map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Statistics Cards */}
                      {userAttendanceStats && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div className={`${currentTheme.surfaceSecondary} rounded-lg p-4 border ${currentTheme.border}`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className={`text-sm ${currentTheme.textSecondary}`}>Total Days</p>
                                <p className={`text-2xl font-bold ${currentTheme.text}`}>{userAttendanceStats.totalDays}</p>
                              </div>
                              <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                            </div>
                          </div>
                          <div className={`${currentTheme.surfaceSecondary} rounded-lg p-4 border ${currentTheme.border}`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className={`text-sm ${currentTheme.textSecondary}`}>Present</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{userAttendanceStats.present}</p>
                              </div>
                              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                            </div>
                          </div>
                          <div className={`${currentTheme.surfaceSecondary} rounded-lg p-4 border ${currentTheme.border}`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className={`text-sm ${currentTheme.textSecondary}`}>Absent</p>
                                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{userAttendanceStats.absent}</p>
                              </div>
                              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                            </div>
                          </div>
                          <div className={`${currentTheme.surfaceSecondary} rounded-lg p-4 border ${currentTheme.border}`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className={`text-sm ${currentTheme.textSecondary}`}>Attendance Rate</p>
                                <p className={`text-2xl font-bold ${userAttendanceStats.attendanceRate >= 80 ? 'text-green-600 dark:text-green-400' : userAttendanceStats.attendanceRate >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {userAttendanceStats.attendanceRate}%
                                </p>
                              </div>
                              <TrendingUp className={`w-8 h-8 ${userAttendanceStats.attendanceRate >= 80 ? 'text-green-600 dark:text-green-400' : userAttendanceStats.attendanceRate >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`} />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Attendance History */}
                      <div className={`${currentTheme.surfaceSecondary} rounded-lg border ${currentTheme.border}`}>
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                          <h4 className={`font-semibold ${currentTheme.text}`}>Daily Attendance History</h4>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {userAttendanceHistory.length > 0 ? (
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                              {userAttendanceHistory.map((record) => (
                                <div key={record._id} className="p-4 flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className={`w-3 h-3 rounded-full ${
                                      record.status === 'present' ? 'bg-green-600 dark:bg-green-400' :
                                      record.status === 'absent' ? 'bg-red-600 dark:bg-red-400' :
                                      record.status === 'half_day' ? 'bg-yellow-600 dark:bg-yellow-400' :
                                      record.status === 'leave' ? 'bg-blue-600 dark:bg-blue-400' : 'bg-gray-600 dark:bg-gray-400'
                                    }`} />
                                    <div>
                                      <p className={`font-medium ${currentTheme.text}`}>
                                        {new Date(record.date).toLocaleDateString('en-US', {
                                          weekday: 'long',
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric'
                                        })}
                                      </p>
                                      <p className={`text-sm ${currentTheme.textSecondary}`}>
                                        Status: {record.status.replace('_', ' ').toUpperCase()}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    {record.checkIn && (
                                      <p className={`text-sm ${currentTheme.textSecondary}`}>
                                        Check-in: {new Date(record.checkIn).toLocaleTimeString()}
                                      </p>
                                    )}
                                    {record.checkOut && (
                                      <p className={`text-sm ${currentTheme.textSecondary}`}>
                                        Check-out: {new Date(record.checkOut).toLocaleTimeString()}
                                      </p>
                                    )}
                                    {record.workingHours && (
                                      <p className={`text-sm font-medium ${currentTheme.text}`}>
                                        {record.workingHours} hours
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-8 text-center">
                              <p className={`text-lg ${currentTheme.textSecondary}`}>No attendance records found</p>
                              <p className={`text-sm ${currentTheme.textSecondary} mt-2`}>
                                No attendance data available for {selectedUser.full_name} in {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

            {/* Email Tab */}
            {activeTab === 'email' && (
              <div className="space-y-6">
                <div className={`${currentTheme.surface} rounded-xl p-6 border ${currentTheme.border} shadow-sm`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                      <h2 className={`text-2xl font-bold ${currentTheme.text}`}>Email Management</h2>
                      <p className={`text-sm ${currentTheme.textSecondary} mt-1`}>Create and manage email campaigns for your team</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-2 px-3 py-1.5 ${currentTheme.surfaceSecondary} rounded-full border ${currentTheme.border}`}>
                        <div className={`w-2 h-2 rounded-full ${emailConfig?.brevoConfigured ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className={`text-xs font-medium ${currentTheme.text}`}>
                          {emailConfig?.brevoConfigured ? 'Brevo Connected' : 'Brevo Disconnected'}
                        </span>
                      </div>
                      <button
                        onClick={() => navigate('/hr/email-center')}
                        className={`inline-flex items-center gap-2 px-4 py-2 ${currentTheme.surfaceSecondary} hover:${currentTheme.hover} ${currentTheme.text} rounded-lg text-sm font-medium border ${currentTheme.border} transition-all`}
                      >
                        <ExternalLink className="w-4 h-4" />
                        Full Email Center
                      </button>
                    </div>
                  </div>

                  {/* Campaign Progress Stepper */}
                  <div className="mb-10">
                    <div className="relative flex items-center justify-between max-w-2xl mx-auto">
                      {/* Progress Line */}
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-gray-200 dark:bg-gray-700 -z-10" />
                      <div 
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-blue-500 transition-all duration-500 -z-10" 
                        style={{ width: `${((emailCampaignStep - 1) / 2) * 100}%` }}
                      />

                      {/* Step 1 */}
                      <div className="flex flex-col items-center">
                        <button 
                          onClick={() => setEmailCampaignStep(1)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                            emailCampaignStep >= 1 ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : `${currentTheme.surfaceSecondary} ${currentTheme.textSecondary} border-2 ${currentTheme.border}`
                          }`}
                        >
                          {emailCampaignStep > 1 ? <CheckCircle className="w-6 h-6" /> : <span className="font-bold">1</span>}
                        </button>
                        <span className={`text-xs font-medium mt-2 ${emailCampaignStep >= 1 ? 'text-blue-500' : currentTheme.textSecondary}`}>Template</span>
                      </div>

                      {/* Step 2 */}
                      <div className="flex flex-col items-center">
                        <button 
                          onClick={() => selectedTemplate && setEmailCampaignStep(2)}
                          disabled={!selectedTemplate}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                            emailCampaignStep >= 2 ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : `${currentTheme.surfaceSecondary} ${currentTheme.textSecondary} border-2 ${currentTheme.border}`
                          } ${!selectedTemplate && 'opacity-50 cursor-not-allowed'}`}
                        >
                          {emailCampaignStep > 2 ? <CheckCircle className="w-6 h-6" /> : <span className="font-bold">2</span>}
                        </button>
                        <span className={`text-xs font-medium mt-2 ${emailCampaignStep >= 2 ? 'text-blue-500' : currentTheme.textSecondary}`}>Recipients</span>
                      </div>

                      {/* Step 3 */}
                      <div className="flex flex-col items-center">
                        <button 
                          onClick={() => selectedTemplate && emailRecipients.length > 0 && setEmailCampaignStep(3)}
                          disabled={!selectedTemplate || emailRecipients.length === 0}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                            emailCampaignStep >= 3 ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : `${currentTheme.surfaceSecondary} ${currentTheme.textSecondary} border-2 ${currentTheme.border}`
                          } ${(!selectedTemplate || emailRecipients.length === 0) && 'opacity-50 cursor-not-allowed'}`}
                        >
                          <span className="font-bold">3</span>
                        </button>
                        <span className={`text-xs font-medium mt-2 ${emailCampaignStep >= 3 ? 'text-blue-500' : currentTheme.textSecondary}`}>Review & Send</span>
                      </div>
                    </div>
                  </div>

                  {/* Step 1: Template Selection */}
                  {emailCampaignStep === 1 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className={`text-lg font-semibold ${currentTheme.text}`}>Choose a Template</h3>
                        <p className={`text-sm ${currentTheme.textSecondary}`}>{emailTemplates.length} templates available</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {emailTemplates.map((template) => (
                          <div
                            key={template._id}
                            className={`group relative p-5 rounded-xl border-2 transition-all cursor-pointer ${
                              selectedTemplate?._id === template._id
                                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                                : `${currentTheme.border} ${currentTheme.surface} hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md`
                            }`}
                            onClick={() => handleTemplateSelect(template)}
                          >
                            <div className="flex items-start gap-4">
                              <div className={`p-3 rounded-xl transition-colors ${
                                template.category === 'leave' ? 'bg-blue-100 text-blue-600' :
                                template.category === 'attendance' ? 'bg-orange-100 text-orange-600' :
                                template.category === 'system' ? 'bg-green-100 text-green-600' :
                                template.category === 'hiring' ? 'bg-purple-100 text-purple-600' :
                                template.category === 'interview' ? 'bg-indigo-100 text-indigo-600' :
                                template.category === 'onboarding' ? 'bg-teal-100 text-teal-600' :
                                template.category === 'engagement' ? 'bg-pink-100 text-pink-600' :
                                template.category === 'exit' ? 'bg-red-100 text-red-600' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {template.category === 'leave' ? <Calendar className="w-5 h-5" /> :
                                 template.category === 'attendance' ? <Clock className="w-5 h-5" /> :
                                 template.category === 'system' ? <User className="w-5 h-5" /> :
                                 template.category === 'hiring' ? <UserPlus className="w-5 h-5" /> :
                                 template.category === 'interview' ? <MessageSquare className="w-5 h-5" /> :
                                 template.category === 'onboarding' ? <UsersIcon className="w-5 h-5" /> :
                                 template.category === 'engagement' ? <Bell className="w-5 h-5" /> :
                                 template.category === 'exit' ? <UserMinus className="w-5 h-5" /> :
                                 <FileText className="w-5 h-5" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className={`font-bold ${currentTheme.text} mb-1 truncate`}>{template.name}</h4>
                                <p className={`text-xs font-medium uppercase tracking-wider ${currentTheme.textSecondary}`}>{template.category}</p>
                              </div>
                              {selectedTemplate?._id === template._id && (
                                <div className="absolute top-3 right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-sm animate-in zoom-in">
                                  <CheckCircle className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {template.isPredefined && (
                                  <span className="px-2 py-0.5 text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-md uppercase">
                                    Official
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Code className="w-3 h-3" />
                                {template.variables?.length || 0} fields
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {selectedTemplate && (
                        <div className="mt-8 flex justify-end">
                          <button
                            onClick={() => setEmailCampaignStep(2)}
                            className={`px-8 py-3 ${currentColorScheme.primary} text-white rounded-xl font-bold shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95`}
                          >
                            Next: Select Recipients
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                    {/* Step 2: Recipient Selection */}
                    {emailCampaignStep === 2 && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                          <div>
                            <h3 className={`text-lg font-semibold ${currentTheme.text}`}>Who's receiving this?</h3>
                            <p className={`text-sm ${currentTheme.textSecondary}`}>
                              {recipientMode === 'INTERNAL' ? 'Internal Team Members' : 'External Candidates/Contacts'}
                              {' • '} 
                              Selected {emailRecipients.length} recipients
                            </p>
                          </div>
                          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
                            <button
                              onClick={() => {
                                setRecipientMode('INTERNAL');
                                setEmailRecipients([]);
                              }}
                              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                recipientMode === 'INTERNAL' 
                                  ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' 
                                  : 'text-gray-500 hover:text-gray-700'
                              }`}
                            >
                              Internal
                            </button>
                            <button
                              onClick={() => {
                                setRecipientMode('EXTERNAL');
                                setEmailRecipients([]);
                              }}
                              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                recipientMode === 'EXTERNAL' 
                                  ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' 
                                  : 'text-gray-500 hover:text-gray-700'
                              }`}
                            >
                              External
                            </button>
                          </div>
                        </div>

                        {recipientMode === 'EXTERNAL' ? (
                          <div className="space-y-6">
                            {/* Manual Entry Form */}
                            <div className={`p-6 rounded-xl border-2 border-dashed ${currentTheme.border} ${currentTheme.surfaceSecondary}`}>
                              <h4 className={`text-sm font-bold ${currentTheme.text} mb-4 flex items-center gap-2`}>
                                <UserPlus className="w-4 h-4 text-blue-500" />
                                Add External Recipient
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Full Name</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. John Doe"
                                    value={manualRecipient.name}
                                    onChange={(e) => setManualRecipient(prev => ({ ...prev, name: e.target.value }))}
                                    className={`w-full px-4 py-2.5 ${currentTheme.surface} rounded-xl border ${currentTheme.border} ${currentTheme.text} focus:ring-2 focus:ring-blue-500 transition-all`}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Email Address</label>
                                  <input
                                    type="email"
                                    placeholder="e.g. john@example.com"
                                    value={manualRecipient.email}
                                    onChange={(e) => setManualRecipient(prev => ({ ...prev, email: e.target.value }))}
                                    className={`w-full px-4 py-2.5 ${currentTheme.surface} rounded-xl border ${currentTheme.border} ${currentTheme.text} focus:ring-2 focus:ring-blue-500 transition-all`}
                                  />
                                </div>
                                <div className="flex items-end">
                                  <button
                                    onClick={addExternalRecipient}
                                    disabled={!manualRecipient.name || !manualRecipient.email}
                                    className={`w-full py-2.5 ${currentColorScheme.primary} text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-95`}
                                  >
                                    Add Recipient
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* External Recipients List */}
                            {emailRecipients.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {emailRecipients.map((recipient) => (
                                  <div 
                                    key={recipient.id} 
                                    className={`flex items-center justify-between p-4 rounded-xl border-2 border-blue-500 bg-white dark:bg-gray-800 shadow-sm animate-in zoom-in duration-300`}
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                        {recipient.name?.charAt(0)}
                                      </div>
                                      <div className="truncate">
                                        <p className={`text-sm font-bold ${currentTheme.text} truncate`}>{recipient.name}</p>
                                        <p className={`text-xs ${currentTheme.textSecondary} truncate`}>{recipient.email}</p>
                                      </div>
                                    </div>
                                    <button 
                                      onClick={() => removeExternalRecipient(recipient.id)}
                                      className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {emailRecipients.length === 0 && (
                              <div className="py-12 text-center">
                                <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className={currentTheme.textSecondary}>No external recipients added yet.</p>
                                <p className="text-xs text-gray-400 mt-1">Add candidates manually above for interview/hiring emails.</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-end mb-4 gap-2">
                              <button
                                onClick={() => setEmailRecipients(users.map(u => u._id))}
                                className={`px-3 py-1.5 text-xs font-bold ${currentTheme.surfaceSecondary} ${currentTheme.text} rounded-lg border ${currentTheme.border} hover:${currentTheme.hover}`}
                              >
                                Select All
                              </button>
                              <button
                                onClick={() => setEmailRecipients([])}
                                className={`px-3 py-1.5 text-xs font-bold ${currentTheme.surfaceSecondary} ${currentTheme.text} rounded-lg border ${currentTheme.border} hover:${currentTheme.hover}`}
                              >
                                Clear
                              </button>
                            </div>

                            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto p-2 rounded-xl bg-gray-50/50 dark:bg-gray-900/20 border ${currentTheme.border}`}>
                              {users.map((user) => (
                                <label 
                                  key={user._id} 
                                  className={`flex items-center p-4 rounded-xl cursor-pointer border-2 transition-all ${
                                    emailRecipients.includes(user._id)
                                      ? 'border-blue-500 bg-white dark:bg-gray-800 shadow-sm'
                                      : `${currentTheme.border} ${currentTheme.surface} hover:border-gray-300`
                                  }`}
                                >
                                  <div className="relative flex items-center gap-3 flex-1 min-w-0">
                                    <div className="relative">
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                                        {user.full_name?.charAt(0)}
                                      </div>
                                      {emailRecipients.includes(user._id) && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                                          <CheckCircle className="w-2.5 h-2.5 text-white" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="truncate">
                                      <p className={`text-sm font-bold ${currentTheme.text} truncate`}>{user.full_name}</p>
                                      <p className={`text-xs ${currentTheme.textSecondary} truncate`}>{user.email}</p>
                                    </div>
                                    <input
                                      type="checkbox"
                                      checked={emailRecipients.includes(user._id)}
                                      onChange={() => handleEmailUserSelect(user._id)}
                                      className="hidden"
                                    />
                                  </div>
                                </label>
                              ))}
                            </div>
                          </>
                        )}

                        <div className="mt-8 flex justify-between items-center">
                          <button
                            onClick={() => setEmailCampaignStep(1)}
                            className={`px-6 py-3 ${currentTheme.textSecondary} font-bold flex items-center gap-2 hover:${currentTheme.text}`}
                          >
                            <ChevronLeft className="w-5 h-5" />
                            Back
                          </button>
                          <button
                            onClick={() => setEmailCampaignStep(3)}
                            disabled={emailRecipients.length === 0}
                            className={`px-8 py-3 ${currentColorScheme.primary} text-white rounded-xl font-bold shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed`}
                          >
                            Next: Review & Customize
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )}

                  {/* Step 3: Review & Send */}
                  {emailCampaignStep === 3 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div>
                            <h3 className={`text-lg font-semibold ${currentTheme.text} mb-4`}>Personalization</h3>
                            <div className={`p-6 rounded-xl border ${currentTheme.border} ${currentTheme.surfaceSecondary} space-y-4`}>
                              {renderTemplateVariables()}
                              
                              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                <label className={`block text-sm font-bold ${currentTheme.text} mb-2`}>Email Subject</label>
                                <input
                                  type="text"
                                  value={emailData.subject}
                                  onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                                  className={`w-full px-4 py-3 ${currentTheme.surface} rounded-xl border ${currentTheme.border} ${currentTheme.text} focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-all`}
                                  placeholder="Campaign subject line..."
                                />
                              </div>
                            </div>
                          </div>

                          <div className={`p-6 rounded-xl border ${currentTheme.border} bg-blue-50/30 dark:bg-blue-900/10`}>
                            <h4 className={`text-sm font-bold ${currentTheme.text} mb-4 flex items-center gap-2`}>
                              <Layout className="w-4 h-4 text-blue-500" />
                              Campaign Summary
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-900/50">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Recipients</p>
                                <p className={`text-lg font-black ${currentTheme.text}`}>{emailRecipients.length}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-900/50">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Template</p>
                                <p className={`text-sm font-bold ${currentTheme.text} truncate`}>{selectedTemplate?.name}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <h3 className={`text-lg font-semibold ${currentTheme.text}`}>Content Editor</h3>
                            <button
                              onClick={() => setShowHtmlEditor(!showHtmlEditor)}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                                showHtmlEditor 
                                  ? 'bg-blue-500 text-white border-blue-500' 
                                  : `${currentTheme.surfaceSecondary} ${currentTheme.text} ${currentTheme.border} hover:${currentTheme.hover}`
                              }`}
                            >
                              {showHtmlEditor ? 'Switch to Rich Text' : 'Switch to HTML Source'}
                            </button>
                          </div>

                          <div className={`rounded-xl border ${currentTheme.border} overflow-hidden bg-white dark:bg-gray-900 shadow-inner`}>
                            {showHtmlEditor ? (
                              <textarea
                                rows="15"
                                value={emailData.htmlContent}
                                onChange={(e) => setEmailData(prev => ({ ...prev, htmlContent: e.target.value }))}
                                className={`w-full p-6 font-mono text-sm bg-transparent outline-none resize-none ${currentTheme.text}`}
                              />
                            ) : (
                              <div
                                contentEditable
                                dangerouslySetInnerHTML={{ __html: emailData.htmlContent }}
                                onInput={(e) => setEmailData(prev => ({ ...prev, htmlContent: e.target.innerHTML }))}
                                className={`w-full p-6 min-h-[400px] outline-none prose prose-sm dark:prose-invert max-w-none ${currentTheme.text}`}
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-10 flex justify-between items-center pt-6 border-t border-gray-100 dark:border-gray-800">
                        <button
                          onClick={() => setEmailCampaignStep(2)}
                          className={`px-6 py-3 ${currentTheme.textSecondary} font-bold flex items-center gap-2 hover:${currentTheme.text}`}
                        >
                          <ChevronLeft className="w-5 h-5" />
                          Back
                        </button>
                        <div className="flex gap-4">
                          <button
                            onClick={() => setShowPreview(true)}
                            className={`px-6 py-3 ${currentTheme.surfaceSecondary} ${currentTheme.text} rounded-xl font-bold border ${currentTheme.border} hover:${currentTheme.hover} flex items-center gap-2 transition-all`}
                          >
                            <Eye className="w-5 h-5" />
                            Preview
                          </button>
                          <button
                            onClick={sendTemplateEmail}
                            className={`px-10 py-3 ${currentColorScheme.primary} text-white rounded-xl font-bold shadow-xl shadow-blue-500/25 flex items-center gap-2 transition-all hover:scale-105 active:scale-95`}
                          >
                            <Send className="w-5 h-5" />
                            Launch Campaign
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Legacy Interface - Hidden by default or collapsible */}
                <div className={`rounded-xl border ${currentTheme.border} ${currentTheme.surface} overflow-hidden opacity-50 hover:opacity-100 transition-opacity`}>
                  <button 
                    onClick={() => {}} // Could add state for collapse
                    className="w-full px-6 py-4 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50"
                  >
                    <div className="flex items-center gap-2">
                      <SettingsIcon className={`w-4 h-4 ${currentTheme.textSecondary}`} />
                      <span className={`text-sm font-bold ${currentTheme.textSecondary}`}>Quick Send & Legacy Tools</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 ${currentTheme.textSecondary}`} />
                  </button>
                </div>
              </div>
            )}

            {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className={`${currentTheme.surface} rounded-lg border ${currentTheme.border} overflow-hidden`}>
                <div className={`px-6 py-4 border-b ${currentTheme.border}`}>
                  <h2 className={`text-lg font-semibold ${currentTheme.text}`}>Employee Management</h2>
                  <p className={`text-sm ${currentTheme.textSecondary}`}>Manage employee employment status and lifecycle</p>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.map((user) => (
                      <div key={user._id} className={`${currentTheme.surfaceSecondary} rounded-lg p-4 border ${currentTheme.border}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className={`font-medium ${currentTheme.text}`}>{user.full_name}</h3>
                            <p className={`text-sm ${currentTheme.textSecondary}`}>{user.email}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.employmentStatus || 'ACTIVE')}`}>
                            {user.employmentStatus || 'ACTIVE'}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          {user.employmentStatus !== 'ACTIVE' && (
                            <button
                              onClick={() => handleEmployeeAction(user, 'activate')}
                              className="flex-1 px-3 py-2 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                            >
                              Activate
                            </button>
                          )}
                          {user.employmentStatus === 'ACTIVE' && (
                            user.role !== 'admin' || (user.role === 'admin' && currentUser.role === 'community_admin') ? (
                              <button
                                onClick={() => handleEmployeeAction(user, 'deactivate')}
                                className="flex-1 px-3 py-2 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                              >
                                Deactivate
                              </button>
                            ) : user.role === 'admin' ? (
                              <div className="flex-1 px-3 py-2 bg-gray-400 text-white text-xs rounded text-center">
                                Protected
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEmployeeAction(user, 'deactivate')}
                                className="flex-1 px-3 py-2 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                              >
                                Deactivate
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
      </div>
    </ResponsivePageLayout>

    {/* Employee Action Confirmation Modal */}
    {showEmployeeActionModal && (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowEmployeeActionModal(false)}></div>

          <div className={`relative ${currentTheme.surface} rounded-lg max-w-md w-full p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${currentTheme.text}`}>
                {employeeAction === 'activate' ? 'Activate Employee' : 'Deactivate Employee'}
              </h3>
              <button
                onClick={() => setShowEmployeeActionModal(false)}
                className={`${currentTheme.textSecondary} hover:${currentTheme.text}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className={currentTheme.text}>
                Are you sure you want to {employeeAction} <strong>{selectedEmployee?.full_name}</strong>?
              </p>
              {employeeAction === 'deactivate' && (
                <p className="text-red-600 dark:text-red-400 mt-2">
                  This action cannot be undone and will prevent the employee from receiving emails.
                </p>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowEmployeeActionModal(false)}
                  className={`px-4 py-2 border ${currentTheme.border} rounded-lg ${currentTheme.textSecondary} ${currentTheme.hover}`}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmEmployeeAction}
                  className={`px-4 py-2 ${employeeAction === 'activate' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white rounded-lg`}
                >
                  {employeeAction === 'activate' ? 'Activate' : 'Deactivate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Email Preview Modal */}
    <EmailPreviewModal />

    {/* Confirm Modal */}
    <ConfirmModal
      isOpen={confirmModal.isOpen}
      onClose={confirmModal.hide}
      onConfirm={confirmModal.onConfirm}
      title={confirmModal.title}
      message={confirmModal.message}
      confirmText={confirmModal.confirmText}
      cancelText={confirmModal.cancelText}
      variant={confirmModal.variant}
      isLoading={confirmModal.isLoading}
    />
    </>
  );
}
