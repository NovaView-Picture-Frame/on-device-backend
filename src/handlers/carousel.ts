import type { WebSocket, RawData } from 'ws';

import {
    handleConnected,
    handleClosed,
    requestSchedule,
} from '../services/images/carousel';
import { ClientMessageSchema } from '../models/carousel';

export default (ws: WebSocket) => {
    handleConnected(ws);

    ws.on('message', (raw: RawData) => {
        try {
            const message = ClientMessageSchema.parse(
                JSON.parse(raw.toString())
            );

            switch (message.type) {
                case 'requestSchedule':
                    requestSchedule(ws);

                    break;
            }
        } catch {
            ws.send("Invalid message");
        }
    });

    ws.on('close', () => {
        handleClosed(ws);
        console.log("WebSocket connection closed");
    });
};
