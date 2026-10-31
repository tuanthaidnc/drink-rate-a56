import { encodePhoto } from './photoCodec.ts';
self.onmessage = async (event: MessageEvent<Blob>) => {
  try {
    self.postMessage({ blob: await encodePhoto(event.data) });
  } catch (error) {
    self.postMessage({ error: (error as Error).message });
  }
};
