import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Users, Play, Plus, Minus, UserCheck, Scale, ArrowLeft } from 'lucide-react';
import { Player } from '../types';
import { CesurgLogo } from './CesurgLogo';

interface PlayerSetupProps {
  onStartGame: (players: Player[]) => void;
  onBackToLobby?: () => void;
}

const COLOR_PALETTE = [
  { label: 'Esmeralda', color: '#10B981', accent: '#059669' },
  { label: 'Safira', color: '#3B82F6', accent: '#2563EB' },
  { label: 'Rubi', color: '#EF4444', accent: '#DC2626' },
  { label: 'Ametista', color: '#8B5CF6', accent: '#7C3AED' },
  { label: 'Âmbar', color: '#F59E0B', accent: '#D97706' },
  { label: 'Ciano', color: '#06B6D4', accent: '#0891B2' },
  { label: 'Ouro', color: '#EAB308', accent: '#CA8A04' },
  { label: 'Rosa Pink', color: '#EC4899', accent: '#DB2777' },
  { label: 'Índigo', color: '#6366F1', accent: '#4F46E5' },
  { label: 'Coral', color: '#F97316', accent: '#EA580C' },
  { label: 'Verde Lima', color: '#84CC16', accent: '#65A30D' },
  { label: 'Turquesa', color: '#14B8A6', accent: '#0D9488' },
];

const AVATAR_OPTIONS = ['⚖️', '📜', '🏛️', '💼', '⭐', '🎓', '🖋️', '📖', '👔', '👑', '🎯', '🔥'];

const LEGAL_ROLES = [
  'Advogado(a) do Reclamante',
  'Advogado(a) da Empresa',
  'Magistrado(a) do Trabalho',
  'Procurador(a) do MPT',
  'Auditor(a)-Fiscal do Trabalho',
  'Pesquisador(a) / Doutrinador(a)',
  'Assessor(a) Jurídico(a) Sindical',
  'Perito(a) Judicial Trabalhista',
  'Conciliador(a) do CEJUSC',
  'Diretor(a) de Secretaria de Vara',
  'Consultor(a) de Compliance',
  'Defensor(a) Público(a) Trabalhista',
];

