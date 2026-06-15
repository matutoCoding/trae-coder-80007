import type { Fiber, SizingAgent, Recipe, Batch, RatioConfig } from '@/types';
import { uid } from '@/utils/calculator';

export const seedFibers: Fiber[] = [
  {
    id: 'fiber-1', name: '青檀皮', avgLength_mm: 3.2, minBeating_SR: 30, maxBeating_SR: 55,
    origin: '安徽泾县', unitPrice: 120, note: '宣纸核心原料，纤维细长强韧',
    createdAt: '2025-01-12',
  },
  {
    id: 'fiber-2', name: '沙田稻草', avgLength_mm: 1.1, minBeating_SR: 35, maxBeating_SR: 60,
    origin: '安徽宣城', unitPrice: 38, note: '配合檀皮用，增强匀度与吸墨',
    createdAt: '2025-01-12',
  },
  {
    id: 'fiber-3', name: '楮皮(构皮)', avgLength_mm: 2.8, minBeating_SR: 28, maxBeating_SR: 50,
    origin: '浙江温州', unitPrice: 88, note: '皮纸原料，绵韧耐折叠',
    createdAt: '2025-01-18',
  },
  {
    id: 'fiber-4', name: '毛竹浆', avgLength_mm: 1.8, minBeating_SR: 40, maxBeating_SR: 65,
    origin: '福建武夷山', unitPrice: 52, note: '机制毛竹浆，用于仿毛边纸',
    createdAt: '2025-02-03',
  },
  {
    id: 'fiber-5', name: '桑皮', avgLength_mm: 3.5, minBeating_SR: 25, maxBeating_SR: 45,
    origin: '四川夹江', unitPrice: 95, note: '高级书画纸原料，纤维超长',
    createdAt: '2025-02-20',
  },
  {
    id: 'fiber-6', name: '麻纤维(苎麻)', avgLength_mm: 5.2, minBeating_SR: 20, maxBeating_SR: 40,
    origin: '湖南益阳', unitPrice: 150, note: '长纤高强韧，用于古籍修复纸',
    createdAt: '2025-03-05',
  },
];

export const seedSizingAgents: SizingAgent[] = [
  {
    id: 'sz-1', name: '黄蜀葵根', source: '植物粘液', minDose_pct: 0.4, maxDose_pct: 1.0, suspensionLevel: 4,
    note: '最常用纸药，悬浮效果好，安徽泾县传统',
    createdAt: '2025-01-12',
  },
  {
    id: 'sz-2', name: '仙人掌汁', source: '植物粘液', minDose_pct: 0.6, maxDose_pct: 1.5, suspensionLevel: 3,
    note: '南方常用，揭纸顺滑',
    createdAt: '2025-01-12',
  },
  {
    id: 'sz-3', name: '杨桃藤汁', source: '植物粘液', minDose_pct: 0.3, maxDose_pct: 0.9, suspensionLevel: 5,
    note: '陕西凤翔等地使用，悬浮极佳',
    createdAt: '2025-02-10',
  },
  {
    id: 'sz-4', name: '梧桐子汁', source: '植物粘液', minDose_pct: 0.5, maxDose_pct: 1.2, suspensionLevel: 3,
    note: '江浙一带配方，成纸细腻',
    createdAt: '2025-03-01',
  },
];

const now = Date.now();
const dt = (d: number) => new Date(now - d * 864e5).toISOString().slice(0, 10);

export const defaultRatioConfig: RatioConfig = {
  paperType: '净皮宣纸',
  targetGrammage: 60,
  targetWidth_mm: 690,
  targetHeight_mm: 1380,
  targetThickness_um: 85,
  paperUse: '书画',
  fiberMixture: [
    { fiberId: 'fiber-1', ratio_pct: 70 },
    { fiberId: 'fiber-2', ratio_pct: 30 },
  ],
  sizingAgentId: 'sz-1',
  sizingDose_pct: 0.7,
  beatingDegree_SR: 42,
  lossRate_pct: 8,
  waterVolume_L: 35,
  perSwingVolume_mL: 500,
  pressPressure_kg: 35,
  pressDuration_min: 20,
  dryingTemp_C: 26,
};

