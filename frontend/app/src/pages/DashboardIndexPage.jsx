import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import { createGroup, fetchMyGroups } from "../api/endpoints.js";
import { useAuth } from "../state/AuthContext.jsx";
import { getApiErrorMessage } from "../utils/apiClient.js";

export default function DashboardIndexPage() {
  const nav = useNavigate();
  const auth = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [groupName, setGroupName] = useState("");
  const [hasGroups, setHasGroups] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!auth.token) return;
      try {
        setError("");
        const res = await fetchMyGroups();
        if (!mounted) return;
        if (res?.groups?.length) {
          setHasGroups(true);
          nav(`/dashboard/${res.groups[0].id}`);
        } else {
          setHasGroups(false);
        }
      } catch (e) {
        const msg = getApiErrorMessage(e);
        if (msg.toLowerCase().includes("invalid or expired token")) {
          auth.logout();
          nav("/login");
          return;
        }
        setError(msg);
        setHasGroups(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [auth, nav]);

  if (hasGroups === null) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="text-sm text-slate-300">Loading your groups...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-300">Select a group or create your first one.</p>
        </div>
        <Button variant="ghost" onClick={() => (auth.logout(), nav("/login"))}>
          Logout
        </Button>
      </div>

      {error ? (
        <div className="mt-5 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</div>
      ) : null}

      {hasGroups ? null : (
        <Card className="mt-6 p-5 md:p-6">
          <div className="text-sm text-slate-300">Create a new group</div>
          <form
            className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]"
            onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              setError("");
              try {
                const data = await createGroup({ name: groupName.trim() });
                if (data?.group?.id) nav(`/dashboard/${data.group.id}`);
              } catch (err) {
                setError(getApiErrorMessage(err));
              } finally {
                setLoading(false);
              }
            }}
          >
            <input
              className="rounded-xl bg-black/20 px-3 py-2"
              placeholder="e.g. Room A expenses"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "+ Create Group"}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}

