import * as XLSX from 'xlsx';

export const downloadAllReviewedPrompts = (reviewedPrompts, allPrompts) => {
  if (!reviewedPrompts || reviewedPrompts.length === 0) {
    alert('No reviewed prompts found.');
    return;
  }

  const fullData = reviewedPrompts.map(rp => {
    const original = allPrompts.find(ap => ap._unit_id === rp._unit_id) || {};
    return { ...original, ...rp };
  });

  const worksheet = XLSX.utils.json_to_sheet(fullData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'All Reviewed Prompts');
  XLSX.writeFile(workbook, 'All_Reviewed_Prompts.xlsx');
};