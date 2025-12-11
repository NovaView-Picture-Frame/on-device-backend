import { z } from 'zod';
import type { WebSocket, RawData } from 'ws';
import type { IncomingMessage } from 'http';

import {
    handleConnected,
    handleClosed,
    requestSchedule,
} from '../../services/images/carousel';
import { ClientMessageSchema } from '../../models/carousel';
import type { UUID } from 'node:crypto';

export const headerSchema = z.object({
    'device-id': z.uuidv4().pipe(
        z.custom<UUID>()
    ),
});

export const carouselHandler = (ws: WebSocket, req: IncomingMessage) => {
    const headerResult = headerSchema.safeParse(req.headers);
    if (!headerResult.success) {
        ws.close(1008, "Invalid headers");
        return;
    }

    const deviceId = headerResult.data['device-id'];
    handleConnected(ws, deviceId);
    console.log(`WebSocket connected for device: ${deviceId}`);

    ws.on('message', (raw: RawData) => {
        try {
            const message = ClientMessageSchema.parse(
                JSON.parse(raw.toString())
            );

            switch (message.type) {
                case 'requestSchedule':
                    requestSchedule(deviceId);
                    break;

                case 'preloadComplete':
                    console.log(`Preload complete: ${message.payload.id} at ${message.payload.timeStamp.toISOString()} (device: ${deviceId})`);
                    break;
            }
        } catch {
            ws.send(JSON.stringify({
                type: 'error',
                message: "Invalid message",
            }));
        }
    });

    ws.on('close', () => {
        handleClosed(deviceId);
        console.log(`WebSocket closed for device: ${deviceId}`);
    });
};
