// Helper to get WAV duration
const getWavDuration = (buffer: Buffer): number => {
  if (buffer.length < 44) {
    return 0;
  }

  // Check RIFF header
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    return 0; // Not a WAV file or header issue
  }

  // Parse fmt chunk
  let offset = 12;
  let fmtChunkFound = false;
  let channels = 1;
  let sampleRate = 44100;
  let bitsPerSample = 16;

  while (offset < buffer.length) {
    const chunkId = buffer.toString('ascii', offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);

    if (chunkId === 'fmt ') {
      // AudioFormat (2 bytes)
      channels = buffer.readUInt16LE(offset + 10);
      sampleRate = buffer.readUInt32LE(offset + 12);
      // ByteRate (4 bytes)
      // BlockAlign (2 bytes)
      bitsPerSample = buffer.readUInt16LE(offset + 22);
      fmtChunkFound = true;
      break;
    }

    offset += 8 + chunkSize;
  }

  if (!fmtChunkFound) return 0;

  // Find data chunk size
  offset = 12;
  let dataSize = 0;
  while (offset < buffer.length) {
    const chunkId = buffer.toString('ascii', offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    if (chunkId === 'data') {
      dataSize = chunkSize;
      break;
    }
    offset += 8 + chunkSize;
  }

  if (dataSize === 0) {
      // If we can't find data chunk standardly, approximate from total size - header
      dataSize = buffer.length - 44;
  }

  const bytesPerSample = bitsPerSample / 8;
  const totalSamples = dataSize / (channels * bytesPerSample);
  return totalSamples / sampleRate;
}

export default getWavDuration;
