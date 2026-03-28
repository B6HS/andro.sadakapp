import { createContext, useContext, type ReactNode } from "react";

export type TenantRow = {
  id: string;
  slug: string;
  name: string;
  status: string;
  default_borne_id: string | null;
};

export type TenantContextValue = {
  tenant: TenantRow | null;
  tenantSlug: string;
  /** Borne utilisée par la caisse (URL / default tenant) */
  effectiveBorneId: string | null;
  loading: boolean;
  error: string | null;
};

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({
  value,
  children,
}: {
  value: TenantContextValue;
  children: ReactNode;
}) {
  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error("useTenant doit être utilisé sous un TenantProvider (route /:tenantSlug/...)");
  }
  return ctx;
}

/** Hors route tenant (ex. login global) — ne lance pas */
export function useTenantOptional(): TenantContextValue | null {
  return useContext(TenantContext);
}
