import { browser } from '$app/env';
import { get } from 'svelte/store';
import { createAsyncHandle } from '$lib/helpers';
import { Db } from '$lib/db';
import type { ISearchResultItem } from '$lib/types';

type TPin = ISearchResultItem<{
	order?: number;
	pin: true;
	progress?: number | null;
}>

export class Pins {
	static readonly handle = createAsyncHandle<TPin[]>(() => Db.query('pin', void 0, (a, b) => a.options?.order! < b.options?.order! ? -1 : 1), browser);

	static get data(): TPin[] {
		return get(this.handle).data;
	}

	static async create(item: ISearchResultItem) {
		const result = await Db.insert('pin', null, {
			options: {
				pin: true,
			},
			...item,
		});
		await this.handle.fetch();
		return result;
	}

	static async update(id: string, item: TPin) {
		return Db.update('pin', id, item).then(() => {
			this.handle.set(get(this.handle));
		});
	}

	static async delete(id: string) {
		return Db.delete('pin', id).then(() => {
			const data = get(this.handle);
			data.data = data.data.filter((item: TPin) => item.id !== id);
			this.handle.set(data);
		});
	}

	static async reorder(ids: string[]) {
		return Db.putMany('pin', ids.map((id, i) => {
			const item = this.data.find((item) => item.id === id);
			return [ id, {
				...item,
				options: {
					...item?.options,
					order: i,
				},
			}];
		}));
	}
}