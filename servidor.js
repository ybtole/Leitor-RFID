const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const readline = require('readline');

// Configuração de blocos para o sorteio automático
const blocosDisponiveis = ["BLOCO 1", "BLOCO 2", "BLOCO A", "BLOCO D"];

app.use(express.static(__dirname));

// Configuração do Terminal (para simular sem RFID ou testar comandos)
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
});

// --- FUNÇÃO DE PROCESSAMENTO DE DADOS (LÓGICA CENTRAL) ---
function processarEntrada(entrada) {
    const partes = entrada.trim().split('|');
    let idBruto = partes[0].toUpperCase();
    if (!idBruto) return;
    
    let idFinal, nome, sala, bloco;
    const agora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // 1. LÓGICA DE UNIFICAÇÃO (Dois IDs, um único Card)
    if (idBruto === "A6AE75F8" || idBruto === "CBEA540C") { 
        idFinal = "PROF_MARCOS_UNICO"; // ID Único para o Front-end não duplicar o card
        nome = "PROFESSOR MARCOS";
        
        // Define o local baseado em qual cartão foi passado
        if (idBruto === "A6AE75F8") {
            sala = "Laboratório de Redes";
            bloco = "BLOCO D";
        } else {
            sala = "Sala de Reuniões";
            bloco = "BLOCO A";
        }
    }
    // 2. Entrada completa via Terminal (Formato: ID|NOME|SALA|BLOCO)
    else if (partes.length === 4) {
        [idFinal, nome, sala, bloco] = partes.map(p => p.trim().toUpperCase());
    } 
    // 3. SORTEIO: Para cartões novos/desconhecidos lidos pelo Arduino
    else {
        idFinal = idBruto;
        nome = `USUÁRIO ${idBruto.substring(0, 4)}`;
        sala = "SALA " + Math.floor(Math.random() * 500);
        bloco = blocosDisponiveis[Math.floor(Math.random() * blocosDisponiveis.length)];
    }

    const infoFinal = {
        id: idFinal,
        nome: nome,
        sala: sala,
        bloco: bloco,
        hora: agora
    };

    console.log(`[EVENTO] ${infoFinal.nome} (${idBruto}) -> ${infoFinal.bloco} às ${infoFinal.hora}`);
    
    // Envia para o navegador
    io.emit('atualizar-lista', infoFinal);
}

// --- FUNÇÃO PARA DETECTAR E CONECTAR ARDUINO ---
async function iniciarConexaoSerial() {
    try {
        const ports = await SerialPort.list();
        
        // Procura por Arduinos reais ou adaptadores USB-Serial, ignorando a COM1
        const portaArduino = ports.find(p => 
            (p.manufacturer?.includes('Arduino') || 
             p.pnpId?.includes('VID_2341') ||
             p.friendlyName?.includes('USB-SERIAL') ||
             (p.path.includes('COM') && p.path !== 'COM1'))
        );

        if (portaArduino) {
            console.log(`✅ Arduino REAL encontrado na porta: ${portaArduino.path}`);
            const port = new SerialPort({
                path: portaArduino.path,
                baudRate: 9600
            });

            const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
            
            // Quando receber dado do Arduino, processa
            parser.on('data', (data) => processarEntrada(data));
            
            port.on('error', (err) => console.log('❌ Erro na porta Serial:', err.message));
        } else {
            console.log("⚠️ Nenhum Arduino detectado (COM1 ignorada). Use o Terminal para simular.");
        }
    } catch (err) {
        console.error("❌ Erro ao listar portas:", err);
    }
}

// Escuta o Terminal
rl.on('line', (line) => processarEntrada(line));

// Inicia o Servidor
http.listen(3000, () => {
    console.log('\n--- SISTEMA DE MONITORAMENTO RFID ATIVO ---');
    console.log('Servidor rodando em: http://localhost:3000');
    console.log('Para testar manual, digite no terminal: ID ou ID|NOME|SALA|BLOCO');
    console.log('--------------------------------------------');
    iniciarConexaoSerial();
});