'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import ActiveToggle from '@/components/driver/ActiveToggle';
import EarningsDisplay from '@/components/driver/EarningsDisplay';
import JobNotification from '@/components/driver/JobNotification';
import type { DriverJob, DriverSession } from '@/lib/types';

// Dynamic import so Google Maps only loads client-side
const DriverMap = dynamic(() => import('@/components/driver/DriverMap'), { ssr: false });

type Phase =
  | 'idle'
  | 'active_waiting'
  | 'job_offered'
  | 'job_accepted_pickup'
  | 'job_accepted_deliver'
  | 'delivery_complete';

export default function DriverDashboardPage() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [session, setSession] = useState<DriverSession | null>(null);
  const [currentJob, setCurrentJob] = useState<DriverJob | null>(null);
  const [deliveryId, setDeliveryId] = useState<number | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [justEarned, setJustEarned] = useState<number>(0);
  const [loadingActive, setLoadingActive] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On mount — check for existing active session
  useEffect(() => {
    fetch('/api/driver/session')
      .then(r => r.json())
      .then(d => {
        if (d.session) {
          setSession(d.session);
          setPhase('active_waiting');
        }
      });
  }, []);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const pollForJob = useCallback(() => {
    stopPolling();
    const delay = 5000 + Math.random() * 5000; // 5–10s
    pollTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/driver/jobs');
        const data = await res.json();
        if (data.jobs?.length > 0) {
          setCurrentJob(data.jobs[0]);
          setPhase('job_offered');
        } else {
          pollForJob(); // keep polling
        }
      } catch {
        pollForJob();
      }
    }, delay);
  }, [stopPolling]);

  // Start polling when in active_waiting
  useEffect(() => {
    if (phase === 'active_waiting') {
      pollForJob();
    }
    return () => stopPolling();
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGoActive = async () => {
    setLoadingActive(true);
    try {
      const res = await fetch('/api/driver/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });
      const data = await res.json();
      setSession(data.session);
      setPhase('active_waiting');
    } finally {
      setLoadingActive(false);
    }
  };

  const handleGoOffline = async () => {
    stopPolling();
    await fetch('/api/driver/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'end' }),
    });
    setSession(null);
    setCurrentJob(null);
    setPhase('idle');
  };

  const handleAcceptJob = async () => {
    if (!currentJob || !session) return;
    try {
      const res = await fetch('/api/driver/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: currentJob.id,
          sessionId: session.id,
          orderId: currentJob.orderId,
          restaurantName: currentJob.restaurantName,
          restaurantAddress: currentJob.restaurantAddress,
          deliveryAddress: currentJob.deliveryAddress,
          payAmount: currentJob.payAmount,
          tip: currentJob.tip,
          isSimulated: currentJob.isSimulated,
        }),
      });
      const data = await res.json();
      setDeliveryId(data.deliveryId);
      setRouteInfo(null);
      setPhase('job_accepted_pickup');
    } catch {
      // Fall back to waiting
      setCurrentJob(null);
      setPhase('active_waiting');
    }
  };

  const handleDeclineJob = () => {
    setCurrentJob(null);
    setPhase('active_waiting');
  };

  const handlePickedUp = () => {
    setRouteInfo(null);
    setPhase('job_accepted_deliver');
  };

  const handleDelivered = async () => {
    if (!deliveryId || !session || !currentJob) return;
    try {
      const res = await fetch('/api/driver/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryId,
          sessionId: session.id,
          orderId: currentJob.orderId,
          isSimulated: currentJob.isSimulated,
        }),
      });
      const data = await res.json();
      setJustEarned(data.earned || 0);
      if (data.session) setSession(data.session);
      setPhase('delivery_complete');
      setTimeout(() => {
        setCurrentJob(null);
        setDeliveryId(null);
        setPhase('active_waiting');
      }, 3000);
    } catch {
      setPhase('active_waiting');
    }
  };

  const mapPhase = phase === 'job_accepted_pickup' ? 'pickup'
    : phase === 'job_accepted_deliver' ? 'deliver'
    : 'waiting';

  return (
    <div className="relative h-[calc(100vh-56px)] flex flex-col">
      {/* Map area */}
      {phase !== 'idle' && (
        <div className="flex-1 relative">
          <DriverMap
            phase={mapPhase}
            restaurantCoords={currentJob?.restaurantCoords}
            customerCoords={currentJob?.customerCoords}
            onRouteReady={(distance, duration) => setRouteInfo({ distance, duration })}
          />

          {/* Waiting overlay */}
          {phase === 'active_waiting' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
              <div className="bg-[#1a1a1a]/90 border border-[#2a2a2a] backdrop-blur-sm rounded-full px-5 py-2.5 flex items-center gap-2.5 shadow-lg">
                <span className="inline-block w-2 h-2 rounded-full bg-[#FF3008] animate-pulse" />
                <span className="text-white text-sm font-medium">Waiting for orders...</span>
              </div>
            </div>
          )}

          {/* Route info */}
          {routeInfo && (phase === 'job_accepted_pickup' || phase === 'job_accepted_deliver') && (
            <div className="absolute top-4 left-4 z-20 bg-[#1a1a1a]/90 border border-[#2a2a2a] rounded-xl px-4 py-3 shadow-lg">
              <p className="text-white font-semibold text-sm">{routeInfo.duration}</p>
              <p className="text-gray-400 text-xs">{routeInfo.distance}</p>
            </div>
          )}

          {/* Action cards */}
          {phase === 'job_accepted_pickup' && currentJob && (
            <div className="absolute bottom-20 left-0 right-0 px-4 z-20">
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 max-w-md mx-auto shadow-2xl">
                <p className="text-gray-400 text-xs mb-1">Picking up from</p>
                <p className="text-white font-semibold">{currentJob.restaurantName}</p>
                <p className="text-gray-400 text-sm mt-0.5">{currentJob.restaurantAddress}</p>
                <button
                  onClick={handlePickedUp}
                  className="w-full mt-4 bg-[#FF3008] text-white font-semibold py-3 rounded-xl hover:bg-red-700 transition-colors cursor-pointer"
                >
                  Picked Up — Head to Customer
                </button>
              </div>
            </div>
          )}

          {phase === 'job_accepted_deliver' && currentJob && (
            <div className="absolute bottom-20 left-0 right-0 px-4 z-20">
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 max-w-md mx-auto shadow-2xl">
                <p className="text-gray-400 text-xs mb-1">Delivering to</p>
                <p className="text-white font-semibold">{currentJob.deliveryAddress.replace(/^\d+/, '***')}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[#22c55e] font-bold">${(currentJob.payAmount + currentJob.tip).toFixed(2)}</span>
                  <span className="text-gray-400 text-xs">{currentJob.items.join(', ')}</span>
                </div>
                <button
                  onClick={handleDelivered}
                  className="w-full mt-4 bg-[#22c55e] text-white font-semibold py-3 rounded-xl hover:bg-green-600 transition-colors cursor-pointer"
                >
                  Mark as Delivered
                </button>
              </div>
            </div>
          )}

          {/* Delivery complete flash */}
          {phase === 'delivery_complete' && (
            <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/60">
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8 text-center shadow-2xl">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-white font-bold text-xl">Delivery Complete!</p>
                <p className="text-[#22c55e] font-bold text-2xl mt-2">+${justEarned.toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Idle state */}
      {phase === 'idle' && (
        <div className="flex-1">
          <ActiveToggle onGoActive={handleGoActive} loading={loadingActive} />
        </div>
      )}

      {/* Job offer overlay */}
      {phase === 'job_offered' && currentJob && (
        <JobNotification
          job={currentJob}
          onAccept={handleAcceptJob}
          onDecline={handleDeclineJob}
        />
      )}

      {/* Earnings bar */}
      {session && phase !== 'idle' && (
        <EarningsDisplay
          totalEarnings={session.total_earnings}
          deliveriesCompleted={session.deliveries_completed}
          onGoOffline={handleGoOffline}
        />
      )}
    </div>
  );
}
