import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import ResponsivePageLayout from '../components/layouts/ResponsivePageLayout';
import ResponsiveCard from '../components/layouts/ResponsiveCard';
import ConfirmModal from '../components/modals/ConfirmModal';

/**
 * Email Center - Professional HR Email Management Interface
 * Handles recipient definition, intent selection, variable resolution, and email dispatch
 */
const EmailCenter = () => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();

  // State management
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [recipientMode, setRecipientMode] = useState('USER'); // USER or EXTERNAL
  const [recipients, setRecipients] = useState([]);
  const [variables, setVariables] = useState({});
  const [previewContent, setPreviewContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Form states
  const [manualRecipient, setManualRecipient] = useState({ name: '', email: '' });
  const [csvFile, setCsvFile] = useState(null);

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, [currentWorkspace]);

  const loadTemplates = async () => {
    try {
      const response = await axios.get('/api/email-templates', {
        params: { category: 'hiring,interview,onboarding,engagement,exit,system' }
      });
      setTemplates(response.data.templates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    // Initialize variables object with empty values
    const initialVars = {};
    template.variables.forEach(variable => {
      initialVars[variable.name] = '';
    });
    setVariables(initialVars);
  };

  const handleVariableChange = (name, value) => {
    setVariables(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addManualRecipient = () => {
    if (manualRecipient.name && manualRecipient.email) {
      setRecipients(prev => [...prev, {
        ...manualRecipient,
        source: 'EXTERNAL',
        id: Date.now() // temporary ID
      }]);
      setManualRecipient({ name: '', email: '' });
    }
  };

  const removeRecipient = (index) => {
    setRecipients(prev => prev.filter((_, i) => i !== index));
  };

  const handleCsvUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCsvFile(file);
      // TODO: Parse CSV and add to recipients
    }
  };

  const generatePreview = async () => {
    if (!selectedTemplate) return;

    try {
      // Replace variables in template content
      let content = selectedTemplate.htmlContent;
      Object.entries(variables).forEach(([key, value]) => {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), value || `[${key}]`);
      });
      setPreviewContent(content);
    } catch (error) {
      console.error('Preview generation failed:', error);
    }
  };

  const sendTestEmail = async () => {
    if (!selectedTemplate || !user?.email) return;

    setIsLoading(true);
    try {
      // Send test email to current user
      const response = await axios.post('/api/email-templates/test-send', {
        templateId: selectedTemplate._id,
        variables,
        testRecipient: user.email
      });

      alert('Test email sent successfully!');
    } catch (error) {
      console.error('Test send failed:', error);
      alert('Failed to send test email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEmails = async () => {
    if (!selectedTemplate || recipients.length === 0) return;

    setIsLoading(true);
    try {
      const response = await axios.post('/api/email-templates/bulk-send', {
        templateId: selectedTemplate._id,
        variables,
        recipients
      });

      alert(`Emails sent successfully to ${response.data.sentCount} recipients!`);
      // Reset form
      setRecipients([]);
      setSelectedTemplate(null);
      setVariables({});
      setPreviewContent('');
    } catch (error) {
      console.error('Bulk send failed:', error);
      alert('Failed to send emails');
    } finally {
      setIsLoading(false);
      setShowConfirmModal(false);
    }
  };

  const validateForm = () => {
    if (!selectedTemplate) return false;
    if (recipients.length === 0) return false;

    // Check required variables
    const requiredVars = selectedTemplate.variables.filter(v => v.required);
    return requiredVars.every(variable => variables[variable.name]?.trim());
  };

  return (
    <ResponsivePageLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Email Center
          </h1>
        </div>

        {/* Template Selection */}
        <ResponsiveCard title="Email Intent">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Email Type
              </label>
              <select
                value={selectedTemplate?._id || ''}
                onChange={(e) => {
                  const template = templates.find(t => t._id === e.target.value);
                  handleTemplateSelect(template);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose an email type...</option>
                {templates.map(template => (
                  <option key={template._id} value={template._id}>
                    {template.name} ({template.category})
                  </option>
                ))}
              </select>
            </div>

            {selectedTemplate && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 dark:text-blue-100">
                  {selectedTemplate.name}
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {selectedTemplate.subject}
                </p>
              </div>
            )}
          </div>
        </ResponsiveCard>

        {/* Recipient Definition */}
        <ResponsiveCard title="Recipients">
          <div className="space-y-4">
            {/* Mode Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recipient Type
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="USER"
                    checked={recipientMode === 'USER'}
                    onChange={(e) => setRecipientMode(e.target.value)}
                    className="mr-2"
                  />
                  TaskFlow Users
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="EXTERNAL"
                    checked={recipientMode === 'EXTERNAL'}
                    onChange={(e) => setRecipientMode(e.target.value)}
                    className="mr-2"
                  />
                  External Contacts
                </label>
              </div>
            </div>

            {recipientMode === 'EXTERNAL' && (
              <>
                {/* Manual Entry */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={manualRecipient.name}
                    onChange={(e) => setManualRecipient(prev => ({ ...prev, name: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={manualRecipient.email}
                    onChange={(e) => setManualRecipient(prev => ({ ...prev, email: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={addManualRecipient}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Add Recipient
                  </button>
                </div>

                {/* CSV Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Or upload CSV file
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </>
            )}

            {/* Recipients List */}
            {recipients.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Recipients ({recipients.length})
                </h4>
                {recipients.map((recipient, index) => (
                  <div key={recipient.id || index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <div>
                      <span className="font-medium">{recipient.name}</span>
                      <span className="text-gray-500 ml-2">({recipient.email})</span>
                      <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        {recipient.source}
                      </span>
                    </div>
                    <button
                      onClick={() => removeRecipient(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ResponsiveCard>

        {/* Variable Resolver */}
        {selectedTemplate && (
          <ResponsiveCard title="Email Variables">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedTemplate.variables.map((variable) => (
                <div key={variable.name}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {variable.name} {variable.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={variables[variable.name] || ''}
                    onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                    placeholder={variable.example}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">{variable.description}</p>
                </div>
              ))}
            </div>
          </ResponsiveCard>
        )}

        {/* Preview & Actions */}
        {selectedTemplate && (
          <ResponsiveCard title="Preview & Send">
            <div className="space-y-4">
              <div className="flex space-x-4">
                <button
                  onClick={generatePreview}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Generate Preview
                </button>
                <button
                  onClick={sendTestEmail}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {isLoading ? 'Sending...' : 'Send Test Email'}
                </button>
              </div>

              {previewContent && (
                <div className="border rounded-lg p-4 bg-white dark:bg-gray-800">
                  <h4 className="font-medium mb-2">Email Preview</h4>
                  <div
                    className="text-sm"
                    dangerouslySetInnerHTML={{ __html: previewContent }}
                  />
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={!validateForm() || isLoading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending...' : `Send to ${recipients.length} Recipients`}
                </button>
              </div>
            </div>
          </ResponsiveCard>
        )}

        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleSendEmails}
          title="Send Emails"
          message={`Are you sure you want to send "${selectedTemplate?.name}" to ${recipients.length} recipients?`}
          confirmText="Send Emails"
          cancelText="Cancel"
        />
      </div>
    </ResponsivePageLayout>
  );
};

export default EmailCenter;