// SPDX-FileCopyrightText: Copyright 2025 Fabio Iotti
// SPDX-License-Identifier: AGPL-3.0-only

import { useCallback } from 'react';
import { useMatrixRequest } from '../hooks/use-matrix-request';
import { useMatrix } from '../matrix-provider';
import { Button } from '../ui/button';

export function MatrixTest() {
  return (
    <div>
      <MatrixLoginTest />
      <MatrixRoomsTest />
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

    replaceClient({});
  }, [client, replaceClient]);

  const isLoggedIn = client.isLoggedIn();

  return (
    <div>
      <span>Logged in? {isLoggedIn ? "yup" : "nope"}</span>
      {isLoggedIn && <Button onClick={logout}>Logout</Button>}
      {!isLoggedIn && <Button onClick={login}>Login</Button>}
    </div>
  );
}

function MatrixRoomsTest() {
  const { pending, result, error, loadMore } = useMatrixRequest('publicRooms');

  return (
    <div>
      <h1>Rooms</h1>
      {pending && <span>Loading rooms...</span>}
      {error != null && <span>{error instanceof Error ? error.message : `ERROR: ${JSON.stringify(error)}`}</span>}
      {result && <ul>
        {result.next_batch}
      </ul>}
      {loadMore && <button onClick={loadMore}>More</button>}
    </div>
  );
}