import * as mathjs from 'mathjs';
import { ImplementsStatic } from '$lib/types';
import type { ISearchQuery, ISearchResult, ISearchProvider } from '$lib/types';

@ImplementsStatic<ISearchProvider>()
export class Calculator {
	static async load() {
		return void 0;
	}

	static async suggest() {
		return void 0;
	}

	static async search(query: ISearchQuery, result: ISearchResult) {
		const hasCalc = result.items?.find((item) => item.type === 'calculator');
		if (!hasCalc) {
			if (['calc', 'calculator'].includes(query.term)) {
				result.items?.splice(0, 0, {
					title: 'Calculator',
					type: 'calculator',
					subtitle: 'Mathematical expressions and unit conversions',
				});

			} else {
				try {
					const evalResult = mathjs.evaluate(query.term);
					if (evalResult && typeof evalResult !== 'function') {
						result.items?.splice(0, 0, {
							options: {
								expression: query.term,
								result: String(evalResult),
							},
							title: 'Calculator',
							type: 'calculator',
							subtitle: 'Mathematical expressions and unit conversions',
						});
					}
				} catch {
					// noop
				}
			}
		}
	}

	static async publicMethod() {
		return void 0;
	}
}
