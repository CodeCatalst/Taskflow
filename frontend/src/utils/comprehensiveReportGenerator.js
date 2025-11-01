import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate comprehensive PDF report with charts and tables
 * @param {Array} tasks - All tasks
 * @param {Object} analyticsData - Analytics data with distributions
 * @param {Object} filters - Applied filters
 * @param {Object} user - Current user
 * @param {String} reportType - 'daily', 'weekly', 'monthly', or 'all'
 */
export const generateComprehensivePDFReport = (tasks, analyticsData, filters, user, reportType = 'all') => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Filter tasks based on report type
    const filteredTasks = filterTasksByDateRange(tasks, reportType);
    const filteredAnalytics = recalculateAnalytics(filteredTasks);
    
    let yPosition = 20;

    // ========== COVER PAGE ==========
    addCoverPage(doc, reportType, user, filteredTasks.length);
    
    // ========== PAGE 1: CHARTS & VISUALIZATIONS ==========
    doc.addPage();
    yPosition = 20;
    
    // Title
    doc.setFillColor(59, 130, 246);
    doc.rect(0, yPosition - 5, pageWidth, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Executive Summary - Visual Analytics', pageWidth / 2, yPosition + 3, { align: 'center' });
    yPosition += 20;
    doc.setTextColor(0, 0, 0);
    
    // Draw charts as visual representations
    yPosition = drawStatusPieChart(doc, filteredAnalytics, 15, yPosition);
    yPosition = drawPriorityBarChart(doc, filteredAnalytics, 15, yPosition + 10);
    
    // ========== PAGE 2: SUMMARY STATISTICS ==========
    doc.addPage();
    yPosition = 20;
    
    addSectionHeader(doc, 'Summary Statistics', yPosition);
    yPosition += 15;
    
    const summaryData = generateSummaryData(filteredAnalytics, reportType);
    autoTable(doc, {
      startY: yPosition,
      head: [['Metric', 'Value', 'Details']],
      body: summaryData,
      theme: 'grid',
      headStyles: { 
        fillColor: [59, 130, 246], 
        fontStyle: 'bold', 
        fontSize: 11,
        halign: 'center'
      },
      styles: { 
        fontSize: 10, 
        cellPadding: 5,
        valign: 'middle'
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60, halign: 'left' },
        1: { halign: 'center', cellWidth: 30, fontStyle: 'bold', fontSize: 12 },
        2: { halign: 'center', cellWidth: 60 }
      },
      margin: { left: 15, right: 15 },
    });
    
    yPosition = doc.lastAutoTable.finalY + 15;
    
    // Key Performance Indicators
    if (yPosition > pageHeight - 80) {
      doc.addPage();
      yPosition = 20;
    }
    
    addSectionHeader(doc, 'Key Performance Indicators', yPosition);
    yPosition += 15;
    
    drawKPIBoxes(doc, filteredAnalytics, yPosition);
    
    // ========== PAGE 3: STATUS & PRIORITY DISTRIBUTION ==========
    doc.addPage();
    yPosition = 20;
    
    addSectionHeader(doc, 'Task Distribution Analysis', yPosition);
    yPosition += 15;
    
    if (filteredAnalytics.statusDistribution && filteredAnalytics.statusDistribution.length > 0) {
      const statusData = filteredAnalytics.statusDistribution.map(item => [
        item.name,
        item.value.toString(),
        ((item.value / filteredAnalytics.totalTasks) * 100).toFixed(1) + '%',
        getStatusIndicator(item.name)
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Status', 'Count', 'Percentage', 'Trend']],
        body: statusData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
        styles: { fontSize: 10 },
        margin: { left: 15, right: 15 },
      });
      
      yPosition = doc.lastAutoTable.finalY + 15;
    }
    
    if (yPosition > pageHeight - 70) {
      doc.addPage();
      yPosition = 20;
    } else {
      yPosition += 5;
    }
    
    if (filteredAnalytics.priorityDistribution && filteredAnalytics.priorityDistribution.length > 0) {
      const priorityData = filteredAnalytics.priorityDistribution.map(item => [
        item.name,
        item.value.toString(),
        ((item.value / filteredAnalytics.totalTasks) * 100).toFixed(1) + '%',
        getPriorityIndicator(item.name)
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Priority', 'Count', 'Percentage', 'Level']],
        body: priorityData,
        theme: 'striped',
        headStyles: { fillColor: [245, 158, 11], fontStyle: 'bold' },
        styles: { fontSize: 10 },
        margin: { left: 15, right: 15 },
      });
    }
    
    // ========== PAGE 4: TEAM PERFORMANCE ==========
    const teamPerformance = calculateTeamPerformance(filteredTasks);
    if (teamPerformance.length > 0) {
      doc.addPage();
      yPosition = 20;
      
      addSectionHeader(doc, 'Team Performance Analysis', yPosition);
      yPosition += 15;
      
      const teamData = teamPerformance.map(team => [
        team['Team Name'],
        team['Total Tasks'].toString(),
        team['Completed'].toString(),
        team['In Progress'].toString(),
        team['Overdue'].toString(),
        team['Completion Rate'],
        getPerformanceRating(parseFloat(team['Completion Rate']))
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Team', 'Total', 'Done', 'Progress', 'Overdue', 'Rate', 'Rating']],
        body: teamData,
        theme: 'grid',
        headStyles: { 
          fillColor: [16, 185, 129], 
          fontStyle: 'bold', 
          fontSize: 10,
          halign: 'center'
        },
        styles: { 
          fontSize: 9, 
          cellPadding: 4,
          valign: 'middle'
        },
        columnStyles: {
          0: { cellWidth: 52, fontStyle: 'bold' },  // Team
          1: { cellWidth: 20, halign: 'center' },  // Total
          2: { cellWidth: 20, halign: 'center', textColor: [16, 185, 129] },  // Done
          3: { cellWidth: 23, halign: 'center', textColor: [59, 130, 246] },  // Progress
          4: { cellWidth: 22, halign: 'center', textColor: [239, 68, 68] },  // Overdue
          5: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },  // Rate
          6: { fontStyle: 'bold', halign: 'center', cellWidth: 25 }  // Rating
        },
        margin: { left: 15, right: 15 },
      });

      // Add Tasks by Team count on the same page
      yPosition = doc.lastAutoTable.finalY + 20;

      if (yPosition > 220 || !filteredAnalytics.teamDistribution) {
        // Move to next section if no space or no data
      } else if (filteredAnalytics.teamDistribution && filteredAnalytics.teamDistribution.length > 0) {
        addSectionHeader(doc, 'Tasks by Team Distribution', yPosition);
        yPosition += 15;

        const teamDistData = filteredAnalytics.teamDistribution.map((item, index) => [
          (index + 1).toString(),
          item.name,
          item.value.toString(),
          filteredAnalytics.totalTasks > 0 ? ((item.value / filteredAnalytics.totalTasks) * 100).toFixed(1) + '%' : '0%',
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Rank', 'Team Name', 'Tasks', 'Share']],
          body: teamDistData,
          theme: 'striped',
          headStyles: { 
            fillColor: [16, 185, 129], 
            fontStyle: 'bold', 
            fontSize: 10,
            halign: 'center'
          },
          styles: { 
            fontSize: 9, 
            cellPadding: 4,
            valign: 'middle'
          },
          columnStyles: {
            0: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },  // Rank
            1: { cellWidth: 90, fontStyle: 'bold' },  // Team Name
            2: { cellWidth: 25, halign: 'center' },  // Tasks
            3: { cellWidth: 25, halign: 'center', fontStyle: 'bold' }  // Share
          },
          margin: { left: 15, right: 15 },
        });
      }
    }
    
    // ========== PAGE 5: USER PERFORMANCE ==========
    if (filteredAnalytics.assigneePerformance && filteredAnalytics.assigneePerformance.length > 0) {
      doc.addPage();
      yPosition = 20;
      
      addSectionHeader(doc, 'Individual Performance Report', yPosition);
      yPosition += 15;
      
      const userData = filteredAnalytics.assigneePerformance.map(user => [
        user.name,
        user.total.toString(),
        user.completed.toString(),
        user.overdue.toString(),
        (user.total - user.completed - user.overdue).toString(),
        user.completionRate + '%',
        getPerformanceRating(user.completionRate)
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['User', 'Total', 'Done', 'Overdue', 'Pending', 'Rate', 'Rating']],
        body: userData,
        theme: 'striped',
        headStyles: { 
          fillColor: [139, 92, 246], 
          fontStyle: 'bold', 
          fontSize: 10,
          halign: 'center'
        },
        styles: { 
          fontSize: 9, 
          cellPadding: 4,
          valign: 'middle'
        },
        columnStyles: {
          0: { cellWidth: 52, fontStyle: 'bold' },  // User
          1: { cellWidth: 20, halign: 'center' },  // Total
          2: { cellWidth: 20, halign: 'center', textColor: [16, 185, 129] },  // Done
          3: { cellWidth: 22, halign: 'center', textColor: [239, 68, 68] },  // Overdue
          4: { cellWidth: 22, halign: 'center' },  // Pending
          5: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },  // Rate
          6: { fontStyle: 'bold', halign: 'center', cellWidth: 26 }  // Rating
        },
        margin: { left: 15, right: 15 },
      });
    }
    
    // ========== PAGE 6: OVERDUE TASKS (CRITICAL) ==========
    const overdueTasks = filteredTasks.filter(isOverdue);
    
    if (overdueTasks.length > 0) {
      doc.addPage();
      yPosition = 20;
      
      // Red header for critical section
      doc.setFillColor(239, 68, 68);
      doc.rect(0, yPosition - 5, pageWidth, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('CRITICAL: Overdue Tasks', pageWidth / 2, yPosition + 3, { align: 'center' });
      yPosition += 20;
      doc.setTextColor(0, 0, 0);
      
      const overdueData = overdueTasks.slice(0, 30).map(task => [
        task.title.substring(0, 40) + (task.title.length > 40 ? '...' : ''),
        formatPriority(task.priority),
        task.assigned_to && task.assigned_to.length > 0
          ? task.assigned_to[0].full_name.substring(0, 18)
          : 'Unassigned',
        formatDate(task.due_date),
        Math.abs(calculateDaysUntilDue(task.due_date)).toString() + ' days',
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Task', 'Priority', 'Assigned To', 'Due Date', 'Days Overdue']],
        body: overdueData,
        theme: 'grid',
        headStyles: { 
          fillColor: [239, 68, 68], 
          fontStyle: 'bold', 
          fontSize: 10,
          halign: 'center'
        },
        styles: { 
          fontSize: 9, 
          cellPadding: 4,
          valign: 'middle'
        },
        columnStyles: {
          0: { cellWidth: 70 },  // Task
          1: { halign: 'center', fontStyle: 'bold', cellWidth: 25 },  // Priority
          2: { cellWidth: 35, halign: 'left' },  // Assigned
          3: { halign: 'center', cellWidth: 28 },  // Due Date
          4: { halign: 'center', textColor: [239, 68, 68], fontStyle: 'bold', cellWidth: 32 }  // Days Overdue
        },
        margin: { left: 15, right: 15 },
      });
      
      if (overdueTasks.length > 30) {
        yPosition = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(10);
        doc.setTextColor(239, 68, 68);
        doc.setFont(undefined, 'bold');
        doc.text(`... and ${overdueTasks.length - 30} more overdue tasks requiring immediate attention`, 15, yPosition);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'normal');
      }
    }
    
    // ========== PAGE 7: DETAILED TASK LIST ==========
    doc.addPage();
    yPosition = 20;
    
    addSectionHeader(doc, 'Detailed Task Breakdown', yPosition);
    yPosition += 15;
    
    const taskData = filteredTasks.slice(0, 50).map((task, index) => [
      (index + 1).toString(),
      task.title.substring(0, 35) + (task.title.length > 35 ? '...' : ''),
      formatStatus(task.status),
      formatPriority(task.priority),
      task.assigned_to && task.assigned_to.length > 0
        ? task.assigned_to[0].full_name.substring(0, 16)
        : 'Unassigned',
      task.due_date ? formatDate(task.due_date) : 'No date',
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['#', 'Task Title', 'Status', 'Priority', 'Assignee', 'Due Date']],
      body: taskData,
      theme: 'grid',
      headStyles: { 
        fillColor: [59, 130, 246], 
        fontStyle: 'bold', 
        fontSize: 10,
        halign: 'center'
      },
      styles: { 
        fontSize: 9,
        cellPadding: 4,
        valign: 'middle'
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 62 },
        2: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
        3: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
        4: { cellWidth: 32, halign: 'left' },
        5: { cellWidth: 26, halign: 'center' }
      },
      margin: { left: 15, right: 15 },
    });
    
    if (filteredTasks.length > 50) {
      yPosition = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(10);
      doc.text(`... and ${filteredTasks.length - 50} more tasks (see Excel export for complete list)`, 15, yPosition);
    }
    
    // ========== FOOTER ON ALL PAGES ==========
    addFootersToAllPages(doc, reportType);
    
    // ========== SAVE PDF ==========
    const timestamp = new Date().toISOString().slice(0, 10);
    const reportTypeLabel = reportType === 'all' ? 'Full' : reportType.charAt(0).toUpperCase() + reportType.slice(1);
    doc.save(`TaskFlow_${reportTypeLabel}_Report_${timestamp}.pdf`);
    
  } catch (error) {
    console.error('Error in generateComprehensivePDFReport:', error);
    throw error;
  }
};

