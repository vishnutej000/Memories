import { format } from 'date-fns';

interface DateSeparatorProps {
  date: Date;
}

export default function DateSeparator({ date }: DateSeparatorProps) {
  return (
    <div className="relative flex items-center py-4">
      <div className="flex-grow border-t border-gray-300"></div>
      <span className="mx-4 flex-shrink text-sm font-medium text-gray-500">
        {format(date, 'MMMM d, yyyy')}
      </span>
      <div className="flex-grow border-t border-gray-300"></div>
    </div>
  );
}