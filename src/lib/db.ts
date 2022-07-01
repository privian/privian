import { createStore, entries, get, set, setMany, del, type UseStore } from 'idb-keyval';

export interface IDbRecord<T = unknown> {
	data: T;
	timestamp: number;
}

export interface IDbFlattened {
	id: string;
	timestamp: number;
}

export class Db {
	static RADIX = 32;

	static COUNTER_MAX = 999;

	static DB_NAME = 'privian-db';

	static counter: number = 0;

	static readonly stores: Map<string, UseStore> = new Map();

	static getStore(kind: string) {
		if (!this.stores.has(kind)) {
			this.stores.set(kind, createStore(this.DB_NAME, kind));
		}
		return this.stores.get(kind)!;
	}

	static generateId() {
		this.counter = (this.counter + 1) % this.COUNTER_MAX;
		return Date.now().toString(this.RADIX)
			+ (this.counter.toString(this.RADIX).padStart(String(this.COUNTER_MAX).length, '0'))
			+ Math.floor(Math.random() * 1e20).toString(this.RADIX).slice(0, 4).padStart(4, '0');
	}

	static flattenRecord<T>(id: string, record: IDbRecord<T>): T & IDbFlattened {
		return {
			id,
			timestamp: record.timestamp,
			...record.data,
		};
	}

	static async insert<T>(kind: string, id: string | null | undefined, data: T): Promise<void> {
		id = id || this.generateId();
		return set(id, {
			timestamp: Date.now(),
			data,
		} as IDbRecord, this.getStore(kind));
	}

	static async update<T>(kind: string, id: string, data: T): Promise<void> {
		const recordData = await this.find<T>(kind, id);
		if (!recordData) {
			throw new Error(`Record not found.`);
		}
		return set(id, {
			timestamp: Date.now(),
			data: {
				...recordData,
				...data,
			},
		}, this.getStore(kind));
	}

	static async putMany<T>(kind: string, items: [string, T][]): Promise<void> {
		return setMany(items.map(([ id, data ]) => {
			return [id, {
				timestamp: Date.now(),
				data,
			}];
		}), this.getStore(kind));
	}

	static async delete(kind: string, id: string): Promise<void> {
		return del(id, this.getStore(kind));
	}

	static async find<T>(kind: string, id: string): Promise<T | undefined> {
		const record = await get<IDbRecord<T>>(id, this.getStore(kind));
		return record && this.flattenRecord<T>(id, record);
	}

	static async query<T>(kind: string, filter?: (doc: T) => boolean, sort?: ((a: T, b: T) => number) | string): Promise<T[]> {
		const sortFn = typeof sort === 'string' ? ((a: any, b: any) => a[sort] < b[sort] ? -1 : 1) : sort;
		const records = await entries<string, IDbRecord<T>>(this.getStore(kind));
		return records.map(([ id, record ]) => {
			return this.flattenRecord<T>(id, record);
		}).filter((item) => {
			return !filter || filter(item);
		}).sort(sortFn);
	}
}
