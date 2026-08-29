import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Clock, 
  BellRing, 
  QrCode, 
  Hourglass, 
  Tv, 
  Layers, 
  CheckCircle2, 
  Zap,
  Download,
  Check,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import confetti from 'canvas-confetti';

export const BentoBenefitsGrid: React.FC = () => {
  // Interactive Modals State
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isDelayModalOpen, setIsDelayModalOpen] = useState(false);
  const [isTvModalOpen, setIsTvModalOpen] = useState(false);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);

  // Proximity Alarm Test State
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const [alarmTested, setAlarmTested] = useState(false);

  // QR Code Data URL
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Delay Request Form State
  const [selectedDelayMins, setSelectedDelayMins] = useState<number>(5);
  const [selectedDelayReason, setSelectedDelayReason] = useState<string>('🚗 Parking / Traffic Delay');
  const [delayStatus, setDelayStatus] = useState<'IDLE' | 'PENDING' | 'APPROVED'>('IDLE');

  // Simulated Live Countdown Tracker
  const [simulatedCountdown, setSimulatedCountdown] = useState(6);
  const [simulatedPosition, setSimulatedPosition] = useState(2);

  // Generate QR Code on mount
  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://queless.pages.dev';
    QRCode.toDataURL(`${origin}/#collections`, {
      width: 320,
      margin: 2,
      color: {
        dark: '#141312',
        light: '#FFFFFF'
      }
    }).then(url => {
      setQrDataUrl(url);
    }).catch(err => console.warn('QR generation error:', err));
  }, []);

  // Simulated countdown interval
  useEffect(() => {
    const timer = setInterval(() => {
      setSimulatedCountdown(prev => (prev > 1 ? prev - 1 : 8));
      setSimulatedPosition(prev => (prev === 2 ? 1 : 2));
    }, 12000);
    return () => clearInterval(timer);
  }, []);

  // Web Audio Synthesized Proximity Alarm Trigger
  const triggerProximityAlarm = () => {
    setIsAlarmPlaying(true);
    setAlarmTested(true);

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        // 3-pulse attention alarm (880Hz -> 1174Hz -> 1479Hz)
        [880, 1174.66, 1479.98, 880, 1174.66].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.14);

          gain.gain.setValueAtTime(0, now + i * 0.14);
          gain.gain.linearRampToValueAtTime(0.2, now + i * 0.14 + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.14 + 0.35);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + i * 0.14);
          osc.stop(now + i * 0.14 + 0.4);
        });

        // Speech synthesis voice announcement
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance("Heads up! Your token is next in line. Please proceed to Counter 4.");
          utterance.rate = 1.05;
          utterance.pitch = 1.1;
          utterance.volume = 0.8;
          window.speechSynthesis.speak(utterance);
        }
      }
    } catch (err) {
      console.warn('Alarm audio note:', err);
    }

    setTimeout(() => {
      setIsAlarmPlaying(false);
    }, 3000);
  };

  // Submit Delay Negotiation
  const handleDelaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDelayStatus('PENDING');

    setTimeout(() => {
      setDelayStatus('APPROVED');
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    }, 1500);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white text-[#141312] text-xs font-bold uppercase tracking-wider border border-[#EAE5DE] shadow-2xs">
          <Layers size={13} className="text-[#C28E5C]" />
          The Queless Architecture
        </span>
        <h2 className="text-2xl sm:text-4xl font-black text-[#141312] tracking-tight">
          Built for Velocity. Zero Waiting Lines.
        </h2>
        <p className="text-xs sm:text-sm text-[#736E66]">
          A full-stack suite of real-time queue orchestration tools engineered for any high-volume counter.
        </p>
      </div>

      {/* Bento 12-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* Tile 1 (Span 8): Real-Time Token Turn Countdown & Mobile Live Pass */}
        <div 
          onClick={() => setIsPassModalOpen(true)}
          className="md:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE5DE] shadow-xs flex flex-col justify-between hover:border-[#C4BDAF] hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#EAE5DE] text-[#141312] flex items-center justify-center font-bold">
                <Clock size={20} />
              </div>
              <span className="text-[11px] font-bold text-[#C28E5C] bg-[#FAF7F2] px-3 py-1 rounded-full border border-[#EAE5DE] flex items-center gap-1">
                <Sparkles size={12} /> Click to Test Live Simulator
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-[#141312] tracking-tight group-hover:text-[#C28E5C] transition-colors">
              Live Token Turn Countdown & Remote Mobile Pass
            </h3>
            <p className="text-xs sm:text-sm text-[#736E66] leading-relaxed max-w-xl">
              Customers hold their place in line without being trapped in the waiting room. Live algorithms continuously calculate position and dynamic wait minutes.
            </p>
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-[#FAF7F2] border border-[#EAE5DE] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-black text-[#141312] font-mono">#B-104</div>
              <div className="text-xs text-[#736E66] font-medium">Dr. Peterson • General OPD</div>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full animate-pulse">
              <CheckCircle2 size={14} className="text-emerald-700" /> {simulatedPosition} Tokens Ahead (~{simulatedCountdown} mins)
            </div>
          </div>
        </div>

        {/* Tile 2 (Span 4): 10-Min Proximity Alert & Alarm */}
        <div 
          onClick={triggerProximityAlarm}
          className={`md:col-span-4 bg-white rounded-3xl p-6 sm:p-8 border shadow-xs flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group ${
            isAlarmPlaying ? 'border-amber-500 ring-2 ring-amber-400 bg-amber-50/20' : 'border-[#EAE5DE] hover:border-[#C4BDAF]'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-colors ${
                isAlarmPlaying ? 'bg-amber-500 text-white animate-bounce' : 'bg-[#FAF7F2] border border-[#EAE5DE] text-[#C28E5C]'
              }`}>
                <BellRing size={20} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#736E66]">
                Interactive Audio Test
              </span>
            </div>

            <h3 className="text-xl font-black text-[#141312] tracking-tight group-hover:text-[#C28E5C] transition-colors">
              10-Min Proximity Buzz
            </h3>
            <p className="text-xs sm:text-sm text-[#736E66] leading-relaxed">
              Automated sound and visual alerts trigger 5 tokens ahead so patients and visitors arrive right on time.
            </p>
          </div>

          <div className="mt-6">
            <button
              onClick={(e) => {
                e.stopPropagation();
                triggerProximityAlarm();
              }}
              className={`w-full p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs ${
                isAlarmPlaying
                  ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                  : alarmTested
                  ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
                  : 'bg-[#FAF7F2] text-[#141312] hover:bg-[#F5F1E9] border-[#EAE5DE]'
              }`}
            >
              <Zap size={14} className={isAlarmPlaying ? 'text-white' : 'text-[#C28E5C]'} />
              <span>{isAlarmPlaying ? '🔔 Buzzing Alarm & Audio Active...' : alarmTested ? '✅ Alarm Tested! Click to Replay' : '🔊 Test Alarm & Proximity Sound'}</span>
            </button>
          </div>
        </div>

        {/* Tile 3 (Span 4): Zero-Friction QR Scan */}
        <div 
          onClick={() => setIsQrModalOpen(true)}
          className="md:col-span-4 bg-white rounded-3xl p-6 border border-[#EAE5DE] space-y-3 hover:border-[#C4BDAF] hover:shadow-md transition-all shadow-2xs cursor-pointer group flex flex-col justify-between"
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#EAE5DE] text-emerald-700 flex items-center justify-center font-bold">
                <QrCode size={20} />
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Live QR Protocol
              </span>
            </div>
            <h4 className="text-base font-bold text-[#141312] group-hover:text-[#C28E5C] transition-colors">Instant QR Poster Passes</h4>
            <p className="text-xs text-[#736E66] leading-relaxed">
              Download high-res printable QR posters for counter desks. Visitors scan with camera to join immediately.
            </p>
          </div>

          <div className="pt-2">
            <div className="p-2.5 bg-[#FAF7F2] rounded-2xl border border-[#EAE5DE] text-xs font-bold text-[#141312] flex items-center justify-center gap-1.5 group-hover:bg-white transition-colors">
              <QrCode size={13} className="text-emerald-700" />
              <span>Click to Open Live Scannable QR</span>
            </div>
          </div>
        </div>

        {/* Tile 4 (Span 4): Delay +5m Negotiator */}
        <div 
          onClick={() => setIsDelayModalOpen(true)}
          className="md:col-span-4 bg-white rounded-3xl p-6 border border-[#EAE5DE] space-y-3 hover:border-[#C4BDAF] hover:shadow-md transition-all shadow-2xs cursor-pointer group flex flex-col justify-between"
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#EAE5DE] text-[#C28E5C] flex items-center justify-center font-bold">
                <Hourglass size={20} />
              </div>
              <span className="text-[10px] font-bold text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                Flexible Timing
              </span>
            </div>
            <h4 className="text-base font-bold text-[#141312] group-hover:text-[#C28E5C] transition-colors">+5 Min Delay Negotiator</h4>
            <p className="text-xs text-[#736E66] leading-relaxed">
              Running late from parking? Request a 5-minute shift down the queue with 1-click staff operator approval.
            </p>
          </div>

          <div className="pt-2">
            <div className="p-2.5 bg-[#FAF7F2] rounded-2xl border border-[#EAE5DE] text-xs font-bold text-[#141312] flex items-center justify-center gap-1.5 group-hover:bg-white transition-colors">
              <Hourglass size={13} className="text-[#C28E5C]" />
              <span>Test +5 Min Extra Time Protocol</span>
            </div>
          </div>
        </div>

        {/* Tile 5 (Span 4): Waiting Room TV Broadcast */}
        <div 
          onClick={() => setIsTvModalOpen(true)}
          className="md:col-span-4 bg-white rounded-3xl p-6 border border-[#EAE5DE] space-y-3 hover:border-[#C4BDAF] hover:shadow-md transition-all shadow-2xs cursor-pointer group flex flex-col justify-between"
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#EAE5DE] text-[#141312] flex items-center justify-center font-bold">
                <Tv size={20} />
              </div>
              <span className="text-[10px] font-bold text-[#141312] bg-[#FAF7F2] px-2.5 py-0.5 rounded-full border border-[#EAE5DE]">
                HDMI Broadcast
              </span>
            </div>
            <h4 className="text-base font-bold text-[#141312] group-hover:text-[#C28E5C] transition-colors">HDMI TV Broadcast</h4>
            <p className="text-xs text-[#736E66] leading-relaxed">
              Full-screen waiting room TV display with chime audio and automatic token turn transitions.
            </p>
          </div>

          <div className="pt-2">
            <div className="p-2.5 bg-[#FAF7F2] rounded-2xl border border-[#EAE5DE] text-xs font-bold text-[#141312] flex items-center justify-center gap-1.5 group-hover:bg-white transition-colors">
              <Tv size={13} className="text-[#141312]" />
              <span>Launch Waiting Room HDMI TV</span>
            </div>
          </div>
        </div>

      </div>

      {/* MODAL 1: LIVE QR POSTER PASS MODAL */}
      {isQrModalOpen && (
        <Modal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          title="Instant QR Counter Pass"
          subtitle="Scan with any smartphone camera to immediately book a live digital pass"
          maxWidth="md"
        >
          <div className="text-center space-y-5 pt-2">
            <div className="p-6 bg-[#FAF7F2] rounded-3xl border border-[#EAE5DE] inline-block shadow-xs">
              {qrDataUrl ? (
                <img 
                  src={qrDataUrl} 
                  alt="Live Queless QR Code" 
                  className="w-56 h-56 mx-auto rounded-2xl shadow-sm border border-white"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-xs text-[#736E66]">
                  Generating QR Code...
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <h4 className="text-base font-black text-[#141312]">Counter Scan & Go</h4>
              <p className="text-xs text-[#736E66] max-w-sm mx-auto leading-relaxed">
                Display this QR poster at your entrance or reception counter. Visitors scan to hold their turn without standing in crowded physical queues.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="secondary"
                size="md"
                className="flex-1 border-[#EAE5DE] text-[#141312] rounded-xl cursor-pointer"
                onClick={() => setIsQrModalOpen(false)}
              >
                Close
              </Button>
              {qrDataUrl && (
                <a 
                  href={qrDataUrl} 
                  download="queless-counter-qr-poster.png"
                  className="flex-1"
                >
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full bg-[#141312] hover:bg-[#262422] text-white rounded-xl font-bold cursor-pointer"
                    leftIcon={<Download size={15} />}
                  >
                    Download Poster
                  </Button>
                </a>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 2: INTERACTIVE +5 MIN DELAY NEGOTIATOR */}
      {isDelayModalOpen && (
        <Modal
          isOpen={isDelayModalOpen}
          onClose={() => {
            setIsDelayModalOpen(false);
            setDelayStatus('IDLE');
          }}
          title="+5 Min Delay Negotiator Protocol"
          subtitle="Running late? Request extra time without losing your spot in line"
          maxWidth="md"
        >
          <form onSubmit={handleDelaySubmit} className="space-y-4 pt-1">
            {delayStatus === 'APPROVED' ? (
              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-3xl text-center space-y-3 shadow-2xs">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto">
                  <Check size={24} />
                </div>
                <h4 className="text-base font-black text-emerald-950">Delay Request Approved!</h4>
                <p className="text-xs text-emerald-800 leading-relaxed max-w-xs mx-auto">
                  Counter staff approved your <strong>+{selectedDelayMins} minutes</strong> delay. Your pass position was safely adjusted by ~{selectedDelayMins} mins.
                </p>
                <Button
                  type="button"
                  variant="emerald"
                  size="sm"
                  onClick={() => {
                    setIsDelayModalOpen(false);
                    setDelayStatus('IDLE');
                  }}
                  className="rounded-xl px-6 font-bold cursor-pointer"
                >
                  Done
                </Button>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#141312] mb-1.5">
                    Select Extra Time Needed
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[5, 10, 15].map(mins => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setSelectedDelayMins(mins)}
                        className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                          selectedDelayMins === mins
                            ? 'bg-[#141312] text-white border-[#141312] shadow-xs'
                            : 'bg-[#FAF7F2] text-[#736E66] hover:bg-[#F5F1E9] border-[#EAE5DE]'
                        }`}
                      >
                        <span className="text-base font-black font-mono">+{mins}m</span>
                        <span className="text-[10px] opacity-80">{mins === 5 ? '(Recommended)' : 'Extra Time'}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#141312] mb-1.5">
                    Reason for Delay (Shown to Counter Staff)
                  </label>
                  <div className="space-y-2">
                    {[
                      '🚗 Parking / Traffic Delay',
                      '☕ Grabbing Coffee / Restroom Break',
                      '💼 Consultation / Meeting Running Over',
                      '👶 Attending to Family / Companion'
                    ].map(reason => (
                      <label
                        key={reason}
                        onClick={() => setSelectedDelayReason(reason)}
                        className={`flex items-center gap-3 p-3 rounded-2xl border text-xs font-medium transition-all cursor-pointer ${
                          selectedDelayReason === reason
                            ? 'bg-amber-50/80 border-amber-300 text-amber-950 font-bold'
                            : 'bg-[#FAF7F2] border-[#EAE5DE] text-[#736E66] hover:bg-[#F5F1E9]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="delayReason"
                          checked={selectedDelayReason === reason}
                          onChange={() => setSelectedDelayReason(reason)}
                          className="accent-[#141312]"
                        />
                        <span>{reason}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    className="flex-1 border-[#EAE5DE] text-[#141312] rounded-xl cursor-pointer"
                    onClick={() => setIsDelayModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="emerald"
                    size="md"
                    isLoading={delayStatus === 'PENDING'}
                    className="flex-1 bg-[#141312] hover:bg-[#262422] text-white rounded-xl font-bold cursor-pointer"
                    leftIcon={<Hourglass size={15} />}
                  >
                    Request +{selectedDelayMins}m Time
                  </Button>
                </div>
              </>
            )}
          </form>
        </Modal>
      )}

      {/* MODAL 3: HDMI TV BROADCAST LAUNCHER */}
      {isTvModalOpen && (
        <Modal
          isOpen={isTvModalOpen}
          onClose={() => setIsTvModalOpen(false)}
          title="Waiting Room HDMI TV Display Broadcast"
          subtitle="Full-screen high-resolution turn calling display for reception & lobby screens"
          maxWidth="md"
        >
          <div className="space-y-4 pt-1 text-center">
            <div className="bg-[#141312] text-white p-6 rounded-3xl border border-[#262422] space-y-4 shadow-xl">
              <div className="flex items-center justify-between text-xs text-[#9E988E] border-b border-zinc-800 pb-3">
                <span className="font-bold uppercase tracking-wider text-emerald-400">● LIVE BROADCAST</span>
                <span className="font-mono">COUNTER 1 • GENERAL OPD</span>
              </div>

              <div className="py-3">
                <span className="text-[11px] uppercase tracking-widest text-[#9E988E] block mb-1 font-mono">NOW SERVING TOKEN</span>
                <div className="text-6xl font-black font-mono tracking-tight text-white">#B-104</div>
              </div>

              <div className="flex items-center justify-around text-xs bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800">
                <div>
                  <span className="text-[#9E988E] block text-[10px]">NEXT IN LINE</span>
                  <span className="font-black text-amber-400 font-mono">#B-105</span>
                </div>
                <div className="h-6 w-px bg-zinc-800" />
                <div>
                  <span className="text-[#9E988E] block text-[10px]">WAITING TOKENS</span>
                  <span className="font-black text-white font-mono">4 People</span>
                </div>
                <div className="h-6 w-px bg-zinc-800" />
                <div>
                  <span className="text-[#9E988E] block text-[10px]">AUDIO CHIME</span>
                  <span className="font-black text-emerald-400">ENABLED</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#736E66] max-w-sm mx-auto">
              Plug your laptop, mini-PC, or smart TV into an HDMI cable or cast wirelessly to display token turn updates with chime bells in real-time.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="secondary"
                size="md"
                className="flex-1 border-[#EAE5DE] text-[#141312] rounded-xl cursor-pointer"
                onClick={() => setIsTvModalOpen(false)}
              >
                Close Preview
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  window.open('/display/q-doc-opd', '_blank');
                  setIsTvModalOpen(false);
                }}
                className="flex-1 bg-[#141312] hover:bg-[#262422] text-white rounded-xl font-bold cursor-pointer"
                rightIcon={<ExternalLink size={15} />}
              >
                Launch Live Fullscreen TV
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 4: LIVE PASS SIMULATOR */}
      {isPassModalOpen && (
        <Modal
          isOpen={isPassModalOpen}
          onClose={() => setIsPassModalOpen(false)}
          title="Digital Turn Pass Simulator"
          subtitle="Real-time live queue tracking with turn countdowns and proximity alerts"
          maxWidth="md"
        >
          <div className="space-y-4 pt-1">
            <div className="bg-white rounded-3xl p-6 border border-[#EAE5DE] shadow-xs text-center space-y-4">
              <div className="flex items-center justify-between border-b border-[#EAE5DE] pb-3">
                <span className="text-xs font-bold text-[#141312]">City Hospital • General OPD</span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  ● Active Turn Pass
                </span>
              </div>

              <div className="py-2">
                <span className="text-[11px] uppercase tracking-wider text-[#736E66] block mb-1">Your Token Pass</span>
                <div className="text-5xl font-black font-mono tracking-tight text-[#141312]">#B-104</div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#EAE5DE]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#736E66] block">Tokens Ahead</span>
                  <span className="text-lg font-black text-[#141312]">{simulatedPosition} in line</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#736E66] block">Est. Turn Countdown</span>
                  <span className="text-lg font-black text-[#C28E5C] font-mono">~{simulatedCountdown}m</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="secondary"
                size="md"
                className="flex-1 border-[#EAE5DE] text-[#141312] rounded-xl cursor-pointer"
                onClick={() => setIsPassModalOpen(false)}
              >
                Close
              </Button>
              <a href="#collections" className="flex-1" onClick={() => setIsPassModalOpen(false)}>
                <Button
                  variant="primary"
                  size="md"
                  className="w-full bg-[#141312] hover:bg-[#262422] text-white rounded-xl font-bold cursor-pointer"
                >
                  Explore Real Counters
                </Button>
              </a>
            </div>
          </div>
        </Modal>
      )}

    </section>
  );
};
