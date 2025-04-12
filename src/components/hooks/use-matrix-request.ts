// SPDX-FileCopyrightText: Copyright 2025 Fabio Iotti
// SPDX-License-Identifier: AGPL-3.0-only

import { MatrixClient } from 'matrix-js-sdk';
import { useEffect, useState } from 'react';
import { usePromise } from '../hooks/use-promise';
import { useMatrix } from '../matrix-provider';

type MatrixRequestOptionsAndResponse = {
  [K in keyof MatrixClient as MatrixClient[K] extends (() => Promise<object>) ? (K) : never]:
    MatrixClient[K] extends ((options: infer O) => Promise<infer R>) ?
    { Options: Exclude<O, undefined>, Response: R } :
    MatrixClient[K] extends (() => Promise<infer R>) ?
    { Options: never, Response: R } :
    never
};
type MatrixRequestKey = keyof MatrixRequestOptionsAndResponse;
type MatrixRequestOptions<K extends MatrixRequestKey> = MatrixRequestOptionsAndResponse[K]['Options'];
type MatrixRequestResponse<K extends MatrixRequestKey> = MatrixRequestOptionsAndResponse[K]['Response'];

interface MatrixRequest<K extends MatrixRequestKey> {
  pending: boolean
  result?: MatrixRequestResponse<K>
  error?: unknown
  loadMore?(): void
}

export function useMatrixRequest<K extends MatrixRequestKey>(api: K, options?: MatrixRequestOptions<K>): MatrixRequest<K> {
  const { client } = useMatrix();

  const [{ currentResult, loadMore }, updateResult] = useState<{ currentResult?: MatrixRequestResponse<K>, loadMore?(): void }>({
    currentResult: undefined,
    loadMore: undefined
  });

  const { run, pending, rejected, error } = usePromise();

  useEffect(() => {
    updateResult({ currentResult: undefined, loadMore: undefined });

    let firstArrayKey: string;
    let nextBatch: string;
    let mayHaveMoreData = false;
    let pending = false;

    const abort = new AbortController();
    const loadData = async (appendToResult: boolean) => {
      if (abort.signal.aborted)
        throw new Error("request aborted, cannot load more");

      if (pending)
        return;

      pending = true;
      try {
        const optionsWithCursor: typeof options = mayHaveMoreData && !Object.prototype.hasOwnProperty.call(options, 'since') ? {
          ...(options as object),
          since: nextBatch,
        } : options;

        const response = (await (client[api] as ((options: unknown) => unknown))(optionsWithCursor)) as MatrixRequestResponse<K>;
        if (abort.signal.aborted)
          return;

        mayHaveMoreData = false;
        if (Object.prototype.hasOwnProperty.call(response, 'next_batch')) {
          nextBatch = (response as { next_batch: string })['next_batch'];
          firstArrayKey = Object.entries(response).filter(e => Array.isArray(e[1])).map(e => e[0])[0];
          mayHaveMoreData = true;
        }

        updateResult(previous => {
          if (!appendToResult) {
            return {
              currentResult: response,
              loadMore: mayHaveMoreData ? () => loadData(true) : undefined,
            };
          }

          return {
            currentResult: {
              ...response,
              [firstArrayKey]: [
                ...(previous.currentResult as Record<string, unknown[]>)[firstArrayKey],
                ...(response as Record<string, unknown[]>)[firstArrayKey],
              ],
            },
            loadMore: mayHaveMoreData ? previous.loadMore : undefined,
          };
        });
      } finally {
        pending = false;
      }
    };

    run(() => loadData(false));

    return () => {
      abort.abort();
    };
  }, [api, client, run, options]);

  return {
    pending,
    result: currentResult,
    error: rejected ? error : undefined,
    loadMore,
  };
}
