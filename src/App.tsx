import { useState, useRef, useEffect } from 'react';
import {
  addWatermark,
  loadImage,
  downloadImage,
  WatermarkOptions,
  ImageFormat,
} from './utils/watermark';
import ImageViewer from './components/ImageViewer';

// 水印预设
type WatermarkPreset = {
  name: string;
  description: string;
  options: WatermarkOptions;
};

const WATERMARK_PRESETS: WatermarkPreset[] = [
  {
    name: '经典斜向',
    description: '红色斜向平铺，密集覆盖',
    options: {
      text: '仅供XXX使用',
      fontSize: 40,
      color: '#FF0000',
      opacity: 0.5,
      position: 'center',
      rotation: -45,
      mode: 'tile',
      spacing: 50,
      offsetX: 0,
      offsetY: 0,
    },
  },
  {
    name: '稀疏防伪',
    description: '大字号稀疏分布',
    options: {
      text: '仅供XXX使用',
      fontSize: 50,
      color: '#FF0000',
      opacity: 0.4,
      position: 'center',
      rotation: -45,
      mode: 'tile',
      spacing: 150,
      offsetX: 0,
      offsetY: 0,
    },
  },
  {
    name: '中心单水印',
    description: '居中单个水印，醒目',
    options: {
      text: '仅供XXX使用',
      fontSize: 60,
      color: '#FF0000',
      opacity: 0.6,
      position: 'center',
      rotation: 0,
      mode: 'single',
      spacing: 50,
      offsetX: 0,
      offsetY: 0,
    },
  },
  {
    name: '灰色低调',
    description: '灰色平铺，低调不抢眼',
    options: {
      text: '仅供XXX使用',
      fontSize: 35,
      color: '#808080',
      opacity: 0.3,
      position: 'center',
      rotation: -45,
      mode: 'tile',
      spacing: 80,
      offsetX: 0,
      offsetY: 0,
    },
  },
];

