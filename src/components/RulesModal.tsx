import React from 'react';
import { X, BookOpen, Compass, Dices, Sparkles, Scale, Trophy } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 sm:p-6 text-slate-100 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold font-display text-white">
              Manual Oficial: Prática do Trabalho
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs sm:text-sm text-slate-300">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
            <Compass className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-white mb-1">1. Tabuleiro de 35 Casas (1 a 35)</h4>
              <p className="text-slate-400 leading-relaxed">
                • <strong>Casa 1:</strong> Ponto de Partida (0 pontos).<br />
                • <strong>6 Casas Bônus:</strong> Casas 5, 10, 15, 20, 25 e 30.<br />
                • <strong>27 Casas de Perguntas:</strong> Casas 2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14, 16, 17, 18, 19, 21, 22, 23, 24, 26, 27, 28, 29, 31, 32, 33 e 34.<br />
                • <strong>Casa 35:</strong> Linha de Chegada com Superpergunta.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-white mb-1">2. 5 Perguntas por Casa (Sem Repetição!)</h4>
              <p className="text-slate-400 leading-relaxed">
                Cada uma das 27 casas possui <strong>5 Cartas de Perguntas (Cartas A, B, C, D e E)</strong>. Quando participantes caem na mesma casa, cartas diferentes são sacadas automaticamente para evitar repetição de questões entre os colegas!
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-white mb-1">3. 6 Casas Bônus (Benefício Direto)</h4>
              <p className="text-slate-400 leading-relaxed">
                Ao cair nas casas <strong>5, 10, 15, 20, 25 ou 30</strong>, o jogador escolhe seu benefício: <strong>+15 Pontos Imediatos</strong> na contagem geral ou <strong>Avançar 2 Casas na Trilha</strong>!
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
            <Trophy className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-white mb-1">4. Linha de Chegada: 7 Superperguntas (100 Pts)</h4>
              <p className="text-slate-400 leading-relaxed">
                Ao alcançar a <strong>Casa 35</strong>, o participante responde à <strong>Superpergunta de Chegada (100 Pontos)</strong>. O jogo contém 7 Superperguntas exclusivas, garantindo uma pergunta final inédita para até 7 jogadores!
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
            <Dices className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-white mb-1">5. Vitória e Classificação da Turma</h4>
              <p className="text-slate-400 leading-relaxed">
                O grande vencedor é definido pela <strong>maior pontuação total acumulada</strong> por acertos nas questões, benefícios das casas bônus e o acerto da superpergunta de chegada!
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer"
          >
            Entendido, Vamos Jogar!
          </button>
        </div>
      </div>
    </div>
  );
};
