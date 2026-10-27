const KEY_MAP = {
  ArrowLeft: "left", a: "left", A: "left",
  ArrowRight: "right", d: "right", D: "right",
  ArrowUp: "accelerate", w: "accelerate", W: "accelerate",
  ArrowDown: "brake", s: "brake", S: "brake",
  " ": "boost", Shift: "boost",
  e: "interact", E: "interact"
};

export class InputController {
  constructor() {
    this.active = new Set();
    this.justPressed = new Set();
    this.previous = new Set();
    this.bindKeyboard();
    this.bindTouch();
  }
  bindKeyboard() {
    window.addEventListener("keydown", (event) => {
      const action = KEY_MAP[event.key];
      if (!action) return;
      if (["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"," "].includes(event.key)) event.preventDefault();
      if (!this.active.has(action)) this.justPressed.add(action);
      this.active.add(action);
    }, { passive: false });
    window.addEventListener("keyup", (event) => {
      const action = KEY_MAP[event.key];
      if (action) this.active.delete(action);
    });
    window.addEventListener("blur", () => this.active.clear());
  }
  bindTouch() {
    document.querySelectorAll("[data-control]").forEach((button) => {
      const action = button.dataset.control;
      const down = (event) => {
        event.preventDefault();
        if (!this.active.has(action)) this.justPressed.add(action);
        this.active.add(action);
        button.classList.add("pressed");
        if (button.setPointerCapture && event.pointerId !== undefined) {
          try { button.setPointerCapture(event.pointerId); } catch {}
        }
      };
      const up = (event) => {
        event.preventDefault();
        this.active.delete(action);
        button.classList.remove("pressed");
      };
      button.addEventListener("pointerdown", down);
      ["pointerup","pointercancel","lostpointercapture","pointerleave"].forEach(type => button.addEventListener(type, up));
      button.addEventListener("contextmenu", event => event.preventDefault());
    });
  }
  isDown(action) { return this.active.has(action); }
  wasPressed(action) { return this.justPressed.has(action); }
  endFrame() { this.justPressed.clear(); }
  reset() { this.active.clear(); this.justPressed.clear(); }
}
