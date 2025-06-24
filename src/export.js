import * as XLSX from 'xlsx';

export const debugAgentAssertionKeys = (prompts) => {
  const reviewedPrompts = prompts.filter(p => p.reviewed === true);
  
  reviewedPrompts.forEach((prompt, index) => {
    console.log(`\n=== Prompt ${prompt._unit_id} Agent Assertion Keys ===`);
    
    // Find all agent assertion keys
    const agentKeys = Object.keys(prompt).filter(key => 
      key.startsWith('agent_side_assertion_') || key.includes('agent_side_assertion')
    );
    
    console.log('All agent assertion keys:', agentKeys);
    
    // Show which ones have disagree status
    const disagreeKeys = agentKeys.filter(key => 
      key.endsWith('_status') && prompt[key] === 'disagree'
    );
    
    console.log('Disagree status keys:', disagreeKeys);
    
    // For each disagree, show corresponding comment key
    disagreeKeys.forEach(statusKey => {
      const baseKey = statusKey.replace('_status', '');
      const commentKey = `${baseKey}_comment`;
      console.log(`Status: ${statusKey} = ${prompt[statusKey]}`);
      console.log(`Comment: ${commentKey} = ${prompt[commentKey]}`);
    });
  });
};

export const debugDisagreements = (prompts) => {
  console.log('=== DEBUGGING DISAGREEMENTS ===');
  
  const reviewedPrompts = prompts.filter(p => p.reviewed === true);
  console.log('Total reviewed prompts:', reviewedPrompts.length);
  
  reviewedPrompts.forEach((prompt, index) => {
    console.log(`\n--- Prompt ${index + 1} (${prompt._unit_id}) ---`);
    
    // Debug background info fields
    console.log('Background info flattened fields:');
    Object.keys(prompt).filter(k => k.startsWith('u_b_i_')).forEach(key => {
      console.log(`  ${key}: ${prompt[key]}`);
    });
    
    // Debug assertion fields
    console.log('User assertion flattened fields:');
    Object.keys(prompt).filter(k => k.startsWith('user_side_assertion_')).forEach(key => {
      console.log(`  ${key}: ${prompt[key]}`);
    });
    
    console.log('Agent assertion flattened fields:');
    Object.keys(prompt).filter(k => k.startsWith('agent_side_assertion_')).forEach(key => {
      console.log(`  ${key}: ${prompt[key]}`);
    });
  });
};

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

  const reviewedPrompts = prompts.filter(p => {
    if (p.reviewed !== true) return false;
    
    // Check for metadata disagreements
    const hasMetaDis = Object.keys(p).some(
      k => k.endsWith('_a_a') && !k.startsWith('g_') && !k.startsWith('u_b_i_') && p[k] === 'dis'
    );
    
    // Check goal parameters
    const hasGoalDis = (p.parameters || []).some(param => {
      const annotatorDisagreed = param.annotatorAnswer === 'dis';
      const reviewerDisagreed = param.status === 'disagree';
      return annotatorDisagreed || reviewerDisagreed;
    });

    // Check User Background Information disagreements
    const hasBackgroundDis = Object.keys(p).some(
      k => k.startsWith('u_b_i_') && k.endsWith('_a_a') && p[k] === 'dis'
    );

    // Check User Side Assertions
    const hasUSADis = Object.keys(p).some(key => 
      key.startsWith('user_side_assertion_') && 
      key.endsWith('_status') && 
      p[key] === 'disagree'
    );

    // Check Agent Side Assertions
    const hasASADis = Object.keys(p).some(key => 
      key.startsWith('agent_side_assertion_') && 
      key.endsWith('_status') && 
      p[key] === 'disagree'
    );
    
    return hasMetaDis || hasGoalDis || hasBackgroundDis || hasUSADis || hasASADis;
  });

  console.log(`Found ${reviewedPrompts.length} prompts with disagreements out of ${prompts.length} total`);

  if (reviewedPrompts.length === 0) {
    alert('No reviewed prompts with disagreements found for export');
    return;
  }

  const disagreementRows = [];

  reviewedPrompts.forEach(prompt => {
    const unitId = prompt._unit_id;
    const workerId = prompt.orig__worker_id;

    // Process goal parameter disagreements
    if (prompt.parameters && Array.isArray(prompt.parameters)) {
      prompt.parameters.forEach(param => {
        const annotatorDisagreed = param.annotatorAnswer === 'dis';
        const reviewerDisagreed = param.status === 'disagree';
        
        if (!annotatorDisagreed && !reviewerDisagreed) {
          return;
        }

        const goalMatch = param.fullKey ? param.fullKey.match(/^(goal_\d+)/) : null;
        const goalName = goalMatch ? goalMatch[1] : 'unknown_goal';
        const goalDescription = prompt[goalName] || '';

        disagreementRows.push({
          unit_id: unitId,
          worker_id: workerId,
          field_type: 'goal_parameter',
          goal_name: goalName + ': ' + goalDescription,
          field_name: param.name,
          original_value: param.userAnswer || '',
          annotator_value: param.annotatorValue || '',
          annotator_decision: param.annotatorAnswer || 'dis',
          reviewer_decision: param.status || 'not_reviewed',
          reviewer_comment: param.comment || '',
          is_resolved: param.resolved || false
        });
      });
    }

    // Process User Side Assertions
    const usaStatusKeys = Object.keys(prompt).filter(key => 
      key.startsWith('user_side_assertion_') && key.endsWith('_status')
    );

    usaStatusKeys.forEach(statusKey => {
      const status = prompt[statusKey];
      if (status === 'disagree') {
        const baseKey = statusKey.replace('_status', '');
        const commentKey = `${baseKey}_comment`;
        const comment = prompt[commentKey] || '';
        
        // Extract assertion number and criteria type
        const keyMatch = baseKey.match(/user_side_assertion_(\d+)_(.+)/);
        const assertionNumber = keyMatch ? keyMatch[1] : 'unknown';
        const criteriaType = keyMatch ? keyMatch[2] : 'unknown';
        
        // FIXED: Find original values from the structured data
        let originalValue = '';
        let annotatorValue = '';
        
        if (prompt.userAssertions && Array.isArray(prompt.userAssertions)) {
          const assertion = prompt.userAssertions.find(a => a.assertionNumber == assertionNumber);
          if (assertion && assertion.criteria) {
            const criteria = assertion.criteria.find(c => c.fullKey === baseKey);
            if (criteria) {
              originalValue = criteria.userAnswer || '';
              annotatorValue = criteria.annotatorAnswer || '';
            }
          }
        }
        
        disagreementRows.push({
          unit_id: unitId,
          worker_id: workerId,
          field_type: 'user_assertion',
          goal_name: `User Assertion ${assertionNumber}`,
          field_name: criteriaType.replace(/_/g, ' '),
          original_value: originalValue,
          annotator_value: annotatorValue,
          annotator_decision: 'dis',
          reviewer_decision: status,
          reviewer_comment: comment,
          is_resolved: true
        });
      }
    });

    // Process Agent Side Assertions
    const asaStatusKeys = Object.keys(prompt).filter(key => 
      key.startsWith('agent_side_assertion_') && key.endsWith('_status')
    );

    asaStatusKeys.forEach(statusKey => {
      const status = prompt[statusKey];
      if (status === 'disagree') {
        const baseKey = statusKey.replace('_status', '');
        const commentKey = `${baseKey}_comment`;
        const comment = prompt[commentKey] || '';
        
        console.log(`Processing ASA: ${statusKey}, Comment key: ${commentKey}, Comment: "${comment}"`);
        
        // Extract assertion number and criteria type
        const keyMatch = baseKey.match(/agent_side_assertion_(\d+)_(.+)/);
        const assertionNumber = keyMatch ? keyMatch[1] : 'unknown';
        const criteriaType = keyMatch ? keyMatch[2] : 'unknown';
        
        // FIXED: Find original values from the structured data
        let originalValue = '';
        let annotatorValue = '';
        
        if (prompt.annotatorAssertions && Array.isArray(prompt.annotatorAssertions)) {
          const assertion = prompt.annotatorAssertions.find(a => a.assertionNumber == assertionNumber);
          if (assertion && assertion.criteria) {
            const criteria = assertion.criteria.find(c => c.fullKey === baseKey);
            if (criteria) {
              originalValue = criteria.userAnswer || '';
              annotatorValue = criteria.annotatorAnswer || '';
            }
          }
        }
        
        disagreementRows.push({
          unit_id: unitId,
          worker_id: workerId,
          field_type: 'agent_assertion',
          goal_name: `Agent Assertion ${assertionNumber}`,
          field_name: criteriaType.replace(/_/g, ' '),
          original_value: originalValue,
          annotator_value: annotatorValue,
          annotator_decision: 'dis',
          reviewer_decision: status,
          reviewer_comment: comment,
          is_resolved: true
        });
      }
    });

    // Process metadata disagreements
    const metaDisagreements = Object.keys(prompt).filter(
  k => k.endsWith('_a_a') && !k.startsWith('g_') && !k.startsWith('u_b_i_') && !k.startsWith('usa_') && !k.startsWith('asa_') && prompt[k] === 'dis'
);

metaDisagreements.forEach(key => {
  const fieldName = key.replace('_a_a', '');
  const originalValue = prompt[fieldName] || '';
  
  // FIXED: Look for annotator answer and review status/comment with correct field names
  const annotatorAnswerKey = key.replace('_a_a', '_u_a');
  // CHANGED: Use the correct field names that match your React component
  const reviewDecisionKey = fieldName + '_review_decision';
  const reviewCommentKey = fieldName + '_review_comment';
  
  const annotatorValue = prompt[annotatorAnswerKey] || '';
  const reviewerDecision = prompt[reviewDecisionKey] || 'not_reviewed';
  const reviewerComment = prompt[reviewCommentKey] || '';
  
  console.log(`Metadata field: ${fieldName}`);
  console.log(`Review decision key: ${reviewDecisionKey} = "${reviewerDecision}"`);
  console.log(`Review comment key: ${reviewCommentKey} = "${reviewerComment}"`);
  
  disagreementRows.push({
    unit_id: unitId,
    worker_id: workerId,
    field_type: 'metadata',
    goal_name: 'N/A',
    field_name: fieldName,
    original_value: originalValue,
    annotator_value: annotatorValue,
    annotator_decision: 'dis',
    reviewer_decision: reviewerDecision,
    reviewer_comment: reviewerComment,
    is_resolved: reviewerDecision !== 'not_reviewed'
  });
});

    // Process background info disagreements
    
    const backgroundDisagreements = Object.keys(prompt).filter(
      k => k.startsWith('u_b_i_') && k.endsWith('_a_a') && prompt[k] === 'dis'
    );

    backgroundDisagreements.forEach(key => {
      const fieldName = key.replace('_a_a', '');
      
      // FIXED: Get original field name for background info
      const originalFieldName = fieldName.replace('u_b_i_', 'user_background_information_');
      const originalValue = prompt[originalFieldName] || '';
      
      // FIXED: Get annotator answer
      const annotatorAnswerKey = key.replace('_a_a', '_u_a');
      const annotatorValue = prompt[annotatorAnswerKey] || '';
      
      // FIXED: Get reviewer decision and comment using correct field names
      const statusKey = `${fieldName}_status`;
      const commentKey = `${fieldName}_comment`;
      
      const reviewerDecision = prompt[statusKey] || 'not_reviewed';
      const reviewerComment = prompt[commentKey] || '';
      
      console.log(`Background field: ${fieldName}`);
      console.log(`Original field: ${originalFieldName} = "${originalValue}"`);
      console.log(`Status key: ${statusKey} = "${reviewerDecision}"`);
      console.log(`Comment key: ${commentKey} = "${reviewerComment}"`);
      
      disagreementRows.push({
        unit_id: unitId,
        worker_id: workerId,
        field_type: 'background_info',
        goal_name: 'N/A',
        field_name: fieldName.replace('u_b_i_', '').replace(/_/g, ' '),
        original_value: originalValue,
        annotator_value: annotatorValue,
        annotator_decision: 'dis',
        reviewer_decision: reviewerDecision,
        reviewer_comment: reviewerComment,
        is_resolved: reviewerDecision !== 'not_reviewed'
      });
    });
  });

  if (disagreementRows.length === 0) {
    alert('No disagreements found in reviewed prompts');
    return;
  }

  console.log(`Exporting ${disagreementRows.length} disagreement rows`);

  console.log('Row types breakdown:', disagreementRows.reduce((acc, row) => {
  acc[row.field_type] = (acc[row.field_type] || 0) + 1;
  return acc;
}, {}));

  console.log('Sample row:', disagreementRows[0]);

  const backgroundRow = disagreementRows.find(row => row.field_type === 'background_info');
if (backgroundRow) {
  console.log('Background info sample row:', backgroundRow);
} else {
  console.log('No background info rows found');
}

  // Create workbook
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(disagreementRows);
  
  // Auto-fit column widths
  const colWidths = [
    { wch: 15 }, // unit_id
    { wch: 15 }, // worker_id
    { wch: 18 }, // field_type
    { wch: 30 }, // goal_name
    { wch: 25 }, // field_name
    { wch: 20 }, // original_value
    { wch: 20 }, // annotator_value
    { wch: 18 }, // annotator_decision
    { wch: 18 }, // reviewer_decision
    { wch: 40 }, // reviewer_comment
    { wch: 12 }  // is_resolved
  ];
  worksheet['!cols'] = colWidths;
  
  XLSX.utils.book_append_sheet(workbook, worksheet, "Disagreements");

  const timestamp = config.addTimestamp ? '_' + new Date().toISOString().split('T')[0] : '';
  const fileName = `disagreements_export${timestamp}.xlsx`;
  
  try {
    XLSX.writeFile(workbook, fileName);
    alert(`Export completed! ${disagreementRows.length} disagreements exported to ${fileName}`);
  } catch (error) {
    console.error('Export failed:', error);
    alert('Export failed: ' + error.message);
  }
};