import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export function downloadPromptReview({ prompt, metaDecisions, goalDecisions }) {
  const promptId = prompt.uid || prompt.id || 'unknown';

  // Flatten metadata decisions
  const metadataRows = Object.entries(metaDecisions || {}).map(([field, entry]) => ({
    type: 'metadata',
    prompt_id: promptId,
    field,
    user_answer: prompt[field.replace(/_qc$/, '')] ?? '—',
    annotator_decision: prompt[`${field}_a_a`] ?? '—',
    annotator_suggestion: prompt[`${field}_u_a`] ?? '—',
    final_decision: entry?.decision ?? '',
    comment: entry?.comment ?? '',
  }));

  // Flatten goal/parameter decisions
  const goalRows = (goalDecisions || []).flatMap((goal) =>
    goal.parameters.map((param) => ({
      type: 'goal_parameter',
      prompt_id: promptId,
      goal: goal.name,
      description: goal.description,
      param: param.name,
      user_answer: param.userAnswer,
      annotator_answer: param.annotatorValue,
      final_status: param.status,
      comment: param.comment ?? '',
      resolved: param.resolved ? 'yes' : 'no',
      resolved_at: param.resolvedAt ?? '',
    }))
  );

  const allRows = [...metadataRows, ...goalRows];

  const worksheet = XLSX.utils.json_to_sheet(allRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Review Export');

  const blob = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([blob]), `prompt_review_${promptId}.xlsx`);
}
