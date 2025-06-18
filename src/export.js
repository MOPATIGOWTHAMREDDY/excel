import * as XLSX from 'xlsx';

export const exportReviewed = (prompts, options = {}) => {
  const config = {
    includeAllGoals: false,
    includeNonReviewed: false,
    exportFormat: 'disagreements',
    preserveComments: true,
    addTimestamp: true,
    ...options
  };

  if (!prompts || prompts.length === 0) {
    alert('No prompts available for export');
    return;
  }

  // Debug: Log the structure of the first prompt to understand data flow
  if (prompts.length > 0) {
    console.log('=== DEBUG: First prompt structure ===');
    const firstPrompt = prompts[0];
    console.log('Prompt keys:', Object.keys(firstPrompt));
    if (firstPrompt.parameters) {
      console.log('First parameter:', firstPrompt.parameters[0]);
      const paramWithComment = firstPrompt.parameters.find(p => p.comment);
      if (paramWithComment) {
        console.log('Parameter with comment found:', {
          name: paramWithComment.name,
          comment: paramWithComment.comment,
          status: paramWithComment.status,
          resolved: paramWithComment.resolved
        });
      } else {
        console.log('No parameters with comments found in first prompt');
      }
    }
  }

  const reviewedPrompts = prompts.filter(p => {
    if (!p.reviewed) return false;
    
    const hasMetaDis = Object.keys(p).some(
      k => k.endsWith('_a_a') && !k.startsWith('g_') && p[k] === 'dis'
    );
    
    const hasGoalDis = (p.parameters || []).some(param => {
      const annotatorDisagreed = param.annotatorAnswer === 'dis' || param.annotatorValue === 'dis';
      const reviewerDisagreed = param.status === 'disagree' && param.resolved;
      return annotatorDisagreed || reviewerDisagreed;
    });
    
    return hasMetaDis || hasGoalDis;
  });

  console.log('=== CHECKING COMMENTS IN EXPORT ===');
reviewedPrompts.forEach((prompt, promptIdx) => {
  if (prompt.parameters) {
    prompt.parameters.forEach((param, paramIdx) => {
      if (param.comment || param.status === 'disagree') {
        console.log(`Export found - Prompt ${promptIdx}, Param ${paramIdx}:`, {
          name: param.name,
          status: param.status,
          comment: param.comment,
          commentExists: !!param.comment
        });
      }
    });
  }
});


  if (reviewedPrompts.length === 0) {
    console.log("No reviewed prompts with disagreements found");
    alert('No reviewed prompts with disagreements found for export');
    return;
  }

  const disagreementRows = [];
  const debugInfo = {
    totalParams: 0,
    paramsWithComments: 0,
    paramsWithStatus: 0,
    paramsResolved: 0
  };

  reviewedPrompts.forEach(prompt => {
    const unitId = prompt._unit_id;
    const workerId = prompt.orig__worker_id;
    const promptText = prompt.prompt || '';

    // Process metadata disagreements (unchanged)
    Object.keys(prompt).forEach(key => {
      if (key.endsWith('_a_a') && prompt[key] === 'dis' && !key.startsWith('g_')) {
        const fieldName = key.replace('_a_a', '');
        const originalValue = prompt[fieldName];
        const annotatorValue = prompt[fieldName + '_u_a'] || '';
        
        const reviewDecision = prompt[fieldName + '_review_decision'] || 
                               prompt[fieldName + '_status'] || 
                               'not_reviewed';
        
        const reviewComment = prompt[fieldName + '_review_comment'] || 
                              prompt[fieldName + '_comment'] || 
                              prompt[fieldName + '_reviewer_comment'] ||
                              prompt[fieldName + '_notes'] || '';

        const mappedDecision = reviewDecision === 'disagree' ? 'revert' : 
                              reviewDecision === 'agree' ? 'accept' : 
                              reviewDecision;

        disagreementRows.push({
          unit_id: unitId,
          worker_id: workerId,
          field_type: 'metadata',
          goal_name: '',
          field_name: fieldName,
          original_value: originalValue,
          annotator_value: annotatorValue,
          annotator_decision: prompt[key],
          reviewer_decision: mappedDecision,
          reviewer_comment: reviewComment,
          is_resolved: reviewDecision !== 'not_reviewed'
        });
      }
    });

    // Process goal parameter disagreements with enhanced debugging
    if (prompt.parameters && Array.isArray(prompt.parameters)) {
      prompt.parameters.forEach(param => {
        debugInfo.totalParams++;
        
        // Debug logging for each parameter
        if (param.comment) debugInfo.paramsWithComments++;
        if (param.status) debugInfo.paramsWithStatus++;
        if (param.resolved) debugInfo.paramsResolved++;
        
        const annotatorDisagreed = param.annotatorAnswer === 'dis' || param.annotatorValue === 'dis';
        const reviewerDisagreed = param.status === 'disagree' && param.resolved;
        const hasActiveDisagreement = annotatorDisagreed || reviewerDisagreed;
        
        if (!hasActiveDisagreement) {
          return;
        }

        const goalMatch = param.fullKey ? param.fullKey.match(/^(goal_\d+)/) : null;
        const goalName = goalMatch ? goalMatch[1] : 'unknown_goal';
        const goalDescription = prompt[goalName] || '';

        // Enhanced comment extraction - try multiple possible sources
        let reviewerComment = '';
        
        // Primary: Direct comment field (from your ParameterBox component)
        if (param.comment) {
          reviewerComment = param.comment;
        }
        // Fallback: Check if comment might be stored elsewhere
        else if (param.reviewerComment) {
          reviewerComment = param.reviewerComment;
        }
        else if (param.review_comment) {
          reviewerComment = param.review_comment;
        }
        else if (param.notes) {
          reviewerComment = param.notes;
        }

        const reviewerDecision = param.status || 'not_reviewed';
        const mappedReviewerDecision = reviewerDecision === 'disagree' ? 'revert' : 
                                       reviewerDecision === 'agree' ? 'accept' : 
                                       reviewerDecision;

        // Enhanced logging for missing comments
        if (reviewerDecision === 'disagree' && !reviewerComment) {
          console.warn('Missing comment for disagreement:', {
            unitId,
            goalName,
            paramName: param.name,
            paramFullKey: param.fullKey,
            status: param.status,
            resolved: param.resolved,
            allParamKeys: Object.keys(param)
          });
        }

        disagreementRows.push({
          unit_id: unitId,
          worker_id: workerId,
          field_type: 'goal_parameter',
          goal_name: goalName + ': ' + goalDescription,
          field_name: param.name,
          original_value: param.userAnswer,
          annotator_value: param.annotatorValue,
          annotator_decision: param.annotatorAnswer || 'dis',
          reviewer_decision: mappedReviewerDecision,
          reviewer_comment: reviewerComment,
          is_resolved: param.resolved || false,
          resolved_at: param.resolvedAt || '',
          goal_full_key: param.fullKey,
          // Debug fields
          param_status: param.status,
          param_comment_exists: !!param.comment,
          param_resolved: param.resolved
        });
      });
    }
  });

  console.log('=== DEBUG INFO ===');
  console.log('Total parameters processed:', debugInfo.totalParams);
  console.log('Parameters with comments:', debugInfo.paramsWithComments);
  console.log('Parameters with status:', debugInfo.paramsWithStatus);
  console.log('Parameters resolved:', debugInfo.paramsResolved);
  console.log('Disagreement rows created:', disagreementRows.length);

  if (disagreementRows.length === 0) {
    alert('No disagreements found in reviewed prompts');
    return;
  }

  // Create workbook
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(disagreementRows);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Disagreements");

  // Enhanced column widths to include debug columns
  worksheet['!cols'] = [
    { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 40 }, { wch: 20 },
    { wch: 30 }, { wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 60 },
    { wch: 12 }, { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 12 }
  ];

  const timestamp = config.addTimestamp ? '_' + new Date().toISOString().split('T')[0] : '';
  const fileName = `disagreements_export${timestamp}.xlsx`;
  
  try {
    XLSX.writeFile(workbook, fileName);
    
    // Enhanced reporting
    const missingComments = disagreementRows.filter(row => 
      row.reviewer_decision === 'revert' && !row.reviewer_comment
    );
    
    const hasComments = disagreementRows.filter(row => row.reviewer_comment);
    
    console.log('=== EXPORT RESULTS ===');
    console.log('Total exported:', disagreementRows.length);
    console.log('Rows with comments:', hasComments.length);
    console.log('Missing comments:', missingComments.length);
    
    if (missingComments.length > 0) {
      console.log('Rows missing comments:');
      missingComments.forEach(row => {
        console.log(`- ${row.unit_id}: ${row.field_name} (Status: ${row.param_status}, Resolved: ${row.param_resolved})`);
      });
    }
    
    alert(`Export completed!\n\nTotal: ${disagreementRows.length}\nWith comments: ${hasComments.length}\nMissing comments: ${missingComments.length}\n\nFile: ${fileName}`);
    
  } catch (error) {
    console.error('Export failed:', error);
    alert('Export failed: ' + error.message);
  }
};

// Additional debug function to check live data
export const debugLiveData = (prompts) => {
  console.log('=== LIVE DATA DEBUG ===');
  
  prompts.forEach((prompt, promptIdx) => {
    if (prompt.parameters) {
      prompt.parameters.forEach((param, paramIdx) => {
        if (param.status === 'disagree' || param.comment) {
          console.log(`Prompt ${promptIdx}, Param ${paramIdx}:`, {
            unitId: prompt._unit_id,
            paramName: param.name,
            status: param.status,
            comment: param.comment,
            resolved: param.resolved,
            commentLength: param.comment ? param.comment.length : 0
          });
        }
      });
    }
  });
};