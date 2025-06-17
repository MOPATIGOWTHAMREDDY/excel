import * as XLSX from 'xlsx';

export function exportReviewData(prompts, reviews) {
  const data = prompts.map((prompt, index) => {
    const review = reviews[prompt._unit_id] || {};
    const flatReview = {};

    for (const [field, { decision, comment }] of Object.entries(review)) {
      flatReview[`${field}_review_decision`] = decision;
      flatReview[`${field}_review_comment`] = comment || '';
    }

    return { ...prompt, ...flatReview };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reviews');

  XLSX.writeFile(workbook, 'reviewed_prompts.xlsx');
}