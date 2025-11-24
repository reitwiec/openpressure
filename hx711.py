import digitalio
import time

class HX711:
    def __init__(self, dout, pd_sck, gain=128):
        # Store pin references for compatibility
        self.PD_SCK = pd_sck
        self.DOUT = dout

        # Pins - CircuitPython uses digitalio
        self.sck = digitalio.DigitalInOut(self.PD_SCK)
        self.sck.direction = digitalio.Direction.OUTPUT
        self.sck.value = False

        # HX711 DOUT is open-drain; use pull-up so it idles high when not ready
        self.dout = digitalio.DigitalInOut(self.DOUT)
        self.dout.direction = digitalio.Direction.INPUT
        self.dout.pull = digitalio.Pull.UP

        # Note: CircuitPython doesn't have threading, so no mutex needed
        # Single-threaded execution model

        self.GAIN = 0  # internal gain code (1,2,3 pulses after 24 bits)
        self.REFERENCE_UNIT = 1
        self.REFERENCE_UNIT_B = 1
        self.OFFSET = 0
        self.OFFSET_B = 0
        self.lastVal = 0

        self.DEBUG_PRINTING = False
        self.byte_format = 'MSB'
        self.bit_format = 'MSB'

        self.set_gain(gain)
        time.sleep(0.2)  # settle

    # ---- Helpers ----
    def convertFromTwosComplement24bit(self, v):
        # 24-bit two's complement to signed int
        return -(v & 0x800000) + (v & 0x7FFFFF)

    def is_ready(self):
        # DOUT goes LOW when data is ready
        return not self.dout.value

    # ---- Gain/channel ----
    def set_gain(self, gain):
        if gain == 128:
            self.GAIN = 1
        elif gain == 64:
            self.GAIN = 3
        elif gain == 32:
            self.GAIN = 2
        else:
            raise ValueError("Unsupported gain: {}".format(gain))

        self.sck.value = False
        # Throw away a first read to latch the new gain/channel
        self.readRawBytes()

    def get_gain(self):
        return {1: 128, 3: 64, 2: 32}.get(self.GAIN, 0)

    # ---- Bit/Byte I/O ----
    def readNextBit(self):
        # Pulse SCK: rising edge clocks data; sample after we pull it low
        self.sck.value = True
        # Small delay for timing margin (CircuitPython: use time.sleep with fractional seconds)
        time.sleep(0.000001)  # 1 microsecond
        self.sck.value = False
        # Small delay then read
        time.sleep(0.000001)
        return int(self.dout.value)

    def readNextByte(self):
        byteValue = 0
        for _ in range(8):
            if self.bit_format == 'MSB':
                byteValue <<= 1
                byteValue |= self.readNextBit()
            else:
                byteValue >>= 1
                byteValue |= self.readNextBit() * 0x80
        return byteValue

    def readRawBytes(self):
        # CircuitPython: no threading, so no lock needed
        # Wait until data ready
        while not self.is_ready():
            # tiny wait prevents hard spinning
            time.sleep(0.00001)  # 10 microseconds

        # Read 3 data bytes
        b1 = self.readNextByte()
        b2 = self.readNextByte()
        b3 = self.readNextByte()

        # Extra clock pulses select channel/gain
        for _ in range(self.GAIN):
            self.readNextBit()

        if self.byte_format == 'LSB':
            return [b3, b2, b1]
        else:
            return [b1, b2, b3]

    # ---- Conversions & Reads ----
    def read_long(self):
        dataBytes = self.readRawBytes()

        if self.DEBUG_PRINTING:
            print(dataBytes)

        twos = (dataBytes[0] << 16) | (dataBytes[1] << 8) | dataBytes[2]

        if self.DEBUG_PRINTING:
            print("Twos: 0x%06x" % twos)

        signedVal = self.convertFromTwosComplement24bit(twos)
        self.lastVal = signedVal
        return int(signedVal)

    def read_average(self, times=3):
        if times <= 0:
            raise ValueError("times must be >= 1")
        if times == 1:
            return self.read_long()
        if times < 5:
            return self.read_median(times)

        vals = [self.read_long() for _ in range(times)]
        vals.sort()
        trim = int(len(vals) * 0.2)  # trim 20% from both ends
        if trim > 0:
            vals = vals[trim:-trim]
        return sum(vals) / len(vals)

    def read_median(self, times=3):
        if times <= 0:
            raise ValueError("times must be > 0")
        if times == 1:
            return self.read_long()

        vals = [self.read_long() for _ in range(times)]
        vals.sort()
        n = len(vals)
        mid = n // 2
        if n & 1:
            return vals[mid]
        # even -> mean of two middle values
        return (vals[mid - 1] + vals[mid]) / 2.0

    # ---- Value/Weight (A & B) ----
    def get_value(self, times=3):
        return self.get_value_A(times)

    def get_value_A(self, times=3):
        return self.read_median(times) - self.get_offset_A()

    def get_value_B(self, times=3):
        g = self.get_gain()
        self.set_gain(32)  # channel B
        value = self.read_median(times) - self.get_offset_B()
        self.set_gain(g)
        return value

    def get_weight(self, times=3):
        return self.get_weight_A(times)

    def get_weight_A(self, times=3):
        return self.get_value_A(times) / self.REFERENCE_UNIT

    def get_weight_B(self, times=3):
        return self.get_value_B(times) / self.REFERENCE_UNIT_B

    # ---- Tare (A & B) ----
    def tare(self, times=15):
        return self.tare_A(times)

    def tare_A(self, times=15):
        backup = self.get_reference_unit_A()
        self.set_reference_unit_A(1)
        value = self.read_average(times)
        if self.DEBUG_PRINTING:
            print("Tare A value:", value)
        self.set_offset_A(value)
        self.set_reference_unit_A(backup)
        return value

    def tare_B(self, times=15):
        backupRU = self.get_reference_unit_B()
        self.set_reference_unit_B(1)
        backupGain = self.get_gain()
        self.set_gain(32)
        value = self.read_average(times)
        if self.DEBUG_PRINTING:
            print("Tare B value:", value)
        self.set_offset_B(value)
        self.set_gain(backupGain)
        self.set_reference_unit_B(backupRU)
        return value

    # ---- Formats ----
    def set_reading_format(self, byte_format="LSB", bit_format="MSB"):
        if byte_format not in ("LSB", "MSB"):
            raise ValueError('Unrecognised byte_format: "%s"' % byte_format)
        if bit_format not in ("LSB", "MSB"):
            raise ValueError('Unrecognised bit_format: "%s"' % bit_format)
        self.byte_format = byte_format
        self.bit_format = bit_format

    # ---- Offsets ----
    def set_offset(self, offset):
        self.set_offset_A(offset)

    def set_offset_A(self, offset):
        self.OFFSET = int(offset)

    def set_offset_B(self, offset):
        self.OFFSET_B = int(offset)

    def get_offset(self):
        return self.get_offset_A()

    def get_offset_A(self):
        return self.OFFSET

    def get_offset_B(self):
        return self.OFFSET_B

    # ---- Reference units ----
    def set_reference_unit(self, reference_unit):
        self.set_reference_unit_A(reference_unit)

    def set_reference_unit_A(self, reference_unit):
        if reference_unit == 0:
            raise ValueError("reference unit A can't be 0")
        self.REFERENCE_UNIT = float(reference_unit)

    def set_reference_unit_B(self, reference_unit):
        if reference_unit == 0:
            raise ValueError("reference unit B can't be 0")
        self.REFERENCE_UNIT_B = float(reference_unit)

    def get_reference_unit(self):
        return self.get_reference_unit_A()

    def get_reference_unit_A(self):
        return self.REFERENCE_UNIT

    def get_reference_unit_B(self):
        return self.REFERENCE_UNIT_B

    # ---- Power control ----
    def power_down(self):
        self.sck.value = False
        self.sck.value = True
        time.sleep(0.00008)  # 80 microseconds (>=60us powers down per datasheet)

    def power_up(self):
        self.sck.value = False
        time.sleep(0.0001)  # 100 microseconds

        # After power up, default is A/128. If not requested, realign.
        if self.get_gain() != 128:
            self.readRawBytes()

    def reset(self):
        self.power_down()
        self.power_up()