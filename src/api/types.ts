export interface User {
  id: number;
  username: string;
  role: 'admin' | 'user';
}

export interface Task {
  id: number;
  title: string;
  content: string;
  status: 'todo' | 'done' | 'discarded';
  priority: number; // 0: Low, 1: Medium, 2: High
  expected_completion_date?: string; // ISO String
  deadline?: string; // ISO String
  created_at: string;
  completed_at?: string;
}

export interface FixedList {
  id: number;
  title: string;
}

export interface FixedListItem {
  id: number; // item id (relation id)
  task_id: number;
  task: Task; // Nested task data
}