import configModule from 'config';
import crypto from 'crypto';
import zlib from 'zlib';
import { promisify } from 'util';
import LRU from 'lru-cache';
import { createClient, commandOptions } from '@redis/client';
import type { RedisClientType } from '@redis/client';
import config from '$lib/config';
import type { PartialNested } from '$lib/types';

interface ICacheOptionsRedis {
	brotli?: boolean;
	hashKey?: boolean;
	prefixKey?: string;
	url: string;
}

interface ICacheOptionsLRU {
	max?: number;
}

interface ICacheOptions {
	redis?: ICacheOptionsRedis;
	lru?: ICacheOptionsLRU;
	ttl?: number;
}

const brotliCompress = promisify(zlib.brotliCompress);
const brotliDecompress = promisify(zlib.brotliDecompress);

export class Cache<T = unknown> {
	static defaultOptions(): ICacheOptions {
		return {
			redis: {
				brotli: config.redis?.cache?.brotli,
				hashKey: config.redis?.cache?.hashKey,
				url: config.redis.url,
			},
			lru: {
				max: 1000,
			},
		};
	}

	readonly lru?: LRU<string, T>;

	readonly options!: ICacheOptions;

	readonly redis?: RedisClientType;

	constructor(options: PartialNested<ICacheOptions> = {}) {
		this.options = configModule.util.extendDeep({}, Cache.defaultOptions(), options);
		if (this.options.redis?.url) {
			this.redis = createClient({
				url: this.options.redis.url,
			});

		} else {
			this.lru = new LRU({
				max: this.options.lru?.max || 10000,
			});
		}
	}

	async get(key: string | string[]) {
		if (this.redis) {
			if (!this.redis.isOpen) {
				await this.redis.connect();
			}
			const value = await this.redis.get(commandOptions({ returnBuffers: true }), this.getRedisKey(String(key)));
			if (this.options.redis?.brotli && value) {
				return this.deserializeValue(await brotliDecompress(value));
			}
			return this.deserializeValue(value);
		}
		return this.lru!.get(String(key));
	}

	async set(key: string | string[], value: T, ttl: number | undefined = this.options.ttl) {
		if (this.redis) {
			if (!this.redis.isOpen) {
				await this.redis.connect();
			}
			let valueStr: Buffer | string = this.serializeValue(value);
			if (this.options.redis?.brotli) {
				valueStr = await brotliCompress(valueStr);	
			}
			await this.redis.set(this.getRedisKey(String(key)), valueStr, {
				EX: ttl ? Math.floor(ttl / 1000) : void 0,
			});

		} else {
			this.lru!.set(String(key), value, {
				ttl,
			});
		}
	}

	deserializeValue(valueRaw: Buffer | string | null): T | null {
		if (valueRaw === null || valueRaw === void 0) {
			return valueRaw;
		}
		return JSON.parse(Buffer.isBuffer(valueRaw) ? valueRaw.toString() : valueRaw);
	}

	serializeValue(value: T) {
		return JSON.stringify(value);
	}

	getRedisKey(key: string) {
		if (this.options.redis?.hashKey) {
			key = crypto.createHash('sha1').update(String(key)).digest('hex');
		}
		return [this.options.redis?.prefixKey || '', key].join('');
	}
}