export const PlayerSetup: React.FC<PlayerSetupProps> = ({ onStartGame, onBackToLobby }) => {
  // Configured default to 7 players with limit up to 12
  const [numPlayers, setNumPlayers] = useState<number>(7);
  const [playersData, setPlayersData] = useState<
    Array<{
      name: string;
      color: string;
      accentColor: string;
      avatar: string;
      role: string;
    }>
  >(
    Array.from({ length: 12 }).map((_, idx) => ({
      name: `Aluno(a) ${idx + 1}`,
      color: COLOR_PALETTE[idx % COLOR_PALETTE.length].color,
      accentColor: COLOR_PALETTE[idx % COLOR_PALETTE.length].accent,
      avatar: AVATAR_OPTIONS[idx % AVATAR_OPTIONS.length],
      role: LEGAL_ROLES[idx % LEGAL_ROLES.length],
    }))
  );

  const handleNumChange = (newCount: number) => {
    if (newCount < 2 || newCount > 12) return;
    setNumPlayers(newCount);
  };

  const updatePlayer = (index: number, field: string, value: string) => {
    setPlayersData((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const readyPlayers: Player[] = playersData.slice(0, numPlayers).map((p, idx) => ({
      id: `p-${idx + 1}-${Date.now()}`,
      name: p.name.trim() || `Aluno(a) ${idx + 1}`,
      color: p.color,
      accentColor: p.accentColor,
      avatar: p.avatar,
      role: p.role,
      points: 0, // Inicia com 0 pontos conforme o manual oficial
      reputation: 50,
      position: 1, // Casa 1: Ponto de Partida
      isFinished: false,
      questionsAnsweredCount: 0,
      correctAnswersCount: 0,
      bonusCount: 0,
      achievements: ['Inscrito na Trilha'],
    }));

    onStartGame(readyPlayers);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl relative">
      {onBackToLobby && (
        <button
          type="button"
          onClick={onBackToLobby}
          className="sm:absolute top-5 left-5 mb-3 sm:mb-0 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Lobby Online</span>
        </button>
      )}

      {/* Brand Header: CESURG Logo & Disciplina/Professora */}
      <div className="text-center space-y-3 mb-6">
        {/* Logo CESURG em linha única e centralizada */}
        <div className="flex items-center justify-center">
          <CesurgLogo height={46} className="opacity-95" />
        </div>

        {/* Forma geométrica marrom com borda dourada e texto dourado - Minimalista */}
        <div>
          <div className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-1.5 rounded-full bg-[#20140D] border border-amber-400/40 text-amber-300 shadow-sm">
            <Scale className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-medium tracking-wide text-amber-300">
              Prática do Trabalho <span className="text-amber-500/50 mx-1">•</span> Prof. Ma. Giulia Signor
            </span>
          </div>
        </div>

        <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed pt-0.5">
          Gire a roleta, avance pelas etapas do contrato de trabalho, acerte as questões da CLT e da CF/88 e aproveite as casas bônus!
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Select Number of Players */}
        <div className="bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-slate-700/60 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Número de Juristas / Alunos</h3>
              <p className="text-xs text-slate-400">Turma configurada para {numPlayers} alunos (limite de até 12)</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Quick preset pills */}
            <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-700/60">
              {[2, 4, 7, 10, 12].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => handleNumChange(cnt)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    numPlayers === cnt
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {cnt}
                </button>
              ))}
            </div>

            {/* Incremental Stepper */}
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => handleNumChange(numPlayers - 1)}
                disabled={numPlayers <= 2}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <Minus className="w-4 h-4" />
              </button>

              <span className="w-8 text-center font-display font-extrabold text-lg text-amber-400">
                {numPlayers}
              </span>

              <button
                type="button"
                onClick={() => handleNumChange(numPlayers + 1)}
                disabled={numPlayers >= 12}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Players Customization Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-8 max-h-[560px] overflow-y-auto pr-1">
          {playersData.slice(0, numPlayers).map((player, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="p-3.5 sm:p-4 rounded-2xl bg-slate-800/50 border border-slate-700/70 hover:border-slate-600 transition-all space-y-2.5"
              style={{
                borderLeftWidth: '4px',
                borderLeftColor: player.color,
              }}
            >
              {/* Header info */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Aluno(a) #{idx + 1}
                </span>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm shadow-md"
                  style={{ backgroundColor: player.color }}
                >
                  {player.avatar}
                </div>
              </div>

              {/* Name input */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Nome do Aluno(a)
                </label>
                <input
                  type="text"
                  id={`input-player-name-${idx}`}
                  value={player.name}
                  onChange={(e) => updatePlayer(idx, 'name', e.target.value)}
                  maxLength={22}
                  className="w-full px-3 py-1.5 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-400 font-medium"
                  placeholder={`Aluno(a) ${idx + 1}`}
                />
              </div>

              {/* Avatar Selection */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Ícone Jurídico
                </label>
                <div className="flex flex-wrap gap-1">
                  {AVATAR_OPTIONS.slice(0, Math.max(7, numPlayers)).map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => updatePlayer(idx, 'avatar', icon)}
                      className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-transform ${
                        player.avatar === icon
                          ? 'bg-slate-700 border border-amber-400 scale-110 shadow-sm'
                          : 'bg-slate-900/60 hover:bg-slate-700/60 border border-transparent'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Palette */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Cor do Peão
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {COLOR_PALETTE.map((pal) => (
                    <button
                      key={pal.color}
                      type="button"
                      onClick={() => {
                        updatePlayer(idx, 'color', pal.color);
                        updatePlayer(idx, 'accentColor', pal.accent);
                      }}
                      title={pal.label}
                      className={`w-4 h-4 rounded-full transition-transform ${
                        player.color === pal.color
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-125'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: pal.color }}
                    />
                  ))}
                </div>
              </div>

              {/* Legal Role */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Perfil de Atuação
                </label>
                <select
                  id={`select-player-role-${idx}`}
                  value={player.role}
                  onChange={(e) => updatePlayer(idx, 'role', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-amber-400"
                >
                  {LEGAL_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Start Match CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Configuração pronta para {numPlayers} alunos.</span>
          </div>

          <button
            type="submit"
            id="btn-start-game"
            className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-display font-extrabold text-base shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>Iniciar Partida com {numPlayers} Alunos</span>
          </button>
        </div>
      </form>
    </div>
  );
};
