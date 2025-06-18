import * as XLSX from 'xlsx';

export const exportReviewed = (reviewedPrompts) => {
  const reviewedOnly = reviewedPrompts.filter(p => p.reviewed === true);

  const dataToExport = reviewedOnly.map(prompt => {
    const base = {
      _unit_id: prompt._unit_id,
      worker_id: prompt.orig__worker_id,
    };

    Object.entries(prompt).forEach(([key, val]) => {
      if (
        key.endsWith('_review_decision') ||
        key.endsWith('_review_comment') ||
        key.endsWith('_a_a')
      ) {
        base[key] = val;
      }
    });

    if (prompt.parameters) {
      prompt.parameters.forEach(param => {
        base[param.fullKey] = param.status;
        if (param.comment) base[`${param.fullKey}_comment`] = param.comment;
      });
    }

    return base;
  });

  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Reviewed Prompts");
  XLSX.writeFile(workbook, "reviewed_prompts.xlsx");
};
