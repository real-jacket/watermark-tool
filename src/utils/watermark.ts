import heic2any from 'heic2any';

export interface WatermarkOptions {
  text: string;
  fontSize: number;
  color: string;
  opacity: number;
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  rotation: number;
  mode: 'single' | 'tile'; // 单个水印或平铺模式
  spacing: number; // 平铺模式下水印之间的间距百分比（0-300%，相对于水印宽度）
  offsetX: number; // 平铺模式下水印整体水平偏移（-50到50，百分比相对于画布宽度）
  offsetY: number; // 平铺模式下水印整体垂直偏移（-50到50，百分比相对于画布高度）
}

export type ImageFormat = 'png' | 'jpeg' | 'webp';

export interface ExportOptions {
  format: ImageFormat;
  quality?: number; // JPEG 和 WebP 的质量（0-1），默认 0.92
}

export const addWatermark = (
  image: HTMLImageElement,
  options: WatermarkOptions,
  exportOptions?: ExportOptions
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    // 设置 canvas 尺寸与图片相同
    canvas.width = image.width;
    canvas.height = image.height;

    // 绘制原图
    ctx.drawImage(image, 0, 0);

    // 设置水印样式
    ctx.font = `${options.fontSize}px Arial`;
    ctx.fillStyle = options.color;
    ctx.globalAlpha = options.opacity;

    // 计算文字尺寸
    const textMetrics = ctx.measureText(options.text);
    const textWidth = textMetrics.width;
    const textHeight = options.fontSize;

    if (options.mode === 'tile') {
      // 平铺模式 - 水印刚好铺满图片且不重叠
      const angle = (options.rotation * Math.PI) / 180;

      // 步骤1: 计算旋转后文字的包围盒尺寸（避免重叠）
      const cos = Math.abs(Math.cos(angle));
      const sin = Math.abs(Math.sin(angle));
      const rotatedWidth = textWidth * cos + textHeight * sin;
      const rotatedHeight = textWidth * sin + textHeight * cos;

      // 步骤2: spacing 表示相对于水印宽度的百分比
      // 例如: spacing = 50 表示间距为水印宽度的 50%
      const spacingPercent = options.spacing;
      const spacingGap = rotatedWidth * (spacingPercent / 100);

      // 步骤3: 每个水印单元格的大小（包围盒 + 间隔）
      const cellWidth = rotatedWidth + spacingGap;
      const cellHeight = rotatedHeight + spacingGap;

      // 步骤4: 计算需要的行数和列数，确保铺满整个画布
      const cols = Math.ceil(canvas.width / cellWidth) + 2; // +2 确保偏移后仍能铺满
      const rows = Math.ceil(canvas.height / cellHeight) + 2;

      // 步骤5: 计算偏移量（百分比转换为像素）
      const offsetXPixels = canvas.width * (options.offsetX / 100);
      const offsetYPixels = canvas.height * (options.offsetY / 100);

      // 步骤6: 计算起始偏移，使水印居中铺满，并应用用户设置的偏移
      const startX = (canvas.width - (cols - 1) * cellWidth) / 2 + offsetXPixels;
      const startY = (canvas.height - (rows - 1) * cellHeight) / 2 + offsetYPixels;

      // 步骤7: 绘制每个水印
      for (let row = -1; row < rows; row++) {
        for (let col = -1; col < cols; col++) {
          ctx.save();

          // 计算当前水印的中心位置
          const centerX = startX + col * cellWidth + rotatedWidth / 2;
          const centerY = startY + row * cellHeight + rotatedHeight / 2;

          // 移动到水印中心并旋转
          ctx.translate(centerX, centerY);
          ctx.rotate(angle);

          // 绘制水印文字（从中心点绘制）
          ctx.fillText(options.text, -textWidth / 2, textHeight / 4);

          ctx.restore();
        }
      }
    } else {
      // 单个水印模式
      let x = 0;
      let y = 0;

      // 计算基础位置
      switch (options.position) {
        case 'center':
          x = (canvas.width - textWidth) / 2;
          y = (canvas.height + textHeight) / 2;
          break;
        case 'top-left':
          x = 20;
          y = 20 + textHeight;
          break;
        case 'top-right':
          x = canvas.width - textWidth - 20;
          y = 20 + textHeight;
          break;
        case 'bottom-left':
          x = 20;
          y = canvas.height - 20;
          break;
        case 'bottom-right':
          x = canvas.width - textWidth - 20;
          y = canvas.height - 20;
          break;
      }

      // 应用偏移量（百分比转换为像素）
      const offsetXPixels = canvas.width * (options.offsetX / 100);
      const offsetYPixels = canvas.height * (options.offsetY / 100);
      x += offsetXPixels;
      y += offsetYPixels;

      // 保存当前状态
      ctx.save();

      // 移动到水印位置并旋转
      ctx.translate(x + textWidth / 2, y - textHeight / 2);
      ctx.rotate((options.rotation * Math.PI) / 180);
      ctx.translate(-(x + textWidth / 2), -(y - textHeight / 2));

      // 绘制水印文字
      ctx.fillText(options.text, x, y);

      // 恢复状态
      ctx.restore();
    }

    // 转换为 Data URL - 支持不同格式
    const format = exportOptions?.format || 'png';
    const quality = exportOptions?.quality || 0.92;

    let mimeType: string;
    switch (format) {
      case 'jpeg':
        mimeType = 'image/jpeg';
        break;
      case 'webp':
        mimeType = 'image/webp';
        break;
      case 'png':
      default:
        mimeType = 'image/png';
        break;
    }

    // PNG 不需要 quality 参数，JPEG 和 WebP 需要
    const dataUrl = format === 'png'
      ? canvas.toDataURL(mimeType)
      : canvas.toDataURL(mimeType, quality);

    resolve(dataUrl);
  });
};

export const loadImage = async (file: File): Promise<HTMLImageElement> => {
  let processedFile: File | Blob = file;

  // 检查是否是 HEIC 格式
  const isHeic = file.type === 'image/heic' ||
                 file.type === 'image/heif' ||
                 file.name.toLowerCase().endsWith('.heic') ||
                 file.name.toLowerCase().endsWith('.heif');

  // 如果是 HEIC 格式，转换为 JPEG
  if (isHeic) {
    try {
      const convertedBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.95,
      });

      // heic2any 可能返回 Blob 或 Blob[]
      processedFile = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    } catch (error) {
      console.error('HEIC 转换失败:', error);
      throw new Error('HEIC 格式转换失败，请确保文件有效');
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(processedFile);
  });
};

export const downloadImage = (dataUrl: string, filename: string) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
