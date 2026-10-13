import {
  CaseFile,
  ColorGradingConfig,
  EventConnection,
  ProjectFolder,
  SaveState,
  TerminalTheme,
} from '../types';
import { ProjectPageData, DEFAULT_GRID, newProjectPage, normalizePage } from './projectPages';
import { ExportedImageAsset } from '../services/imageAssets';

export const WORKSPACE_BACKUP_FORMAT = 'sepulchral-nx-mindweaver-workspace';
export const WORKSPACE_BACKUP_VERSION = 3;

export interface MindweaverWorkspaceBackup {
  format: typeof WORKSPACE_BACKUP_FORMAT;
  version: typeof WORKSPACE_BACKUP_VERSION;
  exportedAt: string;
  data: {
    activePage: number;
    pages: ProjectPageData[];
    imageAssets: ExportedImageAsset[];
  };
}

export interface LegacyWorkspaceBackup {
  format: typeof WORKSPACE_BACKUP_FORMAT;
  version: 1;
  exportedAt: string;
  data: {
    caseFile: CaseFile;
    saveStates: SaveState[];
    folders: ProjectFolder[];
    theme: TerminalTheme;
    colorConfig: ColorGradingConfig;
    wheelZoomEnabled: boolean;
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const isCaseFile = (value: unknown): value is CaseFile => {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string'
    && typeof value.caseNumber === 'string'
    && typeof value.title === 'string'
    && Array.isArray(value.events)
    && Array.isArray(value.connections);
};

const normalizeCaseFile = (caseFile: CaseFile): CaseFile => ({
  ...caseFile,
  timeTags: Array.isArray(caseFile.timeTags) ? caseFile.timeTags : [],
  connections: caseFile.connections.map((connection: EventConnection) => {
    const legacyConnection = connection as EventConnection & { style?: string };
    return {
      ...connection,
      evidenceType: connection.evidenceType
        || (legacyConnection.style === 'dashed' ? 'proposed' : 'documented'),
    };
  }),
});

export const createWorkspaceBackup = (
  data: MindweaverWorkspaceBackup['data'],
): MindweaverWorkspaceBackup => ({
  format: WORKSPACE_BACKUP_FORMAT,
  version: WORKSPACE_BACKUP_VERSION,
  exportedAt: new Date().toISOString(),
  data,
});

export const parseWorkspaceBackup = (content: string): MindweaverWorkspaceBackup => {
  const parsed: unknown = JSON.parse(content);
  if (!isRecord(parsed)
    || parsed.format !== WORKSPACE_BACKUP_FORMAT
    || (parsed.version !== 1 && parsed.version !== 2 && parsed.version !== WORKSPACE_BACKUP_VERSION)
    || !isRecord(parsed.data)) {
    throw new Error('This is not a supported Mindweaver workspace backup.');
  }

  const data = parsed.data;
  if (parsed.version === 2 || parsed.version === 3) {
    if (!Array.isArray(data.pages) || data.pages.length !== 10
      || !Number.isInteger(data.activePage) || (data.activePage as number) < 0 || (data.activePage as number) > 9
      || !data.pages.every((page: unknown) => isRecord(page) && isCaseFile(page.caseFile)
        && Array.isArray(page.saveStates) && page.saveStates.every((slot: unknown) => isRecord(slot) && isCaseFile(slot.caseFile))
        && Array.isArray(page.folders) && isRecord(page.colorConfig) && isRecord(page.gridConfig)
        && typeof page.wheelZoomEnabled === 'boolean')) {
      throw new Error('The Mindweaver workspace backup is incomplete or damaged.');
    }
    if (parsed.version === 3 && !Array.isArray(data.imageAssets)) {
      throw new Error('The Mindweaver workspace backup is missing its image attachments.');
    }
    if (parsed.version === 3) {
      const pages = data.pages as ProjectPageData[];
      const imageIds = new Set((data.imageAssets as ExportedImageAsset[]).map(asset => asset?.id));
      const requiredIds = pages.flatMap(page => [page.caseFile, ...page.saveStates.map(slot => slot.caseFile)])
        .flatMap(file => file.events.map(event => event.imageId).filter((id): id is string => Boolean(id)));
      if (requiredIds.some(id => !imageIds.has(id))) {
        throw new Error('The Mindweaver workspace backup is missing a node image.');
      }
    }
    return {
      format: WORKSPACE_BACKUP_FORMAT, version: WORKSPACE_BACKUP_VERSION,
      exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : '',
      data: {activePage: data.activePage as number, pages: (data.pages as ProjectPageData[]).map(normalizePage), imageAssets: parsed.version === 3 ? data.imageAssets as ExportedImageAsset[] : []},
    };
  }

  if (!isCaseFile(data.caseFile)
    || !Array.isArray(data.saveStates)
    || !data.saveStates.every((slot) => isRecord(slot) && isCaseFile(slot.caseFile))
    || !Array.isArray(data.folders)
    || typeof data.theme !== 'string'
    || !isRecord(data.colorConfig)
    || typeof data.wheelZoomEnabled !== 'boolean') {
    throw new Error('The Mindweaver workspace backup is incomplete or damaged.');
  }

  const pages = Array.from({length: 10}, (_, index) => newProjectPage(index));
  pages[0] = normalizePage({
    caseFile: normalizeCaseFile(data.caseFile),
    saveStates: data.saveStates.map((slot) => ({
      ...(slot as unknown as SaveState),
      caseFile: normalizeCaseFile(slot.caseFile as CaseFile),
    })),
    folders: data.folders as ProjectFolder[],
    colorConfig: data.colorConfig as unknown as ColorGradingConfig,
    gridConfig: {...DEFAULT_GRID},
    wheelZoomEnabled: data.wheelZoomEnabled,
  });
  return {
    format: WORKSPACE_BACKUP_FORMAT,
    version: WORKSPACE_BACKUP_VERSION,
    exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : '',
    data: {activePage: 0, pages, imageAssets: []},
  };
};