// 常用颜色预设
const COLOR_PRESETS = [
  { name: '红色', value: '#FF0000' },
  { name: '黑色', value: '#000000' },
  { name: '灰色', value: '#808080' },
  { name: '蓝色', value: '#0066FF' },
  { name: '绿色', value: '#00AA00' },
];

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(
    null
  );
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [watermarkedUrl, setWatermarkedUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // 导出格式设置
  const [exportFormat, setExportFormat] = useState<ImageFormat>('png');
  const [exportQuality, setExportQuality] = useState(92); // 0-100

  // 预览模式切换：true 显示水印，false 显示原图
  const [showWatermark, setShowWatermark] = useState(true);

  // 图片查看器状态
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImageUrl, setViewerImageUrl] = useState('');

  // 折叠面板状态
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({
    basic: true,
    advanced: true,
    position: true,
  });

  const [watermarkOptions, setWatermarkOptions] = useState<WatermarkOptions>({
    text: '仅供XXX使用',
    fontSize: 40,
    color: '#FF0000',
    opacity: 0.5,
    position: 'center',
    rotation: -45,
    mode: 'tile', // 默认使用平铺模式
    spacing: 50, // 默认间距 50%（相对于水印宽度）
    offsetX: 0, // 默认水平偏移 0%
    offsetY: 0, // 默认垂直偏移 0%
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 切换折叠面板
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // 应用预设
  const applyPreset = (preset: WatermarkPreset) => {
    setWatermarkOptions(preset.options);
  };

  // 处理文件选择
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查是否是图片文件（包括 HEIC）
    const isImage =
      file.type.startsWith('image/') ||
      file.name.toLowerCase().endsWith('.heic') ||
      file.name.toLowerCase().endsWith('.heif');

    if (isImage) {
      setSelectedFile(file);

      // 对于 HEIC 格式，使用占位符预览
      const isHeic =
        file.name.toLowerCase().endsWith('.heic') ||
        file.name.toLowerCase().endsWith('.heif');

      if (isHeic) {
        setPreviewUrl(''); // HEIC 不能直接预览
        setIsProcessing(true);
      } else {
        setPreviewUrl(URL.createObjectURL(file));
      }

      try {
        const img = await loadImage(file);
        setOriginalImage(img);
        // 为 HEIC 设置预览 URL（转换后的图片）
        if (isHeic) {
          setPreviewUrl(img.src);
        }
        setIsProcessing(false);
      } catch (error) {
        console.error('图片加载失败:', error);
        const errorMsg =
          error instanceof Error ? error.message : '图片加载失败,请重试';
        alert(errorMsg);
        setIsProcessing(false);
        // 重置状态
        setSelectedFile(null);
        setPreviewUrl('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } else {
      alert('请选择有效的图片文件');
    }
  };

  // 当水印选项改变时,自动重新生成水印（添加防抖优化）
  useEffect(() => {
    if (originalImage) {
      // 使用防抖，避免频繁重新生成水印
      const debounceTimer = setTimeout(() => {
        generateWatermark();
      }, 300); // 300ms 防抖延迟

      return () => clearTimeout(debounceTimer);
    }
  }, [watermarkOptions, originalImage]);

  // 生成水印（用于预览，使用 PNG 格式）
  const generateWatermark = async () => {
    if (!originalImage) return;

    setIsProcessing(true);
    try {
      const result = await addWatermark(originalImage, watermarkOptions, {
        format: 'png',
        quality: 1,
      });
      setWatermarkedUrl(result);
    } catch (error) {
      console.error('添加水印失败:', error);
      alert('添加水印失败,请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  // 下载水印图片（使用用户选择的格式）
  const handleDownload = async () => {
    if (!originalImage) return;

    setIsProcessing(true);
    try {
      // 使用用户选择的格式重新生成水印
      const result = await addWatermark(originalImage, watermarkOptions, {
        format: exportFormat,
        quality: exportQuality / 100, // 转换为 0-1
      });

      // 确定文件扩展名
      const originalName = selectedFile?.name || 'image';
      const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
      const extension = exportFormat === 'jpeg' ? 'jpg' : exportFormat;
      const filename = `watermarked_${nameWithoutExt}.${extension}`;

      downloadImage(result, filename);
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载失败,请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  // 重置
  const handleReset = () => {
    setSelectedFile(null);
    setOriginalImage(null);
    setPreviewUrl('');
    setWatermarkedUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 打开图片查看器
  const openImageViewer = (imageUrl: string) => {
    setViewerImageUrl(imageUrl);
    setViewerOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-6 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
            证件水印工具
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
            本地离线运行，隐私安全 • 支持 HEIC 格式 • 实时预览 • 一键下载
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* 左侧 - 上传和配置 */}
          <div className="xl:col-span-1 space-y-5">
            {/* 文件上传 */}
            <div className="bg-white rounded-xl shadow-lg p-5 sm:p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="bg-indigo-100 text-indigo-700 rounded-full w-7 h-7 flex items-center justify-center text-sm mr-2">
                  1
                </span>
                上传证件图片
              </h2>
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/50 transition-all duration-200"
                >
                  <svg
                    className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">点击选择图片</p>
                  <p className="text-xs text-gray-500 mt-1">
                    JPG、PNG、HEIC 等格式
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.heic,.heif"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {selectedFile && (
                  <div className="text-sm text-gray-700 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                    <span className="font-medium text-indigo-900">
                      已选择：
                    </span>
                    <span className="text-gray-600 truncate block mt-1">
                      {selectedFile.name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 水印配置 */}
            <div className="bg-white rounded-xl shadow-lg p-5 sm:p-6 border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="bg-indigo-100 text-indigo-700 rounded-full w-7 h-7 flex items-center justify-center text-sm mr-2">
                  2
                </span>
                配置水印
              </h2>
              <div className="space-y-5">
                {/* 快速预设 */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-100">
                  <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center">
                    <svg
                      className="w-4 h-4 mr-2 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    快速预设
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {WATERMARK_PRESETS.map((preset, index) => (
                      <button
                        key={index}
                        onClick={() => applyPreset(preset)}
                        className="text-left px-3 py-2 rounded-lg border-2 border-indigo-200 hover:border-indigo-400 hover:bg-white transition-all group"
                      >
                        <div className="text-sm font-medium text-gray-900 group-hover:text-indigo-700">
                          {preset.name}
                        </div>
                        <div className="text-xs text-gray-600 mt-0.5">
                          {preset.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 基础设置 - 可折叠 */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('basic')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-sm font-semibold text-gray-800">
                      基础设置
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-600 transition-transform ${
                        expandedSections.basic ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {expandedSections.basic && (
                    <div className="p-4 space-y-4">
                      {/* 水印模式 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          水印模式
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <label
                            className={`flex items-center justify-center cursor-pointer px-4 py-3 rounded-lg border-2 transition-all ${
                              watermarkOptions.mode === 'single'
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="mode"
                              value="single"
                              checked={watermarkOptions.mode === 'single'}
                              onChange={() =>
                                setWatermarkOptions({
                                  ...watermarkOptions,
                                  mode: 'single',
                                })
                              }
                              className="sr-only"
                            />
                            <span className="text-sm font-medium">
                              单个水印
                            </span>
                          </label>
                          <label
                            className={`flex items-center justify-center cursor-pointer px-4 py-3 rounded-lg border-2 transition-all ${
                              watermarkOptions.mode === 'tile'
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="mode"
                              value="tile"
                              checked={watermarkOptions.mode === 'tile'}
                              onChange={() =>
                                setWatermarkOptions({
                                  ...watermarkOptions,
                                  mode: 'tile',
                                })
                              }
                              className="sr-only"
                            />
                            <span className="text-sm font-medium">
                              平铺模式
                            </span>
                          </label>
                        </div>
                      </div>

                      {/* 水印文字 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          水印文字
                        </label>
                        <input
                          type="text"
                          value={watermarkOptions.text}
                          onChange={(e) =>
                            setWatermarkOptions({
                              ...watermarkOptions,
                              text: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                          placeholder="输入水印文字"
                        />
                      </div>

                      {/* 字体大小 */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-gray-700">
                            字体大小
                          </label>
                          <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                            {watermarkOptions.fontSize}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="100"
                          value={watermarkOptions.fontSize}
                          onChange={(e) =>
                            setWatermarkOptions({
                              ...watermarkOptions,
                              fontSize: Number(e.target.value),
                            })
                          }
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>20px</span>
                          <span>100px</span>
                        </div>
                      </div>

                      {/* 颜色 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          水印颜色
                        </label>
                        <div className="space-y-3">
                          {/* 常用颜色预设 */}
                          <div className="flex gap-2">
                            {COLOR_PRESETS.map((preset) => (
                              <button
                                key={preset.value}
                                onClick={() =>
                                  setWatermarkOptions({
                                    ...watermarkOptions,
                                    color: preset.value,
                                  })
                                }
                                className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 ${
                                  watermarkOptions.color === preset.value
                                    ? 'border-indigo-500 shadow-md scale-110'
                                    : 'border-gray-300'
                                }`}
                                style={{ backgroundColor: preset.value }}
                                title={preset.name}
                              />
                            ))}
                          </div>
                          {/* 自定义颜色 */}
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={watermarkOptions.color}
                              onChange={(e) =>
                                setWatermarkOptions({
                                  ...watermarkOptions,
                                  color: e.target.value,
                                })
                              }
                              className="h-10 w-20 rounded-lg border-2 border-gray-300 cursor-pointer"
                            />
                            <span className="text-sm font-mono text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
                              {watermarkOptions.color}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 透明度 */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-gray-700">
                            透明度
                          </label>
                          <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                            {Math.round(watermarkOptions.opacity * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={watermarkOptions.opacity}
                          onChange={(e) =>
                            setWatermarkOptions({
                              ...watermarkOptions,
                              opacity: Number(e.target.value),
                            })
                          }
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>透明</span>
                          <span>不透明</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 高级设置 - 可折叠 */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('advanced')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-sm font-semibold text-gray-800">
                      高级设置
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-600 transition-transform ${
                        expandedSections.advanced ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {expandedSections.advanced && (
                    <div className="p-4 space-y-4">
                      {/* 位置 - 仅单个水印模式显示 */}
                      {watermarkOptions.mode === 'single' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            水印位置
                          </label>
                          <select
                            value={watermarkOptions.position}
                            onChange={(e) =>
                              setWatermarkOptions({
                                ...watermarkOptions,
                                position: e.target
                                  .value as WatermarkOptions['position'],
                              })
                            }
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow bg-white"
                          >
                            <option value="center">居中</option>
                            <option value="top-left">左上角</option>
                            <option value="top-right">右上角</option>
                            <option value="bottom-left">左下角</option>
                            <option value="bottom-right">右下角</option>
                          </select>
                        </div>
                      )}

                      {/* 旋转角度 */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-gray-700">
                            旋转角度
                          </label>
                          <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                            {watermarkOptions.rotation}°
                          </span>
                        </div>
                        <input
                          type="range"
                          min="-180"
                          max="180"
                          value={watermarkOptions.rotation}
                          onChange={(e) =>
                            setWatermarkOptions({
                              ...watermarkOptions,
                              rotation: Number(e.target.value),
                            })
                          }
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>-180°</span>
                          <span>0°</span>
                          <span>180°</span>
                        </div>
                      </div>

                      {/* 水印间距 - 仅平铺模式显示 */}
                      {watermarkOptions.mode === 'tile' && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700">
                              水印间距
                            </label>
                            <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                              {watermarkOptions.spacing}%{' '}
                              <span className="text-xs">
                                (
                                {watermarkOptions.spacing < 30
                                  ? '密集'
                                  : watermarkOptions.spacing < 100
                                  ? '适中'
                                  : '稀疏'}
                                )
                              </span>
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="300"
                            step="5"
                            value={watermarkOptions.spacing}
                            onChange={(e) =>
                              setWatermarkOptions({
                                ...watermarkOptions,
                                spacing: Number(e.target.value),
                              })
                            }
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>密集</span>
                            <span>适中</span>
                            <span>稀疏</span>
                          </div>
                        </div>
                      )}

                      {/* 水平偏移 */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-gray-700">
                            水平偏移
                          </label>
                          <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                            {watermarkOptions.offsetX > 0 ? '+' : ''}
                            {watermarkOptions.offsetX}%{' '}
                            <span className="text-xs">
                              (
                              {watermarkOptions.offsetX === 0
                                ? '居中'
                                : watermarkOptions.offsetX > 0
                                ? '向右'
                                : '向左'}
                              )
                            </span>
                          </span>
                        </div>
                        <input
                          type="range"
                          min="-50"
                          max="50"
                          step="1"
                          value={watermarkOptions.offsetX}
                          onChange={(e) =>
                            setWatermarkOptions({
                              ...watermarkOptions,
                              offsetX: Number(e.target.value),
                            })
                          }
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>← 左</span>
                          <span>居中</span>
                          <span>右 →</span>
                        </div>
                      </div>

                      {/* 垂直偏移 */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-gray-700">
                            垂直偏移
                          </label>
                          <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                            {watermarkOptions.offsetY > 0 ? '+' : ''}
                            {watermarkOptions.offsetY}%{' '}
                            <span className="text-xs">
                              (
                              {watermarkOptions.offsetY === 0
                                ? '居中'
                                : watermarkOptions.offsetY > 0
                                ? '向下'
                                : '向上'}
                              )
                            </span>
                          </span>
                        </div>
                        <input
                          type="range"
                          min="-50"
                          max="50"
                          step="1"
                          value={watermarkOptions.offsetY}
                          onChange={(e) =>
                            setWatermarkOptions({
                              ...watermarkOptions,
                              offsetY: Number(e.target.value),
                            })
                          }
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>↑ 上</span>
                          <span>居中</span>
                          <span>下 ↓</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 右侧 - 预览 */}
          <div className="xl:col-span-2 space-y-5 xl:sticky xl:top-6 xl:self-start xl:max-h-[calc(100vh-3rem)] xl:overflow-y-auto">
            {/* 水印预览（主要显示） */}
            {watermarkedUrl ? (
              <div className="bg-white rounded-xl shadow-lg p-5 sm:p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                    <span className="bg-green-100 text-green-700 rounded-full w-7 h-7 flex items-center justify-center text-sm mr-2">
                      ✓
                    </span>
                    {showWatermark ? '水印预览' : '原图预览'}
                  </h2>
                  <div className="flex items-center gap-2">
                    {/* 切换开关 */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-medium transition-colors ${
                          !showWatermark ? 'text-indigo-600' : 'text-gray-400'
                        }`}
                      >
                        原图
                      </span>
                      <button
                        onClick={() => setShowWatermark(!showWatermark)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                          showWatermark ? 'bg-indigo-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm ${
                            showWatermark ? 'translate-x-[1.125rem]' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                      <span
                        className={`text-xs font-medium transition-colors ${
                          showWatermark ? 'text-indigo-600' : 'text-gray-400'
                        }`}
                      >
                        水印
                      </span>
                    </div>
                    {isProcessing && (
                      <span className="text-xs text-indigo-600 flex items-center">
                        <svg
                          className="animate-spin h-3 w-3 mr-1"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        处理中...
                      </span>
                    )}
                  </div>
                </div>
                <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50 mb-4 relative group">
                  {isProcessing ? (
                    <div className="flex items-center justify-center h-96">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                    </div>
                  ) : (
                    <div className="relative cursor-pointer" onClick={() =>
                          openImageViewer(
                            showWatermark ? watermarkedUrl : previewUrl
                          )
                        }>
                      <img
                        src={showWatermark ? watermarkedUrl : previewUrl}
                        alt={showWatermark ? '添加水印后' : '原图'}
                        className="w-full h-auto"
                      />
                      {/* 悬停提示 */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                        <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm font-medium backdrop-blur-sm flex items-center gap-2">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                            />
                          </svg>
                          点击查看大图
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 导出设置 - 仅在水印模式下显示 */}
                {showWatermark && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      导出设置
                    </h3>

                    {/* 格式选择 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        图片格式
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <label
                          className={`flex items-center justify-center cursor-pointer px-3 py-2 rounded-lg border-2 transition-all ${
                            exportFormat === 'png'
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="format"
                            value="png"
                            checked={exportFormat === 'png'}
                            onChange={() => setExportFormat('png')}
                            className="sr-only"
                          />
                          <span className="text-sm font-medium">PNG</span>
                        </label>
                        <label
                          className={`flex items-center justify-center cursor-pointer px-3 py-2 rounded-lg border-2 transition-all ${
                            exportFormat === 'jpeg'
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="format"
                            value="jpeg"
                            checked={exportFormat === 'jpeg'}
                            onChange={() => setExportFormat('jpeg')}
                            className="sr-only"
                          />
                          <span className="text-sm font-medium">JPEG</span>
                        </label>
                        <label
                          className={`flex items-center justify-center cursor-pointer px-3 py-2 rounded-lg border-2 transition-all ${
                            exportFormat === 'webp'
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="format"
                            value="webp"
                            checked={exportFormat === 'webp'}
                            onChange={() => setExportFormat('webp')}
                            className="sr-only"
                          />
                          <span className="text-sm font-medium">WebP</span>
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {exportFormat === 'png' &&
                          'PNG 格式无损压缩，文件较大，支持透明度'}
                        {exportFormat === 'jpeg' &&
                          'JPEG 格式有损压缩，文件较小，不支持透明度'}
                        {exportFormat === 'webp' &&
                          'WebP 格式现代格式，文件小质量高，部分旧浏览器不支持'}
                      </p>
                    </div>

                    {/* 质量设置 - 仅 JPEG 和 WebP 显示 */}
                    {(exportFormat === 'jpeg' || exportFormat === 'webp') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          图片质量: {exportQuality}%
                          <span className="text-xs text-gray-500 ml-2">
                            (
                            {exportQuality < 70
                              ? '低'
                              : exportQuality < 90
                              ? '中'
                              : '高'}
                            )
                          </span>
                        </label>
                        <input
                          type="range"
                          min="50"
                          max="100"
                          step="1"
                          value={exportQuality}
                          onChange={(e) =>
                            setExportQuality(Number(e.target.value))
                          }
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>低质量</span>
                          <span>高质量</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 原图模式提示 */}
                {!showWatermark && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start">
                      <svg
                        className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">当前为原图预览模式</p>
                        <p className="text-xs text-blue-700">
                          切换到水印模式即可下载带水印的图片
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleDownload}
                    disabled={!showWatermark || !watermarkedUrl || isProcessing}
                    className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all font-medium shadow-sm hover:shadow-md flex items-center justify-center"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    下载图片
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex-1 sm:flex-none bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-all font-medium"
                  >
                    重新选择
                  </button>
                </div>
              </div>
            ) : previewUrl || (selectedFile && !previewUrl) ? (
              <div className="bg-white rounded-xl shadow-lg p-5 sm:p-6 border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="bg-blue-100 text-blue-700 rounded-full w-7 h-7 flex items-center justify-center text-sm mr-2">
                    3
                  </span>
                  原图预览
                </h2>
                <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50 relative group">
                  {previewUrl ? (
                    <div className="relative cursor-pointer" onClick={() => openImageViewer(previewUrl)}>
                      <img
                        src={previewUrl}
                        alt="原图"
                        className="w-full h-auto"
                      />
                      {/* 悬停提示 */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                        <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm font-medium backdrop-blur-sm flex items-center gap-2">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                            />
                          </svg>
                          点击查看大图
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-96">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
                      <p className="text-sm text-gray-600">
                        正在转换 HEIC 格式...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* 提示信息 */}
            {!selectedFile && (
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-lg p-6 sm:p-8 border border-indigo-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg
                    className="w-6 h-6 text-indigo-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  使用说明
                </h3>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-medium mr-3">
                      1
                    </span>
                    <span>点击左侧上传区域选择证件图片</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-medium mr-3">
                      2
                    </span>
                    <span>根据需要调整水印参数（支持单个和平铺模式）</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-medium mr-3">
                      3
                    </span>
                    <span>实时预览水印效果，调整密度和旋转角度</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-medium mr-3">
                      4
                    </span>
                    <span>满意后点击下载按钮保存带水印的图片</span>
                  </li>
                  <li className="flex items-start p-3 bg-white/60 rounded-lg mt-3">
                    <svg
                      className="flex-shrink-0 w-5 h-5 text-green-600 mr-2 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    <span className="font-medium text-indigo-900">
                      所有操作均在本地浏览器完成，图片不会上传到服务器，隐私安全有保障
                    </span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* 页脚 */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center px-6 py-3 bg-white/70 backdrop-blur-sm rounded-full shadow-sm border border-gray-200">
            <svg
              className="w-5 h-5 text-indigo-600 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span className="text-sm text-gray-700 font-medium">
              本地离线水印工具 • 隐私安全有保障
            </span>
          </div>
        </div>
      </div>

      {/* 图片查看器 */}
      {viewerOpen && (
        <ImageViewer
          imageUrl={viewerImageUrl}
          altText={showWatermark ? '水印预览' : '原图预览'}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
