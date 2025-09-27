import React, { useEffect, useMemo, useState } from "react";
import api from "../api";

function toLocalIso(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString();
}

function combineDateTime(date, time) {
  if (!date || !time) return null;
  // time may be "HH:MM:SS" from SQL; combine into ISO for Date()
  const iso = `${date}T${String(time).slice(0, 8)}`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function hoursBetween(start, end) {
  if (!start || !end) return "";
  const ms = end.getTime() - start.getTime();
  if (!Number.isFinite(ms)) return "";
  return (ms / 3600000).toFixed(2);
}

export default function AdminApprovals() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [posFilter, setPosFilter] = useState("All");
  const [bulk, setBulk] = useState(new Set());

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const { data } = await api.get("/api/approvals/queue");
        if (alive) setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        if (alive) setErr(e?.response?.data?.msg || "Failed to load approvals queue.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const positions = useMemo(() => {
    const s = new Set(rows.map(r => r.position).filter(Boolean));
    return ["All", ...Array.from(s).sort()];
  }, [rows]);

  const filtered = useMemo(() => {
    if (posFilter === "All") return rows;
    return rows.filter(r => (r.position || "").toLowerCase() === posFilter.toLowerCase());
  }, [rows, posFilter]);

  const toggle = (id) => {
    setBulk(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const removeByIds = (ids) => {
    setRows(prev => prev.filter(r => !ids.includes(r.id)));
    setBulk(prev => {
      const n = new Set(prev);
      ids.forEach(id => n.delete(id));
      return n;
    });
  };

  const approveOne = async (id) => {
    try {
      await api.post("/api/approvals/bulk", { approve: [id], reject: [] });
      removeByIds([id]);
    } catch {
      alert("Approve failed.");
    }
  };

  const requireReason = (initial = "") => {
    let reason = initial;
    // Keep asking until we get a non-empty string or the user cancels.
    // Backend requires min(1) char for reason.
    // If user cancels, return null.
    // If user enters only spaces, re-prompt.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      // Use window.prompt for now to keep this one-file patch simple.
      const r = window.prompt("Enter a rejection reason (required):", reason);
      if (r === null) return null;                // cancel
      if (r && r.trim().length > 0) return r.trim();
      alert("A non-empty reason is required.");
      reason = "";
    }
  };

  const rejectOne = async (id) => {
    const reason = requireReason();
    if (reason === null) return;
    try {
      await api.post("/api/approvals/bulk", { approve: [], reject: [{ id, reason }] });
      removeByIds([id]);
    } catch {
      alert("Reject failed.");
    }
  };

  const approveSelected = async () => {
    const ids = Array.from(bulk);
    if (!ids.length) return;
    try {
      await api.post("/api/approvals/bulk", { approve: ids, reject: [] });
      removeByIds(ids);
    } catch {
      alert("Bulk approve failed.");
    }
  };

  const rejectSelected = async () => {
    const ids = Array.from(bulk);
    if (!ids.length) return;
    const reason = requireReason();
    if (reason === null) return;
    try {
      await api.post("/api/approvals/bulk", {
        approve: [],
        reject: ids.map(id => ({ id, reason })),
      });
      removeByIds(ids);
    } catch {
      alert("Bulk reject failed.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-semibold mb-6">Approvals</h1>

      {err && <div className="mb-4 text-red-400">{err}</div>}

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="text-lg">Pending: {filtered.length}</div>

        <label className="ml-auto flex items-center gap-2">
          <span className="opacity-80">Position</span>
          <select
            className="bg-transparent border rounded px-3 py-2"
            value={posFilter}
            onChange={e => setPosFilter(e.target.value)}
          >
            {positions.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>

        <button
          className="rounded px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50"
          onClick={approveSelected}
          disabled={!bulk.size}
        >
          Approve Selected
        </button>
        <button
          className="rounded px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50"
          onClick={rejectSelected}
          disabled={!bulk.size}
        >
          Reject Selected
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="min-w-full">
          <thead className="bg-white/5">
            <tr className="text-left">
              <th className="px-4 py-3 w-10"></th>
              <th className="px-4 py-3">Session ID</th>
              <th className="px-4 py-3">Tutor</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Hours</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Position</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-6" colSpan={9}>Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td className="px-4 py-6" colSpan={9}>No items.</td></tr>
            ) : (
              filtered.map((r) => {
                const start = combineDateTime(r.session_date, r.start_time);
                const end   = combineDateTime(r.session_date, r.end_time);
                return (
                  <tr key={r.id} className="border-t border-white/10">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={bulk.has(r.id)} onChange={() => toggle(r.id)} />
                    </td>
                    <td className="px-4 py-3">{r.id}</td>
                    <td className="px-4 py-3">{r.tutor_email}</td>
                    <td className="px-4 py-3">
                      {(r.client_first_name || "") + (r.client_last_name ? " " + r.client_last_name : "")}
                    </td>
                    <td className="px-4 py-3">{toLocalIso(r.session_date)}</td>
                    <td className="px-4 py-3">{hoursBetween(start, end)}</td>
                    <td className="px-4 py-3 capitalize">{r.status}</td>
                    <td className="px-4 py-3">{r.position || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="rounded px-3 py-1 bg-green-600 hover:bg-green-500" onClick={() => approveOne(r.id)}>
                          Approve
                        </button>
                        <button className="rounded px-3 py-1 bg-red-600 hover:bg-red-500" onClick={() => rejectOne(r.id)}>
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
