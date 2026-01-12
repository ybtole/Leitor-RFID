Arduino Mega 2560:
SDA - 53 / SCK - 52 / MOSI - 51 / MISO - 50 / GND - GND / RST - 5 / 3.3V - 3.3V

RC522	UNO / Nano:
SDA -	10 / SCK - 13 / MOSI- 11 / MISO - 12 / RST -	9 / 3.3V - 3.3V / GND - GND

RC522	Leonardo / Micro:
SDA -	10 / SCK	- 15 / MOSI - 16 / MISO - 14 / RST	- 9 / 3.3V - 3.3V / GND	- GND

# Leitor-RFID 🇧🇷
Necessário um Arduino e um Leitor RFID. Instalar NodeJS, CH340G caso necessário (Arduino Mega 2560) e library do MFRC522.

VCC - Fornece energia ao módulo. Esta tensão pode ser de 2,5 a 3,3 volts. Você pode conectar a alimentação do módulo (VCC)  à tensão de 3,3 V do Arduino. Entretanto, ao conectar a tensão de 5V do Arduino, provavelmente irá danificar o módulo.

RST - É uma entrada para reinicializar ou desligar. Quando este pino fica em nível baixo, o módulo entra no modo de desligamento. Desta maneira o oscilador é desligado e os pinos de entrada são desconectados do mundo externo. Considerando que o módulo é redefinido na borda de subida do sinal.

GND - É o pino terra e precisa ser conectado ao pino GND do Arduino.

IRQ - É um pino de interrupção que alerta o microcontrolador quando uma tag RFID está próximo.

MISO / SCL / TX - Atua como master-in-slave-out quando a interface SPI está habilitada, como relógio serial quando a interface I2C está habilitada e como saída de dados seriais quando a interface UART está habilitada.

MOSI (Master Out Slave In) - É a entrada SPI para o módulo RC522.

SCK (Serial Clock) - Aceita os pulsos de clock fornecidos pelo mestre do barramento SPI, ou seja, o Arduino.

SS / SDA / Rx - Atua como entrada de sinal quando a interface SPI está habilitada, como dados seriais quando a interface I2C está habilitada e como entrada de dados seriais quando a interface UART está habilitada.

Claro — tradução direta, sem enrolar:

---

# RFID Reader 🇺🇸

An Arduino and an RFID Reader are required. Download NodeJS, CH340G driver if needed (Arduino Mega 2560) and MFRC522 library.

**VCC** — Supplies power to the module. This voltage can be from 2.5 to 3.3 volts. You can connect the module’s power (VCC) to the Arduino’s 3.3 V pin. However, if you connect it to the Arduino’s 5 V pin, you will likely damage the module.

**RST** — This is a reset or power-down input. When this pin is held low, the module enters power-down mode. In this state the oscillator is turned off and the input pins are disconnected from the outside world. The module is reset on the rising edge of the signal.

**GND** — This is the ground pin and must be connected to the Arduino’s GND pin.

**IRQ** — This is an interrupt pin that notifies the microcontroller when an RFID tag is nearby.

**MISO / SCL / TX** — Acts as master-in-slave-out when the SPI interface is enabled, as a serial clock when the I²C interface is enabled, and as a serial data output when the UART interface is enabled.

**MOSI (Master Out Slave In)** — This is the SPI input to the RC522 module.

**SCK (Serial Clock)** — Receives the clock pulses provided by the SPI bus master, i.e., the Arduino.

**SS / SDA / Rx** — Acts as a signal input when the SPI interface is enabled, as serial data when the I²C interface is enabled, and as a serial data input when the UART interface is enabled.