const recipe1Config: RatioConfig = {
  ...defaultRatioConfig,
  paperType: '净皮宣纸',
  targetGrammage: 60,
  targetWidth_mm: 690, targetHeight_mm: 1380, targetThickness_um: 85,
  paperUse: '书画',
  fiberMixture: [{ fiberId: 'fiber-1', ratio_pct: 70 }, { fiberId: 'fiber-2', ratio_pct: 30 }],
  sizingAgentId: 'sz-1', sizingDose_pct: 0.7, beatingDegree_SR: 42,
};
const recipe2Config: RatioConfig = {
  ...defaultRatioConfig,
  paperType: '楮皮纸',
  targetGrammage: 45,
  targetWidth_mm: 600, targetHeight_mm: 900, targetThickness_um: 65,
  paperUse: '古籍印刷',
  fiberMixture: [{ fiberId: 'fiber-3', ratio_pct: 80 }, { fiberId: 'fiber-2', ratio_pct: 20 }],
  sizingAgentId: 'sz-3', sizingDose_pct: 0.6, beatingDegree_SR: 38,
};
const recipe3Config: RatioConfig = {
  ...defaultRatioConfig,
  paperType: '桑皮纸',
  targetGrammage: 85,
  targetWidth_mm: 690, targetHeight_mm: 1380, targetThickness_um: 120,
  paperUse: '书画',
  fiberMixture: [{ fiberId: 'fiber-5', ratio_pct: 85 }, { fiberId: 'fiber-2', ratio_pct: 15 }],
  sizingAgentId: 'sz-1', sizingDose_pct: 0.8, beatingDegree_SR: 35,
};
const recipe4Config: RatioConfig = {
  ...defaultRatioConfig,
  paperType: '毛边纸',
  targetGrammage: 35,
  targetWidth_mm: 420, targetHeight_mm: 560, targetThickness_um: 55,
  paperUse: '书画',
  fiberMixture: [{ fiberId: 'fiber-4', ratio_pct: 90 }, { fiberId: 'fiber-2', ratio_pct: 10 }],
  sizingAgentId: 'sz-4', sizingDose_pct: 0.65, beatingDegree_SR: 50,
};

export const seedRecipes: Recipe[] = [
  {
    id: 'recipe-1', name: '四尺净皮书画宣', category: '书画纸',
    paperType: '净皮宣纸',
    tags: ['经典', '书画', '宣纸'], createdAt: dt(30),
    note: '泾县传统配方，檀皮稻草搭配，适合书法与写意',
    lastUsedAt: dt(3),
    versions: [
      {
        id: 'v1', version: 'v1.0', config: recipe1Config,
        note: '初始版本', createdAt: dt(30),
      },
    ],
    recommendedVersionId: 'v1',
    config: recipe1Config,
  },
  {
    id: 'recipe-2', name: '绵料古籍印刷纸', category: '印刷纸',
    paperType: '楮皮纸',
    tags: ['古籍', '雕版', '收藏'], createdAt: dt(20),
    note: '楮皮为主，适合木版水印与线装书',
    lastUsedAt: dt(1),
    versions: [
      { id: 'v2', version: 'v1.0', config: recipe2Config,
        note: '初始版本', createdAt: dt(20) },
    ],
    recommendedVersionId: 'v2',
    config: recipe2Config,
  },
  {
    id: 'recipe-3', name: '桑皮重彩工笔画纸', category: '书画纸',
    paperType: '桑皮纸',
    tags: ['重彩', '工笔', '高档'], createdAt: dt(10),
    note: '超长桑皮纤维，耐反复渲染',
    versions: [
      { id: 'v3', version: 'v1.0', config: recipe3Config,
        note: '初始版本', createdAt: dt(10) },
    ],
    recommendedVersionId: 'v3',
    config: recipe3Config,
  },
  {
    id: 'recipe-4', name: '毛竹仿毛边纸', category: '文房日常',
    paperType: '毛边纸',
    tags: ['练习', '毛边', '竹纸'], createdAt: dt(5),
    note: '竹浆为主，适合日常练习与书信',
    versions: [
      { id: 'v4', version: 'v1.0', config: recipe4Config,
        note: '初始版本', createdAt: dt(5) },
    ],
    recommendedVersionId: 'v4',
    config: recipe4Config,
  },
];

export const defaultPapermakingRecord = {
  actualSwingCount: 0,
  feelLevel: '良好' as const,
  feelNote: '',
  stirCount: 0,
  releaseSituation: '顺畅' as const,
  releaseNote: '',
  pressNote: '',
  dryingNote: '',
  startTime: '',
  endTime: '',
};

