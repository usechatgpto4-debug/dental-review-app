export type SlotType = 'top' | 'center' | 'left' | 'right' | 'bottom';

export interface SlotConfig {
  label: string;
  labelTh: string;
  aspectRatio: number; // width / height
  width: number;
  height: number;
}

export const SLOT_CONFIGS: Record<SlotType, SlotConfig> = {
  top: {
    label: 'Top (Upper Occlusal)',
    labelTh: 'บน',
    aspectRatio: 4 / 3,
    width: 400,
    height: 300,
  },
  left: {
    label: 'Left (Lateral)',
    labelTh: 'ซ้าย',
    aspectRatio: 4 / 3,
    width: 400,
    height: 300,
  },
  center: {
    label: 'Center (Frontal)',
    labelTh: 'กลาง',
    aspectRatio: 4 / 3,
    width: 400,
    height: 300,
  },
  right: {
    label: 'Right (Lateral)',
    labelTh: 'ขวา',
    aspectRatio: 4 / 3,
    width: 400,
    height: 300,
  },
  bottom: {
    label: 'Bottom (Lower Occlusal)',
    labelTh: 'ล่าง',
    aspectRatio: 4 / 3,
    width: 400,
    height: 300,
  },
};

export const SLOT_ORDER: SlotType[] = ['top', 'left', 'center', 'right', 'bottom'];

export interface PageSize {
  label: string;
  width: number;  // mm
  height: number; // mm
}

export const PAGE_SIZES: Record<string, PageSize> = {
  'a4-portrait': { label: 'A4 Portrait', width: 210, height: 297 },
  'a4-landscape': { label: 'A4 Landscape', width: 297, height: 210 },
  'a3-portrait': { label: 'A3 Portrait', width: 297, height: 420 },
  'a3-landscape': { label: 'A3 Landscape', width: 420, height: 297 },
  'letter-portrait': { label: 'Letter Portrait', width: 216, height: 279 },
  'letter-landscape': { label: 'Letter Landscape', width: 279, height: 216 },
};

export const DEFAULT_PAGE_SIZE = 'a4-portrait';
