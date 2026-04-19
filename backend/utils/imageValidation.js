const IMAGE_SIGNATURES = {
  'image/png': (buffer) =>
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47,
  'image/jpeg': (buffer) =>
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[buffer.length - 2] === 0xff &&
    buffer[buffer.length - 1] === 0xd9,
  'image/webp': (buffer) =>
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP',
};

export const validateImageDataUrl = (dataUrl, options = {}) => {
  const {
    maxSizeBytes = 2 * 1024 * 1024,
    allowedMimeTypes = ['image/png', 'image/jpeg', 'image/webp'],
  } = options;

  if (typeof dataUrl !== 'string' || dataUrl.length === 0) {
    throw new Error('Profile picture is required');
  }

  const matches = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!matches) {
    throw new Error('Invalid image format. Use a PNG, JPEG, or WEBP data URL.');
  }

  const [, mimeType, base64Payload] = matches;
  if (!allowedMimeTypes.includes(mimeType)) {
    throw new Error('Unsupported image type. Only PNG, JPEG, and WEBP are allowed.');
  }

  const buffer = Buffer.from(base64Payload, 'base64');
  if (!buffer.length || buffer.toString('base64') !== base64Payload.replace(/=+$/, (padding) => '='.repeat(padding.length))) {
    throw new Error('Invalid base64 image payload.');
  }

  if (buffer.length > maxSizeBytes) {
    throw new Error(`Image too large. Maximum size is ${Math.round(maxSizeBytes / (1024 * 1024))}MB.`);
  }

  const signatureValidator = IMAGE_SIGNATURES[mimeType];
  if (!signatureValidator || !signatureValidator(buffer)) {
    throw new Error('Image content does not match the declared file type.');
  }

  return {
    mimeType,
    size: buffer.length,
    buffer,
    normalizedDataUrl: `data:${mimeType};base64,${buffer.toString('base64')}`,
  };
};
