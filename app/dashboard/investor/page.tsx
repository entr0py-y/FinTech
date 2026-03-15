"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { getInvestorVDRData } from "./actions";
import { Document } from "@prisma/client";

type FounderWithStatus = {
    id: string;
    name: string | null;
    companyName: string | null;
    email: string | null;
    pitches: {
        videoUrl: string;
        pitchDeckUrl: string | null;
    }[];
    accessStatus: "PENDING" | "APPROVED" | "REJECTED" | null;
};

type ApprovedDataRoom = {
    founderId: string;
    founderName: string | null;
    documents: Document[];
};

const getYouTubeEmbedUrl = (url: string | null) => {
    if (!url) return "";
    // This regex perfectly captures IDs from all YouTube link formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    if (match && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}`;
    }
    return url;
};

export default function InvestorDashboard() {
    const { data: session } = useSession();
    const [founders, setFounders] = useState<FounderWithStatus[]>([]);
    const [approvedRooms, setApprovedRooms] = useState<ApprovedDataRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewingVideo, setViewingVideo] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await getInvestorVDRData();
                setFounders(data.founders);
                setApprovedRooms(data.approvedDataRooms);
            } catch (error) {
                console.error("Failed to load VDR data", error);
            } finally {
                setLoading(false);
            }
        };

        if (session?.user?.role === "INVESTOR") {
            loadData();
        }
    }, [session]);

    const handleRequestAccess = async (founderId: string) => {
        try {
            const res = await fetch("/api/vdr/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ founderId }),
            });

            if (res.ok) {
                // Update local state to reflect PENDING status
                setFounders((prev) =>
                    prev.map((f) =>
                        f.id === founderId ? { ...f, accessStatus: "PENDING" } : f
                    )
                );
            } else {
                alert("Failed to request access");
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (!session) return null;
    if (loading) return <div className="p-6 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-slate-50 relative">
            {/* Landscape Video Modal */}
            {viewingVideo && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
                    <div className="relative w-full max-w-5xl aspect-video rounded-xl overflow-hidden bg-black shadow-2xl">
                        <button
                            onClick={() => setViewingVideo(null)}
                            className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-xl font-bold transition-colors"
                        >
                            ✕
                        </button>
                        <iframe
                            src={getYouTubeEmbedUrl(viewingVideo)}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                </div>
            )}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-slate-900">
                    Investor Dashboard
                </h1>
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-blue-900 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        IN
                    </div>
                </div>
            </header>

            <main className="p-6 max-w-7xl mx-auto space-y-8">
                {/* Watch Pitch Reels Button */}
                <section>
                    <Link href="/dashboard/investor/feed" className="block w-full">
                        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl shadow-lg p-8 flex items-center justify-between hover:from-indigo-700 hover:to-blue-700 transition-all cursor-pointer group">
                            <div>
                                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                                    <span className="text-4xl">🎥</span> Watch Pitch Reels
                                </h2>
                                <p className="text-blue-100 mt-2 text-lg">
                                    Discover startups through 30-second immersive pitches.
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white group-hover:bg-white/30 transition-colors">
                                <span className="text-xl font-bold">→</span>
                            </div>
                        </div>
                    </Link>
                </section>

                {/* Marketplace Section */}
                <section>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-semibold text-slate-800 mb-2">
                            Marketplace
                        </h2>
                        <p className="text-slate-600 mb-6 text-sm">
                            Discover founders and request access to their Virtual Data Rooms.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {founders.length === 0 ? (
                                <p className="text-slate-500 text-sm">No founders available.</p>
                            ) : (
                                founders.map((founder) => (
                                    <div
                                        key={founder.id}
                                        className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between min-h-[200px]"
                                    >
                                        <div>
                                            <div className="w-12 h-12 bg-blue-100 text-blue-800 rounded-lg flex items-center justify-center font-bold mb-4">
                                                {founder.companyName ? founder.companyName.substring(0, 2).toUpperCase() : founder.name ? founder.name.substring(0, 2).toUpperCase() : "NA"}
                                            </div>
                                            <h3 className="font-semibold text-slate-900 text-lg">
                                                {founder.companyName || "Unnamed Startup"}
                                            </h3>
                                            <p className="text-sm text-slate-500 mt-1">
                                                Founder: {founder.name || "Unknown"}
                                            </p>
                                        </div>
                                        <div className="mt-4 flex flex-col gap-2">
                                            {founder.pitches?.[0]?.videoUrl && (
                                                <button
                                                    onClick={() => setViewingVideo(founder.pitches[0].videoUrl)}
                                                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors text-sm"
                                                >
                                                    ▶ Watch Pitch
                                                </button>
                                            )}

                                            {founder.pitches?.[0]?.pitchDeckUrl && (
                                                <a
                                                    href={founder.pitches[0].pitchDeckUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-center flex justify-center items-center font-medium rounded-lg transition-colors text-sm"
                                                >
                                                    📄 View Pitch Deck
                                                </a>
                                            )}

                                            {founder.accessStatus === "APPROVED" ? (
                                                <span className="inline-block w-full py-2 bg-green-100 text-green-800 text-center font-medium rounded-lg text-sm border border-green-200">
                                                    🔓 VDR Access Approved
                                                </span>
                                            ) : founder.accessStatus === "PENDING" ? (
                                                <span className="inline-block w-full py-2 bg-yellow-100 text-yellow-800 text-center font-medium rounded-lg text-sm border border-yellow-200">
                                                    ⏳ Request Pending
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleRequestAccess(founder.id)}
                                                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm"
                                                >
                                                    🔒 Request VDR Access
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </section>

                {/* My Approved Data Rooms Section */}
                <section>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-semibold text-slate-800 mb-6">
                            My Approved Data Rooms
                        </h2>

                        {approvedRooms.length === 0 ? (
                            <p className="text-slate-500 text-sm">
                                You do not have access to any data rooms yet.
                            </p>
                        ) : (
                            <div className="space-y-6">
                                {approvedRooms.map((room) => (
                                    <div
                                        key={room.founderId}
                                        className="border border-slate-200 rounded-lg p-5 bg-slate-50"
                                    >
                                        <h3 className="font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-2">
                                            {room.founderName || "Unnamed"}'s Data Room
                                        </h3>
                                        {room.documents.length === 0 ? (
                                            <p className="text-slate-500 text-sm italic">
                                                No documents uploaded by this founder yet.
                                            </p>
                                        ) : (
                                            <ul className="space-y-3">
                                                {room.documents.map((doc) => (
                                                    <li
                                                        key={doc.id}
                                                        className="bg-white border border-slate-200 p-3 rounded flex justify-between items-center"
                                                    >
                                                        <a
                                                            href={doc.fileUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="font-medium text-blue-600 hover:text-blue-800 text-sm hover:underline"
                                                        >
                                                            {doc.title}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
