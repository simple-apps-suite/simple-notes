// SPDX-FileCopyrightText: Copyright 2025 Fabio Iotti
// SPDX-License-Identifier: AGPL-3.0-only

import { useCallback, useEffect } from 'react';
import { useMatrixRequest } from '../hooks/use-matrix-request';
import { useMatrix } from '../matrix-provider';
import { Button } from '../ui/button';

export function MatrixTest() {
  return (
    <div>
      <MatrixLoginTest />
      <MatrixPublicRoomsTest />
      <MatrixJoinedRoomsTest />
    </div>
  );
}

function MatrixLoginTest() {
  const { client, replaceClient } = useMatrix();

  const login = useCallback(async () => {
    const response = await client.loginRequest({
      type: 'm.login.password',
      identifier: {
        type: 'm.id.user',
        user: '@test1:localhost',
      },
      password: '1234',
    });

    replaceClient({
      accessToken: response.access_token,
    });
  }, [client, replaceClient]);

  const logout = useCallback(async () => {
    await client.logout(true);

    replaceClient({
      accessToken: undefined,
    });
  }, [client, replaceClient]);

  const isLoggedIn = client.isLoggedIn();

  useEffect(() => {
    let initialized: Promise<void>;
    if (isLoggedIn)
      initialized = client.startClient();

    return (() => {
      (async () => {
        if (initialized) {
          await initialized;
          client.stopClient();
        }
      })();
    });
  }, [client, isLoggedIn]);

  return (
    <div>
      <span>Logged in? {isLoggedIn ? "yup" : "nope"}</span>
      {isLoggedIn && <Button onClick={logout}>Logout</Button>}
      {!isLoggedIn && <Button onClick={login}>Login</Button>}
    </div>
  );
}

function MatrixPublicRoomsTest() {
  const { pending, result, error, loadMore } = useMatrixRequest('publicRooms');

  return (
    <div>
      <h1>Public rooms</h1>
      {pending && <span>Loading rooms...</span>}
      {error != null && <span>{error instanceof Error ? error.message : `ERROR: ${JSON.stringify(error)}`}</span>}
      {result && <ul>
        {result.chunk.map(r => <li key={r.room_id}>{r.room_id}</li>)}
      </ul>}
      {loadMore && <button onClick={loadMore}>More</button>}
    </div>
  );
}

function MatrixJoinedRoomsTest() {
  const { pending, result, error, loadMore } = useMatrixRequest('getJoinedRooms');

  return (
    <div>
      <h1>Joined rooms</h1>
      {pending && <span>Loading rooms...</span>}
      {error != null && <span>{error instanceof Error ? error.message : `ERROR: ${JSON.stringify(error)}`}</span>}
      {result && <ul>
        {result.joined_rooms.map(r => <li key={r}>{r}</li>)}
      </ul>}
      {loadMore && <button onClick={loadMore}>More</button>}
    </div>
  );
}