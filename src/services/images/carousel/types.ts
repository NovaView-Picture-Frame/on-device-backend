import type { UUID } from "crypto";

import type { Order, OrderSwitchMode } from "../../../models/carousel";

type OrderOption =
    | { order: Extract<Order, "random">; seed: Buffer }
    | { order: Exclude<Order, "random">; seed?: never };

export type State =
    | { phase: "idle"; order: Order }
    | ({ phase: "running"; startTime: Date } & OrderOption);

export type Event =
    | { type: "ACTIVATE" } & OrderOption
    | { type: "DEACTIVATE" }
    | { type: "REQUEST_SCHEDULE"; deviceId: UUID }
    | { type: "SET_ORDER"; order: Order }
    | { type: "SWITCH_ORDER"; mode: OrderSwitchMode } & OrderOption
    | { type: "IMAGES_CHANGED" };

export type Action =
    | { type: "SEND_TO_ONE"; deviceId: UUID }
    | { type: "BROADCAST" };
