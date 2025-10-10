from machine import Pin
import time, sys, math
from hx711 import HX711

# ------------------ Hardware / HX711 ------------------
DT_PIN = 5
SCK_PIN = 6
GAIN = 128
REFERENCE_UNIT = 6504   # placeholder; long-press recalculates

BTN_PIN = 16
DEBOUNCE_MS = 40
LONGPRESS_MS = 700

# ------------------ Wire geometry ------------------
WIRE_DIAMETER_MM = 0.7  # round wire Ø (mm)

# ------------------ Calibration mass (grams) ------------------
CAL_MASS_G = 41.0

# ------------------ Internal state ------------------
_capture_requested = False
_last_irq_ms = 0
_pressed_since = None
_in_calib = False
_calib_step = 0
_calib_pre = None

def wire_area_mm2(d_mm):
    r = d_mm * 0.5
    return math.pi * r * r

def _button_irq(pin):
    global _capture_requested, _last_irq_ms, _pressed_since
    now = time.ticks_ms()
    if time.ticks_diff(now, _last_irq_ms) > DEBOUNCE_MS:
        _capture_requested = True
        _last_irq_ms = now
        if _pressed_since is None:
            _pressed_since = now

def snapshot_weight_g(hx, n=12, inter_ms=4):
    vals = []
    for _ in range(n):
        vals.append(hx.get_weight(1))
        time.sleep_ms(inter_ms)
    vals.sort()
    if len(vals) >= 5:
        vals = vals[1:-1]
    return sum(vals) / len(vals)

def snapshot_counts(hx, n=16, inter_ms=4):
    vals = []
    for _ in range(n):
        vals.append(hx.get_value(1))
        time.sleep_ms(inter_ms)
    vals.sort()
    if len(vals) >= 5:
        vals = vals[1:-1]
    return sum(vals) / len(vals)

def clean_and_exit():
    print("Bye!")
    sys.exit()

def main():
    global _capture_requested, _pressed_since, _in_calib, _calib_step, _calib_pre, REFERENCE_UNIT

    area = wire_area_mm2(WIRE_DIAMETER_MM)
    if area <= 0:
        print("Invalid wire diameter/area.")
        sys.exit()

    hx = HX711(dout=DT_PIN, pd_sck=SCK_PIN, gain=GAIN)
    time.sleep_ms(200)
    hx.set_reference_unit(REFERENCE_UNIT)

    print("Taring... remove any load.")
    hx.tare(20)
    print("Tare done.\n")

    btn = Pin(BTN_PIN, Pin.IN, Pin.PULL_UP)
    btn.irq(trigger=Pin.IRQ_FALLING, handler=_button_irq)

    print(f"Wire area: {area:.4f} mm²")
    print("Controls: short press = snapshot   |   long press (≥0.7s) = CALIBRATION\n")

    try:
        while True:
            now = time.ticks_ms()
            if _pressed_since is not None:
                if btn.value() == 0 and time.ticks_diff(now, _pressed_since) >= LONGPRESS_MS and not _in_calib:
                    _capture_requested = False
                    _pressed_since = None
                    _in_calib = True
                    _calib_step = 0
                    _calib_pre = None

                    print("\n=== CALIBRATION ===")
                    print("Step 1/3: Removing load and taring...")
                    hx.set_reference_unit(1)
                    hx.tare(25)
                    print("Tare done.")
                    print("Step 2/3: Ensure NO LOAD is on the cell, then press the button.")
                elif btn.value() == 1:
                    _pressed_since = None

            if _capture_requested:
                _capture_requested = False
                if _in_calib:
                    if _calib_step == 0:
                        _calib_pre = snapshot_counts(hx)
                        print(f"Captured zero-load counts: {_calib_pre:.0f}")
                        print(f"Step 3/3: Place {CAL_MASS_G:.3f} g on the cell, then press the button.")
                        _calib_step = 1
                    elif _calib_step == 1:
                        post = snapshot_counts(hx)
                        delta = abs(post - _calib_pre)
                        if CAL_MASS_G > 0:
                            ru = delta / CAL_MASS_G
                            REFERENCE_UNIT = ru
                            hx.set_reference_unit(REFERENCE_UNIT)
                            print(f"Captured loaded counts: {post:.0f}")
                            print(f"Δ counts: {delta:.0f}")
                            print(f"NEW REFERENCE_UNIT: {REFERENCE_UNIT:.2f} counts/g")
                            g_check = snapshot_weight_g(hx, n=8)
                            print(f"Verification reading: {g_check:.2f} g")
                        print("Calibration complete.\n")
                        _in_calib = False
                        _calib_step = 0
                        _calib_pre = None
                else:
                    snap_g = abs(snapshot_weight_g(hx))
                    snap_stress = snap_g / area
                    print(f">>> SNAPSHOT: {snap_g:.2f} g, {snap_stress:.3f} g/mm²")

            time.sleep_ms(30)

    except KeyboardInterrupt:
        clean_and_exit()

if __name__ == "__main__":
    main()
