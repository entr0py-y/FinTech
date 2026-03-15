"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";

type PitchWithFounder = {
    id: string;
    videoUrl: string;
    description: string;
    industry: string;
    createdAt: string;
    founderId: string;
    founder: {
        id: string;
        name: string | null;
        companyName: string | null;
        email: string | null;
    };
};

function useElementOnScreen(options: IntersectionObserverInit) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            const [entry] = entries;
            setIsVisible(entry.isIntersecting);
        }, options);

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            if (containerRef.current) observer.unobserve(containerRef.current);
        };
    }, [options]);

    return [containerRef, isVisible] as const;
}

function PitchVideoCard({ pitch }: { pitch: PitchWithFounder }) {
    const [containerRef, isVisible] = useElementOnScreen({
        threshold: 0.8, // Play when 80% visible
    });
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isMuted, setIsMuted] = useState(true);

    // Bid Modal State
    const [showBidModal, setShowBidModal] = useState(false);
    const [bidAmount, setBidAmount] = useState("");
    const [bidEquity, setBidEquity] = useState("");
    const [isBidding, setIsBidding] = useState(false);

    useEffect(() => {
        if (isVisible) {
            videoRef.current?.play().catch(() => { });
        } else {
            videoRef.current?.pause();
        }
    }, [isVisible]);

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
            setIsMuted(videoRef.current.muted);
        }
    };

    const handleBidSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bidAmount || !bidEquity) return;

        setIsBidding(true);
        try {
            const res = await fetch("/api/bids/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pitchId: pitch.id,
                    amount: bidAmount,
                    equity: bidEquity,
                }),
            });

            if (res.ok) {
                alert("Investment Offer Sent Successfully!");
                setShowBidModal(false);
                setBidAmount("");
                setBidEquity("");
            } else {
                alert("Failed to submit bid");
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred");
        } finally {
            setIsBidding(false);
        }
    };

    return (
        <div ref={containerRef} className="snap-start relative h-full w-full bg-black flex items-center justify-center">
            <video
                ref={videoRef}
                src={pitch.videoUrl}
                className="h-full w-full object-cover"
                loop
                muted={isMuted}
                playsInline
                controls={true}
            />

            {/* Overlay UI */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 pointer-events-none" />

            <div className="absolute bottom-6 left-6 right-20 text-white z-10">
                <h3 className="text-xl font-bold">{pitch.founder.companyName || "Unnamed Startup"}</h3>
                <p className="text-sm font-medium opacity-90 mb-2">Founder: {pitch.founder.name || "Unknown"} | Industry: {pitch.industry}</p>
                <p className="text-sm opacity-90">{pitch.description}</p>
            </div>

            <div className="absolute bottom-6 right-4 flex flex-col gap-4 z-10">
                <button
                    onClick={toggleMute}
                    className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                    aria-label={isMuted ? "Unmute" : "Mute"}
                >
                    {isMuted ? "🔇" : "🔊"}
                </button>
                <button
                    className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors text-white shadow-lg shadow-blue-500/30"
                    title="View Data Room"
                >
                    📁
                </button>
                <button
                    onClick={() => setShowBidModal(true)}
                    className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-700 transition-colors text-white shadow-lg shadow-green-500/30 font-bold"
                    title="Invest Now"
                >
                    $$
                </button>
            </div>

            {/* Bid Modal Overlay */}
            {showBidModal && (
                <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-white text-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
                        <button
                            onClick={() => setShowBidModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                        >
                            ✕
                        </button>
                        <h2 className="text-xl font-bold mb-1">Make an Offer</h2>
                        <p className="text-sm text-slate-500 mb-6">Pitch by {pitch.founder.name || "Founder"}</p>

                        <form onSubmit={handleBidSubmit} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Investment Amount ($)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    value={bidAmount}
                                    onChange={(e) => setBidAmount(e.target.value)}
                                    placeholder="e.g. 50000"
                                    className="border border-slate-300 rounded px-3 py-2 w-full text-black"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Equity Requested (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={bidEquity}
                                    onChange={(e) => setBidEquity(e.target.value)}
                                    placeholder="e.g. 5.5"
                                    className="border border-slate-300 rounded px-3 py-2 w-full text-black"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isBidding}
                                className="mt-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-3 rounded disabled:opacity-50"
                            >
                                {isBidding ? "Sending Offer..." : "Submit Offer"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function DiscoverPitches() {
    const { data: session } = useSession();
    const [pitches, setPitches] = useState<PitchWithFounder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPitches = async () => {
            try {
                const res = await fetch("/api/pitches");
                if (res.ok) {
                    const data = await res.json();
                    setPitches(data);
                }
            } catch (error) {
                console.error("Failed to fetch pitches", error);
            } finally {
                setLoading(false);
            }
        };

        if (session?.user?.role === "INVESTOR") {
            fetchPitches();
        } else if (session) {
            setLoading(false); // E.g. founder viewing it, though api might reject
        }
    }, [session]);

    if (!session) return null;
    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading pitches...</div>;
    if (session.user.role !== "INVESTOR") {
        return <div className="min-h-screen bg-black flex items-center justify-center text-white">Only investors can view the discovery feed.</div>;
    }

    return (
        <div className="min-h-screen bg-black flex flex-col items-center">
            {/* Header */}
            <header className="w-full p-4 absolute top-0 z-20 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center text-white">
                <h1 className="text-xl font-bold tracking-tight">Discover Pitches</h1>
                <div className="font-medium text-sm">Investor Mode</div>
            </header>

            {/* Feed Container */}
            <div className="w-full max-w-[450px] h-[100dvh] pt-16 pb-4">
                {pitches.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-400">
                        No pitches available yet.
                    </div>
                ) : (
                    <div className="h-full w-full overflow-y-scroll snap-y snap-mandatory rounded-2xl overflow-hidden shadow-2xl relative scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        <style jsx global>{`
                            .scrollbar-hide::-webkit-scrollbar {
                                display: none;
                            }
                        `}</style>
                        {pitches.map((pitch) => (
                            <PitchVideoCard key={pitch.id} pitch={pitch} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
