"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase-client";
import { collection, getDocs } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/* ================= TYPES ================= */

type View =
  | "NONE"
  | "TOTAL_CLIENTS"
  | "PENDING_TODAY"
  | "SUBMITTED"
  | "TO_BE_PUSHED"
  | "PUSHED"
  | "FAILED";

/* ================= COMPONENT ================= */

export default function PushDataPage() {
  const [clients, setClients] = useState<string[]>([]);
  const [lastSubmittedData, setLastSubmittedData] = useState<any[]>([]);
  const [pushResult, setPushResult] = useState<any>(null);

  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [pushDate, setPushDate] = useState("");

  const [view, setView] = useState<View>("NONE");
  const [viewHistory, setViewHistory] = useState<View[]>([]);

  const [loading, setLoading] = useState(false);

  const [alert, setAlert] = useState<{
    type: "success" | "error" | "warning" | "info";
    message: string;
  } | null>(null);

  /* ================= VIEW HELPERS ================= */

  function goToView(next: View) {
    setViewHistory((prev) => [...prev, view]);
    setView(next);
  }

  function goBack() {
    setViewHistory((prev) => {
      if (prev.length === 0) {
        setView("NONE");
        return [];
      }
      const last = prev[prev.length - 1];
      setView(last);
      return prev.slice(0, -1);
    });
  }

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    loadClients();
    loadSubmitted();
  }, []);

  async function loadClients() {
    const snap = await getDocs(collection(db, "clients"));
    setClients(snap.docs.map((d) => d.data().name || d.id));
  }

  async function loadSubmitted() {
    const res = await fetch("/api/last-submitted-data");
    const data = await res.json();
    setLastSubmittedData(Array.isArray(data) ? data : data ? [data] : []);
  }

  /* ================= DATE ================= */

  const today = new Date().toISOString().split("T")[0];

  /* ================= LIST DERIVATION ================= */

  const submittedToday = lastSubmittedData
    //.filter((d) => d.report_date?.startsWith(today))
    .map((d) => d.client_name);

  const pendingToday = clients.filter(
    (c) => !submittedToday.includes(c)
  );

  const pushedClients =
    pushResult?.success?.map((s: any) => s.client_name) || [];

  const failedClients =
    pushResult?.failed?.map((f: any) => f.client_name) || [];

  const toBePushed = submittedToday.filter(
    (c) => !pushedClients.includes(c)
  );

  /* ================= COUNTS ================= */

  const totalClientsCount = clients.length;
  const submittedCount = submittedToday.length;
  const pendingTodayCount = pendingToday.length;

  const pushedCount = pushedClients.length;
  const failedCount = failedClients.length;
  const toBePushedCount = toBePushed.length;

  /* ================= PUSH ================= */

  async function handlePush() {
    if (selectedClients.length === 0) {
      setAlert({
        type: "warning",
        message: "Please select at least one client before pushing.",
      });
      return;
    }

    try {
      setLoading(true);

      setAlert({
        type: "info",
        message: "Pushing data to RCS. Please wait...",
      });

      const res = await fetch("/api/push/rcs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_PUSH_API_KEY!,
        },
        body: JSON.stringify({
          clientNames: selectedClients,
          fromDate: pushDate,
        }),
      });

      const data = await res.json();
      console.log("Push result:", data);
      setPushResult(data);

      if (data.failed?.length > 0) {
        setAlert({
          type: "warning",
          message: `${data.failed.length} client(s) failed. You can retry them.`,
        });
      } else {
        setAlert({
          type: "success",
          message: "All selected data pushed successfully to RCS.",
        });
      }

      downloadJSON(data, pushDate);
      loadSubmitted();
    } catch {
      setAlert({
        type: "error",
        message: "Failed to push data. Please check network or server.",
      });
    } finally {
      setLoading(false);
    }
  }

  /* ================= UI ================= */

  return (
    <div className="space-y-6">

      {/* ===== POPUP ALERT (MODAL) ===== */}
      {alert && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-5 relative">

            <button
              onClick={() => setAlert(null)}
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
            >
              ✕
            </button>

            <h2
              className={`text-lg font-semibold mb-2 ${
                alert.type === "success"
                  ? "text-green-600"
                  : alert.type === "error"
                  ? "text-red-600"
                  : alert.type === "warning"
                  ? "text-yellow-600"
                  : "text-blue-600"
              }`}
            >
              {alert.type.toUpperCase()}
            </h2>

            <p className="text-gray-700">{alert.message}</p>

            <div className="mt-4 text-right">
              <button
                onClick={() => setAlert(null)}
                className="px-4 py-1 rounded bg-gray-200 hover:bg-gray-300"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== LOADING OVERLAY ===== */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white px-6 py-4 rounded shadow text-center space-y-2">
            <div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto" />
            <p className="font-medium">Pushing data to RCS...</p>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-bold">Push Data to RCS</h1>

      {view !== "NONE" && (
        <button
          onClick={goBack}
          className="px-3 py-1 border rounded text-sm hover:bg-gray-100"
        >
          ← Back
        </button>
      )}

      {/* ===== MAIN DASHBOARD ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card onClick={() => goToView("TOTAL_CLIENTS")} className="cursor-pointer">
          <CardHeader><CardTitle>Total Clients</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{totalClientsCount}</CardContent>
        </Card>

        <Card onClick={() => goToView("SUBMITTED")} className="cursor-pointer hover:bg-green-50">
          <CardHeader><CardTitle>Data Submitted Today</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-green-600">{submittedCount}</CardContent>
        </Card>

        <Card onClick={() => goToView("PENDING_TODAY")} className="cursor-pointer hover:bg-red-50">
          <CardHeader><CardTitle>Data Pending Today</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-red-600">{pendingTodayCount}</CardContent>
        </Card>
      </div>

      {/* ===== SUBMITTED DASHBOARD ===== */}
      {view === "SUBMITTED" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card onClick={() => goToView("PUSHED")} className="cursor-pointer">
            <CardHeader><CardTitle>Total Data Pushed</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold text-green-600">{pushedCount}</CardContent>
          </Card>

          <Card
            onClick={() => {
              setSelectedClients(toBePushed);
              setPushDate(today);
              goToView("TO_BE_PUSHED");
            }}
            className="cursor-pointer hover:bg-yellow-50"
          >
            <CardHeader><CardTitle>To Be Pushed</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold text-yellow-600">{toBePushedCount}</CardContent>
          </Card>

          <Card onClick={() => goToView("FAILED")} className="cursor-pointer hover:bg-red-50">
            <CardHeader><CardTitle>Failed</CardTitle></CardHeader>
            <CardContent className="text-2xl font-bold text-red-600">{failedCount}</CardContent>
          </Card>
        </div>
      )}

      {/* ===== LIST VIEWS ===== */}
      {[
        ["TOTAL_CLIENTS", clients],
        ["PENDING_TODAY", pendingToday],
        ["PUSHED", pushedClients],
        ["FAILED", failedClients],
      ].map(
        ([v, list]) =>
          view === v && (
            <div key={v} className="border rounded p-4">
              <ul className="space-y-1">
                {(list as string[]).map((c, i) => (
                  <li key={`${c}-${i}`}>{c}</li>
                ))}
              </ul>
            </div>
          )
      )}

      {/* ===== TO BE PUSHED ===== */}
      {view === "TO_BE_PUSHED" && (
        <div className="space-y-4 border rounded p-4">
          <div className="max-h-60 overflow-y-auto border p-2 rounded">
            {toBePushed.map((c, i) => (
              <label key={`${c}-${i}`} className="flex gap-2">
                <input
                  type="checkbox"
                  checked={selectedClients.includes(c)}
                  onChange={(e) =>
                    setSelectedClients((p) =>
                      e.target.checked
                        ? [...p, c]
                        : p.filter((x) => x !== c)
                    )
                  }
                />
                {c}
              </label>
            ))}
          </div>

          <input
            type="date"
            value={pushDate}
            onChange={(e) => setPushDate(e.target.value)}
            className="border rounded px-3 py-2"
          />

          <button
            disabled={loading || selectedClients.length === 0}
            onClick={handlePush}
            className="bg-green-600 px-6 py-2 rounded disabled:opacity-50"
          >
            {loading ? "Processing..." : "Push to RCS"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ================= DOWNLOAD ================= */

function downloadJSON(data: any, date: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `push_result_${date}.json`;
  a.click();
}