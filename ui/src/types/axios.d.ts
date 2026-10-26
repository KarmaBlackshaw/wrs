export {};

// The `@/lib/http` response interceptor unwraps `response.data`, so calls resolve to the payload itself.
declare module "axios" {
  export interface AxiosInstance {
    get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
    delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
    post<T = unknown, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T>;
    put<T = unknown, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T>;
    patch<T = unknown, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T>;
  }
}
