"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getFounderVDRData } from "./actions";
import { Document, DataRoomAccess, User, Bid, Pitch } from "@prisma/client";

type RequestWithInvestor = DataRoomAccess & { investor: User };
type BidWithRelations = Bid & { investor: User; pitch: Pitch };

export default function FounderDashboard() {
    const { data: session } = useSession();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [requests, setRequests] = useState<RequestWithInvestor[]>([]);
    const [bids, setBids] = useState<BidWithRelations[]>([]);
    const [title, setTitle] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Pitch Form State
    const [pitchVideoUrl, setPitchVideoUrl] = useState("");
    const [pitchDeckUrl, setPitchDeckUrl] = useState("");
    const [pitchDescription, setPitchDescription] = useState("");
    const [pitchIndustry, setPitchIndustry] = useState("");
    const [pitchIsUnder10Min, setPitchIsUnder10Min] = useState(false);
    const [postingPitch, setPostingPitch] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await getFounderVDRData();
                setDocuments(data.documents);
                setRequests(data.pendingRequests);
                setBids(data.bids);
            } catch (error) {
                console.error("Failed to load VDR data", error);
            } finally {
                setLoading(false);
            }
        };

        if (session?.user?.role === "FOUNDER") {
            loadData();
        }
    }, [session]);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !session?.user?.id || !file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("founderId", session.user.id);
            formData.append("file", file);

            const res = await fetch("/api/vdr/upload", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                const newDoc = await res.json();
                setDocuments([newDoc, ...documents]);
                setTitle("");
                setFile(null);
            } else {
                alert("Failed to upload document");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const handlePitchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!pitchVideoUrl.includes("youtube.com") && !pitchVideoUrl.includes("youtu.be")) {
            alert("Please provide a valid YouTube URL.");
            return;
        }

        if (!pitchIsUnder10Min) {
            alert("You must confirm the pitch video is under 10 minutes.");
            return;
        }

        if (!pitchVideoUrl || !pitchDeckUrl || !pitchDescription || !pitchIndustry || !session?.user?.id) {
            alert("Please fill in all pitch required fields.");
            return;
        }

        setPostingPitch(true);
        try {
            const res = await fetch("/api/pitches/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    videoUrl: pitchVideoUrl,
                    pitchDeckUrl: pitchDeckUrl,
                    description: pitchDescription,
                    industry: pitchIndustry,
                }),
            });

            if (res.ok) {
                alert("Pitch posted successfully!");
                setPitchVideoUrl("");
                setPitchDeckUrl("");
                setPitchDescription("");
                setPitchIndustry("");
                setPitchIsUnder10Min(false);
            } else {
                const errorMessage = await res.text();
                alert(`Failed to post pitch: ${errorMessage}`);
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred while posting your pitch.");
        } finally {
            setPostingPitch(false);
        }
    };

    const handleApprove = async (requestId: string) => {
        try {
            const res = await fetch("/api/vdr/approve", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requestId }),
            });

            if (res.ok) {
                setRequests(requests.filter((r) => r.id !== requestId));
            } else {
                alert("Failed to approve request");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleBidAction = async (bidId: string, status: "ACCEPTED" | "REJECTED") => {
        try {
            const res = await fetch("/api/bids/manage", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bidId, status }),
            });

            if (res.ok) {
                setBids(bids.map(b => b.id === bidId ? { ...b, status } : b));
            } else {
                alert(`Failed to ${status.toLowerCase()} bid`);
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (!session) return null;
    if (loading) return <div className="p-6 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-slate-900">Founder Dashboard</h1>
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        FD
                    </div>
                </div>
            </header>
            <main className="p-6 max-w-7xl mx-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4">
                            Virtual Data Room Upload (Private)
                        </h2>
                        <form onSubmit={handleUpload} className="flex flex-col gap-4">
                            <input
                                type="text"
                                placeholder="Document Title (e.g., Q3 Financials, Cap Table)"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="border border-slate-300 rounded px-3 py-2 w-full text-black"
                                required
                            />
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="border border-slate-300 rounded px-3 py-2 w-full text-black"
                                required
                                key={file ? file.name : "empty"}
                            />
                            <button
                                type="submit"
                                disabled={uploading}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
                            >
                                {uploading ? "Uploading..." : "Upload Secure Document"}
                            </button>
                        </form>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4">
                            Your secure VDR Documents
                        </h2>
                        {documents.length === 0 ? (
                            <p className="text-slate-500 text-sm">No documents uploaded yet.</p>
                        ) : (
                            <ul className="space-y-3">
                                {documents.map((doc) => (
                                    <li
                                        key={doc.id}
                                        className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded"
                                    >
                                        <span className="font-medium text-slate-800">
                                            {doc.title}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            {new Date(doc.createdAt).toLocaleDateString()}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">
                        Post your Public Pitch
                    </h2>
                    <form onSubmit={handlePitchSubmit} className="flex flex-col gap-4">
                        <input
                            type="url"
                            placeholder="YouTube Video URL (e.g., https://youtu.be/...)"
                            value={pitchVideoUrl}
                            onChange={(e) => setPitchVideoUrl(e.target.value)}
                            className="border border-slate-300 rounded px-3 py-2 w-full text-black"
                            required
                        />
                        <input
                            type="url"
                            placeholder="Public Pitch Deck URL (e.g. Google Drive Link or hosted PDF)"
                            value={pitchDeckUrl}
                            onChange={(e) => setPitchDeckUrl(e.target.value)}
                            className="border border-slate-300 rounded px-3 py-2 w-full text-black"
                            required
                        />
                        <textarea
                            placeholder="Short description of your startup pitch..."
                            value={pitchDescription}
                            onChange={(e) => setPitchDescription(e.target.value)}
                            className="border border-slate-300 rounded px-3 py-2 w-full text-black min-h-[100px]"
                            required
                        />
                        <input
                            type="text"
                            placeholder="Industry (e.g. SaaS, Fintech)"
                            value={pitchIndustry}
                            onChange={(e) => setPitchIndustry(e.target.value)}
                            className="border border-slate-300 rounded px-3 py-2 w-full text-black"
                            required
                        />
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="pitchLengthUnder10"
                                checked={pitchIsUnder10Min}
                                onChange={(e) => setPitchIsUnder10Min(e.target.checked)}
                                className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <label htmlFor="pitchLengthUnder10" className="text-slate-700 text-sm font-medium">
                                I confirm this pitch video is under 10 minutes.
                            </label>
                        </div>
                        <button
                            type="submit"
                            disabled={postingPitch}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 mt-2 rounded disabled:opacity-50"
                        >
                            {postingPitch ? "Posting..." : "Post Pitch Reel"}
                        </button>
                    </form>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">
                        Pending Access Requests
                    </h2>
                    {requests.length === 0 ? (
                        <p className="text-slate-500 text-sm">No pending requests.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-200 text-sm text-slate-600">
                                        <th className="pb-3">Investor Name</th>
                                        <th className="pb-3">Email</th>
                                        <th className="pb-3">Requested At</th>
                                        <th className="pb-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map((req) => (
                                        <tr key={req.id} className="border-b border-slate-50 mt-2">
                                            <td className="py-3 text-slate-800 font-medium">
                                                {req.investor.name || "Unknown"}
                                            </td>
                                            <td className="py-3 text-slate-600">
                                                {req.investor.email}
                                            </td>
                                            <td className="py-3 text-slate-500 text-sm">
                                                {new Date(req.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="py-3 text-right">
                                                <button
                                                    onClick={() => handleApprove(req.id)}
                                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                                                >
                                                    Approve
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">
                        Investment Offers
                    </h2>
                    {bids.length === 0 ? (
                        <p className="text-slate-500 text-sm">No investment offers yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-200 text-sm text-slate-600">
                                        <th className="pb-3">Investor Name</th>
                                        <th className="pb-3">Pitch</th>
                                        <th className="pb-3 text-right">Amount ($)</th>
                                        <th className="pb-3 text-right">Equity (%)</th>
                                        <th className="pb-3 text-center">Status</th>
                                        <th className="pb-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bids.map((bid) => (
                                        <tr key={bid.id} className="border-b border-slate-50 mt-2">
                                            <td className="py-3 text-slate-800 font-medium whitespace-nowrap">
                                                {bid.investor.name || "Unknown"}
                                            </td>
                                            <td className="py-3 text-slate-600 truncate max-w-[150px]">
                                                {bid.pitch.description}
                                            </td>
                                            <td className="py-3 text-slate-800 text-right font-semibold">
                                                ${bid.amount.toLocaleString()}
                                            </td>
                                            <td className="py-3 text-slate-800 text-right font-medium">
                                                {bid.equity}%
                                            </td>
                                            <td className="py-3 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${bid.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                                                    bid.status === "ACCEPTED" ? "bg-green-100 text-green-800" :
                                                        "bg-red-100 text-red-800"
                                                    }`}>
                                                    {bid.status}
                                                </span>
                                            </td>
                                            <td className="py-3 text-right">
                                                {bid.status === "PENDING" && (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleBidAction(bid.id, "ACCEPTED")}
                                                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                                                        >
                                                            Accept
                                                        </button>
                                                        <button
                                                            onClick={() => handleBidAction(bid.id, "REJECTED")}
                                                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
