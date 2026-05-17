// 节奏日历：根据日期返回今天的"内容倾向"提示

const WEEKDAY_HINTS = [
  'emo / 明天又要上班 / 周日预警',                   // 周日 = 0
  '启动失败 / 低电量 / 不想上班 / 周一综合症',       // 周一
  '续命 / 加班 / 还要撑一周',                        // 周二
  '喘息 / 已经撑过一半 / 周三低电量',                // 周三
  '还差一天 / 摆烂预热',                             // 周四
  '解放 / 好运签 / 周末计划 / 周五终于',             // 周五
  '周末治愈 / 慢生活 / 充电'                         // 周六
];

export interface CalendarHint {
  date: string;       // YYYY-MM-DD
  weekday: string;    // 中文星期
  weekdayHint: string;
  monthHint?: string;
}

export function getCalendarHint(today: Date = new Date()): CalendarHint {
  const weekdayIdx = today.getDay();
  const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const dayOfMonth = today.getDate();
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  const hint: CalendarHint = {
    date: today.toISOString().slice(0, 10),
    weekday: weekdayNames[weekdayIdx],
    weekdayHint: WEEKDAY_HINTS[weekdayIdx]
  };

  // 月底提示（最后 5 天）
  if (dayOfMonth > lastDayOfMonth - 5) {
    hint.monthHint = '月底 / 打工人快没电 / 工资还没到';
  }

  // 月初提示（前 3 天）
  if (dayOfMonth <= 3) {
    hint.monthHint = '月初 / 重新启动 / 给自己一点希望';
  }

  return hint;
}
