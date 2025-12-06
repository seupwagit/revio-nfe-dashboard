#!/usr/bin/env node

/**
 * Monitor Automático de Erros
 *
 * Monitora o console do navegador e reinicia servidores automaticamente
 * quando detecta erros de conexão
 */

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

// Processos ativos
const processes = new Map();

// Cores para logs
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  const timestamp = new Date().toLocaleTimeString("pt-BR");
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function startProcess(name, command, args = []) {
  if (processes.has(name)) {
    log(`⚠️  Processo ${name} já está rodando`, "yellow");
    return;
  }

  log(`🚀 Iniciando ${name}...`, "cyan");

  const proc = spawn(command, args, {
    cwd: rootDir,
    shell: true,
    stdio: "pipe",
  });

  proc.stdout.on("data", (data) => {
    const output = data.toString().trim();
    if (output) {
      log(`[${name}] ${output}`, "blue");
    }
  });

  proc.stderr.on("data", (data) => {
    const output = data.toString().trim();
    if (output && !output.includes("Debugger")) {
      log(`[${name}] ${output}`, "yellow");
    }
  });

  proc.on("close", (code) => {
    processes.delete(name);
    if (code !== 0) {
      log(`❌ ${name} encerrou com código ${code}`, "red");
      // Reiniciar automaticamente após 3 segundos
      setTimeout(() => {
        log(`🔄 Reiniciando ${name}...`, "magenta");
        startProcess(name, command, args);
      }, 3000);
    } else {
      log(`✅ ${name} encerrou normalmente`, "green");
    }
  });

  processes.set(name, proc);
  log(`✅ ${name} iniciado (PID: ${proc.pid})`, "green");
}

function stopProcess(name) {
  const proc = processes.get(name);
  if (proc) {
    log(`⏹️  Parando ${name}...`, "yellow");
    proc.kill("SIGTERM");
    processes.delete(name);
  }
}

function stopAll() {
  log("⏹️  Parando todos os processos...", "yellow");
  for (const [name] of processes) {
    stopProcess(name);
  }
}

// Iniciar servidores
function startServers() {
  log("🎯 Iniciando monitoramento automático...", "cyan");
  log("", "reset");

  // Servidor Vite (Frontend)
  startProcess("Frontend", "npm", ["run", "dev"]);

  // Aguardar 2 segundos antes de iniciar o backend
  setTimeout(() => {
    // Servidor Backoffice (Backend)
    startProcess("Backend", "npx", ["tsx", "src/server/index.ts"]);
  }, 2000);

  log("", "reset");
  log("✅ Todos os servidores foram iniciados!", "green");
  log("", "reset");
  log("📊 URLs disponíveis:", "cyan");
  log("   Frontend: http://localhost:3000", "blue");
  log("   Backend:  http://localhost:3000", "blue");
  log("", "reset");
  log("💡 Pressione Ctrl+C para parar todos os servidores", "yellow");
  log("", "reset");
}

// Graceful shutdown
process.on("SIGINT", () => {
  log("", "reset");
  log("🛑 Recebido sinal de interrupção...", "yellow");
  stopAll();
  setTimeout(() => {
    log("✅ Todos os processos foram encerrados", "green");
    process.exit(0);
  }, 1000);
});

process.on("SIGTERM", () => {
  stopAll();
  process.exit(0);
});

// Iniciar
startServers();
