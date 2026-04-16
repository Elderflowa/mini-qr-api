import QRCodeStyling from 'qr-code-styling';

export function buildQROptions(data, config = {}, type = 'classic') {
  if (type === 'classic') {
    return {
      width:  300,
      height: 300,
      data,
      qrOptions:            { errorCorrectionLevel: 'M' },
      dotsOptions:          { type: 'square', color: '#000000' },
      cornersSquareOptions: { type: 'square', color: '#000000' },
      cornersDotOptions:    { type: 'square', color: '#000000' },
      backgroundOptions:    { color: '#ffffff', round: 0.15 },
      imageOptions:         { hideBackgroundDots: true, imageSize: 0 },
    };
  }

  return {
    width:  300,
    height: 300,
    data,
    qrOptions: { errorCorrectionLevel: 'M' },
    dotsOptions: {
      type:  config.dotStyle  || 'rounded',
      color: config.primaryColor || '#000000',
    },
    cornersSquareOptions: {
      type:  config.cornerStyle || 'extra-rounded',
      color: config.secondaryColor || config.primaryColor || '#000000',
    },
    cornersDotOptions: {
      type:  config.cornerDotStyle || 'dot',
      color: config.secondaryColor || config.primaryColor || '#000000',
    },
    backgroundOptions: {
      color: config.backgroundColor || '#ffffff',
      round: 0.15,
    },
    image: config.logoPath || undefined,
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: config.logoSize || 0.3,
      margin: 4,
    },
  };
}

export function createQR(data, config, type) {
  return new QRCodeStyling(buildQROptions(data, config, type));
}
