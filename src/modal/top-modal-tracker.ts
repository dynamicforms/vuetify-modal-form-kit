import { computed, ComputedRef, ref } from 'vue';

class DialogTracker {
  private stack: symbol[] = [];

  public currentRef = ref<symbol | null>(null);

  push(sym: symbol): void {
    this.stack.push(sym);
    this.currentRef.value = sym;
  }

  isTop(sym: symbol): ComputedRef<boolean> {
    return computed(() => this.currentRef.value === sym);
  }

  remove(sym: symbol): void {
    const index = this.stack.indexOf(sym);
    if (index !== -1) {
      this.stack.splice(index, 1);
      this.currentRef.value = this.stack[this.stack.length - 1] || null;
    }
  }
}

const dialogTracker = new DialogTracker();

export default dialogTracker;
