import { NavLink } from 'react-router-dom';
import { Leaf, Scale, Layers, FileArchive, BookOpen, Scroll } from 'lucide-react';

const navItems = [
  { to: '/materials', label: '原料录入', icon: Leaf, desc: '纤维与纸药' },
  { to: '/ratio', label: '纸浆配比', icon: Scale, desc: '计算与校验' },
  { to: '/thickness', label: '抄纸厚薄', icon: Layers, desc: '帘面检测' },
  { to: '/archive', label: '工艺档案', icon: FileArchive, desc: '批次历史' },
  { to: '/recipes', label: '配方库', icon: BookOpen, desc: '方案保存' },
];

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-[240px] shrink-0 flex-col bg-gradient-to-b from-bronze-500 via-bronze-400 to-bronze-500 text-rice-50">
      <div className="bamboo-curtain border-b border-bronze-600/40 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rice-100/15 backdrop-blur">
            <Scroll className="h-5 w-5 text-rice-100" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold tracking-wide">古法抄纸</h1>
            <p className="text-[11px] text-rice-200/80">帘纹生产力系统 v1.0</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) =>
              [
                'group flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-all',
                isActive
                  ? 'bg-rice-100/20 text-white shadow-inner ring-1 ring-rice-100/25'
                  : 'text-rice-200/90 hover:bg-rice-100/10 hover:text-white',
              ].join(' ')
            }
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-rice-100/10 transition-all group-hover:bg-rice-100/20"
            >
              <it.icon className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium">{it.label}</span>
              <span className="text-[11px] text-rice-200/60">{it.desc}</span>
            </div>
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-bronze-600/40 px-5 py-4">
        <p className="font-display text-[11px] leading-relaxed text-rice-200/70">
          「片纸不易，匠造于心」
          <br />
          — 传承千年的造纸智慧
        </p>
      </div>
    </aside>
  );
}
