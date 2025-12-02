import type { WebSocket } from 'ws';

const carouselHandler = (ws: WebSocket) => {
    ws.send('Welcome to the carousel WebSocket!');

    ws.on('message', message =>
        ws.send(`Server received: ${message}`)
    );

    ws.on('close', () =>
        console.log('WebSocket connection closed')
    );
};

export default carouselHandler;
