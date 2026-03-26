import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import { useSocket } from "../hooks/useSocket.js";
import {
  addExpense,
  addMember,
  createGroup,
  deleteExpense,
  deleteGroup,
  fetchMyGroups,
  getGroupSettlement,
  getGroupSummary,
  getMonthlyAnalytics,
  getMemberWiseAnalytics,
  listExpenses,
  removeMember,
  updateExpense
} from "../api/endpoints.js";
import { useAuth } from "../state/AuthContext.jsx";
import { getApiErrorMessage } from "../utils/apiClient.js";
import { formatDate, formatINR } from "../utils/format.js";

function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} role="presentation" />
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900/95 p-5 shadow-soft backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-base font-semibold">{title}</h3>
          <button
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function SectionTitle({ title, right }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-base font-semibold">{title}</h2>
      {right}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="grid gap-2 text-sm text-slate-300">
      <span>{label}</span>
      {children}
    </label>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="flex items-baseline justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <span className="text-sm text-slate-300">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

function ExpenseTableRow({ e, onEdit, onDelete }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="truncate font-semibold">{e.description}</div>
        <div className="mt-1 text-sm text-slate-300">
          Paid by {e.member?.name || "Member"} · {formatDate(e.date)}
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <div className="whitespace-nowrap text-sm font-bold">{formatINR(e.amount)}</div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={onEdit} type="button">
            Edit
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete} type="button">
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

function SettlementRow({ row }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
      <span className="text-slate-300">
        {row.from} owes {row.to}
      </span>
      <span className="font-semibold">{formatINR(row.amount)}</span>
    </div>
  );
}

