/**
  An in-place replacement for ScriptProcessorNode using AudioWorklet
*/
class RecorderProcessor extends AudioWorkletProcessor {
  // 0. Determine the buffer size (this is the same as the 1st argument of ScriptProcessor)
  bufferSize = 2048
  // 1. Track the current buffer fill level
  _bytesWritten = 0

  // 2. Create a buffer of fixed size
  _buffer = new Float32Array(this.bufferSize)
  
  constructor() {
    super()
    this.initBuffer()
  }

  initBuffer() {
    this._bytesWritten = 0
  }

  isBufferEmpty() {
    return this._bytesWritten === 0
  }

  isBufferFull() {
    return this._bytesWritten === this.bufferSize
  }
  
    /**
   * @param {Float32Array[][]} inputs
   * @returns {boolean}
   */
  process(inputs) {
    // Grabbing the 1st channel similar to ScriptProcessorNode
    this.append(inputs[0][0])

    return true
  }

  /**
   *
   * @param {Float32Array} channelData
   */
  append(channelData) {
    if (this.isBufferFull()) {
      this.flush()
    }

    if (!channelData) return

    for (let i = 0; i < channelData.length; i++) {
      this._buffer[this._bytesWritten++] = channelData[i]
    }
  }
  
  flush() {
    // trim the buffer if ended prematurely
    const buffer = this._bytesWritten < this.bufferSize
      ? this._buffer.slice(0, this._bytesWritten)
      : this._buffer
    const result = this.downsampleBuffer(buffer, 44100, 16000);
    this.port.postMessage(result)
    this.initBuffer()
  }

  downsampleBuffer (buffer, sampleRate, outSampleRate) {
    if (outSampleRate == sampleRate) {
      return buffer;
    }
    if (outSampleRate > sampleRate) {
      throw 'downsampling rate show be smaller than original sample rate';
    }
    var sampleRateRatio = sampleRate / outSampleRate;
    var newLength = Math.round(buffer.length / sampleRateRatio);
    var result = new Int16Array(newLength);
    var offsetResult = 0;
    var offsetBuffer = 0;
    while (offsetResult < result.length) {
      var nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
      var accum = 0,
        count = 0;
      for (var i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
        accum += buffer[i];
        count++;
      }
  
      result[offsetResult] = Math.min(1, accum / count) * 0x7fff;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    return result.buffer;
  };

}

registerProcessor("recorder.worklet", RecorderProcessor)