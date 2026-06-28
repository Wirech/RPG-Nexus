import { cn } from '@/lib/utils';
import type { CharacterSkill, SkillTraining } from '../../types';

// Configurações de atributo
const attributeConfig: Record<string, { label: string; color: string; abbr: string }> = {
  forca: { label: 'Força', color: 'text-red-400', abbr: 'FOR' },
  agilidade: { label: 'Agilidade', color: 'text-green-400', abbr: 'AGI' },
  intelecto: { label: 'Intelecto', color: 'text-blue-400', abbr: 'INT' },
  presenca: { label: 'Presença', color: 'text-purple-400', abbr: 'PRE' },
  vigor: { label: 'Vigor', color: 'text-orange-400', abbr: 'VIG' },
};

// Bônus por nível de treinamento
const trainingBonus: Record<SkillTraining, number> = {
  destreinado: 0,
  treinado: 5,
  veterano: 10,
  expert: 15,
};

const trainingLabels: Record<SkillTraining, string> = {
  destreinado: 'Destreinado',
  treinado: 'Treinado',
  veterano: 'Veterano',
  expert: 'Expert',
};

const trainingColors: Record<SkillTraining, string> = {
  destreinado: 'text-zinc-500',
  treinado: 'text-green-400',
  veterano: 'text-blue-400',
  expert: 'text-purple-400',
};

interface SkillRowProps {
  skill: CharacterSkill;
  attributeValue: number;
  onEdit?: () => void;
  onRoll?: () => void;
  isAdmin?: boolean;
  compact?: boolean;
}

export function SkillRow({
  skill,
  attributeValue,
  onEdit,
  onRoll,
  isAdmin,
  compact = false,
}: SkillRowProps) {
  const attrConfig = attributeConfig[skill.attribute] || attributeConfig.intelecto;
  
  // Calcular bônus total
  const attrBonus = attributeValue;
  const trainBonus = trainingBonus[skill.training];
  const otherBonus = skill.otherBonus || 0;
  const modBonus = skill.bonusModifier || 0;
  const totalBonus = attrBonus + trainBonus + otherBonus + modBonus;

  // Formatação do bônus
  const bonusDisplay = totalBonus >= 0 ? `+${totalBonus}` : `${totalBonus}`;

  if (compact) {
    return (
      <div className="flex items-center gap-2 py-1.5 border-b border-zinc-800 last:border-0">
        <span className={cn('w-6 text-xs font-mono', attrConfig.color)}>
          {attrConfig.abbr}
        </span>
        <span className="flex-1 text-sm text-zinc-300 truncate">
          {skill.name}
          {skill.hasSpecialization && skill.specializationName && (
            <span className="text-zinc-500 text-xs ml-1">({skill.specializationName})</span>
          )}
        </span>
        <span className={cn(
          'text-sm font-mono font-medium w-10 text-right',
          totalBonus >= 10 ? 'text-green-400' : 
          totalBonus >= 5 ? 'text-yellow-400' : 
          'text-zinc-400'
        )}>
          {bonusDisplay}
        </span>
        {onRoll && (
          <button
            onClick={onRoll}
            className="p-1 text-zinc-400 hover:text-violet-400 transition-colors"
            title="Rolar"
          >
            🎲
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
      <div className="flex flex-col items-center w-10">
        <span className={cn('text-xs font-mono', attrConfig.color)}>
          {attrConfig.abbr}
        </span>
        <span className="text-xs text-zinc-500">
          +{attrBonus}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-zinc-200 truncate">
            {skill.name}
          </span>
          {!skill.isOfficial && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400">
              Custom
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className={trainingColors[skill.training]}>
            {trainingLabels[skill.training]}
            {trainBonus > 0 && ` (+${trainBonus})`}
          </span>
          {otherBonus !== 0 && (
            <>
              <span>•</span>
              <span>Outros: {otherBonus >= 0 ? `+${otherBonus}` : otherBonus}</span>
            </>
          )}
          {skill.hasSpecialization && skill.specializationName && (
            <>
              <span>•</span>
              <span className="text-yellow-400">✦ {skill.specializationName}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className={cn(
          'w-12 h-10 flex items-center justify-center rounded-lg font-mono font-bold text-lg',
          totalBonus >= 15 ? 'bg-purple-500/20 text-purple-400' :
          totalBonus >= 10 ? 'bg-green-500/20 text-green-400' : 
          totalBonus >= 5 ? 'bg-yellow-500/20 text-yellow-400' : 
          'bg-zinc-700/50 text-zinc-400'
        )}>
          {bonusDisplay}
        </div>
        
        {onRoll && (
          <button
            onClick={onRoll}
            className="p-2 text-zinc-400 hover:text-violet-400 hover:bg-violet-500/20 rounded-lg transition-colors"
            title="Rolar perícia"
          >
            🎲
          </button>
        )}

        {isAdmin && onEdit && (
          <button
            onClick={onEdit}
            className="p-2 text-zinc-400 hover:bg-zinc-700 rounded-lg transition-colors"
            title="Editar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Grupo de perícias por atributo
// ─────────────────────────────────────────

interface SkillGroupProps {
  attribute: string;
  skills: CharacterSkill[];
  attributeValue: number;
  onEditSkill?: (skill: CharacterSkill) => void;
  onRollSkill?: (skill: CharacterSkill) => void;
  isAdmin?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function SkillGroup({
  attribute,
  skills,
  attributeValue,
  onEditSkill,
  onRollSkill,
  isAdmin,
  collapsed = false,
  onToggleCollapse,
}: SkillGroupProps) {
  const attrConfig = attributeConfig[attribute] || attributeConfig.intelecto;

  return (
    <div className="rounded-lg border border-zinc-700 overflow-hidden">
      <button
        onClick={onToggleCollapse}
        className="w-full flex items-center gap-2 px-4 py-2 bg-zinc-800/80 hover:bg-zinc-800 transition-colors"
      >
        <span className={cn('font-medium', attrConfig.color)}>
          {attrConfig.label}
        </span>
        <span className="text-sm text-zinc-500">
          ({skills.length} perícias)
        </span>
        <span className="ml-auto text-zinc-400">
          {collapsed ? '▶' : '▼'}
        </span>
      </button>

      {!collapsed && (
        <div className="p-2 space-y-2">
          {skills.map((skill) => (
            <SkillRow
              key={skill.id}
              skill={skill}
              attributeValue={attributeValue}
              onEdit={onEditSkill ? () => onEditSkill(skill) : undefined}
              onRoll={onRollSkill ? () => onRollSkill(skill) : undefined}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  );
}
