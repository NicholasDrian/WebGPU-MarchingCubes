

class Node<T> {
	constructor(
		public item: T
	) {}
		
	public next: Node<T> | undefined;
}

export class Queue<T> {

	private head: Node<T> | undefined;
	private tail: Node<T> | undefined;

	constructor() {
	}

	public empty(): boolean {
		return this.head === undefined; 
	}

	public pop(): T {
		const result: T = this.head!.item;
		if (this.head === this.tail) {
			this.head = undefined;
			this.tail = undefined;
		} else {
			this.head = this.head!.next;
		}
		return result;
	}

	public push(item: T): void {
		const node: Node<T> = new Node<T>(item);
		if (this.head === undefined) {
			this.head = node;
			this.tail = node;
		} else {
			this.tail!.next = node;
			this.tail = node;
		}
	}

}
