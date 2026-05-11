import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// 类型定义
type Difficulty = 'easy' | 'normal' | 'hard';
type Gender = 'male' | 'female' | 'custom';
type ApiType = 'claude' | 'gemini' | 'deepseek';

interface Player { name: string; gender: Gender; customGender?: string; }
interface Teammate { id: string; name: string; personality: string; specialty: string; appearance: string; }
interface Item { id: string; name: string; description: string; }
interface Message { role: 'user' | 'assistant'; content: string; timestamp: number; isStory?: boolean; }
interface Danmaku { text: string; type: 'normal' | 'warning' | 'cp' | 'funny'; }
interface GameState {
  player: Player;
  teammates: Teammate[];
  relationships: Record<string, string>;
  trust: Record<string, number>;
  inventory: Item[];
  currentDungeon: string | null;
  difficulty: Difficulty;
  messages: Message[];
}

// 预设角色
const PRESET_CHARACTERS: Teammate[] = [
  { id: 'tm1', name: '顾深', personality: '阴沉独狼', specialty: '解谜推理', appearance: '😈' },
  { id: 'tm2', name: '夏眠', personality: '阳光社牛', specialty: '社交套话', appearance: '☀️' },
  { id: 'tm3', name: '姜迟', personality: '温柔观察者', specialty: '感知共情', appearance: '🌙' },
  { id: 'tm4', name: '陆焰', personality: '暴躁行动派', specialty: '战斗直觉', appearance: '🔥' },
];

// 随机副本列表
const DUNGEONS = [
  '诡异教室·课间十分钟',
  '深夜图书馆·第七层',
  '废弃宿舍楼·404号房',
  '学校后山·枯井祭坛',
  '考试地狱·无限卷子',
  '食堂怪谈·消失的菜单',
  '体育器材室·第三个柜子',
  '广播室·凌晨三点',
  '天台异闻·坠落之谜',
  '医务室·空床位',
  '实验室·化学反应',
  '美术教室·蒙眼画像',
  '音乐教室·第三首曲子',
  '地下室·封印的门',
  '校长室·时间静止',
];

const getRandomDungeon = () => DUNGEONS[Math.floor(Math.random() * DUNGEONS.length)];

// 存档/读档工具函数
const SAVE_KEY = 'infinite_game_save';
interface SaveData {
  state: GameState;
  savedAt: string;
  version: string;
}

export const saveGame = (state: GameState): boolean => {
  try {
    const saveData: SaveData = {
      state,
      savedAt: new Date().toLocaleString('zh-CN'),
      version: '1.0',
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    return true;
  } catch {
    return false;
  }
};

export const loadGame = (): SaveData | null => {
  try {
    const data = localStorage.getItem(SAVE_KEY);
    if (!data) return null;
    return JSON.parse(data) as SaveData;
  } catch {
    return null;
  }
};

export const hasSavedGame = (): boolean => {
  return localStorage.getItem(SAVE_KEY) !== null;
};

export const deleteSave = (): void => {
  localStorage.removeItem(SAVE_KEY);
};

// 首页组件
function HomePage({ onStart, onContinue, onApiSettingsChange }: { onStart: () => void; onContinue: (state: GameState) => void; onApiSettingsChange?: (key: string, type: string) => void }) {
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKeyLocal] = useState(localStorage.getItem('apiKey') || '');
  const [apiType, setApiTypeLocal] = useState(localStorage.getItem('apiType') || 'deepseek');
  const [savedData, setSavedData] = useState<SaveData | null>(null);

  useEffect(() => {
    const data = loadGame();
    setSavedData(data);
  }, []);

  const handleContinue = () => {
    const data = loadGame();
    if (data) {
      onContinue(data.state);
    }
  };

  const saveApiSettings = () => {
    localStorage.setItem('apiKey', apiKey);
    localStorage.setItem('apiType', apiType);
    // 通知父组件 API 设置已更改
    if (onApiSettingsChange) {
      onApiSettingsChange(apiKey, apiType);
    }
    setShowSettings(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a15] flex flex-col items-center justify-center p-4">
      <h1 className="text-5xl font-bold text-red-500 mb-4 tracking-wider">无限流</h1>
      <h2 className="text-2xl text-gray-400 mb-8">高三3班</h2>

      {showSettings ? (
        <div className="w-full max-w-md bg-[#1a1a2e] rounded-lg p-6 border border-red-900/30">
          <h3 className="text-lg font-bold text-red-500 mb-4">API 设置</h3>
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">API 类型</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setApiTypeLocal('deepseek')} className={`py-2 rounded ${apiType === 'deepseek' ? 'bg-red-600 text-white' : 'bg-[#0a0a15] text-gray-400'}`}>硅基流动</button>
              <button onClick={() => setApiTypeLocal('claude')} className={`py-2 rounded ${apiType === 'claude' ? 'bg-red-600 text-white' : 'bg-[#0a0a15] text-gray-400'}`}>Claude</button>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">API Key</label>
            <input type="password" value={apiKey} onChange={e => setApiKeyLocal(e.target.value)} placeholder="sk-..." className="w-full bg-[#0a0a15] border border-red-900/30 rounded px-3 py-2 text-white" />
          </div>
          <div className="flex gap-2">
            <button onClick={saveApiSettings} className="flex-1 py-2 bg-red-600 text-white rounded">保存</button>
            <button onClick={() => setShowSettings(false)} className="px-4 py-2 bg-gray-700 text-white rounded">取消</button>
          </div>
        </div>
      ) : (
        <>
          {savedData && (
            <>
              <button onClick={handleContinue} className="px-12 py-4 bg-red-600 text-white text-xl font-bold rounded hover:bg-red-700 transition mb-4">
                📂 继续游戏
              </button>
              <div className="text-gray-500 text-sm mb-4">存档时间: {savedData.savedAt}</div>
            </>
          )}
          <button onClick={onStart} className={`px-12 py-4 text-xl font-bold rounded transition ${savedData ? 'bg-transparent border-2 border-red-500 text-red-500 hover:bg-red-600 hover:text-white' : 'bg-transparent border-2 border-red-600 text-red-500 hover:bg-red-600 hover:text-white'}`}>
            {savedData ? '重新开始' : '开始游戏'}
          </button>
          <button onClick={() => setShowSettings(true)} className="mt-4 px-6 py-2 bg-gray-800 text-gray-400 rounded hover:bg-gray-700 transition">
            ⚙️ API设置
          </button>
          <div className="mt-16 text-gray-600 text-sm">恐怖 · 悬疑 · 群像推理</div>
        </>
      )}
    </div>
  );
}

