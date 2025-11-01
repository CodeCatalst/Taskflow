import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate comprehensive Excel report with multiple sheets
 */
export const generateExcelReport = (tasks, analyticsData, filters) => {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Task Summary
  const taskSummaryData = tasks.map((task, index) => ({
    '#': index + 1,
    'Task Title': task.title,
    'Description': task.description || 'N/A',
    'Status': formatStatus(task.status),
    'Priority': formatPriority(task.priority),
    'Assigned To': task.assigned_to && task.assigned_to.length > 0
      ? task.assigned_to.map(u => u.full_name).join(', ')
      : 'Unassigned',
    'Team': task.team_id?.name || 'No Team',
    'Created By': task.created_by?.full_name || 'Unknown',
    'Created Date': formatDate(task.created_at),
    'Due Date': task.due_date ? formatDate(task.due_date) : 'No Due Date',
    'Is Overdue': isOverdue(task) ? 'Yes' : 'No',
    'Days Until Due': task.due_date ? calculateDaysUntilDue(task.due_date) : 'N/A',
  }));

  const taskSheet = XLSX.utils.json_to_sheet(taskSummaryData);
  
  // Set column widths
  taskSheet['!cols'] = [
    { wch: 5 },   // #
    { wch: 30 },  // Task Title
    { wch: 40 },  // Description
    { wch: 15 },  // Status
    { wch: 12 },  // Priority
    { wch: 25 },  // Assigned To
    { wch: 20 },  // Team
    { wch: 20 },  // Created By
    { wch: 15 },  // Created Date
    { wch: 15 },  // Due Date
    { wch: 12 },  // Is Overdue
    { wch: 15 },  // Days Until Due
  ];

  XLSX.utils.book_append_sheet(workbook, taskSheet, 'Task Summary');

  // Sheet 2: Status Distribution
  const statusData = analyticsData.statusDistribution.map(item => ({
    'Status': item.name,
    'Count': item.value,
    'Percentage': ((item.value / analyticsData.totalTasks) * 100).toFixed(2) + '%',
  }));
  const statusSheet = XLSX.utils.json_to_sheet(statusData);
  statusSheet['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, statusSheet, 'Status Distribution');

  // Sheet 3: Priority Distribution
  const priorityData = analyticsData.priorityDistribution.map(item => ({
    'Priority': item.name,
    'Count': item.value,
    'Percentage': ((item.value / analyticsData.totalTasks) * 100).toFixed(2) + '%',
  }));
  const prioritySheet = XLSX.utils.json_to_sheet(priorityData);
  prioritySheet['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, prioritySheet, 'Priority Distribution');

  // Sheet 4: Team Performance
  const teamPerformance = calculateTeamPerformance(tasks);
  const teamSheet = XLSX.utils.json_to_sheet(teamPerformance);
  teamSheet['!cols'] = [
    { wch: 25 },  // Team Name
    { wch: 12 },  // Total Tasks
    { wch: 12 },  // Completed
    { wch: 12 },  // In Progress
    { wch: 12 },  // Overdue
    { wch: 18 },  // Completion Rate
  ];
  XLSX.utils.book_append_sheet(workbook, teamSheet, 'Team Performance');

  // Sheet 4.5: Tasks by Team (Simple Count)
  if (analyticsData.teamDistribution && analyticsData.teamDistribution.length > 0) {
    const teamDistData = analyticsData.teamDistribution.map((item, index) => ({
      'Rank': index + 1,
      'Team Name': item.name,
      'Total Tasks': item.value,
      'Percentage': ((item.value / analyticsData.totalTasks) * 100).toFixed(2) + '%',
    }));
    const teamDistSheet = XLSX.utils.json_to_sheet(teamDistData);
    teamDistSheet['!cols'] = [
      { wch: 8 },   // Rank
      { wch: 30 },  // Team Name
      { wch: 15 },  // Total Tasks
      { wch: 15 },  // Percentage
    ];
    XLSX.utils.book_append_sheet(workbook, teamDistSheet, 'Tasks by Team');
  }

  // Sheet 5: User Performance
  const userPerformanceData = analyticsData.assigneePerformance.map(user => ({
    'User Name': user.name,
    'Total Tasks': user.total,
    'Completed': user.completed,
    'Overdue': user.overdue,
    'In Progress': user.total - user.completed - user.overdue,
    'Completion Rate': user.completionRate + '%',
    'Performance': user.completionRate >= 80 ? 'Excellent' : 
                   user.completionRate >= 60 ? 'Good' : 
                   user.completionRate >= 40 ? 'Average' : 'Needs Improvement',
  }));
  const userSheet = XLSX.utils.json_to_sheet(userPerformanceData);
  userSheet['!cols'] = [
    { wch: 25 },  // User Name
    { wch: 12 },  // Total Tasks
    { wch: 12 },  // Completed
    { wch: 12 },  // Overdue
    { wch: 12 },  // In Progress
    { wch: 18 },  // Completion Rate
    { wch: 18 },  // Performance
  ];
  XLSX.utils.book_append_sheet(workbook, userSheet, 'User Performance');

  // Sheet 6: Overdue Tasks
  const overdueTasks = tasks.filter(isOverdue).map((task, index) => ({
    '#': index + 1,
    'Task Title': task.title,
    'Priority': formatPriority(task.priority),
    'Assigned To': task.assigned_to && task.assigned_to.length > 0
      ? task.assigned_to.map(u => u.full_name).join(', ')
      : 'Unassigned',
    'Due Date': formatDate(task.due_date),
    'Days Overdue': Math.abs(calculateDaysUntilDue(task.due_date)),
    'Status': formatStatus(task.status),
  }));
  const overdueSheet = XLSX.utils.json_to_sheet(overdueTasks);
  overdueSheet['!cols'] = [
    { wch: 5 },   // #
    { wch: 30 },  // Task Title
    { wch: 12 },  // Priority
    { wch: 25 },  // Assigned To
    { wch: 15 },  // Due Date
    { wch: 15 },  // Days Overdue
    { wch: 15 },  // Status
  ];
  XLSX.utils.book_append_sheet(workbook, overdueSheet, 'Overdue Tasks');

  // Sheet 7: Summary Statistics
  const summaryStats = [
    { 'Metric': 'Total Tasks', 'Value': analyticsData.totalTasks },
    { 'Metric': 'Completed Tasks', 'Value': analyticsData.completedTasks },
    { 'Metric': 'In Progress Tasks', 'Value': analyticsData.inProgressTasks },
    { 'Metric': 'Overdue Tasks', 'Value': analyticsData.overdueTasks },
    { 'Metric': 'Completion Rate', 'Value': ((analyticsData.completedTasks / analyticsData.totalTasks) * 100).toFixed(2) + '%' },
    { 'Metric': 'Overdue Rate', 'Value': ((analyticsData.overdueTasks / analyticsData.totalTasks) * 100).toFixed(2) + '%' },
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryStats);
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary Statistics');

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `TaskFlow_Report_${timestamp}.xlsx`;

  // Write file
  XLSX.writeFile(workbook, filename);
};

/**
 * Generate comprehensive PDF report with tables
 */
export const generatePDFReport = (tasks, analyticsData, filters, user) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Header
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text('TaskFlow Analytics Report', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });
    doc.text(`Generated by: ${user?.full_name || 'Unknown'}`, pageWidth / 2, yPosition + 5, { align: 'center' });

    yPosition += 15;

    // Summary Statistics Box
    doc.setFillColor(59, 130, 246); // Blue
    doc.rect(15, yPosition, pageWidth - 30, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Summary Statistics', pageWidth / 2, yPosition + 5.5, { align: 'center' });
    
    yPosition += 13;
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');

    const totalTasks = analyticsData.totalTasks || 0;
    const completedTasks = analyticsData.completedTasks || 0;
    const inProgressTasks = analyticsData.inProgressTasks || 0;
    const overdueTasks = analyticsData.overdueTasks || 0;
    
    const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : '0.00';
    const overdueRate = totalTasks > 0 ? ((overdueTasks / totalTasks) * 100).toFixed(2) : '0.00';

    const summaryData = [
      ['Total Tasks', totalTasks.toString()],
      ['Completed Tasks', completedTasks.toString()],
      ['In Progress Tasks', inProgressTasks.toString()],
      ['Overdue Tasks', overdueTasks.toString()],
      ['Completion Rate', completionRate + '%'],
      ['Overdue Rate', overdueRate + '%'],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
      margin: { left: 15, right: 15 },
    });

  yPosition = doc.lastAutoTable.finalY + 15;

  // Status Distribution
  if (analyticsData.statusDistribution && analyticsData.statusDistribution.length > 0) {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFillColor(59, 130, 246);
    doc.rect(15, yPosition, pageWidth - 30, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Status Distribution', pageWidth / 2, yPosition + 5.5, { align: 'center' });
    
    yPosition += 13;
    doc.setTextColor(0, 0, 0);

    const statusData = analyticsData.statusDistribution.map(item => [
      item.name,
      item.value.toString(),
      totalTasks > 0 ? ((item.value / totalTasks) * 100).toFixed(2) + '%' : '0%',
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Status', 'Count', 'Percentage']],
      body: statusData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
      margin: { left: 15, right: 15 },
    });

    yPosition = doc.lastAutoTable.finalY + 15;
  }

  // Priority Distribution
  if (analyticsData.priorityDistribution && analyticsData.priorityDistribution.length > 0) {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFillColor(59, 130, 246);
    doc.rect(15, yPosition, pageWidth - 30, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Priority Distribution', pageWidth / 2, yPosition + 5.5, { align: 'center' });
    
    yPosition += 13;
    doc.setTextColor(0, 0, 0);

    const priorityData = analyticsData.priorityDistribution.map(item => [
      item.name,
      item.value.toString(),
      totalTasks > 0 ? ((item.value / totalTasks) * 100).toFixed(2) + '%' : '0%',
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Priority', 'Count', 'Percentage']],
      body: priorityData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
      margin: { left: 15, right: 15 },
    });
  }

  // New page for User Performance
  doc.addPage();
  yPosition = 20;

  doc.setFillColor(59, 130, 246);
  doc.rect(15, yPosition, pageWidth - 30, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('User Performance', pageWidth / 2, yPosition + 5.5, { align: 'center' });
  
  yPosition += 13;
  doc.setTextColor(0, 0, 0);

  const userPerformanceData = analyticsData.assigneePerformance.map(user => [
    user.name,
    user.total.toString(),
    user.completed.toString(),
    user.overdue.toString(),
    user.completionRate + '%',
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['User', 'Total', 'Completed', 'Overdue', 'Rate']],
    body: userPerformanceData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
    margin: { left: 15, right: 15 },
  });

  yPosition = doc.lastAutoTable.finalY + 15;

  // Team Performance
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  const teamPerformance = calculateTeamPerformance(tasks);
  
  if (teamPerformance.length > 0) {
    doc.setFillColor(59, 130, 246);
    doc.rect(15, yPosition, pageWidth - 30, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Team Performance', pageWidth / 2, yPosition + 5.5, { align: 'center' });
    
    yPosition += 13;
    doc.setTextColor(0, 0, 0);

    const teamData = teamPerformance.map(team => [
      team['Team Name'],
      team['Total Tasks'].toString(),
      team['Completed'].toString(),
      team['Overdue'].toString(),
      team['Completion Rate'],
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Team', 'Total', 'Completed', 'Overdue', 'Rate']],
      body: teamData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
      margin: { left: 15, right: 15 },
    });

    yPosition = doc.lastAutoTable.finalY + 15;
  }

  // Tasks by Team (Simple Count)
  if (analyticsData.teamDistribution && analyticsData.teamDistribution.length > 0) {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFillColor(16, 185, 129); // Green
    doc.rect(15, yPosition, pageWidth - 30, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Tasks by Team', pageWidth / 2, yPosition + 5.5, { align: 'center' });
    
    yPosition += 13;
    doc.setTextColor(0, 0, 0);

    const teamDistData = analyticsData.teamDistribution.map((item, index) => [
      (index + 1).toString(),
      item.name,
      item.value.toString(),
      totalTasks > 0 ? ((item.value / totalTasks) * 100).toFixed(2) + '%' : '0%',
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Rank', 'Team Name', 'Total Tasks', 'Percentage']],
      body: teamDistData,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129], fontStyle: 'bold' },
      margin: { left: 15, right: 15 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 20 },
        1: { cellWidth: 80 },
        2: { halign: 'center', cellWidth: 30 },
        3: { halign: 'center', cellWidth: 30 },
      },
    });
  }

  // Overdue Tasks (if any)
  const overdueTasksList = tasks.filter(isOverdue);
  
  if (overdueTasksList.length > 0) {
    doc.addPage();
    yPosition = 20;

    doc.setFillColor(239, 68, 68); // Red
    doc.rect(15, yPosition, pageWidth - 30, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Overdue Tasks', pageWidth / 2, yPosition + 5.5, { align: 'center' });
    
    yPosition += 13;
    doc.setTextColor(0, 0, 0);

    const overdueData = overdueTasksList.slice(0, 20).map(task => [
      task.title.substring(0, 30) + (task.title.length > 30 ? '...' : ''),
      formatPriority(task.priority),
      task.assigned_to && task.assigned_to.length > 0
        ? task.assigned_to[0].full_name
        : 'Unassigned',
      formatDate(task.due_date),
      Math.abs(calculateDaysUntilDue(task.due_date)).toString(),
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Task', 'Priority', 'Assigned To', 'Due Date', 'Days Overdue']],
      body: overdueData,
      theme: 'striped',
      headStyles: { fillColor: [239, 68, 68], fontStyle: 'bold' },
      margin: { left: 15, right: 15 },
      styles: { fontSize: 9 },
    });

    if (overdueTasksList.length > 20) {
      yPosition = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(10);
      doc.text(`... and ${overdueTasksList.length - 20} more overdue tasks`, 15, yPosition);
    }
  }

  // Footer on each page
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Page ${i} of ${pageCount} | TaskFlow Report | ${new Date().toLocaleDateString()}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save PDF
  const timestamp = new Date().toISOString().slice(0, 10);
  doc.save(`TaskFlow_Report_${timestamp}.pdf`);
  } catch (error) {
    console.error('Error in generatePDFReport:', error);
    throw error;
  }
};

// Helper functions
function formatStatus(status) {
  return status.replace('_', ' ').toUpperCase();
}

function formatPriority(priority) {
  return priority.toUpperCase();
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function isOverdue(task) {
  if (!task.due_date || task.status === 'done') return false;
  return new Date(task.due_date) < new Date();
}

function calculateDaysUntilDue(dueDate) {
  if (!dueDate) return 'N/A';
  const now = new Date();
  const due = new Date(dueDate);
  const diffTime = due - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function calculateTeamPerformance(tasks) {
  const teamStats = {};

  tasks.forEach(task => {
    const teamName = task.team_id?.name || 'No Team';
    
    if (!teamStats[teamName]) {
      teamStats[teamName] = {
        total: 0,
        completed: 0,
        inProgress: 0,
        overdue: 0,
      };
    }

    teamStats[teamName].total++;
    if (task.status === 'done') teamStats[teamName].completed++;
    if (task.status === 'in_progress') teamStats[teamName].inProgress++;
    if (isOverdue(task)) teamStats[teamName].overdue++;
  });

  return Object.entries(teamStats).map(([teamName, stats]) => ({
    'Team Name': teamName,
    'Total Tasks': stats.total,
    'Completed': stats.completed,
    'In Progress': stats.inProgress,
    'Overdue': stats.overdue,
    'Completion Rate': stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(2) + '%' : '0%',
  }));
}
