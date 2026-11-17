const PREFERRED = ['audio/webm', 'audio/mp4', 'audio/ogg'];

export function pickMimeType(isSupported) {
  return PREFERRED.find((t) => { try { return isSupported(t); } catch { return false; } }) || null;
}

export function baseMime(t) { return String(t || '').split(';')[0].trim(); }

export async function blobToBase64(blob) {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = '';
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(bin);
}

/** Starts recording; resolves to a controller with stop() -> Promise<{mimeType, base64}>. Throws if unsupported/denied. */
export async function startRecording() {
  const MR = globalThis.MediaRecorder;
  if (!MR || !navigator.mediaDevices?.getUserMedia) throw new Error('unsupported');
  const mimeType = pickMimeType((t) => MR.isTypeSupported(t));
  if (!mimeType) throw new Error('unsupported');
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const rec = new MR(stream, { mimeType });
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  rec.start();
  return {
    stop: () => new Promise((resolve) => {
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: rec.mimeType || mimeType });
        resolve({ mimeType: baseMime(rec.mimeType || mimeType), base64: await blobToBase64(blob) });
      };
      rec.stop();
    }),
  };
}