// 角色创建页
function CharacterCreate({ onComplete, onBack }: { onComplete: (state: GameState) => void; onBack: () => void }) {
  const [playerName, setPlayerName] = useState('');
  const [gender, setGender] = useState<Gender>('female');
  const [customGender, setCustomGender] = useState('');
  const [teammates, setTeammates] = useState(PRESET_CHARACTERS.map(c => ({ ...c })));
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [selectedDungeon, setSelectedDungeon] = useState<string | null>(null);
  const [showDungeonList, setShowDungeonList] = useState(false);

  const updateTeammate = (id: string, field: string, value: string) => {
    setTeammates(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleStart = () => {
    const displayName = playerName.trim() || '玩家' + Math.floor(Math.random() * 1000);
    const trust: Record<string, number> = {};
    teammates.forEach(t => { trust[t.id] = 50; });

    onComplete({
      player: { name: displayName, gender, customGender },
      teammates,
      relationships: {},
      trust,
      inventory: [],
      currentDungeon: selectedDungeon || getRandomDungeon(),
      difficulty,
      messages: [],
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a15] p-4 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="text-gray-400 hover:text-white">← 返回</button>
          <h1 className="text-xl text-red-500 font-bold">角色创建</h1>
          <div className="w-16" />
        </div>

        <div className="bg-[#1a1a2e] rounded-lg p-6 mb-4 border border-red-900/30">
          <h2 className="text-lg font-bold text-white mb-4">你的角色</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">姓名（留空随机）</label>
              <input type="text" value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="输入你的名字..." className="w-full bg-[#0a0a15] border border-red-900/30 rounded px-3 py-2 text-white placeholder-gray-600" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">性别</label>
              <div className="flex gap-2">
                {(['female', 'male', 'custom'] as Gender[]).map(g => (
                  <button key={g} onClick={() => setGender(g)} className={`px-4 py-2 rounded ${gender === g ? 'bg-red-600 text-white' : 'bg-[#0a0a15] text-gray-400'}`}>
                    {g === 'female' ? '女' : g === 'male' ? '男' : '自定义'}
                  </button>
                ))}
              </div>
              {gender === 'custom' && (
                <input
                  type="text"
                  value={customGender}
                  onChange={e => setCustomGender(e.target.value)}
                  placeholder="输入你的性别（如：无性别、跨性别等）..."
                  className="w-full mt-2 bg-[#0a0a15] border border-red-900/30 rounded px-3 py-2 text-white placeholder-gray-600"
                />
              )}
            </div>
          </div>
        </div>

        <div className="bg-[#1a1a2e] rounded-lg p-6 mb-4 border border-red-900/30">
          <h2 className="text-lg font-bold text-white mb-4">队友设定</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {teammates.map(char => (
              <div key={char.id} className="bg-[#0a0a15] rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{char.appearance}</span>
                  <input type="text" value={char.name} onChange={e => updateTeammate(char.id, 'name', e.target.value)} className="flex-1 bg-transparent border-b border-red-900/30 text-white font-bold" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">性格</label>
                  <input type="text" value={char.personality} onChange={e => updateTeammate(char.id, 'personality', e.target.value)} className="w-full bg-transparent border-b border-red-900/30 text-gray-300 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">特长</label>
                  <input type="text" value={char.specialty} onChange={e => updateTeammate(char.id, 'specialty', e.target.value)} className="w-full bg-transparent border-b border-red-900/30 text-gray-300 text-sm" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#1a1a2e] rounded-lg p-6 mb-4 border border-red-900/30">
          <h2 className="text-lg font-bold text-white mb-4">游戏难度</h2>
          <div className="grid grid-cols-3 gap-2">
            {[{ value: 'easy', label: '🟢 简单', desc: '新手友好' }, { value: 'normal', label: '🟡 中等', desc: '固定1个死亡选项' }, { value: 'hard', label: '🔴 困难', desc: '固定2个死亡选项' }].map(opt => (
              <button key={opt.value} onClick={() => setDifficulty(opt.value as Difficulty)} className={`p-3 rounded text-center ${difficulty === opt.value ? 'bg-red-900/30 border border-red-500/50' : 'bg-[#0a0a15]'}`}>
                <div className={`font-bold ${opt.value === 'easy' ? 'text-green-400' : opt.value === 'normal' ? 'text-yellow-400' : 'text-red-400'}`}>{opt.label}</div>
                <div className="text-xs text-gray-500">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#1a1a2e] rounded-lg p-6 mb-4 border border-red-900/30">
          <h2 className="text-lg font-bold text-white mb-4">选择副本</h2>
          <div className="mb-3">
            <button 
              onClick={() => setShowDungeonList(!showDungeonList)} 
              className="w-full p-3 bg-[#0a0a15] border border-red-900/30 rounded text-left flex items-center justify-between"
            >
              <span className={selectedDungeon ? 'text-white' : 'text-gray-500'}>
                {selectedDungeon || '🎲 随机副本'}
              </span>
              <span>{showDungeonList ? '▲' : '▼'}</span>
            </button>
          </div>
          {showDungeonList && (
            <div className="max-h-[200px] overflow-y-auto bg-[#0a0a15] rounded border border-red-900/30 options-scroll">
              <button 
                onClick={() => { setSelectedDungeon(null); setShowDungeonList(false); }} 
                className="w-full p-3 text-left hover:bg-red-900/20 text-gray-400 hover:text-white border-b border-red-900/20"
              >
                🎲 随机副本
              </button>
              {DUNGEONS.map((dungeon, index) => (
                <button 
                  key={index} 
                  onClick={() => { setSelectedDungeon(dungeon); setShowDungeonList(false); }} 
                  className={`w-full p-3 text-left hover:bg-red-900/20 ${selectedDungeon === dungeon ? 'text-red-400 bg-red-900/20' : 'text-gray-300'}`}
                >
                  {dungeon}
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={handleStart} className="w-full py-4 bg-red-600 text-white text-xl font-bold rounded hover:bg-red-700 transition">开始游戏</button>
      </div>
    </div>
  );
}

// 从AI回复中解析弹幕、信任度变化，返回纯净剧情内容
// 副本摘要类型：记录通关副本的关键信息，用于衔接下一个副本
export interface DungeonSummary {
  name: string;
  outcome: string;       // 通关结果描述（如"成功逃出"、"揭开真相"等）
  keyEvents: string[];  // 关键事件列表（如"发现尸体"、"队友牺牲"等）
  itemsGained: string[]; // 获得道具
  teammatesInvolved: string[]; // 涉及的队友名
  storyReveal?: string;  // 本副本揭示的主线真相片段
  foreshadowing?: string; // 埋下的伏笔（下一副本线索）
}

// 全局故事背景（游戏开始时由AI生成）
export interface StoryBackground {
  worldSetting: string;   // 世界观设定
  mainPlot: string;       // 主线故事
  hiddenTruth: string;    // 隐藏真相（游戏结束时揭示）
  antagonist: string;     // 幕后黑手
}

function parseAIResponse(content: string): {
  cleanContent: string;
  danmaku: Danmaku[];
  trustDeltas: Record<string, number>;
  isClear: boolean;           // 是否通关
  dungeonSummary: DungeonSummary | null; // 副本摘要
  storyBackground: StoryBackground | null; // 故事背景（首副本生成）
} {
  let cleanContent = content;
  let danmaku: Danmaku[] = [];
  const trustDeltas: Record<string, number> = {};
  let isClear = false;
  let dungeonSummary: DungeonSummary | null = null;
  let storyBackground: StoryBackground | null = null;

  // 解析故事背景：【故事背景】世界观|主线|隐藏真相|幕后黑手
  const bgMatch = cleanContent.match(/【故事背景】([^【\n]+(?:\n(?!【)[^\n]*)*)/);
  if (bgMatch) {
    const parts = bgMatch[1].split('|').map(p => p.trim()).filter(Boolean);
    storyBackground = {
      worldSetting: parts[0] || '',
      mainPlot: parts[1] || '',
      hiddenTruth: parts[2] || '',
      antagonist: parts[3] || '',
    };
    cleanContent = cleanContent.replace(/【故事背景】[^\n]+\n?/, '').trim();
  }

  // 解析通关标记：【通关】副本名|结果|关键事件1&关键事件2|道具|涉及队友|主线揭示|伏笔
  const clearMatch = cleanContent.match(/【通关】([^【\n]+)/);
  if (clearMatch) {
    isClear = true;
    const parts = clearMatch[1].split('|').map(p => p.trim()).filter(Boolean);
    dungeonSummary = {
      name: parts[0] || '',
      outcome: parts[1] || '顺利通关',
      keyEvents: (parts[2] || '').split('&').map(s => s.trim()).filter(Boolean),
      itemsGained: (parts[3] || '').split('&').map(s => s.trim()).filter(Boolean),
      teammatesInvolved: (parts[4] || '').split('&').map(s => s.trim()).filter(Boolean),
      storyReveal: parts[5] || '',
      foreshadowing: parts[6] || '',
    };
    cleanContent = cleanContent.replace(/【通关】[^\n]+\n?/, '').trim();
  }

  // 解析信任度变化：【信任度变化】顾深:+10,夏眠:-5,姜迟:+2,陆焰:0
  const trustMatch = cleanContent.match(/【信任度变化】([^\n【]+)/);
  if (trustMatch) {
    trustMatch[1].split(',').forEach(part => {
      // 匹配 "名字:+数字" 或 "名字:-数字" 或 "名字:数字"
      const m = part.trim().match(/^(.+?)\s*:\s*([+-]?\d+)$/);
      if (m) trustDeltas[m[1].trim()] = parseInt(m[2]);
    });
    cleanContent = cleanContent.replace(/【信任度变化】[^\n【]+\n?/, '').trim();
  }

  // 解析弹幕：【弹幕】...
  const danmakuMatch = cleanContent.match(/【弹幕】([\s\S]*?)$/);
  if (danmakuMatch) {
    const lines = danmakuMatch[1].trim().split('\n').filter((l: string) => l.trim());
    danmaku = lines.map((line: string) => {
      const match = line.match(/^(normal|warning|cp|funny):\s*(.+)$/);
      if (match) {
        return { text: match[2].trim(), type: match[1] as 'normal' | 'warning' | 'cp' | 'funny' };
      }
      return { text: line.replace(/^-\s*/, '').trim(), type: 'normal' as const };
    }).slice(0, 8);
    cleanContent = cleanContent.replace(/【弹幕】[\s\S]*$/, '').trim();
  }

  // 没有弹幕时自动生成
  if (danmaku.length === 0) {
    if (cleanContent.includes('死') || cleanContent.includes('危险') || cleanContent.includes('逃跑')) danmaku.push({ text: '快跑啊！！', type: 'warning' as const });
    if (cleanContent.includes('笑') || cleanContent.includes('搞笑')) danmaku.push({ text: '哈哈哈笑死我了', type: 'funny' as const });
    if (cleanContent.includes('喜欢') || cleanContent.includes('心跳')) danmaku.push({ text: '啊啊啊磕到了！', type: 'cp' as const });
    if (danmaku.length === 0) danmaku.push({ text: '这剧情有点东西', type: 'normal' as const });
  }

  return { cleanContent, danmaku, trustDeltas, isClear, dungeonSummary, storyBackground };
}

// 游戏页
function GamePage({ gameState, apiKey, apiType, onExit, onOpenSettings, onSave, onApiKeyChange }: {
  gameState: GameState;
  apiKey: string;
  apiType: ApiType;
  onExit: () => void;
  onOpenSettings: () => void;
  onSave: (gameState: GameState, messages: Message[]) => void;
  onApiKeyChange: (key: string) => void;
}) {
  const [messages, setMessages] = useState<Message[]>(gameState.messages || []);
  const [danmaku, setDanmaku] = useState<Danmaku[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [saveNotice, setSaveNotice] = useState(false);
  // 信任度本地状态（可动态更新）
  const [localTrust, setLocalTrust] = useState<Record<string, number>>({ ...gameState.trust });
  // 用于显示信任度变化动画（3秒后清除）
  const [trustChanges, setTrustChanges] = useState<Record<string, number>>({});
  const [clearedDungeons, setClearedDungeons] = useState<DungeonSummary[]>([]); // 已通关副本列表
  const [isTransitioning, setIsTransitioning] = useState(false); // 通关过渡动画中
  const [showDungeonSelect, setShowDungeonSelect] = useState(false); // 通关后选择下一副本
  const [pendingSummary, setPendingSummary] = useState<DungeonSummary | null>(null); // 待处理的通关摘要
  const [storyBackground, setStoryBackground] = useState<StoryBackground | null>(null); // 全局故事背景
  const [showStoryReveal, setShowStoryReveal] = useState(false); // 显示完整故事揭示弹窗
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isLoadedFromSave = useRef(gameState.messages && gameState.messages.length > 0);

  const handleSave = () => {
    // 保存时包含最新信任度
    const fullState = { ...gameState, trust: localTrust, messages };
    onSave(fullState, messages);
    setSaveNotice(true);
    setTimeout(() => setSaveNotice(false), 2000);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!apiKey) { 
      setShowApiModal(true); 
      return; 
    }
    // 如果是从存档加载的，不重新生成剧情
    if (isLoadedFromSave.current && gameState.messages && gameState.messages.length > 0) {
      return;
    }
    // 自动生成第一段剧情（流式输出）
    const initGame = async () => {
      setIsLoading(true);
      // 先设置空消息，用于流式更新
      const aiMsg: Message = { role: 'assistant', content: '', timestamp: Date.now() };
      setMessages([aiMsg]);
      
      try {
        if (apiType === 'deepseek') {
          const prompt = buildPrompt(null, true);  // 首副本，生成故事背景
          try {
            const res = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
              body: JSON.stringify({ 
                model: 'deepseek-ai/DeepSeek-V4-Flash', 
                messages: [{ role: 'system', content: prompt }, { role: 'user', content: '请开始游戏，生成第一段剧情和四个选项。' }], 
                max_tokens: 1500, 
                temperature: 0.7,
                stream: true  // 启用流式输出
              }),
            });
            if (!res.ok) {
              const errText = await res.text().catch(() => '');
              if (res.status === 401) {
                throw new Error('API Key 无效，请重新设置。点击右上角 ⚙️ 按钮输入正确的 API Key。');
              }
              throw new Error('API错误: ' + res.status + ' ' + errText.substring(0, 200));
            }
            // 流式读取响应
            const reader = res.body?.getReader();
            if (!reader) throw new Error('无法读取响应流');
            
            const decoder = new TextDecoder();
            let fullContent = '';
            let lastUpdate = Date.now();
            
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              const chunk = decoder.decode(value, { stream: true });
              // 解析 SSE 格式数据
              const lines = chunk.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') continue;
                  try {
                    const parsed = JSON.parse(data);
                    const delta = parsed.choices?.[0]?.delta?.content || '';
                    if (delta) {
                      fullContent += delta;
                      lastUpdate = Date.now();
                      // 实时更新消息内容
                      setMessages([{ ...aiMsg, content: fullContent }]);
                    }
                  } catch (e) {
                    // 忽略解析错误
                  }
                }
              }
            }
            
            // 如果流式读取失败（内容为空），尝试非流式读取
            if (!fullContent || fullContent.length < 10) {
              console.log('[DEBUG] 流式读取为空，尝试重新获取...');
              // 重新发起非流式请求
              const retryRes = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
                body: JSON.stringify({ 
                  model: 'deepseek-ai/DeepSeek-V4-Flash', 
                  messages: [{ role: 'system', content: prompt }, { role: 'user', content: '请开始游戏，生成第一段剧情和四个选项。' }], 
                  max_tokens: 1500, 
                  temperature: 0.7
                }),
              });
              const retryData = await retryRes.json();
              fullContent = retryData.choices?.[0]?.message?.content || '';
            }
            
            if (!fullContent) throw new Error('AI返回内容为空，请检查API Key是否有效');
            
            // 解析弹幕和信任度
            const { cleanContent, danmaku: newDanmaku, trustDeltas, storyBackground: bg } = parseAIResponse(fullContent);
            setMessages([{ ...aiMsg, content: cleanContent }]);
            setDanmaku(newDanmaku);
            if (bg) setStoryBackground(bg);
            
          } catch (fetchErr: any) {
            throw fetchErr;
          }
        }
      } catch (e: any) {
        setMessages([{ role: 'assistant', content: '❌ 错误: ' + e.message, timestamp: Date.now() }]);
        if (e.message.includes('401') || e.message.includes('无效') || e.message.includes('Invalid')) {
          setShowApiModal(true);
        }
      } finally {
        setIsLoading(false);
      }
    };
    initGame();
  }, [apiKey, apiType, gameState.messages]);

  const buildPrompt = (previousDungeon: DungeonSummary | null = null, isFirstDungeon: boolean = false) => {
    const dungeon = gameState.currentDungeon || '未知副本';
    const tmList = gameState.teammates.map(t => '- ' + t.name + '：' + t.personality + '，' + t.specialty).join('\n');
    const diffDesc = gameState.difficulty === 'easy' ? '简单模式' : gameState.difficulty === 'normal' ? '中等模式' : '困难模式';
    const gender = gameState.player.gender === 'female' ? '女' : gameState.player.gender === 'male' ? '男' : (gameState.player.customGender || '其他');
    const trustInfo = gameState.teammates.map(t => {
      const val = localTrust[t.id] ?? 50;
      const level = val >= 80 ? '深信' : val >= 60 ? '信任' : val >= 40 ? '普通' : val >= 20 ? '警惕' : '敌意';
      return `${t.name}:${val}(${level})`;
    }).join('，');

    const firstDungeonInstruction = isFirstDungeon ? `
【★ 首副本专属要求 ★】
这是游戏的第一个副本，你必须在回复末尾（所有其他内容之后）输出以下格式的故事背景（ONE LINE，用|分隔）：
【故事背景】世界观简述（2-3句）|主线故事梗概（2-3句）|隐藏真相（玩家最终会发现的核心秘密）|幕后黑手（谁在操控这一切）

要求：
- 世界观：解释"无限流"的运作机制，为何高三3班的学生被选中
- 主线：贯穿所有副本的核心谜题（至少跨越3个副本的宏大阴谋）
- 隐藏真相：游戏最终揭示的震撼秘密（需要让玩家通关多个副本才能拼凑）
- 幕后黑手：一个在背后操控一切的神秘存在（需要有动机和逻辑）
` : '';

    return `你是顶级恐怖无限流小说作家，同时担任游戏叙事者。你的文风参照今何在《悟空传》的沉郁、骨子里有宿命感，兼具网文爽点。【格式铁律，违反格式=错误回复】

【基本信息】
游戏：无限流·高三3班
副本：${dungeon}
主角：${gameState.player.name}（${gender}生）

【队友】
${tmList}

【难度】${diffDesc}

【当前信任度】
${trustInfo}
（信任度影响队友行为：深信会舍命保护你，信任会配合行动，普通正常协作，警惕会质疑动机，敌意可能在关键时刻背刺！）
${previousDungeon ? `
【★★★上一副本记忆★★★】（新副本必须与此深度关联！）
副本名：${previousDungeon.name}
通关结果：${previousDungeon.outcome}
关键事件：${previousDungeon.keyEvents.length > 0 ? previousDungeon.keyEvents.join('；') : '无'}
获得道具：${previousDungeon.itemsGained.length > 0 ? previousDungeon.itemsGained.join('、') : '无'}
主线揭示：${previousDungeon.storyReveal || '无'}
遗留伏笔：${previousDungeon.foreshadowing || '无'}
★新副本开头必须承接上一副本遗留的伏笔！将幕后黑手的阴谋推进到下一阶段！` : ''}

【游戏规则】
1. 异界死亡=现实猝死
2. 全员可死，队友死亡对故事影响持续
3. 玩家操控主角
4. 通关可获道具，道具在后续副本中可使用

【★★★叙事要求（核心！）★★★】
1. 【文学性】每段剧情如同小说章节，有完整的情节起承转合，要有具体细节、感官描写（气味/触感/声音）
2. 【伏笔感】每段剧情必须埋下至少1个细节伏笔（可能在后续副本揭示意义），用★标注伏笔内容
3. 【人物弧】队友不是工具，要体现他们的恐惧、成长、隐藏秘密——低信任度的队友可能有自己的秘密议程
4. 【主线推进】每次剧情要暗示"幕后黑手"的存在，散落线索让玩家拼凑真相
5. 【情感张力】生死选择要有道德困境，让玩家真正纠结
6. 【副本主题】每个副本不只是逃生，要有内在主题（背叛/救赎/牺牲/真相/记忆）
${firstDungeonInstruction}
【★★★必须严格遵守的回复格式★★★】
每次回复必须按顺序包含以下部分：

---第一部分：剧情---
（300-500字，文学性叙事，有细节有情感，体现副本主题，根据信任度体现队友差异化反应）
（★伏笔：[在某处标注埋下的伏笔]）

---第二部分：选项---
[A]: 选项内容
[B]: 选项内容
[C]: 选项内容
[D]: 选项内容
（必须正好4个，${gameState.difficulty === 'easy' ? '最多1个死亡选项' : gameState.difficulty === 'normal' ? '固定1个死亡选项' : '固定2个死亡选项'}，选项要有道德层面的权衡，不只是"往左走/往右走"）

---第三部分：信任度变化（必须输出！）---
格式示例：【信任度变化】顾深:+8,夏眠:-3,姜迟:+5,陆焰:0
规则：根据玩家刚才的选择调整（范围-20到+15），第一次填0，所有队友都要写
★必须用中文全角【】，名字后跟英文半角冒号，数字前必须有+或-号（0除外）

---第四部分：通关标记（只在剧情走到副本结局时输出！）---
【通关】副本名|通关结果|关键事件1&关键事件2|获得道具1&道具2|涉及队友1&队友2|本副本揭示的主线真相（1-2句关键信息）|留给下一副本的伏笔（1句话）

---第五部分：弹幕---
【弹幕】
normal: 弹幕内容
warning: 预警弹幕
cp: 磕CP弹幕
funny: 搞笑弹幕
（共5-8条，要精准反映当前剧情情绪，warning类要有紧迫感，cp类要有萌点）`;
  };

  // 通关后自动进入下一副本
  const transitionToNextDungeon = (summary: DungeonSummary, nextDungeon: string) => {
    setClearedDungeons(prev => [...prev, summary]);
    // 清空消息，重新初始化
    setMessages([]);
    setDanmaku([]);
    setIsTransitioning(false);
    // 更新当前副本名
    gameState.currentDungeon = nextDungeon;
    // 重新生成剧情（带上一副本记忆）
    setTimeout(() => {
      setIsLoading(true);
      const prompt = buildPrompt(summary);
      fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
        body: JSON.stringify({ model: 'deepseek-ai/DeepSeek-V4-Flash', messages: [{ role: 'system', content: prompt }, { role: 'user', content: '请承接上一副本【' + summary.name + '】的记忆，生成新副本【' + nextDungeon + '】的第一段剧情和四个选项。' }], max_tokens: 2000, temperature: 0.8 }),
      }).then(res => res.json()).then(data => {
        const content = data.choices?.[0]?.message?.content || '';
        const { cleanContent, danmaku: newDanmaku, trustDeltas } = parseAIResponse(content);
        setMessages([{ role: 'assistant', content: cleanContent, timestamp: Date.now() }]);
        setDanmaku(newDanmaku);
      }).catch(() => {
        setMessages([{ role: 'assistant', content: '❌ 网络错误，无法加载下一副本。', timestamp: Date.now() }]);
      }).finally(() => setIsLoading(false));
    }, 100);
  };

  const callAI = async (userInput: string) => {
    if (!apiKey) { setShowApiModal(true); return; }
    setIsLoading(true);
    const userMsg: Message = { role: 'user', content: userInput, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    
    // 创建空消息用于流式更新
    const aiMsg: Message = { role: 'assistant', content: '', timestamp: Date.now() };
    setMessages(prev => [...prev, aiMsg]);
    
    try {
      let content = '';
      if (apiType === 'deepseek') {
        const prompt = buildPrompt(clearedDungeons[clearedDungeons.length - 1] || null);
        const historyMessages = messages.map(m => ({ role: m.role, content: m.content }));
        try {
          const res = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
            body: JSON.stringify({ 
              model: 'deepseek-ai/DeepSeek-V4-Flash', 
              messages: [{ role: 'system', content: prompt }, ...historyMessages, { role: 'user', content: userInput }], 
              max_tokens: 1500, 
              temperature: 0.7,
              stream: true  // 启用流式输出
            }),
          });
          if (!res.ok) throw new Error('API错误: ' + res.status + ' ' + (await res.text().catch(() => '')).substring(0, 200));
          
          // 流式读取响应
          const reader = res.body?.getReader();
          if (!reader) throw new Error('无法读取响应流');
          
          const decoder = new TextDecoder();
          let fullContent = '';
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(data);
                  const delta = parsed.choices?.[0]?.delta?.content || '';
                  if (delta) {
                    fullContent += delta;
                    // 实时更新消息内容
                    setMessages(prev => {
                      const newMessages = [...prev];
                      newMessages[newMessages.length - 1] = { ...aiMsg, content: fullContent };
                      return newMessages;
                    });
                  }
                } catch (e) {
                  // 忽略解析错误
                }
              }
            }
          }
          
          // 如果流式读取失败，尝试非流式
          if (!fullContent || fullContent.length < 10) {
            console.log('[DEBUG] 流式读取为空，尝试重新获取...');
            const retryRes = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
              body: JSON.stringify({ 
                model: 'deepseek-ai/DeepSeek-V4-Flash', 
                messages: [{ role: 'system', content: prompt }, ...historyMessages, { role: 'user', content: userInput }], 
                max_tokens: 1500, 
                temperature: 0.7
              }),
            });
            const retryData = await retryRes.json();
            content = retryData.choices?.[0]?.message?.content || '';
          } else {
            content = fullContent;
          }
          
          if (!content) throw new Error('AI返回内容为空');
          
        } catch (fetchErr: any) {
          throw fetchErr;
        }
      }
      
      const { cleanContent, danmaku: newDanmaku, trustDeltas, isClear, dungeonSummary, storyBackground: bg } = parseAIResponse(content);
      console.log('[DEBUG] AI原始回复末尾:', content.slice(-200));
      console.log('[DEBUG] 是否通关:', isClear, '摘要:', dungeonSummary);

      // 保存故事背景（如果有）
      if (bg) setStoryBackground(bg);

      // 检查是否通关
      if (isClear && dungeonSummary) {
        const clearMsg: Message = {
          role: 'assistant',
          content: cleanContent + '\n\n✨ 【副本通关】 ✨\n' + (dungeonSummary.keyEvents.length > 0 ? '关键事件：' + dungeonSummary.keyEvents.join('；') : '') + (dungeonSummary.storyReveal ? '\n\n🔍 真相碎片：' + dungeonSummary.storyReveal : ''),
          timestamp: Date.now()
        };
        setMessages(prev => [...prev.slice(0, -1), clearMsg]);
        setDanmaku([{ text: '🎉 通关成功！', type: 'funny' }, { text: '真相即将揭晓...', type: 'warning' }, { text: '选择下一个副本吧！', type: 'normal' }]);
        // 保存通关摘要，等待用户选择下一副本
        setPendingSummary(dungeonSummary);
        setShowDungeonSelect(true);
        return;
      }

      // 更新最终内容
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { ...aiMsg, content: cleanContent };
        return newMessages;
      });
      setDanmaku(newDanmaku);

      // 更新信任度
      const finalDeltas = Object.keys(trustDeltas).length > 0
        ? trustDeltas
        : (() => {
            const fallback: Record<string, number> = {};
            gameState.teammates.forEach(t => {
              fallback[t.name] = Math.floor(Math.random() * 7) - 3;
            });
            return fallback;
          })();

      const hasMeaningfulChange = Object.values(finalDeltas).some(v => v !== 0);
      if (hasMeaningfulChange) {
        setTrustChanges(finalDeltas);
        setLocalTrust(prev => {
          const next = { ...prev };
          gameState.teammates.forEach(t => {
            if (finalDeltas[t.name] !== undefined && finalDeltas[t.name] !== 0) {
              next[t.id] = Math.max(0, Math.min(100, (next[t.id] ?? 50) + finalDeltas[t.name]));
            }
          });
          return next;
        });
        setTimeout(() => setTrustChanges({}), 3000);
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ 错误: ' + e.message, timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (input.trim()) { callAI(input); setInput(''); }
  };

  // 从最后一条AI消息中提取ABCD选项，并生成纯净剧情正文
  const lastMsg = messages[messages.length - 1];
  const options: { label: string; text: string }[] = [];
  let cleanStory = ''; // 纯净剧情正文（不含选项、不含标记）

  if (lastMsg && lastMsg.role === 'assistant') {
    const raw = lastMsg.content;

    // 第1步：找到"选项"或"[A]"或"A:"的起始位置，截断
    const optionStart = raw.search(/(?:---第二部分：选项---|##\s*选项|\[A\]|^[A-D][:\.\s])/im);
    const storyPart = optionStart !== -1 ? raw.substring(0, optionStart) : raw;

    // 第2步：去掉所有【信任度变化】【弹幕】【通关】等标记行，以及分区标题
    cleanStory = storyPart
      .replace(/【信任度变化】[^\n]*/g, '')
      .replace(/【弹幕】[\s\S]*/g, '')
      .replace(/【通关】[^\n]*/g, '')
      // 去掉 ---第X部分：xxx--- 分区标题（AI prompt里要求的格式）
      .replace(/---+\s*第[一二三四五]部分[：:][^\n-]*(?:---+|)[\s\n]*/g, '')
      .replace(/---+\s*第[一二三四五]部分[^\n]*/g, '')
      .replace(/^第[一二三四五]部分[：:][^\n]*/gm, '')
      .replace(/^##\s+.+$/gm, '')       // 去掉 ## 标题行
      .replace(/^\s*---+\s*$/gm, '')   // 去掉孤立分隔线
      .replace(/---第一部分：剧情---/g, '')  // 去掉第一部分标记
      .replace(/---第二部分：选项---/g, '')  // 去掉第二部分标记
      .replace(/---第三部分：信任度变化[^\n]*/g, '')  // 去掉第三部分标记
      .replace(/---第四部分：通关标记[^\n]*/g, '')  // 去掉第四部分标记
      .replace(/---第五部分：弹幕---/g, '')  // 去掉第五部分标记
      .replace(/\n{3,}/g, '\n\n')      // 压缩空行
      .trim();

    // 第3步：逐行扫描提取选项（最可靠）
    {
      const lines = raw.split('\n');
      for (const line of lines) {
        // 匹配各种格式：[A]: / [A] / A: / A. / A、/ A） 等
        const mm = line.match(/^\s*\[?([A-D])\]?\s*[:：\.、）\)]\s*(.+)$/i);
        if (mm) {
          const label = mm[1].toUpperCase();
          const text = mm[2].trim();
          // 去重：如果已有相同 label 则跳过
          if (text && !options.find(o => o.label === label)) {
            options.push({ label, text });
          }
        }
      }
    }
    // 如果选项超过4个，只保留前4个
    if (options.length > 4) options.length = 4;
    // 如果不足4个，自动补全缺失的选项
    const allLabels = ['A', 'B', 'C', 'D'];
    for (const label of allLabels) {
      if (!options.find(o => o.label === label)) {
        console.log('[DEBUG] 补全缺失选项:', label);
        options.push({ label, text: '继续前进' });
      }
    }
    // 强制确保4个选项（兜底）
    while (options.length < 4) {
      const label = String.fromCharCode(65 + options.length); // A, B, C, D
      console.log('[DEBUG] 兜底补全选项:', label);
      options.push({ label, text: '继续前进' });
    }

    console.log('[DEBUG] 纯净剧情长度:', cleanStory.length, '选项:', options.map(o => o.label));
  }

  return (
    <div className="min-h-screen bg-[#0a0a15] flex flex-col">
      {showApiModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] border border-red-900/30 rounded-lg w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-red-500 mb-4">⚙️ API设置</h2>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">API类型</label>
              <div className="flex gap-2">
                <button onClick={() => { localStorage.setItem('apiType', 'deepseek'); onApiKeyChange(apiKey); }} className={`flex-1 py-2 rounded ${apiType === 'deepseek' ? 'bg-red-600 text-white' : 'bg-gray-700 text-white'}`}>硅基流动</button>
                <button onClick={() => { localStorage.setItem('apiType', 'claude'); onApiKeyChange(apiKey); }} className={`flex-1 py-2 rounded ${apiType === 'claude' ? 'bg-red-600 text-white' : 'bg-gray-700 text-white'}`}>Claude</button>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">API Key</label>
              <input type="password" id="apiKeyInput" placeholder="sk-..." className="w-full bg-[#0a0a15] border border-red-900/30 rounded px-3 py-2 text-white" />
            </div>
            <button onClick={() => { 
              const key = (document.getElementById('apiKeyInput') as HTMLInputElement).value; 
              localStorage.setItem('apiKey', key); 
              onApiKeyChange(key);
              setShowApiModal(false); 
            }} className="w-full py-2 bg-red-600 text-white rounded">保存</button>
          </div>
        </div>
      )}
      {/* 通关过渡动画 */}
      {isTransitioning && (
        <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-50">
          <div className="text-4xl mb-4 animate-pulse">🏆</div>
          <h2 className="text-2xl font-bold text-red-500 mb-2 animate-pulse">副本通关！</h2>
          <p className="text-gray-400 mb-4">正在进入下一个副本...</p>
          {clearedDungeons.length > 0 && (
            <div className="text-sm text-gray-500 mb-2">已通关：{clearedDungeons.map(d => d.name).join(' → ')}</div>
          )}
          <div className="flex gap-1 mt-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
      {/* 通关后副本选择弹窗 */}
      {showDungeonSelect && pendingSummary && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] border border-red-500/40 rounded-xl w-full max-w-lg p-6 shadow-2xl">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">🏆</div>
              <h2 className="text-xl font-bold text-red-400">副本通关！</h2>
              <p className="text-gray-500 text-sm mt-1">已完成：{pendingSummary.name}</p>
              {clearedDungeons.length > 0 && (
                <p className="text-gray-600 text-xs mt-1">通关记录：{clearedDungeons.map(d => d.name).join(' → ')} → {pendingSummary.name}</p>
              )}
            </div>
            {/* 主线真相碎片展示 */}
            {pendingSummary.storyReveal && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-500/20 rounded-lg">
                <p className="text-xs text-red-400 font-bold mb-1">🔍 真相碎片</p>
                <p className="text-sm text-gray-300 leading-relaxed">{pendingSummary.storyReveal}</p>
                {pendingSummary.foreshadowing && (
                  <p className="text-xs text-yellow-500/70 mt-2">⚠ 预感：{pendingSummary.foreshadowing}</p>
                )}
              </div>
            )}
            {/* 查看完整故事按钮（通关2+个副本后显示） */}
            {(clearedDungeons.length >= 1 || storyBackground) && (
              <button
                onClick={() => setShowStoryReveal(true)}
                className="w-full mb-3 p-3 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/30 rounded-lg text-purple-300 hover:text-white transition text-sm font-bold flex items-center justify-center gap-2"
              >
                <span>📖</span>
                <span>查看完整故事背景与主线</span>
              </button>
            )}
            <p className="text-gray-300 text-sm mb-3 text-center">选择下一个副本</p>
            <div className="max-h-[250px] overflow-y-auto space-y-1 options-scroll mb-4">
              {/* 随机选项 */}
              <button
                onClick={() => {
                  const next = getRandomDungeon();
                  setShowDungeonSelect(false);
                  setIsTransitioning(true);
                  setTimeout(() => transitionToNextDungeon(pendingSummary, next), 1500);
                  setPendingSummary(null);
                }}
                className="w-full p-3 text-left bg-red-900/20 hover:bg-red-900/40 border border-red-500/30 rounded-lg text-red-300 hover:text-white transition flex items-center gap-2"
              >
                <span>🎲</span>
                <span className="font-bold">随机副本</span>
              </button>
              {/* 全部副本列表 */}
              {DUNGEONS.map((dungeon, i) => {
                const isCleared = clearedDungeons.some(d => d.name === dungeon) || pendingSummary.name === dungeon;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setShowDungeonSelect(false);
                      setIsTransitioning(true);
                      setTimeout(() => transitionToNextDungeon(pendingSummary, dungeon), 1500);
                      setPendingSummary(null);
                    }}
                    className={`w-full p-3 text-left rounded-lg transition flex items-center justify-between ${
                      isCleared
                        ? 'bg-gray-800/30 text-gray-600 hover:bg-gray-800/50'
                        : 'bg-[#0a0a15] hover:bg-red-900/20 text-gray-300 hover:text-white'
                    }`}
                  >
                    <span>{dungeon}</span>
                    {isCleared && <span className="text-xs text-gray-600">已通关</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      <div className="h-14 bg-[#1a1a2e] border-b border-red-900/30 flex items-center justify-between px-4">
        <button onClick={onExit} className="text-gray-400 hover:text-white">← 退出</button>
        <h1 className="text-red-500 font-bold">无限流·高三3班</h1>
        <div className="flex items-center gap-2">
          {clearedDungeons.length > 0 && (
            <span className="text-yellow-400 text-sm">🏆 ×{clearedDungeons.length}</span>
          )}
          {storyBackground && (
            <button
              onClick={() => setShowStoryReveal(true)}
              className="px-3 py-1 bg-purple-800/40 hover:bg-purple-700/50 text-purple-300 hover:text-white text-sm rounded transition"
              title="查看完整故事背景"
            >
              📖 故事
            </button>
          )}
          {saveNotice && <span className="text-green-400 text-sm animate-pulse">✓ 已存档</span>}
          <button onClick={handleSave} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded">💾 存档</button>
          <button onClick={() => setShowApiModal(true)} className="w-8 h-8 bg-red-600 rounded-full text-white text-sm">⚙</button>
        </div>
      </div>
      {/* 完整故事背景与主线揭示弹窗 */}
      {showStoryReveal && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#0d0d1a] border border-purple-500/30 rounded-xl w-full max-w-2xl p-6 shadow-2xl my-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-purple-400">📖 完整故事背景</h2>
              <button onClick={() => setShowStoryReveal(false)} className="text-gray-500 hover:text-white text-xl">✕</button>
            </div>

            {/* 世界观设定 */}
            {storyBackground && (
              <>
                <div className="mb-5">
                  <h3 className="text-sm font-bold text-purple-300 mb-2 flex items-center gap-2">
                    <span>🌐</span> 世界观设定
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed bg-purple-900/10 rounded-lg p-3 border border-purple-900/30">
                    {storyBackground.worldSetting}
                  </p>
                </div>
                <div className="mb-5">
                  <h3 className="text-sm font-bold text-blue-300 mb-2 flex items-center gap-2">
                    <span>📜</span> 主线故事
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed bg-blue-900/10 rounded-lg p-3 border border-blue-900/30">
                    {storyBackground.mainPlot}
                  </p>
                </div>
                <div className="mb-5">
                  <h3 className="text-sm font-bold text-yellow-300 mb-2 flex items-center gap-2">
                    <span>😈</span> 幕后黑手
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed bg-yellow-900/10 rounded-lg p-3 border border-yellow-900/30">
                    {storyBackground.antagonist}
                  </p>
                </div>
                {/* 隐藏真相只有通关3个以上副本才显示 */}
                {clearedDungeons.length >= 2 ? (
                  <div className="mb-5">
                    <h3 className="text-sm font-bold text-red-400 mb-2 flex items-center gap-2">
                      <span>🔓</span> 隐藏真相（已解锁）
                    </h3>
                    <p className="text-red-300 text-sm leading-relaxed bg-red-900/15 rounded-lg p-3 border border-red-500/30">
                      {storyBackground.hiddenTruth}
                    </p>
                  </div>
                ) : (
                  <div className="mb-5">
                    <h3 className="text-sm font-bold text-gray-600 mb-2 flex items-center gap-2">
                      <span>🔒</span> 隐藏真相（需通关更多副本解锁）
                    </h3>
                    <p className="text-gray-600 text-sm italic bg-gray-900/30 rounded-lg p-3 border border-gray-800">
                      ████████████████████████████████（通关3个以上副本后解锁）
                    </p>
                  </div>
                )}
              </>
            )}

            {/* 主线进度：各副本揭示的真相碎片 */}
            {clearedDungeons.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-bold text-orange-300 mb-3 flex items-center gap-2">
                  <span>🗺️</span> 主线进度（{clearedDungeons.length}个副本已通关）
                </h3>
                <div className="space-y-3">
                  {clearedDungeons.map((d, idx) => (
                    <div key={idx} className="bg-[#1a1a2e] rounded-lg p-3 border border-orange-900/20">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-orange-400 text-xs font-bold">第{idx + 1}章 · {d.name}</span>
                        <span className="text-gray-600 text-xs">{d.outcome}</span>
                      </div>
                      {d.keyEvents.length > 0 && (
                        <p className="text-gray-400 text-xs mb-1">事件：{d.keyEvents.join('；')}</p>
                      )}
                      {d.storyReveal && (
                        <p className="text-yellow-300/80 text-xs leading-relaxed">
                          🔍 {d.storyReveal}
                        </p>
                      )}
                      {d.foreshadowing && (
                        <p className="text-red-400/60 text-xs mt-1">
                          ⚠ 伏笔：{d.foreshadowing}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setShowStoryReveal(false)}
              className="w-full py-3 bg-purple-700/40 hover:bg-purple-700/60 text-purple-300 hover:text-white rounded-lg transition font-bold"
            >
              继续游戏
            </button>
          </div>
        </div>
      )}
      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 bg-[#12121f] border-r border-red-900/30 p-4 overflow-y-auto">
          <div className="mb-4"><h3 className="text-xs text-gray-500 mb-2">难度</h3><div className={'text-sm font-bold ' + (gameState.difficulty === 'hard' ? 'text-red-500' : gameState.difficulty === 'normal' ? 'text-yellow-500' : 'text-green-500')}>{gameState.difficulty === 'easy' ? '🟢 简单' : gameState.difficulty === 'normal' ? '🟡 中等' : '🔴 困难'}</div></div>
          <div className="mb-4"><h3 className="text-xs text-gray-500 mb-2">队友状态</h3><div className="space-y-2">{gameState.teammates.map(t => {
            const trustVal = localTrust[t.id] ?? 50;
            const change = trustChanges[t.name];
            const trustLevel = trustVal >= 80 ? { label: '深信', color: 'text-emerald-400' } : trustVal >= 60 ? { label: '信任', color: 'text-green-400' } : trustVal >= 40 ? { label: '普通', color: 'text-gray-400' } : trustVal >= 20 ? { label: '警惕', color: 'text-yellow-400' } : { label: '敌意', color: 'text-red-400' };
            return (
              <div key={t.id} className="bg-[#0a0a15] rounded p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-white">{t.name}</span>
                  <div className="flex items-center gap-1">
                    {change !== undefined && change !== 0 && (
                      <span className={`text-xs font-bold animate-pulse ${change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {change > 0 ? '+' : ''}{change}
                      </span>
                    )}
                    <span className={`text-xs ${trustLevel.color}`}>{trustLevel.label}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-700 rounded overflow-hidden">
                    <div
                      className={`h-full transition-all duration-700 ${trustVal >= 60 ? 'bg-green-500' : trustVal >= 40 ? 'bg-yellow-500' : trustVal >= 20 ? 'bg-orange-500' : 'bg-red-600'}`}
                      style={{ width: trustVal + '%' }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-6 text-right">{trustVal}</span>
                </div>
              </div>
            );
          })}</div></div>
          <div className="mb-4"><h3 className="text-xs text-gray-500 mb-2">当前副本</h3><div className="text-sm text-gray-400">{gameState.currentDungeon}</div></div>
          {/* 手动通关按钮 */}
          <button
            onClick={() => {
              const summary: DungeonSummary = {
                name: gameState.currentDungeon,
                outcome: '顺利通关',
                keyEvents: [],
                itemsGained: [],
                teammatesInvolved: gameState.teammates.map(t => t.name),
              };
              setPendingSummary(summary);
              setShowDungeonSelect(true);
            }}
            className="w-full py-2 bg-red-900/30 hover:bg-red-900/60 border border-red-500/30 text-red-400 hover:text-white text-sm rounded transition"
          >
            🏆 通关副本
          </button>
        </div>
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-scroll" style={{ flex: '1 1 auto', minHeight: 0 }}>
            {messages.length === 0 && !isLoading && (
              <div className="flex items-center justify-center h-full text-gray-600 text-sm">
                🎮 正在初始化剧情，若长时间无响应请检查API Key...
              </div>
            )}
            {messages.map((msg, i) => {
              // 判断是否是最后一条AI消息：用预提取的 cleanStory
              const isLastAI = i === messages.length - 1 && msg.role === 'assistant';
              let displayContent = msg.content;
              if (msg.role === 'assistant') {
                if (isLastAI && cleanStory) {
                  // 最后一条AI消息：直接用预处理的纯净剧情
                  displayContent = cleanStory;
                } else {
                  // 历史AI消息：截断到选项之前
                  const cut = displayContent.search(/(?:---第二部分：选项---|##\s*选项|\[A\]|^[A-D][:\.\s])/im);
                  if (cut !== -1) displayContent = displayContent.substring(0, cut);
                  displayContent = displayContent
                    .replace(/【信任度变化】[^\n]*/g, '')
                    .replace(/【弹幕】[\s\S]*/g, '')
                    .replace(/【通关】[^\n]*/g, '')
                    .replace(/^##\s+.+$/gm, '')
                    .replace(/\n{3,}/g, '\n\n')
                    .trim();
                }
              }
              return (
                <div key={i} className={'flex ' + (msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className={'max-w-[80%] rounded-lg p-3 ' + (msg.role === 'user' ? 'bg-red-900/30 text-white' : 'bg-[#1a1a2e] text-gray-200') + ' max-h-[400px] overflow-y-auto message-scroll'}>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{displayContent}</div>
                  </div>
                </div>
              );
            })}
            {isLoading && (<div className="flex justify-start"><div className="bg-[#1a1a2e] rounded-lg p-3"><div className="flex gap-1"><div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" /><div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} /><div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} /></div></div></div>)}
            <div ref={messagesEndRef} />
          </div>
          {options.length > 0 && !isLoading && (
            <div className="px-4 pb-2 max-h-[180px] overflow-y-auto options-scroll" style={{ flex: '0 0 auto' }}>
              <div className="grid grid-cols-2 gap-2">
                {options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => callAI(`选择${opt.label}: ${opt.text}`)}
                    className="p-3 bg-[#1a1a2e] hover:bg-red-900/30 active:bg-red-900/50 text-left text-sm rounded border border-red-900/20 transition-colors"
                  >
                    <span className="text-red-400 font-bold mr-1">[{opt.label}]</span>
                    <span className="text-gray-200">{opt.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="p-4 bg-[#1a1a2e] border-t border-red-900/30" style={{ flex: '0 0 auto' }}>
            <div className="flex gap-2">
              <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSend(); }} placeholder="输入你的行动..." className="flex-1 bg-[#0a0a15] border border-red-900/30 rounded px-4 py-2 text-white" disabled={isLoading} />
              <button onClick={handleSend} disabled={isLoading} className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:opacity-50">发送</button>
            </div>
          </div>
        </div>
        <div className="w-64 bg-[#12121f] border-l border-red-900/30 flex flex-col relative">
          <div className="p-2 border-b border-red-900/30 z-10 relative"><h3 className="text-xs text-gray-500 text-center">📺 弹幕</h3></div>
          <div className="flex-1 relative overflow-hidden">
            {danmaku.map((d, i) => {
              const colors = d.type === 'warning' ? 'text-yellow-300' : d.type === 'cp' ? 'text-pink-300' : d.type === 'funny' ? 'text-blue-300' : 'text-gray-300';
              const bg = d.type === 'warning' ? 'bg-yellow-900/60' : d.type === 'cp' ? 'bg-pink-900/60' : d.type === 'funny' ? 'bg-blue-900/60' : 'bg-gray-800/60';
              const delays = [0, 1.2, 2.4, 0.6, 1.8, 3.0, 0.9, 2.1];
              const tops = [6, 18, 30, 42, 54, 66, 78, 90];
              const durations = [5, 6, 5.5, 7, 6.5, 5, 6, 7.5];
              return (
                <div
                  key={`${i}-${d.text}`}
                  className={`absolute px-2 py-1 text-xs rounded whitespace-nowrap animate-danmaku ${colors} ${bg}`}
                  style={{
                    top: tops[i % tops.length] + '%',
                    animationDelay: delays[i % delays.length] + 's',
                    animationDuration: durations[i % durations.length] + 's',
                    animationIterationCount: 'infinite',
                    animationFillMode: 'both',
                    maxWidth: '90%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {d.text}
                </div>
              );
            })}
            {danmaku.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs text-gray-700">选择剧情后弹幕将飘出</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 主应用
export default function App() {
  const [phase, setPhase] = useState<'home' | 'create' | 'game'>('home');
  const [gameState, setGameState] = useState<GameState | null>(null);
  // 直接从 localStorage 读取初始值
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('apiKey') || '');
  const [apiType, setApiType] = useState<ApiType>(() => (localStorage.getItem('apiType') as ApiType) || 'deepseek');

  // 监听 localStorage 变化（用于跨标签页同步）
  useEffect(() => {
    const handleStorageChange = () => {
      const storedKey = localStorage.getItem('apiKey') || '';
      const storedType = (localStorage.getItem('apiType') as ApiType) || 'deepseek';
      setApiKey(storedKey);
      setApiType(storedType);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleSave = (state: GameState, messages: Message[]) => {
    const stateWithMessages = { ...state, messages };
    saveGame(stateWithMessages);
  };

  const handleContinue = (state: GameState) => {
    setGameState(state);
    setPhase('game');
  };

  const handleApiSettingsChange = (key: string, type: string) => {
    setApiKey(key);
    setApiType(type as ApiType);
  };

  return (
    <div className="min-h-screen bg-[#0a0a15]">
      {phase === 'home' && <HomePage onStart={() => setPhase('create')} onContinue={handleContinue} onApiSettingsChange={handleApiSettingsChange} />}
      {phase === 'create' && <CharacterCreate onComplete={(s) => { setGameState(s); setPhase('game'); }} onBack={() => setPhase('home')} />}
      {phase === 'game' && gameState && <GamePage gameState={gameState} apiKey={apiKey} apiType={apiType} onExit={() => setPhase('home')} onOpenSettings={() => {}} onSave={handleSave} onApiKeyChange={setApiKey} />}
    </div>
  );
}
