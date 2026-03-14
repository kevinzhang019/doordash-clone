'use client';

import { useEffect, useRef, useState } from 'react';
import type { DriverJob } from '@/lib/types';

const COUNTDOWN_SECONDS = 15;

interface JobNotificationProps {
  job: DriverJob;
  onAccept: () => void;
  onDecline: () => void;
  isAccepting?: boolean;
}

export default function JobNotification({ job, onAccept, onDecline, isAccepting = false }: JobNotificationProps) {
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSecondsLeft(COUNTDOWN_SECONDS);
    timerRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          setTimeout(() => onDecline(), 0);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [job.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const progress = secondsLeft / COUNTDOWN_SECONDS;
  const circumference = 2 * Math.PI * 22;
  const strokeDashoffset = circumference * (1 - progress);
  const estimatedMins = job.estimatedMinutes;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="w-full max-w-sm bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-[#2a2a2a]">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#FF3008] animate-pulse" />
            <span className="text-[#FF3008] font-bold text-sm tracking-wide uppercase">New Order</span>
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
        <div className="px-6 py-5 space-y-4">
          {/* Pickup address */}
          <div className="flex items-start gap-3">
            <span className="text-[#FF3008] mt-0.5 flex-shrink-0">📍</span>
            <div>
              <p className="text-gray-400 text-xs mb-0.5">Pickup</p>
              <p className="text-white font-semibold text-sm">{job.restaurantAddress}</p>
            </div>
          </div>

          {/* Estimated time */}
          <div className="flex items-start gap-3">
            <span className="text-gray-400 mt-0.5 flex-shrink-0">⏱</span>
            <div>
              <p className="text-gray-400 text-xs mb-0.5">Estimated delivery time</p>
              <p className="text-white font-semibold text-sm">~{estimatedMins} min</p>
            </div>
          </div>

          {/* Pay breakdown */}
          <div className="bg-[#242424] rounded-xl p-3.5 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Base pay</span>
              <span className="text-white">${job.payAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Tip</span>
              <span className="text-white">${job.tip.toFixed(2)}</span>
            </div>
            <div className="h-px bg-[#333]" />
            <div className="flex justify-between text-sm font-bold">
              <span className="text-white">Total</span>
              <span className="text-[#22c55e]">${(job.payAmount + job.tip).toFixed(2)}</span>
            </div>
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
            disabled={isAccepting}
            className="flex-1 bg-[#FF3008] hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isAccepting ? 'Accepting...' : 'Accept'}
          </button>
        </div>
      </div>
    </div>
  );
}
