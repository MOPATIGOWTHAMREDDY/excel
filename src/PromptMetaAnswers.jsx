import React from 'react';

// List of all fields to display (excluding _gold and excluding prompt)
const allFields = [
  'prompt_ambiguous_unclear',
  'prompt_character_length_bin',
  'prompt_clarity_coherence',
  'prompt_compelling_creative',
  'prompt_contains_contradictory_request',
  'prompt_contains_harmful_toxic_content',
  'prompt_contains_untruthful_content',
  'prompt_data_types',
  'prompt_data_types_corrected',
  'prompt_data_types_eval',
  'prompt_formatting',
  'prompt_intent',
  'prompt_intent_aup_categories',
  'prompt_language',
  'prompt_locales',
  'prompt_not_answerable',
  'prompt_not_answerable_qc',
  'prompt_not_answerable_reasons',
  'prompt_not_intentful',
  'prompt_number_of_requests',
  'prompt_objectively_answerable',
  'prompt_requests_fact',
  'prompt_requests_harmful_toxic_content',
  'prompt_requests_opinion',
  'prompt_source',
  'prompt_style',
  'prompt_usecase_match',
];

function PromptMetaAnswers({ prompt }) {
  // Keep only fields that are not completely empty
  const filteredFields = allFields.filter((field) => {
    const value = prompt[field];
    return (
      value !== undefined &&
      value !== null &&
      !(typeof value === 'string' && value.trim() === '') &&
      !(Array.isArray(value) && value.length === 0)
    );
  });

  return (
    <div className="w-full p-4 bg-white border border-gray-200 rounded-md shadow-sm max-h-[90vh] overflow-y-auto">
      <h2 className="text-blue-700 font-semibold text-lg mb-4">Your Answers</h2>

      {filteredFields.length > 0 ? (
        filteredFields.map((field) => (
          <div
            key={field}
            className="p-3 rounded-md border border-gray-100 bg-gray-50 mb-3"
          >
            <div className="font-medium text-gray-700 capitalize">
              {field.replace(/_/g, ' ')}
            </div>
            <div className="text-sm text-gray-900 mt-1">
              {Array.isArray(prompt[field])
                ? prompt[field].join(', ')
                : prompt[field].toString()}
            </div>
          </div>
        ))
      ) : (
        <div className="text-gray-500">No answers available.</div>
      )}
    </div>
  );
}

export default PromptMetaAnswers;