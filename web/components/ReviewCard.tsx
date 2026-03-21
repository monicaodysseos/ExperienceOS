import { StarRating } from "./StarRating";
import { Avatar } from "./ui/Avatar";

interface ReviewCardProps {
  authorName: string;
  rating: number;
  comment: string;
  date: string;
  providerResponse?: string | null;
}

export function ReviewCard({
  authorName,
  rating,
  comment,
  date,
  providerResponse,
}: ReviewCardProps) {
  const relativeDate = getRelativeTime(date);

  return (
    <div className="border-b border-navy-100 py-5 last:border-0">
      <div className="flex items-start gap-3">
        <Avatar name={authorName} size="sm" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-navy-900">
              {authorName}
            </span>
            <span className="text-xs text-navy-400">{relativeDate}</span>
          </div>
          <StarRating value={rating} size="sm" className="mt-1" />
          <p className="mt-2 text-sm text-navy-600 leading-relaxed">{comment}</p>
          {providerResponse && (
            <div className="mt-3 rounded-lg bg-navy-50 p-3">
              <p className="text-xs font-medium text-navy-500 mb-1">
                Host response
              </p>
              <p className="text-sm text-navy-600">{providerResponse}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}
