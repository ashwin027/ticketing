"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotFoundError = void 0;
const custom_erorr_1 = require("./custom-erorr");
class NotFoundError extends custom_erorr_1.CustomError {
    constructor() {
        super('Route not found');
        this.statusCode = 404;
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
    serializeErrors() {
        return [{ message: 'Not Found' }];
    }
}
exports.NotFoundError = NotFoundError;
