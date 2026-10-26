import type {
  TEmployee,
  TEmployeeCreate,
  TEmployeeDetail,
  TEmployeeListQuery,
  TEmployeeOption,
  TEmployeeOptionsQuery,
  TEmployeePasswordBody,
  TEmployeeUpdate,
  TPayPlan,
  TPayPlanCreate,
} from "@wrs/contract/employee";
import type { TPage } from "@wrs/contract/common";

import { http } from "@/lib/http";

export function listEmployees(query: TEmployeeListQuery, signal?: AbortSignal) {
  return http.get<TPage<TEmployee>>("/employees", { params: query, signal });
}

export function listEmployeeOptions(query: TEmployeeOptionsQuery, signal?: AbortSignal) {
  return http.get<TEmployeeOption[]>("/employees/options", { params: query, signal });
}

export function getEmployee(id: string, signal?: AbortSignal) {
  return http.get<TEmployeeDetail>(`/employees/${id}`, { signal });
}

export function createEmployee(body: TEmployeeCreate) {
  return http.post<TEmployee>("/employees", body);
}

export function updateEmployee({ id, body }: { id: string; body: TEmployeeUpdate }) {
  return http.patch<TEmployee>(`/employees/${id}`, body);
}

export function setEmployeePassword({ id, body }: { id: string; body: TEmployeePasswordBody }) {
  return http.post<void>(`/employees/${id}/password`, body);
}

export function createPayPlan({ employeeId, body }: { employeeId: string; body: TPayPlanCreate }) {
  return http.post<TPayPlan>(`/employees/${employeeId}/pay-plans`, body);
}
