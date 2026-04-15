const ICONEX_RELAY_RESPONSE = 'ICONEX_RELAY_RESPONSE';
const ICONEX_RELAY_REQUEST = 'ICONEX_RELAY_REQUEST';

export enum ICONexRequestEventType {
  REQUEST_HAS_ACCOUNT = 'REQUEST_HAS_ACCOUNT',
  REQUEST_HAS_ADDRESS = 'REQUEST_HAS_ADDRESS',
  REQUEST_ADDRESS = 'REQUEST_ADDRESS',
  REQUEST_JSON = 'REQUEST_JSON',
  REQUEST_SIGNING = 'REQUEST_SIGNING',
}

export enum ICONexResponseEventType {
  RESPONSE_HAS_ACCOUNT = 'RESPONSE_HAS_ACCOUNT',
  RESPONSE_HAS_ADDRESS = 'RESPONSE_HAS_ADDRESS',
  RESPONSE_ADDRESS = 'RESPONSE_ADDRESS',
  RESPONSE_JSON = 'RESPONSE_JSON',
  RESPONSE_SIGNING = 'RESPONSE_SIGNING',
}

export interface ICONexRequestEvent {
  type: ICONexRequestEventType;
  // Request payload varies by event type (JSON-RPC params, signing data, etc).
  // `unknown` forces callers to validate before using — safer than `any`.
  payload?: unknown;
}

export interface ICONexResponseEvent {
  type: ICONexResponseEventType;
  // Response payload is always a string: wallet address, tx hash, or signature.
  payload?: string;
}

export type ICONexEvent = ICONexRequestEvent | ICONexResponseEvent;

export const request = (event: ICONexRequestEvent): Promise<ICONexResponseEvent> => {
  return new Promise((resolve, reject) => {
    // evt is a CustomEvent dispatched by the ICONex/Hana extension. Type the handler
    // param so evt.detail is properly typed instead of implicit `any`.
    const handler = (evt: Event) => {
      window.removeEventListener(ICONEX_RELAY_RESPONSE, handler);
      resolve((evt as CustomEvent<ICONexResponseEvent>).detail);
    };

    window.addEventListener(ICONEX_RELAY_RESPONSE, handler);
    window.dispatchEvent(
      new CustomEvent(ICONEX_RELAY_REQUEST, {
        detail: event,
      }),
    );
  });
};
