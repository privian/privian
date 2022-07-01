import cron from 'cron';
import { EventEmitter } from 'events';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { Readable } from 'stream'
import cronParser from 'cron-parser';
import type { CronJob } from 'cron';

export class FetchData {
	static readonly events = new EventEmitter();

	static readonly jobs: Map<string, CronJob> = new Map();

	static register(name: string, schedule: string, handler: () => Promise<void>, immediate: boolean = false) {
		this.jobs.set(name, new cron.CronJob(this.normalizeSchedule(schedule), handler, void 0, false, void 0, {}, immediate, 0));
	}

	static registerFetch(name: string, schedule: string, url: string, immediate: boolean = false) {
		schedule = this.normalizeSchedule(schedule);
		this.register(name, schedule, () => {
			return this.fetch(name, url);
		}, immediate);
		if (!immediate) {
			this.checkDataFreshes(name, schedule);
		}
	}

	static getFilePath(name: string) {
		return path.join(`data/${name}`);
	}

	static async checkDataFreshes(name: string, schedule: string) {
		const filePath = this.getFilePath(name);
		const interval = cronParser.parseExpression(schedule);
		try {
			const stat = await fsp.stat(filePath);
			if (stat.mtime.getTime() < interval.prev().getTime()) {
				this.jobs.get(name)?.start();
			}
		} catch {
			// noop
		}
	}

	static async get(name: string) {
		if (!this.jobs.has(name)) {
			throw new Error(`Unknown job name '${name}'.`);
		}
		const filePath = this.getFilePath(name);
		try {
			await fsp.access(filePath, fs.constants.R_OK);
		} catch {
			return null;
		}
		return fsp.readFile(filePath, 'utf-8');
	}

	static async fetch(name: string, url: string): Promise<void> {
		const resp = await fetch(url);
		if (resp.status !== 200) {
			throw new Error(`Invalid response code ${resp.status}`);
		}
		return new Promise((resolve, reject) => {
			const stream = fs.createWriteStream(this.getFilePath(name), {
				encoding: 'binary',
			});
			stream.on('close', () => {
				this.events.emit(`fetch:${name}`);
				resolve();
			});
			stream.on('error', reject);
			if (resp.body) {
				// @ts-ignore
				if (typeof resp.body.pipe === 'function') {
					// @ts-ignore
					resp.body?.pipe(stream);
				} else {
					// @ts-ignore
					this.responseToReadable(resp).pipe(stream);
				}
			}
		});
	}
	
	static normalizeSchedule(schedule: string) {
		return schedule.split(/\s+/).map((char, i) => {
			if (char === 'R') {
				// randomize values
				if (i <= 1) {
					return Math.floor(Math.random() * 60);
				} else if (i === 2) {
					return Math.floor(Math.random() * 24);
				} 
				throw new Error(`Cron random generator is supported only for seconds, minutes and hours.`);
			}
			return char;
		}).join(' ');
	}

	static responseToReadable(resp: Response) {
		const reader = resp.body!.getReader();
		const rs = new Readable();
		rs._read = async () => {
				const result = await reader.read();
				if(!result.done){
						rs.push(Buffer.from(result.value));
				}else{
						rs.push(null);
						return;
				}
		};
		return rs;
	}
}