export default function DashboardPage() {
  const nav = useNavigate();
  const auth = useAuth();
  const { groupId } = useParams();

  const [groups, setGroups] = useState([]);
  const [groupSummary, setGroupSummary] = useState(null);
  const [settlementData, setSettlementData] = useState(null);
  const [expenses, setExpenses] = useState([]);

  const [monthlyAnalytics, setMonthlyAnalytics] = useState({ labels: [], values: [] });
  const [memberWiseAnalytics, setMemberWiseAnalytics] = useState({ members: [], values: [] });
  const [chartComponents, setChartComponents] = useState({ Monthly: null, MemberWise: null, error: "" });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [groupCreateName, setGroupCreateName] = useState("");

  const [addMemberMobile, setAddMemberMobile] = useState("");
  const [removeMemberMobile, setRemoveMemberMobile] = useState("");

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    description: "",
    amount: "",
    member: "",
    date: ""
  });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState("");
  const [editForm, setEditForm] = useState({
    description: "",
    amount: "",
    member: "",
    date: ""
  });

  const selectedGroup = useMemo(() => groups.find((g) => String(g.id) === String(groupId)), [groups, groupId]);
  const members = settlementData?.balances || groupSummary?.members || [];
  const memberOptions = useMemo(
    () => members.map((m) => ({ id: m.id || m.memberId, name: m.name })).filter((m) => m.id),
    [members]
  );
  const isAdmin = selectedGroup && String(selectedGroup.admin) === String(auth.user?.id);

  const refreshGroupData = useCallback(
    async (gid) => {
      if (!gid) return;
      if (!auth.token) return;
      setLoading(true);
      setError("");
      try {
        const summary = await getGroupSummary(gid);
        setGroupSummary(summary);

        const list = await listExpenses(gid);
        setExpenses(list.expenses || []);

        const [monthly, memberWise, settlement] = await Promise.all([
          getMonthlyAnalytics(gid),
          getMemberWiseAnalytics(gid),
          getGroupSettlement(gid)
        ]);
        setMonthlyAnalytics(monthly);
        setMemberWiseAnalytics(memberWise);
        setSettlementData(settlement);
      } catch (err) {
        const msg = getApiErrorMessage(err);
        if (msg.toLowerCase().includes("invalid or expired token")) {
          auth.logout();
          nav("/login");
          return;
        }
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [auth, nav]
  );

  useSocket({
    token: auth.token,
    onExpenseUpdated: (payload) => {
      const updatedGroupId = payload?.groupId;
      if (!updatedGroupId) return;
      if (String(updatedGroupId) !== String(groupId)) return;
      void refreshGroupData(updatedGroupId);
    }
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!auth.token) return;
      try {
        setError("");
        const res = await fetchMyGroups();
        if (!mounted) return;
        const nextGroups = res?.groups || [];
        setGroups(nextGroups);

        const exists = nextGroups.some((g) => String(g.id) === String(groupId));
        if (!exists) {
          if (nextGroups.length) nav(`/dashboard/${nextGroups[0].id}`);
          return;
        }

        await refreshGroupData(groupId);
      } catch (err) {
        const msg = getApiErrorMessage(err);
        if (msg.toLowerCase().includes("invalid or expired token")) {
          auth.logout();
          nav("/login");
          return;
        }
        setError(msg);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [auth, groupId, nav, refreshGroupData]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [monthlyMod, memberWiseMod] = await Promise.all([
          import("../components/charts/MonthlyExpenseChart.jsx"),
          import("../components/charts/MemberWiseExpenseChart.jsx")
        ]);
        if (!mounted) return;
        setChartComponents({ Monthly: monthlyMod.default, MemberWise: memberWiseMod.default, error: "" });
      } catch (e) {
        if (!mounted) return;
        setChartComponents({ Monthly: null, MemberWise: null, error: "Charts unavailable" });
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    // Ensure default member selection for add/edit modals.
    if (!members.length) return;
    if (!addModalOpen && !editModalOpen) return;
    const defaultMemberId = members[0]?.id || members[0]?.memberId || "";
    setExpenseForm((s) => ({ ...s, member: s.member || defaultMemberId }));
    setEditForm((s) => ({ ...s, member: s.member || defaultMemberId }));
  }, [members, addModalOpen, editModalOpen]);

  async function onLogout() {
    auth.logout();
    nav("/login");
  }

  async function onCreateGroup(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await createGroup({ name: groupCreateName.trim() });
      setGroupCreateName("");
      await refreshGroupsAndNavigate(data?.group?.id);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function refreshGroupsAndNavigate(nextGroupId) {
    try {
      const res = await fetchMyGroups();
      const nextGroups = res?.groups || [];
      setGroups(nextGroups);
      if (nextGroupId) nav(`/dashboard/${nextGroupId}`);
    } catch {
      // Ignore; refresh will happen on next navigation.
    }
  }

  async function onAddMember(e) {
    e.preventDefault();
    if (!groupId) return;
    setError("");
    setLoading(true);
    try {
      await addMember({ groupId, memberMobileNumber: addMemberMobile.trim() });
      setAddMemberMobile("");
      const res = await fetchMyGroups();
      setGroups(res?.groups || []);
      await refreshGroupData(groupId);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function onRemoveMember(e) {
    e.preventDefault();
    if (!groupId) return;
    setError("");
    setLoading(true);
    try {
      await removeMember({ groupId, memberMobileNumber: removeMemberMobile.trim() });
      setRemoveMemberMobile("");
      const res = await fetchMyGroups();
      setGroups(res?.groups || []);
      await refreshGroupData(groupId);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function onDeleteGroup() {
    if (!groupId) return;
    const ok = window.confirm("Delete this group? This will also delete all its expenses.");
    if (!ok) return;

    setError("");
    setLoading(true);
    try {
      await deleteGroup(groupId);
      const res = await fetchMyGroups();
      const nextGroups = res?.groups || [];
      setGroups(nextGroups);
      if (nextGroups.length) nav(`/dashboard/${nextGroups[0].id}`);
      else nav("/dashboard");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function onAddExpense(e) {
    e.preventDefault();
    if (!groupId) return;
    setError("");
    setLoading(true);
    try {
      await addExpense({
        groupId,
        description: expenseForm.description.trim(),
        amount: Number(expenseForm.amount),
        member: expenseForm.member,
        date: expenseForm.date || undefined
      });

      setAddModalOpen(false);
      setExpenseForm({ description: "", amount: "", member: "", date: "" });
      await refreshGroupData(groupId);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function onEditExpense(e) {
    e.preventDefault();
    if (!groupId) return;
    setError("");
    setLoading(true);
    try {
      await updateExpense(editingExpenseId, {
        groupId,
        description: editForm.description.trim(),
        amount: Number(editForm.amount),
        member: editForm.member,
        date: editForm.date || undefined
      });

      setEditModalOpen(false);
      setEditingExpenseId("");
      setEditForm({ description: "", amount: "", member: "", date: "" });
      await refreshGroupData(groupId);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function onDeleteExpenseClick(expense) {
    if (!groupId) return;
    const ok = window.confirm("Delete this expense?");
    if (!ok) return;
    setError("");
    setLoading(true);
    try {
      await deleteExpense(expense.id, groupId);
      await refreshGroupData(groupId);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold truncate">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-300 truncate">
            {selectedGroup?.name || "Loading group..."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <Card className="p-4">
          <div className="text-sm font-semibold">Your Groups</div>
          <div className="mt-3 grid gap-2">
            {groups.length ? (
              groups.map((g) => {
                const active = String(g.id) === String(groupId);
                return (
                  <button
                    key={g.id}
                    type="button"
                    className={[
                      "w-full rounded-xl border px-3 py-2 text-left text-sm",
                      active ? "border-indigo-400/50 bg-indigo-500/10" : "border-white/10 bg-black/20 hover:bg-white/5"
                    ].join(" ")}
                    onClick={() => nav(`/dashboard/${g.id}`)}
                  >
                    {g.name}
                    <div className="mt-1 text-xs text-slate-400">{g.membersCount} members</div>
                  </button>
                );
              })
            ) : (
              <div className="text-sm text-slate-300">No groups yet.</div>
            )}
          </div>
        </Card>

        {/* Main */}
        <div className="grid gap-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <SectionTitle title="Total Group Expense" />
              <div className="mt-4">
                <StatRow label="Total" value={formatINR(settlementData?.totalExpense ?? groupSummary?.totalGroupExpense ?? 0)} />
                <StatRow label="Per Person Share" value={formatINR(settlementData?.perPersonShare ?? 0)} />
              </div>
              <div className="mt-4">
                <div className="text-sm text-slate-300">Members</div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {members.length ? (
                    members.map((m) => (
                      <div key={m.id || m.memberId} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="text-sm text-slate-300">{m.name}</div>
                        <div className="mt-1 text-lg font-bold">{formatINR(m.spent || 0)}</div>
                        <div className="text-xs text-slate-400">Balance: {formatINR(m.balance || 0)}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-slate-300">No members yet.</div>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <SectionTitle
                title="Group Management"
                right={
                  isAdmin ? (
                    <Button size="sm" variant="ghost" onClick={onDeleteGroup} type="button">
                      Delete Group
                    </Button>
                  ) : null
                }
              />

              <div className="mt-4 grid gap-4">
                <form onSubmit={onCreateGroup} className="grid gap-2">
                  <div className="text-sm text-slate-300">Create group</div>
                  <input
                    className="rounded-xl bg-black/20 px-3 py-2"
                    placeholder="e.g. Room A expenses"
                    value={groupCreateName}
                    onChange={(e) => setGroupCreateName(e.target.value)}
                    required
                  />
                  <Button type="submit" size="sm" disabled={loading}>
                    + Create Group
                  </Button>
                </form>

                <form onSubmit={onAddMember} className="grid gap-2">
                  <div className="text-sm text-slate-300">Add member</div>
                  <input
                    className="rounded-xl bg-black/20 px-3 py-2"
                    placeholder="Member mobile number (10-15 digits)"
                    inputMode="numeric"
                    value={addMemberMobile}
                    onChange={(e) => setAddMemberMobile(e.target.value)}
                    required
                    disabled={!isAdmin}
                  />
                  <Button type="submit" size="sm" variant="secondary" disabled={loading || !isAdmin}>
                    + Add Member
                  </Button>
                </form>

                <form onSubmit={onRemoveMember} className="grid gap-2">
                  <div className="text-sm text-slate-300">Remove member</div>
                  <input
                    className="rounded-xl bg-black/20 px-3 py-2"
                    placeholder="Member mobile number (10-15 digits)"
                    inputMode="numeric"
                    value={removeMemberMobile}
                    onChange={(e) => setRemoveMemberMobile(e.target.value)}
                    required
                    disabled={!isAdmin}
                  />
                  <Button type="submit" size="sm" variant="secondary" disabled={loading || !isAdmin}>
                    Remove
                  </Button>
                </form>
              </div>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5 lg:col-span-2">
              <SectionTitle title="Who Owes Whom (Settlement)" />
              <div className="mt-4 grid gap-3">
                {settlementData?.settlements?.length ? (
                  settlementData.settlements.map((row, idx) => (
                    <SettlementRow key={`${row.from}-${row.to}-${idx}`} row={row} />
                  ))
                ) : (
                  <div className="text-sm text-slate-300">No settlement required. Everyone is balanced.</div>
                )}
              </div>
            </Card>

            <Card className="p-5 lg:col-span-1">
              <SectionTitle title="Monthly Expense" />
              {chartComponents.error ? (
                <div className="mt-4 text-sm text-slate-300">{chartComponents.error}</div>
              ) : monthlyAnalytics?.labels?.length && chartComponents.Monthly ? (
                <div className="mt-4">
                  <chartComponents.Monthly labels={monthlyAnalytics.labels} values={monthlyAnalytics.values} />
                </div>
              ) : (
                <div className="mt-4 text-sm text-slate-300">No analytics yet.</div>
              )}
            </Card>

            <Card className="p-5 lg:col-span-1">
              <SectionTitle title="Member-wise Expense" />
              {chartComponents.error ? (
                <div className="mt-4 text-sm text-slate-300">{chartComponents.error}</div>
              ) : memberWiseAnalytics?.members?.length && chartComponents.MemberWise ? (
                <div className="mt-4">
                  <chartComponents.MemberWise members={memberWiseAnalytics.members} values={memberWiseAnalytics.values} />
                </div>
              ) : (
                <div className="mt-4 text-sm text-slate-300">No analytics yet.</div>
              )}
            </Card>
          </div>

          <Card className="p-5">
            <SectionTitle
              title="Expenses"
              right={
                <Button
                  size="sm"
                  onClick={() => {
                    if (!members.length) return;
                    const defaultMemberId = members[0]?.id || members[0]?.memberId || "";
                    setExpenseForm((s) => ({ ...s, member: s.member || defaultMemberId }));
                    setAddModalOpen(true);
                  }}
                  type="button"
                  disabled={!members.length}
                >
                  + Add Expense
                </Button>
              }
            />

            <div className="mt-4 grid gap-3">
              {expenses.length ? (
                expenses.map((e) => (
                  <ExpenseTableRow
                    key={e.id}
                    e={e}
                    onEdit={() => {
                      setEditingExpenseId(e.id);
                      setEditForm({
                        description: e.description,
                        amount: String(e.amount),
                        member: e.member?.id || "",
                        date: e.date ? String(e.date).slice(0, 10) : ""
                      });
                      setEditModalOpen(true);
                    }}
                    onDelete={() => void onDeleteExpenseClick(e)}
                  />
                ))
              ) : (
                <div className="text-sm text-slate-300">No expenses yet. Add one to start.</div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Add Expense Modal */}
      <Modal
        open={addModalOpen}
        title="Add Expense"
        onClose={() => setAddModalOpen(false)}
      >
        <form className="grid gap-3" onSubmit={onAddExpense}>
          <Field label="Description">
            <input
              className="rounded-xl bg-black/20 px-3 py-2"
              placeholder="e.g. Milk"
              value={expenseForm.description}
              onChange={(e) => setExpenseForm((s) => ({ ...s, description: e.target.value }))}
              required
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Amount (INR)">
              <input
                className="rounded-xl bg-black/20 px-3 py-2"
                type="number"
                min="0"
                step="0.01"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm((s) => ({ ...s, amount: e.target.value }))}
                required
              />
            </Field>

            <Field label="Paid by (member)">
              <select
                className="rounded-xl bg-black/20 px-3 py-2"
                value={expenseForm.member}
                onChange={(e) => setExpenseForm((s) => ({ ...s, member: e.target.value }))}
                required
              >
                {memberOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Date (optional)">
            <input
              className="rounded-xl bg-black/20 px-3 py-2"
              type="date"
              value={expenseForm.date}
              onChange={(e) => setExpenseForm((s) => ({ ...s, date: e.target.value }))}
            />
          </Field>

          <div className="mt-1 flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              Save Expense
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Expense Modal */}
      <Modal
        open={editModalOpen}
        title="Edit Expense"
        onClose={() => setEditModalOpen(false)}
      >
        <form className="grid gap-3" onSubmit={onEditExpense}>
          <Field label="Description">
            <input
              className="rounded-xl bg-black/20 px-3 py-2"
              value={editForm.description}
              onChange={(e) => setEditForm((s) => ({ ...s, description: e.target.value }))}
              required
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Amount (INR)">
              <input
                className="rounded-xl bg-black/20 px-3 py-2"
                type="number"
                min="0"
                step="0.01"
                value={editForm.amount}
                onChange={(e) => setEditForm((s) => ({ ...s, amount: e.target.value }))}
                required
              />
            </Field>

            <Field label="Paid by (member)">
              <select
                className="rounded-xl bg-black/20 px-3 py-2"
                value={editForm.member}
                onChange={(e) => setEditForm((s) => ({ ...s, member: e.target.value }))}
                required
              >
                {memberOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Date (optional)">
            <input
              className="rounded-xl bg-black/20 px-3 py-2"
              type="date"
              value={editForm.date}
              onChange={(e) => setEditForm((s) => ({ ...s, date: e.target.value }))}
            />
          </Field>

          <div className="mt-1 flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

