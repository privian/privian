import config from 'config';
import type { IConfig } from '$lib/types';

export default config.util.cloneDeep(config) as IConfig;
