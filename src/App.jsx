import MemoryCalculator from './components/MemoryCalculator';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-violet-900 text-white py-6 px-4 md:px-6">
      {/* Background glow effects */}
      <div className="fixed top-0 left-1/4 w-1/2 h-1/2 bg-blue-600 opacity-10 rounded-full blur-[100px] -z-10"></div>
      <div className="fixed bottom-0 right-1/4 w-1/2 h-1/2 bg-purple-600 opacity-10 rounded-full blur-[100px] -z-10"></div>
      
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300">
            LLM GPU Memory Calculator
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Calculate GPU memory requirements for large language models
          </p>
        </header>
        
        <MemoryCalculator />
        
        <footer className="text-center mt-10 text-xs text-gray-400 p-4">
          <p>© 2025 LLM GPU Memory Calculator | Built with React and Tailwind CSS</p>
        </footer>
      </div>
    </div>
  );
}

export default App;