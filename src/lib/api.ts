import { GraphQLClient } from 'graphql-request';
import { ApiError, AlreadyExistsError, NotFoundError, UnauthorizedError, ValidationError } from '$lib/api/errors';
import type { IValidationErrorField } from '$lib/api/errors';

export class Api {
	static apis: Set<any> = new Set();

	static client = new GraphQLClient(`http://127.0.0.1:4000/graphql`, { headers: {} })

	static async request<T>(query: string, variables?: Record<string, unknown>, locals?: App.Locals): Promise<T> {
		const headers: Record<string, string> = {};
		if (locals?.jwt) {
			headers.authorization = `Bearer ${locals.jwt}`;
		}
		const resp = await this.client.request(query, variables, headers).catch((err) => {
			console.log('Error', err)
			return null;
		});
		const keys = Object.keys(resp);
		// @ts-ignore
		return keys.length === 1 ? this.handleResponse<T>(resp[keys[0]]) : keys.map((key) => this.handleResponse(resp[key]));
	}

	static handleResponse<T = unknown>(response: { __typename: string, fieldErrors?: IValidationErrorField[], data?: T, message?: string }): T {
		switch (response?.__typename) {
			case 'AlreadyExistsError':
				throw new AlreadyExistsError(response.message);
			case 'NotFoundError':
				throw new NotFoundError(response.message);
			case 'UnauthorizedError':
				throw new UnauthorizedError(response.message);
			case 'ZodError':
				throw new ValidationError(response.fieldErrors!);
			default:
				if (response.data) {
					return response.data;
				}
				throw new ApiError(response.message);
		}
	}
}
