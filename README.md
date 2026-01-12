# Leitor-RFID
Necessário um Arduino e um Leitor RFID.

VCC - Fornece energia ao módulo. Esta tensão pode ser de 2,5 a 3,3 volts. Você pode conectar a alimentação do módulo (VCC)  à tensão de 3,3 V do Arduino. Entretanto, ao conectar a tensão de 5V do Arduino, provavelmente irá danificar o módulo.

RST - É uma entrada para reinicializar ou desligar. Quando este pino fica em nível baixo, o módulo entra no modo de desligamento. Desta maneira o oscilador é desligado e os pinos de entrada são desconectados do mundo externo. Considerando que o módulo é redefinido na borda de subida do sinal.

GND - É o pino terra e precisa ser conectado ao pino GND do Arduino.

IRQ - É um pino de interrupção que alerta o microcontrolador quando uma tag RFID está próximo.

MISO / SCL / TX - Atua como master-in-slave-out quando a interface SPI está habilitada, como relógio serial quando a interface I2C está habilitada e como saída de dados seriais quando a interface UART está habilitada.

MOSI (Master Out Slave In) - É a entrada SPI para o módulo RC522.

SCK (Serial Clock) - Aceita os pulsos de clock fornecidos pelo mestre do barramento SPI, ou seja, o Arduino.

SS / SDA / Rx - Atua como entrada de sinal quando a interface SPI está habilitada, como dados seriais quando a interface I2C está habilitada e como entrada de dados seriais quando a interface UART está habilitada.
