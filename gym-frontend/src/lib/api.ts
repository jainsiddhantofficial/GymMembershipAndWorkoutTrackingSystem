const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Users
export const getUsers = (role?: string) => request<any[]>(`/users${role ? `?role=${role}` : ""}`);
export const getMembers = () => request<any[]>("/users/members");
export const getTrainers = () => request<any[]>("/users/trainers");
export const getUserById = (id: string) => request<any>(`/users/${id}`);
export const createUser = (data: any) => request<any>("/users", { method: "POST", body: JSON.stringify(data) });
export const updateUser = (id: string, data: any) => request<any>(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteUser = (id: string) => request<void>(`/users/${id}`, { method: "DELETE" });
export const toggleUserActive = (id: string) => request<any>(`/users/${id}/toggle-active`, { method: "PATCH" });

// Membership Plans
export const getPlans = (activeOnly?: boolean) => request<any[]>(`/plans${activeOnly ? "?active=true" : ""}`);
export const createPlan = (data: any) => request<any>("/plans", { method: "POST", body: JSON.stringify(data) });
export const updatePlan = (id: string, data: any) => request<any>(`/plans/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deletePlan = (id: string) => request<void>(`/plans/${id}`, { method: "DELETE" });

// Subscriptions
export const getSubscriptions = (status?: string) => request<any[]>(`/subscriptions${status ? `?status=${status}` : ""}`);
export const getUserSubscriptions = (userId: string) => request<any[]>(`/users/${userId}/subscriptions`);
export const getExpiringSoon = () => request<any[]>("/subscriptions/expiring-soon");
export const createSubscription = (data: any) => request<any>("/subscriptions", { method: "POST", body: JSON.stringify(data) });
export const freezeSubscription = (id: string) => request<any>(`/subscriptions/${id}/freeze`, { method: "PATCH" });
export const unfreezeSubscription = (id: string) => request<any>(`/subscriptions/${id}/unfreeze`, { method: "PATCH" });
export const updateSubscriptionStatus = (id: string, status: string) =>
  request<any>(`/subscriptions/${id}/status?status=${status}`, { method: "PATCH" });
export const deleteSubscription = (id: string) => request<void>(`/subscriptions/${id}`, { method: "DELETE" });

// Attendance
export const getAttendance = () => request<any[]>("/attendance");
export const getTodayAttendance = () => request<any[]>("/attendance/today");
export const getUserAttendance = (userId: string) => request<any[]>(`/attendance/user/${userId}`);
export const checkIn = (userId: string, method?: string) =>
  request<any>(`/attendance/check-in/${userId}${method ? `?method=${method}` : ""}`, { method: "POST" });
export const qrCheckIn = (qrCode: string) => request<any>(`/attendance/qr-check-in?qrCode=${qrCode}`, { method: "POST" });
export const checkOut = (id: string) => request<any>(`/attendance/${id}/check-out`, { method: "PATCH" });
export const deleteAttendance = (id: string) => request<void>(`/attendance/${id}`, { method: "DELETE" });
export const getAttendanceStats = () => request<any>("/attendance/stats");

// Workouts
export const getExercises = (muscleGroup?: string) => request<any[]>(`/exercises${muscleGroup ? `?muscleGroup=${muscleGroup}` : ""}`);
export const createExercise = (data: any) => request<any>("/exercises", { method: "POST", body: JSON.stringify(data) });
export const updateExercise = (id: string, data: any) => request<any>(`/exercises/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteExercise = (id: string) => request<void>(`/exercises/${id}`, { method: "DELETE" });

export const getUserWorkoutSessions = (userId: string) => request<any[]>(`/users/${userId}/workout-sessions`);
export const createWorkoutSession = (userId: string, data: any) =>
  request<any>(`/users/${userId}/workout-sessions`, { method: "POST", body: JSON.stringify(data) });
export const deleteWorkoutSession = (id: string) => request<void>(`/workout-sessions/${id}`, { method: "DELETE" });

export const getSessionLogs = (sessionId: string) => request<any[]>(`/workout-sessions/${sessionId}/logs`);
export const addWorkoutLog = (sessionId: string, exerciseId: string, data: any) =>
  request<any>(`/workout-sessions/${sessionId}/logs?exerciseId=${exerciseId}`, { method: "POST", body: JSON.stringify(data) });
export const deleteWorkoutLog = (id: string) => request<void>(`/workout-logs/${id}`, { method: "DELETE" });

export const getUserBodyMetrics = (userId: string) => request<any[]>(`/users/${userId}/body-metrics`);
export const addBodyMetric = (userId: string, data: any) =>
  request<any>(`/users/${userId}/body-metrics`, { method: "POST", body: JSON.stringify(data) });
export const deleteBodyMetric = (id: string) => request<void>(`/body-metrics/${id}`, { method: "DELETE" });

// Diet Plans
export const getDietPlans = () => request<any[]>("/diet-plans");
export const getMemberDietPlans = (memberId: string) => request<any[]>(`/diet-plans/member/${memberId}`);
export const createDietPlan = (data: any, memberId?: string, trainerId?: string) => {
  const params = new URLSearchParams();
  if (memberId) params.append("memberId", memberId);
  if (trainerId) params.append("trainerId", trainerId);
  return request<any>(`/diet-plans${params.toString() ? "?" + params : ""}`, { method: "POST", body: JSON.stringify(data) });
};
export const updateDietPlan = (id: string, data: any) => request<any>(`/diet-plans/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteDietPlan = (id: string) => request<void>(`/diet-plans/${id}`, { method: "DELETE" });
export const getDietPlanMeals = (dietPlanId: string) => request<any[]>(`/diet-plans/${dietPlanId}/meals`);
export const addMeal = (dietPlanId: string, data: any) => request<any>(`/diet-plans/${dietPlanId}/meals`, { method: "POST", body: JSON.stringify(data) });
export const updateMeal = (id: string, data: any) => request<any>(`/diet-plans/meals/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteMeal = (id: string) => request<void>(`/diet-plans/meals/${id}`, { method: "DELETE" });

// Classes & Bookings
export const getClasses = (upcoming?: boolean) => request<any[]>(`/classes${upcoming ? "?upcoming=true" : ""}`);
export const createClass = (data: any, trainerId?: string) =>
  request<any>(`/classes${trainerId ? `?trainerId=${trainerId}` : ""}`, { method: "POST", body: JSON.stringify(data) });
export const updateClass = (id: string, data: any) => request<any>(`/classes/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteClass = (id: string) => request<void>(`/classes/${id}`, { method: "DELETE" });

export const getBookings = () => request<any[]>("/bookings");
export const getUserBookings = (userId: string) => request<any[]>(`/users/${userId}/bookings`);
export const createBooking = (data: any) => request<any>("/bookings", { method: "POST", body: JSON.stringify(data) });
export const updateBookingStatus = (id: string, status: string, reason?: string) =>
  request<any>(`/bookings/${id}/status?status=${status}${reason ? `&reason=${reason}` : ""}`, { method: "PATCH" });
export const deleteBooking = (id: string) => request<void>(`/bookings/${id}`, { method: "DELETE" });

// Payments
export const getPayments = () => request<any[]>("/payments");
export const getUserPayments = (userId: string) => request<any[]>(`/payments/user/${userId}`);
export const createPayment = (userId: string, data: any) =>
  request<any>(`/payments/user/${userId}`, { method: "POST", body: JSON.stringify(data) });
export const updatePaymentStatus = (id: string, status: string) =>
  request<any>(`/payments/${id}/status?status=${status}`, { method: "PATCH" });
export const deletePayment = (id: string) => request<void>(`/payments/${id}`, { method: "DELETE" });
export const getRevenue = () => request<any>("/payments/revenue");

// Equipment
export const getEquipment = (status?: string) => request<any[]>(`/equipment${status ? `?status=${status}` : ""}`);
export const createEquipment = (data: any) => request<any>("/equipment", { method: "POST", body: JSON.stringify(data) });
export const updateEquipment = (id: string, data: any) => request<any>(`/equipment/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteEquipment = (id: string) => request<void>(`/equipment/${id}`, { method: "DELETE" });

export const getMaintenance = (status?: string) => request<any[]>(`/maintenance${status ? `?status=${status}` : ""}`);
export const createMaintenanceLog = (equipmentId: string, data: any, assignedTo?: string) =>
  request<any>(`/equipment/${equipmentId}/maintenance${assignedTo ? `?assignedTo=${assignedTo}` : ""}`, { method: "POST", body: JSON.stringify(data) });
export const updateMaintenanceLog = (id: string, data: any) => request<any>(`/maintenance/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteMaintenanceLog = (id: string) => request<void>(`/maintenance/${id}`, { method: "DELETE" });

// Dashboard
export const getDashboardStats = () => request<any>("/dashboard/stats");
