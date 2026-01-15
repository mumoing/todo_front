import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn');

export const formatDate = (date?: string) => {
  if (!date) return '';
  return dayjs(date).format('YYYY-MM-DD HH:mm');
};

export const getExpectedDesc = (dateStr?: string) => {
  if (!dateStr) return '无计划';
  const date = dayjs(dateStr);
  const today = dayjs();
  
  if (date.isSame(today, 'day')) return '今天';
  if (date.isSame(today.add(1, 'day'), 'day')) return '明天';
  
  // 本周 (注意：根据需求定义周一到周日)
  if (date.isSame(today, 'week')) return '本周';
  if (date.isSame(today.add(1, 'week'), 'week')) return '下周';
  
  return date.format('MM-DD'); // 默认显示日期
};