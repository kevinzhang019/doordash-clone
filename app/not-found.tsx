import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <div className="text-7xl font-bold text-[#FF3008] mb-4">404</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
      <p className="text-gray-500 mb-6 text-center max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-[#FF3008] text-white font-semibold rounded-full hover:bg-red-600 transition-colors"
      >
        Back to home
      </Link>
    </div>
  );
}
