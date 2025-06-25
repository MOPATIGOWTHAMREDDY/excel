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
          category: 'goal_parameter',
          'Sub category': goalName + ': ' + goalDescription,
          Parameter: param.name,
          associate_value: param.userAnswer || '',
          annotator_value: param.annotatorValue || '',
          annotator_decision: param.annotatorAnswer || 'dis',
          reviewer_decision: param.status || 'not_reviewed',
          reviewer_comment: param.comment || '',
          is_resolved: param.resolved || false
        });
      });
    }

    // Process User Side Assertions - FIXED TO GET PROPER VALUES
    const usaStatusKeys = Object.keys(prompt).filter(key => 
      key.startsWith('user_side_assertion_') && key.endsWith('_status')
    );

    usaStatusKeys.forEach(statusKey => {
      const status = prompt[statusKey];
      if (status === 'disagree') {
        const baseKey = statusKey.replace('_status', ''); // e.g., user_side_assertion_1_contains_error
        const commentKey = `${baseKey}_comment`;
        const comment = prompt[commentKey] || '';
        
        // Extract assertion number and criteria type
        const keyMatch = baseKey.match(/user_side_assertion_(\d+)_(.+)/);
        const assertionNumber = keyMatch ? keyMatch[1] : 'unknown';
        const criteriaType = keyMatch ? keyMatch[2] : 'unknown';
        
        // Get the assertion TEXT/DESCRIPTION from the main assertion field
        const assertionTextKey = `user_side_assertion_${assertionNumber}`;
        const assertionText = prompt[assertionTextKey] || `User Assertion ${assertionNumber}`;
        
        // CORRECTED: Get values from the actual field names in the data
        // The associate value is stored directly in the baseKey field
        const associateValue = prompt[baseKey] || ''; // e.g., prompt['user_side_assertion_1_contains_error']
        
        // The annotator answer uses _a_a suffix (not _u_a)
        const annotatorAnswerKey = `${baseKey}_a_a`;
        const annotatorValue = prompt[annotatorAnswerKey] || '';
        
        console.log(`USA Processing: ${baseKey}`);
        console.log(`Assertion text: ${assertionText}`);
        console.log(`Criteria: ${criteriaType}`);
        console.log(`Associate value (${baseKey}): ${associateValue}`);
        console.log(`Annotator value (${annotatorAnswerKey}): ${annotatorValue}`);
        
        disagreementRows.push({
          unit_id: unitId,
          worker_id: workerId,
          category: 'user_assertion',
          'Sub category': assertionText, // The actual assertion description/text
          Parameter: criteriaType.replace(/_/g, ' '), // The criteria like "contains error"
          associate_value: associateValue,
          annotator_value: annotatorValue,
          annotator_decision: 'dis',
          reviewer_decision: status,
          reviewer_comment: comment,
          is_resolved: true
        });
      }
    });

    // Process Agent Side Assertions - FIXED TO GET PROPER VALUES
    const asaStatusKeys = Object.keys(prompt).filter(key => 
      key.startsWith('agent_side_assertion_') && key.endsWith('_status')
    );

    asaStatusKeys.forEach(statusKey => {
      const status = prompt[statusKey];
      if (status === 'disagree') {
        const baseKey = statusKey.replace('_status', ''); // e.g., agent_side_assertion_1_contains_error
        const commentKey = `${baseKey}_comment`;
        const comment = prompt[commentKey] || '';
        
        // Extract assertion number and criteria type
        const keyMatch = baseKey.match(/agent_side_assertion_(\d+)_(.+)/);
        const assertionNumber = keyMatch ? keyMatch[1] : 'unknown';
        const criteriaType = keyMatch ? keyMatch[2] : 'unknown';
        
        // Get the assertion TEXT/DESCRIPTION from the main assertion field
        const assertionTextKey = `agent_side_assertion_${assertionNumber}`;
        const assertionText = prompt[assertionTextKey] || `Agent Assertion ${assertionNumber}`;
        
        // CORRECTED: Get values from the actual field names in the data
        // The associate value is stored directly in the baseKey field
        const associateValue = prompt[baseKey] || ''; // e.g., prompt['agent_side_assertion_1_contains_error']
        
        // The annotator answer uses _a_a suffix (not _u_a)
        const annotatorAnswerKey = `${baseKey}_a_a`;
        const annotatorValue = prompt[annotatorAnswerKey] || '';
        
        console.log(`ASA Processing: ${baseKey}`);
        console.log(`Assertion text: ${assertionText}`);
        console.log(`Criteria: ${criteriaType}`);
        console.log(`Associate value (${baseKey}): ${associateValue}`);
        console.log(`Annotator value (${annotatorAnswerKey}): ${annotatorValue}`);
        
        disagreementRows.push({
          unit_id: unitId,
          worker_id: workerId,
          category: 'agent_assertion',
          'Sub category': assertionText, // The actual assertion description/text
          Parameter: criteriaType.replace(/_/g, ' '), // The criteria like "contains error"
          associate_value: associateValue,
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
      k => k.endsWith('_a_a') && !k.startsWith('g_') && !k.startsWith('u_b_i_') && !k.startsWith('user_side_assertion_') && !k.startsWith('agent_side_assertion_') && prompt[k] === 'dis'
    );

    metaDisagreements.forEach(key => {
      const fieldName = key.replace('_a_a', '');
      const associateValue = prompt[fieldName] || '';
      
      // Look for annotator answer and review status/comment with correct field names
      const annotatorAnswerKey = key.replace('_a_a', '_u_a');
      const reviewDecisionKey = fieldName + '_review_decision';
      const reviewCommentKey = fieldName + '_review_comment';
      
      const annotatorValue = prompt[annotatorAnswerKey] || '';
      const reviewerDecision = prompt[reviewDecisionKey] || 'not_reviewed';
      const reviewerComment = prompt[reviewCommentKey] || '';
      
      disagreementRows.push({
        unit_id: unitId,
        worker_id: workerId,
        category: 'metadata',
        'Sub category': fieldName,
        Parameter: fieldName,
        associate_value: associateValue,
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
      
      // Get original field name for background info
      const originalFieldName = fieldName.replace('u_b_i_', 'user_background_information_');
      const associateValue = prompt[originalFieldName] || prompt[fieldName] || '';
      
      // Get annotator answer
      const annotatorAnswerKey = key.replace('_a_a', '_u_a');
      const annotatorValue = prompt[annotatorAnswerKey] || '';
      
      // Get reviewer decision and comment using correct field names
      const statusKey = `${fieldName}_status`;
      const commentKey = `${fieldName}_comment`;
      
      const reviewerDecision = prompt[statusKey] || 'not_reviewed';
      const reviewerComment = prompt[commentKey] || '';
      
      disagreementRows.push({
        unit_id: unitId,
        worker_id: workerId,
        category: 'background_info',
        'Sub category': originalFieldName,
        Parameter: originalFieldName,
        associate_value: associateValue,
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
  console.log('Sample assertion rows:', disagreementRows.filter(r => r.category.includes('assertion')));

  // Create workbook
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(disagreementRows);
  
  // Auto-fit column widths
  const colWidths = [
    { wch: 15 }, // unit_id
    { wch: 15 }, // worker_id
    { wch: 18 }, // category
    { wch: 50 }, // Sub category (assertion text)
    { wch: 25 }, // Parameter (criteria type)
    { wch: 15 }, // associate_value
    { wch: 15 }, // annotator_value
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


// Enhanced debug function to show the actual field structure
export const debugAssertionFields = (prompts) => {
  const reviewedPrompts = prompts.filter(p => p.reviewed === true);
  
  reviewedPrompts.slice(0, 1).forEach((prompt, index) => {
    console.log(`\n=== Prompt ${prompt._unit_id} Assertion Fields Debug ===`);
    
    // Show ALL fields that contain "assertion" to see the full structure
    const allAssertionFields = Object.keys(prompt).filter(key => 
      key.includes('assertion')
    ).sort();
    
    console.log('\nALL assertion-related fields:');
    allAssertionFields.forEach(field => {
      const value = prompt[field];
      console.log(`${field}: "${value}"`);
    });
    
    // Focus on specific patterns
    console.log('\n=== Pattern Analysis ===');
    
    // Check for different annotator answer patterns
    const possibleAnnotatorPatterns = [
      '_a_a',
      '_annotator_answer', 
      '_ann_answer',
      '_a_answer',
      '_annotator',
      '_ann'
    ];
    
    possibleAnnotatorPatterns.forEach(pattern => {
      const matchingFields = Object.keys(prompt).filter(key => 
        key.includes('assertion') && key.includes(pattern)
      );
      if (matchingFields.length > 0) {
        console.log(`\nFields with pattern "${pattern}":`);
        matchingFields.forEach(field => {
          console.log(`  ${field}: "${prompt[field]}"`);
        });
      }
    });
    
    // Show goal parameter structure for comparison
    console.log('\n=== Goal Parameter Structure (for comparison) ===');
    if (prompt.parameters && prompt.parameters.length > 0) {
      console.log('Sample parameter object:');
      console.log(JSON.stringify(prompt.parameters[0], null, 2));
    }
  });
};

// Enhanced debug function to show the actual field structure