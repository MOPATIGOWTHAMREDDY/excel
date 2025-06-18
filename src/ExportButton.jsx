import { downloadAllReviewedPrompts } from './exportAllReviewedPrompts';
import { useReview } from './context/ReviewContext';

const ExportButton = ({ allPrompts }) => {
  const { reviewData } = useReview();

  return (
    <button onClick={() => downloadAllReviewedPrompts(reviewData, allPrompts)}>
      Export All Reviewed
    </button>
  );
};