export const seedBatches: Batch[] = [
  {
    id: uid(), batchNo: 'XZ-20260610-01', recipeId: 'recipe-1', recipeSnapshot: seedRecipes[0],
    date: dt(6),
    configSnapshot: seedRecipes[0].config,
    thicknessGrid: [62, 58, 60, 59, 61, 60, 57, 62, 65],
    gridSize: 3,
    tolerance_pct: 8,
    targetGrammage: 60,
    actualAvgGrammage: 60.44,
    actualThickness_um: 86,
    uniformityCV_pct: 3.85,
    maxDeviation_pct: 8.33,
    qualityLevel: '良',
    uniformityLevel: '优',
    issues: [],
    warnings: ['下右区略偏厚 +8.3%，超出 ±8% 公差，请注意荡料手势'],
    operator: '李师傅', note: '第四批抄造，檀皮原料好，整体稳定',
    createdAt: dt(6),
    targetSwingCount: 45,
    papermakingRecord: {
      actualSwingCount: 48,
      feelLevel: '良好',
      feelNote: '手感流畅，浆悬浮好',
      stirCount: 25,
      releaseSituation: '顺畅',
      releaseNote: '湿揭完整，帘纹清晰',
      pressNote: '常规压榨20分钟',
      dryingNote: '自然阴干24小时',
      startTime: '08:30',
      endTime: '09:15',
    },
  },
  {
    id: uid(), batchNo: 'XZ-20260612-02', recipeId: 'recipe-3', recipeSnapshot: seedRecipes[2],
    date: dt(4),
    configSnapshot: seedRecipes[2].config,
    thicknessGrid: [88, 82, 95, 80, 86, 90, 75, 84, 98],
    gridSize: 3,
    tolerance_pct: 8,
    targetGrammage: 85,
    actualAvgGrammage: 86.44,
    actualThickness_um: 122,
    uniformityCV_pct: 8.42,
    maxDeviation_pct: 15.29,
    qualityLevel: '合格',
    uniformityLevel: '良',
    issues: ['云絮/絮聚', '揭纸破损风险'],
    warnings: [
      '检测到 3 处偏厚云絮区：上右、中右、下右，可能是纸浆絮聚或荡料时浆团沉积所致，建议打散浆团后再抄。',
      '薄区 下左 偏薄明显，帘面受力不均或料浆不足，建议补浆并平稳荡帘。',
    ],
    operator: '张师傅', note: '桑皮打浆时间略短，絮聚问题下次调整',
    createdAt: dt(4),
    targetSwingCount: 62,
    papermakingRecord: {
      actualSwingCount: 65,
      feelLevel: '一般',
      feelNote: '浆稍稠，荡料有阻力',
      stirCount: 18,
      releaseSituation: '微阻',
      releaseNote: '下左区有轻微黏连，略有破损',
      pressNote: '加压至40kg',
      dryingNote: '烘房35度12小时',
      startTime: '10:15',
      endTime: '11:20',
    },
  },
  {
    id: uid(), batchNo: 'XZ-20260615-03', recipeId: 'recipe-2', recipeSnapshot: seedRecipes[1],
    date: dt(1),
    configSnapshot: seedRecipes[1].config,
    thicknessGrid: [44, 45, 43, 45, 46, 45, 43, 44, 45],
    gridSize: 3,
    tolerance_pct: 8,
    targetGrammage: 45,
    actualAvgGrammage: 44.44,
    actualThickness_um: 64,
    uniformityCV_pct: 2.15,
    maxDeviation_pct: 2.22,
    qualityLevel: '优',
    uniformityLevel: '优',
    issues: [],
    warnings: [],
    operator: '王师傅', note: '楮皮配方完美，可推广为标准工艺',
    createdAt: dt(1),
    targetSwingCount: 38,
    papermakingRecord: {
      actualSwingCount: 38,
      feelLevel: '极佳',
      feelNote: '悬浮极佳，荡料如行云流水',
      stirCount: 30,
      releaseSituation: '顺畅',
      releaseNote: '整张揭下，边缘完整',
      pressNote: '30kg轻压15分钟',
      dryingNote: '阴干18小时',
      startTime: '09:00',
      endTime: '09:40',
    },
  },
];
