import { appConfig } from '../../config';

const body = {
    data: {
        screen_width: appConfig.device.screen.width,
        screen_height: appConfig.device.screen.height,
        size_limit: appConfig.services.upload.size_limit_bytes,
    },
};

export const infoHandler = () => body;
