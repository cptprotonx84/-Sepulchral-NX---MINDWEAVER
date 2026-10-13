import { CaseFile, ColorGradingConfig, GridConfig, ProjectFolder, SaveState, TerminalTheme } from '../types';
import { BLANK_CASE, PRESET_CASE_SYNDICATE } from '../data/presetCases';

export const PROJECT_THEMES: TerminalTheme[] = [
  'nightfly', 'mire', 'nephila', 'sepulchre', 'sepulchral_nx',
  'ghostline', 'ember', 'deepfield', 'afterglow', 'verdigris',
];
export const PAGES_STORAGE_KEY = 'sepulchral_nx_project_pages_v1';
export const ACTIVE_PAGE_STORAGE_KEY = 'sepulchral_nx_active_project_page_v1';

export interface ProjectPageData {
  caseFile: CaseFile;
  saveStates: SaveState[];
  folders: ProjectFolder[];
  colorConfig: ColorGradingConfig;
  gridConfig: GridConfig;
  wheelZoomEnabled: boolean;
}

export const DEFAULT_GRID: GridConfig = {
  columns: 10, rows: 6, snapToGrid: true,
  showGridLines: true, showCoordinates: true, opacity: 0.4,
};
export const DEFAULT_COLOR: ColorGradingConfig = {
  crtScanlines: true, chromaticAberration: true, vignette: true,
  noiseLevel: 15, bloomIntensity: 65, bloomColor: 'auto',
  bloomPulse: true, blockBorderStyle: 'cyber',
};

export function newProjectPage(index: number): ProjectPageData {
  return {
    caseFile: index === 0 ? structuredClone(PRESET_CASE_SYNDICATE) : {
      ...structuredClone(BLANK_CASE),
      id: `project_page_${index + 1}`,
      title: `UNTITLED PROJECT ${String(index + 1).padStart(2, '0')}`,
      caseNumber: `NX-PROJECT #${String(index + 1).padStart(2, '0')}`,
    },
    saveStates: [], folders: [], colorConfig: {...DEFAULT_COLOR},
    gridConfig: {...DEFAULT_GRID}, wheelZoomEnabled: true,
  };
}

function legacyValue<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved === null ? fallback : JSON.parse(saved) as T;
  } catch { return fallback; }
}

export function normalizePage(page: ProjectPageData): ProjectPageData {
  return {
    ...page,
    caseFile: {
      ...page.caseFile,
      timeTags: Array.isArray(page.caseFile.timeTags) ? page.caseFile.timeTags : [],
      connections: page.caseFile.connections.map((connection: any) => ({
        ...connection,
        evidenceType: connection.evidenceType || (connection.style === 'dashed' ? 'proposed' : 'documented'),
      })),
    },
  };
}

export function loadProjectPages(): ProjectPageData[] {
  try {
    const saved = localStorage.getItem(PAGES_STORAGE_KEY);
    if (saved) {
      const pages = JSON.parse(saved) as ProjectPageData[];
      if (Array.isArray(pages) && pages.length === 10 && pages.every(page => page?.caseFile && Array.isArray(page.caseFile.events))) {
        return pages.map(normalizePage);
      }
    }
  } catch { /* Keep legacy storage untouched if page data cannot be read. */ }

  const pages = PROJECT_THEMES.map((_, index) => newProjectPage(index));
  pages[0] = normalizePage({
    caseFile: legacyValue('sepulchral_nx_case_data_v3', structuredClone(PRESET_CASE_SYNDICATE)),
    saveStates: legacyValue('sepulchral_nx_save_states_v1', [{
      id: 'save_slot_1_init', name: 'Operation Nightfall - Baseline', slotNumber: 1,
      timestamp: '2026-09-24 10:00:00 UTC', caseFile: structuredClone(PRESET_CASE_SYNDICATE),
      thumbnailSummary: 'Initial syndicate investigation snapshot',
    }]),
    folders: legacyValue('sepulchral_nx_project_folders_v1', []),
    colorConfig: legacyValue('sepulchral_nx_color_config_v1', {...DEFAULT_COLOR}),
    gridConfig: {...DEFAULT_GRID},
    wheelZoomEnabled: legacyValue('sepulchral_nx_wheel_zoom_v1', true),
  });
  localStorage.setItem(PAGES_STORAGE_KEY, JSON.stringify(pages));
  return pages;
}

export function loadActivePageIndex(): number {
  const index = Number(localStorage.getItem(ACTIVE_PAGE_STORAGE_KEY) ?? 0);
  return Number.isInteger(index) && index >= 0 && index < 10 ? index : 0;
}

export function saveProjectPages(pages: ProjectPageData[]): void {
  localStorage.setItem(PAGES_STORAGE_KEY, JSON.stringify(pages));
}
