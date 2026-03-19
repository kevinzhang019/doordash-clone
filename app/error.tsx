'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <div className="text-6xl mb-4">:(</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
      <p className="text-gray-500 mb-6 text-center max-w-md">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-[#FF3008] text-white font-semibold rounded-full hover:bg-red-600 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
