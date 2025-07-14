export interface LogEntry {
  uuid: string;
  parentUuid: string | null;
  isSidechain: boolean;
  userType: string;
  cwd: string;
  sessionId: string;
  version: string;
  type: 'user' | 'assistant';
  timestamp: string;
  message: {
    id?: string;
    role: string;
    content: Array<{
      type: string;
      text?: string;
      name?: string;
      input?: any;
      tool_use_id?: string;
    }>;
  };
  toolUseResult?: {
    type: string;
    filePath?: string;
    content?: string;
    stdout?: string;
    stderr?: string;
    oldString?: string;
    newString?: string;
    structuredPatch?: any[];
  };
}