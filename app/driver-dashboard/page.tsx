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

type SyncMessage =
  | { type: 'went_active'; session: DriverSession }
  | { type: 'went_offline' }
  | { type: 'job_offered'; job: DriverJob }
  | { type: 'job_accepted'; job: DriverJob; deliveryId: number }
  | { type: 'job_declined' }
  | { type: 'job_cancelled' }
  | { type: 'picked_up'; estimatedMinutes: number }
  | { type: 'delivery_complete'; earned: number; session: DriverSession | null };

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
  const [driverAvgRating, setDriverAvgRating] = useState<number | null>(null);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const orderStatusRef = useRef<string | null>(null);
  const [availableJobs, setAvailableJobs] = useState<DriverJob[]>([]);
  const [acceptingAvailableId, setAcceptingAvailableId] = useState<string | null>(null);
  const [acceptingJob, setAcceptingJob] = useState(false);
  const [delivering, setDelivering] = useState(false);
  const [takenNotice, setTakenNotice] = useState<string | null>(null);
  const takenNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  // Cross-tab sync via BroadcastChannel
  const syncChannelRef = useRef<BroadcastChannel | null>(null);
  // Always-fresh handler ref — updated each render so it closes over latest state/fns
  const syncHandlerRef = useRef<(msg: SyncMessage) => void>(() => {});

  // Fetch driver rating on mount
  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/driver-ratings/${user.id}`)
      .then(r => r.json())
      .then(d => { if (d.averageRating) setDriverAvgRating(d.averageRating); })
      .catch(() => {});
  }, [user?.id]);

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

  // Update sync handler every render so it always captures latest state and refs
  syncHandlerRef.current = (msg: SyncMessage) => {
    switch (msg.type) {
      case 'went_active':
        // Another tab started a session — sync immediately without waiting for a poll
        setSession(msg.session);
        setPhase('active_waiting');
        break;

      case 'went_offline':
        // Another tab went offline — clear everything
        if (pollTimerRef.current) { clearTimeout(pollTimerRef.current); pollTimerRef.current = null; }
        if (orderStatusPollRef.current) { clearTimeout(orderStatusPollRef.current); orderStatusPollRef.current = null; }
        if (availableJobsPollRef.current) { clearTimeout(availableJobsPollRef.current); availableJobsPollRef.current = null; }
        setSession(null); setCurrentJob(null); setDeliveryId(null);
        setAvailableJobs([]); setJobSidebarOpen(false); setUnreadCount(0);
        seenJobIdsRef.current = new Set();
        setOrderStatus(null); setSessionMinutes(0); setPhase('idle');
        break;

      case 'job_offered':
        // Another tab received a job offer — show the same offer here so the driver
        // can accept from any open tab
        if (phaseRef.current === 'active_waiting') {
          setCurrentJob(msg.job);
          setPhase('job_offered');
        }
        break;

      case 'job_accepted':
        // Another tab accepted — stop our polling and enter pickup phase
        if (pollTimerRef.current) { clearTimeout(pollTimerRef.current); pollTimerRef.current = null; }
        if (availableJobsPollRef.current) { clearTimeout(availableJobsPollRef.current); availableJobsPollRef.current = null; }
        setCurrentJob(msg.job);
        setDeliveryId(msg.deliveryId);
        setRouteInfo(null);
        setAvailableJobs([]); setJobSidebarOpen(false);
        setUnreadCount(0); seenJobIdsRef.current = new Set();
        setPhase('job_accepted_pickup');
        break;

      case 'job_declined':
        // Another tab declined — if we're showing the same offer, go back to waiting
        if (phaseRef.current === 'job_offered') {
          setCurrentJob(null);
          setPhase('active_waiting');
        }
        break;

      case 'job_cancelled':
        // Another tab cancelled the delivery
        if (orderStatusPollRef.current) { clearTimeout(orderStatusPollRef.current); orderStatusPollRef.current = null; }
        if (pollTimerRef.current) { clearTimeout(pollTimerRef.current); pollTimerRef.current = null; }
        setCurrentJob(null); setDeliveryId(null);
        setRouteInfo(null); setOrderStatus(null);
        setPhase('active_waiting');
        break;

      case 'picked_up':
        // Another tab marked the order picked up
        if (orderStatusPollRef.current) { clearTimeout(orderStatusPollRef.current); orderStatusPollRef.current = null; }
        setOrderStatus(null); setRouteInfo(null);
        setPhase('job_accepted_deliver');
        setSessionMinutes(m => m + Math.round(msg.estimatedMinutes / 2));
        break;

      case 'delivery_complete':
        // Another tab completed a delivery
        setJustEarned(msg.earned);
        if (msg.session) setSession(msg.session);
        setPhase('delivery_complete');
        setTimeout(() => {
          setCurrentJob(null);
          setDeliveryId(null);
          setPhase('active_waiting');
        }, 3000);
        break;
    }
  };

  // Open the BroadcastChannel once on mount; handler is always-fresh via ref
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const ch = new BroadcastChannel('driver-sync');
    syncChannelRef.current = ch;
    ch.onmessage = (e: MessageEvent<SyncMessage>) => syncHandlerRef.current(e.data);
    return () => { ch.close(); syncChannelRef.current = null; };
  }, []);

  const broadcast = useCallback((msg: SyncMessage) => {
    syncChannelRef.current?.postMessage(msg);
  }, []);

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

  // On mount: restore any existing active session (driver stays online across tab changes)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/driver/session');
        const data = await res.json();
        if (data.session) {
          setSession(data.session);
          if (data.activeDelivery) {
            setCurrentJob(data.activeDelivery.job);
            setDeliveryId(data.activeDelivery.deliveryId);
            setOrderStatus(data.activeDelivery.orderStatus);
            setPhase(data.activeDelivery.phase as Phase);
          } else {
            setPhase('active_waiting');
          }
        }
      } catch { /* ignore */ }
    })();
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

  const showTakenNotice = useCallback((msg: string) => {
    if (takenNoticeTimerRef.current) clearTimeout(takenNoticeTimerRef.current);
    setTakenNotice(msg);
    takenNoticeTimerRef.current = setTimeout(() => setTakenNotice(null), 3500);
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
          broadcast({ type: 'job_offered', job: data.jobs[0] });
        } else {
          pollForJob();
        }
      } catch {
        pollForJob();
      }
    }, delay);
  }, [stopPolling, broadcast]);

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
        if (data.status === 'cancelled') {
          // Restaurant cancelled the order — boot driver back to waiting
          setCurrentJob(null);
          setDeliveryId(null);
          setRouteInfo(null);
          setOrderStatus(null);
          setPhase('active_waiting');
          showTakenNotice('Order was cancelled by the restaurant.');
          return;
        }
        if (data.status) setOrderStatus(data.status);
      } catch { /* ignore */ }
      if (phaseRef.current === 'job_accepted_pickup') pollOrderStatus(orderId);
    }, 3000);
  }, [stopOrderStatusPoll, showTakenNotice]);

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
      broadcast({ type: 'went_active', session: data.session });
    } finally {
      setLoadingActive(false);
    }
  }, [broadcast]);

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
    broadcast({ type: 'went_offline' });
  }, [stopPolling, stopAvailableJobsPoll, stopOrderStatusPoll, broadcast]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
    router.refresh();
  };

  const handleAcceptJob = async () => {
    if (!currentJob || !session || acceptingJob) return;
    setAcceptingJob(true);
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
          restaurantCoords: currentJob.restaurantCoords,
          deliveryAddress: currentJob.deliveryAddress,
          customerCoords: currentJob.customerCoords,
          payAmount: currentJob.payAmount,
          tip: currentJob.tip,
          isSimulated: currentJob.isSimulated,
          totalMiles: currentJob.totalMiles,
          estimatedMinutes: currentJob.estimatedMinutes,
        }),
      });
      const data = await res.json();
      if (res.status === 409) {
        setCurrentJob(null);
        setPhase('active_waiting');
        showTakenNotice('Another driver already took this job.');
        return;
      }
      setDeliveryId(data.deliveryId);
      setRouteInfo(null);
      setPhase('job_accepted_pickup');
      broadcast({ type: 'job_accepted', job: currentJob!, deliveryId: data.deliveryId });
    } catch {
      setCurrentJob(null);
      setPhase('active_waiting');
    } finally {
      setAcceptingJob(false);
    }
  };

  const handleDeclineJob = async () => {
    const job = currentJobRef.current;
    setCurrentJob(null);
    setPhase('active_waiting');
    broadcast({ type: 'job_declined' });
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
          restaurantCoords: job.restaurantCoords,
          deliveryAddress: job.deliveryAddress,
          customerCoords: job.customerCoords,
          payAmount: job.payAmount,
          tip: job.tip,
          isSimulated: false,
          totalMiles: job.totalMiles,
          estimatedMinutes: job.estimatedMinutes,
        }),
      });
      if (res.status === 409) {
        // Remove immediately so UI doesn't show a stale card, then refresh
        setAvailableJobs(prev => prev.filter(j => j.id !== job.id));
        showTakenNotice('Another driver already took this job.');
        const coords = driverCoordsRef.current;
        const qs = coords ? `?lat=${coords.lat}&lng=${coords.lng}` : '';
        fetch(`/api/driver/available-jobs${qs}`)
          .then(r => r.json())
          .then(d => setAvailableJobs(d.jobs ?? []))
          .catch(() => {});
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
      broadcast({ type: 'job_accepted', job, deliveryId: data.deliveryId });
    } catch { /* ignore */ } finally {
      setAcceptingAvailableId(null);
    }
  };


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
    broadcast({ type: 'job_cancelled' });
    // Refresh available jobs so the cancelled order appears in the sidebar
    try {
      const coords = driverCoordsRef.current;
      const qs = coords ? `?lat=${coords.lat}&lng=${coords.lng}` : '';
      const res = await fetch(`/api/driver/available-jobs${qs}`);
      const data = await res.json();
      setAvailableJobs(data.jobs ?? []);
    } catch { /* ignore */ }
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
      broadcast({ type: 'picked_up', estimatedMinutes: currentJob.estimatedMinutes });
    }
  };

  const handleDelivered = async () => {
    if (!deliveryId || !session || !currentJob || delivering) return;
    setDelivering(true);
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
      broadcast({ type: 'delivery_complete', earned: data.earned || 0, session: data.session ?? null });
      setTimeout(() => {
        setCurrentJob(null);
        setDeliveryId(null);
        setPhase('active_waiting');
      }, 3000);
    } catch {
      setPhase('active_waiting');
    } finally {
      setDelivering(false);
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
    <div className="flex flex-col flex-1 min-h-0 bg-black">
      {/* Header */}
      <header className="bg-black border-b border-[#2a2a2a] h-14 flex items-center px-4 flex-shrink-0 z-40">
        <div className="w-full flex items-center justify-between gap-4">
          {/* Left — Jobs button + branding or session stats */}
          <div className="flex items-center gap-3">
            {phase === 'active_waiting' && (
              <button
                onClick={openJobSidebar}
                className="relative w-9 h-9 flex items-center justify-center border border-[#2a2a2a] text-gray-400 hover:text-white hover:border-gray-500 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                aria-label="Open available jobs"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M2.5 3.5a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-11zm0 4a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-11zm0 4a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-11z"/>
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#FF3008] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}
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
                {driverAvgRating && (
                  <div>
                    <p className="text-gray-400 text-xs">Rating</p>
                    <p className="text-yellow-400 font-bold text-base leading-tight">★ {driverAvgRating.toFixed(1)}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-[#FF3008] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-xs">D</span>
                </div>
                <span className="text-white font-semibold text-sm">Welcome Dasher</span>
              </div>
            )}
          </div>

          {/* Right — History + Avatar (hidden when active) */}
          <div className="flex items-center gap-2 flex-shrink-0">

            {phase === 'idle' && (
              <Link
                href="/driver-dashboard/history"
                className="border border-[#2a2a2a] text-gray-400 hover:text-white hover:border-gray-500 px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                History
              </Link>
            )}

            {/* Avatar dropdown */}
            {phase === 'idle' && (
            <div ref={avatarRef} className="relative">
              <button
                onClick={() => setAvatarOpen(o => !o)}
                className="w-8 h-8 rounded-full bg-[#FF3008] flex items-center justify-center text-white font-bold text-sm transition-opacity overflow-hidden cursor-pointer hover:opacity-90"
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
            )}
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

        {/* Floating stop button */}
        {session && phase !== 'job_accepted_pickup' && phase !== 'job_accepted_deliver' && phase !== 'delivery_complete' && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
            <button
              onClick={handleGoOffline}
              aria-label="Go offline"
              className="w-20 h-20 rounded-full bg-[#e02a07] hover:bg-[#b82006] border-4 border-[#e02a07] hover:border-[#b82006] shadow-2xl flex items-center justify-center active:scale-95 transition-all cursor-pointer group"
            >
              <span className="w-7 h-7 rounded-sm bg-black group-hover:bg-[#1a1a1a] transition-colors block" />
            </button>
          </div>
        )}

        {/* Waiting indicator */}
        {phase === 'active_waiting' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
            <div className="bg-[#1a1a1a]/90 border border-[#2a2a2a] backdrop-blur-sm rounded-full px-5 py-2.5 flex items-center gap-2.5 shadow-lg">
              <span className="inline-block w-2 h-2 rounded-full bg-[#FF3008] animate-pulse" />
              <span className="text-white text-sm font-medium">Waiting for orders...</span>
            </div>
          </div>
        )}

        {/* Jobs sidebar — always rendered, slides in/out */}
        <div className={`absolute inset-0 z-30 flex transition-opacity duration-300 ${jobSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={closeJobSidebar} />
          {/* Sidebar panel */}
          <div className={`relative w-80 max-w-full h-full bg-[#1a1a1a] border-r border-[#2a2a2a] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${jobSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
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
              {currentJob.restaurantName && (
                <p className="text-white font-semibold">{currentJob.restaurantName}</p>
              )}
              <p className="text-gray-400 text-sm">{currentJob.restaurantAddress}</p>
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
                  key={currentJob.orderId}
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
              {currentJob.restaurantName && (
                <p className="text-gray-500 text-xs mb-2">From {currentJob.restaurantName}</p>
              )}
              <p className="text-gray-400 text-xs mb-1">Delivering to</p>
              <p className="text-white font-semibold">{currentJob.deliveryAddress}</p>
              {(currentJob.handoffOption || currentJob.deliveryInstructions) && (
                <div className="mt-2 bg-[#2a2a2a] rounded-xl px-3 py-2 space-y-0.5">
                  {currentJob.handoffOption && (
                    <p className="text-gray-300 text-xs">
                      {currentJob.handoffOption === 'leave_at_door' ? '🚪 Leave at door' : '🤝 Hand it to customer'}
                    </p>
                  )}
                  {currentJob.deliveryInstructions && (
                    <p className="text-gray-400 text-xs italic">&ldquo;{currentJob.deliveryInstructions}&rdquo;</p>
                  )}
                </div>
              )}
              <div className="flex items-center mt-2">
                <span className="text-[#22c55e] font-bold">${(currentJob.payAmount + currentJob.tip).toFixed(2)}</span>
              </div>
              <button
                onClick={handleDelivered}
                disabled={delivering}
                className="w-full mt-4 bg-[#22c55e] text-white font-semibold py-3 rounded-xl hover:bg-green-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {delivering ? 'Completing…' : 'Mark as Delivered'}
              </button>
              {currentJob && !currentJob.isSimulated && currentJob.orderId && user && (
                <DeliveryChat
                  key={currentJob.orderId}
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
            isAccepting={acceptingJob}
          />
        )}

        {/* Job taken toast */}
        {takenNotice && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            <div className="bg-[#1a1a1a] border border-[#3a3a3a] text-white text-sm font-medium px-5 py-3 rounded-full shadow-2xl flex items-center gap-2 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
              {takenNotice}
            </div>
          </div>
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
