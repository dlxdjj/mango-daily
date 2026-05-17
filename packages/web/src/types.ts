export interface MangoReference {
  id: string;
  filePath: string;
  url: string;
  isPrimary: boolean;
  description: string;
  createdAt: string;
}

export interface Recommendation {
  id: string;
  topic: string;
  contentGoal: string;
  recommendedColumn: string;
  titles: string[];
  coverTexts: string[];
  body: string;
  commentGuide: string;
  hashtags: string[];
  imageScene: string;
  imagePrompt: string;
  generatedImageUrl: string | null;
  referenceId: string | null;
  postingTime: string;
  whyThisWorks: string;
  sourceAnalysis: string;
  llmProvider: string;
  imageProvider: string | null;
  imageError: string;
  createdAt: string;
}

export const COLUMNS = [
  '芒狗诞生录',
  '芒狗打工日记',
  '芒狗好运签',
  '芒狗表情包',
  '芒狗人间体计划',
  '芒狗今日状态',
  '芒狗低电量日常'
];

export const CONTENT_GOALS = [
  '人设建设',
  '涨粉',
  '收藏',
  '评论',
  '转发'
];
