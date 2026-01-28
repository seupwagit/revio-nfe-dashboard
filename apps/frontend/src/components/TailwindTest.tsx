import React from 'react';

const TailwindTest: React.FC = () => {
  return (
    <div className="p-8 bg-blue-500 text-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-4">Teste do Tailwind CSS</h1>
      <p className="text-lg">Se você está vendo este texto em branco com fundo azul, o Tailwind está funcionando!</p>
      <button className="mt-4 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded transition-colors">
        Botão de Teste
      </button>
    </div>
  );
};

export default TailwindTest;