// SPDX-FileCopyrightText: Copyright 2025 Fabio Iotti
// SPDX-License-Identifier: AGPL-3.0-only

import { createClient, ICreateClientOpts, MatrixClient } from "matrix-js-sdk";
import { createContext, useContext, useMemo, useRef, useState } from "react";

interface MatrixProviderProps {
  children: React.ReactNode
  defaultBaseUrl?: string
  storageKey?: string
}

interface MatrixProviderValue {
  client: MatrixClient
  replaceClient(options: Partial<ICreateClientOpts>): MatrixClient
}

type MatrixConfig = {
  baseUrl?: string
  accessToken?: string
}

const MatrixProviderContext = createContext<MatrixProviderValue | null>(null)

export function MatrixProvider({
  children,
  defaultBaseUrl = location.origin,
  storageKey = "matrix",
}: MatrixProviderProps) {
  const initialMatrixClientRef = useRef<MatrixClient | null>(null);
  if (!initialMatrixClientRef.current) {
    const config = loadConfig(storageKey);

    initialMatrixClientRef.current = createClient({
      baseUrl: checkType('string', config.baseUrl, defaultBaseUrl),
      accessToken: checkType('string', config.accessToken, undefined),
    });
  }

  const [matrixClient, setMatrixClient] = useState(initialMatrixClientRef.current);

  const value = useMemo<MatrixProviderValue>(() => ({
    client: matrixClient,
    replaceClient(options) {
      const previousConfig = loadConfig(storageKey);

      const updatedConfig = {
        baseUrl: options.baseUrl ?? previousConfig.baseUrl ?? defaultBaseUrl,
        accessToken: Object.prototype.hasOwnProperty.call(options, 'accessToken') ? options.accessToken : previousConfig.accessToken,
      } satisfies MatrixConfig;

      saveConfig(storageKey, updatedConfig);

      const newMatrixClient = createClient({
        baseUrl: updatedConfig.baseUrl ?? defaultBaseUrl,
        accessToken: updatedConfig.accessToken,
        ...options,
      });

      setMatrixClient(newMatrixClient);

      return newMatrixClient;
    },
  }), [matrixClient, storageKey, defaultBaseUrl]);

  return (
    <MatrixProviderContext.Provider value={value}>
      {children}
    </MatrixProviderContext.Provider>
  );
}

export function useMatrix() {
  const context = useContext(MatrixProviderContext);
  if (!context)
    throw new Error("useMatrix must be used within a MatrixProvider");

  return context;
}

function loadConfig(storageKey: string): MatrixConfig {
  const storedConfigRaw = localStorage.getItem(storageKey);
  if (storedConfigRaw) {
    let storedConfig: unknown;
    try {
      storedConfig = JSON.parse(storedConfigRaw);
    } catch {
      // Error ignored, use empty config.
    }

    if (typeof storedConfig === 'object' && storedConfig != null)
      return storedConfig;
  }

  return {};
}

function saveConfig(storageKey: string, config: MatrixConfig | null) {
  if (config == null)
    localStorage.removeItem(storageKey);
  else
    localStorage.setItem(storageKey, JSON.stringify(config));
}

function checkType<T, TFallback extends T | undefined>(type: string, value: T, fallback: TFallback) {
  return typeof value === type ? value ?? fallback : fallback;
}