// ========== HELPER FUNCTIONS ==========

function addCoverPage(doc, reportType, user, taskCount) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Background gradient effect (simulated with rectangles)
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, pageHeight / 3, 'F');
  doc.setFillColor(37, 99, 235);
  doc.rect(0, pageHeight / 3, pageWidth, pageHeight / 3, 'F');
  doc.setFillColor(29, 78, 216);
  doc.rect(0, (pageHeight / 3) * 2, pageWidth, pageHeight / 3, 'F');
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(32);
  doc.setFont(undefined, 'bold');
  doc.text('TaskFlow', pageWidth / 2, 60, { align: 'center' });
  
  doc.setFontSize(24);
  doc.text('Analytics Report', pageWidth / 2, 75, { align: 'center' });
  
  // Report Type
  doc.setFontSize(18);
  doc.setFont(undefined, 'normal');
  const reportLabel = reportType === 'all' ? 'Complete Overview' : 
                      reportType === 'daily' ? 'Daily Report' :
                      reportType === 'weekly' ? 'Weekly Report' : 'Monthly Report';
  doc.text(reportLabel, pageWidth / 2, 95, { align: 'center' });
  
  // Info box
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(30, 120, pageWidth - 60, 80, 5, 5, 'F');
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Report Details', pageWidth / 2, 135, { align: 'center' });
  
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 150, { align: 'center' });
  doc.text(`Generated By: ${user?.full_name || 'System'}`, pageWidth / 2, 160, { align: 'center' });
  doc.text(`Total Tasks Analyzed: ${taskCount}`, pageWidth / 2, 170, { align: 'center' });
  doc.text(`Report Period: ${getReportPeriodLabel(reportType)}`, pageWidth / 2, 180, { align: 'center' });
  
  // Footer note
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Confidential - For Internal Use Only', pageWidth / 2, pageHeight - 20, { align: 'center' });
}

