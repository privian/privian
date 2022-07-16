export interface IValidationErrorField {
	message: string;
	path: string;
}

export class BaseError extends Error {
	status: number = 500;

	constructor(message = 'Not found') {
		super(message);
		this.name = 'NotFoundError';
	}
}

export class AlreadyExistsError extends BaseError {
	constructor(message = 'Entity already exists') {
		super(message);
		this.name = 'AlreadyExistsError';
		this.status = 400;
	}
}

export class BadRequestError extends BaseError {
	constructor(message = 'Bad request') {
		super(message);
		this.name = 'BadRequestError';
		this.status = 400;
	}
}

export class NotFoundError extends BaseError {
	constructor(message = 'Not found') {
		super(message);
		this.name = 'NotFoundError';
		this.status = 404;
	}
}

export class UnauthorizedError extends BaseError {
	constructor(message = 'Unauthorized') {
		super(message);
		this.name = 'UnauthorizedError';
		this.status = 401;
	}
}

export class ValidationError extends BaseError {
	constructor(readonly details: IValidationErrorField[]) {
		super(`Validation error`);
		this.name = 'ValidationError';
		this.status = 400;
	}
}

export class ApiError extends BaseError {
	constructor(message = 'Unexpected API error', readonly details: any = null) {
		super(message);
		this.name = 'ApiError';
		this.status = 500;
	}
}