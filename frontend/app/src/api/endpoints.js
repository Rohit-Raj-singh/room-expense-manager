import { api } from "../utils/apiClient.js";

export function register(payload) {
  return api.post("/register", payload).then((r) => r.data);
}

export function login(payload) {
  return api.post("/login", payload).then((r) => r.data);
}

export function fetchMyGroups() {
  return api.get("/group/list").then((r) => r.data);
}

export function createGroup(payload) {
  return api.post("/group/create", payload).then((r) => r.data);
}

export function addMember(payload) {
  return api.post("/group/add-member", payload).then((r) => r.data);
}

export function removeMember(payload) {
  return api.post("/group/remove-member", payload).then((r) => r.data);
}

export function deleteGroup(groupId) {
  return api.delete(`/group/${groupId}`).then((r) => r.data);
}

export function addExpense(payload) {
  return api.post("/expense/add", payload).then((r) => r.data);
}

export function updateExpense(expenseId, payload) {
  return api.put(`/expense/${expenseId}`, payload).then((r) => r.data);
}

export function deleteExpense(expenseId, groupId) {
  return api.delete(`/expense/${expenseId}`, { params: { groupId } }).then((r) => r.data);
}

export function listExpenses(groupId) {
  return api.get("/expense/list", { params: { groupId } }).then((r) => r.data);
}

export function getGroupSummary(groupId) {
  return api.get("/group/summary", { params: { groupId } }).then((r) => r.data);
}

export function getMonthlyAnalytics(groupId) {
  return api.get("/analytics/monthly", { params: { groupId } }).then((r) => r.data);
}

export function getMemberWiseAnalytics(groupId) {
  return api.get("/analytics/member-wise", { params: { groupId } }).then((r) => r.data);
}

export function getGroupSettlement(groupId) {
  return api.get(`/settlement/${groupId}`).then((r) => r.data);
}

