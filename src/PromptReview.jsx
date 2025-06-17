import React from 'react';
import GoalReviewCard from './GoalReviewCard';
import PromptMetadataReview from './PromptMetadataReview';
import PromptMetaSummary from './PromptMetaSummary';


function getGoals(prompt) {
  const excludedPatterns = [
    '_contains_',
    '_requests_',
    '_task_',
    '_not_',
    '_objectively_',
    'ambiguous_unclear_qc',
    'qc'
  ];

  const goalKeys = Object.keys(prompt).filter(
    (key) =>
      key.startsWith('goal_') &&
      !excludedPatterns.some((pattern) => key.includes(pattern))
  );

  const goals = goalKeys.map((key) => {
    const goalNameParts = key.split('_');
    const goalIndex = goalNameParts[1]; // Extract index for parameter lookup

    const parameters = Object.entries(prompt)
      .filter(([paramKey]) =>
        paramKey.startsWith(`${key}_`) &&
        !paramKey.includes(`${key}_task_`)
      )
      .map(([paramKey, userAnswer]) => {
        const paramBase = paramKey.replace(`${key}_`, '');
        const annotatorAnswer = prompt[`g_${goalIndex}_${paramBase}_a_a`];
        const annotatorValue = prompt[`g_${goalIndex}_${paramBase}_u_a`];

        return {
          name: paramBase,
          userAnswer,
          annotatorAnswer,
          annotatorValue,
          fullKey: paramKey,
          revertComment: '',
          status: annotatorAnswer === 'dis' ? 'disagree' : 'agree',
        };
      });

    return {
      name: key,
      description: prompt[key],
      parameters,
    };
  });

  return goals;
}

function PromptReview({ prompt, index, goBack, total, goTo }) {
  const goals = getGoals(prompt);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button onClick={goBack} className="text-indigo-600 hover:underline">
          ← Back to List
        </button>
        <div className="space-x-2">
          <button
            onClick={() => goTo(Math.max(0, index - 1))}
            disabled={index === 0}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            Previous
          </button>
          <button
            onClick={() => goTo(Math.min(total - 1, index + 1))}
            disabled={index === total - 1}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            Next
          </button>
        </div>
      </div>

      <div className="bg-white shadow p-4 rounded">
        <h2 className="text-xl font-bold mb-2">Prompt #{prompt._unit_id}</h2>
        <p className="mb-6 text-gray-700">{prompt.prompt}</p>
        <PromptMetaSummary prompt={prompt} />
        <PromptMetadataReview prompt={prompt} />
        
<div className="space-y-6">

  {goals.map((goal, idx) => (
    <GoalReviewCard key={idx} goal={goal} />
  ))}
</div>

      </div>
    </div>
  );
}

export default PromptReview;
