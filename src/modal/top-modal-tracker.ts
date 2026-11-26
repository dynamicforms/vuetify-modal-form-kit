import { computed, ComputedRef, ref, shallowReactive } from 'vue';

class DialogTracker {
  // reactive: a read of `size` is tracked
  private readonly stack = shallowReactive<symbol[]>([]);

  public currentRef = ref<symbol | null>(null);

  push(sym: symbol): void {
    this.stack.push(sym);
    this.currentRef.value = sym;
  }

  /** The number of dialogs on the stack. */
  get size(): number {
    return this.stack.length;
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
