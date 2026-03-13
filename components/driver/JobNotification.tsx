'use client';

import { useEffect, useRef, useState } from 'react';
import type { DriverJob } from '@/lib/types';

const COUNTDOWN_SECONDS = 15;

interface JobNotificationProps {
  job: DriverJob;
  onAccept: () => void;
  onDecline: () => void;
}

export default function JobNotification({ job, onAccept, onDecline }: JobNotificationProps) {
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSecondsLeft(COUNTDOWN_SECONDS);
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          onDecline();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [job.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const progress = secondsLeft / COUNTDOWN_SECONDS;
  const circumference = 2 * Math.PI * 22; // r=22
  const strokeDashoffset = circumference * (1 - progress);

  // Mask customer address
  const maskedAddress = job.deliveryAddress.replace(/^\d+/, '***');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="w-full max-w-sm bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-[#2a2a2a]">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#FF3008] animate-pulse" />
            <span className="text-[#FF3008] font-bold text-sm tracking-wide uppercase">New Order!</span>
          </div>
          {/* Countdown ring */}
          <div className="relative w-12 h-12 flex-shrink-0">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="22" fill="none" stroke="#2a2a2a" strokeWidth="3" />
              <circle
                cx="24" cy="24" r="22" fill="none"
                stroke="#FF3008" strokeWidth="3"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold">
              {secondsLeft}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="px-6 py-4 space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-[#FF3008] text-lg flex-shrink-0 mt-0.5">📍</span>
            <div>
              <p className="text-gray-400 text-xs mb-0.5">Pickup from</p>
              <p className="text-white font-semibold text-sm">{job.restaurantName}</p>
              <p className="text-gray-400 text-xs">{job.restaurantAddress}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-gray-400 text-lg flex-shrink-0 mt-0.5">🏠</span>
            <div>
              <p className="text-gray-400 text-xs mb-0.5">Deliver to</p>
              <p className="text-white font-semibold text-sm">{maskedAddress}</p>
            </div>
          </div>

          {job.items.length > 0 && (
            <div className="flex items-start gap-3">
              <span className="text-gray-400 text-lg flex-shrink-0 mt-0.5">🍔</span>
              <div>
                <p className="text-gray-400 text-xs mb-0.5">Items</p>
                <p className="text-gray-300 text-xs">{job.items.join(', ')}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <span className="text-[#22c55e] font-bold">${(job.payAmount + job.tip).toFixed(2)}</span>
            <span className="text-gray-500 text-xs">
              (${job.payAmount.toFixed(2)} + ${job.tip.toFixed(2)} tip)
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onDecline}
            className="flex-1 border border-[#2a2a2a] text-gray-300 hover:text-white hover:border-gray-500 font-semibold py-3 rounded-xl transition-colors cursor-pointer"
          >
            Decline
          </button>
          <button
            onClick={onAccept}
            className="flex-1 bg-[#FF3008] hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition-colors cursor-pointer"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