function addSectionHeader(doc, title, yPosition) {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(59, 130, 246);
  doc.rect(15, yPosition - 3, pageWidth - 30, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(title, pageWidth / 2, yPosition + 4, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'normal');
}

function drawStatusPieChart(doc, analytics, x, y) {
  const chartSize = 80;
  const centerX = x + chartSize / 2 + 10;
  const centerY = y + chartSize / 2;
  const radius = chartSize / 2 - 10;
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Status Distribution', centerX, y - 5, { align: 'center' });
  doc.setFont(undefined, 'normal');
  
  if (!analytics.statusDistribution || analytics.statusDistribution.length === 0) {
    doc.setFontSize(10);
    doc.text('No data available', centerX, centerY, { align: 'center' });
    return y + chartSize + 10;
  }
  
  // Draw pie chart segments
  let currentAngle = 0;
  const colors = [
    [107, 114, 128],  // gray
    [59, 130, 246],   // blue
    [245, 158, 11],   // yellow
    [16, 185, 129],   // green
    [239, 68, 68],    // red
  ];
  
  analytics.statusDistribution.forEach((item, index) => {
    const sliceAngle = (item.value / analytics.totalTasks) * 360;
    const color = colors[index % colors.length];
    
    doc.setFillColor(color[0], color[1], color[2]);
    drawPieSlice(doc, centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    
    currentAngle += sliceAngle;
  });
  
  // Legend
  let legendY = y + 10;
  const legendX = centerX + radius + 30;
  analytics.statusDistribution.forEach((item, index) => {
    const color = colors[index % colors.length];
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(legendX, legendY - 3, 8, 8, 'F');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(`${item.name}: ${item.value} (${((item.value / analytics.totalTasks) * 100).toFixed(1)}%)`, legendX + 12, legendY + 3);
    legendY += 10;
  });
  
  return Math.max(centerY + radius + 10, legendY);
}

function drawPriorityBarChart(doc, analytics, x, y) {
  if (!analytics.priorityDistribution || analytics.priorityDistribution.length === 0) {
    return y;
  }
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Priority Distribution', x + 80, y, { align: 'center' });
  doc.setFont(undefined, 'normal');
  y += 10;
  
  const maxValue = Math.max(...analytics.priorityDistribution.map(item => item.value));
  const barHeight = 12;
  const maxBarWidth = 120;
  const colors = {
    'LOW': [16, 185, 129],
    'MEDIUM': [245, 158, 11],
    'HIGH': [249, 115, 22],
    'URGENT': [239, 68, 68]
  };
  
  analytics.priorityDistribution.forEach((item) => {
    const barWidth = (item.value / maxValue) * maxBarWidth;
    const color = colors[item.name] || [107, 114, 128];
    
    // Label
    doc.setFontSize(9);
    doc.text(item.name, x, y + 8);
    
    // Bar
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(x + 30, y, barWidth, barHeight, 'F');
    
    // Value
    doc.setFontSize(8);
    doc.text(`${item.value} (${((item.value / analytics.totalTasks) * 100).toFixed(1)}%)`, x + 32 + barWidth, y + 8);
    
    y += barHeight + 5;
  });
  
  return y;
}

function drawKPIBoxes(doc, analytics, y) {
  const boxWidth = 40;
  const boxHeight = 25;
  const spacing = 10;
  const startX = 20;
  
  const kpis = [
    { label: 'Total', value: analytics.totalTasks, color: [59, 130, 246] },
    { label: 'Completed', value: analytics.completedTasks, color: [16, 185, 129] },
    { label: 'In Progress', value: analytics.inProgressTasks, color: [245, 158, 11] },
    { label: 'Overdue', value: analytics.overdueTasks, color: [239, 68, 68] },
  ];
  
  let xPos = startX;
  kpis.forEach((kpi) => {
    // Box
    doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.roundedRect(xPos, y, boxWidth, boxHeight, 3, 3, 'F');
    
    // Value
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(kpi.value.toString(), xPos + boxWidth / 2, y + 13, { align: 'center' });
    
    // Label
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text(kpi.label, xPos + boxWidth / 2, y + 21, { align: 'center' });
    
    xPos += boxWidth + spacing;
  });
  
  doc.setTextColor(0, 0, 0);
}

function drawPieSlice(doc, centerX, centerY, radius, startAngle, endAngle) {
  const startRad = (startAngle - 90) * Math.PI / 180;
  const endRad = (endAngle - 90) * Math.PI / 180;
  
  doc.lines([
    [radius * Math.cos(startRad), radius * Math.sin(startRad)],
    [0, 0]
  ], centerX, centerY);
  
  for (let angle = startAngle; angle < endAngle; angle += 1) {
    const rad = (angle - 90) * Math.PI / 180;
    const nextRad = (angle + 1 - 90) * Math.PI / 180;
    doc.triangle(
      centerX, centerY,
      centerX + radius * Math.cos(rad), centerY + radius * Math.sin(rad),
      centerX + radius * Math.cos(nextRad), centerY + radius * Math.sin(nextRad),
      'F'
    );
  }
}

function generateSummaryData(analytics, reportType) {
  const completionRate = analytics.totalTasks > 0 
    ? ((analytics.completedTasks / analytics.totalTasks) * 100).toFixed(1) 
    : '0.0';
  const overdueRate = analytics.totalTasks > 0 
    ? ((analytics.overdueTasks / analytics.totalTasks) * 100).toFixed(1) 
    : '0.0';
  const inProgressRate = analytics.totalTasks > 0 
    ? ((analytics.inProgressTasks / analytics.totalTasks) * 100).toFixed(1) 
    : '0.0';
  
  return [
    ['Total Tasks', analytics.totalTasks.toString(), 'Tracked'],
    ['Completed Tasks', analytics.completedTasks.toString(), completionRate + '%'],
    ['In Progress', analytics.inProgressTasks.toString(), inProgressRate + '%'],
    ['Overdue Tasks', analytics.overdueTasks.toString(), overdueRate + '%'],
    ['Completion Rate', completionRate + '%', getCompletionStatus(parseFloat(completionRate))],
    ['Report Period', getReportPeriodLabel(reportType), 'Timeframe'],
  ];
}

function filterTasksByDateRange(tasks, reportType) {
  if (reportType === 'all') return tasks;
  
  const now = new Date();
  let startDate;
  
  switch (reportType) {
    case 'daily':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'weekly':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      return tasks;
  }
  
  return tasks.filter(task => new Date(task.created_at) >= startDate);
}

function recalculateAnalytics(tasks) {
  const now = new Date();
  const overdueTasks = tasks.filter(task =>
    task.due_date && new Date(task.due_date) < now && task.status !== 'done'
  );
  const completedTasks = tasks.filter(task => task.status === 'done');
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
  
  // Status distribution
  const statusCounts = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {});
  
  const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
    name: status.replace('_', ' ').toUpperCase(),
    value: count,
  }));
  
  // Priority distribution
  const priorityCounts = tasks.reduce((acc, task) => {
    acc[task.priority] = (acc[task.priority] || 0) + 1;
    return acc;
  }, {});
  
  const priorityDistribution = Object.entries(priorityCounts).map(([priority, count]) => ({
    name: priority.toUpperCase(),
    value: count,
  }));
  
  // User performance
  const userStats = tasks.reduce((acc, task) => {
    if (task.assigned_to && task.assigned_to.length > 0) {
      task.assigned_to.forEach(user => {
        const userId = user._id;
        const userName = user.full_name;

        if (!acc[userId]) {
          acc[userId] = { name: userName, total: 0, completed: 0, overdue: 0 };
        }

        acc[userId].total++;
        if (task.status === 'done') acc[userId].completed++;
        if (task.due_date && new Date(task.due_date) < now && task.status !== 'done') {
          acc[userId].overdue++;
        }
      });
    }
    return acc;
  }, {});
  
  const assigneePerformance = Object.values(userStats).map(stat => ({
    name: stat.name,
    total: stat.total,
    completed: stat.completed,
    overdue: stat.overdue,
    completionRate: stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0,
  }));
  
  // Team distribution
  const teamCounts = tasks.reduce((acc, task) => {
    const teamName = task.team_id?.name || 'Unassigned';
    acc[teamName] = (acc[teamName] || 0) + 1;
    return acc;
  }, {});

  const teamDistribution = Object.entries(teamCounts)
    .map(([team, count]) => ({
      name: team,
      value: count,
    }))
    .sort((a, b) => b.value - a.value);
  
  return {
    totalTasks: tasks.length,
    overdueTasks: overdueTasks.length,
    completedTasks: completedTasks.length,
    inProgressTasks: inProgressTasks.length,
    statusDistribution,
    priorityDistribution,
    teamDistribution,
    assigneePerformance,
  };
}

