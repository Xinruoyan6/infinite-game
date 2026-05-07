import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// 类型定义
type Difficulty = 'easy' | 'normal' | 'hard';
type Gender = 'male' | 'female' | 'custom';
type ApiType = 'claude' | 'gemini' | 'deepseek';

interface Player { name: string; gender: Gender; }
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
function HomePage({ onStart, onContinue }: { onStart: () => void; onContinue: (state: GameState) => void }) {
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
      player: { name: displayName, gender },
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
}

function parseAIResponse(content: string): {
  cleanContent: string;
  danmaku: Danmaku[];
  trustDeltas: Record<string, number>;
  isClear: boolean;           // 是否通关
  dungeonSummary: DungeonSummary | null; // 副本摘要
} {
  let cleanContent = content;
  let danmaku: Danmaku[] = [];
  const trustDeltas: Record<string, number> = {};
  let isClear = false;
  let dungeonSummary: DungeonSummary | null = null;

  // 解析通关标记：【通关】副本名|结果|关键事件1|关键事件2|道具|涉及队友
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

  return { cleanContent, danmaku, trustDeltas, isClear, dungeonSummary };
}

// 游戏页
function GamePage({ gameState, apiKey, apiType, onExit, onOpenSettings, onSave }: {
  gameState: GameState;
  apiKey: string;
  apiType: ApiType;
  onExit: () => void;
  onOpenSettings: () => void;
  onSave: (gameState: GameState, messages: Message[]) => void;
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
    if (!apiKey) { setShowApiModal(true); return; }
    // 如果是从存档加载的，不重新生成剧情
    if (isLoadedFromSave.current && gameState.messages && gameState.messages.length > 0) {
      return;
    }
    // 自动生成第一段剧情
    const initGame = async () => {
      setIsLoading(true);
      try {
        let content = '';
        if (apiType === 'deepseek') {
          const prompt = buildPrompt(null);
          try {
            const res = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
              body: JSON.stringify({ model: 'deepseek-ai/DeepSeek-V4-Flash', messages: [{ role: 'system', content: prompt }, { role: 'user', content: '请开始游戏，生成第一段剧情和四个选项。' }], max_tokens: 2000, temperature: 0.8 }),
            });
            if (!res.ok) {
              const errText = await res.text().catch(() => '');
              throw new Error('API错误: ' + res.status + ' ' + errText.substring(0, 200));
            }
            const data = await res.json();
            content = data.choices?.[0]?.message?.content || '';
            if (!content) throw new Error('AI返回内容为空，请检查API Key是否有效');
          } catch (fetchErr: any) {
            throw fetchErr;
          }
        }
        const { cleanContent, danmaku: newDanmaku, trustDeltas } = parseAIResponse(content);
        const aiMsg: Message = { role: 'assistant', content: cleanContent, timestamp: Date.now() };
        setMessages([aiMsg]);
        setDanmaku(newDanmaku);
        // 初始化信任度变化（首次填0，但依然要解析）
        if (trustDeltas && Object.keys(trustDeltas).length > 0) {
          console.log('[DEBUG] 初始化信任度:', trustDeltas);
        }
      } catch (e: any) {
        setMessages([{ role: 'assistant', content: '❌ 错误: ' + e.message, timestamp: Date.now() }]);
      } finally {
        setIsLoading(false);
      }
    };
    initGame();
  }, [apiKey, apiType, gameState.messages]);

  const buildPrompt = (previousDungeon: DungeonSummary | null = null) => {
    const dungeon = gameState.currentDungeon || '未知副本';
    const tmList = gameState.teammates.map(t => '- ' + t.name + '：' + t.personality + '，' + t.specialty).join('\n');
    const diffDesc = gameState.difficulty === 'easy' ? '简单模式' : gameState.difficulty === 'normal' ? '中等模式' : '困难模式';
    const gender = gameState.player.gender === 'female' ? '女' : '男';
    // 信任度信息
    const trustInfo = gameState.teammates.map(t => {
      const val = localTrust[t.id] ?? 50;
      const level = val >= 80 ? '深信' : val >= 60 ? '信任' : val >= 40 ? '普通' : val >= 20 ? '警惕' : '敌意';
      return `${t.name}:${val}(${level})`;
    }).join('，');
    return '你是恐怖无限流游戏叙事者。【格式铁律，违反格式=错误回复】\n\n【基本信息】\n游戏：无限流·高三3班\n副本：' + dungeon + '\n主角：' + gameState.player.name + '（' + gender + '生）\n\n【队友】\n' + tmList + '\n\n【难度】' + diffDesc + '\n\n【当前信任度】\n' + trustInfo + '\n（信任度影响队友行为：深信会主动保护你，信任会配合行动，普通正常协作，警惕会质疑你，敌意可能背刺！）\n\n' + (previousDungeon ? '\n【★★★上一副本记忆★★★】（新副本必须与此深度关联！）\n副本名：' + previousDungeon.name + '\n通关结果：' + previousDungeon.outcome + '\n关键事件：' + (previousDungeon.keyEvents.length > 0 ? previousDungeon.keyEvents.join('；') : '无') + '\n获得道具：' + (previousDungeon.itemsGained.length > 0 ? previousDungeon.itemsGained.join('、') : '无') + '\n★新副本开头必须直接承接上述事件！可以：延续未解之谜、揭示上一副本的深层真相、使用上一副本获得的道具、解锁同一幕后黑手的下一阶段阴谋！\n' : '') + '\n【游戏规则】\n1.异界死亡=现实猝死\n2.全员可死\n3.玩家操控主角\n4.通关可获道具\n\n【★★★必须严格遵守的回复格式★★★】\n每次回复必须按顺序包含以下四部分，缺一不可：\n\n---第一部分：剧情---\n（200-400字恐怖氛围描写' + (previousDungeon ? '，开头必须承接【上一副本记忆】中的事件，制造关联和悬念' : '，营造恐怖氛围') + '，根据信任度体现队友不同态度）\n\n---第二部分：选项---\n[A]: 选项内容\n[B]: 选项内容\n[C]: 选项内容\n[D]: 选项内容\n（必须正好4个，' + (gameState.difficulty === 'easy' ? '最多1个死亡选项' : gameState.difficulty === 'normal' ? '固定1个死亡选项' : '固定2个死亡选项') + '）\n\n---第三部分：信任度变化（必须输出！）---\n格式示例：【信任度变化】顾深:+8,夏眠:-3,姜迟:+5,陆焰:0\n规则：根据玩家刚才的选择调整（范围-20到+15），第一次填0，所有队友都要写\n★注意：必须用中文全角【】，名字后跟英文半角冒号，数字前必须有+或-号（0除外）\n\n---第四部分：通关标记（可选，只有在剧情走到副本结局时才输出！）---\n如果当前剧情已经到达副本结局（玩家成功通关），在剧情末尾输出：\n【通关】副本名|通关结果|关键事件1&关键事件2|获得道具1&道具2|涉及队友1&队友2\n（通关后系统会自动进入下一副本，此标记只在真正通关时输出）\n\n---第五部分：弹幕---\n【弹幕】\nnormal: 弹幕内容\nwarning: 预警弹幕\ncp: 磕CP弹幕\nfunny: 搞笑弹幕\n（共5-8条，根据剧情内容生成，类型选normal/warning/cp/funny）';
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
    try {
      let content = '';
      if (apiType === 'deepseek') {
        const prompt = buildPrompt(clearedDungeons[clearedDungeons.length - 1] || null);
        const historyMessages = messages.map(m => ({ role: m.role, content: m.content }));
        try {
          const res = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
            body: JSON.stringify({ model: 'deepseek-ai/DeepSeek-V4-Flash', messages: [{ role: 'system', content: prompt }, ...historyMessages, { role: 'user', content: userInput }], max_tokens: 2000, temperature: 0.8 }),
          });
          if (!res.ok) throw new Error('API错误: ' + res.status + ' ' + (await res.text().catch(() => '')).substring(0, 200));
          const data = await res.json();
          content = data.choices?.[0]?.message?.content || '';
          if (!content) throw new Error('AI返回内容为空');
        } catch (fetchErr: any) {
          throw fetchErr;
        }
      }
      const { cleanContent, danmaku: newDanmaku, trustDeltas, isClear, dungeonSummary } = parseAIResponse(content);
      // DEBUG
      console.log('[DEBUG] AI原始回复末尾:', content.slice(-200));
      console.log('[DEBUG] 是否通关:', isClear, '摘要:', dungeonSummary);

      // 检查是否通关
      if (isClear && dungeonSummary) {
        const nextDungeon = getRandomDungeon();
        // 显示通关消息
        const clearMsg: Message = {
          role: 'assistant',
          content: cleanContent + '\n\n✨ 【副本通关】 ✨\n' + (dungeonSummary.keyEvents.length > 0 ? '关键事件：' + dungeonSummary.keyEvents.join('；') : '') + '\n\n正在加载下一副本：' + nextDungeon + '...',
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, clearMsg]);
        setDanmaku([{ text: '🎉 通关成功！', type: 'funny' }, { text: '下一关马上开始！', type: 'normal' }]);
        setDanmaku(newDanmaku);
        // 显示过渡动画
        setIsTransitioning(true);
        // 3秒后自动进入下一副本
        setTimeout(() => transitionToNextDungeon(dungeonSummary, nextDungeon), 3000);
        return;
      }

      const aiMsg: Message = { role: 'assistant', content: cleanContent, timestamp: Date.now() };
      setMessages(prev => [...prev, aiMsg]);
      setDanmaku(newDanmaku);

      // 更新信任度（如果AI没有输出信任度变化，用小随机值兜底）
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
      .replace(/\n{3,}/g, '\n\n')      // 压缩空行
      .trim();

    // 第3步：从原始内容提取选项（支持多种格式）
    // 先尝试匹配 "[A] 内容" 或 "A: 内容" 格式
    const optionRegex = /(?:^|\n)\s*\[?([A-D])\]?\s*[:：\.、）\)\]\s]+\s*(.+?)(?=\n\s*\[?[A-D]\][:\.\s]|\n*$)/gi;
    let m;
    while ((m = optionRegex.exec(raw)) !== null) {
      options.push({ label: m[1].toUpperCase(), text: m[2].trim() });
    }
    // 兜底：逐行扫描
    if (options.length === 0) {
      const lines = raw.split('\n');
      for (const line of lines) {
        const mm = line.match(/^\s*\[?([A-D])\]?\s*[:：\.、）\)\]\s]+(.+)$/i);
        if (mm) {
          options.push({ label: mm[1].toUpperCase(), text: mm[2].trim() });
        }
      }
    }
    // 如果选项超过4个，只保留前4个
    if (options.length > 4) options.length = 4;

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
                <button onClick={() => { localStorage.setItem('apiType', 'deepseek'); setShowApiModal(false); }} className="flex-1 py-2 rounded bg-red-600 text-white">DeepSeek</button>
                <button onClick={() => { localStorage.setItem('apiType', 'claude'); setShowApiModal(false); }} className="flex-1 py-2 rounded bg-gray-700 text-white">Claude</button>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">API Key</label>
              <input type="password" id="apiKeyInput" placeholder="sk-..." className="w-full bg-[#0a0a15] border border-red-900/30 rounded px-3 py-2 text-white" />
            </div>
            <button onClick={() => { const key = (document.getElementById('apiKeyInput') as HTMLInputElement).value; localStorage.setItem('apiKey', key); setShowApiModal(false); }} className="w-full py-2 bg-red-600 text-white rounded">保存</button>
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
      <div className="h-14 bg-[#1a1a2e] border-b border-red-900/30 flex items-center justify-between px-4">
        <button onClick={onExit} className="text-gray-400 hover:text-white">← 退出</button>
        <h1 className="text-red-500 font-bold">无限流·高三3班</h1>
        <div className="flex items-center gap-2">
          {clearedDungeons.length > 0 && (
            <span className="text-yellow-400 text-sm">🏆 ×{clearedDungeons.length}</span>
          )}
          {saveNotice && <span className="text-green-400 text-sm animate-pulse">✓ 已存档</span>}
          <button onClick={handleSave} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded">💾 存档</button>
          <button onClick={() => setShowApiModal(true)} className="w-8 h-8 bg-red-600 rounded-full text-white text-sm">⚙</button>
        </div>
      </div>
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
          <div><h3 className="text-xs text-gray-500 mb-2">当前副本</h3><div className="text-sm text-gray-400">{gameState.currentDungeon}</div></div>
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
  const [apiKey, setApiKey] = useState('');
  const [apiType, setApiType] = useState<ApiType>('deepseek');

  useEffect(() => {
    setApiKey(localStorage.getItem('apiKey') || '');
    setApiType((localStorage.getItem('apiType') as ApiType) || 'deepseek');
  }, []);

  const handleSave = (state: GameState, messages: Message[]) => {
    const stateWithMessages = { ...state, messages };
    saveGame(stateWithMessages);
  };

  const handleContinue = (state: GameState) => {
    setGameState(state);
    setPhase('game');
  };

  return (
    <div className="min-h-screen bg-[#0a0a15]">
      {phase === 'home' && <HomePage onStart={() => setPhase('create')} onContinue={handleContinue} />}
      {phase === 'create' && <CharacterCreate onComplete={(s) => { setGameState(s); setPhase('game'); }} onBack={() => setPhase('home')} />}
      {phase === 'game' && gameState && <GamePage gameState={gameState} apiKey={apiKey} apiType={apiType} onExit={() => setPhase('home')} onOpenSettings={() => {}} onSave={handleSave} />}
    </div>
  );
}
