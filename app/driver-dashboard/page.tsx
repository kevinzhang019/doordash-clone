'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import JobNotification from '@/components/driver/JobNotification';
import DeliveryChat from '@/components/driver/DeliveryChat';
import type { DriverJob, DriverSession } from '@/lib/types';

const DriverMap = dynamic(() => import('@/components/driver/DriverMap'), { ssr: false });

type Phase =
  | 'idle'
  | 'active_waiting'
  | 'job_offered'
  | 'job_accepted_pickup'
  | 'job_accepted_deliver'
  | 'delivery_complete';

// Augment Window type for simulation console commands
declare global {
  interface Window {
    __enableSimulation: () => void;
    __disableSimulation: () => void;
  }
}

export default function DriverDashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('idle');
  const [session, setSession] = useState<DriverSession | null>(null);
  const [currentJob, setCurrentJob] = useState<DriverJob | null>(null);
  const [deliveryId, setDeliveryId] = useState<number | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [justEarned, setJustEarned] = useState<number>(0);
  const [sessionMinutes, setSessionMinutes] = useState(0);
  const [loadingActive, setLoadingActive] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const orderStatusRef = useRef<string | null>(null);
  const [availableJobs, setAvailableJobs] = useState<DriverJob[]>([]);
  const [acceptingAvailableId, setAcceptingAvailableId] = useState<string | null>(null);
  const [jobSidebarOpen, setJobSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const seenJobIdsRef = useRef<Set<string>>(new Set());
  const jobSidebarOpenRef = useRef(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const orderStatusPollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const availableJobsPollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const driverCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  // Refs so event handlers always see the latest values without re-registering
  const sessionRef = useRef<DriverSession | null>(null);
  const phaseRef = useRef<Phase>('idle');
  const deliveryIdRef = useRef<number | null>(null);
  const currentJobRef = useRef<DriverJob | null>(null);

  // Register simulation console commands (one-time)
  useEffect(() => {
    window.__enableSimulation = () => {
      localStorage.setItem('simulate_jobs', '1');
      console.log('[Driver] Simulation enabled — will receive fake jobs when no real orders exist.');
    };
    window.__disableSimulation = () => {
      localStorage.removeItem('simulate_jobs');
      console.log('[Driver] Simulation disabled.');
    };
  }, []);

  // Track driver GPS for job polling
  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => { driverCoordsRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude }; },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { orderStatusRef.current = orderStatus; }, [orderStatus]);
  useEffect(() => { sessionRef.current = session; }, [session]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { deliveryIdRef.current = deliveryId; }, [deliveryId]);
  useEffect(() => { currentJobRef.current = currentJob; }, [currentJob]);
  useEffect(() => { jobSidebarOpenRef.current = jobSidebarOpen; }, [jobSidebarOpen]);

  // Track unread jobs when sidebar is closed
  useEffect(() => {
    const newJobs = availableJobs.filter(j => !seenJobIdsRef.current.has(j.id));
    if (newJobs.length > 0) {
      newJobs.forEach(j => seenJobIdsRef.current.add(j.id));
      if (!jobSidebarOpenRef.current) {
        setUnreadCount(c => c + newJobs.length);
      }
    }
  }, [availableJobs]);

  // Always start offline — end any session left over from a previous visit
  useEffect(() => {
    fetch('/api/driver/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'end' }),
    }).catch(() => {});
  }, []);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const stopOrderStatusPoll = useCallback(() => {
    if (orderStatusPollRef.current) {
      clearTimeout(orderStatusPollRef.current);
      orderStatusPollRef.current = null;
    }
  }, []);

  const stopAvailableJobsPoll = useCallback(() => {
    if (availableJobsPollRef.current) {
      clearTimeout(availableJobsPollRef.current);
      availableJobsPollRef.current = null;
    }
  }, []);

  const pollForJob = useCallback(() => {
    stopPolling();
    const delay = 5000 + Math.random() * 5000;
    pollTimerRef.current = setTimeout(async () => {
      try {
        const coords = driverCoordsRef.current;
        const range = parseInt(localStorage.getItem('driverRange') ?? '') || 10;
        const simulate = localStorage.getItem('simulate_jobs') === '1';
        const qs = new URLSearchParams({ range: String(range) });
        if (coords) { qs.set('lat', String(coords.lat)); qs.set('lng', String(coords.lng)); }
        if (simulate) qs.set('simulate', 'true');
        const res = await fetch(`/api/driver/jobs?${qs}`);
        const data = await res.json();
        if (data.jobs?.length > 0) {
          setCurrentJob(data.jobs[0]);
          setPhase('job_offered');
        } else {
          pollForJob();
        }
      } catch {
        pollForJob();
      }
    }, delay);
  }, [stopPolling]);

  // Poll available jobs during active_waiting
  const pollAvailableJobs = useCallback(() => {
    stopAvailableJobsPoll();
    availableJobsPollRef.current = setTimeout(async () => {
      try {
        const coords = driverCoordsRef.current;
        const qs = coords ? `?lat=${coords.lat}&lng=${coords.lng}` : '';
        const res = await fetch(`/api/driver/available-jobs${qs}`);
        const data = await res.json();
        setAvailableJobs(data.jobs ?? []);
      } catch { /* ignore */ }
      if (phaseRef.current === 'active_waiting') pollAvailableJobs();
    }, 10000);
  }, [stopAvailableJobsPoll]);

  // Poll order status during pickup phase
  const pollOrderStatus = useCallback((orderId: number) => {
    stopOrderStatusPoll();
    orderStatusPollRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/driver/orders/${orderId}`);
        const data = await res.json();
        if (data.status) setOrderStatus(data.status);
      } catch { /* ignore */ }
      if (phaseRef.current === 'job_accepted_pickup') pollOrderStatus(orderId);
    }, 3000);
  }, [stopOrderStatusPoll]);

  useEffect(() => {
    if (phase === 'active_waiting') {
      pollForJob();
      // Fetch available jobs immediately, then start polling
      (async () => {
        try {
          const coords = driverCoordsRef.current;
          const qs = coords ? `?lat=${coords.lat}&lng=${coords.lng}` : '';
          const res = await fetch(`/api/driver/available-jobs${qs}`);
          const data = await res.json();
          setAvailableJobs(data.jobs ?? []);
        } catch { /* ignore */ }
        pollAvailableJobs();
      })();
    }
    return () => {
      stopPolling();
      stopAvailableJobsPoll();
    };
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase === 'job_accepted_pickup' && currentJob?.orderId && !currentJob.isSimulated) {
      setOrderStatus(null);
      // Fetch immediately so button state is correct without waiting for the first poll tick
      fetch(`/api/driver/orders/${currentJob.orderId}`)
        .then(r => r.json())
        .then(d => { if (d.status) setOrderStatus(d.status); })
        .catch(() => {});
      pollOrderStatus(currentJob.orderId);
    }
    if (phase !== 'job_accepted_pickup') {
      stopOrderStatusPoll();
    }
  }, [phase, currentJob]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGoActive = useCallback(async () => {
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
  }, []);

  const openJobSidebar = () => {
    setJobSidebarOpen(true);
    setUnreadCount(0);
  };

  const closeJobSidebar = () => setJobSidebarOpen(false);

  const handleGoOffline = useCallback(async () => {
    stopPolling();
    stopAvailableJobsPoll();
    stopOrderStatusPoll();

    // Cancel any active delivery before going offline
    const activeDeliveryId = deliveryIdRef.current;
    const activeJob = currentJobRef.current;
    if (activeDeliveryId || (activeJob && !activeJob.isSimulated && activeJob.orderId)) {
      await fetch('/api/driver/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryId: activeDeliveryId, orderId: activeJob?.orderId }),
      });
    }

    await fetch('/api/driver/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'end' }),
    });
    setSession(null);
    setCurrentJob(null);
    setDeliveryId(null);
    setAvailableJobs([]);
    setJobSidebarOpen(false);
    setUnreadCount(0);
    seenJobIdsRef.current = new Set();
    setOrderStatus(null);
    setSessionMinutes(0);
    setPhase('idle');
  }, [stopPolling, stopAvailableJobsPoll, stopOrderStatusPoll]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
    router.refresh();
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
          totalMiles: currentJob.totalMiles,
          estimatedMinutes: currentJob.estimatedMinutes,
        }),
      });
      const data = await res.json();
      if (res.status === 409) {
        // Someone else grabbed it — go back to waiting
        setCurrentJob(null);
        setPhase('active_waiting');
        return;
      }
      setDeliveryId(data.deliveryId);
      setRouteInfo(null);
      setPhase('job_accepted_pickup');
    } catch {
      setCurrentJob(null);
      setPhase('active_waiting');
    }
  };

  const handleDeclineJob = async () => {
    const job = currentJobRef.current;
    setCurrentJob(null);
    setPhase('active_waiting');
    // For real orders, record the decline server-side
    if (job && !job.isSimulated && job.orderId) {
      try {
        await fetch('/api/driver/decline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: job.orderId }),
        });
        // Refresh available jobs list
        const coords = driverCoordsRef.current;
        const qs = coords ? `?lat=${coords.lat}&lng=${coords.lng}` : '';
        const res = await fetch(`/api/driver/available-jobs${qs}`);
        const data = await res.json();
        setAvailableJobs(data.jobs ?? []);
      } catch { /* ignore */ }
    }
  };

  const handleAcceptAvailableJob = async (job: DriverJob) => {
    if (!session) return;
    setAcceptingAvailableId(job.id);
    try {
      const res = await fetch('/api/driver/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          sessionId: session.id,
          orderId: job.orderId,
          restaurantName: job.restaurantName,
          restaurantAddress: job.restaurantAddress,
          deliveryAddress: job.deliveryAddress,
          payAmount: job.payAmount,
          tip: job.tip,
          isSimulated: false,
          totalMiles: job.totalMiles,
          estimatedMinutes: job.estimatedMinutes,
        }),
      });
      if (res.status === 409) {
        // Already taken — refresh available list
        const coords = driverCoordsRef.current;
        const qs = coords ? `?lat=${coords.lat}&lng=${coords.lng}` : '';
        const r2 = await fetch(`/api/driver/available-jobs${qs}`);
        const d2 = await r2.json();
        setAvailableJobs(d2.jobs ?? []);
        return;
      }
      const data = await res.json();
      setCurrentJob(job);
      setDeliveryId(data.deliveryId);
      setRouteInfo(null);
      stopPolling();
      setAvailableJobs([]);
      setJobSidebarOpen(false);
      setUnreadCount(0);
      seenJobIdsRef.current = new Set();
      setPhase('job_accepted_pickup');
    } catch { /* ignore */ } finally {
      setAcceptingAvailableId(null);
    }
  };

  // Go offline automatically when the driver leaves the tab
  useEffect(() => {
    const sendOfflineBeacon = () => {
      if (!sessionRef.current) return;
      const sessionBlob = new Blob([JSON.stringify({ action: 'end' })], { type: 'application/json' });
      navigator.sendBeacon('/api/driver/session', sessionBlob);
      if (deliveryIdRef.current) {
        const cancelBlob = new Blob(
          [JSON.stringify({ deliveryId: deliveryIdRef.current, orderId: currentJobRef.current?.orderId })],
          { type: 'application/json' }
        );
        navigator.sendBeacon('/api/driver/cancel', cancelBlob);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && sessionRef.current) {
        handleGoOffline();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', sendOfflineBeacon);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', sendOfflineBeacon);
    };
  }, [handleGoOffline]);

  // Keyboard shortcuts: Space = Go Active (idle) or Go Offline (waiting), Esc = Go Offline
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLButtonElement || e.target instanceof HTMLInputElement) return;
      const p = phaseRef.current;
      if ((e.code === 'Space' || e.code === 'Escape') && p === 'active_waiting' && sessionRef.current) {
        e.preventDefault();
        handleGoOffline();
      } else if (e.code === 'Space' && p === 'idle') {
        e.preventDefault();
        handleGoActive();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleGoOffline, handleGoActive]);

  const handleCancelJob = async () => {
    stopPolling();
    stopOrderStatusPoll();
    await fetch('/api/driver/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deliveryId, orderId: currentJob?.orderId }),
    });
    setCurrentJob(null);
    setDeliveryId(null);
    setRouteInfo(null);
    setOrderStatus(null);
    setPhase('active_waiting');
  };

  const handlePickedUp = async () => {
    // For real orders: call PUT to set status = 'picked_up'
    if (currentJob && !currentJob.isSimulated && currentJob.orderId) {
      try {
        await fetch(`/api/driver/orders/${currentJob.orderId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'picked_up' }),
        });
      } catch { /* ignore */ }
    }
    stopOrderStatusPoll();
    setOrderStatus(null);
    setRouteInfo(null);
    setPhase('job_accepted_deliver');
    if (currentJob) {
      setSessionMinutes(m => m + Math.round(currentJob.estimatedMinutes / 2));
    }
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
      setSessionMinutes(m => m + (currentJob.estimatedMinutes - Math.round(currentJob.estimatedMinutes / 2)));
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

  // Parse Google Maps duration text ("8 mins", "1 hour 5 mins") to minutes
  const parseDurationMins = (text: string): number => {
    let total = 0;
    const hourMatch = text.match(/(\d+)\s*hour/i);
    const minMatch = text.match(/(\d+)\s*min/i);
    if (hourMatch) total += parseInt(hourMatch[1]) * 60;
    if (minMatch) total += parseInt(minMatch[1]);
    return total || 1;
  };

  const handleRouteReady = useCallback(async (distance: string, duration: string) => {
    setRouteInfo({ distance, duration });
    const job = currentJobRef.current;
    if (!job || job.isSimulated || !job.orderId) return;

    const durationMins = parseDurationMins(duration);
    const currentPhase = phaseRef.current;
    let etaMins: number;

    if (currentPhase === 'job_accepted_pickup') {
      // duration = driver → restaurant; add rough estimate for restaurant → customer
      const leg2Estimate = Math.round(job.estimatedMinutes / 2);
      etaMins = durationMins + leg2Estimate;
      if (orderStatusRef.current === 'preparing') etaMins += 5;
    } else if (currentPhase === 'job_accepted_deliver') {
      // duration = restaurant → customer (map origin is fixed at restaurant)
      etaMins = durationMins;
    } else {
      return;
    }

    const estimatedDeliveryAt = new Date(Date.now() + etaMins * 60000).toISOString();
    fetch(`/api/driver/orders/${job.orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estimated_delivery_at: estimatedDeliveryAt }),
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const mapPhase = phase === 'job_accepted_pickup' ? 'pickup'
    : phase === 'job_accepted_deliver' ? 'deliver'
    : 'waiting';

  // Determine if pickup button should be enabled
  const isRealJob = currentJob && !currentJob.isSimulated;
  const pickupReady = !isRealJob || orderStatus === 'ready' || orderStatus === 'picked_up';

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Header */}
      <header className="bg-black border-b border-[#2a2a2a] h-14 flex items-center px-4 flex-shrink-0 z-40">
        <div className="w-full flex items-center justify-between gap-4">
          {/* Left — branding or session stats */}
          {session ? (
            <div className="flex gap-5">
              <div>
                <p className="text-gray-400 text-xs">Earnings</p>
                <p className="text-[#22c55e] font-bold text-base leading-tight">${session.total_earnings.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Deliveries</p>
                <p className="text-white font-bold text-base leading-tight">{session.deliveries_completed}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Time</p>
                <p className="text-white font-bold text-base leading-tight">
                  {sessionMinutes < 60 ? `${sessionMinutes}m` : `${Math.floor(sessionMinutes / 60)}h ${sessionMinutes % 60}m`}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-[#FF3008] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs">D</span>
              </div>
              <span className="text-white font-semibold text-sm">Driver Mode</span>
            </div>
          )}

          {/* Right — Go Offline + History + Avatar */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {session && phase !== 'job_accepted_pickup' && phase !== 'job_accepted_deliver' && (
              <button
                onClick={handleGoOffline}
                className="border border-[#2a2a2a] text-gray-300 hover:text-white hover:border-gray-500 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                Go Offline
              </button>
            )}

            {phase === 'active_waiting' && (
              <button
                onClick={openJobSidebar}
                className="relative border border-[#2a2a2a] text-gray-400 hover:text-white hover:border-gray-500 px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer"
              >
                Jobs
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#FF3008] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}

            <Link
              href="/driver-dashboard/history"
              className="border border-[#2a2a2a] text-gray-400 hover:text-white hover:border-gray-500 px-3 py-1.5 rounded-lg text-sm transition-colors"
            >
              History
            </Link>

            {/* Avatar dropdown */}
            <div ref={avatarRef} className="relative">
              <button
                onClick={() => setAvatarOpen(o => !o)}
                className="w-8 h-8 rounded-full bg-[#FF3008] flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity overflow-hidden"
              >
                {user?.avatar_url ? (
                  <Image src={user.avatar_url} alt={user.name} width={32} height={32} className="object-cover w-full h-full" unoptimized />
                ) : (
                  user?.name?.[0]?.toUpperCase() ?? '?'
                )}
              </button>
              {avatarOpen && (
                <div className="absolute right-0 top-10 w-44 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden z-50">
                  <Link
                    href="/driver-dashboard/profile"
                    onClick={() => setAvatarOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-3 text-sm text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors"
                  >
                    Settings
                  </Link>
                  <div className="h-px bg-[#2a2a2a]" />
                  <button
                    onClick={() => { setAvatarOpen(false); handleLogout(); }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Map area — fills remaining space */}
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0">
          <DriverMap
            phase={mapPhase}
            restaurantCoords={currentJob?.restaurantCoords}
            customerCoords={currentJob?.customerCoords}
            onRouteReady={handleRouteReady}
          />
        </div>

        {/* Waiting indicator */}
        {phase === 'active_waiting' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
            <div className="bg-[#1a1a1a]/90 border border-[#2a2a2a] backdrop-blur-sm rounded-full px-5 py-2.5 flex items-center gap-2.5 shadow-lg">
              <span className="inline-block w-2 h-2 rounded-full bg-[#FF3008] animate-pulse" />
              <span className="text-white text-sm font-medium">Waiting for orders...</span>
            </div>
          </div>
        )}

        {/* Jobs sidebar */}
        {jobSidebarOpen && (
          <div className="absolute inset-0 z-30 flex">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={closeJobSidebar} />
            {/* Sidebar panel */}
            <div className="relative w-80 max-w-full h-full bg-[#1a1a1a] border-r border-[#2a2a2a] shadow-2xl flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2a]">
                <p className="text-white font-semibold text-sm">Available Jobs</p>
                <button onClick={closeJobSidebar} className="text-gray-400 hover:text-white transition-colors cursor-pointer text-lg leading-none">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {availableJobs.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center mt-8">No jobs available right now.</p>
                ) : (
                  <div className="space-y-3">
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Previously Declined — Still Available</p>
                    {availableJobs.map(job => (
                      <div key={job.id} className="bg-[#242424] rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="min-w-0">
                            <p className="text-white text-sm font-medium truncate">{job.restaurantName || job.restaurantAddress}</p>
                            <p className="text-gray-400 text-xs mt-0.5">{job.estimatedMinutes} min · {job.totalMiles ? `${job.totalMiles.toFixed(1)} mi` : ''}</p>
                          </div>
                          <span className="text-[#22c55e] font-bold text-sm flex-shrink-0">${(job.payAmount + job.tip).toFixed(2)}</span>
                        </div>
                        <button
                          onClick={() => handleAcceptAvailableJob(job)}
                          disabled={acceptingAvailableId === job.id}
                          className="w-full bg-[#22c55e] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {acceptingAvailableId === job.id ? 'Accepting...' : 'Accept Job'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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

        {/* Pickup card */}
        {phase === 'job_accepted_pickup' && currentJob && (
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 z-20">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 max-w-md mx-auto shadow-2xl">
              <p className="text-gray-400 text-xs mb-1">Picking up from</p>
              <p className="text-white font-semibold">{currentJob.restaurantAddress}</p>
              {isRealJob && !pickupReady && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                  <span className="text-yellow-400 text-sm">Waiting for restaurant to mark ready...</span>
                </div>
              )}
              {isRealJob && orderStatus === 'ready' && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-green-400 text-sm font-medium">Order is ready for pickup!</span>
                </div>
              )}
              <button
                onClick={handlePickedUp}
                disabled={!pickupReady}
                className={`w-full mt-4 text-white font-semibold py-3 rounded-xl transition-colors cursor-pointer ${
                  pickupReady
                    ? 'bg-[#FF3008] hover:bg-red-700'
                    : 'bg-gray-600 cursor-not-allowed opacity-60'
                }`}
              >
                {pickupReady ? 'Picked Up — Head to Customer' : 'Waiting for restaurant...'}
              </button>
              {currentJob && !currentJob.isSimulated && currentJob.orderId && user && (
                <DeliveryChat
                  orderId={currentJob.orderId}
                  currentUserId={user.id}
                  isActive
                />
              )}
              <button
                onClick={handleCancelJob}
                className="w-full mt-2 text-gray-400 hover:text-white text-sm py-2 transition-colors cursor-pointer"
              >
                Cancel Job
              </button>
            </div>
          </div>
        )}

        {/* Deliver card */}
        {phase === 'job_accepted_deliver' && currentJob && (
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 z-20">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 max-w-md mx-auto shadow-2xl">
              <p className="text-gray-400 text-xs mb-1">Delivering to</p>
              <p className="text-white font-semibold">{currentJob.deliveryAddress}</p>
              <div className="flex items-center mt-2">
                <span className="text-[#22c55e] font-bold">${(currentJob.payAmount + currentJob.tip).toFixed(2)}</span>
              </div>
              <button
                onClick={handleDelivered}
                className="w-full mt-4 bg-[#22c55e] text-white font-semibold py-3 rounded-xl hover:bg-green-600 transition-colors cursor-pointer"
              >
                Mark as Delivered
              </button>
              {currentJob && !currentJob.isSimulated && currentJob.orderId && user && (
                <DeliveryChat
                  orderId={currentJob.orderId}
                  currentUserId={user.id}
                  isActive
                />
              )}
              <button
                onClick={handleCancelJob}
                className="w-full mt-2 text-gray-400 hover:text-white text-sm py-2 transition-colors cursor-pointer"
              >
                Cancel Job
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

        {/* Job offer modal */}
        {phase === 'job_offered' && currentJob && (
          <JobNotification
            job={currentJob}
            onAccept={handleAcceptJob}
            onDecline={handleDeclineJob}
          />
        )}

        {/* Go Active button — idle state */}
        {phase === 'idle' && (
          <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-6 pt-16 bg-gradient-to-t from-black/70 to-transparent">
            <button
              onClick={handleGoActive}
              disabled={loadingActive}
              className="w-full max-w-sm mx-auto block bg-[#FF3008] hover:bg-red-700 text-white font-bold text-lg py-5 rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-red-900/40"
            >
              {loadingActive ? 'Starting...' : 'Go Active'}
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