function addFootersToAllPages(doc, reportType) {
  const pageCount = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    
    // Footer line
    doc.setDrawColor(200, 200, 200);
    doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
    
    // Footer text
    const reportLabel = reportType === 'all' ? 'Full' : reportType.charAt(0).toUpperCase() + reportType.slice(1);
    doc.text(
      `TaskFlow ${reportLabel} Report | Page ${i} of ${pageCount} | ${new Date().toLocaleDateString()}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }
}

function getReportPeriodLabel(reportType) {
  const now = new Date();
  switch (reportType) {
    case 'daily':
      return now.toLocaleDateString();
    case 'weekly':
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return `${weekStart.toLocaleDateString()} - ${now.toLocaleDateString()}`;
    case 'monthly':
      return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    default:
      return 'All Time';
  }
}

function getStatusIndicator(status) {
  const indicators = {
    'TODO': 'Pending',
    'IN PROGRESS': 'Active',
    'IN_PROGRESS': 'Active',
    'REVIEW': 'In Review',
    'DONE': 'Complete',
    'ARCHIVED': 'Archived'
  };
  return indicators[status] || 'Pending';
}

function getPriorityIndicator(priority) {
  const indicators = {
    'LOW': 'Low Priority',
    'MEDIUM': 'Medium Priority',
    'HIGH': 'High Priority',
    'URGENT': 'Urgent'
  };
  return indicators[priority] || 'Medium Priority';
}

function getCompletionStatus(rate) {
  if (rate >= 80) return 'Excellent';
  if (rate >= 60) return 'Good';
  if (rate >= 40) return 'Fair';
  return 'Needs Attention';
}

function getPerformanceRating(rate) {
  const rateNum = typeof rate === 'string' ? parseFloat(rate) : rate;
  if (rateNum >= 80) return '***';
  if (rateNum >= 60) return '**';
  if (rateNum >= 40) return '*';
  return 'Low';
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
    'Completion Rate': stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) + '%' : '0%',
  }));
}

// Utility functions
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
