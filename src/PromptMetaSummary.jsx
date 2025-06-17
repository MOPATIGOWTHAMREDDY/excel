import React from 'react';

const metaFields = [
  'task_category',
  'task_subcategory',
  'use_case',
  'use_case_complexities',
  'user_background_attributes_lst',
  'user_background_information',
  'first_turn_complexities',
];

function humanLabel(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function PromptMetaSummary({ prompt }) {
  return (
    <div className="mt-6 border rounded-lg bg-gray-50 px-4 py-5 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Prompt-Level Metadata
      </h3>
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
        {metaFields.map((field) => (
          <div key={field}>
            <dt className="text-gray-500">{humanLabel(field)}</dt>
            <dd className="text-gray-800 break-words whitespace-pre-wrap">
              {String(prompt[field] ?? '—')}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default PromptMetaSummary;
