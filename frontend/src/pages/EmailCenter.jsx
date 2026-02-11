import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { useTheme } from '../context/ThemeContext';
import ResponsivePageLayout from '../components/layouts/ResponsivePageLayout';
import ConfirmModal from '../components/modals/ConfirmModal';
import { useConfirmModal } from '../hooks/useConfirmModal';
import {
  Mail, Send, Users, UserPlus, FileText, CheckCircle, 
  X, Eye, Code, Layout, ChevronRight, ChevronLeft,
  Calendar, Clock, MessageSquare, Bell, UserMinus,
  Settings as SettingsIcon, ExternalLink, Briefcase,
  AlertCircle, Edit3, Sparkles, RefreshCw, Search
} from 'lucide-react';

/**
 * Email Center - Professional HR Email Management Interface
 * Enhanced with Smart Variable Mapping to eliminate redundant data entry.
 */
export default function EmailCenter() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { currentTheme, currentColorScheme } = useTheme();
  const confirmModal = useConfirmModal();

  // State management
  const [loading, setLoading] = useState(true);
  const [emailConfig, setEmailConfig] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [users, setUsers] = useState([]);
  const [campaignStep, setCampaignStep] = useState(1);
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  
  // Selection states
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [recipientMode, setRecipientMode] = useState('INTERNAL'); // 'INTERNAL' or 'EXTERNAL'
  const [emailRecipients, setEmailRecipients] = useState([]);
  const [manualRecipient, setManualRecipient] = useState({ name: '', email: '' });
  
  // Content states
  const [emailData, setEmailData] = useState({
    subject: '',
    htmlContent: '',
    variables: {}
  });
  const [showHtmlEditor, setShowHtmlEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [activeRecipientIndex, setActiveRecipientIndex] = useState(0);

  // Filter templates based on search query
  const filteredTemplates = useMemo(() => {
    if (!templateSearchQuery.trim()) return templates;
    
    const query = templateSearchQuery.toLowerCase();
    return templates.filter(template => {
      const name = template.name?.toLowerCase() || '';
      const category = template.category?.toLowerCase() || '';
      return name.includes(query) || category.includes(query);
    });
  }, [templates, templateSearchQuery]);

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return users;
    
    const query = userSearchQuery.toLowerCase();
    return users.filter(user => {
      const name = user.name?.toLowerCase() || '';
      const email = user.email?.toLowerCase() || '';
      const department = user.department?.toLowerCase() || '';
      const role = user.role?.toLowerCase() || '';
      return name.includes(query) || email.includes(query) || 
             department.includes(query) || role.includes(query);
    });
  }, [users, userSearchQuery]);

  // Load initial data
  useEffect(() => {
    fetchInitialData();
  }, [currentWorkspace]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchTemplates(),
        fetchUsers(),
        fetchEmailConfig()
      ]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/hr/email-templates');
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/hr/email-templates/users');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchEmailConfig = async () => {
    try {
      const response = await api.get('/hr/email-templates/config');
      setEmailConfig(response.data.config);
    } catch (error) {
      console.error('Error fetching email config:', error);
    }
  };

  /**
   * Smart Variable Mapper - Automatically maps recipient data to template variables
   * to eliminate redundant data entry.
   */
  const getAutoVariables = (recipient, template) => {
    if (!template || !template.variables) return {};

    const autoVars = {};
    const commonMappings = {
      fullName: recipient.name,
      name: recipient.name,
      candidateName: recipient.name,
      email: recipient.email,
      recipientEmail: recipient.email,
      department: recipient.department || '',
      role: recipient.role || '',
      jobTitle: recipient.role || '',
      currentDate: new Date().toLocaleDateString(),
      workspaceName: currentWorkspace?.name || 'TaskFlow',
      appUrl: window.location.origin
    };

    template.variables.forEach(v => {
      if (commonMappings[v.name]) {
        autoVars[v.name] = commonMappings[v.name];
      }
    });

    return autoVars;
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    
    // Logic: Recruitment/Interview templates default to External recipients
    if (template.category === 'hiring' || template.category === 'interview') {
      setRecipientMode('EXTERNAL');
    } else {
      setRecipientMode('INTERNAL');
    }
    
    setCampaignStep(2);

    // Auto-populate system variables for global defaults
    const systemVariables = {};
    if (template.variables) {
      template.variables.forEach(variable => {
        switch (variable.name) {
          case 'workspaceName':
            systemVariables[variable.name] = currentWorkspace?.name || 'TaskFlow';
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

    // Refresh existing recipients for the new template
    setEmailRecipients(prev => prev.map(r => ({
      ...r,
      variables: {
        ...r.variables,
        ...getAutoVariables(r, template)
      }
    })));

    setEmailData({
      subject: template.subject,
      htmlContent: template.htmlContent,
      variables: systemVariables
    });
  };

  const handleUserToggle = (userId) => {
    setEmailRecipients(prev => {
      const exists = prev.find(r => r.id === userId);
      if (exists) {
        return prev.filter(r => r.id !== userId);
      } else {
        const user = users.find(u => u.id === userId);
        const baseRecipient = {
          id: userId,
          name: user.name,
          email: user.email,
          department: user.department,
          role: user.role,
          source: 'INTERNAL',
          variables: {}
        };

        // Smart Mapping: Auto-fill variables based on current template
        baseRecipient.variables = getAutoVariables(baseRecipient, selectedTemplate);

        return [...prev, baseRecipient];
      }
    });
  };

  const addExternalRecipient = () => {
    if (manualRecipient.name && manualRecipient.email) {
      const baseRecipient = {
        id: `ext-${Date.now()}`,
        name: manualRecipient.name,
        email: manualRecipient.email,
        source: 'EXTERNAL',
        variables: {}
      };

      // Smart Mapping: Auto-fill variables based on current template
      baseRecipient.variables = getAutoVariables(baseRecipient, selectedTemplate);

      setEmailRecipients(prev => [...prev, baseRecipient]);
      setManualRecipient({ name: '', email: '' });
    }
  };

  const removeExternalRecipient = (id) => {
    setEmailRecipients(prev => prev.filter(r => r.id !== id));
  };

  const updateRecipientVariable = (recipientId, varName, value) => {
    setEmailRecipients(prev => prev.map(r => 
      r.id === recipientId 
        ? { ...r, variables: { ...r.variables, [varName]: value } }
        : r
    ));
  };

  const resetToAutoMapping = (recipientId) => {
    setEmailRecipients(prev => prev.map(r => 
      r.id === recipientId 
        ? { ...r, variables: getAutoVariables(r, selectedTemplate) }
        : r
    ));
  };

    const sendEmails = async () => {
      if (!selectedTemplate || emailRecipients.length === 0) return;

      setIsSending(true);
      
      // Initialize statuses
      setEmailRecipients(prev => prev.map(r => ({ ...r, status: 'pending' })));

      try {
        let successCount = 0;
        let errorCount = 0;

        // Personalized sending loop
        for (let i = 0; i < emailRecipients.length; i++) {
          const recipientData = emailRecipients[i];
          const recipientObj = { email: recipientData.email, name: recipientData.name };

          // Update individual recipient status to sending
          setEmailRecipients(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'sending' } : r));

          // MERGE VARIABLES: Global Defaults < Recipient Specific Overrides
          const mergedVariables = {
            ...emailData.variables,
            ...recipientData.variables,
            fullName: recipientObj.name,
            email: recipientObj.email
          };

          try {
            await api.post('/hr/email-templates/send', {
              recipients: [recipientObj],
              subject: emailData.subject, // Send raw template subject
              htmlContent: emailData.htmlContent, // Send raw template HTML
              templateId: selectedTemplate._id,
              variables: mergedVariables // Send all variables for backend interpolation
            });
            
            successCount++;
            setEmailRecipients(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'sent' } : r));
          } catch (err) {
            console.error(`Failed to send to ${recipientObj.email}:`, err);
            errorCount++;
            setEmailRecipients(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'failed' } : r));
          }
        }

        // Stop loading before showing the result modal
        setIsSending(false);
        setShowPreview(false);

        await confirmModal.show({
          title: successCount === emailRecipients.length ? 'Campaign Complete' : 'Campaign Finished with Issues',
          message: `${successCount} emails sent successfully.${errorCount > 0 ? ` ${errorCount} failed.` : ''}`,
          confirmText: 'Dismiss',
          variant: successCount === emailRecipients.length ? 'info' : 'warning'
        });

        if (successCount > 0) {
          // Optional: We can choose to stay on the page to let them see the statuses
          // but for now let's stick to the existing flow of resetting.
          // Or wait for them to click "Confirm" then reset.
          setCampaignStep(1);
          setSelectedTemplate(null);
          setEmailRecipients([]);
          setEmailData({ subject: '', htmlContent: '', variables: {} });
        }
      } catch (error) {
        console.error('Send campaign error:', error);
        setIsSending(false);
        alert('An unexpected error occurred during the campaign.');
      }
    };


  const generatePreviewHtml = () => {
    let html = emailData.htmlContent;
    let subject = emailData.subject;

    // Get current preview recipient
    const recipient = emailRecipients[activeRecipientIndex] || emailRecipients[0];

    // Merge variables for preview
    const mergedVariables = {
      ...emailData.variables,
      ...(recipient?.variables || {}),
      fullName: recipient?.name || '[Full Name]',
      email: recipient?.email || '[Email]'
    };

    // Simple client-side preview interpolation
    Object.entries(mergedVariables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, value || `[${key}]`);
      subject = subject.replace(regex, value || `[${key}]`);
    });

    // Wrap in proper HTML document for preview
    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Preview</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            background: #ffffff;
            margin: 0;
            padding: 20px;
        }
        .email-content {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            padding: 20px;
        }
        h1, h2, h3 {
            color: #1f2937;
            margin-top: 24px;
            margin-bottom: 16px;
        }
        p {
            margin-bottom: 16px;
        }
        .highlight {
            background: rgba(102, 126, 234, 0.1);
            border-left: 4px solid #667eea;
            padding: 16px 20px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="email-content">
        ${html}
    </div>
</body>
</html>`;

    return { html: fullHtml, subject };
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${currentTheme.background} flex items-center justify-center`}>
        <div className="text-center">
          <Clock className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className={currentTheme.textSecondary}>Loading Email Center...</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsivePageLayout 
      title="Email Center" 
      subtitle="Professional Communication Engine"
    >
      <div className="max-w-[1400px] mx-auto space-y-8">
        {/* Connectivity Status */}
        <div className="flex items-center justify-end gap-3 mb-2">
          <div className={`flex items-center gap-2 px-4 py-2 ${currentTheme.surface} rounded-full border ${currentTheme.border} shadow-sm`}>
            <div className={`w-2 h-2 rounded-full ${emailConfig?.brevoConfigured ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className={`text-xs font-bold ${currentTheme.text}`}>
              {emailConfig?.brevoConfigured ? 'BREVO ACTIVE' : 'BREVO DISCONNECTED'}
            </span>
          </div>
        </div>

        {/* Campaign Stepper */}
        <div className="relative flex items-center justify-between max-w-3xl mx-auto mb-12">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 dark:bg-gray-800 -z-10 rounded-full" />
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-500 transition-all duration-700 -z-10 rounded-full" 
            style={{ width: `${((campaignStep - 1) / 2) * 100}%` }}
          />

          {[
            { step: 1, label: 'Template', icon: FileText },
            { step: 2, label: 'Recipients', icon: Users },
            { step: 3, label: 'Review', icon: Send }
          ].map((s) => (
            <div key={s.step} className="flex flex-col items-center">
              <button
                onClick={() => campaignStep > s.step && setCampaignStep(s.step)}
                disabled={campaignStep < s.step}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  campaignStep >= s.step 
                    ? 'bg-blue-500 text-white shadow-xl shadow-blue-500/30' 
                    : `${currentTheme.surfaceSecondary} ${currentTheme.textSecondary} border-2 ${currentTheme.border}`
                }`}
              >
                <s.icon className="w-6 h-6" />
              </button>
              <span className={`text-[10px] font-black uppercase tracking-widest mt-3 ${campaignStep >= s.step ? 'text-blue-500' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Step 1: Template Selection */}
        {campaignStep === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
            {/* Search Templates */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${currentTheme.textSecondary}`} />
                <input
                  type="text"
                  placeholder="Search templates by name or category..."
                  value={templateSearchQuery}
                  onChange={(e) => setTemplateSearchQuery(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 border ${currentTheme.border} rounded-xl ${currentTheme.surface} ${currentTheme.text} placeholder:${currentTheme.textSecondary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
            </div>
            
            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <FileText className={`w-16 h-16 mx-auto mb-4 ${currentTheme.textSecondary}`} />
                <p className={`text-lg font-medium ${currentTheme.text}`}>
                  {templateSearchQuery ? 'No templates match your search' : 'No templates available'}
                </p>
                <p className={`text-sm ${currentTheme.textSecondary} mt-2`}>
                  {templateSearchQuery ? 'Try adjusting your search terms' : 'Create a template to get started'}
                </p>
              </div>
            ) : (
              filteredTemplates.map((template) => (
              <div
                key={template._id}
                onClick={() => handleTemplateSelect(template)}
                className={`group relative p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                  selectedTemplate?._id === template._id
                    ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-900/10'
                    : `${currentTheme.border} ${currentTheme.surface} hover:border-blue-400 hover:shadow-xl`
                }`}
              >
                <div className="flex items-start gap-5">
                  <div className={`p-4 rounded-2xl transition-colors ${
                    template.category === 'hiring' ? 'bg-purple-100 text-purple-600' :
                    template.category === 'interview' ? 'bg-indigo-100 text-indigo-600' :
                    template.category === 'leave' ? 'bg-blue-100 text-blue-600' :
                    template.category === 'attendance' ? 'bg-orange-100 text-orange-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {template.category === 'hiring' ? <UserPlus className="w-6 h-6" /> :
                     template.category === 'interview' ? <MessageSquare className="w-6 h-6" /> :
                     template.category === 'leave' ? <Calendar className="w-6 h-6" /> :
                     template.category === 'attendance' ? <Clock className="w-6 h-6" /> :
                     <FileText className="w-6 h-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-black ${currentTheme.text} mb-1 truncate text-lg`}>{template.name}</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{template.category}</p>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {template.isPredefined && (
                      <span className="px-2 py-0.5 text-[9px] font-black bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-md uppercase tracking-wider">
                        Official
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5" />
                    {template.variables?.length || 0} Dynamic Fields
                  </span>
                </div>
              </div>
            )))
            }
            </div>
          </div>
        )}

        {/* Step 2: Recipient Selection */}
        {campaignStep === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
            {/* Search Users for Internal Recipients */}
            {recipientMode === 'INTERNAL' && (
              <div className="max-w-2xl mx-auto">
                <div className="relative">
                  <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${currentTheme.textSecondary}`} />
                  <input
                    type="text"
                    placeholder="Search users by name, email, department, or role..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 border ${currentTheme.border} rounded-xl ${currentTheme.surface} ${currentTheme.text} placeholder:${currentTheme.textSecondary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
              </div>
            )}
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className={`text-2xl font-black ${currentTheme.text}`}>Target Audience</h2>
                <p className={currentTheme.textSecondary}>Select the individuals who will receive this communication</p>
              </div>
              <div className={`flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl border ${currentTheme.border}`}>
                <button
                  onClick={() => { setRecipientMode('INTERNAL'); setEmailRecipients([]); }}
                  className={`px-6 py-2 text-xs font-black rounded-xl transition-all ${
                    recipientMode === 'INTERNAL' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-lg' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  INTERNAL TEAM
                </button>
                <button
                  onClick={() => { setRecipientMode('EXTERNAL'); setEmailRecipients([]); }}
                  className={`px-6 py-2 text-xs font-black rounded-xl transition-all ${
                    recipientMode === 'EXTERNAL' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-lg' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  EXTERNAL CONTACTS
                </button>
              </div>
            </div>

            {recipientMode === 'EXTERNAL' ? (
              <div className="space-y-8">
                <div className={`p-8 rounded-3xl border-2 border-dashed ${currentTheme.border} ${currentTheme.surfaceSecondary}`}>
                  <h3 className={`text-sm font-black ${currentTheme.text} mb-6 uppercase tracking-widest flex items-center gap-2`}>
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    Smart Candidate Entry
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Alex Rivera"
                        value={manualRecipient.name}
                        onChange={(e) => setManualRecipient(prev => ({ ...prev, name: e.target.value }))}
                        className={`w-full px-5 py-3.5 ${currentTheme.surface} rounded-2xl border ${currentTheme.border} ${currentTheme.text} focus:ring-4 focus:ring-blue-500/20 transition-all`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                      <input
                        type="email"
                        placeholder="alex@company.com"
                        value={manualRecipient.email}
                        onChange={(e) => setManualRecipient(prev => ({ ...prev, email: e.target.value }))}
                        className={`w-full px-5 py-3.5 ${currentTheme.surface} rounded-2xl border ${currentTheme.border} ${currentTheme.text} focus:ring-4 focus:ring-blue-500/20 transition-all`}
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={addExternalRecipient}
                        disabled={!manualRecipient.name || !manualRecipient.email}
                        className={`w-full py-3.5 ${currentColorScheme.primary} text-white rounded-2xl font-black shadow-xl shadow-blue-500/20 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-95`}
                      >
                        ADD TO LIST
                      </button>
                    </div>
                  </div>
                  <p className="mt-4 text-[9px] font-bold text-blue-500/60 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                    <Sparkles className="w-3 h-3" />
                    Variables like Name and Email will be automatically mapped to the template.
                  </p>
                </div>

                {emailRecipients.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {emailRecipients.map((r) => (
                      <div key={r.id} className="flex items-center justify-between p-4 rounded-2xl border-2 border-blue-500 bg-white dark:bg-gray-800 shadow-xl animate-in zoom-in duration-300">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs">
                            {r.name?.charAt(0)}
                          </div>
                          <div className="truncate">
                            <p className={`text-xs font-black ${currentTheme.text} truncate`}>{r.name}</p>
                            <p className={`text-[10px] font-bold text-gray-400 truncate`}>{r.email}</p>
                          </div>
                        </div>
                        <button onClick={() => removeExternalRecipient(r.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-3xl bg-gray-50/50 dark:bg-gray-900/30 border ${currentTheme.border}`}>
                {filteredUsers.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <Users className={`w-16 h-16 mx-auto mb-4 ${currentTheme.textSecondary}`} />
                    <p className={`text-lg font-medium ${currentTheme.text}`}>
                      {userSearchQuery ? 'No users match your search' : 'No users available'}
                    </p>
                    <p className={`text-sm ${currentTheme.textSecondary} mt-2`}>
                      {userSearchQuery ? 'Try adjusting your search terms' : 'Add users to your workspace to get started'}
                    </p>
                  </div>
                ) : (
                  filteredUsers.map((u) => {
                  const isSelected = emailRecipients.some(r => r.id === u.id);
                  return (
                    <label 
                      key={u.id}
                      className={`flex items-center p-4 rounded-2xl cursor-pointer border-2 transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-white dark:bg-gray-800 shadow-xl'
                          : `${currentTheme.border} ${currentTheme.surface} hover:border-blue-300`
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 font-black text-xs">
                            {u.name?.charAt(0)}
                          </div>
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                              <CheckCircle className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="truncate">
                          <p className={`text-xs font-black ${currentTheme.text} truncate`}>{u.name}</p>
                          <p className={`text-[10px] font-bold text-gray-400 truncate`}>{u.email}</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleUserToggle(u.id)}
                        className="hidden"
                      />
                    </label>
                  );
                  })
                )}
              </div>
            )}

            <div className="pt-8 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <button onClick={() => setCampaignStep(1)} className={`px-6 py-3 font-black text-xs uppercase tracking-widest ${currentTheme.textSecondary} flex items-center gap-2`}>
                <ChevronLeft className="w-5 h-5" />
                Change Template
              </button>
              <button
                onClick={() => setCampaignStep(3)}
                disabled={emailRecipients.length === 0}
                className={`px-10 py-4 ${currentColorScheme.primary} text-white rounded-2xl font-black shadow-xl shadow-blue-500/30 flex items-center gap-3 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100`}
              >
                CUSTOMIZE CONTENT
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Send */}
        {campaignStep === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
            {/* Left Sidebar: Global Variables */}
            <div className="lg:col-span-1 space-y-6">
              <div className={`${currentTheme.surface} p-6 rounded-3xl border ${currentTheme.border} shadow-sm`}>
                <h3 className={`text-sm font-black ${currentTheme.text} mb-6 uppercase tracking-widest flex items-center gap-2`}>
                  <Layout className="w-4 h-4 text-blue-500" />
                  GLOBAL DEFAULTS
                </h3>
                <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Subject Line</label>
                    <input
                      type="text"
                      value={emailData.subject}
                      onChange={(e) => setEmailData(p => ({ ...p, subject: e.target.value }))}
                      className={`w-full px-4 py-3 ${currentTheme.surfaceSecondary} rounded-xl border ${currentTheme.border} ${currentTheme.text} font-bold text-xs`}
                    />
                  </div>

                  {selectedTemplate?.variables?.filter(v => !['fullName', 'email'].includes(v.name)).map((v) => (
                    <div key={v.name}>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                        {v.name} {['workspaceName', 'appUrl', 'currentDate'].includes(v.name) && '(AUTO)'}
                      </label>
                      <input
                        type="text"
                        placeholder={v.example}
                        value={emailData.variables[v.name] || ''}
                        onChange={(e) => setEmailData(p => ({ ...p, variables: { ...p.variables, [v.name]: e.target.value } }))}
                        disabled={['workspaceName', 'appUrl', 'currentDate'].includes(v.name)}
                        className={`w-full px-4 py-3 ${currentTheme.surfaceSecondary} rounded-xl border ${currentTheme.border} ${currentTheme.text} text-xs ${
                          ['workspaceName', 'appUrl', 'currentDate'].includes(v.name) ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Recipient Overrides Selector */}
              <div className={`${currentTheme.surface} p-6 rounded-3xl border ${currentTheme.border} shadow-sm`}>
                <h3 className={`text-sm font-black ${currentTheme.text} mb-4 uppercase tracking-widest flex items-center gap-2`}>
                  <Users className="w-4 h-4 text-blue-500" />
                  RECIPIENTS ({emailRecipients.length})
                </h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-4">Click to edit individual data</p>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {emailRecipients.map((r, idx) => (
                    <button
                      key={r.id}
                      onClick={() => setActiveRecipientIndex(idx)}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                          activeRecipientIndex === idx 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' 
                            : `${currentTheme.border} hover:border-blue-300`
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {r.status === 'sending' ? (
                            <Clock className="w-4 h-4 text-blue-500 animate-spin shrink-0" />
                          ) : r.status === 'sent' ? (
                            <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                          ) : r.status === 'failed' ? (
                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className={`text-xs font-black ${currentTheme.text} truncate`}>{r.name}</p>
                            <p className="text-[9px] text-gray-400 font-bold truncate">{r.email}</p>
                          </div>
                        </div>
                        {Object.keys(r.variables).length > 0 && !r.status && (
                          <div className="w-2 h-2 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
                        )}
                      </button>

                  ))}
                </div>
              </div>
            </div>

            {/* Middle: Content Editor */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-black ${currentTheme.text}`}>Message Editor</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowHtmlEditor(!showHtmlEditor)}
                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all ${
                      showHtmlEditor ? 'bg-blue-500 text-white border-blue-500' : `${currentTheme.surface} ${currentTheme.text} ${currentTheme.border}`
                    }`}
                  >
                    {showHtmlEditor ? 'RICH TEXT' : 'HTML SOURCE'}
                  </button>
                  <button
                    onClick={() => setShowPreview(true)}
                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border ${currentTheme.surface} ${currentTheme.text} ${currentTheme.border}`}
                  >
                    PREVIEW
                  </button>
                </div>
              </div>

              <div className={`rounded-3xl border-2 ${currentTheme.border} overflow-hidden bg-white dark:bg-gray-900 shadow-inner min-h-[500px] flex flex-col`}>
                {showHtmlEditor ? (
                  <textarea
                    className="w-full flex-1 p-8 font-mono text-sm bg-transparent outline-none resize-none"
                    value={emailData.htmlContent}
                    onChange={(e) => setEmailData(p => ({ ...p, htmlContent: e.target.value }))}
                  />
                ) : (
                  <div
                    contentEditable
                    dangerouslySetInnerHTML={{ __html: emailData.htmlContent }}
                    onInput={(e) => setEmailData(p => ({ ...p, htmlContent: e.target.innerHTML }))}
                    className="w-full flex-1 p-10 outline-none prose prose-lg dark:prose-invert max-w-none"
                  />
                )}
              </div>

              <div className="flex justify-between items-center pt-8 border-t border-gray-100 dark:border-gray-800">
                <button onClick={() => setCampaignStep(2)} className={`px-6 py-3 font-black text-xs uppercase tracking-widest ${currentTheme.textSecondary} flex items-center gap-2`}>
                  <ChevronLeft className="w-5 h-5" />
                  Back to Recipients
                </button>
                <button
                  onClick={sendEmails}
                  disabled={isSending || emailRecipients.length === 0}
                  className={`px-12 py-5 ${currentColorScheme.primary} text-white rounded-2xl font-black shadow-2xl shadow-blue-500/40 flex items-center gap-4 transition-all hover:scale-105 active:scale-95 disabled:opacity-50`}
                >
                  {isSending ? (
                    <>
                      <Clock className="w-6 h-6 animate-spin" />
                      SENDING...
                    </>
                  ) : (
                    <>
                      <Send className="w-6 h-6" />
                      LAUNCH CAMPAIGN
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Sidebar: Recipient Overrides */}
            <div className="lg:col-span-1 space-y-6">
              <div className={`${currentTheme.surface} p-6 rounded-3xl border ${currentTheme.border} shadow-sm border-l-4 border-l-blue-500`}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xs">
                      {emailRecipients[activeRecipientIndex]?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <h4 className={`text-xs font-black ${currentTheme.text} truncate max-w-[120px]`}>
                        {emailRecipients[activeRecipientIndex]?.name || 'Select Recipient'}
                      </h4>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">INDIVIDUAL DATA</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => resetToAutoMapping(emailRecipients[activeRecipientIndex]?.id)}
                    title="Reset to Smart Mapping"
                    className="p-2 hover:bg-blue-50 text-blue-500 rounded-xl transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {selectedTemplate?.variables?.filter(v => !['workspaceName', 'appUrl', 'currentDate'].includes(v.name)).map((v) => {
                    const isSystemVar = ['fullName', 'email', 'candidateName', 'recipientEmail'].includes(v.name);
                    const isOverridden = emailRecipients[activeRecipientIndex]?.variables[v.name] && 
                                       emailRecipients[activeRecipientIndex]?.variables[v.name] !== getAutoVariables(emailRecipients[activeRecipientIndex], selectedTemplate)[v.name];

                    return (
                      <div key={v.name}>
                        <label className="flex items-center justify-between mb-1.5 ml-1">
                          <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{v.name}</span>
                          {!isOverridden && (
                            <span className="flex items-center gap-1 text-[8px] font-black text-green-500 uppercase">
                              <Sparkles className="w-2 h-2" />
                              Auto
                            </span>
                          )}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder={emailData.variables[v.name] || v.example}
                            value={emailRecipients[activeRecipientIndex]?.variables[v.name] || ''}
                            onChange={(e) => updateRecipientVariable(emailRecipients[activeRecipientIndex]?.id, v.name, e.target.value)}
                            className={`w-full px-4 py-3 ${currentTheme.surfaceSecondary} rounded-xl border-2 ${
                              isOverridden ? 'border-orange-500' : 'border-transparent'
                            } ${currentTheme.text} text-xs font-bold transition-all bg-gray-50/50 dark:bg-gray-900/50 focus:border-blue-500`}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {selectedTemplate?.variables?.filter(v => !['workspaceName', 'appUrl', 'currentDate'].includes(v.name)).length === 0 && (
                    <div className="py-10 text-center">
                      <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                      <p className="text-[10px] text-gray-400 font-bold uppercase px-4">No variables to map for this template</p>
                    </div>
                  )}
                </div>

                <div className="mt-8 p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/10 border border-dashed border-blue-200 dark:border-blue-900">
                  <p className="text-[9px] font-bold text-blue-600/60 dark:text-blue-400/60 uppercase leading-relaxed flex items-start gap-2">
                    <Sparkles className="w-3 h-3 mt-0.5" />
                    <span>The system is automatically pulling name and email from your input. Manually edit only if needed.</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${currentTheme.surface} rounded-[40px] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className={`px-10 py-6 border-b ${currentTheme.border} flex items-center justify-between`}>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                  <Eye className="w-6 h-6" />
                </div>
                <div>
                  <h3 className={`text-xl font-black ${currentTheme.text}`}>Email Preview</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    viewing as: {emailRecipients[activeRecipientIndex]?.name || 'Candidate'}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowPreview(false)} className={`p-3 ${currentTheme.surfaceSecondary} rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors`}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-10 overflow-y-auto flex-1 bg-gray-100 dark:bg-gray-950">
              <div className={`mb-8 p-6 rounded-3xl bg-white dark:bg-gray-900 border ${currentTheme.border} shadow-sm`}>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Subject</p>
                <p className={`text-lg font-black ${currentTheme.text}`}>{generatePreviewHtml().subject}</p>
              </div>

              <div className={`rounded-3xl border-2 ${currentTheme.border} p-10 bg-white min-h-[400px]`}>
                <div 
                  className="prose prose-lg max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: generatePreviewHtml().html }}
                />
              </div>
            </div>

            <div className={`px-10 py-8 border-t ${currentTheme.border} flex justify-end gap-4 bg-gray-50/50 dark:bg-gray-900/50`}>
              <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {emailRecipients.map((r, idx) => (
                  <button
                    key={r.id}
                    onClick={() => setActiveRecipientIndex(idx)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black whitespace-nowrap transition-all ${
                      activeRecipientIndex === idx 
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' 
                        : 'bg-gray-200 dark:bg-gray-800 text-gray-500'
                    }`}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
              <button onClick={() => setShowPreview(false)} className={`px-8 py-4 ${currentTheme.surfaceSecondary} ${currentTheme.text} rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-gray-800 transition-all`}>
                Close
              </button>
              <button
                onClick={sendEmails}
                className={`px-10 py-4 ${currentColorScheme.primary} text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/30 flex items-center gap-3 transition-all hover:scale-105 active:scale-95`}
              >
                <Send className="w-5 h-5" />
                Launch Now
              </button>
            </div>
          </div>
        </div>
      )}
    </ResponsivePageLayout>
  );
}
